"use client";

import React, { useState, useEffect, useRef } from "react";

const labelMap: Record<string, string> = {
  Low: "Low Risk",
  Medium: "Medium Risk",
  High: "High Risk",
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
};

// Helper function to get label with fallback
const getRiskLabel = (key: string): string => {
  const label = labelMap[key] || labelMap[key.toLowerCase()] || labelMap[key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()];
  return label || `${key} Risk`;
};

// Backend base URL (env-driven with local fallback)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface PredictionResponse {
  prediction?: string;
  risk_level?: string;
  probabilities?: Record<string, number>;
  accuracy?: string;
  error?: string;
}

const steps = [
  "Demographics",
  "Pregnancy History",
  "Mental Health (PHQ-9)",
  "Support & Relationships",
  "Review & Predict",
];

// -----------------------------------------------------
// MINIMAL FORM STATE (~20 questions + PHQ-9)
// -----------------------------------------------------
const initialForm = {
  // Step 1: Demographics (3)
  age: "",
  education_level: "",
  family_type: "",

  // Step 2: Pregnancy History (5)
  number_of_pregnancies: "",
  pregnancy_length: "",
  history_of_pregnancy_loss: "",
  pregnancy_complications: "",
  fear_pregnancy: "",
  major_changes: "",

  // Step 3: PHQ-9 (9 sub-questions + 1)
  phq9_q1: 0, phq9_q2: 0, phq9_q3: 0,
  phq9_q4: 0, phq9_q5: 0, phq9_q6: 0,
  phq9_q7: 0, phq9_q8: 0, phq9_q9: 0,
  depression_history: "",

  // Step 4: Support & Relationships (7)
  relationship_husband: "",
  relationship_inlaws: "",
  family_support: "",
  feeling_motherhood: "",
  trust_share_feelings: "",
  worry_newborn: "",
  abuse: "",
  breastfeed: "",
};

// -----------------------------------------------------
// ADMIN TEST PRESETS (for quick testing)
// -----------------------------------------------------
const testPresets = {
  low: {
    age: "28",
    education_level: "university",
    family_type: "nuclear",
    number_of_pregnancies: "1",
    pregnancy_length: "10 months",
    history_of_pregnancy_loss: "no",
    pregnancy_complications: "no",
    fear_pregnancy: "no",
    major_changes: "no",
    phq9_q1: 0, phq9_q2: 0, phq9_q3: 0,
    phq9_q4: 0, phq9_q5: 1, phq9_q6: 0,
    phq9_q7: 0, phq9_q8: 0, phq9_q9: 0,
    depression_history: "no",
    relationship_husband: "good",
    relationship_inlaws: "good",
    family_support: "high",
    feeling_motherhood: "happy",
    trust_share_feelings: "yes",
    worry_newborn: "no",
    abuse: "no",
    breastfeed: "yes",
  },
  medium: {
    age: "32",
    education_level: "high school",
    family_type: "joint",
    number_of_pregnancies: "2",
    pregnancy_length: "9 months",
    history_of_pregnancy_loss: "yes",
    pregnancy_complications: "no",
    fear_pregnancy: "yes",
    major_changes: "no",
    phq9_q1: 1, phq9_q2: 2, phq9_q3: 1,
    phq9_q4: 2, phq9_q5: 1, phq9_q6: 1,
    phq9_q7: 1, phq9_q8: 0, phq9_q9: 0,
    depression_history: "no",
    relationship_husband: "neutral",
    relationship_inlaws: "neutral",
    family_support: "medium",
    feeling_motherhood: "neutral",
    trust_share_feelings: "yes",
    worry_newborn: "yes",
    abuse: "no",
    breastfeed: "yes",
  },
  high: {
    age: "19",
    education_level: "primary school",
    family_type: "joint",
    number_of_pregnancies: "3",
    pregnancy_length: "less than 5 months",
    history_of_pregnancy_loss: "yes",
    pregnancy_complications: "yes",
    fear_pregnancy: "yes",
    major_changes: "yes",
    phq9_q1: 3, phq9_q2: 3, phq9_q3: 2,
    phq9_q4: 3, phq9_q5: 2, phq9_q6: 3,
    phq9_q7: 2, phq9_q8: 2, phq9_q9: 1,
    depression_history: "yes",
    relationship_husband: "bad",
    relationship_inlaws: "bad",
    family_support: "low",
    feeling_motherhood: "sad",
    trust_share_feelings: "no",
    worry_newborn: "yes",
    abuse: "yes",
    breastfeed: "no",
  },
};

// PHQ-9 Questions (standard validated instrument)
const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling/staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself",
  "Trouble concentrating on things",
  "Moving or speaking slowly, or being fidgety",
  "Thoughts of self-harm or that you would be better off dead",
];

const PHQ9_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

