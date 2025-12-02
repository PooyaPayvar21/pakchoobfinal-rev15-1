import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import { kpiApi } from "../services/kpiApi";

const KpiPeopleWorks = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedKpi, setSelectedKpi] = useState("");
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
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [seasonFilter, setSeasonFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [kpiSearch, setKpiSearch] = useState("");
  const [bulkTarget, setBulkTarget] = useState("all");
  const [bulkUserCode, setBulkUserCode] = useState("");
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!managerName) {
        setLoadingEntries(false);
        return;
      }
      setLoadingEntries(true);
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
        const filteredByManager = tasks.filter((t) => {
          const dm = String(t.direct_management || "").trim();
          const mgr = String(t.manager || t.manager_name || "").trim();
          const fn = String(t.full_name || "").trim();
          const role = String(t.role || "").trim();
          if (dm && dm === managerFull) return true;
          if (mgr && mgr === managerFull) return true;
          if (fn === managerFull) return false;
          if (role && /مدیر/i.test(role)) return false;
          return true;
        });
        const mapped = filteredByManager.map((t) => ({
          id: t.row,
          row: t.row,
          obj_weight: t.obj_weight || "",
          KPIEn: t.kpi_en || "",
          KPIFa: fixText(t.kpi_fa || ""),
          KPI_Info: fixText(t.kpi_info || ""),
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
          personal_code: t.personal_code || "",
          full_name: fixText(t.full_name || ""),
          direct_management: t.direct_management || "",
          role: t.role || "",
          manager_name: t.manager || t.manager_name || "",
          created_at: t.created_at || t.createdAt || null,
          season: t.season || t.Season || null,
        }));
        setEntries(mapped);
      } catch {
        toast.error("خطا در دریافت داده ها");
      } finally {
        setLoadingEntries(false);
      }
    };
    fetchEntries();
  }, [managerName, managerDepartman]);

  const uniquePeople = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => {
      const key = `${e.personal_code}_${e.full_name}`;
      if (!map.has(key)) {
        map.set(key, {
          personal_code: e.personal_code,
          full_name: e.full_name,
        });
      }
    });
    return Array.from(map.values());
  }, [entries]);

  const personCounts = useMemo(() => {
    const counts = new Map();
    entries.forEach((e) => {
      const key = `${e.personal_code}_${e.full_name}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [entries]);

  const uniqueKpis = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => {
      if (e.KPIFa && e.KPIFa.trim() !== "") set.add(e.KPIFa);
    });
    return Array.from(set.values());
  }, [entries]);

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

  const normalizePersianChars = (s) =>
    String(s).replaceAll("ي", "ی").replaceAll("ك", "ک");

  const normalizeForSearch = (s) =>
    normalizePersianChars(String(s)).toLowerCase();

  const filteredPeople = useMemo(() => {
    const q = normalizeForSearch(search || "");
    return uniquePeople.filter((p) =>
      normalizeForSearch(p.full_name || "").includes(q)
    );
  }, [uniquePeople, search]);

  const personHistory = useMemo(() => {
    if (!selectedPerson) return [];
    return entries.filter(
      (e) =>
        e.personal_code === selectedPerson.personal_code &&
        e.full_name === selectedPerson.full_name
    );
  }, [entries, selectedPerson]);

  const kpiHistory = useMemo(() => {
    if (!selectedKpi) return [];
    return entries.filter((e) => e.KPIFa === selectedKpi);
  }, [entries, selectedKpi]);

  const matchesFilters = (e) => {
    if (seasonFilter && String(e.season) !== String(seasonFilter)) return false;
    if (statusFilter && String(e.Status) !== String(statusFilter)) return false;
    if (typeFilter && String(e.Type) !== String(typeFilter)) return false;
    if (
      kpiSearch &&
      !normalizeForSearch(e.KPIFa || "").includes(normalizeForSearch(kpiSearch))
    )
      return false;
    return true;
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(matchesFilters);
  }, [entries, seasonFilter, statusFilter, typeFilter, kpiSearch]);

  const visibleKpisWithCounts = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((e) => {
      const name = e.KPIFa;
      if (!name) return;
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [filteredEntries]);

  const handleSelectPerson = (p) => {
    navigate(`/kpi/person/${p.personal_code}`);
  };

  const handleSelectKpi = (name) => {
    navigate(`/kpi/kpi/${encodeURIComponent(name)}`);
  };

  const clearSelections = () => {
    setSelectedPerson(null);
    setSelectedKpi("");
  };

  const isLight = document.documentElement.classList.contains("light");

  const formatDate = (v) => {
    if (!v) return "";
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return String(v);
      return d.toLocaleDateString("fa-IR");
    } catch {
      return String(v);
    }
  };

  const seasonOf = (v) => {
    if (!v) return "نامشخص";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "نامشخص";
    const m = d.getMonth() + 1;
    const q = Math.ceil(m / 3);
    return `فصل ${q}`;
  };

  const displaySeason = (season, created) => {
    const s = (season || "").toString().trim();
    if (s) return s;
    return seasonOf(created);
  };

  const looksMojibake = (s) => /[ØÙÛÂÃ±]/.test(String(s));

  const fixText = (s) => {
    if (s == null) return "";
    const str = String(s);
    if (!looksMojibake(str)) return normalizePersianChars(str);
    try {
      const bytes = new Uint8Array(Array.from(str, (ch) => ch.charCodeAt(0)));
      const decoded = new TextDecoder("utf-8").decode(bytes);
      return normalizePersianChars(decoded);
    } catch {
      return normalizePersianChars(str);
    }
  };

  const handleBulkAddKpiRows = async () => {
    try {
      const targets =
        bulkTarget === "all"
          ? uniquePeople
          : uniquePeople.filter(
              (p) => String(p.personal_code) === String(bulkUserCode)
            );

      if (targets.length === 0) {
        toast.error("کاربری برای افزودن یافت نشد");
        return;
      }

      setIsBulkAdding(true);
      const results = await Promise.allSettled(
        targets.map((p) => {
          const base = entries.find(
            (e) => String(e.personal_code) === String(p.personal_code)
          );
          const payload = {
            personal_code: p.personal_code,
            full_name: p.full_name || "",
            company_name: "",
            role: base?.role || "",
            direct_management: base?.direct_management || managerName || "",
            departman: managerDepartman || "",
            category: "All",
            tasks: [
              {
                obj_weight: "",
                KPIEn: "",
                KPIFa: "",
                KPI_Info: "",
                target: "",
                KPI_weight: "",
                KPI_Achievement: "",
                Percentage_Achievement: "",
                Score_Achievement: "",
                Type: "Editable",
                Sum: "",
              },
            ],
          };
          return kpiApi.submitKPIEntry(payload);
        })
      );

      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failureCount = results.length - successCount;

      if (successCount > 0)
        toast.success(`افزودن برای ${successCount} نفر انجام شد`);
      if (failureCount > 0)
        toast.error(`افزودن برای ${failureCount} نفر ناموفق بود`);
    } catch {
      toast.error("خطا در افزودن ردیف KPI");
    } finally {
      setIsBulkAdding(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"پرسنل و KPI ها"} />
      <ToastContainer position="top-center" autoClose={1500} rtl={true} />
      <main className="w-full lg:px-8 mb-10 mt-10" dir="rtl">
        <div
          className={`w-full max-w-full mx-auto rounded-lg shadow p-4 ${
            isLight ? "bg-white" : "bg-gray-800"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className={`rounded-lg border p-4 ${
                isLight
                  ? "bg-gray-100 border-gray-200"
                  : "bg-gray-700 border-gray-600"
              }`}
              dir="rtl"
            >
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی پرسنل"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-800 text-gray-200 border-gray-600"
                  }`}
                />
              </div>
              <div className="mb-3 flex items-center gap-2" dir="rtl">
                <button
                  onClick={() => navigate("/kpimanagerreview")}
                  className={`px-3 py-2 rounded cursor-pointer ${
                    isLight
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-green-700 text-white hover:bg-green-600"
                  }`}
                >
                  ایجاد KPI / ثبت کار
                </button>
                <button
                  onClick={() => navigate("/kpipersonentry")}
                  className={`px-3 py-2 rounded cursor-pointer ${
                    isLight
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-indigo-700 text-white hover:bg-indigo-600"
                  }`}
                >
                  ثبت پرسنل KPI
                </button>
              </div>
              {loadingEntries ? (
                <div className={isLight ? "text-gray-700" : "text-gray-300"}>
                  در حال دریافت لیست...
                </div>
              ) : (
                <ul className="divide-y divide-gray-300">
                  {filteredPeople.map((p) => (
                    <li
                      key={(p.personal_code || "") + p.full_name}
                      className="py-2"
                    >
                      <button
                        onClick={() => handleSelectPerson(p)}
                        className={`w-full text-right px-3 py-2 rounded-lg cursor-pointer ${
                          selectedPerson?.full_name === p.full_name
                            ? "bg-blue-600 text-white"
                            : isLight
                            ? "hover:bg-gray-200"
                            : "hover:bg-gray-600"
                        }`}
                      >
                        <span>{p.full_name}</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded text-xs ${
                            isLight
                              ? "bg-gray-200 text-gray-700"
                              : "bg-gray-600 text-gray-200"
                          }`}
                        >
                          {personCounts.get(
                            `${p.personal_code}_${p.full_name}`
                          ) || 0}
                        </span>
                      </button>
                    </li>
                  ))}
                  {filteredPeople.length === 0 && (
                    <li className={isLight ? "text-gray-700" : "text-gray-300"}>
                      پرسنلی یافت نشد
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div
              className={`rounded-lg border p-4 ${
                isLight
                  ? "bg-gray-100 border-gray-200"
                  : "bg-gray-700 border-gray-600"
              }`}
              dir="rtl"
            >
              <div
                className={`mb-3 flex items-center justify-between ${
                  isLight ? "text-gray-900" : "text-gray-200"
                }`}
              >
                <span>
                  {!selectedPerson &&
                    !selectedKpi &&
                    "KPI های ثبت شده تا امروز"}
                  {selectedPerson && `سوابق ${selectedPerson.full_name}`}
                  {selectedKpi && `سوابق KPI: ${selectedKpi}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/kpibulkassign")}
                    className={`px-3 py-2 rounded cursor-pointer ${
                      isLight
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-700 text-white hover:bg-blue-600"
                    }`}
                  >
                    افزودن ردیف KPI
                  </button>
                </div>
                {(selectedPerson || selectedKpi) && (
                  <button
                    onClick={clearSelections}
                    className={`px-3 py-1 rounded ${
                      isLight
                        ? "bg-gray-200 hover:bg-gray-300"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                  >
                    نمایش همه KPI
                  </button>
                )}
              </div>
              <div
                className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2"
                dir="rtl"
              >
                <input
                  value={kpiSearch}
                  onChange={(e) => setKpiSearch(e.target.value)}
                  placeholder="جستجوی KPI"
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
              {loadingEntries ? (
                <div className={isLight ? "text-gray-700" : "text-gray-300"}>
                  در حال دریافت KPI ها...
                </div>
              ) : (
                <>
                  {!selectedPerson && !selectedKpi && (
                    <ul className="divide-y divide-gray-300">
                      {visibleKpisWithCounts.map(({ name, count }) => (
                        <li key={name} className="py-2">
                          <button
                            onClick={() => handleSelectKpi(name)}
                            className={`w-full text-right px-3 py-2 rounded-lg cursor-pointer ${
                              isLight
                                ? "hover:bg-gray-200"
                                : "hover:bg-gray-600"
                            }`}
                          >
                            <span>{name}</span>
                            <span
                              className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                isLight
                                  ? "bg-gray-200 text-gray-700"
                                  : "bg-gray-600 text-gray-200"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        </li>
                      ))}
                      {visibleKpisWithCounts.length === 0 && (
                        <li
                          className={
                            isLight ? "text-gray-700" : "text-gray-300"
                          }
                        >
                          KPI ای ثبت نشده است
                        </li>
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KpiPeopleWorks;
