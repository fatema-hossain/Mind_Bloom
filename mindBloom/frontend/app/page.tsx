"use client";

import { useState } from "react";

const labelMap: Record<string, string> = {
  Low: "Low Risk",
  Medium: "Medium Risk",
  High: "High Risk",
};

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
  "Support & Emotions",
  "Newborn & Parenting",
  "Review & Predict",
];

// -----------------------------------------------------
// INITIAL FORM STATE (PHQ9/EPDS removed)
// -----------------------------------------------------
const initialForm = {
  // Step 1
  Age: "",
  Number_of_the_latest_pregnancy: "",

  // Step 2
  Education_Level: "",
  Husbands_education_level: "",
  Total_children: "",
  Family_type: "",

  // Step 3
  Disease_before_pregnancy: "",
  Pregnancy_length: "",
  Pregnancy_plan: "",
  Regular_checkups: "",
  Fear_of_pregnancy: "",
  Diseases_during_pregnancy: "",

  // Step 4
  Feeling_about_motherhood: "",
  Recieved_Support: "",
  Need_for_Support: "",
  Major_changes_or_losses: "",
  Abuse: "",
  Trust_and_share_feelings: "",
  Feeling_for_regular_activities: "",
  Angry_after_latest_child_birth: "",

  // Step 5
  Relationship_with_inlaws: "",
  Relationship_with_husband: "",
  Relationship_with_newborn: "",
  Relationship_between_father_and_newborn: "",
  Age_of_immediate_older_children: "",
  Birth_compliancy: "",
  Breastfeed: "",
  Worry_about_newborn: "",
  Relax_sleep_when_tended: "",
  Relax_sleep_when_asleep: "",
  Depression_before_pregnancy: "",
  Depression_during_pregnancy: "",
  Newborn_illness: "",
};