// -----------------------------------------------------
// CATEGORY OPTIONS (MINIMAL)
// -----------------------------------------------------
const options = {
  education_level: [
    { value: "primary school", label: "Primary School" },
    { value: "high school", label: "High School" },
    { value: "college", label: "College" },
    { value: "university", label: "University" },
  ],
  family_type: [
    { value: "nuclear", label: "Nuclear Family" },
    { value: "joint", label: "Joint Family" },
  ],
  pregnancy_length: [
    { value: "10 months", label: "Full term (10 months)" },
    { value: "9 months", label: "9 months" },
    { value: "less than 5 months", label: "Less than 5 months (premature)" },
  ],
  relationship: [
    { value: "good", label: "Good" },
    { value: "neutral", label: "Neutral" },
    { value: "bad", label: "Bad" },
  ],
  family_support: [
    { value: "high", label: "High Support" },
    { value: "medium", label: "Medium Support" },
    { value: "low", label: "Low Support" },
  ],
  feeling_motherhood: [
    { value: "happy", label: "Happy & Excited" },
    { value: "neutral", label: "Neutral / Mixed" },
    { value: "sad", label: "Sad / Overwhelmed" },
  ],
  yesno: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
};
// PHQ-9 Score Calculator
const calculatePHQ9Score = (form: typeof initialForm): number => {
  return (
    (form.phq9_q1 || 0) + (form.phq9_q2 || 0) + (form.phq9_q3 || 0) +
    (form.phq9_q4 || 0) + (form.phq9_q5 || 0) + (form.phq9_q6 || 0) +
    (form.phq9_q7 || 0) + (form.phq9_q8 || 0) + (form.phq9_q9 || 0)
  );
};

// PHQ-9 Severity Interpretation
const getPHQ9Severity = (score: number) => {
  if (score <= 4) return { label: "Minimal", color: "text-green-600 bg-green-100 border-green-300" };
  if (score <= 9) return { label: "Mild", color: "text-yellow-600 bg-yellow-100 border-yellow-300" };
  if (score <= 14) return { label: "Moderate", color: "text-orange-600 bg-orange-100 border-orange-300" };
  if (score <= 19) return { label: "Moderately Severe", color: "text-red-500 bg-red-100 border-red-300" };
  return { label: "Severe", color: "text-red-700 bg-red-200 border-red-400" };
};

// No longer needed - using minimal endpoint


// -----------------------------------------------------
// MAIN PAGE COMPONENT
// -----------------------------------------------------
// Batch Assessment Result Interface
interface BatchResult {
  row_index: number;
  input_data: Record<string, any>;
  predicted_label: string;
  probabilities?: Record<string, number>;
  status: string;
  error?: string;
}

