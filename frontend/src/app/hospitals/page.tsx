"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Hospital,
  ShieldCheck,
  Filter,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  Building
} from "lucide-react";

interface HospitalNetworkRecord {
  hospital_name: string;
  city: string;
  location: string;
  specialties: string[];
  procedure_name: string | null;
  insurer_name: string;
  network_status: string;
  cashless_status: string;
  source: string;
  data_status: string;
  verification_date: string | null;
}

interface NetworkResponse {
  query_params: Record<string, unknown>;
  results: HospitalNetworkRecord[];
  disclaimer: string;
}

export default function HospitalNetworkPage() {
  // Query Filters state
  const [city, setCity] = useState<string>("All");
  const [insurer, setInsurer] = useState<string>("All");
  const [procedure, setProcedure] = useState<string>("All");
  const [specialty, setSpecialty] = useState<string>("All");
  const [cashless, setCashless] = useState<string>("All");

  // Endpoint response state
  const [data, setData] = useState<NetworkResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch network data handler
  const fetchNetwork = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const params = new URLSearchParams();
    if (city && city !== "All") params.append("city", city);
    if (insurer && insurer !== "All") params.append("insurer", insurer);
    if (procedure && procedure !== "All") params.append("procedure", procedure);
    if (specialty && specialty !== "All") params.append("specialty", specialty);
    
    if (cashless === "Yes") {
      params.append("cashless", "true");
    } else if (cashless === "No") {
      params.append("cashless", "false");
    }

    try {
      const response = await fetch(`http://localhost:8000/api/hospitals/network?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to search hospital network.");
      }
      const result: NetworkResponse = await response.json();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, [city, insurer, procedure, specialty, cashless]);

  // Fetch query matches on parameter changes
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        fetchNetwork();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchNetwork]);

  // Redirect parameter cache to populate Costs Comparative filters
  const handleLaunchCostsQuery = (record: HospitalNetworkRecord) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "carefin_costs_query_params",
        JSON.stringify({
          city: record.city,
          procedure: record.procedure_name || "Angioplasty"
        })
      );
    }
  };

  const getBadgeStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes("VERIFIED") || s.includes("IN_NETWORK")) {
      return "bg-accent-secondary/15 text-accent-secondary border-accent-secondary/30";
    }
    if (s.includes("DEMO")) {
      return "bg-accent-primary/10 text-accent-primary border-accent-primary/20";
    }
    return "bg-error/10 text-error border-error/20";
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 text-text-primary max-w-6xl mx-auto space-y-8 select-none">
      
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Hospital Network & Cashless Finder</h1>
          <p className="text-xs text-text-secondary mt-1">
            Search active networks, cashless verifications, and pre-authorization status across local providers
          </p>
        </div>
        <div className="flex items-center gap-2 rounded border border-accent-secondary/35 bg-accent-secondary/5 px-2.5 py-1 text-[11px] font-medium text-accent-secondary self-start sm:self-auto">
          <ShieldCheck size={13} />
          <span>Demo Network Mode</span>
        </div>
      </header>

      {/* 1. Quick Info Banner */}
      <div className="bg-bg/40 border border-border/70 rounded p-3 flex gap-2 text-xs text-text-secondary">
        <Info size={16} className="text-accent-secondary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-text-primary">Network Status notice</span>: Cashless and network listings displayed 
          represent benchmarks labeled <span className="font-bold text-accent-primary bg-accent-primary/10 px-1 py-0.5 rounded text-[10px]">DEMO DATA</span>. 
          Cashless/network status must be verified with the insurer, TPA, or hospital before admission.
        </div>
      </div>

      {/* 2. Query Filters criteria */}
      <section className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <Filter size={15} className="text-accent-primary" />
          <span>Search & Network Criteria</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          
          {/* City */}
          <div>
            <label className="block font-semibold text-text-secondary mb-1">CITY</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="All">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
            </select>
          </div>

          {/* Insurer */}
          <div>
            <label className="block font-semibold text-text-secondary mb-1">INSURER</label>
            <select
              value={insurer}
              onChange={(e) => setInsurer(e.target.value)}
              className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="All">All Insurers</option>
              <option value="CareGuard Insurance">CareGuard Insurance</option>
              <option value="Optima Health">Optima Health</option>
              <option value="Bharat Medical">Bharat Medical</option>
            </select>
          </div>

          {/* Procedure */}
          <div>
            <label className="block font-semibold text-text-secondary mb-1">PROCEDURE</label>
            <select
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
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

          {/* Specialty */}
          <div>
            <label className="block font-semibold text-text-secondary mb-1">SPECIALTY</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="All">All Specialties</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Oncology">Oncology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Ophthalmology">Ophthalmology</option>
              <option value="General Surgery">General Surgery</option>
            </select>
          </div>

          {/* Cashless Status */}
          <div>
            <label className="block font-semibold text-text-secondary mb-1">CASHLESS PRE-AUTH</label>
            <select
              value={cashless}
              onChange={(e) => setCashless(e.target.value)}
              className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="All">All Options</option>
              <option value="Yes">Yes (Cashless Enabled)</option>
              <option value="No">No / Not Available</option>
            </select>
          </div>

        </div>
      </section>

      {/* 3. Query Matches lists */}
      {isLoading && (
        <div className="text-center py-12 text-sm text-text-secondary flex justify-center items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent-primary border-t-transparent"></div>
          <span>Loading network connections data...</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded bg-error/10 border border-error/15 p-3 flex items-start gap-2 text-xs text-error max-w-2xl">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-4">
          
          <div className="flex justify-between items-center text-xs text-text-secondary font-semibold uppercase tracking-wider">
            <span>Query Matches: {data.results.length} Relations Found</span>
            <span>Deterministic AND matching filters active</span>
          </div>

          {data.results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.results.map((record, idx) => (
                <div key={idx} className="bg-surface border border-border hover:border-border/100 rounded-lg p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                          <Building size={15} className="text-accent-secondary shrink-0" />
                          <span>{record.hospital_name}</span>
                        </h3>
                        <p className="text-[11px] text-text-secondary mt-0.5">{record.location}, {record.city}</p>
                      </div>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getBadgeStyle(record.data_status)}`}>
                        {record.data_status}
                      </span>
                    </div>

                    {/* Specialties chips */}
                    <div className="flex flex-wrap gap-1">
                      {record.specialties.map((spec) => (
                        <span key={spec} className="bg-bg text-text-secondary text-[9px] font-semibold px-2 py-0.5 rounded border border-border">
                          {spec}
                        </span>
                      ))}
                    </div>

                    {/* Network details */}
                    <div className="bg-bg/40 border border-border/50 rounded p-3 text-xs space-y-1.5 text-text-secondary">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-text-primary">Insurer Partner:</span>
                        <span className="font-bold text-text-primary">{record.insurer_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Network Status:</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getBadgeStyle(record.network_status)}`}>
                          {record.network_status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Cashless Pre-Auth:</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getBadgeStyle(record.cashless_status)}`}>
                          {record.cashless_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[10px] text-text-secondary gap-3">
                    <div>
                      <span className="font-semibold text-text-primary">Source: </span>
                      <span>{record.source} (Ver. {record.verification_date || "N/A"})</span>
                    </div>

                    <Link
                      href="/costs"
                      onClick={() => handleLaunchCostsQuery(record)}
                      className="text-accent-primary font-bold hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Treatment Costs</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg p-12 text-center text-xs text-text-secondary flex flex-col items-center justify-center space-y-2">
              <Hospital size={28} className="text-text-secondary/45 animate-bounce" />
              <p className="font-bold">No network matches found</p>
              <p>Verify that the selected insurer partners exist in your selected cities.</p>
            </div>
          )}

          {/* Disclaimer details */}
          <div className="bg-error/5 border border-error/15 rounded-lg p-4 text-[10px] text-text-secondary flex gap-2">
            <HelpCircle size={15} className="text-error shrink-0 mt-0.5" />
            <p>
              <strong>Network Mappings Disclaimer</strong>: {data.disclaimer}
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
