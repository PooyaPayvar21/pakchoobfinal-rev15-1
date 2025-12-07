import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import { kpiApi } from "../services/kpiApi";

function normalizePercent(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

function KpiPersonReport() {
  const { personal_code } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seasonFilter, setSeasonFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [kpiSearch, setKpiSearch] = useState("");

  const managerName = useMemo(() => {
    try {
      const info = JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
      return info.full_name || "";
    } catch {
      return "";
    }
  }, []);
  const managerDepartman = useMemo(() => {
    try {
      const info = JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
      return info.departman || "";
    } catch {
      return "";
    }
  }, []);
  const isManagement = useMemo(() => {
    try {
      const info = JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
      const role = String(info.role || "").toLowerCase();
      return ["management", "manager", "ceo", "superadmin"].includes(role);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Prefer personal_code-only query to avoid manager/departman 400s
        let baseResp = null;
        try {
          baseResp = await kpiApi.fetchSubordinateEntries({
            personal_code,
            category: "All",
            manager: managerName || undefined,
            departman: managerDepartman || undefined,
            not_managed: false,
            outside_department: false,
          });
        } catch (e) {
          baseResp = null;
        }
        let arr = [];
        if (baseResp) {
          arr = Array.isArray(baseResp) ? baseResp : baseResp?.tasks || [];
        }
        // If still empty, try with manager fallback using username alias
        if (arr.length === 0) {
          const uname = localStorage.getItem("username") || "";
          const candidates = [];
          if (managerName) candidates.push(managerName);
          if (uname) candidates.push(uname);
          for (const m of candidates) {
            try {
              const resp = await kpiApi.fetchSubordinateEntries({
                manager: m,
                personal_code,
                category: "All",
                departman: managerDepartman || "",
                not_managed: false,
                outside_department: false,
              });
              const tmp = Array.isArray(resp) ? resp : resp?.tasks || [];
              if (tmp.length > 0) {
                arr = tmp;
                break;
              }
            } catch {}
          }
        }
        const taskMap = new Map();
        arr.forEach((t) => {
          const key = t.row ?? t.id;
          if (key == null) return;
          if (!taskMap.has(key)) taskMap.set(key, t);
        });
        const tasks = Array.from(taskMap.values());
        const managerFull = String(managerName || "").trim();
        const managementFiltered = isManagement
          ? tasks.filter((t) => {
              const dm = String(t.direct_management || "").trim();
              const mgr = String(t.manager || t.manager_name || "").trim();
              const fn = String(t.full_name || "").trim();
              const role = String(t.role || "").trim();
              if (dm && dm === managerFull) return true;
              if (mgr && mgr === managerFull) return true;
              if (fn === managerFull) return false;
              if (role && /مدیر/i.test(role)) return false;
              return true;
            })
          : tasks;
        const mapped = managementFiltered
          .filter((t) => String(t.personal_code) === String(personal_code))
          .map((t) => ({
            id: t.row,
            KPIFa: t.kpi_fa || "",
            KPI_Info: t.kpi_info || "",
            target: t.target || "",
            KPI_weight: t.kpi_weight || "",
            KPI_Achievement: normalizePercent(t.kpi_achievement),
            Percentage_Achievement: normalizePercent(t.score_achievement_alt),
            Score_Achievement: t.score_achievement || 0,
            Type: t.entry_type === "Editable" ? "" : t.entry_type || "",
            Status:
              t.entry_type === "Confirmed"
                ? "Confirmed"
                : t.entry_type === "Editable"
                ? "Editable"
                : t.manager_status || "",
            Sum: t.sum_value || "",
            created_at: t.created_at || t.createdAt || null,
            season: t.season || t.Season || null,
            personal_code: t.personal_code,
            full_name: t.full_name,
            departman: t.departman || "",
          }));
        setEntries(mapped);
      } catch {
        toast.error("خطا در دریافت گزارش پرسنل");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [managerName, managerDepartman, personal_code, isManagement]);

  const uniqueSeasons = useMemo(() => {
    const s = new Set();
    entries.forEach((e) => {
      if (e.season && String(e.season).trim() !== "") s.add(String(e.season));
    });
    return Array.from(s.values());
  }, [entries]);

  const uniqueStatuses = useMemo(() => {
    const s = new Set();
    entries.forEach((e) => {
      if (e.Status && String(e.Status).trim() !== "") s.add(String(e.Status));
    });
    return Array.from(s.values());
  }, [entries]);

  const uniqueTypes = useMemo(() => {
    const s = new Set();
    entries.forEach((e) => {
      if (e.Type && String(e.Type).trim() !== "") s.add(String(e.Type));
    });
    return Array.from(s.values());
  }, [entries]);

  const matchesFilters = useCallback(
    (e) => {
      if (seasonFilter && String(e.season) !== String(seasonFilter))
        return false;
      if (statusFilter && String(e.Status) !== String(statusFilter))
        return false;
      if (typeFilter && String(e.Type) !== String(typeFilter)) return false;
      if (
        kpiSearch &&
        !String(e.KPIFa || "")
          .toLowerCase()
          .includes(kpiSearch.toLowerCase())
      )
        return false;
      return true;
    },
    [seasonFilter, statusFilter, typeFilter, kpiSearch]
  );

  const filteredEntries = useMemo(
    () => entries.filter(matchesFilters),
    [entries, seasonFilter, statusFilter, typeFilter, kpiSearch, matchesFilters]
  );

  const kpiEntryCounts = useMemo(() => {
    const m = new Map();
    filteredEntries.forEach((e) => {
      const key = String(e.KPIFa || "");
      if (!key) return;
      m.set(key, (m.get(key) || 0) + 1);
    });
    return m;
  }, [filteredEntries]);

  const getQuarter = useCallback((e) => {
    const s = String(e.season || "")
      .toUpperCase()
      .trim();
    if (/^Q[1-4]$/.test(s)) return s;
    if (/^[1-4]$/.test(s)) return `Q${s}`;
    const d = new Date(e.created_at || 0);
    if (!Number.isNaN(d.getTime())) {
      const m = d.getMonth() + 1;
      const q = Math.ceil(m / 3);
      return `Q${q}`;
    }
    return "";
  }, []);

  const kpiQuarterRows = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((e) => {
      const name = String(e.KPIFa || "");
      const q = getQuarter(e);
      if (!name || !/^Q[1-3]$/.test(q)) return;
      const g = map.get(name) || {};
      g[q] = e;
      map.set(name, g);
    });
    return map;
  }, [filteredEntries, getQuarter]);

  const kpiQuarterAchievements = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((e) => {
      const name = String(e.KPIFa || "");
      if (!name) return;
      const q = getQuarter(e);
      if (!/^Q[1-3]$/.test(q)) return;
      const dt = new Date(e.created_at || 0).getTime() || 0;
      const g = map.get(name) || {
        name,
        q1: null,
        q2: null,
        q3: null,
        _d1: 0,
        _d2: 0,
        _d3: 0,
      };
      if (q === "Q1" && dt >= g._d1) {
        g.q1 = normalizePercent(e.KPI_Achievement);
        g._d1 = dt;
      }
      if (q === "Q2" && dt >= g._d2) {
        g.q2 = normalizePercent(e.KPI_Achievement);
        g._d2 = dt;
      }
      if (q === "Q3" && dt >= g._d3) {
        g.q3 = normalizePercent(e.KPI_Achievement);
        g._d3 = dt;
      }
      map.set(name, g);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [filteredEntries, getQuarter]);

  const stats = useMemo(() => {
    const count = filteredEntries.length;
    const avgPct = count
      ? Math.round(
          filteredEntries.reduce(
            (s, e) => s + (Number(e.Percentage_Achievement) || 0),
            0
          ) / count
        )
      : 0;
    const confirmed = filteredEntries.filter(
      (e) => e.Status === "Confirmed"
    ).length;
    const seasons = Array.from(
      new Set(
        filteredEntries.map((e) => String(e.season || "")).filter(Boolean)
      )
    );
    return { count, avgPct, confirmed, seasons };
  }, [filteredEntries]);

  const isLight = document.documentElement.classList.contains("light");
  const [editValues, setEditValues] = useState({});
  const [savingRow, setSavingRow] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedQuarter, setSelectedQuarter] = useState({});
  const [sortBy, setSortBy] = useState("created");
  const [sortDir, setSortDir] = useState("desc");
  const formatDate = (v) => {
    if (!v) return "";
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? String(v)
      : d.toLocaleDateString("fa-IR");
  };
  const formatTarget = (v) => {
    if (v === null || v === undefined || v === "") return "";
    const s = String(v).trim();
    const n = Number(s.replace(/,/g, ""));
    if (Number.isNaN(n)) return s;
    if (n > 0 && n <= 1.0001) return String(Math.round(n * 100));
    return String(n);
  };

  const toggleSort = (key) => {
    setSortBy((prev) => (prev === key ? prev : key));
    setSortDir((prev) =>
      sortBy === key ? (prev === "asc" ? "desc" : "asc") : "desc"
    );
  };

  const tableRows = useMemo(() => {
    const rows = filteredEntries.slice();
    const dir = sortDir === "asc" ? 1 : -1;
    const by = sortBy;
    rows.sort((a, b) => {
      if (by === "kpi")
        return dir * String(a.KPIFa || "").localeCompare(String(b.KPIFa || ""));
      if (by === "quarter")
        return (
          dir *
          String(getQuarter(a) || "").localeCompare(String(getQuarter(b) || ""))
        );
      if (by === "status")
        return (
          dir * String(a.Status || "").localeCompare(String(b.Status || ""))
        );
      if (by === "type")
        return dir * String(a.Type || "").localeCompare(String(b.Type || ""));
      if (by === "created")
        return (
          dir *
          ((new Date(a.created_at || 0).getTime() || 0) -
            (new Date(b.created_at || 0).getTime() || 0))
        );
      if (by === "ach")
        return (
          dir *
          ((Number(a.KPI_Achievement) || 0) - (Number(b.KPI_Achievement) || 0))
        );
      if (by === "pct")
        return (
          dir *
          ((Number(a.Percentage_Achievement) || 0) -
            (Number(b.Percentage_Achievement) || 0))
        );
      if (by === "score")
        return (
          dir *
          ((Number(a.Score_Achievement) || 0) -
            (Number(b.Score_Achievement) || 0))
        );
      return (
        dir *
        ((new Date(a.created_at || 0).getTime() || 0) -
          (new Date(b.created_at || 0).getTime() || 0))
      );
    });
    return rows;
  }, [filteredEntries, sortBy, sortDir, getQuarter]);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"گزارش کامل پرسنل"} />
      <ToastContainer position="top-center" autoClose={1500} rtl={true} />
      <main className="w-full lg:px-8 mb-10 mt-10" dir="rtl">
        <div
          className={`w-full max-w-full mx-auto rounded-lg shadow p-4  ${
            isLight ? "bg-white" : "bg-gray-800"
          }`}
        >
          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2" dir="rtl">
            <input
              value={kpiSearch}
              onChange={(e) => setKpiSearch(e.target.value)}
              placeholder="جستجو KPI"
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-300"
                  : "bg-gray-800 text-gray-200 border-gray-600"
              }`}
            />
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-300"
                  : "bg-gray-800 text-gray-200 border-gray-600"
              }`}
            >
              <option value="">همه فصل‌ها</option>
              {uniqueSeasons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-300"
                  : "bg-gray-800 text-gray-200 border-gray-600"
              }`}
            >
              <option value="">همه وضعیت‌ها</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-300"
                  : "bg-gray-800 text-gray-200 border-gray-600"
              }`}
            >
              <option value="">همه نوع‌ها</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3 flex items-center gap-2" dir="rtl">
            <button
              onClick={() => navigate(-1)}
              className={`px-3 py-2 rounded cursor-pointer ${
                isLight
                  ? "bg-gray-200 hover:bg-gray-300"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            >
              بازگشت
            </button>
            <button
              onClick={() => {
                const counts = new Map();
                for (const e of entries) {
                  const d = String(e.departman || "")
                    .replaceAll("ي", "ی")
                    .replaceAll("ك", "ک")
                    .trim();
                  if (!d) continue;
                  counts.set(d, (counts.get(d) || 0) + 1);
                }
                let dep = "";
                if (counts.size > 0) {
                  dep = Array.from(counts.entries()).sort(
                    (a, b) => b[1] - a[1]
                  )[0][0];
                } else {
                  try {
                    const info = JSON.parse(
                      localStorage.getItem("kpiUserInfo") || "{}"
                    );
                    dep = String(info.departman || "")
                      .replaceAll("ي", "ی")
                      .replaceAll("ك", "ک")
                      .trim();
                  } catch {}
                }
                const url = `/kpimanagerreview?pc=${personal_code}${
                  dep ? `&departman=${encodeURIComponent(dep)}` : ""
                }`;
                navigate(url);
              }}
              className={`px-3 py-2 rounded cursor-pointer ${
                isLight
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-purple-500 text-white hover:bg-purple-600"
              }`}
            >
              بازبینی مدیر
            </button>
            <button
              onClick={() => {
                setSeasonFilter("");
                setStatusFilter("");
                setTypeFilter("");
                setKpiSearch("");
              }}
              className={`px-3 py-2 rounded cursor-pointer ${
                isLight
                  ? "bg-gray-200 hover:bg-gray-300"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            >
              پاک‌سازی فیلترها
            </button>
            <button
              onClick={() => {
                const rows = filteredEntries.slice();
                const headers = [
                  "KPIFa",
                  "KPI_Info",
                  "season",
                  "Status",
                  "Type",
                  "created_at",
                  "target",
                  "KPI_weight",
                  "Percentage_Achievement",
                  "Score_Achievement",
                  "Sum",
                ];
                const csv = [
                  headers.join(","),
                  ...rows.map((r) =>
                    headers
                      .map((h) => {
                        const v = r[h] ?? "";
                        const s = String(v).replaceAll('"', '""');
                        return `"${s}"`;
                      })
                      .join(",")
                  ),
                ].join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `person_${personal_code}_report.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className={`px-3 py-2 rounded cursor-pointer ${
                isLight
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              خروجی CSV
            </button>
          </div>
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              className={`p-3 rounded border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-200"
                  : "bg-gray-800 text-gray-100 border-gray-700"
              }`}
            >
              <div className="text-xs opacity-70">کد پرسنلی</div>
              <div className="text-base font-semibold">{personal_code}</div>
            </div>
            <div
              className={`p-3 rounded border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-200"
                  : "bg-gray-800 text-gray-100 border-gray-700"
              }`}
            >
              <div className="text-xs opacity-70">تعداد KPI</div>
              <div className="text-base font-semibold">{stats.count}</div>
            </div>
            <div
              className={`p-3 rounded border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-200"
                  : "bg-gray-800 text-gray-100 border-gray-700"
              }`}
            >
              <div className="text-xs opacity-70">میانگین درصد</div>
              <div className="text-base font-semibold">{stats.avgPct}%</div>
            </div>
            <div
              className={`p-3 rounded border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-200"
                  : "bg-gray-800 text-gray-100 border-gray-700"
              }`}
            >
              <div className="text-xs opacity-70">تایید شده</div>
              <div className="text-base font-semibold">{stats.confirmed}</div>
            </div>
          </div>

          {loading ? (
            <div className={isLight ? "text-gray-700" : "text-gray-300"}>
              در حال دریافت...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className={isLight ? "text-gray-700" : "text-gray-300"}>
              داده‌ای یافت نشد
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className={isLight ? "bg-gray-100" : "bg-gray-700"}>
                    <th className="px-2 py-2 text-center">ردیف</th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("kpi")}
                    >
                      KPI
                    </th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("quarter")}
                    >
                      Quarter
                    </th>
                    {/* <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("status")}
                    >
                      وضعیت
                    </th> */}
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("type")}
                    >
                      نوع
                    </th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("created")}
                    >
                      تاریخ
                    </th>
                    <th className="px-2 py-2 text-center">Target</th>
                    <th className="px-2 py-2 text-center">Weight</th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("ach")}
                    >
                      Achievement
                    </th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("pct")}
                    >
                      %
                    </th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("score")}
                    >
                      Score
                    </th>
                    <th className="px-2 py-2 text-center">ویرایش</th>
                  </tr>
                </thead>
                <tbody
                  className={
                    isLight
                      ? "divide-y divide-gray-200"
                      : "divide-y divide-gray-600"
                  }
                >
                  {tableRows.map((e, index) => (
                    <tr
                      key={e.id}
                      className={
                        isLight ? "hover:bg-gray-50" : "hover:bg-gray-700"
                      }
                    >
                      <td className="px-2 py-2 text-center">{index + 1}</td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() =>
                            navigate(
                              `/kpi/kpi/${encodeURIComponent(e.KPIFa || "")}`
                            )
                          }
                          className={
                            isLight
                              ? "hover:text-blue-700"
                              : "hover:text-blue-300"
                          }
                        >
                          {e.KPIFa}
                        </button>
                      </td>
                      {/* <td className="px-2 py-2 text-center">
                        {e.KPI_Info || ""}
                      </td> */}
                      <td className="px-2 py-2 text-center">
                        {getQuarter(e) || ""}
                      </td>
                      {/* <td className="px-2 py-2">{e.Status || ""}</td> */}
                      <td className="px-2 py-2 text-center">{e.Type || ""}</td>
                      <td className="px-2 py-2 text-center">
                        {formatDate(e.created_at)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {formatTarget(e.target)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {formatTarget(e.KPI_weight)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {formatTarget(e.KPI_Achievement)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {formatTarget(e.Percentage_Achievement)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {formatTarget(e.Score_Achievement)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={
                              selectedQuarter[e.id] || getQuarter(e) || "Q1"
                            }
                            onChange={(ev) =>
                              setSelectedQuarter((prev) => ({
                                ...prev,
                                [e.id]: ev.target.value,
                              }))
                            }
                            className={`px-2 py-1 rounded border text-xs ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                          >
                            <option value="Q1">Q1</option>
                            <option value="Q2">Q2</option>
                            <option value="Q3">Q3</option>
                          </select>
                          <input
                            type="number"
                            value={
                              editValues[e.id] ??
                              (() => {
                                const name = String(e.KPIFa || "");
                                const q =
                                  selectedQuarter[e.id] ||
                                  getQuarter(e) ||
                                  "Q1";
                                const agg = kpiQuarterAchievements.find(
                                  (it) => it.name === name
                                );
                                if (!agg) return e.KPI_Achievement ?? "";
                                if (q === "Q1") return agg.q1 ?? "";
                                if (q === "Q2") return agg.q2 ?? "";
                                return agg.q3 ?? "";
                              })()
                            }
                            onChange={(ev) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [e.id]: ev.target.value,
                              }))
                            }
                            className={`w-20 px-2 py-1 rounded border text-xs ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                          />
                          <button
                            onClick={async () => {
                              try {
                                setSavingRow(e.id);
                                const val = editValues[e.id] ?? "";
                                const name = String(e.KPIFa || "");
                                const q =
                                  selectedQuarter[e.id] ||
                                  getQuarter(e) ||
                                  "Q1";
                                const target = (kpiQuarterRows.get(name) || {})[
                                  q
                                ];
                                if (!target) {
                                  toast.error("رکورد کوارتر انتخابی یافت نشد");
                                  return;
                                }
                                await kpiApi.updateKPIEntryRow(target.id, {
                                  kpi_achievement: val,
                                });
                                setEntries((prev) =>
                                  prev.map((x) =>
                                    x.id === target.id
                                      ? { ...x, KPI_Achievement: val }
                                      : x
                                  )
                                );
                                toast.success("امتیاز ثبت شد");
                              } catch {
                                toast.error("ثبت امتیاز با خطا مواجه شد");
                              } finally {
                                setSavingRow(null);
                              }
                            }}
                            disabled={savingRow === e.id}
                            className={`px-3 py-1 rounded text-xs ${
                              isLight
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                          >
                            ثبت
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default KpiPersonReport;
