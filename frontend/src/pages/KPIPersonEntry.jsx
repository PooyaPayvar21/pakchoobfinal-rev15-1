import React, { useState } from "react";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { kpiApi } from "../services/kpiApi";

function KPIPersonEntry() {
  const [form, setForm] = useState({
    company_name: "",
    personal_code: "",
    full_name: "",
    role: "",
    direct_management: "",
    departman: "",
  });
  const [submitting, setSubmitting] = useState(false);

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
        </div>
      </main>
    </div>
  );
}

export default KPIPersonEntry;
