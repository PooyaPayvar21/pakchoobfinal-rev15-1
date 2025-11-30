import React, { useState, useEffect } from "react";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { kpiApi } from "../services/kpiApi";

function KPIDataEntry() {
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [formData, setFormData] = useState({
    taskName: "",
    description: "",
    status: "Working",
    percentage: 0,
    dueDate: "",
    notes: "",
  });

  const [facilities, setFacilities] = useState([]);
  const [sections, setSections] = useState([]);
  const [roles, setRoles] = useState([]);
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load facilities and sections on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [facilitiesData, sectionsData, rolesData] = await Promise.all([
          kpiApi.fetchFacilities(),
          kpiApi.fetchSections(),
          kpiApi.fetchRoles(),
        ]);
        setFacilities(facilitiesData);
        setSections(sectionsData);
        setRoles(rolesData);
      } catch (error) {
        toast.error("خطا در بارگذاری داده‌ها");
        console.error("Error loading initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Load people when role changes
  useEffect(() => {
    if (selectedRole) {
      const loadPeople = async () => {
        try {
          const peopleData = await kpiApi.fetchPeopleByRole(selectedRole);
          setPeople(peopleData);
        } catch (error) {
          toast.error("خطا در بارگذاری لیست افراد");
          console.error("Error loading people:", error);
          setPeople([]);
        }
      };
      loadPeople();
    }
  }, [selectedRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "percentage" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !selectedFacility ||
      !selectedSection ||
      !selectedRole ||
      !selectedPerson ||
      !formData.taskName
    ) {
      toast.error("لطفا تمام فیلدهای ضروری را پر کنید");
      return;
    }

    setIsSubmitting(true);
    try {
      // Find person_id from people list
      console.log(`[KPIDataEntry] People list:`, people);
      console.log(
        `[KPIDataEntry] Looking for selectedPerson: "${selectedPerson}"`
      );

      const person = people.find((p) => {
        const match = p.username === selectedPerson;
        console.log(
          `[KPIDataEntry] Comparing "${p.username}" === "${selectedPerson}" → ${match}`
        );
        return match;
      });

      console.log(`[KPIDataEntry] Found person:`, person);
      const personId = person?.id;

      if (!personId) {
        toast.error("خطا: شخص انتخاب شده یافت نشد");
        console.error(
          "[KPIDataEntry] ERROR: personId not found after person lookup"
        );
        return;
      }

      const workData = {
        facility: selectedFacility,
        section: selectedSection,
        role: selectedRole,
        person_id: personId,
        task_name: formData.taskName,
        description: formData.description,
        status: formData.status,
        percentage: formData.percentage,
        due_date: formData.dueDate || null,
        notes: formData.notes,
      };

      console.log(`[KPIDataEntry] Submitting work data:`, workData);

      const response = await kpiApi.submitWork(workData);
      console.log(
        `[KPIDataEntry] Work submitted successfully, response:`,
        response
      );

      toast.success("کار با موفقیت ثبت شد");

      // Reset form
      setFormData({
        taskName: "",
        description: "",
        status: "Working",
        percentage: 0,
        dueDate: "",
        notes: "",
      });
      setSelectedPerson(null);
    } catch (error) {
      toast.error(
        "خطا در ثبت کار: " + (error.response?.data?.error || error.message)
      );
      console.error("[KPIDataEntry] Error submitting work:", error);
      console.error("[KPIDataEntry] Error response:", error.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedFacility(null);
    setSelectedSection(null);
    setSelectedRole(null);
    setSelectedPerson(null);
    setFormData({
      taskName: "",
      description: "",
      status: "Working",
      percentage: 0,
      dueDate: "",
      notes: "",
    });
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"ثبت کار و وظایف"} />
      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={true}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
      />
      <main className="w-full lg:px-8 mb-10" dir="rtl">
        <div className="mt-8 px-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Facility */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">
                مرحله 1: انتخاب شرکت
              </h3>
              {isLoading ? (
                <div className="text-center text-gray-400">
                  درحال بارگذاری...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {facilities.map((facility) => (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => {
                        setSelectedFacility(facility);
                        setSelectedSection(null);
                        setSelectedRole(null);
                        setSelectedPerson(null);
                      }}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        selectedFacility === facility
                          ? "bg-gray-700 text-white shadow-lg"
                          : "bg-green-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {facility}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Select Section */}
            {selectedFacility && (
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  مرحله 2: انتخاب بخش
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sections.map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => {
                        setSelectedSection(section);
                        setSelectedRole(null);
                      }}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        selectedSection === section
                          ? "bg-gray-700 text-white shadow-lg"
                          : "bg-green-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Select Role */}
            {selectedSection && (
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  مرحله 3: انتخاب نقش
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role);
                        setSelectedPerson(null);
                      }}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        selectedRole === role
                          ? "bg-gray-700 text-white shadow-lg"
                          : "bg-green-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Select Person */}
            {selectedRole && people.length > 0 && (
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  مرحله 4: انتخاب شخص
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {people.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setSelectedPerson(person.username)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        selectedPerson === person.username
                          ? "bg-green-800 text-white shadow-lg"
                          : "bg-green-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {person.username}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Enter Work Details */}
            {selectedPerson && (
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  مرحله 5: ورود جزئیات کار
                </h3>

                {/* Summary of selections */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 bg-gray-900 bg-opacity-40 rounded-lg">
                  <div>
                    <span className="text-gray-400 text-sm">واحد:</span>
                    <p className="text-gray-100 font-semibold">
                      {selectedFacility}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">بخش:</span>
                    <p className="text-gray-100 font-semibold">
                      {selectedSection}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">نقش:</span>
                    <p className="text-gray-100 font-semibold">
                      {selectedRole}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">نام:</span>
                    <p className="text-gray-100 font-semibold">
                      {selectedPerson}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Task Name */}
                  <div>
                    <label className="block text-sm text-gray-200 mb-2 font-semibold">
                      نام کار *
                    </label>
                    <input
                      type="text"
                      name="taskName"
                      value={formData.taskName}
                      onChange={handleInputChange}
                      placeholder="مثال: بررسی کیفیت محصول"
                      className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm text-gray-200 mb-2 font-semibold">
                      توضیحات
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="توضیحات تفصیلی کار..."
                      rows="3"
                      className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2 focus:border-blue-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm text-gray-200 mb-2 font-semibold">
                        وضعیت *
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Done">انجام شده</option>
                        <option value="Working">در حال انجام</option>
                        <option value="Not Done">انجام نشده</option>
                      </select>
                    </div>

                    {/* Percentage */}
                    <div>
                      <label className="block text-sm text-gray-200 mb-2 font-semibold">
                        درصد انجام (%)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          name="percentage"
                          min="0"
                          max="100"
                          value={formData.percentage}
                          onChange={handleInputChange}
                          className="flex-1"
                        />
                        <span className="text-gray-100 font-semibold min-w-fit">
                          {formData.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm text-gray-200 mb-2 font-semibold">
                      تاریخ مهلت
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm text-gray-200 mb-2 font-semibold">
                      یادداشت ها
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="یادداشت های اضافی..."
                      rows="2"
                      className="w-full rounded-md bg-gray-700 text-gray-100 border border-gray-600 p-2 focus:border-blue-500 focus:outline-none"
                    ></textarea>
                  </div>
                </div>

                {/* Submit and Reset Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-green-800 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    {isSubmitting ? "درحال ثبت..." : "ثبت کار"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

export default KPIDataEntry;
