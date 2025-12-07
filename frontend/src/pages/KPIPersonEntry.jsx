import React, { useState, useMemo } from "react";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { kpiApi } from "../services/kpiApi";
import * as XLSX from "xlsx";

function KPIPersonEntry() {
  const [form, setForm] = useState({
    company_name: "",
    season: "",
    personal_code: "",
    full_name: "",
    role: "",
    direct_management: "",
    departman: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const isLight = useMemo(() => {
    try {
      return document.documentElement.classList.contains("dark");
    } catch {
      return false;
    }
  }, []);
  const [excelFileName, setExcelFileName] = useState("");
  const [parsedEntries, setParsedEntries] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ total: 0, done: 0 });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // basic validation
    if (!form.company_name || !form.personal_code || !form.full_name) {
      toast.error("لطفا نام شرکت، کد پرسنلی و نام کامل را وارد کنید");
      return;
    }
    setSubmitting(true);
    try {
      const resp = await kpiApi.submitKPIEntry(form);
      console.log("KPIPersonEntry response:", resp);
      toast.success("اطلاعات با موفقیت ثبت شد");
      setForm({
        company_name: "",
        personal_code: "",
        full_name: "",
        role: "",
        direct_management: "",
        departman: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("خطا در ثبت اطلاعات");
    } finally {
      setSubmitting(false);
    }
  };

  const normalizeHeader = (h) => {
    return String(h || "")
      .replaceAll("ي", "ی")
      .replaceAll("ك", "ک")
      .replace(/[\u200c\u200e\u200f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
  };

  const parseSheetRows = (ws) => {
    const rowsAoA = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (!Array.isArray(rowsAoA) || rowsAoA.length === 0) return [];
    const synonyms = [
      "personal_code",
      "کد پرسنلی",
      "code",
      "person_code",
      "full_name",
      "نام کامل",
      "name",
      "fullname",
      "نام و نام خانوادگی",
      "company_name",
      "شرکت",
      "company",
      "نام شرکت",
      "role",
      "نقش",
      "position",
      "سمت",
      "kpi_role",
      "direct_management",
      "مدیریت مستقیم",
      "manager",
      "مدیر مستقیم",
      "مدیریت",
      "departman",
      "دپارتمان",
      "department",
      "واحد",
      "بخش",
      "قسمت",
      "category",
      "Category",
      "category_name",
      "cat",
      "group",
      "Group",
      "group_name",
    ];
    const synSet = new Set(synonyms.map((s) => normalizeHeader(s)));
    let headerIdx = 0;
    for (let i = 0; i < rowsAoA.length; i++) {
      const row = rowsAoA[i];
      const hits = (Array.isArray(row) ? row : []).reduce((acc, cell) => {
        const n = normalizeHeader(cell);
        return acc + (synSet.has(n) ? 1 : 0);
      }, 0);
      if (hits >= 2) {
        headerIdx = i;
        break;
      }
    }
    const headerRow = rowsAoA[headerIdx] || [];
    const headersNorm = headerRow.map((cell) => normalizeHeader(cell));
    const result = [];
    for (let i = headerIdx + 1; i < rowsAoA.length; i++) {
      const row = rowsAoA[i] || [];
      const obj = {};
      headersNorm.forEach((h, idx) => {
        if (!h) return;
        const v = row[idx] ?? "";
        obj[h] = typeof v === "string" ? v.trim() : v;
      });
      const anyVal = Object.values(obj).some((v) => String(v).trim() !== "");
      if (anyVal) result.push(obj);
    }
    return result;
  };

  const mapRowToTask = (row) => {
    const r = {};
    Object.keys(row || {}).forEach((k) => {
      r[normalizeHeader(k)] = row[k];
    });
    return {
      obj_weight: r.obj_weight ?? r.object_weight ?? r["objweight"] ?? "",
      KPIEn: r.kpi_en ?? r.kpi_english ?? r["kpien"] ?? "",
      KPIFa: r.kpi_fa ?? r.kpi_farsi ?? r["kpifa"] ?? "",
      KPI_Info: r.kpi_info ?? r.description ?? r["kpiinfo"] ?? "",
      target: r.target ?? r.goal ?? "",
      KPI_weight: r.kpi_weight ?? r["kpiweight"] ?? "",
      KPI_Achievement: r.kpi_achievement ?? r.achievement ?? "",
      Percentage_Achievement:
        r.percentage_achievement ?? r.percent_achievement ?? "",
      Score_Achievement: r.score_achievement ?? r.score ?? "",
      Type: r.type ?? r.entry_type ?? "",
      Sum: r.sum ?? r.sum_value ?? "",
    };
  };

  const handleExcelChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setExcelFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const ws = workbook.Sheets[firstSheetName];
          const rows = parseSheetRows(ws);
          if (!Array.isArray(rows) || rows.length === 0) {
            toast.error("فایل اکسل خالی است یا قابل خواندن نیست");
            setParsedEntries([]);
            return;
          }
          const groups = new Map();
          rows.forEach((row) => {
            const by = (keys) => {
              for (const key of keys) {
                const v = row[key];
                if (v != null && String(v).trim() !== "")
                  return String(v).trim();
              }
              const normMap = new Map();
              Object.keys(row || {}).forEach((rk) => {
                normMap.set(normalizeHeader(rk), row[rk]);
              });
              for (const key of keys) {
                const v = normMap.get(normalizeHeader(key));
                if (v != null && String(v).trim() !== "")
                  return String(v).trim();
              }
              return "";
            };
            const personal_code = by([
              "personal_code",
              "کد پرسنلی",
              "code",
              "person_code",
            ]);
            if (!personal_code) return;
            const company_name = by([
              "company_name",
              "شرکت",
              "company",
              "نام شرکت",
            ]);
            let full_name = by([
              "full_name",
              "نام کامل",
              "name",
              "fullname",
              "نام و نام خانوادگی",
            ]);
            if (!full_name) {
              const first = by(["first_name", "firstname", "نام"]);
              const last = by(["last_name", "lastname", "نام خانوادگی"]);
              const combined = `${first || ""} ${last || ""}`.trim();
              full_name = combined;
            }
            const role = by(["role", "نقش", "position", "سمت", "kpi_role"]);
            const direct_management = by([
              "direct_management",
              "مدیریت مستقیم",
              "manager",
              "مدیر مستقیم",
              "مدیریت",
            ]);
            const departman = by([
              "departman",
              "دپارتمان",
              "department",
              "واحد",
              "بخش",
              "قسمت",
            ]);
            const category = (() => {
              const c = by([
                "category",
                "Category",
                "category_name",
                "cat",
                "group",
                "Group",
                "group_name",
                "دسته",
                "دسته بندی",
                "دسته‌بندی",
                "گروه",
                "گروه بندی",
                "گروه‌بندی",
              ]);
              if (c) return c;
              const name = String(excelFileName || "").toLowerCase();
              const looksProject = /project|work|fani|فنی|پروژه/.test(name);
              return looksProject ? "ProjectWorks" : "";
            })();
            let season = by(["season", "فصل", "quarter"]);
            if (!season) {
              const m = /\bQ([1-4])\b/i.exec(excelFileName || "");
              if (m) season = `Q${m[1]}`;
            }
            const task = mapRowToTask(row);
            const key = personal_code;
            const info = (() => {
              try {
                return JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
              } catch {
                return {};
              }
            })();
            const base = groups.get(key) || {
              company_name: company_name || info.company_name || "",
              season: season || info.season || "",
              personal_code,
              full_name,
              role: role || info.kpi_role || info.role || "",
              direct_management:
                direct_management || info.direct_management || "",
              departman: departman || info.departman || "",
              category: category || "MainTasks",
              tasks: [],
            };
            base.tasks.push(task);
            groups.set(key, base);
          });
          const entries = Array.from(groups.values());
          setParsedEntries(entries);
          toast.success(`فایل خوانده شد: ${entries.length} نفر`);
        } catch (err) {
          console.error(err);
          toast.error("خطا در پردازش فایل اکسل");
          setParsedEntries([]);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      toast.error("خطا در انتخاب فایل اکسل");
    }
  };

  const submitParsedEntries = async () => {
    if (!parsedEntries.length) {
      toast.error("ابتدا فایل اکسل را بارگذاری کنید");
      return;
    }
    setIsImporting(true);
    setImportProgress({ total: parsedEntries.length, done: 0 });
    let success = 0;
    for (let i = 0; i < parsedEntries.length; i++) {
      const entry = parsedEntries[i];
      try {
        await kpiApi.submitKPIEntry(entry);
        success += 1;
      } catch (err) {
        console.error("Import error", err);
      } finally {
        setImportProgress((p) => ({ total: p.total, done: i + 1 }));
      }
    }
    setIsImporting(false);
    if (success === parsedEntries.length) {
      toast.success("تمام ورودهای KPI با موفقیت ثبت شد");
    } else if (success > 0) {
      toast.warning(`ثبت شد: ${success} از ${parsedEntries.length}`);
    } else {
      toast.error("هیچ ورودی ثبت نشد");
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"ثبت اطلاعات پرسنل KPI"} />
      <ToastContainer position="top-center" autoClose={1500} rtl={true} />
      <main className="w-full lg:px-8 mb-10" dir="rtl">
        <div className="mt-8 px-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-200 mb-2">
                    شرکت
                  </label>
                  <input
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-200 mb-2">
                    کد پرسنلی
                  </label>
                  <input
                    name="personal_code"
                    value={form.personal_code}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-200 mb-2">
                    نام کامل
                  </label>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-200 mb-2">
                    نقش
                  </label>
                  <input
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-200 mb-2">
                    مدیریت مستقیم
                  </label>
                  <input
                    name="direct_management"
                    value={form.direct_management}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-200 mb-2">
                    دپارتمان
                  </label>
                  <input
                    name="departman"
                    value={form.departman}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-800 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  {submitting ? "درحال ثبت..." : "ثبت"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      company_name: "",
                      personal_code: "",
                      full_name: "",
                      role: "",
                      direct_management: "",
                      departman: "",
                    })
                  }
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  پاک کردن
                </button>
              </div>
            </div>
          </form>
          <div
            className={`mt-8 rounded-xl p-6 border ${
              isLight
                ? "bg-white border-gray-200"
                : "bg-gray-800 bg-opacity-50 border-gray-700"
            }`}
          >
            <div className="mb-4">
              <div
                className={`text-lg font-bold ${
                  isLight ? "text-gray-900" : "text-gray-100"
                }`}
              >
                ورود گروهی از Excel به جدول KPIEntry
              </div>
              <div
                className={`${
                  isLight ? "text-gray-600" : "text-gray-300"
                } text-sm`}
              >
                فایل اکسل را انتخاب کنید، پیش‌نمایش گروه‌ها نمایش داده می‌شود و
                سپس ثبت کنید
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelChange}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? "bg-white text-gray-900 border-gray-300"
                      : "bg-gray-700 text-gray-200 border-gray-600"
                  }`}
                />
                {excelFileName && (
                  <div
                    className={`${
                      isLight ? "text-gray-700" : "text-gray-300"
                    } text-sm mt-2`}
                  >
                    فایل: {excelFileName}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={submitParsedEntries}
                  disabled={!parsedEntries.length || isImporting}
                  className={`px-4 py-2 rounded-lg ${
                    !parsedEntries.length || isImporting
                      ? "bg-gray-600 text-white cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isImporting ? "در حال ثبت..." : "ثبت ورودی‌های اکسل"}
                </button>
              </div>
            </div>
            <div className="mt-4">
              <div
                className={`text-sm ${
                  isLight ? "text-gray-700" : "text-gray-300"
                }`}
              >
                تعداد کاربران شناسایی‌شده: {parsedEntries.length}
              </div>
              {isImporting && (
                <div
                  className={`text-sm ${
                    isLight ? "text-gray-700" : "text-gray-300"
                  } mt-2`}
                >
                  پیشرفت: {importProgress.done} / {importProgress.total}
                </div>
              )}
              {!!parsedEntries.length && (
                <div className="mt-4 overflow-auto max-h-64">
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="text-center border-b">
                        <th
                          className={`px-2 py-2 border-b ${
                            isLight ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          کد پرسنلی
                        </th>
                        <th
                          className={`px-2 py-2 border-b ${
                            isLight ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          نام
                        </th>
                        <th
                          className={`px-2 py-2 ${
                            isLight ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          نقش
                        </th>
                        <th
                          className={`px-2 py-2 ${
                            isLight ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          شرکت
                        </th>
                        <th
                          className={`px-2 py-2 ${
                            isLight ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          دپارتمان
                        </th>
                        <th
                          className={`px-2 py-2 ${
                            isLight ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          دسته
                        </th>
                        <th
                          className={`px-2 py-2 ${
                            isLight ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          تعداد وظایف
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedEntries.map((e) => (
                        <tr
                          key={`${e.personal_code}-${e.category}`}
                          className="text-center"
                        >
                          <td
                            className={`${
                              isLight ? "text-gray-900" : "text-gray-200"
                            } px-2 py-1`}
                          >
                            {e.personal_code}
                          </td>
                          <td
                            className={`${
                              isLight ? "text-gray-900" : "text-gray-200"
                            } px-2 py-1`}
                          >
                            {e.full_name}
                          </td>
                          <td
                            className={`${
                              isLight ? "text-gray-900" : "text-gray-200"
                            } px-2 py-1`}
                          >
                            {e.role}
                          </td>
                          <td
                            className={`${
                              isLight ? "text-gray-900" : "text-gray-200"
                            } px-2 py-1`}
                          >
                            {e.company_name}
                          </td>
                          <td
                            className={`${
                              isLight ? "text-gray-900" : "text-gray-200"
                            } px-2 py-1`}
                          >
                            {e.departman}
                          </td>
                          <td
                            className={`${
                              isLight ? "text-gray-900" : "text-gray-200"
                            } px-2 py-1`}
                          >
                            {e.category}
                          </td>
                          <td
                            className={`${
                              isLight ? "text-gray-900" : "text-gray-200"
                            } px-2 py-1`}
                          >
                            {e.tasks?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default KPIPersonEntry;
