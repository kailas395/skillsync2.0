import React, { useState, useEffect } from "react";
import {
  Briefcase, ArrowRight, Target, Zap, Map, Loader2,
  ChevronRight, Share2, Download, Sparkles, X,
  Building2, Globe, Mail, ExternalLink, Award, AlertCircle
} from "lucide-react";

const SkillSyncApp = () => {

  // ✅ ENV ONLY (NO HARDCODED KEY)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState("input");
  const [targetRole, setTargetRole] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const [skillsList, setSkillsList] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAddSkill = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  const addSkill = () => {
    const trimmed = currentSkills.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
    }
    setCurrentSkills("");
  };

  const removeSkill = (skill) => {
    setSkillsList(skillsList.filter(s => s !== skill));
  };

  const analyzeSkills = async () => {

    // ✅ ENV CHECK
    if (!apiKey) {
      setError("Gemini API key not configured. Please add it in Vercel Environment Variables.");
      return;
    }

    if (!targetRole || skillsList.length === 0) {
      setError("Please enter a target role and at least one skill.");
      return;
    }

    setError("");
    setStep("analyzing");

    try {
      const prompt = `
You are SkillSync.

Target Role: ${targetRole}
Current Skills: ${skillsList.join(", ")}

Compare skills with industry standards.

Rules:
- If matchScore >= 90 → missingSkills = [], roadmap = [], include jobConnect
- If matchScore < 90 → include missingSkills + roadmap, jobConnect = []

Return ONLY valid JSON:
{
  "matchScore": 0-100,
  "summary": "short feedback",
  "missingSkills": [],
  "roadmap": [{ "week": "", "action": "", "details": "" }],
  "jobConnect": [{
    "type": "Company | Platform | Recruiter",
    "name": "",
    "description": "",
    "action": "",
    "contact": ""
  }]
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) throw new Error("Invalid AI response");

      const parsed = JSON.parse(rawText);

      setAnalysisResult({
        matchScore: parsed.matchScore ?? 0,
        summary: parsed.summary ?? "No summary",
        missingSkills: parsed.missingSkills ?? [],
        roadmap: parsed.roadmap ?? [],
        jobConnect: parsed.jobConnect ?? []
      });

      setStep("results");

    } catch (err) {
      console.error(err);
      setError("Failed to analyze skills. Please try again.");
      setStep("input");
    }
  };

  const resetApp = () => {
    setStep("input");
    setAnalysisResult(null);
    setTargetRole("");
    setSkillsList([]);
    setError("");
  };

  const isJobReady = analysisResult?.matchScore >= 90;

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white">
        <div className="text-3xl font-bold flex gap-2">
          <Zap className="text-indigo-400" /> SkillSync
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* INPUT */}
      {step === "input" && (
        <div className="max-w-3xl mx-auto p-10">
          <h1 className="text-4xl font-bold text-white mb-8">
            SkillSync – Industry Skill Alignment
          </h1>

          <input
            className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 mb-6"
            placeholder="Target Role (e.g. Frontend Developer)"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {skillsList.map((s, i) => (
                <span key={i} className="bg-indigo-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                  {s}
                  <X size={14} onClick={() => removeSkill(s)} />
                </span>
              ))}
            </div>

            <input
              className="bg-transparent w-full outline-none"
              placeholder="Add skills & press Enter"
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
              onKeyDown={handleAddSkill}
            />
          </div>

          {error && (
            <div className="text-red-400 flex gap-2 mb-4">
              <AlertCircle /> {error}
            </div>
          )}

          <button
            onClick={analyzeSkills}
            className="w-full bg-white text-black py-4 rounded-xl font-bold"
          >
            Generate Roadmap
          </button>
        </div>
      )}

      {/* ANALYZING */}
      {step === "analyzing" && (
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <Loader2 className="animate-spin text-indigo-400" size={48} />
          <p className="mt-4 text-slate-400">Analyzing industry gap…</p>
        </div>
      )}

      {/* RESULTS */}
      {step === "results" && analysisResult && (
        <div className="max-w-5xl mx-auto p-10">
          <button onClick={resetApp} className="mb-6 text-slate-400 flex gap-2">
            <ChevronRight className="rotate-180" /> Back
          </button>

          <h2 className="text-3xl font-bold mb-4">
            {isJobReady ? "Placement Ready" : "Employability Report"}
          </h2>

          <p className="mb-6 text-slate-400">{analysisResult.summary}</p>

          {!isJobReady && (
            <>
              <h3 className="font-bold mb-2">Missing Skills</h3>
              <ul className="mb-6 list-disc list-inside">
                {analysisResult.missingSkills.map((s, i) => <li key={i}>{s}</li>)}
              </ul>

              <h3 className="font-bold mb-2">Roadmap</h3>
              {analysisResult.roadmap.map((r, i) => (
                <div key={i} className="mb-4 bg-slate-900 p-4 rounded-xl">
                  <strong>{r.week}</strong> – {r.action}
                  <p className="text-slate-400">{r.details}</p>
                </div>
              ))}
            </>
          )}

          {isJobReady && (
            <>
              <h3 className="font-bold mb-4">Job Connect</h3>
              {analysisResult.jobConnect.map((j, i) => (
                <a
                  key={i}
                  href={`https://${j.contact}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-slate-900 p-4 rounded-xl mb-3 hover:bg-slate-800"
                >
                  <strong>{j.name}</strong> — {j.description}
                </a>
              ))}
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default SkillSyncApp;
