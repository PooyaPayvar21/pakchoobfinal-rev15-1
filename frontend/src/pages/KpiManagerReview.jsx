import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Header from "../components/Common/Header";
import { kpiApi } from "../services/kpiApi";

const KpiManagerReview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const managerName = useMemo(() => {
    try {
      const info = JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
      return info.full_name || localStorage.getItem("username") || "";
    } catch {
      return "";
    }
  }, []);
  const [category, setCategory] = useState("All");
  const [entries, setEntries] = useState([]);
  const [filters, setFilters] = useState({
    caseOwner: "",
    obj_weight: "",
    KPIEn: "",
    KPIFa: "",
    KPI_Info: "",
    Category: "",
    target: "",
    KPI_weight: "",
    KPI_Achievement: "",
    Percentage_Achievement: "",
    Score_Achievement: "",
    Type: "",
    Status: "",
    Sum: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const pageSize = 10;
  const [activeUser, setActiveUser] = useState(null);
  const [activeManager, setActiveManager] = useState(null);
  const [managerCandidates, setManagerCandidates] = useState([]);
  const [allPeople, setAllPeople] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const tableRef = useRef(null);
  const [highlightTable, setHighlightTable] = useState(false);
  const managerDepartman = useMemo(() => {
    try {
      const info = JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
      return info.departman || "";
    } catch {
      return "";
    }
  }, []);

  const departmanParam = useMemo(() => {
    const v = searchParams.get("departman");
    return v ? decodeURIComponent(v) : "";
  }, [searchParams]);

  // departman normalization helpers are defined later to reuse existing fixText

  const managerPersonalCode = useMemo(() => {
    try {
      const info = JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
      return info.personal_code || localStorage.getItem("personal_code") || "";
    } catch {
      return "";
    }
  }, []);

  // remove unused options fetch

  const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
  const formatPercent = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(String(value).replace(/,/g, ""));
    if (Number.isNaN(n)) return String(value);
    if (n > 0 && n <= 1.0001) return Math.round(n * 100).toString();
    if (n > 1.0001 && n <= 10.0001) return Math.round(n * 10).toString();
    return Math.round(n).toString();
  };
  const parsePercent = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return n / 100;
  };

  const formatNumber = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return n.toString();
  };

  const normalizeCategory = (value) => {
    const s = String(value || "")
      .replaceAll("ي", "ی")
      .replaceAll("ك", "ک")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (!s) return "";
    if (
      [
        "maintasks",
        "main tasks",
        "main-task",
        "main",
        "tasks",
        "اصلی",
        "وظایف اصلی",
      ].includes(s)
    )
      return "MainTasks";
    if (["projects", "پروژه", "پروژه‌ها", "کارهای پروژه", "فنی"].includes(s))
      return "Projects";
    return value;
  };

  const categoryOptions = ["MainTasks", "Projects"];

  const fetchEntries = async () => {
    if (!managerName) {
      return;
    }
    try {
      const attempts = [
        {
          manager: managerName,
          category: category === "All" ? undefined : category,
          departman: managerDepartman,
          not_managed: false,
          outside_department: false,
        },
        {
          manager: managerName,
          category: category === "All" ? undefined : category,
          departman: managerDepartman,
          not_managed: true,
          outside_department: false,
        },
        {
          manager: "",
          category: category === "All" ? undefined : category,
          departman: managerDepartman,
          not_managed: false,
          outside_department: true,
        },
        {
          manager: managerName,
          category: category === "All" ? undefined : category,
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
          const baseId = t.row ?? t.id;
          const catKey = normalizeCategory(t.category) || "uncategorized";
          const key = baseId != null ? `${baseId}-${catKey}` : null;
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
      const byCategory =
        category === "All"
          ? filteredByManager
          : filteredByManager.filter(
              (t) =>
                normalizeCategory(t.category) === normalizeCategory(category)
            );
      const mapped = byCategory.map((t) => ({
        id: t.row,
        row: t.row,
        obj_weight: t.obj_weight || "",
        KPIEn: t.kpi_en || "",
        KPIFa: t.kpi_fa || "",
        KPI_Info: t.kpi_info || "",
        target: t.target || "",
        KPI_weight: t.kpi_weight || "",
        KPI_Achievement: t.kpi_achievement || "",
        Percentage_Achievement: t.score_achievement_alt || 0,
        Score_Achievement: t.score_achievement || 0,
        Type: t.entry_type === "Editable" ? "" : t.entry_type || "",
        // اگر نوع ردیف "Confirmed" باشد، همیشه Status هم "Confirmed" می‌ماند
        Status:
          t.entry_type === "Confirmed"
            ? "Confirmed"
            : t.entry_type === "Editable"
            ? "Editable"
            : t.manager_status || "",
        Sum: t.sum_value || "",
        personal_code: t.personal_code || "",
        full_name: t.full_name || "",
        direct_management: t.direct_management || "",
        role: t.role || "",
        departman: t.departman || "",
        manager_name: t.manager || t.manager_name || "",
        category: t.category || "",
      }));
      setEntries(mapped);
      setCurrentPage(1);
    } catch {
      toast.error("خطا در دریافت داده ها");
    }
  };

  useEffect(() => {
    if (managerName) {
      fetchEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerName, category, managerDepartman]);

  useEffect(() => {
    if (category === "All") {
      clearFilters();
      const pc = searchParams.get("pc") || "";
      const dep = searchParams.get("departman") || "";
      const obj = {};
      if (pc) obj.pc = pc;
      if (dep) obj.departman = dep;
      setSearchParams(obj, { replace: true });
      setCurrentPage(1);
    }
  }, [category, searchParams, setSearchParams]);

  useEffect(() => {
    const loadManagerOptions = async () => {
      try {
        const opts = await kpiApi.fetchKPIEntryOptions();
        const dms = Array.isArray(opts.direct_managements)
          ? opts.direct_managements
          : [];
        const people = Array.isArray(opts.people) ? opts.people : [];
        const looksMojibake = (s) => /[ØÙÛÂÃ±]/.test(String(s));
        const normalizePersianChars = (s) =>
          String(s)
            .replaceAll("ي", "ی")
            .replaceAll("ك", "ک")
            .replace(/[\u200c\u200f]/g, "");
        const fixText = (s) => {
          if (s == null) return "";
          const str = String(s);
          if (!looksMojibake(str)) return normalizePersianChars(str);
          try {
            const bytes = new Uint8Array(
              Array.from(str, (ch) => ch.charCodeAt(0))
            );
            const decoded = new TextDecoder("utf-8").decode(bytes);
            return normalizePersianChars(decoded);
          } catch {
            return normalizePersianChars(str);
          }
        };

        const uname = String(localStorage.getItem("username") || "")
          .trim()
          .toLowerCase();
        const selfCode = String(managerPersonalCode || "");
        const selfNorms = new Set();
        const selfByCode = people.find(
          (p) => String(p.personal_code || "") === selfCode
        );
        if (selfByCode && selfByCode.full_name) {
          const n = fixText(selfByCode.full_name)
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase();
          if (n) selfNorms.add(n);
        }
        const selfNameNorm = fixText(managerName)
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase();
        if (selfNameNorm) selfNorms.add(selfNameNorm);
        const seen = new Set();
        const items = [];
        dms.forEach((full_name) => {
          const nameFixed = fixText(full_name);
          const norm = nameFixed.trim().replace(/\s+/g, " ").toLowerCase();
          if (!norm) return;
          if (selfNorms.has(norm)) return;
          if (seen.has(norm)) return;
          const p = people.find(
            (x) =>
              fixText(x.full_name || "")
                .trim()
                .replace(/\s+/g, " ")
                .toLowerCase() === norm
          );
          const code = p ? String(p.personal_code || "") : "";
          if (
            code &&
            managerPersonalCode &&
            code === String(managerPersonalCode)
          )
            return;
          items.push({
            name: nameFixed,
            personal_code: code,
            departman: p ? String(p.departman || "") : "",
          });
          seen.add(norm);
        });
        setManagerCandidates(items);
        setAllPeople(people);
      } catch {}
    };
    loadManagerOptions();
  }, []);

  const fetchManagerContext = async (mgrName, mgrCode) => {
    try {
      setActiveUser(null);
      setActiveManager({ name: mgrName, code: mgrCode || "" });
      const results = [];
      try {
        const r1 = await kpiApi.fetchSubordinateEntries({
          manager: mgrName,
          category,
          departman: "",
          not_managed: false,
          outside_department: false,
        });
        results.push(r1);
      } catch {}
      if (mgrCode) {
        try {
          const r2 = await kpiApi.fetchSubordinateEntries({
            personal_code: mgrCode,
            category,
            manager: "",
            departman: "",
            not_managed: false,
            outside_department: false,
          });
          results.push(r2);
        } catch {}
      }
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
      const mapped = tasks.map((t) => ({
        id: t.row,
        row: t.row,
        obj_weight: t.obj_weight || "",
        KPIEn: t.kpi_en || "",
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
        personal_code: t.personal_code || "",
        full_name: t.full_name || "",
        direct_management: t.direct_management || "",
        role: t.role || "",
        departman: t.departman || "",
        manager_name: t.manager || t.manager_name || "",
      }));
      setEntries(mapped);
      setCurrentPage(1);
    } catch {
      toast.error("خطا در دریافت داده های مدیر");
    }
  };

  useEffect(() => {
    const pc = searchParams.get("pc");
    if (pc) {
      setActiveUser(pc);
    }
  }, [searchParams]);

  const handleChange = (id, name, value) => {
    // Prevent any changes if the row is confirmed
    const row = entries.find((r) => r.id === id);
    if (row?.Status === "Confirmed") {
      return;
    }

    setEntries((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [name]: value, _dirty: true } : row
      )
    );
  };

  const handleSave = async (row) => {
    try {
      const payload = {
        obj_weight: row.obj_weight,
        kpi_en: row.KPIEn,
        kpi_fa: row.KPIFa,
        kpi_info: row.KPI_Info,
        target: row.target,
        kpi_weight: row.KPI_weight,
        kpi_achievement: row.KPI_Achievement,
        score_achievement: row.Score_Achievement,
        score_achievement_alt: row.Percentage_Achievement,
        entry_type: row.Type,
        manager_status: row.Status,
        sum_value: row.Sum,
      };
      await kpiApi.updateKPIEntryRow(row.row, payload);
      toast.success("ذخیره شد");
      setEntries((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, _dirty: false } : r))
      );
    } catch {
      toast.error("خطا در ذخیره");
    }
  };

  const handleConfirm = async (row) => {
    try {
      await kpiApi.confirmKPIEntryRow(row.row);
      toast.success("تایید شد");
      setEntries((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, Status: "Confirmed" } : r))
      );
    } catch {
      toast.error("خطا در تایید");
    }
  };

  const handleDelete = async (rowId) => {
    try {
      await kpiApi.deleteKPIEntryRow(rowId);
      toast.success("حذف شد");
      setEntries((prev) => prev.filter((r) => r.row !== rowId));
    } catch {
      toast.error("خطا در حذف");
    }
  };

  const handleAddRow = async () => {
    try {
      if (!activeUser) {
        toast.error("ابتدا کاربر را انتخاب کنید");
        return;
      }
      const candidate = entries.find(
        (e) => String(e.personal_code) === String(activeUser)
      );
      if (!candidate) {
        toast.error("کاربر انتخاب شده یافت نشد");
        return;
      }

      const payload = {
        personal_code: candidate.personal_code,
        full_name: candidate.full_name || "",
        company_name: "",
        role: candidate.role || "",
        direct_management: candidate.direct_management || managerName || "",
        departman: candidate.departman || managerDepartman || "",
        category,
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

      await kpiApi.submitKPIEntry(payload);
      toast.success("ردیف جدید اضافه شد");
      await fetchEntries();
      setCurrentPage(1);
    } catch {
      toast.error("خطا در افزودن ردیف جدید");
    }
  };

  const clearFilters = () => {
    setFilters({
      caseOwner: "",
      obj_weight: "",
      KPIEn: "",
      KPIFa: "",
      KPI_Info: "",
      Category: "",
      target: "",
      KPI_weight: "",
      KPI_Achievement: "",
      Percentage_Achievement: "",
      Score_Achievement: "",
      Type: "",
      Status: "",
      Sum: "",
    });
    setCurrentPage(1);
  };

  const handleToggleEditPermission = async (
    personalCode,
    fullName,
    currentStatus
  ) => {
    try {
      const info = JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
      const isEditable = currentStatus === "Editable";

      // Check if user has any confirmed works
      const hasConfirmedWorks = entries.some(
        (entry) =>
          entry.personal_code === personalCode &&
          (entry.Type === "Confirmed" || entry.Status === "Confirmed")
      );

      if (hasConfirmedWorks) {
        toast.warning(
          "کاربر دارای کارهای تایید شده است و امکان نمایش وجود ندارد"
        );
        return;
      }

      if (isEditable) {
        // Revoke permission
        await kpiApi.revokeEditPermission({
          personal_code: personalCode,
          category,
          manager_departman: info.departman || "",
        });
        toast.success(`عدم نمایش جدول برای ${fullName}`);
        // Update all entries for this user
        setEntries((prev) =>
          prev.map((r) =>
            r.personal_code === personalCode
              ? {
                  ...r,
                  Status: "", // No need to check for Confirmed here as we already checked above
                }
              : r
          )
        );
      } else {
        // Grant permission
        await kpiApi.grantEditPermission({
          personal_code: personalCode,
          category,
          manager_departman: info.departman || "",
        });
        toast.success(`نمایش جدول برای ${fullName}`);
        // Update all entries for this user
        setEntries((prev) =>
          prev.map((r) =>
            r.personal_code === personalCode
              ? {
                  ...r,
                  // ردیف‌های Confirmed همچنان Confirmed می‌مانند
                  Status: r.Type === "Confirmed" ? "Confirmed" : "Editable",
                }
              : r
          )
        );
      }
    } catch {
      const wasEditable = currentStatus === "Editable";
      toast.error(
        wasEditable ? "خطا در عدم نمایش جدول کاربر" : "خطا در نمایش جدول کاربر"
      );
    }
  };

  // Get unique users from entries
  const looksMojibake = (s) => /[ØÙÛÂÃ±]/.test(String(s));
  const normalizePersianChars = (s) =>
    String(s)
      .replaceAll("ي", "ی")
      .replaceAll("ك", "ک")
      .replace(/[\u200c\u200f]/g, "");
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
  const normalizeDept = (s) =>
    fixText(s || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    const excludeName = fixText(
      (activeManager?.name || managerName || "").trim()
    )
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
    entries.forEach((entry) => {
      if (departmanParam) {
        const ed = normalizeDept(entry.departman || "");
        const pd = normalizeDept(departmanParam);
        if (!ed || ed !== pd) return;
      }
      const nameNorm = fixText(entry.full_name || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
      if (!nameNorm || nameNorm === excludeName) return;
      const key = nameNorm;
      if (!userMap.has(key)) {
        userMap.set(key, {
          personal_code: entry.personal_code || "",
          full_name: fixText(entry.full_name || ""),
          entry_count: 0,
          has_edit_permission: false,
          has_confirmed_works: false,
        });
      }
      const user = userMap.get(key);
      if (!user.personal_code && entry.personal_code)
        user.personal_code = entry.personal_code;
      user.entry_count += 1;
      if (entry.Status === "Editable") {
        user.has_edit_permission = true;
      }
      if (entry.Type === "Confirmed" || entry.Status === "Confirmed") {
        user.has_confirmed_works = true;
        user.has_edit_permission = false;
      }
    });
    return Array.from(userMap.values());
  }, [entries, activeManager, managerName, departmanParam]);

  const filteredUsers = useMemo(() => {
    const q = fixText(userSearch || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
    if (!q) return uniqueUsers;
    return uniqueUsers.filter((u) => {
      const name = fixText(u.full_name || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
      const code = String(u.personal_code || "").trim();
      return name.includes(q) || code.includes(userSearch.trim());
    });
  }, [uniqueUsers, userSearch]);

  const managerCandidatesFromEntries = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => {
      const nameRaw = e.manager_name || e.direct_management || "";
      const name = fixText(nameRaw).trim();
      if (!name) return;
      const dept = fixText(e.departman || "").trim();
      const key = `${name.toLowerCase()}|${dept.toLowerCase()}`;
      if (!map.has(key)) {
        const person = allPeople.find(
          (p) =>
            fixText(p.full_name || "")
              .trim()
              .toLowerCase() === name.toLowerCase()
        );
        const code = person ? String(person.personal_code || "") : "";
        map.set(key, { name, personal_code: code, departman: dept });
      }
    });
    return Array.from(map.values());
  }, [entries, allPeople]);

  const uniqueValues = useMemo(
    () => ({
      caseOwner: Array.from(
        new Set(
          entries
            .map((e) => `${e.full_name} (${e.personal_code})`)
            .filter((v) => v && v.trim() !== "")
        )
      ),
      obj_weight: Array.from(
        new Set(
          entries
            .map((e) => formatPercent(e.obj_weight))
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      KPIEn: Array.from(
        new Set(
          entries
            .map((e) => e.KPIEn)
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      KPIFa: Array.from(
        new Set(
          entries
            .map((e) => e.KPIFa)
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      KPI_Info: Array.from(
        new Set(
          entries
            .map((e) => e.KPI_Info)
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      Category: Array.from(
        new Set(
          entries
            .map((e) => normalizeCategory(e.category))
            .filter((v) => v && String(v).trim() !== "")
        )
      ),
      target: Array.from(
        new Set(
          entries
            .map((e) => formatPercent(e.target))
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      KPI_weight: Array.from(
        new Set(
          entries
            .map((e) => formatPercent(e.KPI_weight))
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      KPI_Achievement: Array.from(
        new Set(
          entries
            .map((e) => formatPercent(e.KPI_Achievement))
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      Percentage_Achievement: Array.from(
        new Set(
          entries
            .map((e) => formatPercent(e.Percentage_Achievement))
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      Score_Achievement: Array.from(
        new Set(
          entries
            .map((e) => formatNumber(e.Score_Achievement))
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      Type: Array.from(
        new Set(
          entries
            .map((e) => e.Type)
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      Status: Array.from(
        new Set(
          entries
            .map((e) => e.Status)
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
      Sum: Array.from(
        new Set(
          entries
            .map((e) => formatPercent(e.Sum))
            .filter((v) => v !== "" && v !== null && v !== undefined)
        )
      ),
    }),
    [entries]
  );

  const kpiCounts = useMemo(() => {
    const m = new Map();
    entries.forEach((e) => {
      const name = String(e.KPIFa || "").trim();
      if (!name) return;
      m.set(name, (m.get(name) || 0) + 1);
    });
    return Array.from(m.entries()).map(([name, count]) => ({ name, count }));
  }, [entries]);

  const kpiParam = useMemo(
    () => searchParams.get("kpi") || null,
    [searchParams]
  );

  const filteredEntries = useMemo(
    () =>
      entries.filter((row) => {
        return Object.entries(filters).every(([key, filterValue]) => {
          if (!filterValue) return true;

          if (key === "caseOwner") {
            const display = `${row.full_name} (${row.personal_code})`;
            return String(display) === String(filterValue);
          }

          if (key === "Category") {
            const cat = normalizeCategory(row.category);
            return String(cat) === String(filterValue);
          }

          const rawValue = row[key];
          if (rawValue === null || rawValue === undefined) return false;

          let displayValue;
          if (
            key === "obj_weight" ||
            key === "target" ||
            key === "KPI_weight" ||
            key === "KPI_Achievement" ||
            key === "Sum" ||
            key === "Percentage_Achievement"
          ) {
            displayValue = formatPercent(rawValue);
          } else if (key === "Score_Achievement") {
            displayValue = formatNumber(rawValue);
          } else {
            displayValue = String(rawValue);
          }

          return String(displayValue) === String(filterValue);
        });
      }),
    [entries, filters]
  );

  const displayedEntries = useMemo(
    () =>
      filteredEntries.filter((row) => {
        const byUser = activeUser
          ? String(row.personal_code) === String(activeUser)
          : true;
        const byKpi =
          !kpiParam ||
          String(row.KPIFa).trim() === decodeURIComponent(kpiParam);
        const byDept = departmanParam
          ? normalizeDept(row.departman || "") === normalizeDept(departmanParam)
          : true;
        return byUser && byKpi && byDept;
      }),
    [filteredEntries, activeUser, kpiParam, departmanParam]
  );

  useEffect(() => {
    const maxPages = Math.max(1, Math.ceil(displayedEntries.length / pageSize));
    setCurrentPage((p) => Math.min(p, maxPages));
  }, [displayedEntries.length]);

  useEffect(() => {
    if (!activeUser) return;
    setHighlightTable(true);
    const el = tableRef.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const t = setTimeout(() => setHighlightTable(false), 1200);
    return () => clearTimeout(t);
  }, [activeUser]);

  const isLight = document.documentElement.classList.contains("light");

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"بازبینی مدیر مستقیم"} />
      <ToastContainer position="top-center" autoClose={1500} rtl={true} />
      <main className="w-full lg:px-8 mb-10" dir="rtl">
        <div className="mt-8 px-4">
          <div>
            <button
              onClick={() => {
                const pc = searchParams.get("pc");
                if (pc) {
                  navigate(`/kpi/person/${pc}`, { replace: true });
                } else {
                  navigate(-1);
                }
              }}
              className={`px-3 py-2 rounded cursor-pointer mb-2 ${
                isLight
                  ? "bg-gray-300 hover:bg-gray-100"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            >
              بازگشت
            </button>
          </div>
          <div
            className={`backdrop-blur-md shadow-lg rounded-xl p-6 border ${
              isLight
                ? "bg-white/90 border-gray-200"
                : "bg-gray-800/60 border-gray-700"
            }`}
          >
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"
              dir="rtl"
            >
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-600" : "text-gray-400"
                  } block mb-1`}
                >
                  مدیر مستقیم
                </label>
                <input
                  type="text"
                  value={managerName}
                  disabled={true}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-800 text-gray-200 border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-600" : "text-gray-400"
                  } block mb-1`}
                >
                  دسته بندی
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-48 px-3 py-2 border border-gray-300 rounded-lg ${
                    isLight
                      ? "bg-white text-gray-900"
                      : "bg-gray-800 text-gray-200"
                  }`}
                >
                  <option value="All">همه</option>
                  <option value="MainTasks">Main Tasks</option>
                  <option value="Projects">Project Works</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Cards Section */}
          {uniqueUsers.length > 0 && (
            <div className="mt-6 mb-6">
              <h3
                className={`text-lg font-semibold ${
                  isLight ? "text-gray-900" : "text-gray-200"
                } mb-4`}
                dir="rtl"
              >
                کاربران
              </h3>
              <div className="mb-4" dir="rtl">
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="جستجوی کاربران"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-800 text-gray-200 border-gray-600"
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {filteredUsers.map((user) => (
                  <div
                    key={`${user.personal_code}_${user.full_name}`}
                    className={`backdrop-blur-md shadow-lg rounded-xl p-4 border ${
                      isLight
                        ? "bg-white/90 border-gray-200"
                        : "bg-gray-800/60 border-gray-700"
                    }`}
                    dir="rtl"
                  >
                    <div className="flex flex-col space-y-3">
                      <div>
                        <h4
                          className={`${
                            isLight ? "text-gray-700" : "text-gray-300"
                          } font-medium text-sm mb-1`}
                        >
                          نام و نام خانوادگی
                        </h4>
                        <p
                          className={`${
                            isLight ? "text-gray-900" : "text-gray-200"
                          } font-semibold`}
                        >
                          {user.full_name}
                        </p>
                      </div>
                      <div>
                        <h4
                          className={`${
                            isLight ? "text-gray-700" : "text-gray-300"
                          } font-medium text-sm mb-1`}
                        >
                          کد پرسنلی
                        </h4>
                        <p
                          className={`${
                            isLight ? "text-gray-900" : "text-gray-200"
                          }`}
                        >
                          {user.personal_code}
                        </p>
                      </div>
                      <div>
                        <h4
                          className={`${
                            isLight ? "text-gray-700" : "text-gray-300"
                          } font-medium text-sm mb-1`}
                        >
                          تعداد ردیف‌ها
                        </h4>
                        <p
                          className={`${
                            isLight ? "text-gray-900" : "text-gray-200"
                          }`}
                        >
                          {user.entry_count} ردیف
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span
                          className={`${
                            isLight ? "text-gray-700" : "text-gray-300"
                          } text-sm font-medium`}
                        >
                          نمایش جدول کاربر
                        </span>
                        <div className="relative group">
                          <label
                            className={`relative inline-flex items-center ${
                              user.has_confirmed_works ||
                              (activeUser && activeUser !== user.personal_code)
                                ? "cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={activeUser === user.personal_code}
                              onChange={async () => {
                                if (
                                  activeUser &&
                                  activeUser !== user.personal_code
                                ) {
                                  return;
                                }
                                if (activeUser === user.personal_code) {
                                  await handleToggleEditPermission(
                                    user.personal_code,
                                    user.full_name,
                                    "Editable"
                                  );
                                  setActiveUser(null);
                                } else {
                                  if (user.has_confirmed_works) {
                                    toast.warning(
                                      "کاربر دارای کارهای تایید شده است و امکان نمایش وجود ندارد"
                                    );
                                    return;
                                  }
                                  await handleToggleEditPermission(
                                    user.personal_code,
                                    user.full_name,
                                    ""
                                  );
                                  setActiveUser(user.personal_code);
                                }
                              }}
                              disabled={
                                user.has_confirmed_works ||
                                (activeUser &&
                                  activeUser !== user.personal_code)
                              }
                              className="sr-only peer"
                            />
                            <div
                              className={`w-11 h-6 ${
                                user.has_confirmed_works ||
                                (activeUser &&
                                  activeUser !== user.personal_code)
                                  ? "bg-gray-700"
                                  : "bg-gray-600"
                              } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                user.has_confirmed_works ||
                                (activeUser &&
                                  activeUser !== user.personal_code)
                                  ? "opacity-50"
                                  : "peer-checked:bg-yellow-600"
                              }`}
                            ></div>
                          </label>
                          {user.has_confirmed_works && (
                            <div
                              className={`absolute z-10 invisible group-hover:visible w-48 text-xs rounded p-2 -left-4 -top-10 transform -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                                isLight
                                  ? "bg-white text-gray-900 shadow border border-gray-200"
                                  : "bg-gray-800 text-white"
                              }`}
                            >
                              کاربر دارای کارهای تایید شده است و امکان تغییر
                              وضعیت وجود ندارد
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* {managerCandidates.length > 0 && (
            <div className="mt-6 mb-6">
              <h3
                className={`text-lg font-semibold ${
                  isLight ? "text-gray-900" : "text-gray-200"
                } mb-4`}
                dir="rtl"
              >
                مدیران
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {(() => {
                  const base =
                    managerCandidatesFromEntries.length > 0
                      ? managerCandidatesFromEntries
                      : managerCandidates;
                  const filtered = departmanParam
                    ? base.filter(
                        (m) =>
                          normalizeDept(m.departman || "") ===
                          normalizeDept(departmanParam)
                      )
                    : base;
                  return filtered;
                })().map((m) => (
                  <button
                    key={m.name}
                    onClick={() => fetchManagerContext(m.name, m.personal_code)}
                    className={`text-right w-full backdrop-blur-md shadow-lg rounded-xl p-3 border ${
                      isLight
                        ? "bg-white/90 border-gray-200"
                        : "bg-gray-800/60 border-gray-700"
                    }`}
                  >
                    <div
                      className={`${
                        isLight ? "text-gray-900" : "text-gray-200"
                      } font-semibold text-sm`}
                    >
                      {String(m.name)}
                    </div>
                    <div
                      className={`${
                        isLight ? "text-gray-700" : "text-gray-300"
                      } text-xs mt-1`}
                    >
                      {m.personal_code || ""}
                    </div>
                  </button>
                ))}
              </div>
              {activeManager && (
                <div className="mt-3 flex items-center gap-2">
                  <span className={isLight ? "text-gray-800" : "text-gray-200"}>
                    مدیر انتخابی: {activeManager.name}
                  </span>
                  <button
                    onClick={() => {
                      setActiveManager(null);
                      fetchEntries();
                    }}
                    className={`px-3 py-1 rounded ${
                      isLight
                        ? "bg-gray-200 text-gray-800"
                        : "bg-gray-600 text-gray-200"
                    }`}
                  >
                    بازگشت به مدیر فعلی
                  </button>
                </div>
              )}
            </div>
          )} */}
          {/* 
          {kpiCounts.length > 0 && (
            <div className="mt-6 mb-6">
              <h3
                className={`text-lg font-semibold ${
                  isLight ? "text-gray-900" : "text-gray-200"
                } mb-4`}
                dir="rtl"
              >
                KPI ها
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {kpiCounts.map((k) => (
                  <button
                    key={k.name}
                    onClick={() =>
                      setSearchParams(k.name ? { kpi: k.name } : {}, { replace: true })
                    }
                    className={`text-right w-full backdrop-blur-md shadow-lg rounded-xl p-3 border ${
                      isLight
                        ? "bg-white/90 border-gray-200"
                        : "bg-gray-800/60 border-gray-700"
                    }`}
                  >
                    <div
                      className={`${
                        isLight ? "text-gray-900" : "text-gray-200"
                      } font-semibold text-sm`}
                    >
                      {String(k.name)}
                    </div>
                    <div
                      className={`${
                        isLight ? "text-gray-700" : "text-gray-300"
                      } text-xs mt-1`}
                    >
                      {k.count} ردیف
                    </div>
                  </button>
                ))}
              </div>
              {kpiParam && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      const pc = searchParams.get("pc") || "";
                      const dep = searchParams.get("departman") || "";
                      const obj = {};
                      if (pc) obj.pc = pc;
                      if (dep) obj.departman = dep;
                      setSearchParams(obj, { replace: true });
                    }}
                    className={`px-3 py-1 rounded ${
                      isLight
                        ? "bg-gray-200 text-gray-800"
                        : "bg-gray-600 text-gray-200"
                    }`}
                  >
                    پاک‌سازی انتخاب KPI
                  </button>
                </div>
              )}
            </div>
          )} */}

          {(activeUser || kpiParam) && (
            <div
              className={`mt-6 overflow-auto pt-6 text-center ${
                isLight
                  ? "border-t border-gray-200"
                  : "border-t border-gray-600"
              }`}
            >
              {kpiParam && (
                <div className="flex items-center justify-between mb-3">
                  <div className={isLight ? "text-gray-800" : "text-gray-200"}>
                    افزودن ردیف جدید برای همه افراد مرتبط با KPI انتخاب‌شده
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const workName = decodeURIComponent(kpiParam || "");
                        if (!workName) {
                          toast.error("نام KPI نامعتبر است");
                          return;
                        }
                        const uniquePeople = Array.from(
                          new Map(
                            displayedEntries.map((e) => [
                              String(e.personal_code),
                              {
                                personal_code: e.personal_code,
                                full_name: e.full_name,
                                role: e.role,
                                direct_management: e.direct_management,
                                departman: e.departman,
                              },
                            ])
                          ).values()
                        );

                        await Promise.all(
                          uniquePeople.map((p) =>
                            kpiApi.submitKPIEntry({
                              personal_code: p.personal_code,
                              full_name: p.full_name || "",
                              company_name: "",
                              role: p.role || "",
                              direct_management:
                                p.direct_management || managerName || "",
                              departman: p.departman || managerDepartman || "",
                              category,
                              tasks: [
                                {
                                  obj_weight: "",
                                  KPIEn: "",
                                  KPIFa: workName,
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
                            })
                          )
                        );
                        toast.success("ردیف‌ها برای همه افراد اضافه شد");
                        await fetchEntries();
                        setCurrentPage(1);
                      } catch (e) {
                        toast.error("خطا در افزودن ردیف‌ها برای همه افراد");
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                  >
                    افزودن ردیف برای همه
                  </button>
                </div>
              )}
              {activeUser && (
                <div className="flex items-center justify-between mb-3">
                  <div className={isLight ? "text-gray-800" : "text-gray-200"}>
                    افزودن ردیف جدید برای کاربر انتخاب شده
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                  >
                    افزودن ردیف
                  </button>
                </div>
              )}
              <table
                ref={tableRef}
                className={`w-full text-sm mb-5 ${
                  highlightTable
                    ? "animate-pulse ring-2 ring-yellow-500 rounded"
                    : ""
                }`}
              >
                <thead>
                  <tr className="text-center">
                    <th className="px-2 py-2 text-gray-400">#</th>
                    <th className="px-2 py-2 text-gray-400">پرونده</th>
                    <th className="px-2 py-2 text-gray-400">Object Weight</th>
                    <th className="px-2 py-2 text-gray-400">KPI English</th>
                    <th className="px-2 py-2 text-gray-400">KPI Farsi</th>
                    <th className="px-2 py-2 text-gray-400">KPI Info</th>
                    <th className="px-2 py-2 text-gray-400">Category</th>
                    <th className="px-2 py-2 text-gray-400">Target</th>
                    <th className="px-2 py-2 text-gray-400">KPI Weight</th>
                    <th className="px-2 py-2 text-gray-400">KPI Achievement</th>
                    <th className="px-2 py-2 text-gray-400">% Achievement</th>
                    <th className="px-2 py-2 text-gray-400">Score</th>
                    <th className="px-2 py-2 text-gray-400">Type</th>
                    <th className="px-2 py-2 text-gray-400">Sum</th>
                    <th className="px-2 py-2 text-gray-400">Status</th>
                    <th className="px-2 py-2 text-gray-400">Actions</th>
                  </tr>
                  <tr
                    className={`text-center ${
                      isLight ? "bg-gray-300" : "bg-gray-900"
                    }`}
                  >
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Category}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Category: e.target.value,
                            }))
                          }
                          className={`w-32 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          <option value="MainTasks">MainTasks</option>
                          <option value="Projects">Projects</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Category: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.caseOwner}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              caseOwner: e.target.value,
                            }))
                          }
                          className={`w-40 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.caseOwner.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              caseOwner: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>

                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.obj_weight}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              obj_weight: e.target.value,
                            }))
                          }
                          className={`w-24 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.obj_weight.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              obj_weight: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>

                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.KPIEn}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              KPIEn: e.target.value,
                            }))
                          }
                          className={`w-32 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.KPIEn.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              KPIEn: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>

                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.KPIFa}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              KPIFa: e.target.value,
                            }))
                          }
                          className={`w-32 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.KPIFa.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              KPIFa: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>

                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.KPI_Info}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_Info: e.target.value,
                            }))
                          }
                          className={`w-40 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.KPI_Info.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_Info: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Category}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Category: e.target.value,
                            }))
                          }
                          className={`w-32 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          <option value="MainTasks">MainTasks</option>
                          <option value="Projects">Projects</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Category: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.target}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              target: e.target.value,
                            }))
                          }
                          className={`w-24 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.target.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              target: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.KPI_weight}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_weight: e.target.value,
                            }))
                          }
                          className={`w-20 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.KPI_weight.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_weight: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.KPI_Achievement}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_Achievement: e.target.value,
                            }))
                          }
                          className={`w-24 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.KPI_Achievement.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_Achievement: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Percentage_Achievement}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Percentage_Achievement: e.target.value,
                            }))
                          }
                          className={`w-24 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.Percentage_Achievement.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Percentage_Achievement: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Score_Achievement}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Score_Achievement: e.target.value,
                            }))
                          }
                          className={`w-24 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.Score_Achievement.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Score_Achievement: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Type}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Type: e.target.value,
                            }))
                          }
                          className={`w-20 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.Type.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Type: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Sum}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Sum: e.target.value,
                            }))
                          }
                          className={`w-24 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.Sum.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Sum: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Status}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Status: e.target.value,
                            }))
                          }
                          className={`w-20 px-2 py-1 border rounded ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-800 text-gray-200 border-gray-600"
                          } text-xs`}
                        >
                          <option value="" className="text-gray-800">
                            All
                          </option>
                          {uniqueValues.Status.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Status: "",
                            }))
                          }
                          className="text-gray-500 hover:text-gray-700 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1 text-gray-400"></th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight ? "divide-gray-300" : "divide-gray-700"
                  } text-center`}
                >
                  {displayedEntries
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((row, index) => (
                      <tr
                        key={`${row.id}-${row.category}-${row.personal_code}-${index}`}
                        className={`${
                          isLight
                            ? "bg-white hover:bg-gray-200"
                            : "bg-gray-800 hover:bg-gray-700"
                        } align-top`}
                      >
                        <td
                          className={`px-2 py-2  ${
                            isLight ? "text-gray-700" : "text-gray-300"
                          }`}
                        >
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td
                          className={`px-2 py-2  ${
                            isLight ? "text-gray-700" : "text-gray-300"
                          }`}
                        >
                          {row.full_name} ({row.personal_code})
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(row.obj_weight)}
                            onChange={(e) =>
                              handleChange(
                                row.id,
                                "obj_weight",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            placeholder="Object weight"
                            className={`w-28 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={row.KPIEn}
                            onChange={(e) =>
                              handleChange(row.id, "KPIEn", e.target.value)
                            }
                            placeholder="KPI English"
                            className={`w-48 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={row.KPIFa}
                            dir="rtl"
                            onChange={(e) =>
                              handleChange(row.id, "KPIFa", e.target.value)
                            }
                            placeholder="KPI Farsi"
                            className={`w-48 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <textarea
                            value={row.KPI_Info}
                            dir="rtl"
                            onChange={(e) =>
                              handleChange(row.id, "KPI_Info", e.target.value)
                            }
                            placeholder="KPI info"
                            rows={2}
                            className={`w-56 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                              isLight
                                ? "bg-gray-200 text-gray-800"
                                : "bg-gray-700 text-gray-200"
                            }`}
                          >
                            {normalizeCategory(row.category) || ""}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(row.target)}
                            onChange={(e) =>
                              handleChange(
                                row.id,
                                "target",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            placeholder="Target"
                            className={`w-28 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(row.KPI_weight)}
                            onChange={(e) =>
                              handleChange(
                                row.id,
                                "KPI_weight",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            placeholder="KPI weight"
                            className={`w-20 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(row.KPI_Achievement)}
                            onChange={(e) =>
                              handleChange(
                                row.id,
                                "KPI_Achievement",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            placeholder="KPI Achievement"
                            className={`w-28 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={formatPercent(row.Percentage_Achievement)}
                            onChange={(e) =>
                              handleChange(
                                row.id,
                                "Percentage_Achievement",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            placeholder="% Achievement"
                            className={`w-28 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(row.Score_Achievement)}
                            onChange={(e) =>
                              handleChange(
                                row.id,
                                "Score_Achievement",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            placeholder="Score"
                            className={`w-28 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={row.Type}
                            onChange={(e) =>
                              handleChange(row.id, "Type", e.target.value)
                            }
                            placeholder="Type"
                            className={`w-24 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(row.Sum)}
                            onChange={(e) =>
                              handleChange(
                                row.id,
                                "Sum",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            placeholder="Sum"
                            className={`w-28 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            }`}
                            disabled={row.Status === "Confirmed"}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold " +
                              (row.Status === "Confirmed"
                                ? "bg-green-700 text-green-100"
                                : row.Status === "Editable"
                                ? "bg-yellow-700 text-yellow-100"
                                : "bg-gray-300 text-gray-900")
                            }
                          >
                            {row.Status || "-"}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => handleSave(row)}
                              className={`bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition duration-200 ${
                                row._dirty && row.Status !== "Confirmed"
                                  ? ""
                                  : "opacity-50 cursor-not-allowed"
                              }`}
                              disabled={
                                !row._dirty || row.Status === "Confirmed"
                              }
                            >
                              ذخیره
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirm(row)}
                              className={`bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition duration-200 ${
                                row.Status === "Confirmed"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={row.Status === "Confirmed"}
                            >
                              تایید
                            </button>
                            {/* <button
                              type="button"
                              onClick={async () => {
                                // Prevent granting edit permission if the row is confirmed
                                if (row.Status === "Confirmed") {
                                  toast.warning(
                                    "کارهای تایید شده قابل ویرایش نیستند"
                                  );
                                  return;
                                }

                                try {
                                  const info = JSON.parse(
                                    localStorage.getItem("kpiUserInfo") || "{}"
                                  );
                                  await kpiApi.grantEditPermission({
                                    personal_code: row.personal_code,
                                    category,
                                    manager_departman: info.departman || "",
                                  });
                                  toast.success("اجازه ویرایش داده شد");
                                  // Notification is created by backend in kpientry_grant_edit
                                  setEntries((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id &&
                                      r.Status !== "Confirmed"
                                        ? { ...r, Status: "Editable" }
                                        : r
                                    )
                                  );
                                } catch (e) {
                                  console.error(
                                    "Error granting edit permission:",
                                    e
                                  );
                                  toast.error("خطا در دادن اجازه ویرایش");
                                }
                              }}
                              className={`bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition duration-200 ${
                                row.Status === "Confirmed"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={row.Status === "Confirmed"}
                            >
                              اجازه ویرایش
                            </button> */}
                            <button
                              type="button"
                              onClick={() => handleDelete(row.row)}
                              className={`bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition duration-200 ${
                                row.Status === "Confirmed"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={row.Status === "Confirmed"}
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-gray-200">
                  <strong>Total Score:</strong>{" "}
                  {(() => {
                    const total = displayedEntries.reduce(
                      (s, t) => s + (Number(t.Score_Achievement) || 0),
                      0
                    );
                    return round2(total);
                  })()}
                  %
                </div>
                <div className="flex items-center gap-2 mb-10">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="bg-gray-700 cursor-pointer hover:bg-gray-800 text-white px-3 py-1 rounded text-sm"
                  >
                    Clear Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-gray-600 cursor-pointer disabled:opacity-50 hover:bg-gray-700 text-white px-3 py-1 rounded"
                  >
                    Prev
                  </button>
                  {Array.from(
                    {
                      length: Math.max(
                        1,
                        Math.ceil(displayedEntries.length / pageSize)
                      ),
                    },
                    (_, i) => i + 1
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1 rounded ${
                        currentPage === p
                          ? "bg-blue-600 text-white"
                          : "bg-gray-600 text-white hover:bg-gray-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(
                          Math.max(
                            1,
                            Math.ceil(displayedEntries.length / pageSize)
                          ) || 1,
                          p + 1
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      (Math.max(
                        1,
                        Math.ceil(displayedEntries.length / pageSize)
                      ) || 1)
                    }
                    className="bg-gray-600 cursor-pointer disabled:opacity-50 hover:bg-gray-700 text-white px-3 py-1 rounded"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default KpiManagerReview;
