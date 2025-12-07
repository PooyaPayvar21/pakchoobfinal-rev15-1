import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import { kpiApi } from "../services/kpiApi";

function normalizePersianChars(s) {
  return String(s).replaceAll("ي", "ی").replaceAll("ك", "ک");
}

function looksMojibake(s) {
  return /[ØÙÛÂÃ±]/.test(String(s));
}

function fixText(s) {
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
}

function normalizePercent(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

const KpiPeopleWorks = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [deptPeople, setDeptPeople] = useState([]);
  const [seasonFilter, setSeasonFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [kpiSearch, setKpiSearch] = useState("");
  const [bulkTarget, setBulkTarget] = useState("all");
  const [bulkUserCode, setBulkUserCode] = useState("");
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [personSort, setPersonSort] = useState("name");
  const [kpiSort, setKpiSort] = useState("count");
  const userType = useMemo(() => localStorage.getItem("user_type") || "", []);
  const [peoplePage, setPeoplePage] = useState(1);
  const [kpiPage, setKpiPage] = useState(1);
  const PEOPLE_PAGE_SIZE = 15;
  const KPI_PAGE_SIZE = 20;
  const departmanFilter = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get("departman") || "";
    } catch {
      return "";
    }
  }, [location.search]);

  const headerTitle = useMemo(() => {
    const d = String(departmanFilter || "").trim();
    return d ? `پرسنل و KPI ها - ${d}` : "پرسنل و KPI ها";
  }, [departmanFilter]);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!managerName && userType !== "ceo") {
        console.log(
          "[KpiPeopleWorks] No managerName and not CEO; proceeding with fallbacks",
          {
            userType,
          }
        );
      }
      console.log("[KpiPeopleWorks] Fetching entries", {
        managerName,
        managerDepartman,
        userType,
        username: localStorage.getItem("username") || "",
      });
      setLoadingEntries(true);
      try {
        // Always fetch department personnel list when a departman filter is present
        if ((departmanFilter || "").trim()) {
          try {
            const people = await kpiApi.fetchPersonelByDepartman(
              departmanFilter
            );
            setDeptPeople(
              Array.isArray(people)
                ? people.map((p) => ({
                    personal_code: String(p.personal_code || ""),
                    full_name: String(p.full_name || ""),
                  }))
                : []
            );
          } catch {
            setDeptPeople([]);
          }
        } else {
          setDeptPeople([]);
        }

        let mergedTasks = [];
        if (userType === "ceo") {
          const resp = await kpiApi.fetchSubordinateEntries({
            manager: managerName || "CEO",
            category: "All",
            departman: departmanFilter || "",
            not_managed: false,
            outside_department: false,
          });
          mergedTasks = Array.isArray(resp) ? resp : resp?.tasks || [];
        } else {
          const managerCandidates = [];
          if (managerName) managerCandidates.push(managerName);
          const uname = localStorage.getItem("username") || "";
          if (uname) managerCandidates.push(uname);

          try {
            const opts = await kpiApi.fetchKPIEntryOptions();
            const dms = opts.direct_managements || [];
            const norm = (s) =>
              normalizePersianChars(String(s || ""))
                .trim()
                .replace(/\s+/g, " ")
                .toLowerCase();
            const nameNorm = norm(managerName);
            const nameParts = nameNorm.split(" ").filter((w) => w.length >= 3);
            const dmMatches = dms.filter((dm) => {
              const dmNorm = norm(dm);
              if (nameNorm && dmNorm === nameNorm) return true;
              const hits = nameParts.filter((w) => dmNorm.includes(w)).length;
              return hits >= Math.max(1, Math.floor(nameParts.length / 2));
            });
            dmMatches.forEach((m) => managerCandidates.push(m));
          } catch {
            void 0;
          }

          const attempts = [];
          for (const m of managerCandidates) {
            attempts.push({
              manager: m,
              category: "All",
              departman: managerDepartman,
              not_managed: false,
              outside_department: false,
            });
            attempts.push({
              manager: m,
              category: "All",
              departman: managerDepartman,
              not_managed: true,
              outside_department: false,
            });
            attempts.push({
              manager: m,
              category: "All",
              departman: "",
              not_managed: false,
              outside_department: false,
            });
          }
          if ((managerDepartman || "").trim()) {
            attempts.push({
              manager: managerName || uname || "",
              category: "All",
              departman: managerDepartman,
              not_managed: false,
              outside_department: true,
            });
          }

          const results = await Promise.all(
            attempts.map((p) =>
              kpiApi
                .fetchSubordinateEntries(p)
                .then((resp) => resp)
                .catch(() => null)
            )
          );
          const map = new Map();
          results.forEach((resp) => {
            const arr = Array.isArray(resp) ? resp : resp?.tasks || [];
            arr.forEach((t) => {
              const key = t.row ?? t.id;
              if (key == null) return;
              if (!map.has(key)) map.set(key, t);
            });
          });
          mergedTasks = Array.from(map.values());
        }

        let arr = mergedTasks;
        if ((departmanFilter || "").trim()) {
          const df = (departmanFilter || "").trim();
          arr = arr.filter((t) => String(t?.departman || "").trim() === df);
        }
        const managerFull = fixText(managerName || "").trim();
        const filteredByManager = arr.filter((t) => {
          const dm = fixText(t.direct_management || "").trim();
          const mgr = fixText(t.manager || t.manager_name || "").trim();
          const fn = fixText(t.full_name || "").trim();
          const role = fixText(t.role || "").trim();
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
          personal_code: t.personal_code || "",
          full_name: fixText(t.full_name || ""),
          direct_management: t.direct_management || "",
          role: t.role || "",
          manager_name: t.manager || t.manager_name || "",
          created_at: t.created_at || t.createdAt || null,
          season: t.season || t.Season || null,
          departman: t.departman || "",
        }));
        console.log("[KpiPeopleWorks] Mapped entries", mapped.length);
        setEntries(mapped);
      } catch {
        toast.error("خطا در دریافت داده ها");
      } finally {
        setLoadingEntries(false);
      }
    };
    fetchEntries();
  }, [managerName, managerDepartman, userType, departmanFilter]);

  useEffect(() => {
    console.log("[KpiPeopleWorks] entries updated", entries.length);
  }, [entries]);

  const uniquePeople = useMemo(() => {
    // If department personnel list is present (from KPIPersonel), prefer it
    if (Array.isArray(deptPeople) && deptPeople.length > 0) {
      return deptPeople;
    }
    const map = new Map();
    entries.forEach((e) => {
      const code = String(e.personal_code || "").trim();
      const nameNorm = normalizePersianChars(String(e.full_name || ""))
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
      if (!nameNorm) return;
      const existing = map.get(nameNorm);
      if (!existing) {
        map.set(nameNorm, {
          personal_code: code,
          full_name: e.full_name || "",
        });
      } else if (!existing.personal_code && code) {
        map.set(nameNorm, {
          personal_code: code,
          full_name: existing.full_name,
        });
      }
    });
    return Array.from(map.values());
  }, [entries, deptPeople]);

  const deptPersonCodes = useMemo(() => {
    const s = new Set();
    deptPeople.forEach((p) => {
      const code = String(p.personal_code || "").trim();
      if (code) s.add(code);
    });
    return s;
  }, [deptPeople]);

  useEffect(() => {
    console.log("[KpiPeopleWorks] uniquePeople", uniquePeople.length);
    console.log(
      "[KpiPeopleWorks] uniquePeople sample",
      uniquePeople.slice(0, 10)
    );
  }, [uniquePeople]);

  const personCounts = useMemo(() => {
    const counts = new Map();
    entries.forEach((e) => {
      const codeKey = String(e.personal_code || "").trim();
      const nameKey = normalizePersianChars(String(e.full_name || ""))
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
      const key = codeKey || nameKey;
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [entries]);

  useEffect(() => {
    console.log("[KpiPeopleWorks] personCounts size", personCounts.size);
    console.log(
      "[KpiPeopleWorks] personCounts sample",
      Array.from(personCounts.entries()).slice(0, 10)
    );
  }, [personCounts]);

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

  const normalizeForSearch = (s) =>
    normalizePersianChars(String(s)).toLowerCase();
  const normalizeKeyText = (s) =>
    normalizePersianChars(String(s)).trim().replace(/\s+/g, " ").toLowerCase();

  const getQuarter = (e) => {
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
  };

  const entryValue = (e) => {
    let v = Number(e.Sum);
    if (Number.isNaN(v) || v === 0) v = Number(e.Percentage_Achievement);
    if (Number.isNaN(v)) v = 0;
    return Math.round(v);
  };

  const filteredPeople = useMemo(() => {
    const q = normalizeForSearch(search || "");
    return uniquePeople.filter((p) =>
      normalizeForSearch(p.full_name || "").includes(q)
    );
  }, [uniquePeople, search]);

  useEffect(() => {
    console.log("[KpiPeopleWorks] filteredPeople", filteredPeople.length);
  }, [filteredPeople]);

  const totalPeoplePages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredPeople.length / PEOPLE_PAGE_SIZE));
  }, [filteredPeople]);

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

  useEffect(() => {
    console.log("[KpiPeopleWorks] filteredEntries", filteredEntries.length);
    console.log(
      "[KpiPeopleWorks] filteredEntries sample",
      filteredEntries.slice(0, 10).map((e) => ({
        full_name: e.full_name,
        personal_code: e.personal_code,
        KPIFa: e.KPIFa,
        direct_management: e.direct_management,
      }))
    );
  }, [filteredEntries]);

  const personCountFor = useCallback(
    (p) => {
      const codeKey = String(p.personal_code || "").trim();
      const nameKey = normalizeKeyText(p.full_name || "");
      const key = codeKey || nameKey;
      return personCounts.get(key) || 0;
    },
    [personCounts]
  );

  const personQuarterTotals = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((e) => {
      const codeKey = String(e.personal_code || "").trim();
      const nameKey = normalizeKeyText(e.full_name || "");
      const key = codeKey || nameKey;
      if (!key) return;
      const q = getQuarter(e);
      if (!/^Q[1-4]$/.test(q)) return;
      const cur = map.get(key) || { q1: 0, q2: 0, q3: 0, q4: 0 };
      const val = entryValue(e);
      if (q === "Q1") cur.q1 += val;
      else if (q === "Q2") cur.q2 += val;
      else if (q === "Q3") cur.q3 += val;
      else if (q === "Q4") cur.q4 += val;
      map.set(key, cur);
    });
    return map;
  }, [filteredEntries]);

  const personStatusCounts = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((e) => {
      const codeKey = String(e.personal_code || "").trim();
      const nameKey = normalizeKeyText(e.full_name || "");
      const key = codeKey || nameKey;
      if (!key) return;
      const cur = map.get(key) || { confirmed: 0, editable: 0, other: 0 };
      const st = String(e.Status || "").trim();
      const tp = String(e.Type || "").trim();
      if (st === "Confirmed") cur.confirmed += 1;
      else if (st === "Editable" || tp === "" || tp === "Editable")
        cur.editable += 1;
      else cur.other += 1;
      map.set(key, cur);
    });
    return map;
  }, [filteredEntries]);

  const sortedPeople = useMemo(() => {
    const arr = [...filteredPeople];
    const getTotals = (name) => {
      const key = normalizeKeyText(name || "");
      const t = personQuarterTotals.get(key) || { q1: 0, q2: 0, q3: 0, q4: 0 };
      return {
        ...t,
        total: (t.q1 || 0) + (t.q2 || 0) + (t.q3 || 0) + (t.q4 || 0),
      };
    };
    if (personSort === "name") {
      arr.sort((a, b) =>
        String(a.full_name || "").localeCompare(String(b.full_name || ""))
      );
    } else if (personSort === "count") {
      arr.sort((a, b) => personCountFor(b) - personCountFor(a));
    } else if (
      personSort === "q1" ||
      personSort === "q2" ||
      personSort === "q3" ||
      personSort === "q4" ||
      personSort === "total"
    ) {
      arr.sort((a, b) => {
        const ta = getTotals(a.full_name);
        const tb = getTotals(b.full_name);
        return (tb[personSort] || 0) - (ta[personSort] || 0);
      });
    }
    return arr;
  }, [filteredPeople, personSort, personQuarterTotals, personCountFor]);
  const peoplePageItems = useMemo(() => {
    const start = (peoplePage - 1) * PEOPLE_PAGE_SIZE;
    return sortedPeople.slice(start, start + PEOPLE_PAGE_SIZE);
  }, [sortedPeople, peoplePage]);

  useEffect(() => {
    setPeoplePage(1);
  }, [search, entries]);
  useEffect(() => {
    setKpiPage(1);
  }, [kpiSearch, seasonFilter, statusFilter, typeFilter, entries]);

  const visibleKpisWithCounts = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((e) => {
      const name = e.KPIFa;
      if (!name) return;
      const q = getQuarter(e);
      const val = entryValue(e);
      const cur = map.get(name) || {
        name,
        count: 0,
        en: "",
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0,
      };
      cur.count += 1;
      if (!cur.en && e.KPIEn) cur.en = e.KPIEn;
      if (q === "Q1") cur.q1 += val;
      else if (q === "Q2") cur.q2 += val;
      else if (q === "Q3") cur.q3 += val;
      else if (q === "Q4") cur.q4 += val;
      map.set(name, cur);
    });
    return Array.from(map.values()).sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    );
  }, [filteredEntries]);

  useEffect(() => {
    console.log(
      "[KpiPeopleWorks] visibleKpisWithCounts",
      visibleKpisWithCounts.length
    );
  }, [visibleKpisWithCounts]);

  const totalKpiPages = useMemo(() => {
    return Math.max(1, Math.ceil(visibleKpisWithCounts.length / KPI_PAGE_SIZE));
  }, [visibleKpisWithCounts]);
  const kpiPageItems = useMemo(() => {
    const start = (kpiPage - 1) * KPI_PAGE_SIZE;
    const arr = [...visibleKpisWithCounts];
    arr.sort((a, b) => {
      if (kpiSort === "name")
        return String(a.name).localeCompare(String(b.name));
      if (kpiSort === "count") return b.count - a.count;
      if (kpiSort === "q1") return (b.q1 || 0) - (a.q1 || 0);
      if (kpiSort === "q2") return (b.q2 || 0) - (a.q2 || 0);
      if (kpiSort === "q3") return (b.q3 || 0) - (a.q3 || 0);
      if (kpiSort === "q4") return (b.q4 || 0) - (a.q4 || 0);
      if (kpiSort === "total")
        return (
          (b.q1 || 0) +
          (b.q2 || 0) +
          (b.q3 || 0) +
          (b.q4 || 0) -
          ((a.q1 || 0) + (a.q2 || 0) + (a.q3 || 0) + (a.q4 || 0))
        );
      return b.count - a.count;
    });
    return arr.slice(start, start + KPI_PAGE_SIZE);
  }, [visibleKpisWithCounts, kpiPage, kpiSort]);

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
      <Header title={headerTitle} />
      <ToastContainer position="top-center" autoClose={1500} rtl={true} />
      <main className="w-full lg:px-8 mb-10 mt-10" dir="rtl">
        <div
          className={`w-full max-w-full mx-auto rounded-lg shadow p-4 ${
            isLight ? "bg-white" : "bg-gray-800"
          }`}
        >
          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div
              className={`${
                isLight ? "bg-gray-100" : "bg-gray-700"
              } rounded p-3 text-center`}
            >
              <div className={`${isLight ? "text-gray-600" : "text-gray-300"}`}>
                تعداد پرسنل
              </div>
              <div className="text-xl font-bold">{filteredPeople.length}</div>
            </div>
            <div
              className={`${
                isLight ? "bg-gray-100" : "bg-gray-700"
              } rounded p-3 text-center`}
            >
              <div className={`${isLight ? "text-gray-600" : "text-gray-300"}`}>
                تعداد KPI یکتا
              </div>
              <div className="text-xl font-bold">{uniqueKpis.length}</div>
            </div>
            <div
              className={`${
                isLight ? "bg-gray-100" : "bg-gray-700"
              } rounded p-3 text-center`}
            >
              <div className={`${isLight ? "text-gray-600" : "text-gray-300"}`}>
                کل آیتم‌ها
              </div>
              <div className="text-xl font-bold">{filteredEntries.length}</div>
            </div>
            <div
              className={`${
                isLight ? "bg-gray-100" : "bg-gray-700"
              } rounded p-3 text-center`}
            >
              <div className={`${isLight ? "text-gray-600" : "text-gray-300"}`}>
                تایید شده
              </div>
              <div className="text-xl font-bold">
                {
                  filteredEntries.filter(
                    (e) => String(e.Status).trim() === "Confirmed"
                  ).length
                }
              </div>
            </div>
          </div> */}
          <button
            onClick={() => navigate("/kpidashboard")}
            className={`px-3 py-2 mb-3 rounded cursor-pointer ${
              isLight
                ? "bg-gray-200 hover:bg-gray-300"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          >
            بازگشت
          </button>
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
                <select
                  value={personSort}
                  onChange={(e) => setPersonSort(e.target.value)}
                  className={`px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-800 text-gray-200 border-gray-600"
                  }`}
                >
                  <option value="name">مرتب‌سازی: نام</option>
                  <option value="count">مرتب‌سازی: تعداد آیتم</option>
                  <option value="total">مرتب‌سازی: مجموع فصل‌ها</option>
                  <option value="q1">مرتب‌سازی: Q1</option>
                  <option value="q2">مرتب‌سازی: Q2</option>
                  <option value="q3">مرتب‌سازی: Q3</option>
                  <option value="q4">مرتب‌سازی: Q4</option>
                </select>
              </div>
              {/* <div className="mb-3 flex items-center gap-2" dir="rtl">
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
              </div> */}
              {loadingEntries ? (
                <div className={isLight ? "text-gray-700" : "text-gray-300"}>
                  در حال دریافت لیست...
                </div>
              ) : (
                <ul className="divide-y divide-gray-300">
                  {peoplePageItems.map((p) => (
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
                          className={`mr-2 text-xs ${
                            isLight ? "text-gray-600" : "text-gray-300"
                          }`}
                        >
                          {String(p.personal_code || "")}
                        </span>
                        {(() => {
                          const codeKey = String(p.personal_code || "").trim();
                          const nameKey = normalizeKeyText(p.full_name || "");
                          const key = codeKey || nameKey;
                          const t = personQuarterTotals.get(key) || {
                            q1: 0,
                            q2: 0,
                            q3: 0,
                            q4: 0,
                          };
                          return (
                            <span className="mr-2 inline-flex gap-3 items-center">
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  isLight
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-gray-600 text-gray-200"
                                }`}
                              >
                                Q1: {t.q1}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  isLight
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-gray-600 text-gray-200"
                                }`}
                              >
                                Q2: {t.q2}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  isLight
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-gray-600 text-gray-200"
                                }`}
                              >
                                Q3: {t.q3}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  isLight
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-gray-600 text-gray-200"
                                }`}
                              >
                                Q4: {t.q4}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  isLight
                                    ? "bg-green-200 text-green-800"
                                    : "bg-green-700 text-green-200"
                                }`}
                              >
                                {personCountFor(p)} آیتم
                              </span>
                              {/* {(() => {
                                const s = personStatusCounts.get(key) || {
                                  confirmed: 0,
                                  editable: 0,
                                  other: 0,
                                };
                                return (
                                  <>
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs ${
                                        isLight
                                          ? "bg-emerald-200 text-emerald-800"
                                          : "bg-emerald-700 text-emerald-200"
                                      }`}
                                    >
                                      تایید: {s.confirmed}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs ${
                                        isLight
                                          ? "bg-yellow-200 text-yellow-800"
                                          : "bg-yellow-700 text-yellow-200"
                                      }`}
                                    >
                                      قابل‌ویرایش: {s.editable}
                                    </span>
                                  </>
                                );
                              })()} */}
                            </span>
                          );
                        })()}
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
              {!loadingEntries && filteredPeople.length > 0 && (
                <div className="mt-3 flex items-center justify-between">
                  <span className={isLight ? "text-gray-700" : "text-gray-300"}>
                    صفحه {peoplePage} از {totalPeoplePages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPeoplePage(Math.max(1, peoplePage - 1))}
                      disabled={peoplePage === 1}
                      className={`px-3 py-1 rounded ${
                        isLight
                          ? "bg-gray-200 text-gray-800 disabled:opacity-50"
                          : "bg-gray-600 text-gray-200 disabled:opacity-50"
                      }`}
                    >
                      قبلی
                    </button>
                    <button
                      onClick={() =>
                        setPeoplePage(
                          Math.min(totalPeoplePages, peoplePage + 1)
                        )
                      }
                      disabled={peoplePage >= totalPeoplePages}
                      className={`px-3 py-1 rounded ${
                        isLight
                          ? "bg-gray-200 text-gray-800 disabled:opacity-50"
                          : "bg-gray-600 text-gray-200 disabled:opacity-50"
                      }`}
                    >
                      بعدی
                    </button>
                  </div>
                </div>
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
                    onClick={() =>
                      navigate(
                        `/kpibulkassign${
                          String(departmanFilter || "").trim()
                            ? `?departman=${encodeURIComponent(
                                String(departmanFilter || "")
                              )}`
                            : ""
                        }`
                      )
                    }
                    className={`px-3 py-2 rounded cursor-pointer ${
                      isLight
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-700 text-white hover:bg-blue-600"
                    }`}
                  >
                    افزودن KPI
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
                <select
                  value={kpiSort}
                  onChange={(e) => setKpiSort(e.target.value)}
                  className={`px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-800 text-gray-200 border-gray-600"
                  }`}
                >
                  <option value="count">مرتب‌سازی: تعداد</option>
                  <option value="name">مرتب‌سازی: نام</option>
                  <option value="total">مرتب‌سازی: مجموع فصل‌ها</option>
                  <option value="q1">مرتب‌سازی: Q1</option>
                  <option value="q2">مرتب‌سازی: Q2</option>
                  <option value="q3">مرتب‌سازی: Q3</option>
                  <option value="q4">مرتب‌سازی: Q4</option>
                </select>
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
                {/* <select
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
                </select> */}
                {/* <select
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
                </select> */}
              </div>
              {/* <div className="mb-4 flex items-center gap-2">
                <select
                  value={bulkTarget}
                  onChange={(e) => setBulkTarget(e.target.value)}
                  className={`px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-800 text-gray-200 border-gray-600"
                  }`}
                >
                  <option value="all">افزودن برای همه</option>
                  <option value="user">افزودن برای یک کاربر</option>
                </select>
                {bulkTarget === "user" && (
                  <select
                    value={bulkUserCode}
                    onChange={(e) => setBulkUserCode(e.target.value)}
                    className={`px-3 py-2 rounded-lg border ${
                      isLight
                        ? "bg-white text-gray-900 border-gray-300"
                        : "bg-gray-800 text-gray-200 border-gray-600"
                    }`}
                  >
                    <option value="">انتخاب کاربر</option>
                    {uniquePeople.map((p) => (
                      <option
                        key={String(p.personal_code || "") + p.full_name}
                        value={String(p.personal_code || "")}
                      >
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={handleBulkAddKpiRows}
                  disabled={
                    isBulkAdding || (bulkTarget === "user" && !bulkUserCode)
                  }
                  className={`px-3 py-2 rounded cursor-pointer ${
                    isLight
                      ? "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      : "bg-green-700 text-white hover:bg-green-600 disabled:opacity-50"
                  }`}
                >
                  {isBulkAdding ? "در حال افزودن..." : "افزودن خودکار ردیف"}
                </button>
              </div> */}
              {loadingEntries ? (
                <div className={isLight ? "text-gray-700" : "text-gray-300"}>
                  در حال دریافت KPI ها...
                </div>
              ) : (
                <>
                  {!selectedPerson && !selectedKpi && (
                    <ul className="divide-y divide-gray-300">
                      {kpiPageItems.map(
                        ({ name, count, en, q1, q2, q3, q4 }) => (
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
                              {en && (
                                <span
                                  className={`mr-2 text-xs ${
                                    isLight ? "text-gray-600" : "text-gray-300"
                                  }`}
                                >
                                  {en}
                                </span>
                              )}
                              <span className="mr-2 inline-flex gap-3 items-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    isLight
                                      ? "bg-gray-200 text-gray-700"
                                      : "bg-gray-600 text-gray-200"
                                  }`}
                                >
                                  Q1: {q1 || 0}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    isLight
                                      ? "bg-gray-200 text-gray-700"
                                      : "bg-gray-600 text-gray-200"
                                  }`}
                                >
                                  Q2: {q2 || 0}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    isLight
                                      ? "bg-gray-200 text-gray-700"
                                      : "bg-gray-600 text-gray-200"
                                  }`}
                                >
                                  Q3: {q3 || 0}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    isLight
                                      ? "bg-gray-200 text-gray-700"
                                      : "bg-gray-600 text-gray-200"
                                  }`}
                                >
                                  Q4: {q4 || 0}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    isLight
                                      ? "bg-indigo-200 text-indigo-800"
                                      : "bg-indigo-700 text-indigo-200"
                                  }`}
                                >
                                  {count} پرسنل
                                </span>
                              </span>
                            </button>
                          </li>
                        )
                      )}
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
                  {!selectedPerson &&
                    !selectedKpi &&
                    visibleKpisWithCounts.length > 0 && (
                      <div className="mt-3 flex items-center justify-between">
                        <span
                          className={
                            isLight ? "text-gray-700" : "text-gray-300"
                          }
                        >
                          صفحه {kpiPage} از {totalKpiPages}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setKpiPage(Math.max(1, kpiPage - 1))}
                            disabled={kpiPage === 1}
                            className={`px-3 py-1 rounded ${
                              isLight
                                ? "bg-gray-200 text-gray-800 disabled:opacity-50"
                                : "bg-gray-600 text-gray-200 disabled:opacity-50"
                            }`}
                          >
                            قبلی
                          </button>
                          <button
                            onClick={() =>
                              setKpiPage(Math.min(totalKpiPages, kpiPage + 1))
                            }
                            disabled={kpiPage >= totalKpiPages}
                            className={`px-3 py-1 rounded ${
                              isLight
                                ? "bg-gray-200 text-gray-800 disabled:opacity-50"
                                : "bg-gray-600 text-gray-200 disabled:opacity-50"
                            }`}
                          >
                            بعدی
                          </button>
                        </div>
                      </div>
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