// -----------------------------------------------------
// CATEGORY OPTIONS
// -----------------------------------------------------
const options = {
  Education_Level: ["university", "primary school", "college", "high school", "nan"],
  Husbands_education_level: ["university", "college", "primary school", "high school", "nan"],
  Total_children: ["one", "two", "more than two"],
  Disease_before_pregnancy: ["chronic disease", "nan"],
  Family_type: ["nuclear", "joint"],

  Relationship_with_inlaws: ["neutral", "good", "bad", "friendly", "poor"],
  Relationship_with_husband: ["good", "neutral", "bad", "friendly", "poor"],
  Relationship_with_newborn: ["good", "neutral", "bad", "very good"],
  Relationship_between_father_and_newborn: ["good", "neutral", "bad", "very good"],

  Feeling_about_motherhood: ["neutral", "happy", "sad"],
  Recieved_Support: ["high", "medium", "low"],
  Need_for_Support: ["medium", "low", "high", "nan"],

  Major_changes_or_losses: ["yes", "no"],
  Abuse: ["yes", "no", "nan"],
  Trust_and_share_feelings: ["yes", "no", "nan"],
  Feeling_for_regular_activities: ["worried", "tired", "afraid", "nan"],
  Angry_after_latest_child_birth: ["worried", "tired", "afraid", "nan"],

  Pregnancy_length: ["10 months", "9 months", "less than 5 months"],
  Pregnancy_plan: ["yes", "no"],
  Regular_checkups: ["yes", "no"],
  Fear_of_pregnancy: ["yes", "no"],
  Diseases_during_pregnancy: ["non chronic disease", "nan"],

  Age_of_immediate_older_children: [
    "13yr or more",
    "7yr to 12yr",
    "4yr to 6yr",
    "1yr to 3yr",
    "nan",
  ],

  Birth_compliancy: ["yes", "no"],
  Breastfeed: ["yes", "no"],
  Worry_about_newborn: ["yes", "no"],
  Relax_sleep_when_tended: ["yes", "no"],
  Relax_sleep_when_asleep: ["yes", "no"],

  Depression_before_pregnancy: ["positive", "negative"],
  Depression_during_pregnancy: ["positive", "negative"],
  Newborn_illness: ["yes", "no"],
};
const BACKEND_KEY_MAP: Record<string, string> = {
  Age: "Age",
  Number_of_the_latest_pregnancy: "Number of the latest pregnancy",

  Education_Level: "Education Level",
  Husbands_education_level: "Husband's education level",
  Total_children: "Total children",
  Family_type: "Family type",

  Disease_before_pregnancy: "Disease before pregnancy",
  Pregnancy_length: "Pregnancy length",
  Pregnancy_plan: "Pregnancy plan",
  Regular_checkups: "Regular checkups",
  Fear_of_pregnancy: "Fear of pregnancy",
  Diseases_during_pregnancy: "Diseases during pregnancy",

  Feeling_about_motherhood: "Feeling about motherhood",
  Recieved_Support: "Recieved Support",
  Need_for_Support: "Need for Support",
  Major_changes_or_losses: "Major changes or losses during pregnancy",
  Abuse: "Abuse",
  Trust_and_share_feelings: "Trust and share feelings",
  Feeling_for_regular_activities: "Feeling for regular activities",
  Angry_after_latest_child_birth: "Angry after latest child birth",

  Relationship_with_inlaws: "Relationship with the in-laws",
  Relationship_with_husband: "Relationship with husband",
  Relationship_with_newborn: "Relationship with the newborn",
  Relationship_between_father_and_newborn:
    "Relationship between father and newborn",

  Age_of_immediate_older_children: "Age of immediate older children",
  Birth_compliancy: "Birth compliancy",
  Breastfeed: "Breastfeed",
  Worry_about_newborn: "Worry about newborn",
  Relax_sleep_when_tended: "Relax/sleep when newborn is tended",
  Relax_sleep_when_asleep: "Relax/sleep when the newborn is asleep",

  Depression_before_pregnancy: "Depression before pregnancy (PHQ2)",
  Depression_during_pregnancy: "Depression during pregnancy (PHQ2)",
  Newborn_illness: "Newborn illness",
};


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

  const updateField = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const submitPrediction = async () => {
  setLoading(true);
  setPrediction(null);

  // ✅ FORCE VALID FASTAPI INPUT
  const payload = {
    ...form,

    // numbers must ALWAYS be numbers
    Age: Number(form.Age || 0),
    Number_of_the_latest_pregnancy: Number(
      form.Number_of_the_latest_pregnancy || 0
    ),

    // strings must NEVER be empty
    Education_Level: form.Education_Level || "nan",
    Husbands_education_level: form.Husbands_education_level || "nan",
    Total_children: form.Total_children || "nan",
    Family_type: form.Family_type || "nan",

    Disease_before_pregnancy: form.Disease_before_pregnancy || "nan",
    Pregnancy_length: form.Pregnancy_length || "nan",
    Pregnancy_plan: form.Pregnancy_plan || "nan",
    Regular_checkups: form.Regular_checkups || "nan",
    Fear_of_pregnancy: form.Fear_of_pregnancy || "nan",
    Diseases_during_pregnancy: form.Diseases_during_pregnancy || "nan",

    Feeling_about_motherhood: form.Feeling_about_motherhood || "nan",
    Recieved_Support: form.Recieved_Support || "nan",
    Need_for_Support: form.Need_for_Support || "nan",
    Major_changes_or_losses: form.Major_changes_or_losses || "nan",
    Abuse: form.Abuse || "nan",
    Trust_and_share_feelings: form.Trust_and_share_feelings || "nan",
    Feeling_for_regular_activities: form.Feeling_for_regular_activities || "nan",
    Angry_after_latest_child_birth:
      form.Angry_after_latest_child_birth || "nan",

    Relationship_with_inlaws: form.Relationship_with_inlaws || "nan",
    Relationship_with_husband: form.Relationship_with_husband || "nan",
    Relationship_with_newborn: form.Relationship_with_newborn || "nan",
    Relationship_between_father_and_newborn:
      form.Relationship_between_father_and_newborn || "nan",

    Age_of_immediate_older_children:
      form.Age_of_immediate_older_children || "nan",
    Birth_compliancy: form.Birth_compliancy || "nan",
    Breastfeed: form.Breastfeed || "nan",
    Worry_about_newborn: form.Worry_about_newborn || "nan",
    Relax_sleep_when_tended: form.Relax_sleep_when_tended || "nan",
    Relax_sleep_when_asleep: form.Relax_sleep_when_asleep || "nan",
    Depression_before_pregnancy:
      form.Depression_before_pregnancy || "nan",
    Depression_during_pregnancy:
      form.Depression_during_pregnancy || "nan",
    Newborn_illness: form.Newborn_illness || "nan",
  };

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_BASE_URL + "/predict",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    setPrediction(data);
  } catch {
    setPrediction({ error: "Failed to connect to backend" });
  }

  setLoading(false);
};


    

  return (
    <main className="min-h-screen flex bg-black text-white p-4">
      {/* SIDEBAR */}
      <aside className="w-64 p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-cyan-300">MIND BLOOM</h2>

        <ul className="space-y-4">
          {steps.map((s, i) => (
            <li
              key={i}
              className={`cursor-pointer p-3 rounded-xl transition ${
                step === i
                  ? "bg-cyan-400/30 border border-cyan-300 text-cyan-200"
                  : "bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => setStep(i)}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ul>
      </aside>

      {/* MAIN PANEL */}
      <section className="flex-1 p-6 ml-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
        <h1 className="text-2xl font-bold mb-4 text-cyan-300">
          Step {step + 1}: {steps[step]}
        </h1>

        {step === 0 && <Step1 form={form} updateField={updateField} />}
        {step === 1 && <Step2 form={form} updateField={updateField} />}
        {step === 2 && <Step3 form={form} updateField={updateField} />}
        {step === 3 && <Step4 form={form} updateField={updateField} />}
        {step === 4 && <Step5 form={form} updateField={updateField} />}
        {step === 5 && (
          <Step6
            form={form}
            loading={loading}
            prediction={prediction}
            submitPrediction={submitPrediction}
          />
        )}

        <div className="mt-10 flex justify-between">
          {step > 0 ? (
            <button
              onClick={goBack}
              className="px-6 py-2 bg-white/20 rounded-xl border border-white/30 hover:bg-white/30"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < steps.length - 1 && (
            <button
              onClick={goNext}
              className="px-6 py-2 bg-cyan-500 rounded-xl text-black font-semibold hover:bg-cyan-400"
            >
              Next
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

// -----------------------------------------------------
// STEP COMPONENTS
// -----------------------------------------------------

function Step1({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      <Input
        label="Age"
        value={form.Age}
        onChange={(v: string) => updateField("Age", v)}
      />
      <Input
        label="Number of the latest pregnancy"
        value={form.Number_of_the_latest_pregnancy}
        onChange={(v: string) =>
          updateField("Number_of_the_latest_pregnancy", v)
        }
      />
    </div>
  );
}

function Step2({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      {[
        ["Education Level", "Education_Level"],
        ["Husband's education level", "Husbands_education_level"],
        ["Total children", "Total_children"],
        ["Family type", "Family_type"],
      ].map(([label, key]) => (
        <Select
          key={key}
          label={label}
          value={form[key]}
          options={options[key as keyof typeof options]}
          onChange={(v: string) => updateField(key, v)}
        />
      ))}
    </div>
  );
}

function Step3({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      {[
        ["Disease before pregnancy", "Disease_before_pregnancy"],
        ["Pregnancy length", "Pregnancy_length"],
        ["Pregnancy plan", "Pregnancy_plan"],
        ["Regular checkups", "Regular_checkups"],
        ["Fear of pregnancy", "Fear_of_pregnancy"],
        ["Diseases during pregnancy", "Diseases_during_pregnancy"],
      ].map(([label, key]) => (
        <Select
          key={key}
          label={label}
          value={form[key]}
          options={options[key as keyof typeof options]}
          onChange={(v: string) => updateField(key, v)}
        />
      ))}
    </div>
  );
}

function Step4({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      {[
        ["Feeling about motherhood", "Feeling_about_motherhood"],
        ["Recieved Support", "Recieved_Support"],
        ["Need for Support", "Need_for_Support"],
        ["Major changes or losses during pregnancy", "Major_changes_or_losses"],
        ["Abuse", "Abuse"],
        ["Trust and share feelings", "Trust_and_share_feelings"],
        ["Feeling for regular activities", "Feeling_for_regular_activities"],
        ["Angry after latest child birth", "Angry_after_latest_child_birth"],
      ].map(([label, key]) => (
        <Select
          key={key}
          label={label}
          value={form[key]}
          options={options[key as keyof typeof options]}
          onChange={(v: string) => updateField(key, v)}
        />
      ))}
    </div>
  );
}

function Step5({ form, updateField }: any) {
  return (
    <div className="space-y-6">
      {[
        ["Relationship with in-laws", "Relationship_with_inlaws"],
        ["Relationship with husband", "Relationship_with_husband"],
        ["Relationship with newborn", "Relationship_with_newborn"],
        [
          "Relationship between father and newborn",
          "Relationship_between_father_and_newborn",
        ],
        ["Age of immediate older children", "Age_of_immediate_older_children"],
        ["Birth compliancy", "Birth_compliancy"],
        ["Breastfeed", "Breastfeed"],
        ["Worry about newborn", "Worry_about_newborn"],
        ["Relax/sleep when newborn is tended", "Relax_sleep_when_tended"],
        ["Relax/sleep when the newborn is asleep", "Relax_sleep_when_asleep"],
        ["Depression before pregnancy", "Depression_before_pregnancy"],
        ["Depression during pregnancy", "Depression_during_pregnancy"],
        ["Newborn illness", "Newborn_illness"],
      ].map(([label, key]) => (
        <Select
          key={key}
          label={label}
          value={form[key]}
          options={options[key as keyof typeof options]}
          onChange={(v: string) => updateField(key, v)}
        />
      ))}
    </div>
  );
}

function Step6({ form, submitPrediction, loading, prediction }: any) {
  return (
    <div className="space-y-8">
      <div className="p-6 bg-white/5 rounded-2xl border border-white/20">
        <h2 className="text-xl font-bold text-cyan-300 mb-4">Review Your Inputs</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(form).map(([key, value]) => (
            <div
              key={key}
              className="p-3 bg-white/5 rounded-xl border border-white/10"
            >
              <p className="text-white/60 text-sm">{formatKey(key)}</p>
              <p className="text-white text-lg font-semibold">
                {String(value) || "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={submitPrediction}
          disabled={loading}
          className="px-10 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold shadow-lg hover:scale-105 transition"
        >
          {loading ? "Analyzing..." : "Predict"}
        </button>
      </div>

      {prediction && (
        <div className="mt-8 p-6 bg-white/10 rounded-2xl border border-cyan-400 shadow-xl">
          <h2 className="text-2xl font-bold text-cyan-300 mb-4">
            Prediction Result
          </h2>

          {prediction.error ? (
            <p className="text-red-400 text-lg">{prediction.error}</p>
          ) : (
            <>
              <div className="mb-6 p-4 bg-cyan-500/20 rounded-xl border border-cyan-400">
                <p className="text-white/70 text-sm mb-2">PPD Risk Level</p>
                <p className="text-white text-3xl font-bold">
                  {prediction.risk_level}
                </p>
              </div>

              {prediction.probabilities && (
                <div className="mt-4">
                  <h3 className="text-white/70 mb-3 font-semibold">Class Probabilities:</h3>
                  <ul className="space-y-2">
                    {Object.entries(
                      prediction.probabilities as Record<string, number>
                    ).map(([label, prob]) => (
                      <li
                        key={label}
                        className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10"
                      >
                        <span className="text-white/80 capitalize">
                          {labelMap[String(label)]}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                              style={{ width: `${((prob as number) * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <span className="text-cyan-300 font-bold w-12 text-right">
                            {((prob as number) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {prediction.accuracy && (
                <div className="mt-6 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Model Accuracy</p>
                  <p className="text-white text-lg font-semibold">{prediction.accuracy}</p>
                </div>
              )}
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
  return (
    <div>
      <label className="block mb-1 text-sm text-white/80">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-black/20 border border-white/30 rounded-xl"
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
  return (
    <div>
      <label className="block mb-1 text-sm text-white/80">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-black/20 border border-white/30 rounded-xl"
      >
        <option value="">Select</option>
        {options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

// -----------------------------------------------------
// FORMAT KEY
// -----------------------------------------------------
function formatKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
