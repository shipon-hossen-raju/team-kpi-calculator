import {
  AlertCircle,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  DollarSign,
  Download,
  Edit3,
  FileText,
  Plus,
  Printer,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ============ Types ============
interface Member {
  id: string;
  memberId: string;
  name: string;
  share: number;
}
interface Team {
  id: string;
  name: string;
  ratio: number;
  members: Member[];
}
interface Project {
  id: string;
  label: string;
  accent: string; // tailwind color name
  teams: Team[];
}

// ============ Helpers ============
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n: number, d = 2) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

const ACCENT_MAP: Record<
  string,
  {
    bg: string;
    text: string;
    ring: string;
    bgSoft: string;
    border: string;
    gradient: string;
  }
> = {
  emerald: {
    bg: "bg-emerald-600",
    text: "text-emerald-600",
    ring: "ring-emerald-500",
    bgSoft: "bg-emerald-50",
    border: "border-emerald-600",
    gradient: "from-emerald-500 to-emerald-700",
  },
  blue: {
    bg: "bg-blue-600",
    text: "text-blue-600",
    ring: "ring-blue-500",
    bgSoft: "bg-blue-50",
    border: "border-blue-600",
    gradient: "from-blue-500 to-blue-700",
  },
  purple: {
    bg: "bg-purple-600",
    text: "text-purple-600",
    ring: "ring-purple-500",
    bgSoft: "bg-purple-50",
    border: "border-purple-600",
    gradient: "from-purple-500 to-purple-700",
  },
};

const PRESETS: Record<string, Project> = {
  web: {
    id: "web",
    label: "Web",
    accent: "emerald",
    teams: [
      { id: uid(), name: "UI", ratio: 18, members: [] },
      { id: uid(), name: "Website Design", ratio: 15, members: [] },
      { id: uid(), name: "Dashboard Design", ratio: 10, members: [] },
      { id: uid(), name: "API", ratio: 25, members: [] },
      { id: uid(), name: "Website Integration", ratio: 17.5, members: [] },
      { id: uid(), name: "Dashboard Integration", ratio: 12.5, members: [] },
      { id: uid(), name: "R&D", ratio: 0, members: [] },
      { id: uid(), name: "Consulting", ratio: 2, members: [] },
    ],
  },
  appweb: {
    id: "appweb",
    label: "App + Web",
    accent: "blue",
    teams: [
      { id: uid(), name: "UI", ratio: 14, members: [] },
      { id: uid(), name: "App Design", ratio: 10, members: [] },
      { id: uid(), name: "Website Design", ratio: 9.5, members: [] },
      { id: uid(), name: "Dashboard Design", ratio: 9.5, members: [] },
      { id: uid(), name: "API", ratio: 20.5, members: [] },
      { id: uid(), name: "App Integration", ratio: 14.5, members: [] },
      { id: uid(), name: "Website Integration", ratio: 9, members: [] },
      { id: uid(), name: "Dashboard Integration", ratio: 11, members: [] },
      { id: uid(), name: "R&D", ratio: 0, members: [] },
      { id: uid(), name: "Consulting", ratio: 2, members: [] },
    ],
  },
  app: {
    id: "app",
    label: "App",
    accent: "purple",
    teams: [
      { id: uid(), name: "UI", ratio: 18, members: [] },
      { id: uid(), name: "App Frontend", ratio: 15, members: [] },
      { id: uid(), name: "Dashboard Frontend", ratio: 10, members: [] },
      { id: uid(), name: "API", ratio: 25, members: [] },
      { id: uid(), name: "App Integration", ratio: 20, members: [] },
      { id: uid(), name: "Dashboard Integration", ratio: 10, members: [] },
      { id: uid(), name: "R&D", ratio: 0, members: [] },
      { id: uid(), name: "Consulting", ratio: 2, members: [] },
    ],
  },
};

