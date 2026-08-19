"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Landmark,
  ShieldCheck,
  AlertTriangle,
  Filter,
  ArrowRight,
  Info,
  Coins,
  Sparkles,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";

// Types mapping API schemas
interface SchemeRecord {
  id: string;
  name: string;
  category: string;
  target_beneficiaries: string;
  state_scope: string;
  min_age: number | null;
  max_age: number | null;
  max_income: number | null;
  treatment_procedures: string[];
  hospitalization_required: boolean;
  benefit_description: string;
  eligibility_conditions: string;
  required_documents: string[];
  application_notes: string;
  official_source: string;
  verification_date: string | null;
  data_status: string;
}

interface SchemeMatchRequest {
  age: number | null;
  state: string | null;
  income: number | null;
  family_size: number | null;
  occupation: string | null;
  treatment_procedure: string | null;
  hospitalization_required: boolean | null;
  existing_insurance: boolean | null;
}

interface SchemeMatchResult {
  scheme: SchemeRecord;
  screening_status: string; // POTENTIALLY ELIGIBLE / POSSIBLY ELIGIBLE / DOES NOT APPEAR TO MATCH / INSUFFICIENT INFORMATION
  matched_conditions: string[];
  unverified_conditions: string[];
  mismatched_conditions: string[];
}

interface SchemeMatchResponse {
  query_params: SchemeMatchRequest;
  results: SchemeMatchResult[];
  disclaimer: string;
}

interface SchemeRegistryResponse {
  schemes: SchemeRecord[];
  disclaimer: string;
}

