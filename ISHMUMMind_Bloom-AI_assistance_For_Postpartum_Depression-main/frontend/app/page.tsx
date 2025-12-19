"use client";

import React, { useState, useEffect } from "react";

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
  "Basic Information",
  "Education & Family",
  "Pregnancy Experience",
  "Mental Health (PHQ-9)",
  "Support & Emotions",
  "Newborn & Parenting",
  "Review & Predict",
];

// -----------------------------------------------------
// COMPREHENSIVE FORM STATE (All Required Fields)
// -----------------------------------------------------
const initialForm = {
  // Step 1: Basic Information
  age: "",
  residence: "",
  education_level: "",
  marital_status: "",
  family_type: "",

  // Step 2: Education and Family
  husband_education_level: "",
  husband_monthly_income: "",
  occupation_before_latest_pregnancy: "",
  monthly_income_before_latest_pregnancy: "",
  occupation_after_your_latest_childbirth: "",
  current_monthly_income: "",

  // Step 3: Pregnancy Experience
  number_of_pregnancies: "",
  pregnancy_length: "",
  history_of_pregnancy_loss: "",
  pregnancy_complications: "",
  fear_pregnancy: "",
  major_changes: "",
  pregnancy_plan: "",
  mode_of_delivery: "",
  birth_compliancy: "",
  regular_checkups: "",

  // Step 4: PHQ-9 (9 sub-questions + 1)
  phq9_q1: 0, phq9_q2: 0, phq9_q3: 0,
  phq9_q4: 0, phq9_q5: 0, phq9_q6: 0,
  phq9_q7: 0, phq9_q8: 0, phq9_q9: 0,
  depression_history: "",

  // Step 5: Support & Emotions
  relationship_husband: "",
  relationship_inlaws: "",
  family_support: "",
  feeling_motherhood: "",
  trust_share_feelings: "",
  addiction: "",
  abuse: "",

  // Step 6: Newborn & Parenting
  worry_newborn: "",
  breastfeed: "",
  age_of_newborn: "",
  gender_of_newborn: "",
  relationship_with_the_newborn: "",
  newborn_illness: "",
  total_children: "",
  age_of_immediate_older_children: "",
  angry_after_latest_child_birth: "",
  relationship_between_father_and_newborn: "",
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
// CATEGORY OPTIONS (COMPREHENSIVE)
// -----------------------------------------------------
const options = {
  residence: [
    { value: "City", label: "City" },
    { value: "Village", label: "Village" },
  ],
  education_level: [
    { value: "Primary School", label: "Primary School" },
    { value: "High School", label: "High School" },
    { value: "College", label: "College" },
    { value: "University", label: "University" },
    { value: "Nan", label: "Prefer not to say" },
  ],
  marital_status: [
    { value: "Married", label: "Married" },
    { value: "Divorced", label: "Divorced" },
  ],
  family_type: [
    { value: "Nuclear", label: "Nuclear Family" },
    { value: "Joint", label: "Joint Family" },
  ],
  occupation: [
    { value: "Housewife", label: "Housewife" },
    { value: "Teacher", label: "Teacher" },
    { value: "Doctor", label: "Doctor" },
    { value: "Business", label: "Business" },
    { value: "Service", label: "Service" },
    { value: "Student", label: "Student" },
    { value: "Other", label: "Other" },
  ],
  income: [
    { value: "Less Than 5000", label: "Less Than 5000" },
    { value: "5000 To 10000", label: "5000 To 10000" },
    { value: "10000 To 20000", label: "10000 To 20000" },
    { value: "20000 To 30000", label: "20000 To 30000" },
    { value: "More Than 30000", label: "More Than 30000" },
    { value: "Nan", label: "Prefer not to say" },
  ],
  pregnancy_length: [
    { value: "10 Months", label: "Full term (10 months)" },
    { value: "9 Months", label: "9 months" },
    { value: "8 Months", label: "8 months" },
    { value: "7 Months", label: "7 months" },
    { value: "6 Months", label: "6 months" },
    { value: "Less Than 5 Months", label: "Less than 5 months (premature)" },
  ],
  history_loss: [
    { value: "Nan", label: "None" },
    { value: "Miscarriage", label: "Miscarriage" },
    { value: "Still-Born Delivery", label: "Still-Born Delivery" },
  ],
  mode_delivery: [
    { value: "Normal Delivery", label: "Normal Delivery" },
    { value: "Caesarean Section", label: "Caesarean Section" },
  ],
  relationship: [
    { value: "Very Good", label: "Very Good" },
    { value: "Good", label: "Good" },
    { value: "Neutral", label: "Neutral" },
    { value: "Bad", label: "Bad" },
    { value: "Poor", label: "Poor" },
    { value: "Friendly", label: "Friendly" },
  ],
  family_support: [
    { value: "High", label: "High Support" },
    { value: "Medium", label: "Medium Support" },
    { value: "Low", label: "Low Support" },
  ],
  feeling_motherhood: [
    { value: "Happy", label: "Happy & Excited" },
    { value: "Neutral", label: "Neutral / Mixed" },
    { value: "Sad", label: "Sad / Overwhelmed" },
  ],
  addiction: [
    { value: "Nan", label: "None" },
    { value: "Smoking", label: "Smoking" },
    { value: "Drinking", label: "Drinking" },
    { value: "Drugs", label: "Drugs" },
  ],
  age_newborn: [
    { value: "0 To 6 Months", label: "0 To 6 Months" },
    { value: "6 Months To 1 Year", label: "6 Months To 1 Year" },
    { value: "1 Year To 1.5 Year", label: "1 Year To 1.5 Year" },
    { value: "Older Than 1.5 Year", label: "Older Than 1.5 Year" },
  ],
  gender: [
    { value: "Boy", label: "Boy" },
    { value: "Girl", label: "Girl" },
  ],
  total_children: [
    { value: "One", label: "One" },
    { value: "Two", label: "Two" },
    { value: "More Than Two", label: "More Than Two" },
  ],
  age_older_children: [
    { value: "Nan", label: "No older children" },
    { value: "1Yr To 3Yr", label: "1 To 3 Years" },
    { value: "4Yr To 6Yr", label: "4 To 6 Years" },
    { value: "7Yr To 12Yr", label: "7 To 12 Years" },
    { value: "13Yr Or More", label: "13 Years Or More" },
  ],
  yesno: [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ],
  yesno_nan: [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
    { value: "Nan", label: "Prefer not to say" },
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
export default function Page() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

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
    } catch {
      setPrediction({ error: "Failed to connect to backend" });
    }

    setLoading(false);
  };


    

  // Generate firefly positions only on client-side to avoid hydration mismatch
  const [fireflies, setFireflies] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string; size: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string}>>([]);

  // Generate fireflies and stars only on client
  useEffect(() => {
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
      {/* SIDEBAR */}
      <aside className="relative z-10 w-full lg:w-72 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-100/90 via-purple-50/80 to-pink-100/90 backdrop-blur-2xl border border-blue-200/60 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700" role="navigation" aria-label="Assessment steps navigation">
        <div className="mb-8 sm:mb-10 p-5 sm:p-6 bg-gradient-to-br from-blue-100/80 via-purple-100/70 to-pink-100/80 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-blue-200/60 hover:border-purple-300/70 group">
          <div className="flex flex-col items-center gap-3">
            {/* Brand Logo Image - Placeholder for future use */}
            {/* <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 animate-in zoom-in-50 duration-700 hover:scale-110 transition-all duration-500 flex-shrink-0">
              <img 
                src="/logo.svg" 
                alt="Mind-Bloom Logo" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div> */}
            
            {/* Brand Title */}
            <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl font-black animate-in fade-in zoom-in-50 duration-700 hover:scale-105 transition-all duration-500 cursor-default break-words px-2" style={{ 
              fontFamily: '"League Spartan", sans-serif',
              letterSpacing: '0.08em',
              backgroundImage: 'linear-gradient(180deg, #d896e8 0%, #ff69d9 50%, #4d0048 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))',
              WebkitFilter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))',
              wordBreak: 'break-word',
              hyphens: 'auto'
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
                    ? "bg-gradient-to-r from-blue-100/90 via-purple-100/80 to-pink-100/90 border-2 border-purple-400 text-purple-800 shadow-lg shadow-purple-200/30 scale-105 animate-in fade-in slide-in-from-left-2 duration-500"
                    : step > i
                    ? "bg-green-50 border-2 border-green-400 hover:bg-green-100 text-green-800"
                    : "bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-300 hover:scale-102 hover:shadow-md text-slate-700"
                }`}
                aria-label={`${step > i ? 'Completed: ' : step === i ? 'Current step: ' : 'Go to '}${s}`}
                aria-current={step === i ? "step" : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                    step === i 
                      ? "bg-blue-600 text-white" 
                      : step > i
                      ? "bg-green-600 text-white"
                      : "bg-slate-400 text-white"
                  }`} aria-hidden="true">
                    {step > i ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`font-semibold text-sm sm:text-base transition-colors duration-300 flex-1 ${
                    step === i ? "text-blue-800" : step > i ? "text-green-800" : "text-slate-700 group-hover:text-slate-900"
                  }`}>
                    {s}
                  </span>
                </div>
                {step === i && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 pt-4 border-t-2 border-slate-200">
          <div className="text-xs text-slate-600 space-y-1">
            <p className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-500" />
              <span>Completed</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-500" />
              <span>Current</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-slate-300" />
              <span>Pending</span>
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN PANEL */}
      <section className="relative z-10 flex-1 p-6 sm:p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/80 backdrop-blur-2xl border border-purple-200/60 shadow-2xl flex flex-col animate-in fade-in slide-in-from-right-4 duration-700" role="region" aria-label={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}>
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Progress</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(((step + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner mb-2">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-blue-500 scale-110' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight animate-in fade-in slide-in-from-top-2 duration-500">
          {steps[step]}
        </h1>

        <div className="flex-1 overflow-y-auto">
          {step === 0 && <Step1 form={form} updateField={updateField} />}
          {step === 1 && <Step2 form={form} updateField={updateField} />}
          {step === 2 && <Step3 form={form} updateField={updateField} />}
          {step === 3 && <Step4 form={form} updateField={updateField} phq9Score={phq9Score} phq9Severity={phq9Severity} />}
          {step === 4 && <Step5 form={form} updateField={updateField} />}
          {step === 5 && <Step6 form={form} updateField={updateField} />}
          {step === 6 && (
            <Step7
              form={form}
              phq9Score={phq9Score}
              loading={loading}
              prediction={prediction}
              submitPrediction={submitPrediction}
              startNewPrediction={startNewPrediction}
              editInformation={editInformation}
            />
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          {step > 0 ? (
            <button
              onClick={goBack}
              className="group min-h-[44px] px-6 sm:px-8 py-3 sm:py-3 bg-slate-100 rounded-2xl border-2 border-slate-300 hover:bg-slate-200 hover:border-slate-400 transition-all duration-300 font-medium text-slate-700 hover:text-slate-900 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 motion-safe:hover:-translate-x-1 transform"
              aria-label="Go to previous step"
            >
              <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true">←</span> Back
            </button>
          ) : (
            <div />
          )}

          {step < steps.length - 1 && (
            <button
              onClick={goNext}
              className="group min-h-[44px] px-6 sm:px-8 py-3 sm:py-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl text-white font-bold hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg shadow-purple-300/30 hover:shadow-xl hover:shadow-purple-300/40 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400 focus-visible:ring-offset-2 motion-safe:hover:translate-x-1 transform"
              aria-label={`Go to next step: ${steps[step + 1]}`}
            >
              Next <span className="inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

// -----------------------------------------------------
// STEP COMPONENTS (MINIMAL QUESTIONNAIRE)
// -----------------------------------------------------

function Step1({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl">
        <p className="text-sm text-slate-700"><span className="font-semibold">Basic Information:</span> Tell us about yourself</p>
      </div>
      {/* Basic Information */}
      <div className="p-6 bg-gradient-to-br from-blue-50/90 via-purple-50/80 to-pink-50/90 rounded-2xl border-2 border-blue-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-300">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-700">Personal Details</h3>
            <p className="text-xs text-slate-600">Basic demographic information</p>
          </div>
        </div>
        <div className="space-y-5">
          <Input
            label="Your Age"
            value={form.age}
            onChange={(v: string) => updateField("age", v)}
          />
          <SelectNew
            label="Residence"
            value={form.residence}
            options={options.residence}
            onChange={(v: string) => updateField("residence", v)}
          />
          <SelectNew
            label="Education Level"
            value={form.education_level}
            options={options.education_level}
            onChange={(v: string) => updateField("education_level", v)}
          />
          <SelectNew
            label="Marital Status"
            value={form.marital_status}
            options={options.marital_status}
            onChange={(v: string) => updateField("marital_status", v)}
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
      <div className="mb-4 p-3 bg-purple-50 border-l-4 border-purple-500 rounded-r-xl">
        <p className="text-sm text-slate-700"><span className="font-semibold">Education & Family:</span> Family and financial information</p>
      </div>
      {/* Occupation & Income */}
      <div className="p-6 bg-gradient-to-br from-purple-50/90 via-pink-50/80 to-blue-50/90 rounded-2xl border-2 border-purple-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-200 flex items-center justify-center border border-purple-400">
            <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-700">Your Occupation & Income</h3>
            <p className="text-xs text-slate-600">Employment and financial details</p>
          </div>
        </div>
        <div className="space-y-5">
          <SelectNew
            label="Occupation Before Latest Pregnancy"
            value={form.occupation_before_latest_pregnancy}
            options={options.occupation}
            onChange={(v: string) => updateField("occupation_before_latest_pregnancy", v)}
          />
          <SelectNew
            label="Monthly Income Before Latest Pregnancy"
            value={form.monthly_income_before_latest_pregnancy}
            options={options.income}
            onChange={(v: string) => updateField("monthly_income_before_latest_pregnancy", v)}
          />
          <SelectNew
            label="Occupation After Latest Childbirth"
            value={form.occupation_after_your_latest_childbirth}
            options={options.occupation}
            onChange={(v: string) => updateField("occupation_after_your_latest_childbirth", v)}
          />
          <SelectNew
            label="Current Monthly Income"
            value={form.current_monthly_income}
            options={options.income}
            onChange={(v: string) => updateField("current_monthly_income", v)}
          />
        </div>
      </div>

      {/* Husband Details */}
      <div className="p-6 bg-gradient-to-br from-blue-50/90 via-purple-50/80 to-pink-50/90 rounded-2xl border-2 border-blue-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-200 flex items-center justify-center border border-blue-400">
            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-700">Husband's Details</h3>
            <p className="text-xs text-slate-600">Partner's education and income</p>
          </div>
        </div>
        <div className="space-y-5">
          <SelectNew
            label="Husband's Education Level"
            value={form.husband_education_level}
            options={options.education_level}
            onChange={(v: string) => updateField("husband_education_level", v)}
          />
          <SelectNew
            label="Husband's Monthly Income"
            value={form.husband_monthly_income}
            options={options.income}
            onChange={(v: string) => updateField("husband_monthly_income", v)}
          />
        </div>
      </div>
    </div>
  );
}

function Step3({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      <div className="mb-4 p-3 bg-pink-50 border-l-4 border-pink-500 rounded-r-xl">
        <p className="text-sm text-slate-700"><span className="font-semibold">Pregnancy Experience:</span> Details about your pregnancy journey</p>
      </div>
      {/* Pregnancy Details */}
      <div className="p-6 bg-gradient-to-br from-pink-50/90 via-purple-50/80 to-blue-50/90 rounded-2xl border-2 border-pink-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-pink-200 flex items-center justify-center border border-pink-400">
            <svg className="w-5 h-5 text-pink-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-pink-800">Pregnancy Information</h3>
            <p className="text-xs text-slate-700">Basic pregnancy details</p>
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
          <SelectNew
            label="History of Pregnancy Loss"
            value={form.history_of_pregnancy_loss}
            options={options.history_loss}
            onChange={(v: string) => updateField("history_of_pregnancy_loss", v)}
          />
          <YesNoSelect
            label="Was this pregnancy planned?"
            value={form.pregnancy_plan}
            onChange={(v: string) => updateField("pregnancy_plan", v)}
          />
        </div>
      </div>

      {/* Pregnancy Experience */}
      <div className="p-6 bg-gradient-to-br from-blue-50/90 via-purple-50/70 to-pink-50/85 rounded-2xl border-2 border-blue-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-200 flex items-center justify-center border border-orange-400">
            <svg className="w-5 h-5 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-orange-800">Pregnancy Journey</h3>
            <p className="text-xs text-slate-700">Your experience during pregnancy</p>
          </div>
        </div>
        <div className="space-y-5">
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
          <YesNoSelect
            label="Regular checkups during pregnancy?"
            value={form.regular_checkups}
            onChange={(v: string) => updateField("regular_checkups", v)}
          />
        </div>
      </div>

      {/* Delivery Details */}
      <div className="p-6 bg-gradient-to-br from-purple-50/90 via-pink-50/85 to-blue-50/85 rounded-2xl border-2 border-purple-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-200 flex items-center justify-center border border-purple-400">
            <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-800">Delivery Information</h3>
            <p className="text-xs text-slate-700">Details about childbirth</p>
          </div>
        </div>
        <div className="space-y-5">
          <SelectNew
            label="Mode of Delivery"
            value={form.mode_of_delivery}
            options={options.mode_delivery}
            onChange={(v: string) => updateField("mode_of_delivery", v)}
          />
          <YesNoSelect
            label="Was the birth compliant (as expected)?"
            value={form.birth_compliancy}
            onChange={(v: string) => updateField("birth_compliancy", v)}
          />
        </div>
      </div>
    </div>
  );
}

function Step4({ form, updateField, phq9Score, phq9Severity }: any) {
  return (
    <div className="space-y-6">
      {/* PHQ-9 Header */}
      <div className="p-5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-200 flex items-center justify-center border border-fuchsia-400">
            <svg className="w-5 h-5 text-fuchsia-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-purple-800">PHQ-9 Depression Screening</h3>
            <p className="text-sm text-purple-600">Standard validated instrument</p>
          </div>
        </div>
        <p className="text-sm text-slate-700">
          Over the past <strong>2 weeks</strong>, how often have you been bothered by any of the following problems?
        </p>
      </div>

      {/* PHQ-9 Questions */}
      <div className="space-y-4">
        {PHQ9_QUESTIONS.map((question, index) => (
          <div key={index} className="p-4 bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/80 rounded-xl border-2 border-purple-100 shadow-sm hover:shadow-md transition-shadow">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-200 text-purple-700 text-xs font-bold mr-2">{index + 1}</span>
              {question}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PHQ9_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField(`phq9_q${index + 1}`, opt.value)}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 border-2 ${
                    form[`phq9_q${index + 1}`] === opt.value
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-md scale-105"
                      : "bg-white/80 text-slate-700 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
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
          <p className="text-sm text-purple-600 font-semibold">PHQ-9 Total Score</p>
          <p className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{phq9Score}/27</p>
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
        <YesNoSelect
          label="Have you experienced depression before or during this pregnancy?"
          value={form.depression_history}
          onChange={(v: string) => updateField("depression_history", v)}
        />
      </div>
    </div>
  );
}

function Step5({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
        <p className="text-sm text-slate-700"><span className="font-semibold">Support & Emotions:</span> Relationships and emotional wellbeing</p>
      </div>
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

      {/* Lifestyle & Habits */}
      <div className="p-6 bg-gradient-to-br from-purple-50/90 via-pink-50/85 to-blue-50/85 rounded-2xl border-2 border-purple-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-200 flex items-center justify-center border border-indigo-400">
            <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-indigo-800">Lifestyle & Habits</h3>
            <p className="text-xs text-slate-700">Personal habits and behaviors</p>
          </div>
        </div>
        <div className="space-y-5">
          <SelectNew
            label="Addiction (if any)"
            value={form.addiction}
            options={options.addiction}
            onChange={(v: string) => updateField("addiction", v)}
          />
        </div>
      </div>

      {/* Sensitive Question */}
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

function Step6({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      <div className="mb-4 p-3 bg-teal-50 border-l-4 border-teal-500 rounded-r-xl">
        <p className="text-sm text-slate-700"><span className="font-semibold">Newborn & Parenting:</span> Information about your baby and parenting</p>
      </div>
      {/* Newborn Details */}
      <div className="p-6 bg-gradient-to-br from-teal-50/90 via-cyan-50/80 to-blue-50/90 rounded-2xl border-2 border-teal-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-200 flex items-center justify-center border border-teal-400">
            <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-teal-800">Newborn Information</h3>
            <p className="text-xs text-slate-700">Details about your baby</p>
          </div>
        </div>
        <div className="space-y-5">
          <SelectNew
            label="Age of Newborn"
            value={form.age_of_newborn}
            options={options.age_newborn}
            onChange={(v: string) => updateField("age_of_newborn", v)}
          />
          <SelectNew
            label="Gender of Newborn"
            value={form.gender_of_newborn}
            options={options.gender}
            onChange={(v: string) => updateField("gender_of_newborn", v)}
          />
          <YesNoSelect
            label="Does the newborn have any illness?"
            value={form.newborn_illness}
            onChange={(v: string) => updateField("newborn_illness", v)}
          />
          <YesNoSelect
            label="Currently breastfeeding?"
            value={form.breastfeed}
            onChange={(v: string) => updateField("breastfeed", v)}
          />
          <YesNoSelect
            label="Worry about your newborn's health?"
            value={form.worry_newborn}
            onChange={(v: string) => updateField("worry_newborn", v)}
          />
        </div>
      </div>

      {/* Family & Children */}
      <div className="p-6 bg-gradient-to-br from-blue-50/90 via-purple-50/80 to-pink-50/90 rounded-2xl border-2 border-blue-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-200 flex items-center justify-center border border-blue-400">
            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-800">Family & Children</h3>
            <p className="text-xs text-slate-700">Information about your family</p>
          </div>
        </div>
        <div className="space-y-5">
          <SelectNew
            label="Total Children"
            value={form.total_children}
            options={options.total_children}
            onChange={(v: string) => updateField("total_children", v)}
          />
          <SelectNew
            label="Age of Immediate Older Children"
            value={form.age_of_immediate_older_children}
            options={options.age_older_children}
            onChange={(v: string) => updateField("age_of_immediate_older_children", v)}
          />
        </div>
      </div>

      {/* Relationships with Baby */}
      <div className="p-6 bg-gradient-to-br from-pink-50/90 via-purple-50/85 to-blue-50/85 rounded-2xl border-2 border-pink-200/70 shadow-lg relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-pink-200 flex items-center justify-center border border-pink-400">
            <svg className="w-5 h-5 text-pink-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-pink-800">Relationships with Baby</h3>
            <p className="text-xs text-slate-700">Bonding and connections</p>
          </div>
        </div>
        <div className="space-y-5">
          <SelectNew
            label="Your Relationship with the Newborn"
            value={form.relationship_with_the_newborn}
            options={options.relationship}
            onChange={(v: string) => updateField("relationship_with_the_newborn", v)}
          />
          <SelectNew
            label="Father's Relationship with the Newborn"
            value={form.relationship_between_father_and_newborn}
            options={options.relationship}
            onChange={(v: string) => updateField("relationship_between_father_and_newborn", v)}
          />
          <YesNoSelect
            label="Feeling angry after latest childbirth?"
            value={form.angry_after_latest_child_birth}
            onChange={(v: string) => updateField("angry_after_latest_child_birth", v)}
          />
        </div>
      </div>
    </div>
  );
}

function Step7({ form, phq9Score, submitPrediction, loading, prediction, startNewPrediction, editInformation }: any) {
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
          <div className="text-center p-4 bg-blue-50 border-2 border-blue-300 rounded-xl">
            <p className="text-sm font-semibold text-slate-700">
              Ready to analyze? Click below to get your PPD risk assessment
            </p>
          </div>
        )}
        <div className="flex justify-center">
          <button
            onClick={submitPrediction}
            disabled={loading}
            className="group relative w-full sm:w-auto min-h-[56px] px-10 sm:px-14 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white font-extrabold text-base sm:text-lg shadow-2xl shadow-purple-300/40 hover:shadow-purple-300/60 hover:scale-105 sm:hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400 focus-visible:ring-offset-2 overflow-hidden motion-safe:hover:-translate-y-1 transform"
            aria-label={loading ? "Analyzing your data, please wait" : "Submit form and predict PPD risk level"}
            aria-busy={loading}
          >
            <span className="relative z-10 inline-flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span className="animate-pulse">Analyzing Data...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 512 512" aria-hidden="true">
                    <path d="M184 0c30.9 0 56 25.1 56 56v400c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1c-5.2 1.4-10.7 2.1-16.3 2.1c-35.3 0-64-28.7-64-64c0-7.4 1.3-14.6 3.6-21.2C21.4 367.4 0 338.2 0 304c0-31.9 18.7-59.5 45.8-72.3C37.1 220.8 32 207 32 192c0-30.7 21.6-56.3 50.4-62.6C80.8 123.9 80 118 80 112c0-29.9 20.6-55.1 48.3-62.1C131.3 21.9 155.1 0 184 0zM328 0c28.9 0 52.7 21.9 55.7 50.1c5.2-1.4 10.7-2.1 16.3-2.1c35.3 0 64 28.7 64 64c0 7.4-1.3 14.6-3.6 21.2C490.6 144.6 512 173.8 512 208c0 31.9-18.7 59.5-45.8 72.3C474.9 291.2 480 305 480 320c0 30.7-21.6 56.3-50.4 62.6c1.6 5.5 2.4 11.4 2.4 17.4c0 29.9-20.6 55.1-48.3 62.1c-3 28-26.8 49.9-55.7 49.9c-30.9 0-56-25.1-56-56V56c0-30.9 25.1-56 56-56z"/>
                  </svg>
                  Predict Risk Level
                </>
              )}
            </span>
            {!loading && (
              <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
            )}
          </button>
        </div>
        {!prediction && (
          <p className="text-center text-xs text-slate-600 italic">AI-powered analysis based on validated clinical data</p>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && !prediction && (
        <div className="mt-10 p-8 bg-gradient-to-br from-cyan-100 to-purple-100 rounded-3xl border-2 border-cyan-300 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-6 bg-blue-200 rounded-lg w-1/3 mb-2" />
              <div className="h-4 bg-pink-200 rounded-lg w-1/2" />
            </div>
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center border-2 border-blue-300 animate-in zoom-in-50 duration-500" aria-hidden="true">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight animate-in slide-in-from-top-2 duration-500">
              Prediction Result
            </h2>
          </div>

          {prediction.error ? (
            <div className="flex items-start gap-4 p-6 bg-red-50 border-2 border-red-300 rounded-2xl animate-in shake duration-500">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-700 font-bold text-lg mb-1">Error Occurred</h3>
                <p className="text-red-600 text-base">{prediction.error}</p>
              </div>
            </div>
          ) : (
            <>
              <div className={`mb-8 p-6 rounded-2xl border-2 shadow-xl animate-in fade-in zoom-in-90 duration-700 delay-200 hover:scale-105 transition-transform motion-safe:hover:-translate-y-1 transform ${
                prediction.risk_level?.toLowerCase().includes('low') 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                  : prediction.risk_level?.toLowerCase().includes('medium')
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <p className={`text-sm font-bold uppercase tracking-widest animate-in fade-in duration-500 delay-300 ${
                    prediction.risk_level?.toLowerCase().includes('low') 
                      ? 'text-green-700'
                      : prediction.risk_level?.toLowerCase().includes('medium')
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>PPD Risk Level</p>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${
                    prediction.risk_level?.toLowerCase().includes('low') 
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : prediction.risk_level?.toLowerCase().includes('medium')
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    {prediction.risk_level?.toLowerCase().includes('low') ? (
                      <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Low Risk</>
                    ) : prediction.risk_level?.toLowerCase().includes('medium') ? (
                      <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Medium Risk</>
                    ) : (
                      <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> High Risk</>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4">
                  <div className={`w-16 h-16 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    prediction.risk_level?.toLowerCase().includes('low') 
                      ? 'bg-green-100'
                      : prediction.risk_level?.toLowerCase().includes('medium')
                      ? 'bg-yellow-100'
                      : 'bg-red-100'
                  }`} aria-hidden="true">
                    <svg className={`w-8 h-8 ${
                      prediction.risk_level?.toLowerCase().includes('low') 
                        ? 'text-green-700'
                        : prediction.risk_level?.toLowerCase().includes('medium')
                        ? 'text-yellow-700'
                        : 'text-red-700'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {prediction.risk_level?.toLowerCase().includes('low') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : prediction.risk_level?.toLowerCase().includes('medium') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      )}
                    </svg>
                  </div>
                  <p className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold drop-shadow-sm animate-in zoom-in-50 duration-700 delay-500 ${
                    prediction.risk_level?.toLowerCase().includes('low') 
                      ? 'text-green-800'
                      : prediction.risk_level?.toLowerCase().includes('medium')
                      ? 'text-yellow-800'
                      : 'text-red-800'
                  }`} role="status" aria-live="polite">
                    {prediction.risk_level}
                  </p>
                </div>
              </div>

              {prediction.probabilities && (
                <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl border-2 border-blue-300">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center border border-pink-300">
                      <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-slate-800 font-bold text-lg tracking-wide animate-in fade-in slide-in-from-left-2 duration-500 delay-700">Detailed Probabilities</h3>
                  </div>
                  <ul className="space-y-3">
                    {Object.entries(
                      prediction.probabilities as Record<string, number>
                    ).map(([label, prob], index) => {
                      const percentage = ((prob as number) * 100).toFixed(1);
                      const isHighest = Math.max(...Object.values(prediction.probabilities as Record<string, number>)) === prob;
                      return (
                        <li
                          key={label}
                          className={`group flex justify-between items-center p-4 rounded-2xl border-2 transition-all duration-300 shadow-sm motion-safe:hover:-translate-y-1 hover:scale-[1.02] transform animate-in fade-in slide-in-from-right-4 duration-500 ${
                            isHighest
                              ? 'bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 border-purple-300 hover:border-purple-400'
                              : 'bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-purple-200 hover:border-purple-300'
                          }`}
                          style={{ animationDelay: `${800 + index * 100}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            {isHighest && (
                              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            )}
                            <span className={`font-semibold text-base transition-colors duration-300 ${
                              isHighest ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-700'
                            }`}>
                              {getRiskLabel(String(label))}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-32 h-3 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out animate-in slide-in-from-left-full ${
                                  label.toLowerCase().includes('low')
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                    : label.toLowerCase().includes('medium')
                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                    : 'bg-gradient-to-r from-red-400 to-rose-500'
                                }`}
                                style={{ 
                                  width: `${percentage}%`,
                                  animationDelay: `${1000 + index * 100}ms`
                                }}
                              />
                            </div>
                            <span className={`font-extrabold text-lg w-16 text-right group-hover:scale-110 transition-transform duration-300 ${
                              isHighest ? 'text-blue-600' : 'text-slate-700'
                            }`}>
                              {percentage}%
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {prediction.accuracy && (
                <div className="mt-8 p-5 bg-gradient-to-r from-blue-50/80 via-purple-50/70 to-pink-50/80 rounded-2xl border-2 border-purple-200 shadow-lg hover:border-purple-300 transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-xl transform animate-in fade-in zoom-in-95 duration-700 delay-1000">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-300">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm font-bold uppercase tracking-wider">Model Accuracy</p>
                        <p className="text-slate-800 text-2xl font-extrabold">{prediction.accuracy}</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-green-100 border border-green-300 rounded-xl">
                      <span className="text-green-700 font-bold text-sm">Validated</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-10 pt-6 border-t-2 border-purple-200 flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1200">
                <button
                  onClick={() => {
                    const dataStr = encodeURIComponent(JSON.stringify(prediction.patient_data || prediction));
                    window.location.href = `/chatbot?data=${dataStr}`;
                  }}
                  className="group flex items-center justify-center gap-3 min-h-[52px] px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                  aria-label="Chat with AI assistant about results"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Chat with Assistant
                </button>
                <button
                  onClick={startNewPrediction}
                  className="group flex items-center justify-center gap-3 min-h-[52px] px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                  aria-label="Start a new prediction with a blank form"
                >
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Start New Prediction
                </button>
                <button
                  onClick={editInformation}
                  className="group flex items-center justify-center gap-3 min-h-[52px] px-8 py-4 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 text-purple-700 font-bold text-base rounded-2xl border-2 border-purple-300 shadow-lg hover:shadow-xl hover:scale-105 hover:border-purple-400 active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                  aria-label="Edit your information while keeping previous inputs"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Information
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------
// UI COMPONENTS
// -----------------------------------------------------
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
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Field completed">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const isFilled = value !== "";
  const selectId = `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="group animate-in fade-in slide-in-from-left-2 duration-500">
      <label htmlFor={selectId} className="block mb-2.5 text-sm font-semibold text-slate-800 tracking-wide uppercase text-xs transition-colors duration-300 group-focus-within:text-blue-700 flex items-center gap-2">
        {label}
        {isFilled && (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Field completed">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full min-h-[44px] px-4 py-3 sm:py-3.5 text-base sm:text-base border-2 rounded-2xl cursor-pointer focus:outline-none focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-200 transition-all duration-300 hover:border-slate-500 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgb(147 51 234)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[position:right_0.75rem_center] bg-no-repeat pr-10 motion-safe:focus:scale-[1.02] transform active:scale-[0.98] ${
          isFilled ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-slate-900" : "border-purple-300 bg-gradient-to-r from-blue-50/80 via-purple-50/70 to-pink-50/80 text-slate-700"
        }`}
        aria-required="true"
      >
        <option value="" className="bg-slate-50 text-slate-700">Select an option</option>
        {options?.map((o) => (
          <option key={o} value={o} className="bg-slate-50 text-slate-900">
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

// New Select component for object options
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
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Field completed">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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

// -----------------------------------------------------
// FORMAT KEY
// -----------------------------------------------------
function formatKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