// ============ Toast Hook ============
function useToast() {
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  function show(msg: string) {
    const id = Date.now();
    setToast({ msg, id });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2000);
  }
  return { toast, show };
}

// ============ Copyable Amount ============
function CopyableAmount({
  value,
  label,
  className = "",
  textClass = "",
  resetKey,
}: {
  value: number;
  label?: string;
  className?: string;
  textClass?: string;
  resetKey?: string | number;
}) {
  const [copied, setCopied] = useState<boolean>(false);
  const [active, setActive] = useState<boolean>(false);

  // Unmark when budget/resetKey changes
  useEffect(() => {
    return () => {
      setCopied(false);
      setActive(false);
    };
  }, [resetKey]);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(value.toFixed(2));
    setCopied(true);
    setActive(true);
    window.dispatchEvent(
      new CustomEvent("budget-toast", {
        detail: `Copied ${label ? label + ": " : ""}${fmt(value)}`,
      }),
    );
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      title="Click to copy"
      className={`group relative inline-flex items-center gap-1.5 transition-all rounded-md px-2 py-1 cursor-pointer
        ${active ? "bg-amber-100 ring-1 ring-amber-300" : "hover:bg-slate-100"}
        ${className}`}
    >
      <span className={`font-semibold tabular-nums ${textClass}`}>
        ${fmt(value)}
      </span>
      {copied ? (
        <Check size={12} className="text-emerald-600" />
      ) : (
        <Copy
          size={11}
          className="opacity-0 group-hover:opacity-60 transition-opacity"
        />
      )}
    </button>
  );
}

