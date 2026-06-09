import React from "react";
import { Download } from "lucide-react";

export type ResumeData = {
  fullName: string;
  headline?: string;
  email: string;
  phone?: string;
  location?: string;
  links?: { github?: string; linkedin?: string; portfolio?: string };
  summary?: string;
  skills?: string[];
  experience?: Array<{ title?: string; company?: string; location?: string; startDate?: string; endDate?: string; bullets?: string[] }>;
  education?: Array<{ degree?: string; school?: string; location?: string; startDate?: string; endDate?: string; details?: string }>;
  projects?: Array<{ name?: string; description?: string; tech?: string[]; url?: string }>;
  certifications?: string[];
};

interface TemplateProps {
  data: ResumeData;
}

export const ModernTemplate: React.FC<TemplateProps> = ({ data }) => (
  <div className="bg-white text-slate-900 p-8 shadow-sm font-sans max-w-[21cm] mx-auto min-h-[29.7cm]">
    <div className="border-b-2 border-primary pb-6 mb-6">
      <h1 className="text-4xl font-extrabold tracking-tight uppercase">{data.fullName}</h1>
      {data.headline && <p className="text-xl text-primary font-medium mt-1">{data.headline}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-slate-600">
        {data.email && <span>{data.email}</span>}
        {data.phone && <span>• {data.phone}</span>}
        {data.location && <span>• {data.location}</span>}
      </div>
    </div>

    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 space-y-6">
        {data.summary && (
          <section>
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-b mb-2">Profile</h2>
            <p className="text-sm leading-relaxed">{data.summary}</p>
          </section>
        )}

        {data.experience && data.experience.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-b mb-3">Experience</h2>
            <div className="space-y-4">
              {data.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-base">{exp.title}</h3>
                    <span className="text-xs font-medium text-slate-500">{exp.startDate} — {exp.endDate}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{exp.company}</p>
                  <ul className="list-disc ml-4 mt-2 text-sm space-y-1">
                    {exp.bullets?.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="space-y-6">
        {data.skills && data.skills.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-b mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((s, i) => (
                <span key={i} className="text-xs bg-slate-100 px-2 py-1 rounded">{s}</span>
              ))}
            </div>
          </section>
        )}

        {data.education && data.education.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-b mb-3">Education</h2>
            <div className="space-y-3">
              {data.education.map((edu, i) => (
                <div key={i}>
                  <p className="text-sm font-bold">{edu.degree}</p>
                  <p className="text-xs text-slate-600">{edu.school}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{edu.startDate} — {edu.endDate}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  </div>
);

export const ProfessionalTemplate: React.FC<TemplateProps> = ({ data }) => (
  <div className="bg-white text-slate-900 p-10 shadow-sm font-serif max-w-[21cm] mx-auto min-h-[29.7cm]">
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold uppercase tracking-wide">{data.fullName}</h1>
      <div className="flex justify-center gap-3 text-sm mt-2 italic text-slate-600">
        {data.email} {data.phone && <span>| {data.phone}</span>} {data.location && <span>| {data.location}</span>}
      </div>
      {data.links && (
        <div className="flex justify-center gap-4 text-xs mt-2 text-slate-500 underline">
          {data.links.linkedin && <span>LinkedIn</span>}
          {data.links.github && <span>GitHub</span>}
          {data.links.portfolio && <span>Portfolio</span>}
        </div>
      )}
    </div>

    <div className="space-y-6">
      {data.summary && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b border-slate-300 pb-1 mb-2">Professional Summary</h2>
          <p className="text-sm leading-relaxed text-justify">{data.summary}</p>
        </section>
      )}

      {data.experience && data.experience.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b border-slate-300 pb-1 mb-3">Experience</h2>
          <div className="space-y-5">
            {data.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline font-bold">
                  <h3 className="text-sm">{exp.company}</h3>
                  <span className="text-xs italic">{exp.startDate} — {exp.endDate}</span>
                </div>
                <p className="text-sm italic text-slate-700">{exp.title}</p>
                <ul className="list-disc ml-5 mt-2 text-sm space-y-1">
                  {exp.bullets?.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills && data.skills.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b border-slate-300 pb-1 mb-2">Expertise</h2>
          <p className="text-sm leading-relaxed">{data.skills.join(" • ")}</p>
        </section>
      )}

      {data.education && data.education.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b border-slate-300 pb-1 mb-3">Education</h2>
          {data.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <p className="text-sm font-bold">{edu.school}</p>
                <span className="text-xs italic">{edu.endDate}</span>
              </div>
              <p className="text-sm italic">{edu.degree}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  </div>
);

export const MinimalistTemplate: React.FC<TemplateProps> = ({ data }) => (
  <div className="bg-white text-zinc-900 p-12 shadow-sm font-sans max-w-[21cm] mx-auto min-h-[29.7cm]">
    <header className="mb-10">
      <h1 className="text-5xl font-light tracking-tighter">{data.fullName}</h1>
      <p className="text-lg text-zinc-400 font-light mt-1">{data.headline}</p>
      <div className="mt-4 flex gap-4 text-xs font-medium uppercase tracking-widest text-zinc-500">
        {data.email} {data.phone && <span>/ {data.phone}</span>}
      </div>
    </header>

    <div className="space-y-10">
      {data.experience && data.experience.length > 0 && (
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-4">Experience</h2>
          <div className="space-y-8">
            {data.experience.map((exp, i) => (
              <div key={i} className="grid grid-cols-4 gap-4">
                <div className="text-xs font-medium text-zinc-400">{exp.startDate} – {exp.endDate}</div>
                <div className="col-span-3">
                  <h3 className="text-sm font-bold">{exp.title}</h3>
                  <p className="text-sm text-zinc-500 mb-2">{exp.company}</p>
                  <ul className="space-y-1">
                    {exp.bullets?.map((b, j) => <li key={j} className="text-sm text-zinc-700 leading-snug">• {b}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-10">
        {data.skills && data.skills.length > 0 && (
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-4">Core Skills</h2>
            <ul className="text-sm text-zinc-700 space-y-1">
              {data.skills.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </section>
        )}
        {data.education && data.education.length > 0 && (
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-4">Education</h2>
            <div className="space-y-4">
              {data.education.map((edu, i) => (
                <div key={i}>
                  <p className="text-sm font-bold">{edu.degree}</p>
                  <p className="text-sm text-zinc-500">{edu.school}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  </div>
);

export const TemplateSelector: React.FC<{ 
  selected: string; 
  onSelect: (id: string) => void;
}> = ({ selected, onSelect }) => {
  const templates = [
    { id: "modern", name: "Modern" },
    { id: "professional", name: "Professional" },
    { id: "minimalist", name: "Minimalist" },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selected === t.id 
              ? "bg-primary text-primary-foreground" 
              : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
};
