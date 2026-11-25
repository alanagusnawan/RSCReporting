"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  Printer,
  Sliders,
  X,
  Tag,
  Laptop,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { RegisterPrinterModal } from "@/components/printers/RegisterPrinterModal";
import { AgentPrintersModal } from "@/components/printers/AgentPrintersModal";
import { EditAgentModal } from "@/components/printers/EditAgentModal";
import { ManageCategoriesModal } from "@/components/categories/ManageCategoriesModal";
import { StatCard } from "@/components/dashboard/StatCard";
import { AgentTable, AgentItem } from "@/components/dashboard/AgentTable";
import { AgentHealthWidget } from "@/components/dashboard/AgentHealthWidget";
import {
  SharedPrintersSection,
  PrinterShareItem,
} from "@/components/dashboard/SharedPrintersSection";
import {
  AuditLogsSection,
  AuditLogItem,
} from "@/components/dashboard/AuditLogsSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getApiBaseUrl, getWsBaseUrl } from "@/lib/apiConfig";

interface TemplateItem {
  id: string;
  title: string;
  desc: string;
  category: string;
  version: number;
  tags: string[];
}

const INITIAL_TEMPLATES: TemplateItem[] = [
  {
    id: "invoice-v1",
    title: "Commercial Invoice",
    desc: "Standard enterprise billing with itemized charges, VAT calculation, and payment terms.",
    category: "Financial",
    version: 1,
    tags: ["A4", "Portrait", "Table", "Tax"],
  },
  {
    id: "receipt-v1",
    title: "Customer Payment Receipt",
    desc: "Point-of-sale receipt with transaction timestamps, payment method, and QR verification.",
    category: "Financial",
    version: 1,
    tags: ["A4", "Portrait", "Compact"],
  },
  {
    id: "delivery-note-v1",
    title: "Delivery Fulfillment Note",
    desc: "Logistics dispatch sheet with shipping coordinates, package tracking, and recipient sign-off.",
    category: "Logistics",
    version: 1,
    tags: ["A4", "Portrait", "Shipping"],
  },
  {
    id: "purchase-order-v1",
    title: "Vendor Purchase Order",
    desc: "Official procurement document featuring authorization signoffs and delivery milestones.",
    category: "Operations",
    version: 1,
    tags: ["A4", "Portrait", "Procurement"],
  },
  {
    id: "general-report-v1",
    title: "General Analytical Report",
    desc: "Multi-section analytical summary with category grouping, running subtotals, and grand totals.",
    category: "Analytics",
    version: 1,
    tags: ["A4", "Portrait", "Grouping", "Totals"],
  },
];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "templates" | "agents" | "shares" | "audit"
  >("agents");
  const [templates, setTemplates] = useState<TemplateItem[]>(INITIAL_TEMPLATES);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([
    { id: "c1", name: "Financial" },
    { id: "c2", name: "Logistics" },
    { id: "c3", name: "Operations" },
    { id: "c4", name: "Analytics" },
  ]);
  const [isManageCatOpen, setIsManageCatOpen] = useState(false);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [shares, setShares] = useState<PrinterShareItem[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegisterPrinterOpen, setIsRegisterPrinterOpen] = useState(false);
  const [selectedAgentForRegister, setSelectedAgentForRegister] = useState<
    string | undefined
  >();
  const [agentForPrintersModal, setAgentForPrintersModal] =
    useState<AgentItem | null>(null);
  const [agentForEditModal, setAgentForEditModal] = useState<AgentItem | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentHostname, setCurrentHostname] = useState<string>("localhost");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHostname(window.location.hostname || "localhost");
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/categories`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      }
    } catch {}
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/templates`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: TemplateItem[] = data.map((d: any) => ({
            id: d.id,
            title: d.name || d.id,
            desc: d.description || "Custom report template definition.",
            category: d.category || "General",
            version: d.currentVersion || 1,
            tags: ["A4", "Portrait"],
          }));
          setTemplates(mapped);
        }
      }
    } catch {}
  };

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/agents`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch {
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchShares = async () => {
    setLoadingShares(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/shares`);
      if (res.ok) {
        const data = await res.json();
        setShares(data);
      }
    } catch {
    } finally {
      setLoadingShares(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch {
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDeleteAgent = async (agentId: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus agent "${name}" dari database?`))
      return;
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/printers/agents/${agentId}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        fetchAgents();
      } else {
        alert("Gagal menghapus agent.");
      }
    } catch {
      alert("Koneksi gagal.");
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchAgents();
    fetchCategories();
    fetchShares();
    fetchAuditLogs();
  }, []);

  // New Design Form State
  const [reportName, setReportName] = useState("");
  const [reportSlug, setReportSlug] = useState("");
  const [category, setCategory] = useState<string>("Financial");
  const [description, setDescription] = useState("");
  const [starterPreset, setStarterPreset] = useState("blank");
  const [paperSize, setPaperSize] = useState("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );

  const handleNameChange = (val: string) => {
    setReportName(val);
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setReportSlug(slug || "");
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSlug) return;
    setIsSubmitting(true);

    const isBlank = starterPreset === "blank";

    const initialDef = {
      schemaVersion: "1.0.0",
      reportId: reportSlug,
      name: reportName || reportSlug,
      pageSettings: {
        paperSize,
        orientation,
        margins: { top: 10, bottom: 10, left: 10, right: 10, unit: "mm" },
        headerHeight: 20,
        footerHeight: 15,
      },
      datasets: [{ id: "mainDataset", name: "Items", dataPath: "items" }],
      sections: [
        {
          id: "sec_header",
          name: "ReportHeader",
          type: "ReportHeader",
          height: 100,
          components: isBlank
            ? []
            : [
                {
                  id: `c_${Date.now()}_1`,
                  type: "TextBox",
                  name: "Title",
                  x: 24,
                  y: 20,
                  width: 340,
                  height: 38,
                  value: (reportName || reportSlug).toUpperCase(),
                  style: {
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#0f172a",
                    textAlign: "left",
                  },
                },
              ],
        },
        {
          id: "sec_detail",
          name: "Detail",
          type: "Detail",
          height: 300,
          components: isBlank
            ? []
            : [
                {
                  id: `c_${Date.now()}_2`,
                  type: "Table",
                  name: "DataTable",
                  x: 24,
                  y: 110,
                  width: 540,
                  height: 180,
                  columns: [
                    { id: "c1", title: "Item", width: 220, field: "name" },
                    { id: "c2", title: "Qty", width: 60, field: "quantity" },
                    { id: "c3", title: "Price", width: 100, field: "price" },
                  ],
                  showHeader: true,
                  showFooter: true,
                },
              ],
        },
        {
          id: "sec_footer",
          name: "PageFooter",
          type: "PageFooter",
          height: 50,
          components: [],
        },
      ],
    };

    try {
      await fetch(`${getApiBaseUrl()}/api/v1/templates/${reportSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reportName || reportSlug,
          description:
            description || "Custom report definition created in designer.",
          category,
          definition: initialDef,
        }),
      });
    } catch {}

    const newTemplate: TemplateItem = {
      id: reportSlug,
      title: reportName || "Untitled Report",
      desc: description || "Custom report definition created in designer.",
      category,
      version: 1,
      tags: [paperSize, orientation === "portrait" ? "Portrait" : "Landscape"],
    };

    setTemplates((prev) => [
      newTemplate,
      ...prev.filter((t) => t.id !== reportSlug),
    ]);
    setIsSubmitting(false);
    setIsModalOpen(false);

    router.push(
      `/reports/${reportSlug}/designer?preset=${starterPreset}&size=${paperSize}&orient=${orientation}`,
    );
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.desc.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === "All" || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const onlineAgentsCount = agents.filter((a) => a.status === "online").length;

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-[#111827] flex flex-col">
      {/* 1. Sticky White Navbar (PolicyPilot Standard) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2F6BFF] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-[#111827] block">
                RSC Reporting
              </span>
            </div>
          </div>

          {/* Center Segmented Nav Pills */}
          <nav
            className="flex items-center bg-[#F4F4F5] p-1 rounded-xl border border-[#E5E7EB]"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "templates"}
              onClick={() => setActiveTab("templates")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "templates"
                  ? "bg-white text-[#111827] font-semibold shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Templates Studio
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "agents"}
              onClick={() => {
                setActiveTab("agents");
                fetchAgents();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "agents"
                  ? "bg-white text-[#111827] font-semibold shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              <span>Print Agents</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  onlineAgentsCount > 0
                    ? "bg-[#16A34A] animate-pulse"
                    : "bg-[#9CA3AF]"
                }`}
              />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "shares"}
              onClick={() => {
                setActiveTab("shares");
                fetchShares();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "shares"
                  ? "bg-white text-[#111827] font-semibold shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              <span>Shared (A → B)</span>
              {shares.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#EAF0FF] text-[#2F6BFF] font-semibold">
                  {shares.length}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "audit"}
              onClick={() => {
                setActiveTab("audit");
                fetchAuditLogs();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "audit"
                  ? "bg-white text-[#111827] font-semibold shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Audit Trail
            </button>
          </nav>

          {/* Right Header Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedAgentForRegister(undefined);
                setIsRegisterPrinterOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] shadow-xs active:scale-98 transition-all"
            >
              <Printer className="w-4 h-4 text-[#2F6BFF]" />
              <span>Connect Printer</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#2F6BFF] hover:bg-[#1F55E0] text-white shadow-xs active:scale-98 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Page Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Page Header (Clean SaaS Archetype) */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827]">
              {activeTab === "agents"
                ? "Print Agents"
                : activeTab === "templates"
                ? "Templates Studio"
                : activeTab === "shares"
                ? "Shared Printers (A → B)"
                : "Audit Trail & Logs"}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              {activeTab === "agents"
                ? "Manajemen workstation agen cetak lokal, telemetri real-time, dan konfigurasi antrean printer."
                : activeTab === "templates"
                ? "Desain dokumen dengan Takumi Vector PDF Engine, binding skema data, dan eksekusi cetak multi-halaman."
                : activeTab === "shares"
                ? "Pemetaan antrean printer fisik komputer sumber (A) ke workstation target (B)."
                : "Log historis aktivitas pemasangan, pencopotan, dan repoint printer."}
            </p>
          </div>

          {activeTab === "templates" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsManageCatOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] shadow-xs transition-all active:scale-98"
              >
                <Tag className="w-3.5 h-3.5 text-[#2F6BFF]" />
                <span>Kelola Kategori</span>
              </button>
            </div>
          )}
        </section>

        {/* 3. 4 Interactive Stat Cards (PolicyPilot Grid) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Templates"
            value={templates.length}
            subtitle="Template laporan terpasang"
            icon={FileText}
            onClick={() => setActiveTab("templates")}
            active={activeTab === "templates"}
          />
          <StatCard
            title="Online Agents"
            value={
              <span className="flex items-baseline gap-1">
                <span className="text-[#16A34A]">{onlineAgentsCount}</span>
                <span className="text-sm font-normal text-[#9CA3AF]">
                  / {agents.length}
                </span>
              </span>
            }
            subtitle={`${onlineAgentsCount} workstation siap menerima job cetak`}
            icon={Laptop}
            badge={onlineAgentsCount > 0 ? "Operational" : "Standby"}
            onClick={() => setActiveTab("agents")}
            active={activeTab === "agents"}
          />
          <StatCard
            title="Kategori Laporan"
            value={categories.length}
            subtitle="Kategori modul aktif"
            icon={Tag}
            onClick={() => setIsManageCatOpen(true)}
          />
          <StatCard
            title="Takumi Precision"
            value="1:1"
            subtitle="Pixel-perfect vector canvas"
            icon={Layers}
            badge="Hardware Accel"
          />
        </section>

        {/* 4. Tab Content: Print Agents vs Templates Studio vs Shared vs Audit */}
        {activeTab === "agents" ? (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Main Agent Table with Advanced Pagination */}
            <div className="flex-1 w-full min-w-0">
              <AgentTable
                agents={agents}
                loading={loadingAgents}
                onRefresh={fetchAgents}
                onOpenRegisterModal={() => {
                  setSelectedAgentForRegister(undefined);
                  setIsRegisterPrinterOpen(true);
                }}
                onOpenPrintersModal={(agent) => setAgentForPrintersModal(agent)}
                onOpenEditModal={(agent) => setAgentForEditModal(agent)}
                onDeleteAgent={handleDeleteAgent}
              />
            </div>

            {/* Right Health Sidebar (Desktop ≥ 1280px) */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
              <AgentHealthWidget agents={agents} />

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
                <h4 className="text-xs font-semibold text-[#111827] uppercase tracking-wider mb-2">
                  Petunjuk Agen Go (RSCPrinting)
                </h4>
                <p className="text-xs text-[#6B7280] leading-relaxed mb-3">
                  Workstation agen otomatis terhubung via WebSocket ke endpoint{" "}
                  <code>/agent/ws</code> menggunakan token otentikasi.
                </p>
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-[11px] font-mono text-[#2F6BFF] select-all">
                  ws://{currentHostname}:5488/agent/ws
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "shares" ? (
          <SharedPrintersSection
            shares={shares}
            loading={loadingShares}
            onRefresh={fetchShares}
          />
        ) : activeTab === "audit" ? (
          <AuditLogsSection
            logs={auditLogs}
            loading={loadingLogs}
            onRefresh={fetchAuditLogs}
          />
        ) : (
          /* Templates Studio Catalog */
          <section className="flex flex-col gap-5">
            {/* Toolbar Filter & Search */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === "All"
                      ? "bg-[#111827] text-white shadow-xs"
                      : "bg-[#F4F4F5] text-[#6B7280] hover:text-[#111827]"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedCategory === cat.name
                        ? "bg-[#111827] text-white shadow-xs"
                        : "bg-[#F4F4F5] text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari template laporan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#111827] placeholder-[#9CA3AF] focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/20 outline-none"
                />
              </div>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#2F6BFF]/50 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start gap-2 mb-2.5">
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#F4F4F5] text-[#4B5563] border border-[#E5E7EB]">
                        {tmpl.id}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF0FF] text-[#2F6BFF]">
                        {tmpl.category}
                      </span>
                    </div>

                    <h3 className="font-semibold text-[#111827] text-base group-hover:text-[#2F6BFF] transition-colors">
                      {tmpl.title}
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-1.5 line-clamp-2 leading-relaxed">
                      {tmpl.desc}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {tmpl.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Action Links */}
                  <div className="bg-[#F9FAFB] px-5 py-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                    <Link
                      href={`/reports/${tmpl.id}/designer`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827] transition"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#2F6BFF]" />
                      <span>Visual Designer</span>
                    </Link>
                    <Link
                      href={`/reports/${tmpl.id}/preview`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F6BFF] hover:text-[#1F55E0] bg-[#EAF0FF] hover:bg-[#D7E4FF] px-3 py-1.5 rounded-lg transition"
                    >
                      <span>Preview & Print</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <EmptyState
                icon={FileText}
                title="Tidak ada template yang cocok"
                description="Coba ubah kata kunci pencarian Anda atau buat template laporan baru sekarang."
                actionLabel="+ Buat Report Baru"
                onAction={() => setIsModalOpen(true)}
              />
            )}
          </section>
        )}
      </main>

      {/* 5. Modal: Create New Design */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F9FAFB]">
              <div>
                <h3 className="font-semibold text-[#111827] text-base">
                  Buat Definisi Laporan Baru
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Atur metadata laporan, preset ukuran kertas, dan orientasi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1">
                  Nama Laporan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Laporan Penjualan Bulanan"
                  value={reportName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#111827] placeholder-[#9CA3AF] focus:border-[#2F6BFF] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1">
                  Identifier Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. monthly-sales-summary"
                  value={reportSlug}
                  onChange={(e) => setReportSlug(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#2F6BFF] placeholder-[#9CA3AF] focus:border-[#2F6BFF] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#111827] focus:border-[#2F6BFF] outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1">
                    Starter Preset
                  </label>
                  <select
                    value={starterPreset}
                    onChange={(e) => setStarterPreset(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#111827] focus:border-[#2F6BFF] outline-none"
                  >
                    <option value="blank">Blank Canvas (Polos)</option>
                    <option value="invoice-v1">Invoice Blueprint</option>
                    <option value="receipt-v1">Receipt Blueprint</option>
                    <option value="delivery-note-v1">Delivery Blueprint</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1">
                    Ukuran Kertas
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#111827] focus:border-[#2F6BFF] outline-none"
                  >
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="A5">A5 (148 × 210 mm)</option>
                    <option value="Letter">Letter (8.5 × 11 in)</option>
                    <option value="Custom">Custom Dimensions</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1">
                    Orientasi
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#111827] focus:border-[#2F6BFF] outline-none"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1">
                  Catatan / Deskripsi Laporan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan penggunaan atau skema data..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#111827] placeholder-[#9CA3AF] focus:border-[#2F6BFF] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6B7280] hover:text-[#111827]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!reportSlug || isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-[#2F6BFF] hover:bg-[#1F55E0] text-white rounded-lg disabled:opacity-50 transition shadow-xs"
                >
                  {isSubmitting ? "Membuat..." : "Buat & Buka Designer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Sub-modals Integration */}
      <RegisterPrinterModal
        isOpen={isRegisterPrinterOpen}
        defaultAgentId={selectedAgentForRegister}
        onClose={() => setIsRegisterPrinterOpen(false)}
        onSuccess={() => fetchAgents()}
      />

      <AgentPrintersModal
        isOpen={Boolean(agentForPrintersModal)}
        onClose={() => setAgentForPrintersModal(null)}
        agent={agentForPrintersModal}
        allAgents={agents}
        onOpenRegisterPrinter={(agentId) => {
          setSelectedAgentForRegister(agentId);
          setIsRegisterPrinterOpen(true);
        }}
        onRefresh={() => {
          fetchAgents();
          fetchShares();
        }}
      />

      <ManageCategoriesModal
        isOpen={isManageCatOpen}
        onClose={() => setIsManageCatOpen(false)}
        categories={categories}
        onRefresh={() => fetchCategories()}
      />

      <EditAgentModal
        isOpen={Boolean(agentForEditModal)}
        onClose={() => setAgentForEditModal(null)}
        agent={agentForEditModal}
        onSuccess={() => fetchAgents()}
      />
    </div>
  );
}