// ============ Main Component ============
export default function BudgetCalculator() {
  const [activeProjectId, setActiveProjectId] = useState("web");
  const [projects, setProjects] = useState<Record<string, Project>>(PRESETS);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [budget, setBudget] = useState("0");
  const [deductPct, setDeductPct] = useState("20");
  const [deductLabel, setDeductLabel] = useState("Fiverr Fee");
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>(
    {},
  );
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultSearch, setResultSearch] = useState("");

  const { toast, show } = useToast();

  useEffect(() => {
    const handler: (e: CustomEvent<{ msg: string }>) => void = (e) =>
      show(e.detail.msg);
    window.addEventListener("budget-toast", handler as EventListener);
    return () =>
      window.removeEventListener("budget-toast", handler as EventListener);
  }, [show]);

  // Budget change → unmark all copies + reset member shares to equal split
  const budgetKey = `${budget}-${deductPct}-${deductLabel}`;
  const prevBudgetKey = useRef<string>(budgetKey);
  useEffect(() => {
    if (prevBudgetKey.current !== budgetKey) {
      prevBudgetKey.current = budgetKey;
      // Reset member shares to equal distribution in each team
      setProjects((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((pid) => {
          next[pid] = {
            ...next[pid],
            teams: next[pid].teams.map((t) => {
              if (t.members.length === 0) return t;
              const equalShare = +(100 / t.members.length).toFixed(2);
              return {
                ...t,
                members: t.members.map((m) => ({ ...m, share: equalShare })),
              };
            }),
          };
        });
        return next;
      });
    }
  }, [budgetKey]);

  const project = projects[activeProjectId];
  const accent = ACCENT_MAP[project.accent];
  const numBudget = Math.max(parseFloat(budget) || 0, 0);
  const numDeductPct = Math.min(Math.max(parseFloat(deductPct) || 0, 0), 100);
  const deductAmount = +(numBudget * (numDeductPct / 100)).toFixed(2);
  const effectiveBudget = +(numBudget - deductAmount).toFixed(2);

  const totalRatio = useMemo(
    () => project.teams.reduce((s, t) => s + t.ratio, 0),
    [project.teams],
  );
  const ratioWarning = Math.abs(totalRatio - 100) > 0.01;

  // ============ Project Actions ============
  function updateProject(updater: (p: Project) => Project) {
    setProjects((prev) => ({
      ...prev,
      [activeProjectId]: updater(prev[activeProjectId]),
    }));
  }

  function addTeam() {
    updateProject((p) => ({
      ...p,
      teams: [
        ...p.teams,
        {
          id: uid(),
          name: `New Team ${p.teams.length + 1}`,
          ratio: 0,
          members: [],
        },
      ],
    }));
  }

  function removeTeam(teamId: string) {
    updateProject((p) => ({
      ...p,
      teams: p.teams.filter((t) => t.id !== teamId),
    }));
  }

  function updateTeam(teamId: string, patch: Partial<Team>) {
    updateProject((p) => ({
      ...p,
      teams: p.teams.map((t) => (t.id === teamId ? { ...t, ...patch } : t)),
    }));
  }

  function addMember(teamId: string) {
    updateProject((p) => ({
      ...p,
      teams: p.teams.map((t) => {
        if (t.id !== teamId) return t;
        const remaining = Math.max(
          100 - t.members.reduce((s, m) => s + m.share, 0),
          0,
        );
        const idx = t.members.length + 1;
        return {
          ...t,
          members: [
            ...t.members,
            {
              id: uid(),
              memberId: `EMP-${String(idx).padStart(3, "0")}`,
              name: `Member ${idx}`,
              share: remaining,
            },
          ],
        };
      }),
    }));
    setExpandedTeams((e) => ({ ...e, [teamId]: true }));
  }

  function updateMember(
    teamId: string,
    memberId: string,
    patch: Partial<Member>,
  ) {
    updateProject((p) => ({
      ...p,
      teams: p.teams.map((t) =>
        t.id !== teamId
          ? t
          : {
              ...t,
              members: t.members.map((m) =>
                m.id === memberId ? { ...m, ...patch } : m,
              ),
            },
      ),
    }));
  }

  function removeMember(teamId: string, memberId: string) {
    updateProject((p) => ({
      ...p,
      teams: p.teams.map((t) =>
        t.id !== teamId
          ? t
          : { ...t, members: t.members.filter((m) => m.id !== memberId) },
      ),
    }));
  }

  function normalizeRatios() {
    if (totalRatio === 0) return;
    updateProject((p) => ({
      ...p,
      teams: p.teams.map((t) => ({
        ...t,
        ratio: +((t.ratio / totalRatio) * 100).toFixed(2),
      })),
    }));
    show("Ratios normalized to 100%");
  }

  function resetProject() {
    if (!confirm("Reset this project to default values?")) return;
    setProjects((prev) => ({
      ...prev,
      [activeProjectId]: PRESETS[activeProjectId],
    }));
    show("Project reset to defaults");
  }

  // ============ Export ============
  function exportCSV() {
    const lines: string[] = [];
    if (projectName) lines.push(`Project Name: ${projectName}`);
    if (clientName) lines.push(`Client: ${clientName}`);
    lines.push(`Type: ${project.label}`);
    lines.push(`Total Budget: ${numBudget} USD`);
    lines.push(`${deductLabel}: ${numDeductPct}% = ${deductAmount} USD`);
    lines.push(`Effective Budget: ${effectiveBudget} USD`);
    lines.push("");
    lines.push(
      "Team,Percentage,Team Amount,Member,Member Share %,Member Amount",
    );
    project.teams.forEach((t) => {
      const teamAmt = (effectiveBudget * t.ratio) / 100;
      if (t.members.length === 0) {
        lines.push(`${t.name},${t.ratio}%,${teamAmt.toFixed(2)},,,`);
      } else {
        t.members.forEach((m) => {
          const memAmt = (teamAmt * m.share) / 100;
          lines.push(
            `${t.name},${t.ratio}%,${teamAmt.toFixed(2)},${m.name},${m.share}%,${memAmt.toFixed(2)}`,
          );
        });
      }
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget_${projectName || project.id}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    show("CSV exported");
  }

  function copyJSON() {
    const data = {
      projectName: projectName || null,
      client: clientName || null,
      type: project.label,
      totalBudget: numBudget,
      deduction: {
        label: deductLabel,
        percent: numDeductPct,
        amount: deductAmount,
      },
      effectiveBudget,
      teams: project.teams.map((t) => {
        const teamAmt = (effectiveBudget * t.ratio) / 100;
        return {
          name: t.name,
          percent: t.ratio,
          amount: +teamAmt.toFixed(2),
          members: t.members.map((m) => ({
            name: m.name,
            share: m.share,
            amount: +((teamAmt * m.share) / 100).toFixed(2),
          })),
        };
      }),
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    show("JSON copied to clipboard");
  }

  function printPDF() {
    const win = window.open("", "_blank");
    if (!win) return;
    const colorHex =
      project.accent === "emerald"
        ? "#059669"
        : project.accent === "blue"
          ? "#2563eb"
          : "#7c3aed";
    const teamRows = project.teams
      .map((t) => {
        const teamAmt = (effectiveBudget * t.ratio) / 100;
        const memberRows = t.members
          .map((m) => {
            const memAmt = (teamAmt * m.share) / 100;
            return `<tr><td style="padding-left:32px;color:#666">↳ ${m.name}</td><td style="text-align:center;color:#666">${m.share}%</td><td style="text-align:right;color:#666">${fmt(memAmt)}</td></tr>`;
          })
          .join("");
        return `
        <tr style="background:#fafafa"><td><strong>${t.name}</strong></td><td style="text-align:center;font-weight:600">${t.ratio}%</td><td style="text-align:right;font-weight:600">${fmt(teamAmt)}</td></tr>
        ${memberRows}`;
      })
      .join("");

    win.document
      .write(`<html><head><title>Budget — ${projectName || project.label}</title>
      <style>
        body{font-family:-apple-system,Arial,sans-serif;padding:40px;max-width:720px;margin:0 auto;color:#222}
        h1{color:${colorHex};margin:0 0 4px;font-size:22px}
        .sub{color:#777;font-size:13px;margin-bottom:24px}
        .meta{font-size:13px;color:#555;margin-bottom:20px;line-height:1.7}
        .meta strong{color:#222}
        .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
        .card{background:#f7f7f7;border-radius:8px;padding:12px 14px}
        .card .lbl{font-size:11px;text-transform:uppercase;color:#888;letter-spacing:0.05em;margin-bottom:4px}
        .card .val{font-size:18px;font-weight:600}
        table{border-collapse:collapse;width:100%;font-size:13px}
        th{background:${colorHex};color:#fff;padding:10px 14px;text-align:left}
        th:nth-child(2){text-align:center}th:nth-child(3){text-align:right}
        td{padding:8px 14px;border-bottom:1px solid #eee}
        .total-row td{font-weight:700;border-top:2px solid #333;background:#f0f0f0}
      </style></head><body>
      <h1>${projectName || project.label + " Project"}</h1>
      <div class="sub">Generated ${new Date().toLocaleDateString()}</div>
      ${
        projectName || clientName
          ? `<div class="meta">
        ${projectName ? `<div><strong>Project:</strong> ${projectName}</div>` : ""}
        ${clientName ? `<div><strong>Client:</strong> ${clientName}</div>` : ""}
        <div><strong>Type:</strong> ${project.label}</div>
      </div>`
          : ""
      }
      <div class="summary">
        <div class="card"><div class="lbl">Total Budget</div><div class="val">${fmt(numBudget)} USD</div></div>
        <div class="card"><div class="lbl">${deductLabel} (${numDeductPct}%)</div><div class="val" style="color:#bf360c">−${fmt(deductAmount)} USD</div></div>
        <div class="card"><div class="lbl">Effective Budget</div><div class="val" style="color:${colorHex}">${fmt(effectiveBudget)} USD</div></div>
      </div>
      <table><thead><tr><th>Team / Member</th><th>%</th><th>Amount (USD)</th></tr></thead>
      <tbody>${teamRows}
        <tr class="total-row"><td>Total</td><td style="text-align:center">${totalRatio}%</td><td style="text-align:right">${fmt(effectiveBudget)}</td></tr>
      </tbody></table>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 250);
  }

  // ============ Render ============
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Project Budget Calculator
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Click any amount to copy • Manage teams and member shares
            </p>
          </div>
          <div
            className={`hidden sm:flex h-10 w-10 rounded-xl ${accent.bg} items-center justify-center text-white shadow-sm`}
          >
            <DollarSign size={18} />
          </div>
        </div>

        {/* Project Type Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex gap-1 shadow-sm">
          {Object.values(projects).map((p) => {
            const a = ACCENT_MAP[p.accent];
            const isActive = activeProjectId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                  ${isActive ? `${a.bg} text-white shadow-sm` : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Briefcase size={14} />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Project Identity Card */}
        <Card icon={<FileText size={14} />} title="Project Identity">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Project Name" icon={<FileText size={12} />}>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Acme Dashboard"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none"
              />
            </Field>
            <Field label="Client / Company" icon={<Building2 size={12} />}>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Inc."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none"
              />
            </Field>
          </div>
        </Card>

        {/* Budget Configuration */}
        <Card icon={<DollarSign size={14} />} title="Budget Configuration">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Field label="Total Budget (USD)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none tabular-nums"
                />
              </div>
            </Field>
            <Field label="Deduction Label">
              <input
                value={deductLabel}
                onChange={(e) => setDeductLabel(e.target.value)}
                placeholder="VAT"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none"
              />
            </Field>
            <Field label="Deduct %">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={deductPct}
                  onChange={(e) => setDeductPct(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  %
                </span>
              </div>
            </Field>
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryTile label="Total" value={numBudget} tone="slate" />
            <SummaryTile
              label={`− ${deductLabel} (${numDeductPct}%)`}
              value={deductAmount}
              tone="amber"
              negative
            />
            <SummaryTile
              label="Effective"
              value={effectiveBudget}
              tone="emerald"
              accent={accent}
            />
          </div>
        </Card>

        {/* Ratio Warning */}
        {ratioWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertCircle size={14} />
              <span>
                Team ratios total{" "}
                <strong className="tabular-nums">
                  {totalRatio.toFixed(1)}%
                </strong>{" "}
                — should be 100%
              </span>
            </div>
            <button
              onClick={normalizeRatios}
              className="text-xs font-medium text-amber-800 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100"
            >
              Normalize
            </button>
          </div>
        )}

        {/* Teams List */}
        <div className="space-y-2">
          {project.teams.map((team) => {
            const teamAmt = (effectiveBudget * team.ratio) / 100;
            const expanded = expandedTeams[team.id];
            const memberTotal = team.members.reduce((s, m) => s + m.share, 0);
            const memberWarning =
              team.members.length > 0 && Math.abs(memberTotal - 100) > 0.01;
            const isEditing = editingTeam === team.id;
            const memberAmountTotal = team.members.reduce(
              (s, m) => s + (teamAmt * m.share) / 100,
              0,
            );

            return (
              <div
                key={team.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Team Header Row */}
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() =>
                      setExpandedTeams((e) => ({
                        ...e,
                        [team.id]: !e[team.id],
                      }))
                    }
                    className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
                  >
                    {expanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        value={team.name}
                        onChange={(e) =>
                          updateTeam(team.id, { name: e.target.value })
                        }
                        onBlur={() => setEditingTeam(null)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setEditingTeam(null)
                        }
                        autoFocus
                        className="w-full px-2 py-1 text-sm font-medium rounded-md border border-slate-300 outline-none focus:border-slate-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {team.name}
                        </span>
                        {team.members.length > 0 && (
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium
                            ${memberWarning ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}
                          >
                            <Users size={10} />
                            {team.members.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ratio input */}
                  <div className="relative flex-shrink-0 w-20">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={team.ratio}
                      onChange={(e) =>
                        updateTeam(team.id, {
                          ratio: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-2 pr-6 py-1.5 text-sm rounded-lg border border-slate-200 outline-none focus:border-slate-400 tabular-nums text-right"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      %
                    </span>
                  </div>

                  {/* Amount (copyable) */}
                  <div className="flex-shrink-0 w-28 text-right">
                    <CopyableAmount
                      value={teamAmt}
                      label={team.name}
                      textClass={`text-sm ${accent.text}`}
                      resetKey={budgetKey}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <button
                      onClick={() => addMember(team.id)}
                      title="Add member"
                      className="hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <Plus size={11} /> Member
                    </button>
                    <button
                      onClick={() => setEditingTeam(isEditing ? null : team.id)}
                      title="Rename"
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => removeTeam(team.id)}
                      title="Delete"
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Members panel */}
                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                    {team.members.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-slate-500 italic mb-2">
                          No members assigned
                        </p>
                        <button
                          onClick={() => addMember(team.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-600 hover:bg-white"
                        >
                          <Plus size={11} /> Add first member
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Member summary banner */}
                        <div
                          className={`flex items-center justify-between mb-2 text-xs px-2 py-1.5 rounded-lg
                          ${memberWarning ? "bg-amber-100 text-amber-800" : "bg-white text-slate-600 border border-slate-200"}`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Users size={11} />
                            <strong>{team.members.length}</strong> member
                            {team.members.length > 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-3 tabular-nums">
                            <span>
                              KPI Sum:{" "}
                              <strong
                                className={
                                  memberWarning
                                    ? "text-amber-900"
                                    : "text-slate-900"
                                }
                              >
                                {memberTotal.toFixed(1)}%
                              </strong>
                              {memberWarning && (
                                <AlertCircle
                                  size={11}
                                  className="inline ml-1"
                                />
                              )}
                            </span>
                            <span className="hidden sm:inline">
                              Total:{" "}
                              <strong className="text-slate-900">
                                ${fmt(memberAmountTotal)}
                              </strong>
                            </span>
                          </span>
                        </div>

                        {/* Member list */}
                        <div className="space-y-1.5">
                          {team.members.map((m) => {
                            const memAmt = (teamAmt * m.share) / 100;
                            return (
                              <div
                                key={m.id}
                                className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-2 flex-wrap sm:flex-nowrap"
                              >
                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                                  {(m.name[0] || "?").toUpperCase()}
                                </div>
                                <input
                                  value={m.memberId}
                                  onChange={(e) =>
                                    updateMember(team.id, m.id, {
                                      memberId: e.target.value,
                                    })
                                  }
                                  placeholder="ID"
                                  className="w-24 flex-shrink-0 px-2 py-1 text-xs font-mono rounded-md border border-slate-200 hover:border-slate-300 focus:border-slate-400 outline-none bg-slate-50 text-slate-600"
                                />
                                <input
                                  value={m.name}
                                  onChange={(e) =>
                                    updateMember(team.id, m.id, {
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="Name"
                                  className="flex-1 min-w-0 px-2 py-1 text-sm rounded-md border border-transparent hover:border-slate-200 focus:border-slate-300 outline-none"
                                />
                                <div className="relative flex-shrink-0 w-20">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={m.share}
                                    onChange={(e) =>
                                      updateMember(team.id, m.id, {
                                        share: parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full pl-2 pr-6 py-1 text-sm rounded-md border border-slate-200 outline-none focus:border-slate-400 tabular-nums text-right"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                    %
                                  </span>
                                </div>
                                <div className="flex-shrink-0 w-24 text-right">
                                  <CopyableAmount
                                    value={memAmt}
                                    label={`${team.name} / ${m.name}`}
                                    textClass="text-xs text-slate-700"
                                    resetKey={budgetKey}
                                  />
                                </div>
                                <button
                                  onClick={() => removeMember(team.id, m.id)}
                                  className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-red-400 flex-shrink-0"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => addMember(team.id)}
                          className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-700 flex items-center justify-center gap-1.5"
                        >
                          <Plus size={11} /> Add another member
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals Card */}
        <div
          className={`bg-gradient-to-r ${accent.gradient} rounded-2xl p-4 shadow-sm text-white`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-80 uppercase tracking-wide">
                Grand Total
              </p>
              <p className="text-xs opacity-70 mt-0.5">
                {project.teams.length} teams · {totalRatio.toFixed(1)}%
                allocated
              </p>
            </div>
            <button
              //   onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              onClick={() => {
                navigator.clipboard.writeText(effectiveBudget.toFixed(2));
                show(`Copied total: $${fmt(effectiveBudget)}`);
              }}
              className="text-right group cursor-pointer"
            >
              <p className="text-2xl font-bold tabular-nums flex items-center gap-2">
                ${fmt(effectiveBudget)}
                <Copy
                  size={14}
                  className="opacity-50 group-hover:opacity-100 transition-opacity"
                />
              </p>
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={addTeam}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed ${accent.border} ${accent.text} text-sm font-medium hover:${accent.bgSoft} bg-white`}
          >
            <Plus size={14} /> Add Team
          </button>
          <button
            onClick={() => setShowResult(true)}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${accent.bg} text-white text-sm font-medium hover:opacity-90 shadow-sm`}
          >
            <FileText size={14} /> View Result
          </button>
          <button
            onClick={resetProject}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50"
          >
            Reset to Default
          </button>
        </div>

        {/* Export Bar */}
        <Card icon={<Download size={14} />} title="Export">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download size={13} /> CSV
            </button>
            <button
              onClick={copyJSON}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Copy size={13} /> JSON
            </button>
            <button
              onClick={printPDF}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl ${accent.bg} text-white text-sm font-medium hover:opacity-90`}
            >
              <Printer size={13} /> PDF
            </button>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-400 pt-2">
          💡 Tip: Click any dollar amount to copy it to your clipboard
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            {toast.msg}
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResult && (
        <ResultModal
          project={project}
          accent={accent}
          effectiveBudget={effectiveBudget}
          projectName={projectName}
          clientName={clientName}
          budgetKey={budgetKey}
          search={resultSearch}
          setSearch={setResultSearch}
          onClose={() => {
            setShowResult(false);
            setResultSearch("");
          }}
        />
      )}
    </div>
  );
}

