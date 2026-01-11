import React, { useState, useEffect } from 'react';
import { 
  Briefcase, ArrowRight, CheckCircle2, Target, Zap, Map, Loader2, 
  ChevronRight, Share2, Download, BookOpen, Sparkles, X, 
  Building2, Globe, Mail, ExternalLink, Award, AlertCircle 
} from 'lucide-react';

const SkillSyncApp = () => {

  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCH3E3VasVbkxfCZe-SZW4jzHcUndBDau8");
  
  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState('input'); 
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [skillsList, setSkillsList] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  const addSkill = (skillText = null) => {
    const text = skillText || currentSkills;
    const trimmed = text.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
      setCurrentSkills('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(skill => skill !== skillToRemove));
  };

  const analyzeSkills = async () => {
    if (!targetRole || skillsList.length === 0) {
      setError("Please tell us your target role and current skills.");
      return;
    }
    setError('');
    setStep('analyzing');

    try {
      const systemPrompt = `
        You are SkillSync. 
        Target Role: ${targetRole}
        Current Skills: ${skillsList.join(', ')}

        Compare the student's skills to the industry standard for this role.
        
        CRITICAL LOGIC:
        If the student has ALL major required skills (e.g. for Frontend: React, CSS, JS, Git, etc.), give them a "matchScore" of 100.
        
        If matchScore is >= 90:
        - "missingSkills" should be empty [].
        - "roadmap" should be empty [].
        - Populate "jobConnect" with real top companies and platforms hiring for this role.

        If matchScore is < 90:
        - Populate "missingSkills" and "roadmap".
        - "jobConnect" should be empty [].

        Return a strictly formatted JSON object:
        {
          "matchScore": <number 0-100>,
          "summary": "<1 sentence direct feedback>",
          "missingSkills": ["<skill 1>", ...],
          "roadmap": [
            { "week": "Week 1", "action": "...", "details": "..." }
          ],
          "jobConnect": [
            {
              "type": "Company",
              "name": "<Top Company, e.g. Google>",
              "description": "<Why they hire this role>",
              "action": "Apply Now",
              "contact": "careers.google.com" 
            },
            {
              "type": "Platform",
              "name": "<Platform, e.g. Y Combinator>",
              "description": "<Best for startups>",
              "action": "Browse Jobs",
              "contact": "ycombinator.com/jobs"
            },
             {
              "type": "Recruiter",
              "name": "<Tech Recruiting Agency>",
              "description": "<Specialists in placement>",
              "action": "Contact Agent",
              "contact": "agency.com"
            }
          ]
        }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error("Analysis failed. Please check your API Key.");
      const data = await response.json();
      const resultText = data.candidates[0].content.parts[0].text;
      setAnalysisResult(JSON.parse(resultText));
      setStep('results');
    } catch (err) {
      console.error(err);
      setError("Could not sync with industry data. Please ensure you have added your API Key.");
      setStep('input');
    }
  };

  const resetApp = () => {
    setStep('input');
    setAnalysisResult(null);
    setTargetRole('');
    setSkillsList([]);
  };

  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="bg-indigo-600 p-2 rounded-lg">
        <Zap className="text-white" size={24} fill="currentColor" />
      </div>
      <span className="text-2xl font-bold tracking-tight text-white">Skill<span className="text-indigo-400">Sync</span></span>
    </div>
  );

  const isJobReady = analysisResult?.matchScore >= 90;

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-white">
        <Logo />
        <p className="mt-6 text-slate-400 text-lg animate-pulse">Aligning education with reality...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-white">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]"></div>
      </div>

      <nav className="relative z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="cursor-pointer" onClick={resetApp}>
            <Logo />
          </div>
          <button className="text-base font-medium text-slate-400 hover:text-white transition-colors">
            About SkillSync
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-8 py-16 md:py-24">
        {step === 'input' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-16 space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
                Degrees show what you studied. <br />
                <span className="text-indigo-400">SkillSync shows what you can become.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
                Industries hire based on skills, not just degrees. See exactly how the industry evaluates you—before you apply.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-10 backdrop-blur-sm shadow-2xl">
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-indigo-400 uppercase tracking-widest pl-1">
                    1. Target Role
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
                    <input 
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Frontend Developer"
                      className="w-full pl-14 pr-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-xl text-white placeholder:text-slate-600 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-indigo-400 uppercase tracking-widest pl-1">
                    2. Your Current Skills
                  </label>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 min-h-[120px] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                    <div className="flex flex-wrap gap-3 mb-3">
                      {skillsList.map((skill, index) => (
                        <span key={index} className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 px-4 py-2 rounded-full text-base font-medium">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="hover:text-white ml-1"><X size={16} /></button>
                        </span>
                      ))}
                    </div>
                    <input 
                      type="text"
                      value={currentSkills}
                      onChange={(e) => setCurrentSkills(e.target.value)}
                      onKeyDown={handleAddSkill}
                      onBlur={() => addSkill()}
                      placeholder={skillsList.length === 0 ? "Type skills and press Enter (e.g. HTML, React)..." : "Add another skill..."}
                      className="w-full bg-transparent outline-none text-xl text-white placeholder:text-slate-600 p-2"
                    />
                  </div>
                  <p className="text-sm text-slate-500 pl-1">Press Enter to add a skill tag.</p>
                </div>

                {error && (
                  <div className="flex items-center gap-3 text-red-400 bg-red-950/30 p-5 rounded-2xl text-base border border-red-900/50">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}

                <button 
                  onClick={analyzeSkills}
                  className="w-full bg-white text-slate-950 font-bold text-xl py-5 rounded-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl hover:scale-[1.01]"
                >
                  Generate Roadmap <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in">
            <div className="bg-slate-900 p-8 rounded-full border border-white/5 mb-8 relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
              <Loader2 className="w-16 h-16 text-indigo-400 animate-spin relative z-10" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Analyzing the Gap...</h2>
            <p className="text-xl text-slate-400">Comparing your profile against real industry demand for <span className="text-indigo-400 font-semibold">{targetRole}</span>.</p>
          </div>
        )}

        {step === 'results' && analysisResult && (
          <div className="animate-in slide-in-from-bottom-8 duration-700 fade-in max-w-6xl mx-auto">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
              <div>
                <button onClick={resetApp} className="text-base text-slate-500 hover:text-white mb-3 flex items-center gap-2 transition-colors">
                  <ChevronRight className="rotate-180" size={18} /> Back to Input
                </button>
                <div className="flex items-center gap-4">
                  <h2 className="text-4xl md:text-5xl font-bold text-white">
                    {isJobReady ? "Placement Ready" : "Employability Report"}
                  </h2>
                  {isJobReady && (
                    <span className="px-4 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-bold uppercase tracking-wide animate-pulse">
                      Job Ready
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                  <Share2 size={24} />
                </button>
                <button className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                  <Download size={24} />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              
              <div className="md:col-span-1 space-y-8">
                
                <div className={`border rounded-3xl p-8 text-center relative overflow-hidden ${isJobReady ? 'bg-green-950/20 border-green-500/30' : 'bg-slate-900/50 border-white/10'}`}>
                   {isJobReady && <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>}
                  
                  <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                     <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="10" fill="transparent" />
                      <circle 
                        cx="80" cy="80" r="70" 
                        stroke={analysisResult.matchScore >= 90 ? "#4ade80" : analysisResult.matchScore > 40 ? "#fbbf24" : "#f87171"} 
                        strokeWidth="10" 
                        fill="transparent" 
                        strokeDasharray={440} 
                        strokeDashoffset={440 - (440 * analysisResult.matchScore) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-white">{analysisResult.matchScore}%</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Skill Match</h3>
                  <p className="mt-6 text-base text-slate-300 italic leading-relaxed">"{analysisResult.summary}"</p>
                </div>

                {!isJobReady && (
                  <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8">
                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Target size={18} /> Missing Critical Skills
                    </h3>
                    <div className="space-y-3">
                      {analysisResult.missingSkills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <span className="text-base font-medium text-red-200">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {isJobReady && (
                  <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-3xl p-8 text-center">
                    <div className="inline-flex p-4 rounded-full bg-green-500/20 text-green-400 mb-4">
                      <Award size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Verified Skill Set</h3>
                    <p className="text-slate-400 text-sm">Your profile matches 95%+ of industry requirements. You are ready to apply.</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                {isJobReady ? (
                  <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-10 h-full animate-in fade-in slide-in-from-bottom-8">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="bg-green-500/20 p-3 rounded-xl text-green-400">
                        <Building2 size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Job Connect</h3>
                        <p className="text-base text-slate-400">Direct links to top companies & platforms hiring now.</p>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      {analysisResult.jobConnect && analysisResult.jobConnect.map((job, index) => (
                        <div key={index} className="group relative bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-green-500/30 rounded-2xl p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-900 rounded-xl text-slate-300 border border-slate-700 group-hover:text-green-400 transition-colors">
                              {job.type === 'Company' ? <Building2 size={24} /> : job.type === 'Platform' ? <Globe size={24} /> : <Mail size={24} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-bold text-white">{job.name}</h4>
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{job.type}</span>
                              </div>
                              <p className="text-sm text-slate-400">{job.description}</p>
                            </div>
                          </div>
                          
                          <a href={`https://${job.contact}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-green-400 transition-colors min-w-[160px]">
                            {job.action} <ExternalLink size={16} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-10 h-full">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400">
                        <Map size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Your Actionable Roadmap</h3>
                        <p className="text-base text-slate-400">Step-by-step direction. Not generic advice.</p>
                      </div>
                    </div>

                    <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-5 before:w-0.5 before:bg-slate-800">
                      {analysisResult.roadmap.map((step, index) => (
                        <div key={index} className="relative pl-16 group">
                          <div className={`absolute left-0 top-1.5 w-10 h-10 rounded-full border-4 border-slate-950 flex items-center justify-center z-10 ${index === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {index === 0 ? <Zap size={18} fill="currentColor" /> : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                          </div>

                          <div className={`p-6 rounded-2xl border transition-all ${index === 0 ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50'}`}>
                            <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2 block">
                              {step.week}
                            </span>
                            <h4 className="text-xl font-bold text-white mb-3">{step.action}</h4>
                            <p className="text-base text-slate-400 leading-relaxed">
                              {step.details}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default SkillSyncApp;