export default function GovernmentSchemesPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"screener" | "directory">("screener");

  // Screener inputs state
  const [age, setAge] = useState<string>("");
  const [state, setState] = useState<string>("Maharashtra");
  const [income, setIncome] = useState<string>("");
  const [familySize, setFamilySize] = useState<string>("");
  const [occupation, setOccupation] = useState<string>("");
  const [treatmentProcedure, setTreatmentProcedure] = useState<string>("Angioplasty");
  const [hospitalizationRequired, setHospitalizationRequired] = useState<boolean>(true);
  const [existingInsurance, setExistingInsurance] = useState<boolean>(false);

  // Screening matches state
  const [screenerResults, setScreenerResults] = useState<SchemeMatchResult[] | null>(null);
  const [isScreening, setIsScreening] = useState<boolean>(false);
  const [screenerError, setScreenerError] = useState<string | null>(null);

  // Directory filter state
  const [dirState, setDirState] = useState<string>("All");
  const [dirProcedure, setDirProcedure] = useState<string>("All");
  const [dirCategory, setDirCategory] = useState<string>("All");
  const [dirHospitalization, setDirHospitalization] = useState<string>("All");
  const [dirIncomeLimit, setDirIncomeLimit] = useState<string>("");

  // Directory data state
  const [directorySchemes, setDirectorySchemes] = useState<SchemeRecord[]>([]);
  const [isDirLoading, setIsDirLoading] = useState<boolean>(false);
  const [dirError, setDirError] = useState<string | null>(null);

  // Document checklist checks state (Scheme ID mapped to checked doc name list)
  const [checkedDocs, setCheckedDocs] = useState<Record<string, string[]>>({});

  // Funding gap state (retrieved from localStorage integration)
  const [fundingGap, setFundingGap] = useState<number | null>(null);
  const [fundingGapProc, setFundingGapProc] = useState<string | null>(null);

  // Fetch funding gap on mount (decoupled to avoid set-state-in-effect)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedOOP = localStorage.getItem("carefin_last_oop_calculation");
      if (cachedOOP) {
        try {
          const parsed = JSON.parse(cachedOOP);
          setTimeout(() => {
            if (parsed?.breakdown?.estimated_patient_responsibility) {
              setFundingGap(parsed.breakdown.estimated_patient_responsibility);
            }
            if (parsed?.inputs?.procedure_category) {
              setFundingGapProc(parsed.inputs.procedure_category);
              setTreatmentProcedure(parsed.inputs.procedure_category);
            }
          }, 0);
        } catch {
          // Ignore
        }
      }
    }
  }, []);

  // Fetch schemes directory
  const fetchDirectory = useCallback(async () => {
    setIsDirLoading(true);
    setDirError(null);

    const params = new URLSearchParams();
    if (dirState && dirState !== "All") params.append("state", dirState);
    if (dirProcedure && dirProcedure !== "All") params.append("procedure", dirProcedure);
    if (dirCategory && dirCategory !== "All") params.append("category", dirCategory);
    if (dirHospitalization && dirHospitalization !== "All") {
      params.append("hospitalization_required", dirHospitalization === "true" ? "true" : "false");
    }
    if (dirIncomeLimit) params.append("max_income", dirIncomeLimit);

    try {
      const response = await fetch(`http://localhost:8000/api/schemes?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to retrieve directory data.");
      }
      const data: SchemeRegistryResponse = await response.json();
      setDirectorySchemes(data.schemes);
    } catch (err: unknown) {
      setDirError(err instanceof Error ? err.message : "Error fetching schemes.");
    } finally {
      setIsDirLoading(false);
    }
  }, [dirState, dirProcedure, dirCategory, dirHospitalization, dirIncomeLimit]);

  // Fetch directory on mount & filter change (decoupled via setTimeout to avoid set-state-in-effect warnings)
  useEffect(() => {
    let active = true;
    if (activeTab === "directory") {
      const timer = setTimeout(() => {
        if (active) {
          fetchDirectory();
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [activeTab, fetchDirectory]);

  // Handle Screener Submit
  const handleScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScreening(true);
    setScreenerError(null);
    setScreenerResults(null);

    const payload = {
      age: age ? parseInt(age) : null,
      state: state || null,
      income: income ? parseFloat(income) : null,
      family_size: familySize ? parseInt(familySize) : null,
      occupation: occupation || null,
      treatment_procedure: treatmentProcedure || null,
      hospitalization_required: hospitalizationRequired,
      existing_insurance: existingInsurance
    };

    try {
      const response = await fetch("http://localhost:8000/api/schemes/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Screening failed.");
      }

      const data: SchemeMatchResponse = await response.json();
      setScreenerResults(data.results);
    } catch (err: unknown) {
      setScreenerError(err instanceof Error ? err.message : "Screening execution failed.");
    } finally {
      setIsScreening(false);
    }
  };

  // Document checklist toggle
  const toggleDocChecked = (schemeId: string, doc: string) => {
    setCheckedDocs((prev) => {
      const docs = prev[schemeId] || [];
      if (docs.includes(doc)) {
        return { ...prev, [schemeId]: docs.filter((d) => d !== doc) };
      } else {
        return { ...prev, [schemeId]: [...docs, doc] };
      }
    });
  };

  // Helper format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  };

  // Badge styles helper for screening status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "POTENTIALLY ELIGIBLE":
        return "bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/25 font-bold";
      case "POSSIBLY ELIGIBLE":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold";
      case "DOES NOT APPEAR TO MATCH":
        return "bg-red-500/10 text-red-600 border border-red-500/20 font-bold";
      case "INSUFFICIENT INFORMATION":
      default:
        return "bg-text-secondary/10 text-text-secondary border border-text-secondary/20 font-medium";
    }
  };

  // Badge styles helper for data source status
  const getDataStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED SOURCE":
        return "bg-accent-primary/10 text-accent-primary border border-accent-primary/20";
      case "REFERENCE INFORMATION":
        return "bg-emerald-600/10 text-emerald-600 border border-emerald-600/20";
      case "DEMO DATA":
        return "bg-amber-500/15 text-amber-700 border border-amber-500/25";
      case "NOT AVAILABLE":
      default:
        return "bg-text-secondary/10 text-text-secondary border border-text-secondary/15";
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 text-text-primary max-w-6xl mx-auto space-y-8 select-none">
      
      {/* 1. Header Area */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Government Schemes & Healthcare Assistance</h1>
          <p className="text-xs text-text-secondary mt-1">
            Discover government healthcare assistance programs, screen eligibility, and plan funding avenues honestly
          </p>
        </div>
        <div className="flex items-center gap-2 rounded border border-accent-secondary/35 bg-accent-secondary/5 px-2.5 py-1 text-[11px] font-medium text-accent-secondary self-start sm:self-auto">
          <ShieldCheck size={13} />
          <span>Informational screening only</span>
        </div>
      </header>

      {/* 2. SPEC-008 Funding Gap Integration Alert */}
      {fundingGap !== null && (
        <section className="bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 border border-accent-primary/15 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-accent-primary text-xs font-bold uppercase tracking-wider">
              <Coins size={14} />
              <span>Integrated Funding Gap Planner</span>
            </div>
            <h3 className="font-bold text-sm text-text-primary">
              Active Out-of-Pocket Exposure Detected: <span className="text-error">{formatCurrency(fundingGap)}</span>
            </h3>
            <p className="text-xs leading-5 text-text-secondary">
              Based on your last Policy Analyzer simulation for <strong>{fundingGapProc || "a surgical procedure"}</strong>, you have a projected out-of-pocket gap. 
              The schemes screened below represent <strong>POTENTIAL ASSISTANCE</strong> avenues. CareFin does not automatically subtract government assistance from your gap calculation as approval is not guaranteed.
            </p>
          </div>
          <button
            onClick={() => {
              setAge("");
              setIncome("");
              setFamilySize("");
              setOccupation("");
              if (fundingGapProc) setTreatmentProcedure(fundingGapProc);
              setActiveTab("screener");
              const formEl = document.getElementById("screener-form");
              if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-accent-primary text-white text-xs font-bold px-3.5 py-2 rounded hover:bg-accent-primary/95 transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Run Assistance Match</span>
            <ArrowRight size={13} />
          </button>
        </section>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-border text-xs font-bold uppercase">
        <button
          onClick={() => setActiveTab("screener")}
          className={`px-4 py-2.5 border-b-2 transition-all ${
            activeTab === "screener"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Eligibility Screener
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2.5 border-b-2 transition-all ${
            activeTab === "directory"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Scheme Reference Directory
        </button>
      </div>

      {/* TAB 1: ELIGIBILITY SCREENER */}
      {activeTab === "screener" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Eligibility Input Form */}
          <section className="bg-surface rounded-lg border border-border p-6 shadow-xs lg:col-span-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 mb-4 border-b border-border pb-3">
              <Filter size={15} className="text-accent-primary" />
              <span>Screener Demographics</span>
            </h2>

            <form id="screener-form" onSubmit={handleScreening} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-text-secondary uppercase mb-1">
                  Primary Insured Age
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  placeholder="e.g. 35"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary uppercase mb-1">
                  State of Residence
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-text-secondary uppercase mb-1">
                  Annual Household Income (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 90000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary uppercase mb-1">
                  Family Size Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  placeholder="e.g. 4"
                  value={familySize}
                  onChange={(e) => setFamilySize(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary uppercase mb-1">
                  Occupation / Category
                </label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                >
                  <option value="">-- Select Option --</option>
                  <option value="Rural Deprived / Laborer">Rural Deprived / Laborer</option>
                  <option value="Urban Self-employed">Urban Self-employed</option>
                  <option value="Unorganized Worker">Unorganized Worker</option>
                  <option value="Salaried Employee">Salaried Employee</option>
                  <option value="Business Owner">Business Owner</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-text-secondary uppercase mb-1">
                  Procedure Category
                </label>
                <select
                  value={treatmentProcedure}
                  onChange={(e) => setTreatmentProcedure(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                >
                  <option value="Angioplasty">Angioplasty</option>
                  <option value="Cataract Surgery">Cataract Surgery</option>
                  <option value="Knee Replacement">Knee Replacement</option>
                  <option value="Appendectomy">Appendectomy</option>
                  <option value="Cancer Treatment">Cancer Treatment</option>
                  <option value="Cosmetic Surgery">Cosmetic Surgery</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <label className="flex items-center gap-2 select-none cursor-pointer font-semibold text-text-secondary">
                  <input
                    type="checkbox"
                    checked={hospitalizationRequired}
                    onChange={(e) => setHospitalizationRequired(e.target.checked)}
                    className="accent-accent-primary rounded"
                  />
                  <span>Inpatient Hospitalization Required</span>
                </label>

                <label className="flex items-center gap-2 select-none cursor-pointer font-semibold text-text-secondary">
                  <input
                    type="checkbox"
                    checked={existingInsurance}
                    onChange={(e) => setExistingInsurance(e.target.checked)}
                    className="accent-accent-primary rounded"
                  />
                  <span>Has Existing Private Insurance</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isScreening}
                className="w-full bg-accent-primary text-white py-2.5 rounded font-bold hover:bg-accent-primary/95 transition-colors flex items-center justify-center gap-2 mt-4"
              >
                {isScreening ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Analyzing eligibility rules...</span>
                  </>
                ) : (
                  <>
                    <span>Screen Assistance Options</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>

            {screenerError && (
              <div className="mt-3 rounded bg-error/10 border border-error/15 p-2.5 text-xs text-error">
                {screenerError}
              </div>
            )}
          </section>

          {/* Screener Results Column */}
          <section className="lg:col-span-2 space-y-6">
            
            {screenerResults ? (
              <div className="space-y-6">
                
                <div className="flex justify-between items-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <span>Matched Program Schemes: {screenerResults.length} Found</span>
                  <span>Results are estimates, not guarantees</span>
                </div>

                <div className="space-y-6">
                  {screenerResults.map((res) => {
                    const schemeId = res.scheme.id;
                    const docs = res.scheme.required_documents;
                    const checked = checkedDocs[schemeId] || [];

                    return (
                      <div key={schemeId} className="bg-surface border border-border rounded-lg p-6 shadow-xs space-y-4">
                        
                        {/* Title and screening status */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border pb-3">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">
                              {res.scheme.category}
                            </span>
                            <h3 className="font-bold text-sm text-text-primary mt-1.5 leading-5">{res.scheme.name}</h3>
                          </div>
                          
                          <span className={`px-2.5 py-1 text-[10px] rounded shrink-0 text-center ${getStatusBadge(res.screening_status)}`}>
                            {res.screening_status}
                          </span>
                        </div>

                        {/* Match Criteria list */}
                        <div className="space-y-2 text-xs">
                          
                          {res.matched_conditions.length > 0 && (
                            <div>
                              <p className="font-bold text-[10px] text-accent-secondary uppercase tracking-wider mb-1">
                                Matched Conditions:
                              </p>
                              <ul className="list-disc pl-4 space-y-1 text-text-secondary">
                                {res.matched_conditions.map((cond, i) => (
                                  <li key={i}>{cond}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {res.unverified_conditions.length > 0 && (
                            <div className="pt-1.5">
                              <p className="font-bold text-[10px] text-amber-600 uppercase tracking-wider mb-1">
                                Unverified / Unknown Conditions:
                              </p>
                              <ul className="list-disc pl-4 space-y-1 text-text-secondary">
                                {res.unverified_conditions.map((cond, i) => (
                                  <li key={i}>{cond}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {res.mismatched_conditions.length > 0 && (
                            <div className="pt-1.5">
                              <p className="font-bold text-[10px] text-red-600 uppercase tracking-wider mb-1">
                                Mismatched Conditions:
                              </p>
                              <ul className="list-disc pl-4 space-y-1 text-text-secondary">
                                {res.mismatched_conditions.map((cond, i) => (
                                  <li key={i}>{cond}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Benefit explanation */}
                        <div className="bg-bg/40 border border-border/55 rounded p-3.5 text-xs space-y-2">
                          <p className="font-semibold text-text-primary flex items-center gap-1.5 text-[11px]">
                            <Sparkles size={14} className="text-accent-primary" />
                            <span>Benefit Summary & Limitations</span>
                          </p>
                          <p className="text-text-secondary leading-5">
                            {res.scheme.benefit_description}
                          </p>
                          <div className="text-[10px] leading-4 text-text-secondary pt-1 border-t border-border/40">
                            <strong>Official Application Step:</strong> {res.scheme.application_notes}
                          </div>
                        </div>

                        {/* Interactive document checklist */}
                        <div className="space-y-2 text-xs">
                          <p className="font-bold text-[10px] uppercase tracking-wider text-text-primary">
                            Potentially Required Documents Check:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-bg/20 border border-border/30 rounded p-3">
                            {docs.map((doc) => {
                              const isChecked = checked.includes(doc);
                              return (
                                <label
                                  key={doc}
                                  className={`flex items-start gap-2 cursor-pointer p-1.5 rounded transition-colors select-none ${
                                    isChecked ? "bg-accent-secondary/5" : "hover:bg-bg/35"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleDocChecked(schemeId, doc)}
                                    className="accent-accent-secondary mt-0.5 rounded"
                                  />
                                  <div>
                                    <span className="text-text-primary leading-4 font-semibold">{doc}</span>
                                    <span className="block text-[8px] font-bold text-text-secondary uppercase tracking-wide mt-0.5">
                                      Potentially Required
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Source metadata & transparency */}
                        <div className="flex flex-wrap items-center justify-between border-t border-border/50 pt-3 text-[10px] text-text-secondary gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[8px] ${getDataStatusBadge(res.scheme.data_status)}`}>
                              {res.scheme.data_status}
                            </span>
                            <span>Verified on {res.scheme.verification_date || "Not Available"}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {res.scheme.official_source !== "NOT AVAILABLE" ? (
                              <a
                                href={res.scheme.official_source}
                                target="_blank"
                                rel="noreferrer"
                                className="text-accent-primary font-bold hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>Official Source Portal</span>
                                <ArrowUpRight size={11} />
                              </a>
                            ) : (
                              <span>Source: NOT AVAILABLE</span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Verification Action */}
                        <div className="border-t border-border/40 pt-3 flex justify-end">
                          <a
                            href={res.scheme.official_source !== "NOT AVAILABLE" ? res.scheme.official_source : "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-surface text-accent-primary border border-accent-primary text-[10px] font-bold px-3 py-1.5 rounded hover:bg-accent-primary hover:text-white transition-all text-center"
                          >
                            Verify eligibility and benefit directly with the official scheme source.
                          </a>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            ) : (
              <div className="bg-surface border border-border rounded-lg p-12 text-center text-xs text-text-secondary flex flex-col items-center justify-center space-y-3 min-h-[300px]">
                <Landmark size={30} className="text-text-secondary/40" />
                <h3 className="font-bold text-sm text-text-primary">Run the Eligibility Screener</h3>
                <p className="max-w-md mx-auto leading-5">
                  Input your age, residency state, household income boundaries, and medical procedure parameters on the left to screen for potential government programs.
                </p>
              </div>
            )}
          </section>

        </div>
      )}

      {/* TAB 2: REFERENCE SCHEME DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          
          {/* Query Filters */}
          <section className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Filter size={14} className="text-accent-primary" />
              <span>Filter Scheme Catalog (AND Behavior)</span>
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              
              <div>
                <label className="block font-semibold text-text-secondary mb-1">STATE SCOPE</label>
                <select
                  value={dirState}
                  onChange={(e) => setDirState(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                >
                  <option value="All">All States / PAN India</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Kerala">Kerala</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text-secondary mb-1">COVERED PROCEDURE</label>
                <select
                  value={dirProcedure}
                  onChange={(e) => setDirProcedure(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                >
                  <option value="All">All Procedures</option>
                  <option value="Angioplasty">Angioplasty</option>
                  <option value="Cataract Surgery">Cataract Surgery</option>
                  <option value="Knee Replacement">Knee Replacement</option>
                  <option value="Appendectomy">Appendectomy</option>
                  <option value="Cancer Treatment">Cancer Treatment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text-secondary mb-1">SCHEME CATEGORY</label>
                <select
                  value={dirCategory}
                  onChange={(e) => setDirCategory(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                >
                  <option value="All">All Categories</option>
                  <option value="Central">Central Govt Schemes</option>
                  <option value="State">State Govt Schemes</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text-secondary mb-1">HOSPITALIZATION</label>
                <select
                  value={dirHospitalization}
                  onChange={(e) => setDirHospitalization(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                >
                  <option value="All">All Formats</option>
                  <option value="true">Hospitalization Required</option>
                  <option value="false">No Hospitalization Required</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text-secondary mb-1">MAX ANNUAL INCOME (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  value={dirIncomeLimit}
                  onChange={(e) => setDirIncomeLimit(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

            </div>
          </section>

          {/* Directory Listings */}
          {isDirLoading && (
            <div className="text-center py-12 text-sm text-text-secondary flex justify-center items-center gap-2">
              <RefreshCw size={15} className="animate-spin text-accent-primary" />
              <span>Loading schemes catalog database...</span>
            </div>
          )}

          {dirError && (
            <div className="rounded bg-error/10 border border-error/15 p-3 flex items-start gap-2 text-xs text-error max-w-2xl">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{dirError}</span>
            </div>
          )}

          {!isDirLoading && !dirError && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <span>Matching Catalogue: {directorySchemes.length} Programs</span>
                <span>Filtered on server under AND constraints</span>
              </div>

              {directorySchemes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {directorySchemes.map((scheme) => (
                    <div key={scheme.id} className="bg-surface border border-border hover:border-border/100 rounded-lg p-5 shadow-xs flex flex-col justify-between space-y-4">
                      
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded border border-accent-primary/10">
                              {scheme.category}
                            </span>
                            <h3 className="font-bold text-sm text-text-primary mt-1.5 leading-5">{scheme.name}</h3>
                          </div>
                        </div>

                        {/* Target Beneficiaries & Scope */}
                        <div className="text-xs space-y-1.5 text-text-secondary">
                          <p><strong>Target:</strong> {scheme.target_beneficiaries}</p>
                          <p><strong>State Scope:</strong> {scheme.state_scope}</p>
                          <p><strong>Income Cap:</strong> {scheme.max_income ? formatCurrency(scheme.max_income) : "NOT AVAILABLE"}</p>
                          <p><strong>Hospitalization Required:</strong> {scheme.hospitalization_required ? "Yes" : "No"}</p>
                        </div>

                        {/* Benefit text block */}
                        <div className="bg-bg/40 border border-border/50 rounded p-3 text-xs text-text-secondary leading-5">
                          <strong>Benefit:</strong> {scheme.benefit_description}
                        </div>
                      </div>

                      {/* Source & Date footer */}
                      <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[9px] text-text-secondary gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[7px] ${getDataStatusBadge(scheme.data_status)}`}>
                            {scheme.data_status}
                          </span>
                          <span>Ver. {scheme.verification_date || "N/A"}</span>
                        </div>

                        {scheme.official_source !== "NOT AVAILABLE" ? (
                          <a
                            href={scheme.official_source}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent-primary font-bold hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>Visit Official Site</span>
                            <ArrowUpRight size={10} />
                          </a>
                        ) : (
                          <span>Source: NOT AVAILABLE</span>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-lg p-12 text-center text-xs text-text-secondary flex flex-col items-center justify-center space-y-2">
                  <Landmark size={28} className="text-text-secondary/40" />
                  <p className="font-bold">No schemes match your catalog filters</p>
                  <p>Try resetting state, procedure, category, or budget boundaries to see listings.</p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 4. Trust Warning & Disclaimers Box */}
      <footer className="bg-bg/60 border border-border rounded-lg p-4 text-[10px] text-text-secondary flex gap-2.5">
        <Info size={16} className="text-text-secondary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-text-primary uppercase tracking-wide">
            Assistance Verification & Trust Notice:
          </p>
          <p className="leading-4">
            All government scheme details, target beneficiary scopes, and document parameters are compiled as general educational references. CareFin screening is not a guaranteed government approval determination. 
            Government program rules, empanelled healthcare facilities, and package rates are subject to change by state authorities. CareFin does not process assistance submissions, verify IDs, or guarantee financial reimbursements. 
            Confirm final eligibility, limits, and required files directly with authorized kiosk agents or hospital administrators before admitting patients.
          </p>
        </div>
      </footer>

    </div>
  );
}
