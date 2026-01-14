import React, { useState, useEffect } from "react";
import {
  Briefcase,
  ArrowRight,
  Target,
  Zap,
  Map,
  Loader2,
  ChevronRight,
  Share2,
  Download,
  Building2,
  Globe,
  Mail,
  ExternalLink,
  Award,
  AlertCircle,
  X,
} from "lucide-react";

export default function SkillSyncApp() {
  // ✅ API KEY (Vercel compatible)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // ✅ App state
  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState("input");
  const [targetRole, setTargetRole] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const [skillsList, setSkillsList] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  // Splash screen
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // Skill input
  const handleAddSkill = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  const addSkill = () => {
    const skill = currentSkills.trim();
    if (skill && !skillsList.includes(skill)) {
      setSkillsList([...skillsList, skill]);
    }
    setCurrentSkills("");
  };

  const removeSkill = (skill) => {
    setSkillsList(skillsList.filter((s) => s !== skill));
  };

  // 🔥 CORE ANALYSIS FUNCTION (FIXED)
  const analyzeSkills = async () => {
    if (!targetRole || skillsList.length === 0) {
      setError("Please enter a target role and at least one skill.");
      return;
    }

    if (!apiKey) {
      setError("API Key missing. Please configure VITE_GEMINI_API_KEY.");
      return;
    }

    setError("");
    setStep("analyzing");

    try {
      const prompt = `
You are SkillSync.

Target Role: ${targetRole}
Current Skills: ${skillsList.join(", ")}

Rules:
- Return STRICT JSON ONLY
- matchScore: number 0–100
- If matchScore >= 90:
  - missingSkills = []
  - roadmap = []
  - jobConnect must be populated
- If matchScore < 90:
  - missingSkills & roadmap required
  - jobConnect = []

JSON format:
{
  "matchScore": 0,
  "summary": "",
  "missingSkills": [],
  "roadmap": [
    { "week": "Week 1", "action": "", "details": "" }
  ],
  "jobConnect": [
    {
      "type": "Company",
      "name": "",
      "description": "",
      "action": "Apply Now",
      "contact": ""
    }
  ]
}
`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (!res.ok) throw new Error("API request failed");

      const data = await res.json();

      const raw =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!raw) throw new Error("Invalid AI response");

      const parsed =
        typeof raw === "string" ? JSON.parse(raw) : raw;

      setAnalysisResult(parsed);
      setStep("results");
    } catch (err) {
      console.error(err);
      setError("Failed to analyze skills. Please try again.");
      setStep("input");
    }
  };

  const resetApp = () => {
    setStep("input");
    setTargetRole("");
    setSkillsList([]);
    setAnalysisResult(null);
    setError("");
  };

  const isJobReady = analysisResult?.matchScore >= 90;

  // Splash
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white">
        <h1 className="text-4xl font-bold">
          Skill<span className="text-indigo-400">Sync</span>
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* NAV */}
      <nav className="border-b border-white/5 px-8 py-6 flex justify-between">
        <h2
          onClick={resetApp}
          className="text-xl font-bold cursor-pointer"
        >
          Skill<span className="text-indigo-400">Sync</span>
        </h2>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-16">

        {/* ================= INPUT ================= */}
        {step === "input" && (
          <div className="max-w-3xl mx-auto space-y-10">
            <h1 className="text-5xl font-bold text-center text-white">
              SkillSync Career Analyzer
            </h1>

            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target Role (e.g. Frontend Developer)"
              className="w-full p-5 rounded-xl bg-slate-900 border border-slate-700 text-white"
            />

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
              <div className="flex flex-wrap gap-3 mb-3">
                {skillsList.map((s, i) => (
                  <span
                    key={i}
                    className="bg-indigo-500/20 text-indigo-200 px-4 py-2 rounded-full flex items-center gap-2"
                  >
                    {s}
                    <X
                      size={16}
                      className="cursor-pointer"
                      onClick={() => removeSkill(s)}
                    />
                  </span>
                ))}
              </div>

              <input
                value={currentSkills}
                onChange={(e) => setCurrentSkills(e.target.value)}
                onKeyDown={handleAddSkill}
                onBlur={addSkill}
                placeholder="Type a skill and press Enter"
                className="w-full bg-transparent outline-none text-lg text-white"
              />
            </div>

            {error && (
              <div className="text-red-400 flex items-center gap-2">
                <AlertCircle /> {error}
              </div>
            )}

            <button
              onClick={analyzeSkills}
              className="w-full bg-white text-black font-bold py-5 rounded-xl text-xl"
            >
              Generate Roadmap
            </button>
          </div>
        )}

        {/* ================= ANALYZING ================= */}
        {step === "analyzing" && (
          <div className="text-center py-32">
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-indigo-400" />
            <h2 className="text-3xl font-bold text-white">
              Analyzing Skills…
            </h2>
          </div>
        )}

        {/* ================= RESULTS ================= */}
        {step === "results" && analysisResult && (
          <div className="space-y-10">
            <button
              onClick={resetApp}
              className="text-slate-400 flex items-center gap-2"
            >
              <ChevronRight className="rotate-180" /> Back
            </button>

            <h2 className="text-4xl font-bold text-white">
              {isJobReady ? "Placement Ready" : "Skill Gap Report"}
            </h2>

            <p className="text-xl">
              Match Score:{" "}
              <span className="font-bold text-indigo-400">
                {analysisResult.matchScore}%
              </span>
            </p>

            {!isJobReady && (
              <>
                <h3 className="text-xl font-bold text-red-400">
                  Missing Skills
                </h3>
                <ul className="list-disc ml-6">
                  {analysisResult.missingSkills.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>

                <h3 className="text-xl font-bold mt-6">
                  Roadmap
                </h3>
                {analysisResult.roadmap.map((r, i) => (
                  <div key={i} className="bg-slate-900 p-5 rounded-xl mt-4">
                    <h4 className="font-bold">{r.week}</h4>
                    <p>{r.action}</p>
                    <p className="text-slate-400">{r.details}</p>
                  </div>
                ))}
              </>
            )}

            {isJobReady && (
              <>
                <h3 className="text-xl font-bold text-green-400">
                  Job Connect
                </h3>
                {analysisResult.jobConnect.map((j, i) => (
                  <a
                    key={i}
                    href={`https://${j.contact}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-slate-900 p-5 rounded-xl hover:bg-slate-800"
                  >
                    <h4 className="font-bold">{j.name}</h4>
                    <p className="text-slate-400">{j.description}</p>
                  </a>
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
