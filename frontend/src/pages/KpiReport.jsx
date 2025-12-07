import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import { kpiApi } from "../services/kpiApi";

function KpiReport() {
  const { kpiName } = useParams();
  const navigate = useNavigate();
  const safeDecode = (s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seasonFilter, setSeasonFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [departmanFilter, setDepartmanFilter] = useState("");
  const [personSearch, setPersonSearch] = useState("");

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
        const attempts = [
          {
            manager: managerName,
            category: "All",
            departman: managerDepartman,
            not_managed: false,
            outside_department: false,
          },
          {
            manager: managerName,
            category: "All",
            departman: managerDepartman,
            not_managed: true,
            outside_department: false,
          },
          {
            manager: "",
            category: "All",
            departman: managerDepartman,
            not_managed: false,
            outside_department: true,
          },
          {
            manager: managerName,
            category: "All",
            departman: "",
            not_managed: false,
            outside_department: true,
          },
        ];
        const results = await Promise.all(
          attempts.map((params) =>
            kpiApi
              .fetchSubordinateEntries(params)
              .then((resp) => resp)
              .catch(() => null)
          )
        );
        const taskMap = new Map();
        results.forEach((resp) => {
          const arr = Array.isArray(resp) ? resp : resp?.tasks || [];
          arr.forEach((t) => {
            const key = t.row ?? t.id;
            if (key == null) return;
            if (!taskMap.has(key)) taskMap.set(key, t);
          });
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
          .filter((t) => String(t.kpi_fa || "").trim() === safeDecode(kpiName))
          .map((t) => ({
            id: t.row,
            KPIFa: t.kpi_fa || "",
            KPI_Info: t.kpi_info || "",
            target: t.target || "",
            KPI_weight: t.kpi_weight || "",
            KPI_Achievement: t.kpi_achievement || "",
            Percentage_Achievement: t.score_achievement_alt || 0,
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
        toast.error("خطا در دریافت گزارش KPI");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [managerName, managerDepartman, kpiName, isManagement]);

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

  const uniqueDepartmans = useMemo(() => {
    const s = new Set();
    entries.forEach((e) => {
      if (e.departman && String(e.departman).trim() !== "")
        s.add(String(e.departman));
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
      if (departmanFilter && String(e.departman) !== String(departmanFilter))
        return false;
      if (
        personSearch &&
        !String(e.full_name || "")
          .toLowerCase()
          .includes(personSearch.toLowerCase()) &&
        !String(e.personal_code || "")
          .toLowerCase()
          .includes(personSearch.toLowerCase())
      )
        return false;
      return true;
    },
    [seasonFilter, statusFilter, typeFilter, departmanFilter, personSearch]
  );

  const filteredEntries = useMemo(
    () => entries.filter(matchesFilters),
    [
      entries,
      seasonFilter,
      statusFilter,
      typeFilter,
      departmanFilter,
      personSearch,
      matchesFilters,
    ]
  );

  const personEntryCounts = useMemo(() => {
    const m = new Map();
    filteredEntries.forEach((e) => {
      const key = String(e.personal_code);
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

  const personQuarterRows = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((e) => {
      const key = String(e.personal_code || "");
      const q = getQuarter(e);
      if (!key || !/^Q[1-3]$/.test(q)) return;
      const g = map.get(key) || {};
      g[q] = e;
      map.set(key, g);
    });
    return map;
  }, [filteredEntries, getQuarter]);

  const personQuarterAchievements = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((e) => {
      const key = String(e.personal_code || "");
      if (!key) return;
      const q = getQuarter(e);
      if (!/^Q[1-3]$/.test(q)) return;
      const dt = new Date(e.created_at || 0).getTime() || 0;
      const g = map.get(key) || {
        personal_code: e.personal_code,
        full_name: e.full_name,
        q1: null,
        q2: null,
        q3: null,
        _d1: 0,
        _d2: 0,
        _d3: 0,
      };
      if (q === "Q1" && dt >= g._d1) {
        g.q1 = e.KPI_Achievement;
        g._d1 = dt;
      }
      if (q === "Q2" && dt >= g._d2) {
        g.q2 = e.KPI_Achievement;
        g._d2 = dt;
      }
      if (q === "Q3" && dt >= g._d3) {
        g.q3 = e.KPI_Achievement;
        g._d3 = dt;
      }
      map.set(key, g);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    );
  }, [filteredEntries, getQuarter]);

  const stats = useMemo(() => {
    const count = filteredEntries.length;
    const peopleCount = new Set(filteredEntries.map((e) => e.personal_code))
      .size;
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
    return { count, peopleCount, avgPct, confirmed, seasons };
  }, [filteredEntries]);

  const isLight = document.documentElement.classList.contains("light");
  const [editValues, setEditValues] = useState({});
  const [savingRow, setSavingRow] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState({});
  const [sortBy, setSortBy] = useState("name");
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

  const personLastDate = useMemo(() => {
    const m = new Map();
    filteredEntries.forEach((e) => {
      const key = String(e.personal_code || "");
      const dt = new Date(e.created_at || 0).getTime() || 0;
      m.set(key, Math.max(m.get(key) || 0, dt));
    });
    return m;
  }, [filteredEntries]);

  const personDepartman = useMemo(() => {
    const m = new Map();
    filteredEntries.forEach((e) => {
      const key = String(e.personal_code || "");
      const dep = String(e.departman || "").trim();
      if (!key || !dep) return;
      const cur = m.get(key) || new Map();
      cur.set(dep, (cur.get(dep) || 0) + 1);
      m.set(key, cur);
    });
    const out = new Map();
    Array.from(m.entries()).forEach(([key, mm]) => {
      const best = Array.from(mm.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
      out.set(key, best || "");
    });
    return out;
  }, [filteredEntries]);

  const toggleSort = (key) => {
    setSortBy((prev) => (prev === key ? prev : key));
    setSortDir((prev) =>
      sortBy === key ? (prev === "asc" ? "desc" : "asc") : "desc"
    );
  };

  const tableRows = useMemo(() => {
    const rows = personQuarterAchievements.map((p) => ({
      personal_code: p.personal_code,
      full_name: p.full_name,
      q1: p.q1,
      q2: p.q2,
      q3: p.q3,
      entryCount: personEntryCounts.get(String(p.personal_code)) || 0,
      lastDate: personLastDate.get(String(p.personal_code)) || 0,
      departman: personDepartman.get(String(p.personal_code)) || "",
    }));
    const dir = sortDir === "asc" ? 1 : -1;
    const by = sortBy;
    rows.sort((a, b) => {
      if (by === "name")
        return dir * String(a.full_name).localeCompare(String(b.full_name));
      if (by === "code")
        return (
          dir * String(a.personal_code).localeCompare(String(b.personal_code))
        );
      if (by === "count")
        return dir * ((a.entryCount || 0) - (b.entryCount || 0));
      if (by === "q1") return dir * ((a.q1 || 0) - (b.q1 || 0));
      if (by === "q2") return dir * ((a.q2 || 0) - (b.q2 || 0));
      if (by === "q3") return dir * ((a.q3 || 0) - (b.q3 || 0));
      if (by === "last") return dir * ((a.lastDate || 0) - (b.lastDate || 0));
      return dir * String(a.full_name).localeCompare(String(b.full_name));
    });
    return rows;
  }, [
    personQuarterAchievements,
    personEntryCounts,
    personLastDate,
    personDepartman,
    sortBy,
    sortDir,
  ]);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"گزارش کامل KPI"} />
      <ToastContainer position="top-center" autoClose={1500} rtl={true} />
      <main className="w-full lg:px-8 mb-10 mt-10" dir="rtl">
        <div
          className={`w-full max-w-full mx-auto rounded-lg shadow p-4 ${
            isLight ? "bg-white" : "bg-gray-800"
          }`}
        >
          <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-2" dir="rtl">
            <input
              value={personSearch}
              onChange={(e) => setPersonSearch(e.target.value)}
              placeholder="جستجوی پرسنل / کد"
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
            <select
              value={departmanFilter}
              onChange={(e) => setDepartmanFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-300"
                  : "bg-gray-800 text-gray-200 border-gray-600"
              }`}
            >
              <option value="">همه دپارتمان‌ها</option>
              {uniqueDepartmans.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3 flex items-center gap-2" dir="rtl">
            <button
              onClick={() => navigate(-1)}
              className={`px-3 py-2 rounded ${
                isLight
                  ? "bg-gray-200 hover:bg-gray-300"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            >
              بازگشت
            </button>
            {/* <button
              onClick={() => navigate("/kpibulkassign")}
              className={`px-3 py-2 rounded cursor-pointer ${
                isLight
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-700 text-white hover:bg-blue-600"
              }`}
            >
              افزودن ردیف KPI
            </button>
            <button
              onClick={() =>
                navigate(
                  `/kpimanagerreview?kpi=${encodeURIComponent(
                    safeDecode(kpiName)
                  )}`
                )
              }
              className={`px-3 py-2 rounded ${
                isLight
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-purple-500 text-white hover:bg-purple-600"
              }`}
            >
              بازبینی مدیر
            </button> */}
            <button
              onClick={() => {
                setSeasonFilter("");
                setStatusFilter("");
                setTypeFilter("");
                setDepartmanFilter("");
                setPersonSearch("");
              }}
              className={`px-3 py-2 rounded ${
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
                  "full_name",
                  "personal_code",
                  "departman",
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
                a.download = `kpi_${safeDecode(kpiName)}_report.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className={`px-3 py-2 rounded ${
                isLight
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              خروجی CSV
            </button>
          </div>
          <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div
              className={`p-3 rounded border  ${
                isLight
                  ? "bg-white text-gray-900 border-gray-200"
                  : "bg-gray-800 text-gray-100 border-gray-700"
              }`}
            >
              <div className="text-xs opacity-70">نام KPI</div>
              <div className="text-base font-semibold break-words">
                {safeDecode(kpiName)}
              </div>
            </div>
            <div
              className={`p-3 rounded border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-200"
                  : "bg-gray-800 text-gray-100 border-gray-700"
              }`}
            >
              <div className="text-xs opacity-70">تعداد رکورد</div>
              <div className="text-base font-semibold">{stats.count}</div>
            </div>
            <div
              className={`p-3 rounded border ${
                isLight
                  ? "bg-white text-gray-900 border-gray-200"
                  : "bg-gray-800 text-gray-100 border-gray-700"
              }`}
            >
              <div className="text-xs opacity-70">تعداد افراد</div>
              <div className="text-base font-semibold">{stats.peopleCount}</div>
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
              <table className="w-full text-sm text-center">
                <thead className="sticky top-0 z-10 ">
                  <tr className={isLight ? "bg-gray-100 " : "bg-gray-700 "}>
                    <th className="px-2 py-2 text-center">ردیف</th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("name")}
                    >
                      نام
                    </th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("code")}
                    >
                      کد
                    </th>
                    <th className="px-2 py-2 text-center">دپارتمان</th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("q1")}
                    >
                      Q1
                    </th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("q2")}
                    >
                      Q2
                    </th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("q3")}
                    >
                      Q3
                    </th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("count")}
                    >
                      تعداد
                    </th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer"
                      onClick={() => toggleSort("last")}
                    >
                      آخرین بروز
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
                  {tableRows.map((row, index) => (
                    <tr
                      key={row.personal_code}
                      className={
                        isLight
                          ? "hover:bg-gray-50 text-center"
                          : "hover:bg-gray-700 text-center"
                      }
                    >
                      <td className="px-2 py-2 text-center">{index + 1}</td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() =>
                            navigate(`/kpi/person/${row.personal_code}`)
                          }
                          className={
                            isLight
                              ? "hover:text-blue-700"
                              : "hover:text-blue-300"
                          }
                        >
                          {row.full_name}
                        </button>
                      </td>
                      <td className="px-2 py-2">{row.personal_code}</td>
                      <td className="px-2 py-2">{row.departman || ""}</td>
                      <td className="px-2 py-2">
                        {row.q1 == null ? "-" : formatTarget(row.q1)}
                      </td>
                      <td className="px-2 py-2">
                        {row.q2 == null ? "-" : formatTarget(row.q2)}
                      </td>
                      <td className="px-2 py-2">
                        {row.q3 == null ? "-" : formatTarget(row.q3)}
                      </td>
                      <td className="px-2 py-2">{row.entryCount}</td>
                      <td className="px-2 py-2">
                        {row.lastDate ? formatDate(row.lastDate) : ""}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={selectedQuarter[row.personal_code] || "Q1"}
                            onChange={(ev) =>
                              setSelectedQuarter((prev) => ({
                                ...prev,
                                [row.personal_code]: ev.target.value,
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
                              editValues[row.personal_code] ??
                              (() => {
                                const q =
                                  selectedQuarter[row.personal_code] || "Q1";
                                if (q === "Q1") return row.q1 ?? "";
                                if (q === "Q2") return row.q2 ?? "";
                                return row.q3 ?? "";
                              })()
                            }
                            onChange={(ev) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [row.personal_code]: ev.target.value,
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
                                setSavingRow(row.personal_code);
                                const val = editValues[row.personal_code] ?? "";
                                const q =
                                  selectedQuarter[row.personal_code] || "Q1";
                                const target = (personQuarterRows.get(
                                  String(row.personal_code)
                                ) || {})[q];
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
                            disabled={savingRow === row.personal_code}
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

export default KpiReport;
