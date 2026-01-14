import React, { useState, useEffect } from "react";
import {
  Briefcase, ArrowRight, CheckCircle2, Target, Zap, Map, Loader2,
  ChevronRight, Share2, Download, BookOpen, Sparkles, X,
  Building2, Globe, Mail, ExternalLink, Award, AlertCircle
} from "lucide-react";

const SkillSyncApp = () => {

  // ✅ CORRECT ENV USAGE (NO useState, NO hardcoding)
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

  const addSkill = (skillText = null) => {
    const text = skillText || currentSkills;
    const trimmed = text.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
      setCurrentSkills("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(skill => skill !== skillToRemove));
  };

  // ✅ MAIN ANALYSIS FUNCTION (FIXED)
  const analyzeSkills = async () => {

    if (!apiKey) {
      setError("API key missing. Please configure environment variables.");
      return;
    }

    if (!targetRole || skillsList.length === 0) {
      setError("Please tell us your target role and current skills.");
      return;
    }

    setError("");
    setStep("analyzing");

    try {
      const systemPrompt = `
You are SkillSync.

Target Role: ${targetRole}
Current Skills: ${skillsList.join(", ")}

Compare the student's skills to real industry standards.

Rules:
- matchScore between 0–100
- If matchScore >= 90:
  - missingSkills: []
  - roadmap: []
  - populate jobConnect
- If matchScore < 90:
  - populate missingSkills & roadmap
  - jobConnect: []

Return ONLY valid JSON in this format:
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      if (!response.ok) {
        throw new Error("Gemini API failed");
      }

      const data = await response.json();
      const resultText = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(resultText);

      setAnalysisResult(parsed);
      setStep("results");

    } catch (err) {
      console.error(err);
      setError("Could not sync with industry data. Please check API configuration.");
      setStep("input");
    }
  };

  const resetApp = () => {
    setStep("input");
    setAnalysisResult(null);
    setTargetRole("");
    setSkillsList([]);
  };

  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="bg-indigo-600 p-2 rounded-lg">
        <Zap className="text-white" size={24} fill="currentColor" />
      </div>
      <span className="text-2xl font-bold text-white">
        Skill<span className="text-indigo-400">Sync</span>
      </span>
    </div>
  );

  const isJobReady = analysisResult?.matchScore >= 90;

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white">
        <Logo />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {step === "input" && (
        <div className="max-w-3xl mx-auto p-10">
          <h1 className="text-5xl font-bold mb-10">
            Skill<span className="text-indigo-400">Sync</span>
          </h1>

          <input
            className="w-full mb-6 p-4 bg-slate-900 rounded-xl"
            placeholder="Target Role"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
          />

          <input
            className="w-full mb-6 p-4 bg-slate-900 rounded-xl"
            placeholder="Add skill and press Enter"
            value={currentSkills}
            onChange={e => setCurrentSkills(e.target.value)}
            onKeyDown={handleAddSkill}
            onBlur={() => addSkill()}
          />

          <div className="flex gap-2 mb-6 flex-wrap">
            {skillsList.map(skill => (
              <span key={skill} className="bg-indigo-500/20 px-3 py-1 rounded-full">
                {skill}
                <button onClick={() => removeSkill(skill)} className="ml-2">×</button>
              </span>
            ))}
          </div>

          {error && (
            <div className="text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <button
            onClick={analyzeSkills}
            className="bg-white text-black px-8 py-4 rounded-xl font-bold"
          >
            Generate Roadmap
          </button>
        </div>
      )}

      {step === "analyzing" && (
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="animate-spin w-12 h-12 mb-4" />
          <p>Analyzing industry gap...</p>
        </div>
      )}

      {step === "results" && analysisResult && (
        <div className="max-w-4xl mx-auto p-10">
          <button onClick={resetApp} className="mb-6 text-indigo-400">
            ← Back
          </button>

          <h2 className="text-4xl font-bold mb-4">
            Skill Match: {analysisResult.matchScore}%
          </h2>

          <p className="mb-6">{analysisResult.summary}</p>

          {!isJobReady && (
            <>
              <h3 className="text-xl mb-2">Missing Skills</h3>
              <ul className="mb-6 list-disc pl-6">
                {analysisResult.missingSkills.map(s => <li key={s}>{s}</li>)}
              </ul>
            </>
          )}

          {isJobReady && (
            <>
              <h3 className="text-xl mb-4">Job Connect</h3>
              {analysisResult.jobConnect.map((job, i) => (
                <a
                  key={i}
                  href={`https://${job.contact}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block mb-3 p-4 bg-slate-900 rounded-xl"
                >
                  <strong>{job.name}</strong> — {job.description}
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
