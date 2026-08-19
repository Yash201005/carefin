"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  FileCheck,
  HelpCircle,
  CheckCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from "lucide-react";

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

interface RAGCitation {
  page_number: number;
  source_text: string;
}

interface ClaimsGuidanceResponse {
  procedure: string;
  claim_type: string;
  document_checklist: string[];
  preauth_guidance: string[];
  policy_conditions_to_verify: string[];
  citations: RAGCitation[];
  disclaimers: string[];
}

export default function ClaimsGuidancePage() {
  // Page state
  const [procedure, setProcedure] = useState<string>("Angioplasty");
  const [customProcedure, setCustomProcedure] = useState<string>("");
  const [claimType, setClaimType] = useState<string>("cashless");
  
  // Lazily read cached policy from localStorage on mount
  const [policyMetadata, setPolicyMetadata] = useState<PolicyMetadata | null>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("carefin_policy_metadata");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // API response state
  const [guidance, setGuidance] = useState<ClaimsGuidanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User interactive state: checked documents prepared by patient
  const [preparedDocs, setPreparedDocs] = useState<Record<string, boolean>>({});

  // Handler to fetch guidance wrapped in useCallback
  const fetchGuidance = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setGuidance(null);
    setPreparedDocs({});

    const selectedProcedure = procedure === "Custom" ? customProcedure : procedure;
    if (!selectedProcedure.trim()) {
      setErrorMsg("Please select or enter a valid medical procedure name.");
      setIsLoading(false);
      return;
    }

    const payload = {
      procedure: selectedProcedure,
      claim_type: claimType,
      policy_metadata: policyMetadata
    };

    try {
      const response = await fetch("http://localhost:8000/api/claims/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to retrieve guidance.");
      }

      const data: ClaimsGuidanceResponse = await response.json();
      setGuidance(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, [procedure, customProcedure, claimType, policyMetadata]);

  // Run on change of parameters decoupled asynchronously to avoid render cascades
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        fetchGuidance();
      }
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchGuidance]);

  // Document checklist toggle
  const toggleDocChecked = (doc: string) => {
    setPreparedDocs((prev) => ({
      ...prev,
      [doc]: !prev[doc]
    }));
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "Not Found";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 text-text-primary max-w-6xl mx-auto space-y-8 select-none">
      
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Claims & Procedure Guidance</h1>
          <p className="text-xs text-text-secondary mt-1">
            Verify claim requirements, documents check, pre-auth steps, and verify active policy evidence
          </p>
        </div>
        <div className="flex items-center gap-2 rounded border border-accent-secondary/35 bg-accent-secondary/5 px-2.5 py-1 text-[11px] font-medium text-accent-secondary self-start sm:self-auto">
          <ClipboardList size={13} />
          <span>Claims Desk Guidance</span>
        </div>
      </header>

      {/* 1. Configuration form options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Procedure Selector card */}
        <div className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">1. Medical Procedure</h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-text-secondary mb-1">SELECT PRESET</label>
              <select
                value={procedure}
                onChange={(e) => {
                  setProcedure(e.target.value);
                  if (e.target.value !== "Custom") setCustomProcedure("");
                }}
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="Angioplasty">Angioplasty</option>
                <option value="Cataract Surgery">Cataract Surgery</option>
                <option value="Knee Replacement">Knee Replacement</option>
                <option value="Appendectomy">Appendectomy</option>
                <option value="Cancer Treatment">Cancer Treatment</option>
                <option value="Custom">Custom Write-In...</option>
              </select>
            </div>

            {procedure === "Custom" && (
              <div>
                <label className="block font-semibold text-text-secondary mb-1">ENTER PROCEDURE NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Hernia Repair"
                  value={customProcedure}
                  onChange={(e) => setCustomProcedure(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            )}
            <span className="text-[10px] text-text-secondary italic block">
              Reference presets provide demo medical guidelines parameters.
            </span>
          </div>
        </div>

        {/* Claim type toggle options */}
        <div className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">2. Claim Settlement Method</h2>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setClaimType("cashless")}
              className={`w-full py-2.5 px-4 text-xs font-bold rounded border text-left flex justify-between items-center transition-colors ${
                claimType === "cashless"
                  ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
                  : "bg-surface border-border text-text-secondary hover:bg-bg"
              }`}
            >
              <div>
                <p className="font-semibold">Cashless Settlement</p>
                <p className="text-[10px] text-text-secondary mt-0.5">Approved directly at network hospital desk</p>
              </div>
              {claimType === "cashless" && <CheckCircle size={14} />}
            </button>

            <button
              onClick={() => setClaimType("reimbursement")}
              className={`w-full py-2.5 px-4 text-xs font-bold rounded border text-left flex justify-between items-center transition-colors ${
                claimType === "reimbursement"
                  ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
                  : "bg-surface border-border text-text-secondary hover:bg-bg"
              }`}
            >
              <div>
                <p className="font-semibold">Reimbursement Payout</p>
                <p className="text-[10px] text-text-secondary mt-0.5">Pay hospital bills, submit original bills to TPA</p>
              </div>
              {claimType === "reimbursement" && <CheckCircle size={14} />}
            </button>
          </div>
        </div>

        {/* Policy linkage state */}
        <div className="bg-surface rounded-lg border border-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-3">3. Linked Policy Evidence</h2>
            
            {policyMetadata ? (
              <div className="space-y-3">
                <div className="flex gap-2.5 items-start text-xs bg-accent-secondary/5 border border-accent-secondary/25 rounded p-3">
                  <FileText size={16} className="text-accent-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-text-primary truncate max-w-[160px]">
                      {policyMetadata.sum_insured.source || "policy_schedule.pdf"}
                    </p>
                    <p className="text-[9px] text-text-secondary mt-0.5">
                      Sum Insured: {formatCurrency(policyMetadata.sum_insured.value)}
                    </p>
                    <p className="text-[9px] text-text-secondary">
                      Co-pay: {policyMetadata.co_payment_percentage.value}% | Deductible: {formatCurrency(policyMetadata.deductible.value)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("carefin_policy_metadata");
                    setPolicyMetadata(null);
                  }}
                  className="text-[10px] font-bold text-error hover:underline"
                >
                  Unlink Policy Document
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-text-secondary leading-5">
                  No active policy linked. Connecting policy parameters will run checks against exclusion and waiting periods clauses.
                </p>
                <Link
                  href="/insurance"
                  className="text-accent-secondary font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Upload & Analyze Policy</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 2. Main Guidance Results */}
      {isLoading && (
        <div className="text-center py-12 text-sm text-text-secondary flex justify-center items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent-primary border-t-transparent"></div>
          <span>Compiling checklist guidelines...</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded bg-error/10 border border-error/15 p-3 flex items-start gap-2 text-xs text-error max-w-2xl">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {guidance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Steps and Document checklist */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step-by-Step pre-authorization checklist */}
            <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <ClipboardList size={16} className="text-accent-primary" />
                <span>Pre-Authorization / Cashless Steps</span>
              </h2>
              <ol className="relative border-l border-border ml-2 space-y-4 text-xs">
                {guidance.preauth_guidance.map((step, idx) => (
                  <li key={idx} className="mb-4 ml-4">
                    <span className="absolute flex items-center justify-center w-5 h-5 rounded-full -left-2.5 bg-bg border border-border text-[9px] font-bold text-accent-primary">
                      {idx + 1}
                    </span>
                    <p className="leading-5 text-text-secondary">{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Required documents prep checklist */}
            <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <FileCheck size={16} className="text-accent-secondary" />
                  <span>Potentially Required Documents</span>
                </h2>
                <span className="text-[10px] font-bold text-text-secondary bg-bg border border-border px-2 py-0.5 rounded">
                  Verify with TPA
                </span>
              </div>

              <div className="space-y-2">
                {guidance.document_checklist.map((doc) => {
                  const isChecked = !!preparedDocs[doc];
                  return (
                    <div
                      key={doc}
                      onClick={() => toggleDocChecked(doc)}
                      className={`flex items-start gap-3 p-2.5 rounded border transition-colors cursor-pointer text-xs ${
                        isChecked
                          ? "bg-accent-secondary/5 border-accent-secondary/30 text-text-primary"
                          : "bg-surface border-border/70 text-text-secondary hover:bg-bg/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="mt-0.5 rounded border-border text-accent-secondary focus:ring-0 cursor-pointer"
                      />
                      <span className={isChecked ? "line-through text-text-secondary/70" : ""}>{doc}</span>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>

          {/* Right panel: Policy evidence match and Exclusions checklist */}
          <div className="space-y-6">
            
            {/* Policy exclusions & limits verify panel */}
            <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                  Verify Policy Clauses
                </h2>
                <span className="text-[9px] font-bold text-accent-secondary bg-accent-secondary/15 px-1.5 py-0.5 rounded">
                  {policyMetadata ? "VERIFIED POLICY" : "GENERAL DISCOVERY"}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {guidance.policy_conditions_to_verify.map((cond, idx) => {
                  const isVerified = cond.startsWith("Verified Policy Evidence");
                  const isFallback = cond.startsWith("Information not found");
                  
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded border text-xs leading-5 ${
                        isVerified
                          ? "bg-accent-secondary/5 border-accent-secondary/30 text-text-primary"
                          : isFallback
                          ? "bg-error/5 border-error/15 text-text-secondary"
                          : "bg-bg/40 border-border/70 text-text-secondary"
                      }`}
                    >
                      {cond}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Citations panel */}
            {guidance.citations.length > 0 && (
              <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <Sparkles size={15} className="text-accent-primary" />
                  <span>Retrieved Clause Evidence</span>
                </h2>
                {guidance.citations.map((cit, idx) => (
                  <div key={idx} className="border border-border/80 rounded p-2.5 text-xs bg-bg/15">
                    <div className="flex justify-between text-[9px] text-accent-secondary font-bold uppercase mb-1">
                      <span>Linked Document Page</span>
                      <span>Page {cit.page_number}</span>
                    </div>
                    <p className="italic text-text-secondary leading-4">{cit.source_text}</p>
                  </div>
                ))}
              </section>
            )}

            {/* General Disclaimers list */}
            <section className="bg-error/5 border border-error/15 rounded-lg p-5 space-y-3">
              <h3 className="text-xs font-bold text-error flex items-center gap-1.5 uppercase tracking-wider">
                <HelpCircle size={15} />
                <span>Disclaimer Guidelines</span>
              </h3>
              <div className="space-y-2 text-[10px] text-text-secondary leading-4">
                {guidance.disclaimers.map((disc, idx) => (
                  <p key={idx}>{disc}</p>
                ))}
              </div>
            </section>

          </div>

        </div>
      )}

    </div>
  );
}
