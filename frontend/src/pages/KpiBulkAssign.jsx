import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import { kpiApi } from "../services/kpiApi";
import { useNavigate } from "react-router-dom";

function KpiBulkAssign() {
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [searchKpi, setSearchKpi] = useState("");
  const [filters, setFilters] = useState({
    KPIFa: "",
    KPIEn: "",
    KPI_Info: "",
    target: "",
    Type: "",
    KPI_weight: "",
    category: "",
    obj_weight: "",
  });
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [scope, setScope] = useState("selected");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const [newKpi, setNewKpi] = useState({
    KPIFa: "",
    KPIEn: "",
    target: "",
    Type: "+",
    KPI_weight: "",
    category: "MainTasks",
    obj_weight: "",
    KPI_Info: "",
    company_name: "",
    season: "",
    personal_code: "",
    full_name: "",
    role: "",
  });

  // Get manager info from localStorage
  const managerInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
    } catch {
      return {};
    }
  }, []);

  const managerName = managerInfo.full_name || "";
  const managerDepartman = managerInfo.departman || "";
  const managerPersonalCode = managerInfo.personal_code || "";
  const managerRole = (managerInfo.role || "").toLowerCase();
  const managerDirectManagement = managerInfo.direct_management || "";

  // Check if current user is a management role
  const isManagement = ["management", "manager", "ceo", "superadmin"].includes(
    managerRole
  );

  // Fetch KPI entries for the manager's direct reports
  useEffect(() => {
    const fetchEntries = async () => {
      setLoadingEntries(true);
      console.log(
        "[BulkAssign] manager:",
        managerName,
        "departman:",
        managerDepartman,
        "isManagement:",
        isManagement
      );
      if (!String(managerName || "").trim()) {
        toast.error("نام مدیر در اطلاعات کاربر (kpiUserInfo) ثبت نشده است");
        setEntries([]);
        setLoadingEntries(false);
        return;
      }
      try {
        // If user is management, fetch only their direct reports
        if (isManagement) {
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
            attempts.map((p) =>
              kpiApi
                .fetchSubordinateEntries(p)
                .then((resp) => resp)
                .catch(() => null)
            )
          );
          results.forEach((resp, idx) => {
            const arr = Array.isArray(resp) ? resp : resp?.tasks || [];
            console.log(
              `[BulkAssign] attempt ${idx} returned`,
              arr.length,
              "rows"
            );
          });
          const taskMap = new Map();
          results.forEach((resp) => {
            const arr = Array.isArray(resp) ? resp : resp?.tasks || [];
            arr.forEach((t) => {
              const key = t.row ?? t.id;
              if (key == null) return;
              if (!taskMap.has(key)) taskMap.set(key, t);
            });
          });
          const merged = Array.from(taskMap.values());
          console.log("[BulkAssign] merged rows:", merged.length);
          const managerFull = fixText(managerName || "").trim();
          const filteredByManager = merged.filter((t) => {
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
          console.log(
            "[BulkAssign] filtered by manager:",
            filteredByManager.length
          );
          const mapped = filteredByManager.map((t) => ({
            row: t.row ?? t.id,
            KPIFa: fixText(t.KPIFa ?? t.kpi_fa ?? ""),
            KPIEn: t.KPIEn ?? t.kpi_en ?? "",
            KPI_Info: fixText(t.KPI_Info ?? t.kpi_info ?? ""),
            target: t.target ?? "",
            KPI_weight: t.KPI_weight ?? t.kpi_weight ?? "",
            KPI_Achievement: t.KPI_Achievement ?? t.kpi_achievement ?? "",
            Percentage_Achievement:
              t.Percentage_Achievement ?? t.score_achievement_alt ?? 0,
            Score_Achievement: t.Score_Achievement ?? t.score_achievement ?? 0,
            Type:
              t.Type ??
              (t.entry_type === "Editable" ? "" : t.entry_type) ??
              "+",
            Sum: t.Sum ?? t.sum_value ?? "",
            obj_weight: t.obj_weight ?? "",
            category: t.category ?? "MainTasks",
            personal_code: t.personal_code ?? "",
            full_name: fixText(t.full_name ?? ""),
            direct_management: fixText(t.direct_management ?? ""),
            role: fixText(t.role ?? ""),
            departman: t.departman ?? "",
          }));
          console.log(
            "[BulkAssign] mapped rows set to entries:",
            mapped.length
          );
          setEntries(mapped);
          if (mapped.length === 0) {
            toast.info("No KPI entries found for your direct reports");
          }
        } else {
          // Non-management: mirror PeopleWorks flow (attempts, merge, filter, map)
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
          console.log("[BulkAssign] non-management attempts:", attempts);
          const results = await Promise.all(
            attempts.map((p) =>
              kpiApi
                .fetchSubordinateEntries(p)
                .then((resp) => resp)
                .catch(() => null)
            )
          );
          results.forEach((resp, idx) => {
            const arr = Array.isArray(resp) ? resp : resp?.tasks || [];
            console.log(
              `[BulkAssign] non-management attempt ${idx} rows:`,
              arr.length
            );
          });
          const taskMap = new Map();
          results.forEach((resp) => {
            const arr = Array.isArray(resp) ? resp : resp?.tasks || [];
            arr.forEach((t) => {
              const key = t.row ?? t.id;
              if (key == null) return;
              if (!taskMap.has(key)) taskMap.set(key, t);
            });
          });
          const merged = Array.from(taskMap.values());
          console.log(
            "[BulkAssign] non-management merged rows:",
            merged.length
          );
          const managerFull = fixText(managerName || "").trim();
          const filteredByManager = merged.filter((t) => {
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
          console.log(
            "[BulkAssign] non-management filtered rows:",
            filteredByManager.length
          );
          const normalized = filteredByManager.map((t) => ({
            row: t.row ?? t.id,
            KPIFa: fixText(t.KPIFa ?? t.kpi_fa ?? ""),
            KPIEn: t.KPIEn ?? t.kpi_en ?? "",
            KPI_Info: fixText(t.KPI_Info ?? t.kpi_info ?? ""),
            target: t.target ?? "",
            KPI_weight: t.KPI_weight ?? t.kpi_weight ?? "",
            KPI_Achievement: t.KPI_Achievement ?? t.kpi_achievement ?? "",
            Percentage_Achievement:
              t.Percentage_Achievement ?? t.score_achievement_alt ?? 0,
            Score_Achievement: t.Score_Achievement ?? t.score_achievement ?? 0,
            Type:
              t.Type ??
              (t.entry_type === "Editable" ? "" : t.entry_type) ??
              "+",
            Sum: t.Sum ?? t.sum_value ?? "",
            obj_weight: t.obj_weight ?? "",
            category: t.category ?? "MainTasks",
            personal_code: t.personal_code ?? "",
            full_name: fixText(t.full_name ?? ""),
            direct_management: fixText(t.direct_management ?? ""),
            role: fixText(t.role ?? ""),
            departman: t.departman ?? "",
          }));
          console.log(
            "[BulkAssign] non-management normalized rows:",
            normalized.length
          );
          setEntries(normalized);
        }
      } catch (error) {
        console.error("Error fetching KPI entries:", error);
        toast.error("خطا در دریافت داده‌ها");
        setEntries([]);
      } finally {
        console.log("[BulkAssign] loadingEntries=false");
        setLoadingEntries(false);
      }
    };

    fetchEntries();
  }, [managerName, managerDepartman, managerPersonalCode, isManagement]);

  const normalizePersianChars = (s) =>
    String(s).replaceAll("ي", "ی").replaceAll("ك", "ک");
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

  const formatPercentDisplay = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    let num = n;
    if (num > 0 && num <= 1) num = num * 100;
    while (num > 100) num = num / 10;
    return Math.round(num).toString();
  };

  const uniqueValues = useMemo(() => {
    const s = {
      KPIFa: new Set(),
      KPIEn: new Set(),
      KPI_Info: new Set(),
      target: new Set(),
      Type: new Set(),
      KPI_weight: new Set(),
      category: new Set(),
      obj_weight: new Set(),
    };
    entries.forEach((e) => {
      if (e.KPIFa) s.KPIFa.add(String(e.KPIFa));
      if (e.KPIEn) s.KPIEn.add(String(e.KPIEn));
      if (e.KPI_Info) s.KPI_Info.add(String(e.KPI_Info));
      if (e.Type) s.Type.add(String(e.Type));
      if (e.category) s.category.add(String(e.category));
      if (e.target !== "" && e.target !== null && e.target !== undefined)
        s.target.add(formatPercentDisplay(e.target));
      if (
        e.KPI_weight !== "" &&
        e.KPI_weight !== null &&
        e.KPI_weight !== undefined
      )
        s.KPI_weight.add(formatPercentDisplay(e.KPI_weight));
      if (
        e.obj_weight !== "" &&
        e.obj_weight !== null &&
        e.obj_weight !== undefined
      )
        s.obj_weight.add(formatPercentDisplay(e.obj_weight));
    });
    const toArr = (set) => Array.from(set.values()).sort();
    return {
      KPIFa: toArr(s.KPIFa),
      KPIEn: toArr(s.KPIEn),
      KPI_Info: toArr(s.KPI_Info),
      target: toArr(s.target),
      Type: toArr(s.Type),
      KPI_weight: toArr(s.KPI_weight),
      category: toArr(s.category),
      obj_weight: toArr(s.obj_weight),
    };
  }, [entries]);

  const uniqueUsers = useMemo(() => {
    const m = new Map();
    const mgrName = String(managerName || "").trim();
    const mgrCode = String(managerPersonalCode || "");
    entries.forEach((e) => {
      const code = String(e.personal_code || "");
      const full = String(e.full_name || "").trim();
      const role = String(e.role || "").trim();
      const key = `${code}_${full}`;
      if (!full) return;
      if (full === mgrName) return;
      if (role && /مدیر/i.test(role)) return;
      if (code && code === mgrCode) return;
      const u = m.get(key) || {
        personal_code: e.personal_code,
        full_name: e.full_name,
        role: e.role,
        direct_management: e.direct_management,
        departman: e.departman,
        entry_count: 0,
      };
      u.entry_count += 1;
      m.set(key, u);
    });
    return Array.from(m.values());
  }, [entries, managerPersonalCode, managerName]);

  const filteredEntries = useMemo(() => {
    const q = normalizePersianChars(String(searchKpi)).toLowerCase();
    return entries.filter((e) => {
      const bySearch = normalizePersianChars(e.KPIFa).toLowerCase().includes(q);
      if (!bySearch) return false;
      if (
        filters.KPIFa &&
        normalizePersianChars(String(e.KPIFa)) !==
          normalizePersianChars(String(filters.KPIFa))
      )
        return false;
      if (filters.KPIEn && String(e.KPIEn) !== String(filters.KPIEn))
        return false;
      if (filters.KPI_Info && String(e.KPI_Info) !== String(filters.KPI_Info))
        return false;
      if (filters.Type && String(e.Type) !== String(filters.Type)) return false;
      if (filters.category && String(e.category) !== String(filters.category))
        return false;
      if (
        filters.target &&
        formatPercentDisplay(e.target) !== String(filters.target)
      )
        return false;
      if (
        filters.KPI_weight &&
        formatPercentDisplay(e.KPI_weight) !== String(filters.KPI_weight)
      )
        return false;
      if (
        filters.obj_weight &&
        formatPercentDisplay(e.obj_weight) !== String(filters.obj_weight)
      )
        return false;
      return true;
    });
  }, [entries, searchKpi, filters]);

  const isLight = document.documentElement.classList.contains("light");

  const toggleUser = (code) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleAssignKpi = async () => {
    if (selectedUsers.size === 0) {
      toast.warning("Please select at least one user");
      return;
    }

    // For management users, ensure they can only assign to their direct reports
    if (isManagement) {
      const validUsers = [];
      const invalidUsers = [];

      // Check each selected user to ensure they are direct reports
      for (const userCode of selectedUsers) {
        try {
          const userResponse = await kpiApi.fetchSubordinateEntries({
            manager: managerName,
            personal_code: userCode,
            departman: managerDepartman,
            category: "All",
            not_managed: false,
            outside_department: false,
          });
          const arr = Array.isArray(userResponse)
            ? userResponse
            : userResponse?.tasks || [];
          if (arr.length > 0) validUsers.push(userCode);
          else invalidUsers.push(userCode);
        } catch (error) {
          console.error("Error validating user:", error);
          invalidUsers.push(userCode);
        }
      }

      if (invalidUsers.length > 0) {
        toast.error(
          `You can only assign KPIs to your direct reports. ${invalidUsers.length} user(s) not authorized.`
        );
        return;
      }
    }

    try {
      if (!selectedRow) {
        toast.error("ابتدا یک KPI را انتخاب کنید");
        return;
      }
      const targets =
        scope === "all" || selectedUsers.size === 0
          ? uniqueUsers
          : uniqueUsers.filter((u) =>
              selectedUsers.has(String(u.personal_code))
            );
      if (targets.length === 0) {
        toast.error("کاربری یافت نشد");
        return;
      }
      setIsSubmitting(true);
      const results = await Promise.allSettled(
        targets.map((p) => {
          const payload = {
            personal_code: p.personal_code,
            full_name: p.full_name || "",
            company_name: "",
            role: p.role || "",
            direct_management: p.direct_management || managerName || "",
            departman: p.departman || managerDepartman || "",
            category: selectedRow.category || "MainTasks",
            tasks: [
              {
                obj_weight: selectedRow.obj_weight || "",
                KPIEn: selectedRow.KPIEn || "",
                KPIFa: selectedRow.KPIFa || "",
                KPI_Info: selectedRow.KPI_Info || "",
                target: selectedRow.target || "",
                KPI_weight: selectedRow.KPI_weight || "",
                KPI_Achievement: selectedRow.KPI_Achievement || "",
                Percentage_Achievement:
                  selectedRow.Percentage_Achievement || "",
                Score_Achievement: selectedRow.Score_Achievement || "",
                Type: selectedRow.Type || "+",
                Sum: selectedRow.Sum || "",
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"افزودن ردیف KPI گروهی"} />
      <ToastContainer position="top-center" autoClose={1500} rtl={true} />
      <main className="w-full lg:px-8 mb-10 mt-10" dir="rtl">
        <div
          className={`w-full max-w-full mx-auto rounded-lg shadow p-4 ${
            isLight ? "bg-white" : "bg-gray-800"
          }`}
        >
          <button
            onClick={() => navigate("/kpipeopleworks")}
            className={`px-3 py-2 rounded mb-2 cursor-pointer ${
              isLight
                ? "bg-gray-200 hover:bg-gray-300"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          >
            بازگشت
          </button>
          <div className="grid grid-cols-1 gap-6">
            {scope !== "all" && (
              <div
                className={`backdrop-blur-md shadow-lg rounded-xl p-4 border ${
                  isLight
                    ? "bg-white/90 border-gray-200"
                    : "bg-gray-800/60 border-gray-700"
                }`}
                dir="rtl"
              >
                <h3
                  className={`text-lg font-semibold ${
                    isLight ? "text-gray-900" : "text-gray-200"
                  } mb-4`}
                >
                  کاربران
                </h3>
                {uniqueUsers.length === 0 ? (
                  <div className={isLight ? "text-gray-700" : "text-gray-300"}>
                    کاربری یافت نشد
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {uniqueUsers.map((user) => {
                      const active = selectedUsers.has(
                        String(user.personal_code)
                      );
                      return (
                        <div
                          key={`${user.personal_code}_${user.full_name}`}
                          className={`backdrop-blur-md shadow-lg rounded-xl p-4 border cursor-pointer ${
                            isLight
                              ? "bg-white/90 border-gray-200"
                              : "bg-gray-800/60 border-gray-700"
                          }`}
                          onClick={() => toggleUser(String(user.personal_code))}
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
                                انتخاب
                              </span>
                              <div
                                className={`w-11 h-6 ${
                                  active ? "bg-yellow-600" : "bg-gray-600"
                                } rounded-full relative`}
                              >
                                <div
                                  className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform ${
                                    active
                                      ? "translate-x-full"
                                      : "translate-x-0"
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div
              className={`backdrop-blur-md shadow-lg rounded-xl p-4 border ${
                isLight
                  ? "bg-white/90 border-gray-200"
                  : "bg-gray-800/60 border-gray-700"
              }`}
              dir="rtl"
            >
              <div
                className={`mb-3 flex items-center justify-between ${
                  isLight ? "text-gray-900" : "text-gray-200"
                }`}
              >
                <span>جدول KPI های دپارتمان</span>
                <div className="flex items-center gap-2">
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className={`px-3 py-2 rounded ${
                      isLight
                        ? "bg-white text-gray-900 border border-gray-300"
                        : "bg-gray-800 text-gray-200 border border-gray-600"
                    }`}
                  >
                    <option value="selected">انتخاب‌های کاربر</option>
                    <option value="all">همه کاربران دپارتمان</option>
                  </select>
                  <button
                    onClick={() => setModalOpen(true)}
                    className={`px-3 py-2 rounded cursor-pointer ${
                      isLight
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-indigo-700 text-white hover:bg-indigo-600"
                    }`}
                  >
                    ایجاد KPI جدید
                  </button>
                  <button
                    onClick={handleAssignKpi}
                    disabled={isSubmitting}
                    className={`px-3 py-2 rounded cursor-pointer ${
                      isLight
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-700 text-white hover:bg-blue-600"
                    } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    افزودن این KPI
                  </button>
                </div>
              </div>
              <div className="mb-4" dir="rtl">
                <input
                  value={searchKpi}
                  onChange={(e) => setSearchKpi(e.target.value)}
                  placeholder="جستجوی KPI"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-800 text-gray-200 border-gray-600"
                  }`}
                />
              </div>
              {loadingEntries ? (
                <div className={isLight ? "text-gray-700" : "text-gray-300"}>
                  در حال دریافت KPI ها...
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className={isLight ? "text-gray-700" : "text-gray-300"}>
                  KPI ای ثبت نشده است
                </div>
              ) : (
                <div
                  className={`mt-3 overflow-auto pt-3 ${
                    isLight
                      ? "border-t border-gray-200"
                      : "border-t border-gray-600"
                  }`}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-center">
                        <th
                          className={`px-2 py-2 ${
                            isLight ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          #
                        </th>
                        <th className="px-2 py-2 text-gray-400">KPI Farsi</th>
                        <th className="px-2 py-2 text-gray-400">KPI English</th>
                        <th className="px-2 py-2 text-gray-400">KPI Info</th>
                        <th className="px-2 py-2 text-gray-400">Target</th>
                        <th className="px-2 py-2 text-gray-400">Type</th>
                        <th className="px-2 py-2 text-gray-400">Weight</th>
                        <th className="px-2 py-2 text-gray-400">Category</th>
                        <th className="px-2 py-2 text-gray-400">
                          Object Weight
                        </th>
                      </tr>
                      <tr className="text-center">
                        <th className="px-2 py-1"></th>
                        <th className="px-2 py-1">
                          <select
                            value={filters.KPIFa}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                KPIFa: e.target.value,
                              }))
                            }
                            className={`w-full px-2 py-1 border rounded ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            } text-xs`}
                          >
                            <option value="">All</option>
                            {uniqueValues.KPIFa.map((v) => (
                              <option key={String(v)} value={String(v)}>
                                {String(v)}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="px-2 py-1">
                          <select
                            value={filters.KPIEn}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                KPIEn: e.target.value,
                              }))
                            }
                            className={`w-full px-2 py-1 border rounded ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            } text-xs`}
                          >
                            <option value="">All</option>
                            {uniqueValues.KPIEn.map((v) => (
                              <option key={String(v)} value={String(v)}>
                                {String(v)}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="px-2 py-1">
                          <select
                            value={filters.KPI_Info}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                KPI_Info: e.target.value,
                              }))
                            }
                            className={`w-full px-2 py-1 border rounded ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            } text-xs`}
                          >
                            <option value="">All</option>
                            {uniqueValues.KPI_Info.map((v) => (
                              <option key={String(v)} value={String(v)}>
                                {String(v)}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="px-2 py-1">
                          <select
                            value={filters.target}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                target: e.target.value,
                              }))
                            }
                            className={`w-full px-2 py-1 border rounded ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            } text-xs`}
                          >
                            <option value="">All</option>
                            {uniqueValues.target.map((v) => (
                              <option key={String(v)} value={String(v)}>
                                {String(v)}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="px-2 py-1">
                          <select
                            value={filters.Type}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                Type: e.target.value,
                              }))
                            }
                            className={`w-full px-2 py-1 border rounded ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            } text-xs`}
                          >
                            <option value="">All</option>
                            {uniqueValues.Type.map((v) => (
                              <option key={String(v)} value={String(v)}>
                                {String(v)}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="px-2 py-1">
                          <select
                            value={filters.KPI_weight}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                KPI_weight: e.target.value,
                              }))
                            }
                            className={`w-full px-2 py-1 border rounded ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            } text-xs`}
                          >
                            <option value="">All</option>
                            {uniqueValues.KPI_weight.map((v) => (
                              <option key={String(v)} value={String(v)}>
                                {String(v)}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="px-2 py-1">
                          <select
                            value={filters.category}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                category: e.target.value,
                              }))
                            }
                            className={`w-full px-2 py-1 border rounded ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            } text-xs`}
                          >
                            <option value="">All</option>
                            {uniqueValues.category.map((v) => (
                              <option key={String(v)} value={String(v)}>
                                {String(v)}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="px-2 py-1">
                          <select
                            value={filters.obj_weight}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                obj_weight: e.target.value,
                              }))
                            }
                            className={`w-full px-2 py-1 border rounded ${
                              isLight
                                ? "bg-white text-gray-900 border-gray-300"
                                : "bg-gray-800 text-gray-200 border-gray-600"
                            } text-xs`}
                          >
                            <option value="">All</option>
                            {uniqueValues.obj_weight.map((v) => (
                              <option key={String(v)} value={String(v)}>
                                {String(v)}
                              </option>
                            ))}
                          </select>
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isLight ? "divide-gray-300" : "divide-gray-700"
                      } text-center`}
                    >
                      {filteredEntries.map((row, index) => {
                        const active = selectedRow?.row === row.row;
                        return (
                          <tr
                            key={row.row}
                            onClick={() => setSelectedRow(row)}
                            className={`${
                              active
                                ? isLight
                                  ? "bg-blue-100"
                                  : "bg-blue-900"
                                : isLight
                                ? "bg-white hover:bg-gray-200"
                                : "bg-gray-800 hover:bg-gray-700"
                            } cursor-pointer`}
                          >
                            <td
                              className={`px-2 py-2 ${
                                isLight ? "text-gray-700" : "text-gray-300"
                              }`}
                            >
                              {index + 1}
                            </td>
                            <td
                              className={`px-2 py-2 ${
                                isLight ? "text-gray-700" : "text-gray-300"
                              }`}
                            >
                              {row.KPIFa}
                            </td>
                            <td
                              className={`px-2 py-2 ${
                                isLight ? "text-gray-700" : "text-gray-300"
                              }`}
                            >
                              {row.KPIEn}
                            </td>
                            <td
                              className={`px-2 py-2 ${
                                isLight ? "text-gray-700" : "text-gray-300"
                              }`}
                            >
                              {row.KPI_Info}
                            </td>
                            <td
                              className={`px-2 py-2 ${
                                isLight ? "text-gray-700" : "text-gray-300"
                              }`}
                            >
                              {formatPercentDisplay(row.target)}
                            </td>
                            <td
                              className={`px-2 py-2 ${
                                isLight ? "text-gray-700" : "text-gray-300"
                              }`}
                            >
                              {row.Type || ""}
                            </td>
                            <td
                              className={`px-2 py-2 ${
                                isLight ? "text-gray-700" : "text-gray-300"
                              }`}
                            >
                              {formatPercentDisplay(row.KPI_weight)}
                            </td>
                            <td
                              className={`px-2 py-2 ${
                                isLight ? "text-gray-700" : "text-gray-300"
                              }`}
                            >
                              {row.category}
                            </td>
                            <td
                              className={`px-2 py-2 ${
                                isLight ? "text-gray-700" : "text-gray-300"
                              }`}
                            >
                              {formatPercentDisplay(row.obj_weight)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-400 opacity-25"
            onClick={() => setModalOpen(false)}
          ></div>
          <div
            className={`relative w-full max-w-2xl rounded-lg shadow-lg p-6 ${
              isLight ? "bg-white" : "bg-gray-800"
            }`}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`${
                  isLight ? "text-gray-900" : "text-gray-100"
                } text-lg font-semibold`}
              >
                ایجاد KPI جدید
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className={`${
                  isLight
                    ? "text-gray-600 hover:text-gray-800"
                    : "text-gray-300 hover:text-gray-100"
                }`}
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  شرکت
                </label>
                <input
                  value={newKpi.company_name}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, company_name: e.target.value }))
                  }
                  placeholder="Company Name"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  فصل
                </label>
                <input
                  value={newKpi.season}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, season: e.target.value }))
                  }
                  placeholder="Quarter"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  کد پرسنلی
                </label>
                <input
                  value={newKpi.personal_code}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, personal_code: e.target.value }))
                  }
                  placeholder="Personel Code"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  نام و نام‌خانوادگی
                </label>
                <input
                  value={newKpi.full_name}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, full_name: e.target.value }))
                  }
                  placeholder="Full Name"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  نقش
                </label>
                <input
                  value={newKpi.role}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, role: e.target.value }))
                  }
                  placeholder="Role"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  KPIFa
                </label>
                <input
                  value={newKpi.KPIFa}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, KPIFa: e.target.value }))
                  }
                  placeholder="KPI Fa"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  KPIEn
                </label>
                <input
                  value={newKpi.KPIEn}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, KPIEn: e.target.value }))
                  }
                  placeholder="KPI En"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  Target
                </label>
                <input
                  value={newKpi.target}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, target: e.target.value }))
                  }
                  placeholder="Target"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  Type
                </label>
                <select
                  value={newKpi.Type}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, Type: e.target.value }))
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                >
                  <option value="+">+</option>
                  <option value="-">-</option>
                </select>
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  KPI Weight
                </label>
                <input
                  value={newKpi.KPI_weight}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, KPI_weight: e.target.value }))
                  }
                  placeholder="KPI Weight"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  Category
                </label>
                <select
                  value={newKpi.category}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, category: e.target.value }))
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                >
                  <option value="MainTasks">MainTasks</option>
                  <option value="Project">Project</option>
                </select>
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  Object Weight
                </label>
                <input
                  value={newKpi.obj_weight}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, obj_weight: e.target.value }))
                  }
                  placeholder="Object Weight"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    isLight ? "text-gray-700" : "text-gray-400"
                  } block mb-1`}
                >
                  KPI Info
                </label>
                <input
                  value={newKpi.KPI_Info}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, KPI_Info: e.target.value }))
                  }
                  placeholder="KPI Information"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-900 text-gray-200 border-gray-700"
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className={`px-3 py-2 rounded ${
                  isLight
                    ? "bg-gray-200 hover:bg-gray-300"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                انصراف
              </button>
              <button
                onClick={async () => {
                  const v = newKpi;
                  if (!String(v.KPIFa || v.KPIEn || "").trim()) {
                    toast.error("نام KPI را وارد کنید");
                    return;
                  }
                  try {
                    const payload = {
                      personal_code: v.personal_code || "",
                      full_name: v.full_name || "",
                      company_name: v.company_name || "",
                      role: v.role || "",
                      direct_management: managerName || "",
                      departman: managerDepartman || "",
                      season: v.season || "",
                      category: v.category,
                      tasks: [
                        {
                          obj_weight: v.obj_weight,
                          KPIEn: v.KPIEn,
                          KPIFa: v.KPIFa,
                          KPI_Info: v.KPI_Info,
                          target: v.target,
                          KPI_weight: v.KPI_weight,
                          KPI_Achievement: "",
                          Percentage_Achievement: "",
                          Score_Achievement: "",
                          Type: v.Type,
                          Sum: "",
                        },
                      ],
                    };
                    const resp = await kpiApi.submitKPIEntry(payload);
                    const created = Array.isArray(resp?.data)
                      ? resp.data[0]
                      : resp?.data?.[0];
                    if (!created) {
                      throw new Error("خطا در ایجاد KPI");
                    }
                    const row = {
                      row: created.row,
                      KPIFa: fixText(created.kpi_fa || v.KPIFa),
                      KPIEn: created.kpi_en || v.KPIEn,
                      KPI_Info: fixText(created.kpi_info || v.KPI_Info),
                      target: created.target ?? v.target,
                      KPI_weight: created.kpi_weight ?? v.KPI_weight,
                      KPI_Achievement: created.kpi_achievement ?? "",
                      Percentage_Achievement:
                        created.score_achievement_alt ?? "",
                      Score_Achievement: created.score_achievement ?? "",
                      Type: created.entry_type || v.Type,
                      Sum: created.sum_value ?? "",
                      obj_weight: created.obj_weight ?? v.obj_weight,
                      category: created.category || v.category,
                      personal_code: created.personal_code || "",
                      full_name: fixText(created.full_name || ""),
                      direct_management:
                        created.direct_management || managerName || "",
                      role: created.role || "",
                      departman: created.departman || managerDepartman || "",
                    };
                    setEntries((prev) => [row, ...prev]);
                    setSelectedRow(row);
                    setModalOpen(false);
                    toast.success("KPI جدید ذخیره شد");
                  } catch (e) {
                    toast.error("ذخیره KPI ناموفق بود");
                  }
                }}
                className={`px-3 py-2 rounded ${
                  isLight
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-700 text-white hover:bg-blue-600"
                }`}
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KpiBulkAssign;
