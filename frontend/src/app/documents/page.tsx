/* eslint-disable */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  ShieldCheck,
  FileCheck,
  Trash2,
  Upload,
  Coins,
  Sparkles,
  Lock,
  User,
  Mail,
  RefreshCw,
  LogOut
} from "lucide-react";

interface DocumentRecord {
  id: number;
  filename: string;
  document_type: string;
  file_size: number;
  processing_status: string;
  upload_date: string;
  source: string;
  verification_status: string;
}

interface SavedCalculationRecord {
  id: number;
  calculation_type: string;
  input_values: Record<string, any>;
  output_values: Record<string, any>;
  reference_metadata: string | null;
  created_at: string;
}

export default function DocumentVaultPage() {
  // Auth Session State
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState<string>("");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  // Document list state
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState<boolean>(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Upload Form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("Insurance Policy");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Calculations list state
  const [calculations, setCalculations] = useState<SavedCalculationRecord[]>([]);
  const [isCalcsLoading, setIsCalcsLoading] = useState<boolean>(false);
  const [calcsError, setCalcsError] = useState<string | null>(null);

  // Load token on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("carefin_token");
      const storedUser = localStorage.getItem("carefin_username");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUsername(storedUser);
      }
    }
  }, []);

  // Fetch Documents
  const fetchDocuments = useCallback(async (activeToken: string) => {
    setIsDocsLoading(true);
    setDocsError(null);
    try {
      const response = await fetch("http://localhost:8000/api/documents", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (!response.ok) {
        throw new Error("Failed to load documents vault.");
      }
      const data = await response.json();
      setDocuments(data);
    } catch (err: unknown) {
      setDocsError(err instanceof Error ? err.message : "Error loading documents.");
    } finally {
      setIsDocsLoading(false);
    }
  }, []);

  // Fetch Calculations
  const fetchCalculations = useCallback(async (activeToken: string) => {
    setIsCalcsLoading(true);
    setCalcsError(null);
    try {
      const response = await fetch("http://localhost:8000/api/calculations", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (!response.ok) {
        throw new Error("Failed to load calculations history.");
      }
      const data = await response.json();
      setCalculations(data);
    } catch (err: unknown) {
      setCalcsError(err instanceof Error ? err.message : "Error loading calculations.");
    } finally {
      setIsCalcsLoading(false);
    }
  }, []);

  // Auto load user data if token exists
  useEffect(() => {
    if (token) {
      fetchDocuments(token);
      fetchCalculations(token);
    }
  }, [token, fetchDocuments, fetchCalculations]);

  // Handle Login & Signup
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthLoading(true);

    try {
      if (authTab === "register") {
        const payload = {
          username: authUsername,
          email: authEmail,
          password: authPassword
        };
        const response = await fetch("http://localhost:8000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Registration failed.");
        }
        setAuthSuccess("Registration successful! You can now log in.");
        setAuthTab("login");
        setAuthPassword("");
      } else {
        const payload = {
          username_or_email: authUsername,
          password: authPassword
        };
        const response = await fetch("http://localhost:8000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Login failed.");
        }
        const data = await response.json();
        
        localStorage.setItem("carefin_token", data.access_token);
        localStorage.setItem("carefin_username", authUsername);
        
        setToken(data.access_token);
        setUsername(authUsername);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await fetch("http://localhost:8000/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    localStorage.removeItem("carefin_token");
    localStorage.removeItem("carefin_username");
    setToken(null);
    setUsername("");
    setDocuments([]);
    setCalculations([]);
  };

  // Handle Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !token) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("document_type", docType);

    try {
      const response = await fetch("http://localhost:8000/api/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload failed.");
      }

      setUploadFile(null);
      // Reset input element
      const fileInput = document.getElementById("vault-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh documents list
      fetchDocuments(token);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Document upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Document Delete
  const handleDeleteDoc = async (docId: number) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this document permanently?")) return;

    try {
      const response = await fetch(`http://localhost:8000/api/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to delete document.");
      }
      fetchDocuments(token);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting document.");
    }
  };

  // Handle Calculation Delete
  const handleDeleteCalculation = async (calcId: number) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this saved calculation?")) return;

    try {
      const response = await fetch(`http://localhost:8000/api/calculations/${calcId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to delete calculation.");
      }
      fetchCalculations(token);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting calculation.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 text-text-primary max-w-6xl mx-auto space-y-8 select-none">
      
      {/* 1. Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Personal Document Vault & Security Center</h1>
          <p className="text-xs text-text-secondary mt-1">
            Store private policies, track medical bill processing status, and review saved simulations securely
          </p>
        </div>
        {token && (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded border border-red-500/35 bg-red-500/5 px-2.5 py-1 text-[11px] font-bold text-red-500 hover:bg-red-500/10 transition-all self-start sm:self-auto"
          >
            <LogOut size={13} />
            <span>Sign Out ({username})</span>
          </button>
        )}
      </header>

      {/* 2. Authentication View (if unauthenticated) */}
      {!token ? (
        <section className="max-w-md mx-auto bg-surface rounded-lg border border-border p-6 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <Lock size={32} className="mx-auto text-accent-primary animate-pulse" />
            <h2 className="text-sm font-bold tracking-tight text-text-primary uppercase">
              Access Document Vault
            </h2>
            <p className="text-xs text-text-secondary">
              Sign in or create a personal account to upload insurance files and sync healthcare calculations.
            </p>
          </div>

          {/* Login/Register Tabs */}
          <div className="flex border-b border-border text-xs font-bold uppercase">
            <button
              onClick={() => {
                setAuthTab("login");
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-center border-b-2 transition-all ${
                authTab === "login"
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthTab("register");
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-center border-b-2 transition-all ${
                authTab === "register"
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
            {authSuccess && (
              <div className="rounded bg-emerald-500/10 border border-emerald-500/15 p-2.5 text-emerald-600 font-semibold">
                {authSuccess}
              </div>
            )}
            {authError && (
              <div className="rounded bg-error/10 border border-error/15 p-2.5 text-error">
                {authError}
              </div>
            )}

            <div>
              <label className="block font-bold text-text-secondary uppercase mb-1">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-text-secondary/70">
                  <User size={13} />
                </span>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="e.g. yash12"
                  className="w-full border border-border rounded pl-8 pr-3 py-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>

            {authTab === "register" && (
              <div>
                <label className="block font-bold text-text-secondary uppercase mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-text-secondary/70">
                    <Mail size={13} />
                  </span>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. yash@carefin.com"
                    className="w-full border border-border rounded pl-8 pr-3 py-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-text-secondary uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="******"
                className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-accent-primary text-white py-2.5 rounded font-bold hover:bg-accent-primary/95 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {isAuthLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{authTab === "login" ? "Sign In" : "Create Account"}</span>
              )}
            </button>
          </form>
        </section>
      ) : (
        /* 3. Document Vault & Calculations Views (if authenticated) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* UPLOAD FORM (LEFT COLUMN) */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 mb-2 border-b border-border pb-2">
                <Upload size={15} className="text-accent-primary" />
                <span>Upload New Document</span>
              </h2>

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                {uploadError && (
                  <div className="rounded bg-error/10 border border-error/15 p-2 text-error">
                    {uploadError}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-text-secondary uppercase mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full border border-border rounded p-2 bg-bg/25 text-text-primary focus:outline-none"
                  >
                    <option value="Insurance Policy">Insurance Policy</option>
                    <option value="Medical Bill">Medical Bill</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Diagnostic Report">Diagnostic Report</option>
                    <option value="Hospital Document">Hospital Document</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-text-secondary uppercase mb-1">File Selector</label>
                  <input
                    id="vault-file-input"
                    type="file"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                    className="w-full border border-border rounded p-1.5 text-xs bg-bg/25"
                  />
                  <span className="block text-[9px] text-text-secondary mt-1">
                    * Supports PDF, PNG, JPG, JPEG, TXT, DOCX. Max 10MB. Executable files are blocked.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="w-full bg-accent-primary text-white py-2.5 rounded font-bold hover:bg-accent-primary/95 transition-colors flex items-center justify-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Uploading securely...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      <span>Upload to Vault</span>
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>

          {/* DOCUMENTS LIST & HISTORY (RIGHT COLUMN) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stored Documents list */}
            <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 border-b border-border pb-2.5">
                <FolderOpen size={16} className="text-accent-secondary" />
                <span>Saved Healthcare Documents ({documents.length})</span>
              </h2>

              {isDocsLoading && (
                <div className="text-center py-6 text-xs text-text-secondary flex justify-center items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-accent-primary" />
                  <span>Loading vault metadata...</span>
                </div>
              )}

              {docsError && (
                <div className="rounded bg-error/10 border border-error/15 p-2.5 text-xs text-error">
                  {docsError}
                </div>
              )}

              {!isDocsLoading && !docsError && (
                <div className="space-y-3">
                  {documents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/80 text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                            <th className="py-2">Filename</th>
                            <th className="py-2">Document Type</th>
                            <th className="py-2">Size</th>
                            <th className="py-2">Status</th>
                            <th className="py-2">Upload Date</th>
                            <th className="py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc) => (
                            <tr key={doc.id} className="border-b border-border/40 hover:bg-bg/10 text-text-secondary">
                              <td className="py-2.5 font-semibold text-text-primary max-w-[150px] truncate">
                                {doc.filename}
                              </td>
                              <td className="py-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-accent-primary/10 text-accent-primary">
                                  {doc.document_type}
                                </span>
                              </td>
                              <td className="py-2.5">{formatBytes(doc.file_size)}</td>
                              <td className="py-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-600/10 text-emerald-600">
                                  {doc.processing_status}
                                </span>
                              </td>
                              <td className="py-2.5">
                                {new Date(doc.upload_date).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => handleDeleteDoc(doc.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1.5"
                                  title="Delete Document"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-text-secondary">
                      No documents found in your vault. Securely upload files on the left.
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Calculations history list */}
            <section className="bg-surface rounded-lg border border-border p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 border-b border-border pb-2.5">
                <Coins size={16} className="text-accent-secondary" />
                <span>Saved Calculation History ({calculations.length})</span>
              </h2>

              {isCalcsLoading && (
                <div className="text-center py-6 text-xs text-text-secondary flex justify-center items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-accent-primary" />
                  <span>Loading calculation logs...</span>
                </div>
              )}

              {calcsError && (
                <div className="rounded bg-error/10 border border-error/15 p-2.5 text-xs text-error">
                  {calcsError}
                </div>
              )}

              {!isCalcsLoading && !calcsError && (
                <div className="space-y-3">
                  {calculations.length > 0 ? (
                    <div className="space-y-3">
                      {calculations.map((calc) => (
                        <div key={calc.id} className="border border-border/80 rounded-lg p-4 bg-bg/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-text-secondary">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-accent-primary/10 text-accent-primary">
                                {calc.calculation_type}
                              </span>
                              {calc.reference_metadata && (
                                <span className="font-semibold text-text-primary text-[11px]">
                                  {calc.reference_metadata}
                                </span>
                              )}
                              <span className="text-[9px]">
                                {new Date(calc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {/* Inputs summary */}
                            <div className="text-[10px] text-text-secondary leading-4">
                              <strong>Inputs:</strong>{" "}
                              {Object.entries(calc.input_values).map(([k, v]) => (
                                <span key={k} className="mr-2">
                                  {k.replace(/_/g, " ")}: {typeof v === "number" ? formatCurrency(v) : String(v)}
                                </span>
                              ))}
                            </div>

                            {/* Outputs summary */}
                            <div className="text-[10px] text-accent-primary leading-4 font-semibold">
                              <strong>Outputs:</strong>{" "}
                              {Object.entries(calc.output_values).map(([k, v]) => (
                                <span key={k} className="mr-2">
                                  {k.replace(/_/g, " ")}: {typeof v === "number" ? formatCurrency(v) : String(v)}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteCalculation(calc.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1.5 border border-border rounded bg-surface self-end sm:self-center"
                            title="Delete Log"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-text-secondary">
                      No saved calculations found. Simulate and click "Save to Vault" in costs or insurance pages to track details.
                    </div>
                  )}
                </div>
              )}
            </section>

          </div>

        </div>
      )}

      {/* Disclaimers Warn Footer */}
      <footer className="bg-bg/70 border border-border rounded-lg p-4 text-[10px] text-text-secondary flex gap-2.5">
        <ShieldCheck size={16} className="text-text-secondary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-text-primary uppercase tracking-wide">
            CareFin Security, USER DATA & Privacy notice:
          </p>
          <p className="leading-4 text-text-secondary">
            Every document and calculation saved inside this vault is strictly associated with your authenticated username. 
            CareFin implements server-side ownership filters to prevent cross-user access, and stores passwords using secure hashing algorithms. 
            Uploaded health documentation status is labeled as REFERENCE/USER PROVIDED only and does not represent official insurer clearance or medical verification.
          </p>
        </div>
      </footer>

    </div>
  );
}
