"use client";

import React, { useState } from "react";
import {
  FileText,
  Upload,
  Calculator,
  Info,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileCheck,
  AlertTriangle
} from "lucide-react";

// Types mapping API schemas
interface ExtractedParam {
  name: string;
  value: number | null;
  unit: string | null;
  page: number | null;
  source: string | null;
  status: "FOUND" | "NOT_FOUND" | "UNCERTAIN";
}

interface PolicyMetadata {
  sum_insured: ExtractedParam;
  deductible: ExtractedParam;
  co_payment_percentage: ExtractedParam;
  room_rent_limit: ExtractedParam;
  icu_rent_limit: ExtractedParam;
  waiting_period_months: ExtractedParam;
  exclusions: string[];
  sub_limits: Record<string, number>;
}

interface OOPBreakdown {
  total_treatment_cost: number;
  non_covered_amount: number;
  room_rent_excess: number;
  eligible_hospital_cost: number;
  deductible_applied: number;
  co_payment_deducted: number;
  estimated_insurance_contribution: number;
  estimated_patient_responsibility: number;
}

interface RoomRentAdjustment {
  room_rent_charged: number;
  room_rent_policy_limit: number;
  excess_per_day: number;
  total_room_rent_excess: number;
}

interface RAGCitation {
  page_number: number;
  source_text: string;
}

interface OOPCalculationRequest {
  treatment_cost: number;
  room_category: string;
  daily_rent: number;
  hospitalization_days: number;
  procedure_category: string;
  policy_metadata: PolicyMetadata;
}

interface OOPCalculationResponse {
  inputs: OOPCalculationRequest;
  breakdown: OOPBreakdown;
  room_rent_details: RoomRentAdjustment;
  ai_explanation: string;
  citations: RAGCitation[];
  assumptions: string[];
  limitations: string[];
  disclaimer: string;
}

