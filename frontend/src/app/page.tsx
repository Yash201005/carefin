"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileCheck,
  Calendar,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react";

export default function CareFinDashboard() {
  // Demo statistics clearly tagged as sample data
  const coverageTotal = 500000;
  const coverageRemaining = 370000;
  const coveragePercentage = (coverageRemaining / coverageTotal) * 100;

  const mockClaims = [
    { id: 1, procedure: "Cataract Surgery Estimate", status: "In Review", amount: 45000, date: "18-Aug-2026" }
  ];

  const recentDocuments = [
    { name: "policy_terms_schedule.pdf", type: "PDF Policy Booklet", size: "2.1 MB", date: "15-Aug-2026" },
    { name: "hospital_estimate_sheet.pdf", type: "PDF Claim Estimate", size: "1.4 MB", date: "18-Aug-2026" }
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 text-text-primary max-w-6xl mx-auto space-y-8 select-none">

      {/* 1. Header Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Welcome to CareFin</h1>
          <p className="text-xs text-text-secondary mt-1">
            Indian healthcare financial guidance, policy breakdowns, and out-of-pocket cost simulations
          </p>
        </div>
        <div className="flex items-center gap-2 rounded border border-accent-secondary/35 bg-accent-secondary/5 px-2.5 py-1 text-[11px] font-medium text-accent-secondary self-start sm:self-auto">
          <ShieldCheck size={13} />
          <span>Demo Data Mode</span>
        </div>
      </header>

      {/* 2. Main Call to Action (Launches Policy Analyzer) */}
      <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-accent-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Featured Product</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary">Estimate Your Out-of-Pocket Hospital Exposure</h2>
          <p className="text-xs leading-5 text-text-secondary">
            Upload your health insurance policy schedule to extract co-pays, deductibles, and room rent caps,
            then input estimated charges to see your exact patient share computed deterministically.
          </p>
        </div>
        <Link
          href="/insurance"
          className="bg-accent-primary text-white text-xs font-bold px-4 py-2.5 rounded hover:bg-accent-primary/95 transition-colors flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <span>Launch Policy Analyzer</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* 3. Dashboard Grid Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Widget 1: Coverage Summary */}
        <section className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent-secondary" />
              <span>Insurance Coverage</span>
            </h3>
            <span className="rounded bg-accent-secondary/15 px-2 py-0.5 text-[9px] font-bold text-accent-secondary">
              DEMO DATA
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-text-secondary">Remaining Coverage</span>
              <span>₹{coverageRemaining.toLocaleString()} / ₹{coverageTotal.toLocaleString()}</span>
            </div>
            {/* Visual Bar graph */}
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-accent-secondary h-2 rounded-full transition-all"
                style={{ width: `${coveragePercentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-text-secondary italic pt-1">
              Active Policy: HDFC Ergo Optima Secure (Sum Insured: ₹5,00,000)
            </p>
          </div>
        </section>

        {/* Widget 2: Renewal & Renewals Timeline */}
        <section className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Calendar size={16} className="text-accent-primary" />
              <span>Policy Renewal Details</span>
            </h3>
            <span className="rounded bg-accent-primary/15 px-2 py-0.5 text-[9px] font-bold text-accent-primary">
              DEMO DATA
            </span>
          </div>

          <div className="flex items-center gap-3 bg-bg border border-border/60 rounded p-3 text-xs">
            <div className="bg-accent-primary/10 text-accent-primary p-2 rounded">
              <Calendar size={18} />
            </div>
            <div>
              <p className="font-semibold">Expires on 15-Mar-2027</p>
              <p className="text-text-secondary text-[10px] mt-0.5">208 Days remaining until renewal date</p>
            </div>
          </div>
        </section>

        {/* Widget 3: Active Claims */}
        <section className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <FileCheck size={16} className="text-accent-secondary" />
              <span>Active Claims & Estimates</span>
            </h3>
            <span className="rounded bg-accent-secondary/15 px-2 py-0.5 text-[9px] font-bold text-accent-secondary">
              DEMO DATA
            </span>
          </div>

          {mockClaims.map((claim) => (
            <div key={claim.id} className="border border-border/70 rounded p-3 text-xs bg-bg/25 space-y-1.5">
              <div className="flex justify-between items-center font-semibold text-text-primary">
                <span>{claim.procedure}</span>
                <span className="text-[10px] bg-accent-primary/10 text-accent-primary px-1.5 py-0.5 rounded">
                  {claim.status}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-text-secondary">
                <span>Requested: ₹{claim.amount.toLocaleString()}</span>
                <span>Submitted: {claim.date}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Widget 4: Financial Risk Summary */}
        <section className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <AlertTriangle size={16} className="text-error" />
              <span>Estimated OOP Financial Risk</span>
            </h3>
            <span className="rounded bg-error/15 px-2 py-0.5 text-[9px] font-bold text-error">
              ESTIMATE
            </span>
          </div>

          <div className="bg-error/5 border border-error/15 rounded p-3 text-xs space-y-1 text-text-secondary">
            <p className="font-semibold text-text-primary">Projected Exposure: ₹54,800</p>
            <p className="text-[10px] leading-4 text-text-secondary mt-1">
              Estimated out-of-pocket costs are generated based on Single Private room rent limits and deductible thresholds
              modeled in your policy analyzer simulation.
            </p>
          </div>
        </section>
      </div>

      {/* 4. Recent Documents Summary */}
      <section className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <FolderOpen size={16} className="text-accent-secondary" />
            <span>Recent Insurance Documents</span>
          </h3>
          <span className="rounded bg-accent-secondary/15 px-2 py-0.5 text-[9px] font-bold text-accent-secondary">
            USER UPLOADED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recentDocuments.map((doc, idx) => (
            <div key={idx} className="border border-border/80 rounded p-3 flex items-center justify-between bg-bg/25 text-xs">
              <div className="flex items-center gap-2">
                <FolderOpen size={16} className="text-text-secondary" />
                <div>
                  <p className="font-semibold text-text-primary">{doc.name}</p>
                  <p className="text-[10px] text-text-secondary">{doc.type} • {doc.size}</p>
                </div>
              </div>
              <span className="text-[10px] text-text-secondary">{doc.date}</span>
            </div>
          ))}
        </div>

        <div className="bg-bg/40 border border-border/50 rounded p-2.5 text-[10px] text-text-secondary flex gap-2">
          <Info size={14} className="text-text-secondary shrink-0 mt-0.5" />
          <p>
            <strong>General Disclaimer</strong>: This dashboard represents mock/demo parameters and calculation estimations.
            Active insurance parameters should be confirmed through official insurer booklets.
          </p>
        </div>
      </section>

    </div>
  );
}
