import React, { useEffect, useState } from "react";
import Header from "../components/Common/Header";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { changePassword } from "../api";

const Settings = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [language, setLanguage] = useState("fa");
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme_preference");
    if (stored === "light" || stored === "dark") return stored;
    return document.documentElement.classList.contains("light")
      ? "light"
      : "dark";
  });
  const isLight = theme === "light";
  const [kpiSeed, setKpiSeed] = useState({
    personal_code: "",
    full_name: "حامد حاجی حسین زاده",
    company_name: "",
    role: "management",
    direct_management: "",
    departman: "فنی و مهندسی-نت",
  });

  useEffect(() => {
    const ne = localStorage.getItem("notifications_enabled");
    const ns = localStorage.getItem("notifications_sound");
    const lang = localStorage.getItem("language_preference");
    if (ne !== null) setNotificationsEnabled(ne !== "false");
    if (ns !== null) setNotificationSound(ns !== "false");
    if (lang) setLanguage(lang);
  }, []);

  useEffect(() => {
    localStorage.setItem("notifications_enabled", String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem("notifications_sound", String(notificationSound));
  }, [notificationSound]);

  useEffect(() => {
    localStorage.setItem("language_preference", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("theme_preference", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    window.dispatchEvent(new CustomEvent("theme-change", { detail: theme }));
  }, [theme]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("تمام فیلدها را پر کنید");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("رمز عبور جدید و تکرار آن یکسان نیست");
      return;
    }
    if (newPassword.length < 3) {
      toast.error("طول رمز عبور جدید باید حداقل 3 کاراکتر باشد");
      return;
    }
    try {
      setLoading(true);
      const res = await changePassword(oldPassword, newPassword);
      const data = res?.data || {};
      if (data.status === "success") {
        const token = data.token;
        if (token) {
          localStorage.setItem("token", token);
        }
        toast.success("رمز عبور با موفقیت تغییر کرد");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message || "خطا در تغییر رمز عبور");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "خطا رخ داد";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10 mb-12 lg:mb-10">
      <Header title="تنظیمات" />
      <main className="max-w-3xl mx-auto py-6 px-4 lg:px-8">
        <div
          className={`mt-10 backdrop-blur-md shadow-lg rounded-xl border p-6 ${
            isLight
              ? "bg-white/90 border-gray-200"
              : "bg-gray-800 bg-opacity-50 border-gray-700"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}
          >
            تغییر رمز عبور
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isLight ? "text-gray-900" : "text-gray-300"
                }`}
              >
                رمز عبور فعلی
              </label>
              <input
                type="password"
                className={`w-full rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 border-2 ${
                  isLight
                    ? "bg-white text-gray-900 border-gray-300"
                    : "bg-gray-800/50 text-white border-white/20"
                }`}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isLight ? "text-gray-900" : "text-gray-300"
                }`}
              >
                رمز عبور جدید
              </label>
              <input
                type="password"
                className={`w-full rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 border-2 ${
                  isLight
                    ? "bg-white text-gray-900 border-gray-300"
                    : "bg-gray-800/50 text-white border-white/20"
                }`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isLight ? "text-gray-900" : "text-gray-300"
                }`}
              >
                تکرار رمز عبور جدید
              </label>
              <input
                type="password"
                className={`w-full rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 border-2 ${
                  isLight
                    ? "bg-white text-gray-900 border-gray-300"
                    : "bg-gray-800/50 text-white border-white/20"
                }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "در حال تغییر..." : "ثبت تغییر رمز عبور"}
            </button>
          </form>
        </div>

        <div
          className={`mt-8 backdrop-blur-md shadow-lg rounded-xl border p-6 ${
            isLight
              ? "bg-white/90 border-gray-200"
              : "bg-gray-800 bg-opacity-50 border-gray-700"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}
          >
            ساخت کاربر مدیریت (KPI)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            <input
              type="text"
              value={kpiSeed.full_name}
              onChange={(e) =>
                setKpiSeed((p) => ({ ...p, full_name: e.target.value }))
              }
              placeholder="نام و نام‌خانوادگی"
              className={`w-full rounded-lg px-4 py-2 border-2 ${
                isLight
                  ? "bg-white text-gray-900 border-gray-300"
                  : "bg-gray-800/50 text-white border-white/20"
              }`}
            />
            <input
              type="text"
              value={kpiSeed.departman}
              onChange={(e) =>
                setKpiSeed((p) => ({ ...p, departman: e.target.value }))
              }
              placeholder="دپارتمان"
              className={`w-full rounded-lg px-4 py-2 border-2 ${
                isLight
                  ? "bg-white text-gray-900 border-gray-300"
                  : "bg-gray-800/50 text-white border-white/20"
              }`}
            />
            <input
              type="text"
              value={kpiSeed.company_name}
              onChange={(e) =>
                setKpiSeed((p) => ({ ...p, company_name: e.target.value }))
              }
              placeholder="شرکت"
              className={`w-full rounded-lg px-4 py-2 border-2 ${
                isLight
                  ? "bg-white text-gray-900 border-gray-300"
                  : "bg-gray-800/50 text-white border-white/20"
              }`}
            />
            <input
              type="text"
              value={kpiSeed.personal_code}
              onChange={(e) =>
                setKpiSeed((p) => ({ ...p, personal_code: e.target.value }))
              }
              placeholder="کد پرسنلی (اختیاری)"
              className={`w-full rounded-lg px-4 py-2 border-2 ${
                isLight
                  ? "bg-white text-gray-900 border-gray-300"
                  : "bg-gray-800/50 text-white border-white/20"
              }`}
            />
            <input
              type="text"
              value={kpiSeed.role}
              onChange={(e) =>
                setKpiSeed((p) => ({ ...p, role: e.target.value }))
              }
              placeholder="نقش"
              className={`w-full rounded-lg px-4 py-2 border-2 ${
                isLight
                  ? "bg-white text-gray-900 border-gray-300"
                  : "bg-gray-800/50 text-white border-white/20"
              }`}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("kpiUserInfo", JSON.stringify(kpiSeed));
                window.dispatchEvent(new Event("storage"));
                toast.success("کاربر مدیریت ثبت شد");
              }}
              className="h-11 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
            >
              ثبت کاربر مدیریت
            </button>
          </div>
        </div>
        <div
          className={`mt-8 backdrop-blur-md shadow-lg rounded-xl border p-6 ${
            isLight
              ? "bg-white/90 border-gray-200"
              : "bg-gray-800 bg-opacity-50 border-gray-700"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-2 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}
          >
            سایر تنظیمات
          </h2>
          <p
            className={`${isLight ? "text-gray-700" : "text-gray-300"} text-sm`}
          >
            در نسخه‌های بعدی، تنظیمات بیشتری مانند زبان، اعلان‌ها و شخصی‌سازی در
            این بخش اضافه می‌شود.
          </p>
        </div>

        <div
          className={`mt-8 backdrop-blur-md shadow-lg rounded-xl border p-6 ${
            isLight
              ? "bg-white/90 border-gray-200"
              : "bg-gray-800 bg-opacity-50 border-gray-700"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}
          >
            تنظیمات اعلان‌ها
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span
                className={`${
                  isLight ? "text-gray-900" : "text-gray-300"
                } text-sm`}
              >
                فعال بودن اعلان‌ها
              </span>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            <label className="flex items-center justify-between">
              <span
                className={`${
                  isLight ? "text-gray-900" : "text-gray-300"
                } text-sm`}
              >
                صدای اعلان
              </span>
              <input
                type="checkbox"
                checked={notificationSound}
                onChange={(e) => setNotificationSound(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            <button
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
              onClick={() => toast.success("تنظیمات اعلان ذخیره شد")}
            >
              ذخیره
            </button>
          </div>
        </div>

        <div
          className={`mt-8 backdrop-blur-md shadow-lg rounded-xl border p-6 ${
            isLight
              ? "bg-white/90 border-gray-200"
              : "bg-gray-800 bg-opacity-50 border-gray-700"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}
          >
            تنظیمات عمومی
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isLight ? "text-gray-900" : "text-gray-300"
                }`}
              >
                زبان
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`w-full rounded-lg px-4 py-2 outline-none focus:border-blue-500 border-2 ${
                  isLight
                    ? "bg-white text-gray-900 border-gray-300"
                    : "bg-gray-800/50 text-white border-white/20"
                }`}
              >
                <option value="fa">فارسی</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isLight ? "text-gray-900" : "text-gray-300"
                }`}
              >
                پوسته
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className={`w-full rounded-lg px-4 py-2 outline-none focus:border-blue-500 border-2 ${
                  isLight
                    ? "bg-white text-gray-900 border-gray-300"
                    : "bg-gray-800/50 text-white border-white/20"
                }`}
              >
                <option value="dark">تاریک</option>
                <option value="light">روشن</option>
              </select>
            </div>
          </div>
        </div>

        <div
          className={`mt-8 backdrop-blur-md shadow-lg rounded-xl border p-6 ${
            isLight
              ? "bg-white/90 border-gray-200"
              : "bg-gray-800 bg-opacity-50 border-gray-700"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}
          >
            داده‌های برنامه
          </h2>
          <div className="flex items-center gap-3">
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
              onClick={() => {
                localStorage.removeItem("notifications");
                toast.success("کش اعلان‌ها پاک شد");
              }}
            >
              پاک کردن کش اعلان‌ها
            </button>
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg"
              onClick={() => {
                localStorage.removeItem("kpiUserInfo");
                toast.success("اطلاعات کاربر به‌روزرسانی می‌شود");
              }}
            >
              پاک کردن اطلاعات کاربر
            </button>
          </div>
        </div>
      </main>
      <ToastContainer rtl={true} position="top-center" autoClose={5000} />
    </div>
  );
};

export default Settings;
