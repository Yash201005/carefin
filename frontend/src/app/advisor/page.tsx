"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Filter,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  Check,
  AlertCircle
} from "lucide-react";

interface RecommendedPlan {
  plan_name: string;
  insurer: string;
  city_scope: string;
  illustrative_premium: number;
  sum_insured: number;
  co_payment: string;
  deductible: string;
  room_rent_limit: string;
  waiting_periods: string;
  exclusions: string[];
  match_status: string;
  match_reasons: string[];
  strengths: string[];
  limitations: string[];
  questions_to_ask: string[];
  source: string;
  data_status: string;
  verification_date: string;
}

interface AdvisorResponse {
  query_params: Record<string, unknown>;
  results: RecommendedPlan[];
  underwriting_notice: string;
  disclaimer: string;
}

export default function InsuranceAdvisorPage() {
  // Input fields state
  const [age, setAge] = useState<string>("30");
  const [city, setCity] = useState<string>("Mumbai");
  const [familySize, setFamilySize] = useState<string>("1");
  const [premiumBudget, setPremiumBudget] = useState<string>("20000");
  const [sumInsured, setSumInsured] = useState<string>("500000");
  const [preferredCoverage, setPreferredCoverage] = useState<string>("Individual");
  const [hasPreExistingDiseases, setHasPreExistingDiseases] = useState<boolean>(false);
  const [copayPreference, setCopayPreference] = useState<string>("any");
  const [roomRentPreference, setRoomRentPreference] = useState<string>("any");
  const [deductiblePreference, setDeductiblePreference] = useState<string>("any");

  // Endpoint response state
  const [data, setData] = useState<AdvisorResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected plans comparison state (maximum 3)
  const [selectedPlans, setSelectedPlans] = useState<RecommendedPlan[]>([]);

  // Form submit handler
  const handleQueryAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSelectedPlans([]);

    const payload = {
      age: parseInt(age),
      city,
      family_size: parseInt(familySize),
      premium_budget: parseFloat(premiumBudget),
      sum_insured: parseFloat(sumInsured),
      preferred_coverage: preferredCoverage,
      has_pre_existing_diseases: hasPreExistingDiseases,
      copay_preference: copayPreference,
      room_rent_preference: roomRentPreference,
      deductible_preference: deductiblePreference
    };

    try {
      const response = await fetch("http://localhost:8000/api/insurance/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Extract validation detail if present
        let msg = "Failed to run advisor.";
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            msg = errorData.detail.map((err: { msg: string }) => err.msg).join(", ");
          } else {
            msg = errorData.detail;
          }
        }
        throw new Error(msg);
      }

      const result: AdvisorResponse = await response.json();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle plan comparison selection
  const handleToggleSelectPlan = (plan: RecommendedPlan) => {
    setSelectedPlans((prev) => {
      const exists = prev.some((p) => p.plan_name === plan.plan_name);
      if (exists) {
        return prev.filter((p) => p.plan_name !== plan.plan_name);
      } else {
        if (prev.length >= 3) return prev; // Cap at 3
        return [...prev, plan];
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s === "MATCHED") {
      return "bg-accent-secondary/15 text-accent-secondary border-accent-secondary/35";
    }
    if (s === "PARTIALLY MATCHED") {
      return "bg-accent-primary/10 text-accent-primary border-accent-primary/20";
    }
    return "bg-error/10 text-error border-error/15";
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 text-text-primary max-w-6xl mx-auto space-y-8 select-none">
      
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Insurance Advisor</h1>
          <p className="text-xs text-text-secondary mt-1">
            Compare plans suitable based on your demographics, preferences, and yearly premium budgets
          </p>
        </div>
        <div className="flex items-center gap-2 rounded border border-accent-secondary/35 bg-accent-secondary/5 px-2.5 py-1 text-[11px] font-medium text-accent-secondary self-start sm:self-auto">
          <ShieldCheck size={13} />
          <span>Demo Advisor Mode</span>
        </div>
      </header>

      {/* Underwriting Alert Banner */}
      <div className="bg-bg/40 border border-border/70 rounded-lg p-4 flex gap-3 text-xs text-text-secondary">
        <Info size={18} className="text-accent-secondary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-text-primary">Medical Underwriting Notice</p>
          <p>
            This engine performs deterministic suitability matching. It does not perform medical underwriting, 
            guarantee coverage issuance, or make final insurance contract commitments.
          </p>
        </div>
      </div>

      {/* 1. Requirements Input Form */}
      <section className="bg-surface rounded-lg border border-border p-6 shadow-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 mb-4 border-b border-border pb-3">
          <Filter size={16} className="text-accent-primary" />
          <span>Stated Insurance Requirements</span>
        </h2>

        <form onSubmit={handleQueryAdvisor} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
            {/* Age */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">PRIMARY INSURED AGE</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>

            {/* City */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">CITY / REGION</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bangalore">Bangalore</option>
              </select>
            </div>

            {/* Family size */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">FAMILY MEMBERS COUNT</label>
              <input
                type="number"
                value={familySize}
                onChange={(e) => setFamilySize(e.target.value)}
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>

            {/* Preferred coverage */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">COVERAGE TYPE</label>
              <select
                value={preferredCoverage}
                onChange={(e) => setPreferredCoverage(e.target.value)}
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="Individual">Individual Plan</option>
                <option value="Family Floater">Family Floater</option>
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">YEARLY BUDGET LIMIT (₹)</label>
              <input
                type="number"
                value={premiumBudget}
                onChange={(e) => setPremiumBudget(e.target.value)}
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>

            {/* Sum insured */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">DESIRED SUM INSURED (₹)</label>
              <input
                type="number"
                value={sumInsured}
                onChange={(e) => setSumInsured(e.target.value)}
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>

            {/* Preferences */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">CO-PAY PREFERENCE</label>
              <select
                value={copayPreference}
                onChange={(e) => setCopayPreference(e.target.value)}
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="any">No Preference (Include Co-pay)</option>
                <option value="no_copay">Exclude Co-pay Plans</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-text-secondary mb-1">ICU / ROOM RENT PREFERENCE</label>
              <select
                value={roomRentPreference}
                onChange={(e) => setRoomRentPreference(e.target.value)}
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="any">No Preference (Allow rent caps)</option>
                <option value="no_limit">Exclude plans with Room Rent Limits</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-text-secondary mb-1">DEDUCTIBLE PREFERENCE</label>
              <select
                value={deductiblePreference}
                onChange={(e) => setDeductiblePreference(e.target.value)}
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="any">No Preference (Allow deductibles)</option>
                <option value="no_deductible">Exclude plans with Deductibles</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-4 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <label className="relative flex items-center gap-2 font-semibold text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasPreExistingDiseases}
                  onChange={(e) => setHasPreExistingDiseases(e.target.checked)}
                  className="rounded border-border text-accent-primary focus:ring-0 cursor-pointer h-4 w-4"
                />
                <span>I have pre-existing medical conditions</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-accent-primary text-white px-5 py-2 rounded font-bold hover:bg-accent-primary/95 transition-colors flex items-center justify-center gap-2 self-end sm:self-auto"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  <span>Evaluating plans...</span>
                </>
              ) : (
                <>
                  <span>Match Suitable Plans</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 rounded bg-error/10 border border-error/15 p-2.5 flex items-start gap-2 text-xs text-error">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </section>

      {/* 2. Side-by-Side Comparison Panel (if selected) */}
      {selectedPlans.length > 0 && (
        <section className="bg-surface rounded-lg border-2 border-accent-secondary/40 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <CheckCircle size={16} className="text-accent-secondary animate-pulse" />
              <span>Plans Comparison panel ({selectedPlans.length}/3)</span>
            </h2>
            <button
              onClick={() => setSelectedPlans([])}
              className="text-[10px] font-bold text-error hover:underline"
            >
              Clear Comparison
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-border">
              <thead>
                <tr className="bg-bg/40 text-text-secondary border-b border-border">
                  <th className="p-3 border border-border">Parameter</th>
                  {selectedPlans.map((plan, idx) => (
                    <th key={idx} className="p-3 border border-border font-bold text-text-primary">
                      {plan.plan_name} <span className="text-[10px] text-text-secondary font-medium">({plan.insurer})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-text-secondary">
                <tr>
                  <td className="p-3 font-semibold text-text-primary border border-border">Illustrative Premium</td>
                  {selectedPlans.map((p, idx) => (
                    <td key={idx} className="p-3 border border-border font-bold text-accent-primary">
                      {formatCurrency(p.illustrative_premium)} / year
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-primary border border-border">Sum Insured</td>
                  {selectedPlans.map((p, idx) => (
                    <td key={idx} className="p-3 border border-border font-medium">
                      {formatCurrency(p.sum_insured)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-primary border border-border">Co-pay Condition</td>
                  {selectedPlans.map((p, idx) => (
                    <td key={idx} className="p-3 border border-border">{p.co_payment}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-primary border border-border">Deductible</td>
                  {selectedPlans.map((p, idx) => (
                    <td key={idx} className="p-3 border border-border">{p.deductible}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-primary border border-border">Room Rent Cap</td>
                  {selectedPlans.map((p, idx) => (
                    <td key={idx} className="p-3 border border-border">{p.room_rent_limit}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-primary border border-border">Waiting Periods</td>
                  {selectedPlans.map((p, idx) => (
                    <td key={idx} className="p-3 border border-border">{p.waiting_periods}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-primary border border-border">Key Exclusions</td>
                  {selectedPlans.map((p, idx) => (
                    <td key={idx} className="p-3 border border-border text-[11px] leading-relaxed">
                      {p.exclusions.join(", ")}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-primary border border-border">Data Source</td>
                  {selectedPlans.map((p, idx) => (
                    <td key={idx} className="p-3 border border-border text-[10px]">
                      {p.source} (Ver. {p.verification_date})
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-primary border border-border">Data Status</td>
                  {selectedPlans.map((p, idx) => (
                    <td key={idx} className="p-3 border border-border">
                      <span className="bg-accent-primary/10 text-accent-primary px-1.5 py-0.5 rounded text-[8px] font-bold">
                        {p.data_status}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. Query Recommendation Results list */}
      {data && !isLoading && (
        <div className="space-y-5">
          <div className="flex justify-between items-center text-xs text-text-secondary font-semibold uppercase tracking-wider">
            <span>Query Matches: {data.results.length} Plans Matches Found</span>
            <span>Sorted by Match priority</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {data.results.map((plan, idx) => {
              const isSelected = selectedPlans.some((p) => p.plan_name === plan.plan_name);
              return (
                <div
                  key={idx}
                  className={`bg-surface border rounded-lg p-6 shadow-xs flex flex-col md:flex-row justify-between gap-6 transition-all ${
                    isSelected
                      ? "border-accent-secondary ring-1 ring-accent-secondary"
                      : "border-border hover:border-border/100"
                  }`}
                >
                  {/* Left Column: Plan Core Specs */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-text-primary">{plan.plan_name}</h3>
                        <p className="text-xs text-text-secondary mt-0.5">{plan.insurer} &bull; Mapped: {plan.city_scope}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusBadgeStyle(plan.match_status)}`}>
                          {plan.match_status}
                        </span>
                        <button
                          onClick={() => handleToggleSelectPlan(plan)}
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded border transition-colors ${
                            isSelected
                              ? "bg-accent-secondary text-white border-accent-secondary"
                              : "bg-surface text-text-secondary border-border hover:bg-bg"
                          }`}
                        >
                          {isSelected ? "Remove Compare" : "Select Compare"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg/30 border border-border/50 rounded p-3.5 text-xs text-text-secondary">
                      <div>
                        <p className="text-[9px] font-bold text-text-secondary uppercase">Illustrative Premium</p>
                        <p className="font-bold text-accent-primary text-sm mt-0.5">
                          {formatCurrency(plan.illustrative_premium)} <span className="text-[9px] font-medium text-text-secondary">/ yr</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-text-secondary uppercase">Sum Insured</p>
                        <p className="font-semibold text-text-primary text-xs mt-0.5">{formatCurrency(plan.sum_insured)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-text-secondary uppercase">Co-pay Condition</p>
                        <p className="font-semibold text-text-primary text-xs mt-0.5 truncate">{plan.co_payment}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-text-secondary uppercase">Deductible</p>
                        <p className="font-semibold text-text-primary text-xs mt-0.5">{plan.deductible}</p>
                      </div>
                    </div>

                    {/* Reasons mapped */}
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-text-primary uppercase tracking-wide">Match Factors Reasons:</p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {plan.match_reasons.map((reason, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-bg border border-border rounded px-2 py-0.5 text-[10px] text-text-secondary">
                            <Check size={11} className="text-accent-secondary shrink-0" />
                            <span>{reason}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Strengths / Limitations & Advisor Queries */}
                  <div className="border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-6 w-full md:w-80 flex flex-col justify-between text-xs text-text-secondary gap-3">
                    <div className="space-y-2">
                      {plan.strengths.length > 0 && (
                        <div>
                          <p className="font-bold text-[10px] text-accent-secondary uppercase tracking-wider">Plan Strengths:</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] mt-0.5">
                            {plan.strengths.map((str, i) => <li key={i}>{str}</li>)}
                          </ul>
                        </div>
                      )}
                      
                      {plan.limitations.length > 0 && (
                        <div>
                          <p className="font-bold text-[10px] text-error uppercase tracking-wider">Plan Limitations:</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] mt-0.5">
                            {plan.limitations.map((lim, i) => <li key={i}>{lim}</li>)}
                          </ul>
                        </div>
                      )}

                      <div>
                        <p className="font-bold text-[10px] text-text-primary uppercase tracking-wider">Questions for Insurer:</p>
                        <ul className="list-decimal pl-4 space-y-0.5 text-[10px] mt-0.5 text-text-secondary leading-relaxed">
                          {plan.questions_to_ask.slice(0, 2).map((q, i) => <li key={i}>{q}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] border-t border-border/40 pt-2 shrink-0">
                      <div>
                        <span className="bg-accent-primary/10 text-accent-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px] mr-1.5">
                          {plan.data_status}
                        </span>
                        <span>Ver. {plan.verification_date}</span>
                      </div>
                      <span className="text-text-secondary italic">Source: {plan.source}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Underwriting disclaimers */}
          <div className="bg-error/5 border border-error/15 rounded-lg p-4 text-[10px] text-text-secondary flex gap-2">
            <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
            <p>
              <strong>Advisor Suitability Disclaimer</strong>: {data.disclaimer}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
