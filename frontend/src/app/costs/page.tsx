"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShieldCheck,
  Filter,
  ArrowUpDown,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Info
} from "lucide-react";

interface HospitalProcedureCost {
  procedure_name: string;
  estimated_cost: number;
  cost_range_min: number;
  cost_range_max: number;
  room_category_assumption: string;
  assumptions: string[];
  data_status: string;
  verification_date: string | null;
  source: string;
}

interface HospitalRecord {
  id: string;
  name: string;
  city: string;
  location: string;
  specialties: string[];
  cost_details: HospitalProcedureCost;
}

interface ComparisonResponse {
  query_params: Record<string, unknown>;
  results: HospitalRecord[];
  disclaimer: string;
}

export default function HealthcareCostsPage() {
  // Filter and Sorting state
  const [city, setCity] = useState<string>("Mumbai");
  const [procedure, setProcedure] = useState<string>("Angioplasty");
  const [specialty, setSpecialty] = useState<string>("All");
  const [minCost, setMinCost] = useState<string>("");
  const [maxCost, setMaxCost] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("cost_asc");

  // Query response state
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected hospitals comparison state (maximum 3)
  const [selectedHospitals, setSelectedHospitals] = useState<HospitalRecord[]>([]);

  // Fetch costs handler
  const fetchCosts = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    // Build query URL
    const params = new URLSearchParams();
    if (city && city !== "All") params.append("city", city);
    if (procedure) params.append("procedure", procedure);
    if (specialty && specialty !== "All") params.append("specialty", specialty);
    if (minCost) params.append("min_cost", minCost);
    if (maxCost) params.append("max_cost", maxCost);
    if (sortBy) params.append("sort_by", sortBy);

    try {
      const response = await fetch(`http://localhost:8000/api/hospitals/costs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Query failed.");
      }
      const result: ComparisonResponse = await response.json();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, [city, procedure, specialty, minCost, maxCost, sortBy]);

  // Fetch on mount and when query filters change
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        fetchCosts();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchCosts]);

  // Handle hospital selection toggles
  const handleToggleSelectHospital = (hosp: HospitalRecord) => {
    setSelectedHospitals((prev) => {
      const exists = prev.some((item) => item.id === hosp.id);
      if (exists) {
        return prev.filter((item) => item.id !== hosp.id);
      } else {
        if (prev.length >= 3) {
          return prev; // Cap at 3
        }
        return [...prev, hosp];
      }
    });
  };

  // Redirect to OOP calculator caching cost data in localStorage
  const handleLaunchOOPSimulation = (record: HospitalRecord) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "carefin_oop_sim_input",
        JSON.stringify({
          treatment_cost: record.cost_details.estimated_cost,
          procedure_category: record.cost_details.procedure_name,
          hospital_name: record.name
        })
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
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Healthcare Costs Comparison</h1>
          <p className="text-xs text-text-secondary mt-1">
            Compare package rates across local hospital networks and verify cost estimates details
          </p>
        </div>
        <div className="flex items-center gap-2 rounded border border-accent-secondary/35 bg-accent-secondary/5 px-2.5 py-1 text-[11px] font-medium text-accent-secondary self-start sm:self-auto">
          <ShieldCheck size={13} />
          <span>Demo Data Mode</span>
        </div>
      </header>

      {/* 1. Quick Info Banner */}
      <div className="bg-bg/40 border border-border/70 rounded p-3 flex gap-2 text-xs text-text-secondary">
        <Info size={16} className="text-accent-secondary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-text-primary">Data Honesty Policy</span>: All package costs, implants assumptions, 
          and verification dates displayed below represent simulated benchmarks labeled <span className="font-bold text-accent-primary bg-accent-primary/10 px-1 py-0.5 rounded text-[10px]">DEMO DATA</span>. 
          Network cashless verifications are not authoritative and must be confirmed directly with insurers.
        </div>
      </div>

      {/* 2. Side-by-Side Comparison Area (if selected) */}
      {selectedHospitals.length > 0 && (
        <section className="bg-surface rounded-lg border-2 border-accent-secondary/40 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <CheckCircle size={16} className="text-accent-secondary animate-pulse" />
              <span>Hospital Comparison Panel ({selectedHospitals.length}/3)</span>
            </h2>
            <button
              onClick={() => setSelectedHospitals([])}
              className="text-[10px] font-bold text-error hover:underline"
            >
              Clear Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedHospitals.map((hosp) => (
              <div key={hosp.id} className="border border-border rounded p-4 bg-bg/25 flex flex-col justify-between space-y-4 relative">
                <div className="space-y-2">
                  <span className="absolute top-2 right-2 text-[9px] font-bold text-accent-secondary bg-accent-secondary/15 px-1.5 py-0.5 rounded">
                    Selected
                  </span>
                  <h3 className="font-bold text-sm text-text-primary">{hosp.name}</h3>
                  <p className="text-[11px] text-text-secondary">{hosp.location}, {hosp.city}</p>
                  
                  <div className="border-t border-border/50 pt-2 text-xs space-y-1 text-text-secondary">
                    <div className="flex justify-between">
                      <span>Procedure:</span>
                      <span className="font-semibold text-text-primary">{hosp.cost_details.procedure_name}</span>
                    </div>
                    <div className="flex justify-between text-accent-primary font-bold">
                      <span>Est. Cost:</span>
                      <span>{formatCurrency(hosp.cost_details.estimated_cost)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Cost Range:</span>
                      <span>
                        {formatCurrency(hosp.cost_details.cost_range_min)} - {formatCurrency(hosp.cost_details.cost_range_max)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Room Cap Assumption:</span>
                      <span className="font-medium">{hosp.cost_details.room_category_assumption}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Verification Date:</span>
                      <span>{hosp.cost_details.verification_date || "Not Available"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Data Status:</span>
                      <span className="font-semibold bg-accent-primary/10 px-1 py-0.5 rounded text-[8px] tracking-wide text-accent-primary">
                        {hosp.cost_details.data_status}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/insurance"
                  onClick={() => handleLaunchOOPSimulation(hosp)}
                  className="w-full text-center bg-accent-primary text-white py-1.5 rounded text-xs font-bold hover:bg-accent-primary/95 transition-colors flex items-center justify-center gap-1"
                >
                  <span>Simulate OOP Share</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Query Filters Form */}
      <section className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <Filter size={15} className="text-accent-primary" />
          <span>Search & Filters Criteria</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
          
          {/* Procedure */}
          <div className="col-span-2 md:col-span-2">
            <label className="block font-semibold text-text-secondary mb-1">PROCEDURE</label>
            <select
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="Angioplasty">Angioplasty</option>
              <option value="Cataract Surgery">Cataract Surgery</option>
              <option value="Knee Replacement">Knee Replacement</option>
              <option value="Appendectomy">Appendectomy</option>
              <option value="Cancer Treatment">Cancer Treatment</option>
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block font-semibold text-text-secondary mb-1">CITY</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="All">All Cities</option>
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

          {/* Cost Boundaries */}
          <div>
            <label className="block font-semibold text-text-secondary mb-1">MIN COST (₹)</label>
            <input
              type="number"
              placeholder="Min"
              value={minCost}
              onChange={(e) => setMinCost(e.target.value)}
              className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-text-secondary mb-1">MAX COST (₹)</label>
            <input
              type="number"
              placeholder="Max"
              value={maxCost}
              onChange={(e) => setMaxCost(e.target.value)}
              className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

        </div>

        {/* Sorting options */}
        <div className="flex items-center gap-4 text-xs pt-2 border-t border-border/50">
          <span className="font-semibold text-text-secondary flex items-center gap-1.5">
            <ArrowUpDown size={14} />
            <span>SORT RESULTS BY</span>
          </span>
          <div className="flex gap-2">
            {[
              { label: "Lowest Cost", val: "cost_asc" },
              { label: "Highest Cost", val: "cost_desc" },
              { label: "Hospital Name", val: "name" }
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setSortBy(opt.val)}
                className={`px-3 py-1 rounded border font-semibold transition-colors ${
                  sortBy === opt.val
                    ? "bg-accent-primary text-white border-accent-primary"
                    : "bg-surface border-border text-text-secondary hover:bg-bg"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Query Results Display list */}
      {isLoading && (
        <div className="text-center py-12 text-sm text-text-secondary flex justify-center items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent-primary border-t-transparent"></div>
          <span>Loading hospital pricing estimates...</span>
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
            <span>Query Matches: {data.results.length} Hospitals Found</span>
            <span>All estimates displayed are demo references</span>
          </div>

          {data.results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.results.map((record) => {
                const isSelected = selectedHospitals.some((item) => item.id === record.id);
                return (
                  <div
                    key={record.id}
                    className={`bg-surface border rounded-lg p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                      isSelected
                        ? "border-accent-secondary ring-1 ring-accent-secondary"
                        : "border-border hover:border-border/100"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Name & Selector checkbox */}
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h3 className="font-bold text-sm text-text-primary leading-5">{record.name}</h3>
                          <p className="text-[11px] text-text-secondary mt-0.5">{record.location}, {record.city}</p>
                        </div>
                        <button
                          onClick={() => handleToggleSelectHospital(record)}
                          className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${
                            isSelected
                              ? "bg-accent-secondary text-white border-accent-secondary"
                              : "bg-surface text-text-secondary border-border hover:bg-bg"
                          }`}
                        >
                          {isSelected ? "Uncompare" : "Compare"}
                        </button>
                      </div>

                      {/* Specialties chips */}
                      <div className="flex flex-wrap gap-1">
                        {record.specialties.map((spec) => (
                          <span key={spec} className="bg-bg text-text-secondary text-[9px] font-semibold px-2 py-0.5 rounded border border-border">
                            {spec}
                          </span>
                        ))}
                      </div>

                      {/* Cost details */}
                      <div className="bg-bg/40 border border-border/50 rounded p-3 text-xs space-y-1 text-text-secondary">
                        <div className="flex justify-between">
                          <span>Estimated Cost:</span>
                          <span className="font-bold text-accent-primary text-sm">
                            {formatCurrency(record.cost_details.estimated_cost)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>Cost Range:</span>
                          <span>
                            {formatCurrency(record.cost_details.cost_range_min)} - {formatCurrency(record.cost_details.cost_range_max)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>Assumptions:</span>
                          <span className="font-medium truncate max-w-[200px]" title={record.cost_details.assumptions.join(", ")}>
                            {record.cost_details.assumptions[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[10px] text-text-secondary gap-3">
                      <div>
                        <span className="bg-accent-primary/10 text-accent-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px] mr-1.5">
                          {record.cost_details.data_status}
                        </span>
                        <span>Ver. {record.cost_details.verification_date || "N/A"}</span>
                      </div>
                      
                      <Link
                        href="/insurance"
                        onClick={() => handleLaunchOOPSimulation(record)}
                        className="text-accent-secondary font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>OOP Simulation</span>
                        <ArrowRight size={11} />
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg p-12 text-center text-xs text-text-secondary flex flex-col items-center justify-center space-y-2">
              <IndianRupee size={28} className="text-text-secondary/45 animate-bounce" />
              <p className="font-bold">No hospital matches found</p>
              <p>Adjust your cost boundaries, cities, or specialty filters to see results.</p>
            </div>
          )}

          {/* Disclaimer details */}
          <div className="bg-error/5 border border-error/15 rounded-lg p-4 text-[10px] text-text-secondary flex gap-2">
            <HelpCircle size={15} className="text-error shrink-0 mt-0.5" />
            <p>
              <strong>Package Pricing Notice</strong>: {data.disclaimer}
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
