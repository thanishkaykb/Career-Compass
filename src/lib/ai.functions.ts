import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(messages: Array<{ role: string; content: string }>, opts: { json?: boolean } = {}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured. Add LOVABLE_API_KEY.");
  const body: Record<string, unknown> = { model: MODEL, messages };
  if (opts.json) body.response_format = { type: "json_object" };
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached. Please wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace.");
    throw new Error(`AI error (${res.status}): ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content as string ?? "";
}

// LLMs sometimes wrap JSON in markdown fences or add stray text — extract robustly.
function parseAIJson(raw: string): unknown {
  let txt = raw.trim();
  const fence = txt.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) txt = fence[1].trim();
  const start = txt.indexOf("{");
  const end = txt.lastIndexOf("}");
  if (start !== -1 && end > start) txt = txt.slice(start, end + 1);
  try {
    return JSON.parse(txt);
  } catch {
    // Remove trailing commas and retry
    try { return JSON.parse(txt.replace(/,\s*([}\]])/g, "$1")); }
    catch { throw new Error("AI returned an unreadable response. Please try again."); }
  }
}

async function fetchGitHubProfile(url: string) {
  const m = url.match(/github\.com\/([^\/\?#]+)/i);
  if (!m) return null;
  const username = m[1];
  try {
    const headers = { "User-Agent": "career-compass", Accept: "application/vnd.github+json" };
    const u = await fetch(`https://api.github.com/users/${username}`, { headers }).then((r) => (r.ok ? r.json() : null));
    if (!u) return null;

    // Fetch ALL public repos (paginated, up to 300)
    const allRepos: Array<Record<string, unknown>> = [];
    for (let page = 1; page <= 3; page++) {
      const batch = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=pushed`, { headers })
        .then((r) => (r.ok ? r.json() : []));
      if (!Array.isArray(batch) || batch.length === 0) break;
      allRepos.push(...batch);
      if (batch.length < 100) break;
    }

    const skippedForks = allRepos.filter((x) => Boolean(x.fork)).length;

    // Prefer original (non-fork) repos, sorted by stars then recency
    const repos = allRepos
      .filter((x) => !x.fork)
      .sort((a, b) => ((b.stargazers_count as number) || 0) - ((a.stargazers_count as number) || 0))
      .slice(0, 30)
      .map((x) => ({
        name: x.name,
        description: x.description,
        language: x.language,
        topics: x.topics,
        stars: x.stargazers_count,
        url: x.html_url,
        homepage: x.homepage,
        updated: x.pushed_at,
      }));

    return {
      username,
      name: u.name,
      bio: u.bio,
      location: u.location,
      company: u.company,
      blog: u.blog,
      followers: u.followers,
      public_repos: u.public_repos,
      avatar_url: u.avatar_url,
      repo_count: allRepos.length,
      skipped_forks: skippedForks,
      repos,
    };
  } catch { return null; }
}

const GitHubPreviewInput = z.object({
  githubUrl: z.string().max(300),
});

export const previewGitHubRepos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GitHubPreviewInput.parse(d))
  .handler(async ({ data }) => {
    const github = await fetchGitHubProfile(data.githubUrl);
    if (!github) {
      return {
        found: false,
        repoCount: 0,
        skippedForks: 0,
        chosenRepos: [],
      };
    }

    return {
      found: true,
      username: github.username,
      repoCount: github.repo_count ?? github.public_repos ?? github.repos.length,
      skippedForks: github.skipped_forks ?? 0,
      chosenRepos: github.repos.slice(0, 6).map((repo) => ({
        name: String(repo.name ?? ""),
        description: typeof repo.description === "string" ? repo.description : "",
        language: typeof repo.language === "string" ? repo.language : "",
        stars: typeof repo.stars === "number" ? repo.stars : 0,
        url: typeof repo.url === "string" ? repo.url : "",
      })),
    };
  });

const ResumeInput = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().default(""),
  location: z.string().max(120).optional().default(""),
  targetRole: z.string().max(120).optional().default(""),
  summary: z.string().max(2000).optional().default(""),
  education: z.string().max(3000).optional().default(""),
  experience: z.string().max(5000).optional().default(""),
  skills: z.string().max(2000).optional().default(""),
  projects: z.string().max(3000).optional().default(""),
  certifications: z.string().max(2000).optional().default(""),
  githubUrl: z.string().max(300).optional().default(""),
  linkedinUrl: z.string().max(300).optional().default(""),
  portfolioUrl: z.string().max(300).optional().default(""),
});

export const generateResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResumeInput.parse(d))
  .handler(async ({ data, context }) => {
    let gh: Awaited<ReturnType<typeof fetchGitHubProfile>> = null;
    if (data.githubUrl) gh = await fetchGitHubProfile(data.githubUrl);

    const system = `You are an expert resume writer. Generate a complete, ATS-friendly resume in strict JSON. Never fabricate companies, employment dates, or degrees. However, you MUST make the most of everything provided: expand terse notes into polished, achievement-oriented content; turn GitHub repos into rich project entries (name, description, tech stack, URL); derive skills from listed skills, projects, and repo languages; always write a strong 3-4 sentence professional summary from whatever is available. The resume must never come back empty — every section the user gave ANY information for must be fully written out.`;

    const userPrompt = `Build a resume for this person targeting: ${data.targetRole || "any suitable role"}.

USER INPUT (may be terse — expand and polish it):
${JSON.stringify({ ...data, github: gh ?? undefined }, null, 2)}

Return ONLY this JSON shape (fill every field you have ANY basis for; copy fullName/email/phone/location/links verbatim from input):
{
  "fullName": "", "headline": "concise title based on target role/skills", "email": "", "phone": "", "location": "",
  "links": { "github": "", "linkedin": "", "portfolio": "" },
  "summary": "3-4 sentence professional summary",
  "skills": ["8-15 skills from input + GitHub repo languages"],
  "experience": [{ "title": "", "company": "", "location": "", "startDate": "", "endDate": "", "bullets": ["2-4 impactful bullets"] }],
  "education": [{ "degree": "", "school": "", "location": "", "startDate": "", "endDate": "", "details": "" }],
  "projects": [{ "name": "", "description": "1-2 sentences", "tech": ["..."], "url": "" }],
  "certifications": ["..."]
}
IMPORTANT: The "github.repos" array above contains the person's REAL GitHub repositories. You MUST convert the best 4-6 of them into project entries (use repo name, description, language/topics as tech, and the repo URL). Also include any projects the user typed manually. Never leave "projects" empty if any repos were provided.
Keep total content within two printed pages. Polish wording but never invent employers, dates, or degrees.`;

    const raw = await callAI([{ role: "system", content: system }, { role: "user", content: userPrompt }], { json: true });
    const resume = parseAIJson(raw) as Record<string, unknown>;
    // Guarantee the basics are never blank even if the model omits them
    resume.fullName = resume.fullName || data.fullName;
    resume.email = resume.email || data.email;
    if (!resume.links) resume.links = { github: data.githubUrl, linkedin: data.linkedinUrl, portfolio: data.portfolioUrl };

    const { data: saved, error } = await context.supabase
      .from("resumes")
      .insert({ user_id: context.userId, title: `${data.fullName} — ${data.targetRole || "Resume"}`, content: resume as never })
      .select().single();
    if (error) throw new Error(error.message);
    return { resume: JSON.stringify(resume), id: saved.id as string };
  });

const AnalyzeInput = z.object({
  resumeText: z.string().min(50, "Your resume text is too short — please upload a resume with more content.").max(20000),
  jobTitle: z.string().min(1, "Please enter the job title.").max(200),
  jobDescription: z.string().min(20, "Please paste a longer job description (at least 20 characters).").max(10000),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const r = AnalyzeInput.safeParse(d);
    if (!r.success) throw new Error(r.error.issues[0]?.message ?? "Invalid input.");
    return r.data;
  })
  .handler(async ({ data }) => {
    const system = `You are a senior recruiter and career coach. Analyze how well a candidate's resume matches a target job. Be honest and specific. Output strict JSON.`;
    const prompt = `TARGET JOB:
Title: ${data.jobTitle}
Description: ${data.jobDescription}

CANDIDATE RESUME:
${data.resumeText}

Return ONLY this JSON:
{
  "eligibility": { "verdict": "Strong fit" | "Possible fit" | "Not eligible", "score": 0-100, "reasoning": "2-3 sentences" },
  "matchedSkills": ["skills present in both resume and JD"],
  "missingSkills": ["important JD skills missing from resume"],
  "strengths": ["3-5 specific strengths"],
  "weaknesses": ["3-5 honest weaknesses"],
  "resumeChanges": [
    { "section": "Summary|Skills|Experience|...", "current": "what's there now (or 'missing')", "suggested": "specific rewrite", "why": "why this helps" }
  ],
  "overallFeedback": "paragraph of overall guidance"
}`;
    const raw = await callAI([{ role: "system", content: system }, { role: "user", content: prompt }], { json: true });
    return parseAIJson(raw) as {
      eligibility: { verdict: string; score: number; reasoning: string };
      matchedSkills: string[];
      missingSkills: string[];
      strengths: string[];
      weaknesses: string[];
      resumeChanges: Array<{ section: string; current: string; suggested: string; why: string }>;
      overallFeedback: string;
    };
  });