export default function AssessmentPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  
  // Batch Assessment State
  const [assessmentMode, setAssessmentMode] = useState<"manual" | "batch">("manual");
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  
  // Admin Test Mode State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTestMenu, setShowTestMenu] = useState(false);
  
  // Check admin status on mount
  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const parsed = JSON.parse(user);
        setIsAdmin(parsed.role === "admin" || parsed.username === "admin");
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);
  
  // Load test preset
  const loadTestPreset = (riskLevel: "low" | "medium" | "high") => {
    setForm(testPresets[riskLevel] as typeof initialForm);
    setShowTestMenu(false);
    setStep(steps.length - 1); // Jump to review step
  };

  const goNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const updateField = (name: string, value: string | number) => {
    setForm({ ...form, [name]: value });
  };

  // PHQ-9 Score (computed)
  const phq9Score = calculatePHQ9Score(form);
  const phq9Severity = getPHQ9Severity(phq9Score);

  // Start New Prediction - Clear everything and return to step 0
  const startNewPrediction = () => {
    setForm(initialForm);
    setPrediction(null);
    setStep(0);
  };

  // Edit Information - Keep form data but hide prediction and go back to review
  const editInformation = () => {
    setPrediction(null);
    setStep(steps.length - 1); // Go to last step (Review & Predict)
  };

  const submitPrediction = async () => {
    setLoading(true);
    setPrediction(null);

    // ✅ MINIMAL PAYLOAD - backend auto-computes 53 features
    const payload = {
      ...form,
      age: Number(form.age || 25),
      number_of_pregnancies: Number(form.number_of_pregnancies || 1),
      phq9_score: phq9Score, // Auto-calculated from 9 sub-questions
    };

    try {
      const response = await fetch(`${API_BASE_URL}/predict-minimal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setPrediction(data);
      
      // Store SHAP explanation in localStorage for the report page
      if (data.shap_explanation) {
        try {
          localStorage.setItem("latestShapExplanation", JSON.stringify(data.shap_explanation));
        } catch (error) {
          console.error("Failed to store SHAP explanation in localStorage:", error);
        }
      }
    } catch {
      setPrediction({ error: "Failed to connect to backend" });
    }

    setLoading(false);
  };

  // Batch Assessment Handler
  const handleBatchFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBatchFile(file);
      setBatchError(null);
      setBatchResults(null);
    }
  };

  const submitBatchAssessment = async () => {
    if (!batchFile) {
      setBatchError("Please select a CSV file first.");
      return;
    }

    setBatchProcessing(true);
    setBatchError(null);
    setBatchResults(null);

    const formData = new FormData();
    formData.append("file", batchFile);

    try {
      const response = await fetch(`${API_BASE_URL}/batch-assess`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setBatchResults(data.results);
      } else {
        setBatchError(data.detail || data.message || "Batch assessment failed");
      }
    } catch (error) {
      setBatchError("Failed to connect to backend. Please try again.");
    } finally {
      setBatchProcessing(false);
    }
  };

  const clearBatchAssessment = () => {
    setBatchFile(null);
    setBatchResults(null);
    setBatchError(null);
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = "";
    }
  };


    

  // Generate firefly positions only on client-side to avoid hydration mismatch
  const [fireflies, setFireflies] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string; size: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string}>>([]);
  const [isClient, setIsClient] = useState(false);

  // Generate fireflies and stars only on client after hydration
  useEffect(() => {
    setIsClient(true);
    setFireflies(Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 4}s`,
      size: `${3 + Math.random() * 3}px`,
    })));

    setStars(Array.from({ length: 35 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${3 + Math.random() * 3}s`,
    })));
  }, []);

  return (
    <main className="min-h-screen flex flex-col lg:flex-row text-slate-800 p-4 sm:p-6 gap-4 sm:gap-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #b8d8f0 0%, #c8c8f5 50%, #f0c8e8 100%)' }} role="main">
      {/* Starry Firefly Background */}
      {isClient && (
        <div className="fireflies-container" aria-hidden="true">
          {fireflies.map((f) => (
            <div
              key={`firefly-${f.id}`}
              className="firefly"
              style={{
                left: f.left,
                top: f.top,
                animationDelay: f.delay,
                animationDuration: f.duration,
                width: f.size,
                height: f.size,
              }}
            />
          ))}
          {stars.map((s) => (
            <div
              key={`star-${s.id}`}
              className="star"
              style={{
                left: s.left,
                top: s.top,
                animationDelay: s.delay,
                animationDuration: s.duration,
              }}
            />
          ))}
        </div>
      )}
      {/* SIDEBAR */}
      <aside className="relative z-10 w-full lg:w-72 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-100/90 via-purple-50/80 to-pink-100/90 backdrop-blur-2xl border border-blue-200/60 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700" role="navigation" aria-label="Assessment steps navigation">
        <div className="mb-8 sm:mb-10 p-5 sm:p-6 bg-gradient-to-br from-blue-100/80 via-purple-100/70 to-pink-100/80 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-blue-200/60 hover:border-purple-300/70 group">
          <div className="flex flex-col items-center gap-3">
            {/* Sakura Logo */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 animate-in zoom-in-50 duration-700 hover:scale-110 transition-all duration-500 flex-shrink-0 flex items-center justify-center text-4xl">
              🌸
            </div>
            
            {/* Brand Title */}
            <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl font-black animate-in fade-in zoom-in-50 duration-700 hover:scale-105 transition-all duration-500 cursor-default break-words px-2" style={{ 
                fontFamily: '"sans-serif", sans-serif',
                letterSpacing: '0.05em',
                backgroundImage: 'linear-gradient(180deg, #f7f7f7ff 0%, #eca8dbff 50%, #bdbdbdff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight : 'bold',
                //borderRadius: '.9rem',
                //border: '2px solid rgba(255, 122, 184, 0.3)',
                //padding: '0.1rem 0.9rem',
                WebkitTextStroke: '1px rgba(205, 25, 25, 0.1)',
                filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.4))',
                WebkitFilter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.4))'
              }} aria-label="Mind-Bloom - PPD Risk Assessment Platform">
              MIND BLOOM
            </h2>
            
            <div className="text-center">
              <p className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide opacity-80 group-hover:opacity-100 transition-opacity duration-300">PPD Risk Assessment</p>
            </div>
          </div>
        </div>

        <div className="mb-4 pb-4 border-b-2 border-slate-200">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Assessment Steps</p>
        </div>
        <ul className="space-y-3" role="list">
          {steps.map((s, i) => (
            <li key={i} role="listitem">
  <button
    onClick={() => setStep(i)}
    className={`w-full text-left group cursor-pointer min-h-[44px] p-4 rounded-2xl transition-all duration-300 ease-out transform motion-safe:hover:-translate-y-0.5 active:scale-95 relative focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
      step === i
        ? "bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-300 text-purple-900 shadow-lg shadow-purple-200/50 scale-105 font-bold"
        : step > i
        ? "bg-green-50/50 border-2 border-green-200/50 text-green-700 hover:bg-green-100 hover:border-green-300"
        : "bg-white/40 border border-slate-200 hover:bg-white/60 hover:border-blue-200 text-slate-600"
    }`}
    aria-label={`${step > i ? 'Completed: ' : step === i ? 'Current step: ' : 'Go to '}${s}`}
    aria-current={step === i ? "step" : undefined}
  >
    <div className="flex items-center gap-3">
      {/* Circle Number / Checkmark Indicator */}
      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
        step === i 
          ? "bg-purple-600 text-white shadow-md shadow-purple-300" 
          : step > i
          ? "bg-green-500 text-white"
          : "bg-slate-300 text-slate-500 group-hover:bg-slate-400 group-hover:text-white"
      }`} aria-hidden="true">
        {step > i ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          i + 1
        )}
      </div>
      
      {/* Text Label */}
      <span className={`font-semibold text-sm sm:text-base transition-colors duration-300 flex-1 ${
        step === i ? "text-purple-900" : step > i ? "text-green-800" : "text-slate-600 group-hover:text-slate-800"
      }`}>
        {s}
      </span>
    </div>

    {/* Optional: The "Active Dot" on the right side */}
    {step === i && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
        <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse shadow-sm" />
      </div>
    )}
  </button>
