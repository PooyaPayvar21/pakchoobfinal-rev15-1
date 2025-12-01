import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import { kpiApi } from "../services/kpiApi";

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resp = await kpiApi.fetchSubordinateEntries({
          manager: managerName,
          category: "All",
          departman: managerDepartman,
          personal_code,
          not_managed: false,
          outside_department: false,
        });
        const tasks = Array.isArray(resp) ? resp : resp?.tasks || [];
        const mapped = tasks
          .filter((t) => String(t.personal_code) === String(personal_code))
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
      } catch (e) {
        toast.error("خطا در دریافت گزارش پرسنل");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [managerName, managerDepartman, personal_code]);

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
  const formatDate = (v) => {
    if (!v) return "";
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? String(v)
      : d.toLocaleDateString("fa-IR");
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"گزارش کامل پرسنل"} />
      <ToastContainer position="top-center" autoClose={1500} rtl={true} />
      <main className="w-full lg:px-8 mb-10 mt-10" dir="rtl">
        <div
          className={`w-full max-w-full mx-auto rounded-lg shadow p-4 cursor-pointer ${
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
              className={`px-3 py-2 rounded ${
                isLight
                  ? "bg-gray-200 hover:bg-gray-300"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            >
              بازگشت
            </button>
            <button
              onClick={() => {
                setSeasonFilter("");
                setStatusFilter("");
                setTypeFilter("");
                setKpiSearch("");
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
              className={`px-3 py-2 rounded ${
                isLight
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              خروجی CSV
            </button>
          </div>
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={isLight ? "text-gray-900" : "text-gray-100"}>
              کد پرسنلی: {personal_code}
            </div>
            <div className={isLight ? "text-gray-900" : "text-gray-100"}>
              تعداد KPI: {stats.count}
            </div>
            <div className={isLight ? "text-gray-900" : "text-gray-100"}>
              میانگین درصد: {stats.avgPct}%
            </div>
            <div className={isLight ? "text-gray-900" : "text-gray-100"}>
              تایید شده: {stats.confirmed}
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
            <ul className="divide-y divide-gray-300">
              {filteredEntries
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.created_at || 0) - new Date(a.created_at || 0)
                )
                .map((e) => (
                  <li key={e.id} className="py-3 px-2">
                    <div
                      className={isLight ? "text-gray-900" : "text-gray-100"}
                    >
                      <span>{e.KPIFa}</span>
                      <span
                        className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          isLight
                            ? "bg-gray-200 text-gray-700"
                            : "bg-gray-600 text-gray-200"
                        }`}
                      >
                        {kpiEntryCounts.get(String(e.KPIFa)) || 0}
                      </span>
                    </div>
                    <div
                      className={isLight ? "text-gray-600" : "text-gray-300"}
                    >
                      {e.KPI_Info}
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div
                        className={isLight ? "text-gray-700" : "text-gray-300"}
                      >
                        کوارتر: {e.season || ""}
                      </div>

                      <div
                        className={isLight ? "text-gray-700" : "text-gray-300"}
                      >
                        تاریخ: {formatDate(e.created_at)}
                      </div>
                      <div
                        className={isLight ? "text-gray-700" : "text-gray-300"}
                      >
                        امتیاز: {e.kpi_achievement}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export default KpiPersonReport;
