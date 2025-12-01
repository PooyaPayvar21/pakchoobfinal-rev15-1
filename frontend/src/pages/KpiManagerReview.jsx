import React, { useEffect, useState, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import Header from "../components/Common/Header";
import { kpiApi } from "../services/kpiApi";

const KpiManagerReview = () => {
  const managerName = useMemo(() => {
    try {
      const info = JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
      return info.full_name || "";
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
    target: "",
    KPI_weight: "",
    KPI_Achievement: "",
    Percentage_Achievement: "",
    Score_Achievement: "",
    Type: "",
    Sum: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const managerDepartman = useMemo(() => {
    try {
      const info = JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
      return info.departman || "";
    } catch {
      return "";
    }
  }, []);

  // remove unused options fetch

  const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
  const formatPercent = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return (n * 100).toString();
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

  const fetchEntries = async () => {
    if (!managerName) {
      return;
    }
    try {
      console.log("[KpiManagerReview] Fetching entries with:", {
        manager: managerName,
        category,
        departman: managerDepartman,
      });
      const response = await kpiApi.fetchSubordinateEntries({
        manager: managerName,
        category,
        departman: managerDepartman,
        not_managed: false,
        outside_department: false,
      });
      const tasks = Array.isArray(response) ? response : response?.tasks || [];
      console.log("[KpiManagerReview] Received tasks:", tasks.length, tasks);
      if (response?.debug) {
        console.log("[KpiManagerReview] Debug info:", response.debug);
        if (tasks.length === 0 && response.debug.entries_with_manager === 0) {
          console.warn(
            "[KpiManagerReview] No entries found with manager name. Sample managers in DB:",
            response.debug.sample_direct_managements
          );
          if (response.debug.entries_in_department !== undefined) {
            console.warn(
              `[KpiManagerReview] Found ${response.debug.entries_in_department} entries in department "${managerDepartman}"`
            );
            if (response.debug.sample_users_in_department) {
              console.warn(
                "[KpiManagerReview] Sample users in department:",
                response.debug.sample_users_in_department
              );
            }
            if (response.debug.direct_managements_in_department) {
              console.warn(
                "[KpiManagerReview] Direct management values in this department:",
                response.debug.direct_managements_in_department
              );
            }
          }
        }
      }
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

  const clearFilters = () => {
    setFilters({
      caseOwner: "",
      obj_weight: "",
      KPIEn: "",
      KPIFa: "",
      KPI_Info: "",
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
          "کاربر دارای کارهای تایید شده است و امکان تغییر وضعیت وجود ندارد"
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
        toast.success(`اجازه ویرایش از ${fullName} گرفته شد`);
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
        toast.success(`اجازه ویرایش به ${fullName} داده شد`);
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
        wasEditable ? "خطا در گرفتن اجازه ویرایش" : "خطا در دادن اجازه ویرایش"
      );
    }
  };

  // Get unique users from entries
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    entries.forEach((entry) => {
      const key = `${entry.personal_code}_${entry.full_name}`;
      if (!userMap.has(key)) {
        userMap.set(key, {
          personal_code: entry.personal_code,
          full_name: entry.full_name,
          entry_count: 0,
          has_edit_permission: false,
          has_confirmed_works: false,
        });
      }
      const user = userMap.get(key);
      user.entry_count += 1;

      // Check if any entry has edit permission
      if (entry.Status === "Editable") {
        user.has_edit_permission = true;
      }

      // Check if any entry is confirmed
      if (entry.Type === "Confirmed" || entry.Status === "Confirmed") {
        user.has_confirmed_works = true;
        // If user has confirmed works, they shouldn't have edit permission
        user.has_edit_permission = false;
      }
    });
    return Array.from(userMap.values());
  }, [entries]);

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

  const filteredEntries = useMemo(
    () =>
      entries.filter((row) => {
        return Object.entries(filters).every(([key, filterValue]) => {
          if (!filterValue) return true;

          if (key === "caseOwner") {
            const display = `${row.full_name} (${row.personal_code})`;
            return String(display) === String(filterValue);
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

  const isLight = document.documentElement.classList.contains("light");

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"بازبینی مدیر مستقیم KPI"} />
      <ToastContainer position="top-center" autoClose={1500} rtl={true} />
      <main className="w-full lg:px-8 mb-10" dir="rtl">
        <div className="mt-8 px-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {uniqueUsers.map((user) => (
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
                          اجازه ویرایش
                        </span>
                        <div className="relative group">
                          <label
                            className={`relative inline-flex items-center ${
                              user.has_confirmed_works
                                ? "cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={user.has_edit_permission}
                              onChange={() =>
                                !user.has_confirmed_works &&
                                handleToggleEditPermission(
                                  user.personal_code,
                                  user.full_name,
                                  user.has_edit_permission ? "Editable" : ""
                                )
                              }
                              disabled={user.has_confirmed_works}
                              className="sr-only peer"
                            />
                            <div
                              className={`w-11 h-6 ${
                                user.has_confirmed_works
                                  ? "bg-gray-700"
                                  : "bg-gray-600"
                              } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                user.has_confirmed_works
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

          <div
            className={`mt-6 overflow-auto pt-6 text-center ${
              isLight ? "border-t border-gray-200" : "border-t border-gray-600"
            }`}
          >
            <table className="w-full text-sm mb-5">
              <thead>
                <tr className="text-center">
                  <th className="px-2 py-2 text-gray-400">#</th>
                  <th className="px-2 py-2 text-gray-400">پرونده</th>
                  <th className="px-2 py-2 text-gray-400">Object Weight</th>
                  <th className="px-2 py-2 text-gray-400">KPI English</th>
                  <th className="px-2 py-2 text-gray-400">KPI Farsi</th>
                  <th className="px-2 py-2 text-gray-400">KPI Info</th>
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
                <tr className="text-center bg-gray-900">
                  <th className="px-2 py-1 text-gray-400"></th>
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
                  isLight ? "divide-gray-200" : "divide-gray-700"
                } text-center`}
              >
                {filteredEntries
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((row, index) => (
                    <tr
                      className={`${
                        isLight
                          ? "bg-white hover:bg-gray-50"
                          : "bg-gray-800 hover:bg-gray-700"
                      } align-top`}
                    >
                      <td className="px-2 py-2 text-gray-800">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-2 py-2 text-gray-700">
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
                          className={`w-28 px-2 py-1 border rounded-lg ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-900 text-gray-200 border-gray-600"
                          }`}
                          disabled={row.Status === "Confirmed"}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="any"
                          value={row.Score_Achievement}
                          onChange={(e) =>
                            handleChange(
                              row.id,
                              "Score_Achievement",
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                          placeholder="Score"
                          className={`w-28 px-2 py-1 border rounded-lg ${
                            isLight
                              ? "bg-white text-gray-900 border-gray-300"
                              : "bg-gray-900 text-gray-200 border-gray-600"
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
                              : "bg-gray-700 text-gray-200")
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
                            disabled={!row._dirty || row.Status === "Confirmed"}
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
                          <button
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
                                    r.id === row.id && r.Status !== "Confirmed"
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
                          </button>
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
                  const total = filteredEntries.reduce(
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
                  { length: Math.ceil(filteredEntries.length / pageSize) },
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
                        Math.ceil(filteredEntries.length / pageSize) || 1,
                        p + 1
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    (Math.ceil(filteredEntries.length / pageSize) || 1)
                  }
                  className="bg-gray-600 cursor-pointer disabled:opacity-50 hover:bg-gray-700 text-white px-3 py-1 rounded"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KpiManagerReview;
