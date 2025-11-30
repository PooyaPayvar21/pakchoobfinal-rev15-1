import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import Header from "../components/Common/Header";
import { kpiApi } from "../services/kpiApi";

const KpiManagementRelation = () => {
  const [options, setOptions] = useState({ full_names: [], direct_managements: [], roles: [], people: [] });
  const [selectedFullName, setSelectedFullName] = useState("");
  const [selectedDirectManagement, setSelectedDirectManagement] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [directFilter, setDirectFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    kpiApi
      .fetchKPIEntryOptions()
      .then((data) => setOptions(data))
      .catch(() => toast.error("خطا در دریافت گزینه ها"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFullName || (!selectedDirectManagement && !selectedRole)) {
      toast.error("لطفا پرسنل و حداقل یکی از مدیریت مستقیم یا نقش را انتخاب کنید");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        full_name: selectedFullName,
        direct_management: selectedDirectManagement || undefined,
        role: selectedRole || undefined,
      };
      const res = await kpiApi.updateKPIEntryManagement(payload);
      toast.success(`به روزرسانی انجام شد (${res.updated})`);
    } catch (e1) {
      toast.error("خطا در به روزرسانی");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"ارتباط نقش و مدیریت مستقیم"} />
      <ToastContainer position="top-center" autoClose={1500} rtl={true} />
      <main className="w-full lg:px-8 mb-10" dir="rtl">
        <div className="mt-8 px-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-200 mb-2">نام و نام خانوادگی</label>
                  <input
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="جستجو نام"
                    className="w-full mb-2 rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  />
                  <select
                    value={selectedFullName}
                    onChange={(e) => setSelectedFullName(e.target.value)}
                    className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  >
                    <option value="">انتخاب پرسنل</option>
                    {options.full_names
                      .filter((n) => n.toLowerCase().includes(nameFilter.toLowerCase()))
                      .map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-200 mb-2">مدیر مستقیم</label>
                  <input
                    value={directFilter}
                    onChange={(e) => setDirectFilter(e.target.value)}
                    placeholder="جستجو مدیر"
                    className="w-full mb-2 rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  />
                  <select
                    value={selectedDirectManagement}
                    onChange={(e) => setSelectedDirectManagement(e.target.value)}
                    className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  >
                    <option value="">انتخاب مدیر مستقیم</option>
                    {options.direct_managements
                      .filter((m) => m.toLowerCase().includes(directFilter.toLowerCase()))
                      .map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-200 mb-2">نقش</label>
                  <input
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    placeholder="جستجو نقش"
                    className="w-full mb-2 rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2"
                  >
                    <option value="">انتخاب نقش</option>
                    {options.roles
                      .filter((r) => r.toLowerCase().includes(roleFilter.toLowerCase()))
                      .map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {submitting ? "در حال ثبت..." : "ثبت"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default KpiManagementRelation;
