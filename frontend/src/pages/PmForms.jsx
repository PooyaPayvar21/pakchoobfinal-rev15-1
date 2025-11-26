/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import Header from "../components/Common/Header";
import { motion } from "framer-motion";
import { api, getUserInfo } from "../api";
import { toast } from "react-toastify";

function PmForms() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPM, setIsPM] = useState(false);

  const statusMap = {
    not_completed: "تکمیل نشده",
    completed: "تکمیل شده",
    rejected: "رد شده",
  };

  const getStatusLabel = (code) => {
    if (!code) return "-";
    return statusMap[code] || code;
  };

  const worktypeMap = {
    mechanic: "مکانیک",
    electric: "برق",
    utility: "تاسیسات",
    metalworking: "فلزکاری",
    tarashkari: "تراشکاری",
    generalmechanic: "مکانیک عمومی",
    paint: "رنگ و سندبلاست",
  };

  const getWorktypeLabel = (pmworktype) => {
    if (!pmworktype) return "-";
    // pmworktype may be a comma-separated string or array
    const list = Array.isArray(pmworktype)
      ? pmworktype
      : String(pmworktype)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const labels = list.map((code) => worktypeMap[code] || code);
    return labels.length ? labels.join("، ") : "-";
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/submitpm/");
      // depending on backend shape, response may be {status:..., data:...} or array
      const payload = res?.data;
      // if server wraps with {status: 'success', data: [...]}
      if (
        payload &&
        payload.status === "success" &&
        Array.isArray(payload.data)
      ) {
        setItems(payload.data);
      } else if (Array.isArray(payload)) {
        setItems(payload);
      } else if (payload && Array.isArray(payload?.data)) {
        setItems(payload.data);
      } else {
        // fallback: try res.data.data
        setItems(res.data || []);
      }
      // determine current user role (is PM?)
      try {
        const userRes = await getUserInfo();
        const userData = userRes?.data || userRes?.data?.user || {};
        const userType =
          userData.user_type ||
          userData.role ||
          userData.type ||
          userData?.username;
        // assume user_type==='pm' or role contains 'pm'
        setIsPM(
          Boolean(
            userData &&
              (userData.user_type === "pm" ||
                String(userData.role).includes("pm"))
          )
        );
      } catch (e) {
        setIsPM(false);
      }
    } catch (err) {
      console.error("Failed to load SubmitPMs", err);
      setError(err?.response?.data || err.message || "خطا در دریافت داده‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (v) => {
    if (!v) return "-";
    try {
      const d = new Date(v);
      return d.toLocaleString();
    } catch {
      return String(v);
    }
  };
  const pmStatusOptions = [
    { value: "not_completed", label: "تکمیل نشده" },
    { value: "completed", label: "تکمیل‌شده" },
  ];

  const handleStatusChange = async (pmserial, newStatus) => {
    try {
      // use pmformcode when available (falls back to pmserial or id)
      const identifier = String(pmserial || "");
      const res = await api.put(
        `/submitpm/${encodeURIComponent(identifier)}/`,
        { pmstatus: newStatus }
      );
      // update local list
      setItems((prev) =>
        prev.map((it) =>
          it.pmserial === pmserial ? { ...it, pmstatus: newStatus } : it
        )
      );
      toast.success("وضعیت با موفقیت به‌روز شد");
    } catch (err) {
      console.error("Failed to update status", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "خطا در بروزرسانی وضعیت";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"فرم های دستور تعمیرات"} />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-lg font-medium">لیست دستور تعمیرات</h2>
          <div>
            <button
              onClick={load}
              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
            >
              تازه‌سازی
            </button>
          </div>
        </motion.div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-6 text-center">در حال بارگذاری...</div>
          ) : error ? (
            <div className="p-6 text-red-600">
              خطا در بارگذاری داده‌ها:
              <pre className="whitespace-pre-wrap mt-2 text-sm">
                {JSON.stringify(error, null, 2)}
              </pre>
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-gray-600">رکوردی یافت نشد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      وضعیت
                    </th>

                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      واحد تعمیراتی
                    </th>

                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      بخش
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      موضوع
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      سریال
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      تاریخ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((it) => (
                    <tr key={it.id || it.pmformcode || it.pmserial}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {isPM ? (
                          <select
                            value={it.pmstatus || "not_completed"}
                            onChange={(e) =>
                              handleStatusChange(it.pmserial, e.target.value)
                            }
                            className="border rounded px-2 py-1 text-sm"
                          >
                            {pmStatusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          getStatusLabel(it.pmstatus)
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {getWorktypeLabel(it.pmworktype)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {it.pmsection ||
                          it.pmsection_name ||
                          it.pmsection_code ||
                          "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {it.pmsubject || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {it.pmserial || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(it.pmsubmitdate)}
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

export default PmForms;
