"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Filter,
  Info,
  Building,
  Coins,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface FundingSourceRecord {
  name: string;
  category: string;
  description: string;
  eligibility_notes: string;
  geographic_scope: string;
  treatment_scope: string;
  source: string;
  verification_date: string | null;
  data_status: string;
  limitations: string;
  application_notes: string;
}

interface CrowdfundingPlatformRecord {
  platform_name: string;
  platform_fee_percentage: number;
  payment_processing_fee_percentage: number;
  tax_percentage: number;
  fixed_transaction_fee: number;
  payment_processing_assumptions: string;
  tax_assumptions: string;
  fixed_fee_assumptions: string;
  source: string;
  verification_date: string | null;
  data_status: string;
}

interface FundingSourcesResponse {
  sources: FundingSourceRecord[];
  platforms: CrowdfundingPlatformRecord[];
  disclaimer: string;
}

interface FeeBreakdown {
  platform_fee: number;
  payment_processing_fee: number;
  applicable_taxes: number;
  fixed_fees: number;
  total_deductions: number;
}

interface CrowdfundingResponse {
  inputs: {
    required_funding_amount: number;
    platform_fee_percentage: number;
    payment_processing_fee_percentage: number;
    tax_percentage: number;
    fixed_transaction_fee: number;
  };
  required_gross_target: number;
  fee_breakdown: FeeBreakdown;
  estimated_net_amount: number;
  status: string;
}

