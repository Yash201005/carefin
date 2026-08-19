import React from "react";
import { ShieldAlert } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg p-8 text-text-primary">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-accent-primary/10 p-2 text-accent-primary">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">
              CareFin
            </h1>
            <p className="text-sm text-text-secondary">
              Healthcare Insurance & Medical Funding Advisor
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <div className="rounded bg-bg p-3 text-sm text-text-secondary">
            <p className="font-semibold text-text-primary">SPEC-001 Foundation Setup</p>
            <p className="mt-1">CareFin Project Foundation Initialized. No business components loaded.</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
          <span>Target: Indian Healthcare</span>
          <span>Status: Clean</span>
        </div>
      </div>
    </main>
  );
}