// ============ Result Modal ============
function ResultModal({
  project,
  accent,
  effectiveBudget,
  projectName,
  clientName,
  budgetKey,
  search,
  setSearch,
  onClose,
}: {
  project: Project;
  accent: {
    bg: string;
    bgSoft: string;
    border: string;
    text: string;
    gradient: string;
  };
  effectiveBudget: number;
  projectName: string;
  clientName: string;
  budgetKey: string;
  search: string;
  setSearch: (search: string) => void;
  onClose: () => void;
}) {
  // Build flat member list with team info
  const allMembers = useMemo(() => {
    const list: {
      teamName: string;
      teamRatio: number;
      teamAmount: number;
      memberId: string;
      name: string;
      share: number;
      amount: number;
    }[] = [];
    project.teams.forEach((t: Team) => {
      const teamAmt = (effectiveBudget * t.ratio) / 100;
      t.members.forEach((m) => {
        list.push({
          teamName: t.name,
          teamRatio: t.ratio,
          teamAmount: teamAmt,
          memberId: m.memberId,
          name: m.name,
          share: m.share,
          amount: (teamAmt * m.share) / 100,
        });
      });
    });
    return list;
  }, [project, effectiveBudget]);

  // Group by memberId+name (same person across teams)
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        memberId: string;
        name: string;
        total: number;
        entries: {
          teamName: string;
          share: number;
          amount: number;
          teamRatio: number;
        }[];
      }
    >();
    allMembers.forEach((m) => {
      const key = `${m.memberId}::${m.name}`.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          memberId: m.memberId,
          name: m.name,
          total: 0,
          entries: [],
        });
      }
      const g = map.get(key)!;
      g.total += m.amount;
      g.entries.push({
        teamName: m.teamName,
        share: m.share,
        amount: m.amount,
        teamRatio: m.teamRatio,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [allMembers]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase().trim();
    return grouped.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.memberId.toLowerCase().includes(q) ||
        g.entries.some((e) => e.teamName.toLowerCase().includes(q)),
    );
  }, [grouped, search]);

  const grandTotal = grouped.reduce((s, g) => s + g.total, 0);

  function copyAll() {
    const lines = ["Member ID,Name,Team,Share %,Amount"];
    grouped.forEach((g) => {
      g.entries.forEach((e) => {
        lines.push(
          `${g.memberId},${g.name},${e.teamName},${e.share}%,${e.amount.toFixed(2)}`,
        );
      });
    });
    lines.push(`,,,Total,${grandTotal.toFixed(2)}`);
    navigator.clipboard.writeText(lines.join("\n"));
    window.dispatchEvent(
      new CustomEvent("budget-toast", { detail: "All results copied as CSV" }),
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${accent.gradient} px-5 py-4 text-white`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText size={18} /> Member KPI Result
              </h2>
              <p className="text-xs opacity-90 mt-0.5 truncate">
                {projectName || project.label}
                {clientName ? ` · ${clientName}` : ""} · {grouped.length} unique
                members
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="px-5 py-3 border-b border-slate-200 flex gap-2 items-center bg-slate-50">
          <div className="flex-1 relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or team..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-slate-400 bg-white"
            />
          </div>
          <button
            onClick={copyAll}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Copy size={12} /> Copy All
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              {grouped.length === 0
                ? "No members added yet. Add members to teams to see results here."
                : "No members match your search."}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((g, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Member header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <div
                      className={`w-9 h-9 rounded-lg ${accent.bg} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}
                    >
                      {(g.name[0] || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {g.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {g.memberId}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">
                        Total KPI
                      </p>
                      <CopyableAmount
                        value={g.total}
                        label={`${g.name} total`}
                        textClass={`text-base ${accent.text}`}
                        resetKey={budgetKey}
                      />
                    </div>
                  </div>

                  {/* Team breakdown */}
                  <div className="divide-y divide-slate-100">
                    {g.entries.map((e, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 font-medium truncate">
                            {e.teamName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Team ratio: {e.teamRatio}% · Member share: {e.share}
                            %
                          </p>
                        </div>
                        <CopyableAmount
                          value={e.amount}
                          label={`${g.name} from ${e.teamName}`}
                          textClass="text-sm text-slate-700"
                          resetKey={budgetKey}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {filtered.length} of {grouped.length} members shown
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Grand Total:</span>
            <CopyableAmount
              value={grandTotal}
              label="Grand total"
              textClass={`text-base ${accent.text} font-bold`}
              resetKey={budgetKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Sub Components ============
function Card({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center gap-1.5 mb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  accent,
  negative,
}: {
  label: string;
  value: number;
  tone: "slate" | "amber" | "emerald";
  accent?: {
    bg: string;
    bgSoft: string;
    border: string;
    text: string;
    gradient: string;
  };
  negative?: boolean;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-50 text-slate-900",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`rounded-xl p-3 ${tones[tone]}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider opacity-70 truncate">
        {label}
      </p>
      <p
        className={`text-base font-bold tabular-nums mt-0.5 ${accent ? accent.text : ""}`}
      >
        {negative ? "−" : ""}${fmt(value, 0)}
      </p>
    </div>
  );
}