export default function CareFinVerticalSlice() {
  // Application State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [policyMetadata, setPolicyMetadata] = useState<PolicyMetadata | null>(null);

  // Simulator Inputs State
  const [treatmentCost, setTreatmentCost] = useState<string>("150000");
  const [dailyRent, setDailyRent] = useState<string>("7000");
  const [hospitalDays, setHospitalDays] = useState<string>("3");
  const [roomCategory, setRoomCategory] = useState<string>("Private Single Room");
  const [procedureCategory, setProcedureCategory] = useState<string>("Angioplasty");

  // Calculation Result State
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<OOPCalculationResponse | null>(null);

  // File Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10 MB limit.");
      return;
    }

    // Validate format (PDF only)
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF documents are supported.");
      return;
    }

    setFile(selectedFile);
    setUploadError(null);
    setPolicyMetadata(null);
    setCalculationResult(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/api/insurance/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to analyze policy document.");
      }

      const data: PolicyMetadata = await response.json();
      setPolicyMetadata(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("carefin_policy_metadata", JSON.stringify(data));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred during analysis.";
      setUploadError(errMsg);
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // OOP Calculator Execute Handler
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyMetadata || !file) return;

    setIsCalculating(true);
    setCalcError(null);

    const payload = {
      treatment_cost: parseFloat(treatmentCost),
      room_category: roomCategory,
      daily_rent: parseFloat(dailyRent),
      hospitalization_days: parseInt(hospitalDays),
      procedure_category: procedureCategory,
      policy_metadata: policyMetadata,
    };

    try {
      const response = await fetch("http://localhost:8000/api/insurance/calculate-oop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Calculation execution failed.");
      }

      const data: OOPCalculationResponse = await response.json();
      setCalculationResult(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Calculation failed.";
      setCalcError(errMsg);
    } finally {
      setIsCalculating(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "Not Found";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 text-text-primary max-w-6xl mx-auto space-y-8 select-none">
      
      {/* Page Header */}
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Insurance Policy Analyzer</h1>
          <p className="text-xs text-text-secondary mt-1">
            Analyze policy schedules and simulate out-of-pocket costs with page-grounded citations
          </p>
        </div>
        <div className="flex items-center gap-2 rounded border border-accent-secondary/35 bg-accent-secondary/5 px-2.5 py-1 text-[11px] font-medium text-accent-secondary">
          <ShieldCheck size={13} />
          <span>Secure Extraction Mode</span>
        </div>
      </header>

      {/* STEP 1: Document Upload */}
      <section className="bg-surface rounded-lg border border-border p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Upload size={16} className="text-accent-primary" />
            <span>1. Upload Policy Terms Document</span>
          </h2>
          <span className="rounded bg-accent-primary/10 px-2 py-0.5 text-[10px] font-bold text-accent-primary">
            PDF ONLY (MAX 10MB)
          </span>
        </div>

        {!file ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center bg-bg/50 hover:bg-bg transition-colors relative">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Upload size={28} className="text-text-secondary mb-2" />
            <p className="text-xs font-semibold text-text-primary">Select policy PDF sheet to upload</p>
            <p className="text-[10px] text-text-secondary mt-0.5">Drag-and-drop or click to browse</p>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-bg border border-border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="rounded bg-accent-primary/10 p-1.5 text-accent-primary">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary truncate max-w-md">{file.name}</p>
                <p className="text-[10px] text-text-secondary">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPolicyMetadata(null);
                setCalculationResult(null);
              }}
              className="text-[10px] font-bold text-error hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        {isUploading && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-text-secondary">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-accent-primary border-t-transparent"></div>
            <span>Running extractor rules...</span>
          </div>
        )}

        {uploadError && (
          <div className="mt-3 rounded bg-error/10 border border-error/15 p-2.5 flex items-start gap-2 text-xs text-error">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </section>

      {/* STEP 2: Policy Parameter Extractions */}
      {policyMetadata && (
        <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <FileCheck size={16} className="text-accent-secondary" />
              <span>2. Extracted Coverage Parameters</span>
            </h2>
            <span className="rounded bg-accent-secondary/15 px-2 py-0.5 text-[9px] font-bold text-accent-secondary">
              VERIFIED POLICY SOURCE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sum Insured */}
            <div className="border border-border rounded p-3 bg-bg/25">
              <div className="flex justify-between items-start text-[10px] text-text-secondary font-semibold">
                <span>SUM INSURED</span>
                {policyMetadata.sum_insured.status === "FOUND" && (
                  <span className="text-[9px] font-semibold text-accent-secondary bg-accent-secondary/10 px-1.5 py-0.5 rounded">
                    Page {policyMetadata.sum_insured.page}
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold mt-1 text-text-primary">
                {policyMetadata.sum_insured.status === "FOUND"
                  ? formatCurrency(policyMetadata.sum_insured.value)
                  : "Not Found"}
              </p>
            </div>

            {/* Deductible */}
            <div className="border border-border rounded p-3 bg-bg/25">
              <div className="flex justify-between items-start text-[10px] text-text-secondary font-semibold">
                <span>DEDUCTIBLE THRESHOLD</span>
                {policyMetadata.deductible.status === "FOUND" && (
                  <span className="text-[9px] font-semibold text-accent-secondary bg-accent-secondary/10 px-1.5 py-0.5 rounded">
                    Page {policyMetadata.deductible.page}
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold mt-1 text-text-primary">
                {policyMetadata.deductible.status === "FOUND"
                  ? formatCurrency(policyMetadata.deductible.value)
                  : "None / Not Found"}
              </p>
            </div>

            {/* Co-payment percentage */}
            <div className="border border-border rounded p-3 bg-bg/25">
              <div className="flex justify-between items-start text-[10px] text-text-secondary font-semibold">
                <span>CO-PAYMENT</span>
                {policyMetadata.co_payment_percentage.status === "FOUND" && (
                  <span className="text-[9px] font-semibold text-accent-secondary bg-accent-secondary/10 px-1.5 py-0.5 rounded">
                    Page {policyMetadata.co_payment_percentage.page}
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold mt-1 text-text-primary">
                {policyMetadata.co_payment_percentage.status === "FOUND"
                  ? `${policyMetadata.co_payment_percentage.value}%`
                  : "0% / Not Found"}
              </p>
            </div>

            {/* Room Rent Limit */}
            <div className="border border-border rounded p-3 bg-bg/25">
              <div className="flex justify-between items-start text-[10px] text-text-secondary font-semibold">
                <span>ROOM RENT LIMIT</span>
                {policyMetadata.room_rent_limit.status === "FOUND" && (
                  <span className="text-[9px] font-semibold text-accent-secondary bg-accent-secondary/10 px-1.5 py-0.5 rounded">
                    Page {policyMetadata.room_rent_limit.page}
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold mt-1 text-text-primary">
                {policyMetadata.room_rent_limit.status === "FOUND"
                  ? policyMetadata.room_rent_limit.unit === "percentage"
                    ? `${policyMetadata.room_rent_limit.value}% of SI / day`
                    : formatCurrency(policyMetadata.room_rent_limit.value) + " / day"
                  : "Not Found"}
              </p>
            </div>

            {/* ICU Rent Limit */}
            <div className="border border-border rounded p-3 bg-bg/25">
              <div className="flex justify-between items-start text-[10px] text-text-secondary font-semibold">
                <span>ICU CHARGES LIMIT</span>
                {policyMetadata.icu_rent_limit.status === "FOUND" && (
                  <span className="text-[9px] font-semibold text-accent-secondary bg-accent-secondary/10 px-1.5 py-0.5 rounded">
                    Page {policyMetadata.icu_rent_limit.page}
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold mt-1 text-text-primary">
                {policyMetadata.icu_rent_limit.status === "FOUND"
                  ? policyMetadata.icu_rent_limit.unit === "percentage"
                    ? `${policyMetadata.icu_rent_limit.value}% of SI / day`
                    : formatCurrency(policyMetadata.icu_rent_limit.value) + " / day"
                  : "Not Found"}
              </p>
            </div>

            {/* Waiting Period */}
            <div className="border border-border rounded p-3 bg-bg/25">
              <div className="flex justify-between items-start text-[10px] text-text-secondary font-semibold">
                <span>WAITING PERIOD</span>
                {policyMetadata.waiting_period_months.status === "FOUND" && (
                  <span className="text-[9px] font-semibold text-accent-secondary bg-accent-secondary/10 px-1.5 py-0.5 rounded">
                    Page {policyMetadata.waiting_period_months.page}
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold mt-1 text-text-primary">
                {policyMetadata.waiting_period_months.status === "FOUND"
                  ? `${policyMetadata.waiting_period_months.value} Months`
                  : "Not Found"}
              </p>
            </div>
          </div>

          {policyMetadata.exclusions.length > 0 && (
            <div className="border-t border-border pt-3">
              <h3 className="text-xs font-bold text-text-primary mb-1">Located Exclusions:</h3>
              <ul className="list-disc pl-4 space-y-0.5 text-xs text-text-secondary">
                {policyMetadata.exclusions.map((exclusion, idx) => (
                  <li key={idx}>{exclusion}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* STEP 3: Calculator Simulator Form & Breakdown */}
      {policyMetadata && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Simulator Inputs Form */}
          <section className="bg-surface rounded-lg border border-border p-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 mb-4 border-b border-border pb-3">
              <Calculator size={16} className="text-accent-primary" />
              <span>3. Simulation Parameters</span>
            </h2>

            <form onSubmit={handleCalculate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wide mb-1">
                  ESTIMATED BILL TOTAL (INR)
                </label>
                <input
                  type="number"
                  value={treatmentCost}
                  onChange={(e) => setTreatmentCost(e.target.value)}
                  className="w-full border border-border rounded p-2 text-xs bg-bg/25 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wide mb-1">
                    ROOM RENT CHARGED / DAY
                  </label>
                  <input
                    type="number"
                    value={dailyRent}
                    onChange={(e) => setDailyRent(e.target.value)}
                    className="w-full border border-border rounded p-2 text-xs bg-bg/25 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wide mb-1">
                    HOSPITAL DAYS
                  </label>
                  <input
                    type="number"
                    value={hospitalDays}
                    onChange={(e) => setHospitalDays(e.target.value)}
                    className="w-full border border-border rounded p-2 text-xs bg-bg/25 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wide mb-1">
                    ROOM SELECTION
                  </label>
                  <select
                    value={roomCategory}
                    onChange={(e) => setRoomCategory(e.target.value)}
                    className="w-full border border-border rounded p-2 text-xs bg-bg/25 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  >
                    <option>Twin Sharing Room</option>
                    <option>Private Single Room</option>
                    <option>ICU Room</option>
                    <option>Suite Room</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wide mb-1">
                    TREATMENT CATEGORY
                  </label>
                  <select
                    value={procedureCategory}
                    onChange={(e) => setProcedureCategory(e.target.value)}
                    className="w-full border border-border rounded p-2 text-xs bg-bg/25 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  >
                    <option>Angioplasty</option>
                    <option>Cataract</option>
                    <option>Hernia Repair</option>
                    <option>Joint Replacement</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCalculating}
                className="w-full bg-accent-primary text-white py-2 rounded text-xs font-bold hover:bg-accent-primary/95 transition-colors flex items-center justify-center gap-2 mt-4"
              >
                {isCalculating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    <span>Computing cost shares...</span>
                  </>
                ) : (
                  <>
                    <span>Run OOP Math Breakdown</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>

            {calcError && (
              <div className="mt-3 rounded bg-error/10 border border-error/15 p-2.5 text-xs text-error">
                {calcError}
              </div>
            )}
          </section>

          {/* OOP Breakdown Display */}
          <section className="bg-surface rounded-lg border border-border p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <Info size={16} className="text-accent-secondary" />
                  <span>4. Out-of-Pocket Breakdown</span>
                </h2>
                <span className="rounded bg-accent-primary/10 px-2 py-0.5 text-[9px] font-bold text-accent-primary">
                  ESTIMATE ONLY
                </span>
              </div>

              {calculationResult ? (
                <div className="space-y-4">
                  {/* Headline Patient share */}
                  <div className="bg-bg rounded border border-border p-3 text-center">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">
                      Patient Out-of-Pocket Share
                    </p>
                    <p className="text-xl font-bold text-error mt-1">
                      {formatCurrency(calculationResult.breakdown.estimated_patient_responsibility)}
                    </p>
                    <p className="text-[9px] text-text-secondary mt-0.5">
                      Total Bill: ₹{calculationResult.breakdown.total_treatment_cost.toLocaleString()}
                    </p>
                  </div>

                  {/* Math list */}
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-text-secondary">Total Hospital Bill</span>
                      <span className="font-semibold">{formatCurrency(calculationResult.breakdown.total_treatment_cost)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40 text-error">
                      <span className="text-text-secondary">(-) Room Rent Excess charges</span>
                      <span>{formatCurrency(calculationResult.breakdown.room_rent_excess)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40 text-error">
                      <span className="text-text-secondary">(-) Non-covered consumables (10%)</span>
                      <span>{formatCurrency(calculationResult.breakdown.non_covered_amount)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40 font-medium">
                      <span className="text-text-secondary">Eligible Base Bill</span>
                      <span>{formatCurrency(calculationResult.breakdown.eligible_hospital_cost)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40 text-error">
                      <span className="text-text-secondary">(-) Deductible applied</span>
                      <span>{formatCurrency(calculationResult.breakdown.deductible_applied)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40 text-error">
                      <span className="text-text-secondary">(-) Co-payment deducted</span>
                      <span>{formatCurrency(calculationResult.breakdown.co_payment_deducted)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40 text-accent-secondary font-medium">
                      <span className="text-text-secondary">Insurance Contribution Share</span>
                      <span>{formatCurrency(calculationResult.breakdown.estimated_insurance_contribution)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-text-secondary text-xs">
                  <Calculator size={24} className="mb-2 text-text-secondary/50" />
                  <span>Execute the simulator inputs to populate OOP calculations.</span>
                </div>
              )}
            </div>

            {calculationResult && (
              <div className="mt-4 pt-4 border-t border-border text-[9px] text-text-secondary italic">
                * All calculations are strictly deterministic based on extracted PDF policy schedules.
              </div>
            )}
          </section>
        </div>
      )}

      {/* STEP 4: Grounded Explanations */}
      {calculationResult && (
        <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Sparkles size={16} className="text-accent-primary" />
              <span>5. Grounded Clause Summary</span>
            </h2>
            <span className="rounded bg-accent-primary/10 px-2 py-0.5 text-[9px] font-bold text-accent-primary">
              GROUNDED CLAUSE SUMMARY
            </span>
          </div>

          <p className="text-xs leading-5 text-text-secondary bg-bg/40 border border-border/50 rounded p-3.5">
            {calculationResult.ai_explanation}
          </p>

          {calculationResult.citations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-wider">
                Grounded Policy Citations:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {calculationResult.citations.map((cit, idx) => (
                  <div key={idx} className="border border-border/70 rounded p-2.5 text-xs bg-bg/15">
                    <div className="flex justify-between text-[9px] text-accent-secondary font-bold uppercase mb-1">
                      <span>Source: Policy PDF</span>
                      <span>Page {cit.page_number}</span>
                    </div>
                    <p className="italic text-text-secondary">{cit.source_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assumptions & Limitations lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-text-secondary border-t border-border pt-3">
            <div>
              <p className="font-bold text-text-primary mb-1">Simulation Assumptions:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {calculationResult.assumptions.map((ass, i) => <li key={i}>{ass}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-bold text-text-primary mb-1">Scope Limitations:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {calculationResult.limitations.map((lim, i) => <li key={i}>{lim}</li>)}
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-error/5 border border-error/15 rounded p-2.5 text-[10px] text-text-secondary flex gap-2">
            <Info size={14} className="text-error shrink-0 mt-0.5" />
            <p>
              <strong>Disclaimer</strong>: {calculationResult.disclaimer}
            </p>
          </div>
        </section>
      )}

    </div>
  );
}