export default function MedicalFundingPage() {
  // Treatment Gap State
  const [totalCost, setTotalCost] = useState<string>("500000");
  const [insuranceCovered, setInsuranceCovered] = useState<string>("300000");
  const [patientContribution, setPatientContribution] = useState<string>("50000");
  const [otherAssistance, setOtherAssistance] = useState<string>("0");
  const [fundingGap, setFundingGap] = useState<number>(150000);
  const [isCalculatingGap, setIsCalculatingGap] = useState<boolean>(false);
  const [gapError, setGapError] = useState<string | null>(null);

  // Label indicators for imported values
  const [costSourceLabel, setCostSourceLabel] = useState<string>("USER PROVIDED");
  const [patientSourceLabel, setPatientSourceLabel] = useState<string>("USER PROVIDED");

  // Crowdfunding calculator State
  const [requiredNet, setRequiredNet] = useState<string>("150000");
  const [selectedPlatformName, setSelectedPlatformName] = useState<string>("CareFin Demo Platform");
  const [customPlatform, setCustomPlatform] = useState<boolean>(false);
  const [platFeePct, setPlatFeePct] = useState<string>("2.0");
  const [gateFeePct, setGateFeePct] = useState<string>("2.5");
  const [taxPct, setTaxPct] = useState<string>("0.5");
  const [fixedFee, setFixedFee] = useState<string>("15");

  const [crowdfundResult, setCrowdfundResult] = useState<CrowdfundingResponse | null>(null);
  const [isCalculatingCrowdfund, setIsCalculatingCrowdfund] = useState<boolean>(false);
  const [crowdfundError, setCrowdfundError] = useState<string | null>(null);

  // General references State
  const [sources, setSources] = useState<FundingSourceRecord[]>([]);
  const [platforms, setPlatforms] = useState<CrowdfundingPlatformRecord[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>("");
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // AI explanation helper State
  const [explanationQuery, setExplanationQuery] = useState<string>("");
  const [explanationText, setExplanationText] = useState<string>("");

  // Prepopulate from localStorage integrations (SPEC-007 / SPEC-008 integrations)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Costs page redirect
      const costsCached = localStorage.getItem("carefin_oop_sim_input");
      if (costsCached) {
        try {
          const parsed = JSON.parse(costsCached);
          if (parsed.treatment_cost) {
            setTimeout(() => {
              setTotalCost(String(parsed.treatment_cost));
              setCostSourceLabel("CALCULATED FROM CAREFIN (Costs Panel)");
            }, 0);
          }
        } catch {
          // Ignore
        }
      }

      // 2. Policy Analyzer redirect
      const policyCached = localStorage.getItem("carefin_last_oop_calculation");
      if (policyCached) {
        try {
          const parsed = JSON.parse(policyCached);
          if (parsed.breakdown) {
            const oop = parsed.breakdown.estimated_patient_responsibility;
            const total = parsed.breakdown.total_treatment_cost;
            const insContribution = parsed.breakdown.estimated_insurance_contribution;

            setTimeout(() => {
              setTotalCost(String(total));
              setInsuranceCovered(String(insContribution));
              setPatientContribution(String(oop));
              setCostSourceLabel("CALCULATED FROM CAREFIN (Policy Analyzer)");
              setPatientSourceLabel("ESTIMATE (Policy Analyzer OOP)");
            }, 0);
          }
        } catch {
          // Ignore
        }
      }
    }
  }, []);

  // Fetch Funding Sources and Platform registries
  const fetchSources = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/funding/sources");
      if (!response.ok) {
        throw new Error("Failed to fetch funding registry data.");
      }
      const data: FundingSourcesResponse = await response.json();
      setSources(data.sources);
      setPlatforms(data.platforms);
      setDisclaimer(data.disclaimer);
    } catch {
      // Fallbacks in case backend goes offline
      setDisclaimer("Calculations represent mock references only.");
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        fetchSources();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchSources]);

  // Dynamic plat fees selection
  useEffect(() => {
    if (selectedPlatformName !== "Custom" && platforms.length > 0) {
      const plat = platforms.find((p) => p.platform_name === selectedPlatformName);
      if (plat) {
        setTimeout(() => {
          setPlatFeePct(String(plat.platform_fee_percentage));
          setGateFeePct(String(plat.payment_processing_fee_percentage));
          setTaxPct(String(plat.tax_percentage));
          setFixedFee(String(plat.fixed_transaction_fee));
          setCustomPlatform(false);
        }, 0);
      }
    } else if (selectedPlatformName === "Custom") {
      setTimeout(() => {
        setCustomPlatform(true);
      }, 0);
    }
  }, [selectedPlatformName, platforms]);

  // Deterministic Gap Calculations
  const calculateGap = useCallback(async () => {
    setIsCalculatingGap(true);
    setGapError(null);

    const payload = {
      total_treatment_cost: parseFloat(totalCost) || 0,
      insurance_covered_amount: parseFloat(insuranceCovered) || 0,
      patient_contribution: parseFloat(patientContribution) || 0,
      confirmed_other_assistance: parseFloat(otherAssistance) || 0
    };

    try {
      const response = await fetch("http://localhost:8000/api/funding/calculate-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Validation error.");
      }

      const data = await response.json();
      setFundingGap(data.funding_gap);
      // Synchronize requiredNet crowdfunding input with the newly computed gap
      setRequiredNet(String(data.funding_gap));
    } catch (err: unknown) {
      setGapError(err instanceof Error ? err.message : "Error computing gap.");
    } finally {
      setIsCalculatingGap(false);
    }
  }, [totalCost, insuranceCovered, patientContribution, otherAssistance]);

  // Auto trigger gap calculation when costs change
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateGap();
    }, 200);
    return () => clearTimeout(timer);
  }, [calculateGap]);

  // Deterministic Crowdfunding Calculations
  const calculateCrowdfund = useCallback(async () => {
    setIsCalculatingCrowdfund(true);
    setCrowdfundError(null);

    const payload = {
      required_funding_amount: parseFloat(requiredNet) || 0,
      platform_fee_percentage: parseFloat(platFeePct) || 0,
      payment_processing_fee_percentage: parseFloat(gateFeePct) || 0,
      tax_percentage: parseFloat(taxPct) || 0,
      fixed_transaction_fee: parseFloat(fixedFee) || 0
    };

    try {
      const response = await fetch("http://localhost:8000/api/funding/crowdfunding-calculation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Validation error in fee calculation.");
      }

      const data: CrowdfundingResponse = await response.json();
      setCrowdfundResult(data);
    } catch (err: unknown) {
      setCrowdfundError(err instanceof Error ? err.message : "Error calculating fees.");
    } finally {
      setIsCalculatingCrowdfund(false);
    }
  }, [requiredNet, platFeePct, gateFeePct, taxPct, fixedFee]);

  // Run initial crowdfunding targets estimation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateCrowdfund();
    }, 250);
    return () => clearTimeout(timer);
  }, [calculateCrowdfund]);

  // Explanation helper (mock AI interpreter explaining terms deterministically)
  const handleGetExplanation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanationQuery) return;

    const term = explanationQuery.toLowerCase();
    if (term.includes("platform") || term.includes("fee")) {
      setExplanationText(
        "Deterministic Explanation: Platform fees represent administrative charges levied by crowdfunding sites to maintain portals and servers. Milaap/Ketto charge 0% base platform fee, relying on voluntary tipping. CareFin computes this dynamically."
      );
    } else if (term.includes("gateway") || term.includes("processing")) {
      setExplanationText(
        "Deterministic Explanation: Payment processing fees are gateways fees (like Razorpay, Stripe) charged per transaction (typically 2-3%) to process debit cards, UPI, or net banking transfers safely."
      );
    } else if (term.includes("gap")) {
      setExplanationText(
        "Deterministic Explanation: The medical funding gap is the remaining unpaid treatment cost after subtracting insurance, self-contributions, and confirmed NGO or government medical grants."
      );
    } else {
      setExplanationText(
        "Deterministic Explanation: CareFin provides deterministic fee breakdowns. You can compare Ketto, Milaap, and custom platform fees using the calculator controls above."
      );
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 text-text-primary max-w-6xl mx-auto space-y-8 select-none">
      
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Medical Funding & Gap Planner</h1>
          <p className="text-xs text-text-secondary mt-1">
            Calculate your treatment funding gap, compare crowdfunding fees, and search medical financial grants transparently
          </p>
        </div>
        <div className="flex items-center gap-2 rounded border border-accent-secondary/35 bg-accent-secondary/5 px-2.5 py-1 text-[11px] font-medium text-accent-secondary self-start sm:self-auto">
          <ShieldCheck size={13} />
          <span>ESTIMATE</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Gap Planner Inputs & Funding Gap Results */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 mb-2 border-b border-border pb-2">
              <Filter size={15} className="text-accent-primary" />
              <span>1. Treatment Gap Planner</span>
            </h2>

            <form className="space-y-4 text-xs" onSubmit={(e) => e.preventDefault()}>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-text-secondary uppercase">Total Cost (₹)</label>
                  <span className="text-[9px] font-bold text-accent-primary bg-accent-primary/10 px-1 py-0.5 rounded">
                    {costSourceLabel}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={totalCost}
                  onChange={(e) => {
                    setTotalCost(e.target.value);
                    setCostSourceLabel("USER PROVIDED");
                  }}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-text-secondary uppercase">Insurance Share (₹)</label>
                  <span className="text-[9px] font-bold text-text-secondary/70 bg-border px-1 py-0.5 rounded">
                    CALCULATED FROM CAREFIN
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={insuranceCovered}
                  onChange={(e) => setInsuranceCovered(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-text-secondary uppercase">Personal Contribution (₹)</label>
                  <span className="text-[9px] font-bold text-accent-primary bg-accent-primary/10 px-1 py-0.5 rounded">
                    {patientSourceLabel}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={patientContribution}
                  onChange={(e) => {
                    setPatientContribution(e.target.value);
                    setPatientSourceLabel("USER PROVIDED");
                  }}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary uppercase mb-1">Other Confirmed Aid (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={otherAssistance}
                  onChange={(e) => setOtherAssistance(e.target.value)}
                  className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </form>

            {gapError && (
              <div className="rounded bg-error/10 border border-error/15 p-2 text-xs text-error">
                {gapError}
              </div>
            )}

            {/* Deterministic Gap Output */}
            <div className="bg-bg rounded border border-border p-4 text-center mt-4">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                Calculated Funding Gap
              </p>
              <p className="text-2xl font-extrabold text-error mt-1.5">
                {isCalculatingGap ? (
                  <span className="text-xs text-text-secondary font-medium">Recalculating...</span>
                ) : (
                  formatCurrency(fundingGap)
                )}
              </p>
              <p className="text-[9px] text-text-secondary mt-1">
                * Subtracts insurance, personal share, and assistant grants deterministically.
              </p>
            </div>
          </section>
        </div>

        {/* MIDDLE/RIGHT COLUMN: Crowdfunding calculator and Funding source registries */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CROWDFUNDING CALCULATOR */}
          <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Coins size={16} className="text-accent-secondary" />
                <span>2. Crowdfunding Target Calculator</span>
              </h2>
              <span className="rounded bg-accent-primary/10 px-2 py-0.5 text-[9px] font-bold text-accent-primary">
                ESTIMATE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form parameters */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-text-secondary uppercase mb-1">Required Net Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={requiredNet}
                    onChange={(e) => setRequiredNet(e.target.value)}
                    className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-text-secondary uppercase mb-1">Select Crowdfunding Platform</label>
                  <select
                    value={selectedPlatformName}
                    onChange={(e) => setSelectedPlatformName(e.target.value)}
                    className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  >
                    <option value="CareFin Demo Platform">CareFin Demo Platform (Demo Data)</option>
                    <option value="Ketto">Ketto (Reference Info)</option>
                    <option value="Milaap">Milaap (Reference Info)</option>
                    <option value="ImpactGuru">ImpactGuru (Reference Info)</option>
                    <option value="Custom">Custom fee configurations</option>
                  </select>
                </div>

                {customPlatform && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-bg/30 border border-border/50 rounded-lg">
                    <div>
                      <label className="block font-semibold text-text-secondary mb-1">Platform Fee (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="99.9"
                        value={platFeePct}
                        onChange={(e) => setPlatFeePct(e.target.value)}
                        className="w-full border border-border rounded p-1.5 text-xs bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-text-secondary mb-1">Payment Gate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="99.9"
                        value={gateFeePct}
                        onChange={(e) => setGateFeePct(e.target.value)}
                        className="w-full border border-border rounded p-1.5 text-xs bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-text-secondary mb-1">Applicable Tax (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="99.9"
                        value={taxPct}
                        onChange={(e) => setTaxPct(e.target.value)}
                        className="w-full border border-border rounded p-1.5 text-xs bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-text-secondary mb-1">Fixed Fee / Don. (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={fixedFee}
                        onChange={(e) => setFixedFee(e.target.value)}
                        className="w-full border border-border rounded p-1.5 text-xs bg-surface"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fee Breakdown Display */}
              <div className="bg-bg/40 border border-border/70 rounded-lg p-5 flex flex-col justify-between space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-text-primary uppercase text-[10px] tracking-wider mb-2 border-b border-border/40 pb-1.5">
                    Deductions & Target Breakdown
                  </h3>
                  
                  {crowdfundResult && !isCalculatingCrowdfund ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between py-0.5 border-b border-border/30">
                        <span className="text-text-secondary">Required Net Funding</span>
                        <span className="font-semibold text-text-primary">{formatCurrency(crowdfundResult.inputs.required_funding_amount)}</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-border/30">
                        <span className="text-text-secondary">(+) Platform fee ({crowdfundResult.inputs.platform_fee_percentage}%)</span>
                        <span className="font-medium text-error">{formatCurrency(crowdfundResult.fee_breakdown.platform_fee)}</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-border/30">
                        <span className="text-text-secondary">(+) Processing gateway ({crowdfundResult.inputs.payment_processing_fee_percentage}%)</span>
                        <span className="font-medium text-error">{formatCurrency(crowdfundResult.fee_breakdown.payment_processing_fee)}</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-border/30">
                        <span className="text-text-secondary">(+) Service taxes ({crowdfundResult.inputs.tax_percentage}%)</span>
                        <span className="font-medium text-error">{formatCurrency(crowdfundResult.fee_breakdown.applicable_taxes)}</span>
                      </div>
                      {crowdfundResult.fee_breakdown.fixed_fees > 0 && (
                        <div className="flex justify-between py-0.5 border-b border-border/30">
                          <span className="text-text-secondary">(+) Fixed setup/transaction fee</span>
                          <span className="font-medium text-error">{formatCurrency(crowdfundResult.fee_breakdown.fixed_fees)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1 border-t border-border font-bold text-accent-primary text-sm pt-2">
                        <span>Fundraising Goal (Gross)</span>
                        <span>{formatCurrency(crowdfundResult.required_gross_target)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-text-secondary">Calculating targets...</div>
                  )}

                  {crowdfundError && (
                    <div className="rounded bg-error/10 border border-error/15 p-2 text-xs text-error mt-2">
                      {crowdfundError}
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-text-secondary leading-3.5 border-t border-border/40 pt-2.5">
                  <strong>Assumptions:</strong> Calculations assume standard platform rates. Taxes and setup fees are estimated based on local regulatory standards. Verify schedules directly before registering a campaign.
                </div>
              </div>

            </div>
          </section>

          {/* FUNDING SOURCES REGISTRY */}
          <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 mb-2 border-b border-border pb-2">
              <Building size={16} className="text-accent-primary" />
              <span>3. Centralized Assistance Registry</span>
            </h2>

            {isDataLoading && (
              <div className="text-center py-8 text-xs text-text-secondary flex justify-center items-center gap-2">
                <RefreshCw size={13} className="animate-spin text-accent-primary" />
                <span>Loading assistance databases...</span>
              </div>
            )}

            {!isDataLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map((src, index) => (
                  <div key={index} className="border border-border/80 rounded-lg p-4 bg-bg/15 flex flex-col justify-between space-y-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[8px] font-bold uppercase bg-accent-primary/10 text-accent-primary px-1.5 py-0.5 rounded">
                          {src.category}
                        </span>
                        <span className="text-[8px] font-bold bg-accent-secondary/15 text-accent-secondary px-1.5 py-0.5 rounded uppercase">
                          {src.data_status}
                        </span>
                      </div>
                      <h4 className="font-bold text-text-primary leading-4">{src.name}</h4>
                      <p className="text-text-secondary leading-4 text-[11px]">{src.description}</p>
                      
                      <div className="pt-2 border-t border-border/45 text-[10px] space-y-1 text-text-secondary">
                        <p><strong>Eligibility:</strong> {src.eligibility_notes}</p>
                        <p><strong>Geographic:</strong> {src.geographic_scope}</p>
                        <p><strong>Scope:</strong> {src.treatment_scope}</p>
                        <p><strong>Limit/Cap:</strong> {src.limitations}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-text-secondary border-t border-border/30 pt-2">
                      <span>Source: {src.source}</span>
                      <span>Ver. {src.verification_date || "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* FUTURE-COMPATIBLE GOVT ASSISTANCE WRAPPER */}
          <section className="bg-surface rounded-lg border border-border p-4 shadow-xs text-xs space-y-2 text-text-secondary leading-5">
            <p className="font-bold text-text-primary text-[11px]">Government Assistance Integration Notice</p>
            <p>
              Government assistance may reduce the funding gap if eligibility and benefit are independently verified. 
              You can check potentially relevant government schemes on our page. Confirmed payouts from government schemes must be explicitly inputted in the &apos;Other Confirmed Aid&apos; field of our Treatment Gap Planner.
            </p>
          </section>

          {/* AI CALCULATIONS TERMINOLOGY EXPLANATIONS */}
          <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5 border-b border-border pb-2">
              <Sparkles size={15} className="text-accent-primary animate-pulse" />
              <span>Medical Funding Explanation Service</span>
            </h3>

            <form onSubmit={handleGetExplanation} className="flex gap-2 text-xs">
              <input
                type="text"
                value={explanationQuery}
                onChange={(e) => setExplanationQuery(e.target.value)}
                placeholder="Ask about 'platform fees', 'processing gateways', or 'funding gap'..."
                className="flex-1 border border-border rounded p-2 focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              <button
                type="submit"
                className="bg-accent-primary text-white font-bold px-3 py-2 rounded hover:bg-accent-primary/95 transition-all text-xs"
              >
                Explain Term
              </button>
            </form>

            {explanationText && (
              <p className="text-xs bg-bg border border-border/70 rounded p-3 text-text-secondary leading-5">
                {explanationText}
              </p>
            )}
          </section>

        </div>

      </div>

      {/* Disclaimers Warn Footer */}
      <footer className="bg-bg/70 border border-border rounded-lg p-4 text-[10px] text-text-secondary flex gap-2.5">
        <Info size={16} className="text-text-secondary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-text-primary uppercase tracking-wide">
            Medical Funding estimate & Transparency Disclaimer:
          </p>
          <p className="leading-4">
            {disclaimer || "This is an estimate and does not guarantee the amount a crowdfunding platform, insurer, hospital, NGO, or other organization will provide."}
            CareFin calculations are deterministic, but platform setups, gate processing rates, and local taxation rules change frequently. CareFin does not create campaigns, host payment options, or register financial payouts. Always confirm rates directly with the platforms before launching.
          </p>
        </div>
      </footer>

    </div>
  );
}
