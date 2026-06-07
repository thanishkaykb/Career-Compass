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

async function fetchGitHubProfile(url: string) {
  const m = url.match(/github\.com\/([^\/\?#]+)/i);
  if (!m) return null;
  const username = m[1];
  try {
    const [u, r] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`).then((r) => (r.ok ? r.json() : [])),
    ]);
    if (!u) return null;
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
      repos: (r as Array<Record<string, unknown>>).map((x) => ({
        name: x.name, description: x.description, language: x.language, stars: x.stargazers_count, url: x.html_url,
      })),
    };
  } catch { return null; }
}

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

    const system = `You are an expert resume writer. Generate a clean, ATS-friendly resume in strict JSON. Only use information provided. Do NOT fabricate companies, dates, or accomplishments. If a field is missing, leave it empty rather than inventing content.`;

    const userPrompt = `Build a resume for this person targeting: ${data.targetRole || "any suitable role"}.

USER INPUT:
${JSON.stringify({ ...data, github: gh ?? undefined }, null, 2)}

Return ONLY this JSON shape:
{
  "fullName": "", "headline": "", "email": "", "phone": "", "location": "",
  "links": { "github": "", "linkedin": "", "portfolio": "" },
  "summary": "3-4 sentence professional summary based ONLY on supplied info",
  "skills": ["..."],
  "experience": [{ "title": "", "company": "", "location": "", "startDate": "", "endDate": "", "bullets": ["..."] }],
  "education": [{ "degree": "", "school": "", "location": "", "startDate": "", "endDate": "", "details": "" }],
  "projects": [{ "name": "", "description": "", "tech": ["..."], "url": "" }],
  "certifications": ["..."]
}
Polish wording into impactful, achievement-oriented bullets but never invent data.`;

    const raw = await callAI([{ role: "system", content: system }, { role: "user", content: userPrompt }], { json: true });
    let resume: Record<string, unknown>;
    try { resume = JSON.parse(raw); } catch { throw new Error("AI returned invalid JSON. Try again."); }

    const { data: saved, error } = await context.supabase
      .from("resumes")
      .insert({ user_id: context.userId, title: `${data.fullName} — ${data.targetRole || "Resume"}`, content: resume })
      .select().single();
    if (error) throw new Error(error.message);
    return { resume, id: saved.id };
  });

const AnalyzeInput = z.object({
  resumeText: z.string().min(50).max(20000),
  jobTitle: z.string().min(1).max(200),
  jobDescription: z.string().min(20).max(10000),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnalyzeInput.parse(d))
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
    try { return JSON.parse(raw); } catch { throw new Error("AI returned invalid JSON. Try again."); }
  });