</li>
          ))}
        </ul>
        <div className="mt-8 pt-4 border-t-2 border-slate-200">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Status Legend</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-slate-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-slate-600">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-300"></div>
              <span className="text-slate-600">Pending</span>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t-2 border-slate-200">
          <div className="text-xs text-slate-600 space-y-1">
            <p>
              <strong>Progress:</strong> {step + 1} of {steps.length}
            </p>
            <p className="text-slate-500">
              {"Next: " + (step < steps.length - 1 ? steps[step + 1] : "Complete")}
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN PANEL */}
      <section className="relative z-10 flex-1 p-6 sm:p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/80 backdrop-blur-2xl border border-purple-200/60 shadow-2xl flex flex-col animate-in fade-in slide-in-from-right-4 duration-700" role="region" aria-label={assessmentMode === "manual" ? `Step ${step + 1} of ${steps.length}: ${steps[step]}` : "Batch Assessment"}>
        
        {/* Assessment Mode Toggle */}
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200">
          <p className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Assessment Mode</p>
          <div className="flex gap-3">
            <button
              onClick={() => setAssessmentMode("manual")}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                assessmentMode === "manual"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-white text-slate-600 border-2 border-slate-200 hover:border-purple-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Manual Entry
            </button>
            <button
              onClick={() => setAssessmentMode("batch")}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                assessmentMode === "batch"
                  ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg"
                  : "bg-white text-slate-600 border-2 border-slate-200 hover:border-green-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload CSV (Batch)
            </button>
          </div>
        </div>

        {/* Manual Assessment Mode */}
        {assessmentMode === "manual" && (
          <>
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-600">Progress</span>
                <span className="text-sm font-bold text-purple-600">{Math.round(((step + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full overflow-hidden shadow-inner border-2 border-slate-400">
                <div
                  className="h-full transition-all duration-500 ease-out shadow-lg" style={{
                    backgroundImage: 'linear-gradient(90deg, #ecc5e1 0%, #d4a6e8 50%, #92c5f0 100%)',
                    width: `${((step + 1) / steps.length) * 100}%`
                  }}
                />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight animate-in fade-in slide-in-from-top-2 duration-500">
              {steps[step]}
            </h1>

            <div className="flex-1 overflow-y-auto">
              {step === 0 && <Step1 form={form} updateField={updateField} />}
              {step === 1 && <Step2 form={form} updateField={updateField} />}
              {step === 2 && <Step3 form={form} updateField={updateField} phq9Score={phq9Score} phq9Severity={phq9Severity} />}
              {step === 3 && <Step4 form={form} updateField={updateField} />}
              {step === 4 && (
                <Step5
                  form={form}
                  phq9Score={phq9Score}
                  submitPrediction={submitPrediction}
                  loading={loading}
                  prediction={prediction}
                  startNewPrediction={startNewPrediction}
                  editInformation={editInformation}
                />
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              <button
                onClick={goBack}
                disabled={step === 0}
                className="px-6 py-3 rounded-2xl font-semibold border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 bg-white text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                ← Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={goNext}
                  className="px-6 py-3 rounded-2xl font-semibold border-2 transition-all duration-200 hover:scale-105 active:scale-95 text-slate-800 border-purple-300 hover:shadow-lg" style={{
                    backgroundImage: 'linear-gradient(180deg, #fce7f3 0%, #e9d5ff 50%, #bfdbfe 100%)',
                  }}
                >
                  Next →
                </button>
              ) : null}
            </div>
          </>
        )}

        {/* Batch Assessment Mode */}
        {assessmentMode === "batch" && (
          <div className="flex-1 overflow-y-auto space-y-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent leading-tight animate-in fade-in slide-in-from-top-2 duration-500">
              Batch Assessment
            </h1>
            
            <p className="text-slate-700 mb-6">
              Upload a CSV file exported from Google Forms to assess multiple individuals at once. 
              Each row should contain the same fields as the manual assessment form.
            </p>

            {/* CSV Format Guide */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-300">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-blue-800">Expected CSV Format</h3>
              </div>
              <p className="text-sm text-slate-700 mb-3">Your CSV should include columns matching these fields:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {["age", "education_level", "family_type", "number_of_pregnancies", "pregnancy_length", 
                  "history_of_pregnancy_loss", "pregnancy_complications", "fear_pregnancy", "major_changes",
                  "depression_history", "relationship_husband", "relationship_inlaws", "family_support",
                  "feeling_motherhood", "trust_share_feelings", "worry_newborn", "breastfeed", "abuse",
                  "phq9_q1", "phq9_q2", "phq9_q3", "phq9_q4", "phq9_q5", "phq9_q6", "phq9_q7", "phq9_q8", "phq9_q9"
                ].map(field => (
                  <code key={field} className="bg-white px-2 py-1 rounded border border-blue-200 text-blue-700">{field}</code>
                ))}
              </div>
            </div>

            {/* File Upload Area */}
            <div
              onClick={() => batchFileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 relative ${
                batchFile 
                  ? "border-green-400 bg-green-50/50" 
                  : "border-purple-300 hover:border-purple-500 hover:bg-purple-50/30"
              }`}
            >
              <input
                ref={batchFileInputRef}
                type="file"
                accept=".csv"
                onChange={handleBatchFileChange}
                className="hidden"
              />
              
              {batchFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center border-2 border-green-300">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-green-800">{batchFile.name}</p>
                    <p className="text-sm text-green-600">{(batchFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearBatchAssessment();
                    }}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center border-2 border-purple-300">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Drop your CSV file here</p>
                    <p className="text-sm text-slate-600">or click to browse</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {batchError && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800">{batchError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={submitBatchAssessment}
              disabled={!batchFile || batchProcessing}
              className="w-full font-bold py-4 px-6 rounded-2xl hover:shadow-2xl active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-lg border-2 border-green-300 text-white bg-gradient-to-r from-green-500 to-teal-500"
            >
              {batchProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing {batchFile?.name}...
                </span>
              ) : (
                "🚀 Run Batch Assessment"
              )}
            </button>

            {/* Batch Results */}
            {batchResults && (
              <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl border-2 border-purple-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📊</span>
                    <h2 className="text-2xl font-bold text-slate-800">Batch Results</h2>
                  </div>
                  <span className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-xl border border-green-300">
                    {batchResults.length} Assessments
                  </span>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {["high", "medium", "low"].map((level) => {
                    const count = batchResults.filter(r => r.predicted_label.toLowerCase() === level).length;
                    const percentage = ((count / batchResults.length) * 100).toFixed(1);
                    const colors = {
                      high: "bg-red-50 border-red-300 text-red-700",
                      medium: "bg-yellow-50 border-yellow-300 text-yellow-700",
                      low: "bg-green-50 border-green-300 text-green-700"
                    };
                    return (
                      <div key={level} className={`p-4 rounded-2xl border-2 ${colors[level as keyof typeof colors]}`}>
                        <p className="text-2xl font-black">{count}</p>
                        <p className="text-sm font-semibold capitalize">{level} Risk</p>
                        <p className="text-xs opacity-75">{percentage}%</p>
                      </div>
                    );
                  })}
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border-2 border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-slate-700">#</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-700">Age</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-700">Risk Level</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-700">Confidence</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {batchResults.map((result, idx) => (
                        <tr key={idx} className={`${result.status === "failed" ? "bg-red-50" : "hover:bg-slate-50"}`}>
                          <td className="px-4 py-3 font-semibold">{result.row_index + 1}</td>
                          <td className="px-4 py-3">{result.input_data?.age || "N/A"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                              result.predicted_label.toLowerCase() === "high" 
                                ? "bg-red-100 text-red-700"
                                : result.predicted_label.toLowerCase() === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : result.predicted_label.toLowerCase() === "low"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-700"
                            }`}>
                              {result.predicted_label.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {result.probabilities ? (
                              `${(Math.max(...Object.values(result.probabilities)) * 100).toFixed(0)}%`
                            ) : "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            {result.status === "success" ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600" title={result.error}>✗</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* New Batch Button */}
                <button
                  onClick={clearBatchAssessment}
                  className="mt-6 w-full py-3 px-6 rounded-2xl font-semibold bg-white text-purple-600 border-2 border-purple-300 hover:bg-purple-50 transition-all duration-200"
                >
                  🔄 Start New Batch Assessment
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

// -----

function Step1({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl">
        <p className="text-sm text-slate-700">Quick Assessment: Only ~20 questions needed for accurate risk assessment</p>
      </div>
      {/* Personal Details */}
      <div className="p-6 bg-gradient-to-br from-blue-50/90 via-purple-50/80 to-pink-50/90 rounded-2xl border-2 border-blue-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-300">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-700">Personal Details</h3>
            <p className="text-xs text-slate-600">Tell us about yourself</p>
          </div>
        </div>
        <div className="space-y-5">
          <Input
            label="Your Age"
            value={form.age}
            onChange={(v: string) => updateField("age", v)}
          />
          <SelectNew
            label="Education Level"
            value={form.education_level}
            options={options.education_level}
            onChange={(v: string) => updateField("education_level", v)}
          />
          <SelectNew
            label="Family Type"
            value={form.family_type}
            options={options.family_type}
            onChange={(v: string) => updateField("family_type", v)}
          />
        </div>
      </div>
    </div>
  );
}

function Step2({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      {/* Pregnancy Details */}
      <div className="p-6 bg-gradient-to-br from-pink-50/90 via-rose-50/80 to-purple-50/90 rounded-2xl border-2 border-rose-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-200 flex items-center justify-center border border-rose-400">
            <svg className="w-5 h-5 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-800">Pregnancy Details</h3>
            <p className="text-xs text-slate-700">Information about your pregnancy</p>
          </div>
        </div>
        <div className="space-y-5">
          <Input
            label="Number of Pregnancies"
            value={form.number_of_pregnancies}
            onChange={(v: string) => updateField("number_of_pregnancies", v)}
          />
          <SelectNew
            label="Pregnancy Length"
            value={form.pregnancy_length}
            options={options.pregnancy_length}
            onChange={(v: string) => updateField("pregnancy_length", v)}
          />
        </div>
      </div>

      {/* Risk Factors */}
      <div className="p-6 bg-gradient-to-br from-orange-50/90 via-amber-50/80 to-yellow-50/90 rounded-2xl border-2 border-orange-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-200 flex items-center justify-center border border-orange-400">
            <svg className="w-5 h-5 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-orange-800">Risk Factors</h3>
            <p className="text-xs text-slate-700">Important health indicators</p>
          </div>
        </div>
        <div className="space-y-5">
          <YesNoSelect
            label="History of pregnancy loss?"
            value={form.history_of_pregnancy_loss}
            onChange={(v: string) => updateField("history_of_pregnancy_loss", v)}
          />
          <YesNoSelect
            label="Complications during pregnancy?"
            value={form.pregnancy_complications}
            onChange={(v: string) => updateField("pregnancy_complications", v)}
          />
          <YesNoSelect
            label="Fear or anxiety about pregnancy?"
            value={form.fear_pregnancy}
            onChange={(v: string) => updateField("fear_pregnancy", v)}
          />
          <YesNoSelect
            label="Major changes or losses during pregnancy?"
            value={form.major_changes}
            onChange={(v: string) => updateField("major_changes", v)}
          />
        </div>
      </div>
    </div>
  );
}

function Step3({ form, updateField, phq9Score, phq9Severity }: any) {
  return (
    <div className="space-y-6">
      {/* PHQ-9 Header */}
      <div className="p-5 bg-gradient-to-br from-purple-50/90 via-pink-50/85 to-blue-50/90 rounded-2xl border-2 border-purple-200 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-200 flex items-center justify-center border border-fuchsia-400">
            <svg className="w-5 h-5 text-fuchsia-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-fuchsia-800">PHQ-9 Depression Screening</h3>
            <p className="text-xs text-slate-700">Standard validated instrument</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-700 bg-fuchsia-50 p-3 rounded-lg border border-fuchsia-200">
        Over the past <strong>2 weeks</strong>, how often have you been bothered by any of the following problems?
      </p>

      {/* PHQ-9 Questions */}
      <div className="space-y-4">
        {PHQ9_QUESTIONS.map((question, index) => (
          <div key={index} className="p-4 bg-white/70 rounded-2xl border-2 border-purple-100 hover:border-purple-300 transition-all duration-200 hover:shadow-md">
            <p className="text-sm font-semibold text-slate-800 mb-3">{index + 1}. {question}</p>
            <div className="flex gap-2">
              {PHQ9_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField(`phq9_q${index + 1}`, opt.value)}
                  className={`flex-1 text-xs py-2 px-2 rounded-lg font-semibold transition-all duration-200 border-2 ${
                    form[`phq9_q${index + 1}`] === opt.value
                      ? "bg-purple-500 text-white border-purple-600"
                      : "bg-white text-slate-700 border-slate-200 hover:border-purple-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* PHQ-9 Score Display */}
      <div className="p-5 bg-gradient-to-br from-blue-50/90 via-purple-50/80 to-pink-50/90 rounded-2xl border-2 border-purple-200 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">PHQ-9 Total Score</p>
          <p className="text-2xl font-bold text-purple-600">{phq9Score}/27</p>
        </div>
        <span className={`px-4 py-2 rounded-full font-bold border-2 ${phq9Severity.color}`}>
          {phq9Severity.label}
        </span>
      </div>

      {/* Depression History */}
      <div className="p-6 bg-gradient-to-br from-pink-50/90 via-purple-50/85 to-blue-50/90 rounded-2xl border-2 border-pink-200/70 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-200 flex items-center justify-center border border-rose-400">
            <svg className="w-5 h-5 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-800">Depression History</h3>
            <p className="text-xs text-slate-700">Important risk factor</p>
          </div>
        </div>
        <div className="mt-4">
          <YesNoSelect
            label="Have you experienced depression before or during this pregnancy?"
            value={form.depression_history}
            onChange={(v: string) => updateField("depression_history", v)}
          />
        </div>
      </div>
    </div>
  );
}

function Step4({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      {/* Relationships */}
      <div className="p-6 bg-gradient-to-br from-pink-50/85 via-purple-50/90 to-blue-50/85 rounded-2xl border-2 border-purple-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-200 flex items-center justify-center border border-red-400">
            <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800">Relationships</h3>
            <p className="text-xs text-slate-700">Family connections and dynamics</p>
          </div>
        </div>
        <div className="space-y-5">
          <SelectNew
            label="Relationship with Husband"
            value={form.relationship_husband}
            options={options.relationship}
            onChange={(v: string) => updateField("relationship_husband", v)}
          />
          <SelectNew
            label="Relationship with In-laws"
            value={form.relationship_inlaws}
            options={options.relationship}
            onChange={(v: string) => updateField("relationship_inlaws", v)}
          />
        </div>
      </div>

      {/* Support System */}
      <div className="p-6 bg-gradient-to-br from-blue-50/90 via-purple-50/80 to-pink-50/90 rounded-2xl border-2 border-blue-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-200 flex items-center justify-center border border-sky-400">
            <svg className="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-sky-800">Support System</h3>
            <p className="text-xs text-slate-700">Available support and connections</p>
          </div>
        </div>
        <div className="space-y-5">
          <SelectNew
            label="Level of Family Support"
            value={form.family_support}
            options={options.family_support}
            onChange={(v: string) => updateField("family_support", v)}
          />
          <SelectNew
            label="Feeling about Motherhood"
            value={form.feeling_motherhood}
            options={options.feeling_motherhood}
            onChange={(v: string) => updateField("feeling_motherhood", v)}
          />
          <YesNoSelect
            label="Can you trust and share feelings with someone?"
            value={form.trust_share_feelings}
            onChange={(v: string) => updateField("trust_share_feelings", v)}
          />
        </div>
      </div>

      {/* Newborn & Lifestyle */}
      <div className="p-6 bg-gradient-to-br from-purple-50/90 via-pink-50/85 to-blue-50/85 rounded-2xl border-2 border-purple-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-200 flex items-center justify-center border border-teal-400">
            <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-teal-800">Newborn & Lifestyle</h3>
            <p className="text-xs text-slate-700">Baby care and personal wellbeing</p>
          </div>
        </div>
        <div className="space-y-5">
          <YesNoSelect
            label="Worry about your newborn's health?"
            value={form.worry_newborn}
            onChange={(v: string) => updateField("worry_newborn", v)}
          />
          <YesNoSelect
            label="Currently breastfeeding?"
            value={form.breastfeed}
            onChange={(v: string) => updateField("breastfeed", v)}
          />
        </div>
      </div>

      {/* Confidential Question */}
      <div className="p-6 bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-yellow-50/90 rounded-2xl border-2 border-amber-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center border border-amber-400">
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-800">Confidential Question</h3>
            <p className="text-xs text-amber-600">Your response is encrypted and confidential</p>
          </div>
        </div>
        <p className="text-xs text-amber-700 mb-4 bg-amber-100 p-2 rounded-lg">You may skip this question if you prefer not to answer.</p>
        <YesNoSelectOptional
          label="Have you experienced abuse?"
          value={form.abuse}
          onChange={(v: string) => updateField("abuse", v)}
        />
      </div>
    </div>
  );
}

function Step5({ form, phq9Score, submitPrediction, loading, prediction, startNewPrediction, editInformation }: any) {
  const filledFields = Object.values(form).filter(v => v !== "").length;
  const totalFields = Object.keys(form).length;
  const completionRate = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="space-y-10">
      {/* Completion Status */}
      {!prediction && (
        <div className="p-4 bg-gradient-to-r from-blue-50/80 via-purple-50/70 to-pink-50/80 border-2 border-purple-300 rounded-2xl">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-bold text-slate-800">Form Completion: {completionRate}%</p>
              <p className="text-sm text-slate-600">{filledFields} of {totalFields} fields completed</p>
            </div>
          </div>
        </div>
      )}

      {/* Review Section with Category Badges */}
      <div className="p-8 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 rounded-3xl border-2 border-blue-300 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center border-2 border-blue-300">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">Review Your Inputs</h2>
              <p className="text-sm text-slate-600">Verify your information before prediction</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-blue-100 border border-blue-300 rounded-xl">
            <span className="text-blue-700 font-bold text-sm">{Object.keys(form).length} Fields</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" role="list" aria-label="Review of submitted information">
          {Object.entries(form).map(([key, value], index) => (
            <div
              key={key}
              className="group p-4 sm:p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-300 hover:border-blue-400 transition-all duration-300 hover:bg-blue-50 shadow-sm hover:shadow-md motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02] transform animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${index * 30}ms` }}
              role="listitem"
            >
              <p className="text-slate-700 text-xs font-semibold uppercase tracking-wider mb-1.5 group-hover:text-blue-700 transition-colors duration-300">{formatKey(key)}</p>
              <p className="text-slate-900 text-base sm:text-lg font-bold transition-colors duration-300 group-hover:text-blue-800">
                {String(value) || <span className="text-slate-500 italic">Not provided</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in zoom-in-50 duration-700 delay-300">
        {!prediction && (
          <button
            onClick={submitPrediction}
            disabled={loading}
            className="w-full font-bold py-4 px-6 rounded-2xl hover:shadow-2xl active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-lg border-2 border-purple-300 text-slate-800" style={{
              backgroundImage: 'linear-gradient(180deg, #fce7f3 0%, #e9d5ff 50%, #bfdbfe 100%)',
            }}
          >
            {loading ? "Analyzing..." : "Get Risk Assessment"}
          </button>
        )}
        <div className="flex justify-center">
          {prediction && (
            <div className="flex gap-4">
              <button
                onClick={editInformation}
                className="px-6 py-3 font-semibold rounded-2xl hover:shadow-lg transition-all duration-200 active:scale-95 text-slate-800 border-2 border-purple-300" style={{
                  backgroundImage: 'linear-gradient(180deg, #fce7f3 0%, #e9d5ff 50%, #bfdbfe 100%)',
                }}
              >
                ✏️ Edit Information
              </button>
              <button
                onClick={startNewPrediction}
                className="px-6 py-3 font-semibold rounded-2xl hover:shadow-lg transition-all duration-200 active:scale-95 text-slate-800 border-2 border-purple-300" style={{
                  backgroundImage: 'linear-gradient(180deg, #fce7f3 0%, #e9d5ff 50%, #bfdbfe 100%)',
                }}
              >
                🔄 New Assessment
              </button>
            </div>
          )}
        </div>
        {!prediction && (
          <p className="text-center text-sm text-slate-600">
            All information is processed securely and used only for your assessment.
          </p>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && !prediction && (
        <div className="mt-10 p-8 bg-gradient-to-br from-cyan-100 to-purple-100 rounded-3xl border-2 border-cyan-300 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-200 animate-pulse" />
            <p className="font-bold text-slate-700">AI is analyzing your responses...</p>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      )}

      {prediction && (
        <div className="mt-10 p-8 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 rounded-3xl border-2 border-purple-300 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-700">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🎯</span>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Risk Assessment Results</h2>
          </div>

          {prediction.error ? (
            <div className="flex items-start gap-4 p-6 bg-red-50 border-2 border-red-300 rounded-2xl animate-in shake duration-500">
              <span className="text-3xl">⚠️</span>
              <div>
                <p className="font-bold text-red-700">Assessment Error</p>
                <p className="text-sm text-red-600 mt-1">{prediction.error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Risk Level Card */}
              <div className={`mb-6 p-8 rounded-3xl border-3 shadow-2xl ${
                prediction.risk_level === "high" || prediction.risk_level === "High"
                  ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-400"
                  : prediction.risk_level === "medium" || prediction.risk_level === "Medium"
                    ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400"
                    : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-400"
              }`}>
                <p className="text-center text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Your Risk Level</p>
                <p className={`text-center text-5xl font-black mb-4 ${
                  prediction.risk_level === "high" || prediction.risk_level === "High"
                    ? "text-red-600"
                    : prediction.risk_level === "medium" || prediction.risk_level === "Medium"
                      ? "text-yellow-600"
                      : "text-green-600"
                }`}>
                  {getRiskLabel(prediction.risk_level || "")}
                </p>
                <p className="text-center text-slate-700 font-semibold">
                  {prediction.risk_level === "high" || prediction.risk_level === "High"
                    ? "We recommend consulting with a healthcare professional."
                    : prediction.risk_level === "medium" || prediction.risk_level === "Medium"
                      ? "Continue monitoring your mental health. Professional support is recommended."
                      : "Keep maintaining healthy habits and support systems."}
                </p>
              </div>

              {prediction.probabilities && (
                <div className="mb-6 p-6 bg-white/70 rounded-3xl border-2 border-purple-200 shadow-lg">
                  <p className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Confidence Scores</p>
                  <div className="space-y-3">
                    {Object.entries(prediction.probabilities)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([label, prob]) => (
                        <div key={label}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-slate-700">{getRiskLabel(label)}</span>
                            <span className="font-bold text-slate-800">{((prob as number) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                label.toLowerCase() === "high"
                                  ? "bg-red-500"
                                  : label.toLowerCase() === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${(prob as number) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {prediction.accuracy && (
                <div className="mb-6 p-6 bg-white/70 rounded-3xl border-2 border-blue-200 shadow-lg">
                  <p className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Model Accuracy</p>
                  <p className="text-2xl font-bold text-blue-600">{prediction.accuracy}</p>
                  <p className="text-xs text-slate-600 mt-1">Based on ensemble of ML models trained on clinical data</p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl">
                <p className="text-xs text-amber-800">
                  <strong>Disclaimer:</strong> This assessment is for informational purposes only and should not replace professional medical advice. Please consult a qualified healthcare provider for proper diagnosis and treatment.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// UI COMPONENTS
function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isFilled = value !== "";
  const inputId = `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="group animate-in fade-in slide-in-from-left-2 duration-500 relative">
      <label htmlFor={inputId} className="block mb-2.5 text-sm font-semibold text-slate-800 tracking-wide uppercase text-xs transition-colors duration-300 group-focus-within:text-blue-700 flex items-center gap-2">
        {label}
        {isFilled && (
          <span className="text-green-500 font-bold">✓</span>
        )}
      </label>
      <input
        id={inputId}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full min-h-[44px] px-4 py-3 sm:py-3.5 text-base sm:text-base border-2 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-200 transition-all duration-300 hover:border-slate-500 motion-safe:focus:scale-[1.02] transform ${
          isFilled ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50" : "border-purple-300 bg-gradient-to-r from-blue-50/80 via-purple-50/70 to-pink-50/80"
        }`}
        placeholder="Enter value"
        aria-required="true"
        aria-invalid={!isFilled && value === "" ? "false" : "false"}
      />
    </div>
  );
}

function SelectNew({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const isFilled = value !== "";
  const selectId = `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="group animate-in fade-in slide-in-from-left-2 duration-500">
      <label htmlFor={selectId} className="block mb-2.5 text-sm font-semibold text-slate-800 tracking-wide uppercase text-xs transition-colors duration-300 group-focus-within:text-blue-700 flex items-center gap-2">
        {label}
        {isFilled && (
          <span className="text-green-500 font-bold">✓</span>
        )}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full min-h-[44px] px-4 py-3 sm:py-3.5 text-base border-2 rounded-2xl cursor-pointer focus:outline-none focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-200 transition-all duration-300 hover:border-slate-500 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgb(147 51 234)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[position:right_0.75rem_center] bg-no-repeat pr-10 ${
          isFilled ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-slate-900" : "border-purple-300 bg-gradient-to-r from-blue-50/80 via-purple-50/70 to-pink-50/80 text-slate-700"
        }`}
      >
        <option value="">Select an option</option>
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Yes/No Select component
function YesNoSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isFilled = value !== "";
  return (
    <div className="group animate-in fade-in slide-in-from-left-2 duration-500">
      <label className="block mb-2.5 text-sm font-semibold text-slate-800 tracking-wide uppercase text-xs transition-colors duration-300 flex items-center gap-2">
        {label}
        {isFilled && (
          <span className="text-green-500 font-bold">✓</span>
        )}
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange("yes")}
          className={`flex-1 min-h-[44px] py-3 rounded-2xl border-2 font-semibold transition-all duration-200 ${
            value === "yes"
              ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 shadow-md"
              : "border-purple-200 bg-white/80 text-slate-600 hover:border-purple-400 hover:bg-purple-50"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange("no")}
          className={`flex-1 min-h-[44px] py-3 rounded-2xl border-2 font-semibold transition-all duration-200 ${
            value === "no"
              ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 shadow-md"
              : "border-purple-200 bg-white/80 text-slate-600 hover:border-purple-400 hover:bg-purple-50"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

// Yes/No/Skip Select component for sensitive questions
function YesNoSelectOptional({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="group animate-in fade-in slide-in-from-left-2 duration-500">
      <label className="block mb-2.5 text-sm font-semibold text-amber-800 tracking-wide uppercase text-xs">
        {label}
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange("no")}
          className={`flex-1 min-h-[44px] py-3 rounded-2xl border-2 font-semibold transition-all duration-200 ${
            value === "no"
              ? "border-green-500 bg-green-50 text-green-700 shadow-md"
              : "border-amber-200 bg-white/80 text-slate-600 hover:border-amber-400"
          }`}
        >
          No
        </button>
        <button
          type="button"
          onClick={() => onChange("yes")}
          className={`flex-1 min-h-[44px] py-3 rounded-2xl border-2 font-semibold transition-all duration-200 ${
            value === "yes"
              ? "border-amber-500 bg-amber-50 text-amber-700 shadow-md"
              : "border-amber-200 bg-white/80 text-slate-600 hover:border-amber-400"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange("")}
          className={`flex-1 min-h-[44px] py-3 rounded-2xl border-2 font-semibold transition-all duration-200 ${
            value === ""
              ? "border-slate-400 bg-slate-100 text-slate-700 shadow-md"
              : "border-amber-200 bg-white/80 text-slate-500 hover:border-amber-400"
          }`}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// Format utility function
function formatKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
