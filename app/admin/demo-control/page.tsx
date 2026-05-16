"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldAlert,
  Terminal,
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Zap,
  Bot,
} from "lucide-react";
import { fetchApi } from "../../../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EscrowTransaction {
  reference: string;
  amount_kobo: number;
  status: string;
  created_at: string;
}

interface SoftPosTransaction {
  reference: string;
  amount_kobo: number;
  status: string;
  created_at: string;
}

interface Merchant {
  id: string;
  name: string;
  phone: string;
  trust_score: number;
  escrow_transactions: EscrowTransaction[];
  softpos_transactions: SoftPosTransaction[];
}

interface DemoState {
  merchants: Merchant[];
}

interface Scenario {
  name: string;
  description: string;
}

interface ScenariosResponse {
  scenarios: Record<string, Scenario>;
}

interface VerifyVerdict {
  verdict: string;
  confidence: number;
  reasoning: string;
}

type LogLevel = "info" | "success" | "error" | "warn";

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });
}

function now(): string {
  return new Date().toLocaleTimeString();
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-600 text-gray-200",
  funded: "bg-blue-700 text-blue-100",
  ai_verifying: "bg-yellow-700 text-yellow-100",
  released: "bg-green-700 text-green-100",
  refunded: "bg-red-700 text-red-100",
  expired: "bg-red-800 text-red-200",
  needs_review: "bg-orange-700 text-orange-100",
  success: "bg-green-700 text-green-100",
  failed: "bg-red-700 text-red-100",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-gray-700 text-gray-200";
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

// ─── Verdict Modal ────────────────────────────────────────────────────────────

function VerdictModal({
  verdict,
  onClose,
}: {
  verdict: VerifyVerdict;
  onClose: () => void;
}) {
  const isRelease = verdict.verdict === "release";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {isRelease ? (
            <CheckCircle className="w-7 h-7 text-green-400 shrink-0" />
          ) : (
            <XCircle className="w-7 h-7 text-red-400 shrink-0" />
          )}
          <div>
            <h2 className="text-white font-bold text-lg">
              AI Verdict:{" "}
              <span className={isRelease ? "text-green-400" : "text-red-400"}>
                {verdict.verdict.toUpperCase()}
              </span>
            </h2>
            <p className="text-gray-400 text-sm">
              Confidence:{" "}
              <span className="text-white font-mono">
                {(verdict.confidence * 100).toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
        <div className="bg-black/40 rounded-lg p-3 text-sm text-gray-300 font-mono leading-relaxed max-h-40 overflow-y-auto">
          {verdict.reasoning}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Confirm Reset Dialog ─────────────────────────────────────────────────────

function ConfirmResetDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-gray-800 border border-red-900/60 rounded-xl max-w-sm w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-red-500 shrink-0" />
          <h2 className="text-white font-bold">Reset Demo Data?</h2>
        </div>
        <p className="text-gray-400 text-sm">
          This will wipe ALL transactions and reset trust scores. Merchants are
          kept. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-bold transition-colors"
          >
            Yes, Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "squadtrust2025") {
      onAuth();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-xl max-w-sm w-full space-y-6 border border-gray-700"
      >
        <div className="flex justify-center">
          <Terminal className="w-12 h-12 text-[#0B6E4F]" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Operator Access</h1>
          <p className="text-gray-400 text-xs mt-1">SquadTrust Demo Control</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:border-[#0B6E4F] transition-colors ${
            error ? "border-red-500" : "border-gray-600"
          }`}
          placeholder="Enter password"
          autoFocus
        />
        {error && (
          <p className="text-red-400 text-xs text-center -mt-2">
            Invalid password
          </p>
        )}
        <button
          type="submit"
          className="w-full bg-[#0B6E4F] hover:bg-[#0B6E4F]/80 text-white py-2 rounded-md transition-colors font-semibold"
        >
          Access System
        </button>
      </form>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function DemoControlPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [scenarios, setScenarios] = useState<Record<string, Scenario>>({});
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"escrow" | "softpos">("escrow");
  const [logs, setLogs] = useState<LogEntry[]>([
    { ts: now(), level: "info", msg: "System initialized. Ready for demo." },
  ]);
  const [isPolling, setIsPolling] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [verdict, setVerdict] = useState<VerifyVerdict | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // ── Logging ──────────────────────────────────────────────────────────────

  const addLog = useCallback((msg: string, level: LogLevel = "info") => {
    setLogs((prev) =>
      [{ ts: now(), level, msg }, ...prev].slice(0, 100)
    );
  }, []);

  // ── Loading helpers ───────────────────────────────────────────────────────

  const setLoading = (key: string, val: boolean) =>
    setLoadingMap((prev) => ({ ...prev, [key]: val }));

  const isLoading = (key: string) => !!loadingMap[key];

  // ── Fetch demo state ──────────────────────────────────────────────────────

  const refreshState = useCallback(async (silent = false) => {
    if (!silent) setIsPolling(true);
    try {
      const data = await fetchApi<DemoState>("/demo/state");
      setDemoState(data);
      if (!silent) addLog("State refreshed.", "success");
    } catch (err: any) {
      addLog(`Failed to refresh state: ${err.message}`, "error");
    } finally {
      if (!silent) setIsPolling(false);
    }
  }, [addLog]);

  // ── Fetch scenarios ───────────────────────────────────────────────────────

  const fetchScenarios = useCallback(async () => {
    try {
      const data = await fetchApi<ScenariosResponse>("/demo/scenarios");
      setScenarios(data.scenarios ?? {});
    } catch {
      // non-critical
    }
  }, []);

  // ── On auth ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshState();
    fetchScenarios();

    pollRef.current = setInterval(() => {
      refreshState(true);
    }, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthenticated, refreshState, fetchScenarios]);

  // ── Derived: selected merchant ────────────────────────────────────────────

  const merchants = demoState?.merchants ?? [];
  const selectedMerchant =
    merchants.find((m) => m.id === selectedMerchantId) ?? null;

  // Auto-select first merchant once data arrives
  useEffect(() => {
    if (!selectedMerchantId && merchants.length > 0) {
      setSelectedMerchantId(merchants[0].id);
    }
  }, [merchants, selectedMerchantId]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleFundEscrow = async (ref: string) => {
    const key = `fund-${ref}`;
    setLoading(key, true);
    try {
      await fetchApi(`/demo/fund-escrow/${ref}`, { method: "POST" });
      addLog(`Funded escrow ${ref}.`, "success");
      await refreshState(true);
    } catch (err: any) {
      addLog(`Fund escrow ${ref} failed: ${err.message}`, "error");
    } finally {
      setLoading(key, false);
    }
  };

  const handleLoadScenario = async (n: number, ref: string) => {
    const key = `scenario-${n}-${ref}`;
    setLoading(key, true);
    try {
      addLog(`Loading scenario ${n} into ${ref}…`, "info");
      await fetchApi(
        `/demo/load-scenario/${n}?transaction_ref=${ref}`,
        { method: "POST" }
      );
      addLog(`Scenario ${n} loaded into ${ref}.`, "success");
      await refreshState(true);

      // Automatically trigger AI verification
      addLog(`Running AI verification on ${ref}…`, "warn");
      const v = await fetchApi<VerifyVerdict>(`/escrow/${ref}/verify-now`, {
        method: "POST",
      });
      const confidencePct = (v.confidence * 100).toFixed(1);
      addLog(
        `AI verdict: ${v.verdict.toUpperCase()} (${confidencePct}%) — ${v.reasoning.slice(0, 120)}${v.reasoning.length > 120 ? "…" : ""}`,
        v.verdict === "release" ? "success" : "error"
      );
      setVerdict(v);
      await refreshState(true);
    } catch (err: any) {
      addLog(`Scenario ${n} / verify on ${ref} failed: ${err.message}`, "error");
    } finally {
      setLoading(key, false);
    }
  };

  const handleVerifyNow = async (ref: string) => {
    const key = `verify-${ref}`;
    setLoading(key, true);
    try {
      addLog(`Running AI verification on ${ref}…`, "warn");
      const v = await fetchApi<VerifyVerdict>(`/escrow/${ref}/verify-now`, {
        method: "POST",
      });
      const confidencePct = (v.confidence * 100).toFixed(1);
      addLog(
        `AI verdict: ${v.verdict.toUpperCase()} (${confidencePct}%) — ${v.reasoning.slice(0, 120)}${v.reasoning.length > 120 ? "…" : ""}`,
        v.verdict === "release" ? "success" : "error"
      );
      setVerdict(v);
      await refreshState(true);
    } catch (err: any) {
      addLog(`Verify ${ref} failed: ${err.message}`, "error");
    } finally {
      setLoading(key, false);
    }
  };

  const handleForceSoftPos = async (ref: string) => {
    const key = `softpos-${ref}`;
    setLoading(key, true);
    try {
      await fetchApi(`/demo/trigger-softpos/${ref}`, { method: "POST" });
      addLog(`Soft POS ${ref} forced to success.`, "success");
      await refreshState(true);
    } catch (err: any) {
      addLog(`Force soft POS ${ref} failed: ${err.message}`, "error");
    } finally {
      setLoading(key, false);
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    setLoading("reset", true);
    try {
      await fetchApi("/demo/reset", { method: "POST" });
      addLog("Demo data reset. All transactions wiped.", "warn");
      await refreshState(true);
    } catch (err: any) {
      addLog(`Reset failed: ${err.message}`, "error");
    } finally {
      setLoading("reset", false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return <LoginScreen onAuth={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      {/* Verdict Modal */}
      {verdict && (
        <VerdictModal verdict={verdict} onClose={() => setVerdict(null)} />
      )}

      {/* Reset Confirm Dialog */}
      {showResetConfirm && (
        <ConfirmResetDialog
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-gray-800 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <h1 className="text-base md:text-lg font-bold text-red-400 leading-tight">
              SquadTrust Demo Control
            </h1>
            <p className="text-gray-500 text-[10px]">
              Operator panel · Live pitch simulation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPolling && (
            <Loader2 className="w-4 h-4 text-[#0B6E4F] animate-spin" />
          )}
          <span className="text-gray-600 text-[10px] hidden sm:inline">
            polling 10s
          </span>
        </div>
      </header>

      {/* Three-column layout — stacks vertically on mobile */}
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 p-4 md:p-6 max-w-[1600px] mx-auto">

        {/* ── Left: Merchant Selector ────────────────────────────────────── */}
        <aside className="w-full lg:w-60 xl:w-72 shrink-0 space-y-3">
          <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest px-1">
            Merchants
          </h2>
          {merchants.length === 0 ? (
            <div className="text-gray-600 text-xs px-1">Loading…</div>
          ) : (
            merchants.map((m) => {
              const isSelected = m.id === selectedMerchantId;
              const scoreColor =
                m.trust_score >= 700
                  ? "text-green-400"
                  : m.trust_score >= 400
                  ? "text-yellow-400"
                  : "text-red-400";
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMerchantId(m.id);
                    setActiveTab("escrow");
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-gray-800 border-[#0B6E4F] shadow-[0_0_0_1px_#0B6E4F40]"
                      : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-semibold truncate">
                      {m.name}
                    </span>
                    {isSelected && (
                      <ChevronRight className="w-3 h-3 text-[#0B6E4F] shrink-0" />
                    )}
                  </div>
                  <div className="text-gray-500 text-[10px] mt-0.5">{m.phone}</div>
                  <div className={`text-xs font-bold mt-1 ${scoreColor}`}>
                    Score: {m.trust_score}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {m.escrow_transactions.length} escrow ·{" "}
                    {m.softpos_transactions.length} soft POS
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* ── Center: Transactions ───────────────────────────────────────── */}
        <main className="flex-1 min-w-0 mt-6 lg:mt-0">
          {!selectedMerchant ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              Select a merchant
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-300">
                  {selectedMerchant.name}
                </h2>
                <div className="flex gap-1">
                  {(["escrow", "softpos"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        activeTab === tab
                          ? "bg-[#0B6E4F] text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {tab === "escrow" ? "Escrow" : "Soft POS"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Escrow Tab */}
              {activeTab === "escrow" && (
                <div className="space-y-3">
                  {selectedMerchant.escrow_transactions.length === 0 ? (
                    <div className="bg-gray-800/50 rounded-lg p-4 text-gray-600 text-xs text-center">
                      No escrow transactions
                    </div>
                  ) : (
                    selectedMerchant.escrow_transactions.map((tx) => (
                      <EscrowCard
                        key={tx.reference}
                        tx={tx}
                        scenarios={scenarios}
                        isLoading={isLoading}
                        onFund={() => handleFundEscrow(tx.reference)}
                        onLoadScenario={(n) =>
                          handleLoadScenario(n, tx.reference)
                        }
                        onVerify={() => handleVerifyNow(tx.reference)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Soft POS Tab */}
              {activeTab === "softpos" && (
                <div className="space-y-3">
                  {selectedMerchant.softpos_transactions.length === 0 ? (
                    <div className="bg-gray-800/50 rounded-lg p-4 text-gray-600 text-xs text-center">
                      No Soft POS transactions
                    </div>
                  ) : (
                    selectedMerchant.softpos_transactions.map((tx) => (
                      <SoftPosCard
                        key={tx.reference}
                        tx={tx}
                        isLoading={isLoading}
                        onForce={() => handleForceSoftPos(tx.reference)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Right: Log + Global Actions ────────────────────────────────── */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 mt-6 lg:mt-0 space-y-3">
          {/* Global Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => refreshState()}
              disabled={isPolling}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              {isPolling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Refresh State
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isLoading("reset")}
              className="flex-1 flex items-center justify-center gap-2 bg-red-900/40 hover:bg-red-900/60 disabled:opacity-50 border border-red-900/60 text-red-400 py-2 rounded-lg text-xs font-bold transition-colors"
            >
              {isLoading("reset") ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              Reset Data
            </button>
          </div>

          {/* Terminal Log */}
          <div className="bg-black rounded-lg border border-gray-800 overflow-hidden flex flex-col h-[420px] lg:h-[calc(100vh-220px)] min-h-[300px]">
            <div className="bg-gray-800/80 text-[10px] text-gray-400 px-3 py-2 flex items-center justify-between shrink-0">
              <span>system.log</span>
              <span className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </span>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-1.5 text-[11px] leading-snug">
              {logs.map((entry, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-600 shrink-0">{entry.ts}</span>
                  <span
                    className={
                      entry.level === "success"
                        ? "text-green-400"
                        : entry.level === "error"
                        ? "text-red-400"
                        : entry.level === "warn"
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }
                  >
                    {entry.msg}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Escrow Card ──────────────────────────────────────────────────────────────

function EscrowCard({
  tx,
  scenarios,
  isLoading,
  onFund,
  onLoadScenario,
  onVerify,
}: {
  tx: EscrowTransaction;
  scenarios: Record<string, Scenario>;
  isLoading: (key: string) => boolean;
  onFund: () => void;
  onLoadScenario: (n: number) => void;
  onVerify: () => void;
}) {
  const fundKey = `fund-${tx.reference}`;
  const verifyKey = `verify-${tx.reference}`;

  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-gray-400 text-[10px] font-mono truncate max-w-[180px]">
          {tx.reference}
        </span>
        <StatusBadge status={tx.status} />
      </div>
      <div className="text-white text-sm font-bold">{fmt(tx.amount_kobo)}</div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {tx.status === "pending" && (
          <ActionBtn
            loading={isLoading(fundKey)}
            onClick={onFund}
            icon={<Zap className="w-3 h-3" />}
            label="Fund"
            color="blue"
          />
        )}

        {tx.status === "funded" && (
          <>
            {[1, 2, 3].map((n) => {
              const scKey = `scenario-${n}-${tx.reference}`;
              const label =
                scenarios[String(n)]?.name ?? `Scenario ${n}`;
              return (
                <ActionBtn
                  key={n}
                  loading={isLoading(scKey)}
                  onClick={() => onLoadScenario(n)}
                  icon={<Bot className="w-3 h-3" />}
                  label={`S${n}: ${label.slice(0, 14)}${label.length > 14 ? "…" : ""}`}
                  color="green"
                />
              );
            })}
            <ActionBtn
              loading={isLoading(verifyKey)}
              onClick={onVerify}
              icon={<CheckCircle className="w-3 h-3" />}
              label="Verify AI"
              color="yellow"
            />
          </>
        )}

        {(tx.status === "released" ||
          tx.status === "refunded" ||
          tx.status === "expired") && (
          <span className="text-gray-600 text-[10px]">No actions available</span>
        )}
      </div>
    </div>
  );
}

// ─── Soft POS Card ────────────────────────────────────────────────────────────

function SoftPosCard({
  tx,
  isLoading,
  onForce,
}: {
  tx: SoftPosTransaction;
  isLoading: (key: string) => boolean;
  onForce: () => void;
}) {
  const key = `softpos-${tx.reference}`;

  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-gray-400 text-[10px] font-mono truncate max-w-[180px]">
          {tx.reference}
        </span>
        <StatusBadge status={tx.status} />
      </div>
      <div className="text-white text-sm font-bold">{fmt(tx.amount_kobo)}</div>

      {tx.status === "pending" && (
        <ActionBtn
          loading={isLoading(key)}
          onClick={onForce}
          icon={<Terminal className="w-3 h-3" />}
          label="Force Success"
          color="green"
        />
      )}
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

const COLOR_MAP = {
  blue: "bg-blue-800 hover:bg-blue-700 text-blue-100",
  green: "bg-[#0B6E4F]/70 hover:bg-[#0B6E4F] text-green-100",
  yellow: "bg-yellow-800 hover:bg-yellow-700 text-yellow-100",
  red: "bg-red-800 hover:bg-red-700 text-red-100",
};

function ActionBtn({
  loading,
  onClick,
  icon,
  label,
  color,
}: {
  loading: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: keyof typeof COLOR_MAP;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors disabled:opacity-50 ${COLOR_MAP[color]}`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        icon
      )}
      {label}
    </button>
  );
}
