import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Header from "../components/Common/Header";

const KpiUserInfo = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    personal_code: "",
    full_name: "",
    company_name: "",
    role: "",
    direct_management: "",
    departman: "",
  });

  useEffect(() => {
    // Check if user is authenticated and already has complete info
    const token = localStorage.getItem("token");
    const existingKpiInfo = localStorage.getItem("kpiUserInfo");

    if (token && existingKpiInfo) {
      try {
        const parsedInfo = JSON.parse(existingKpiInfo);
        // Check if all required fields are filled
        if (
          parsedInfo.personal_code &&
          parsedInfo.full_name &&
          parsedInfo.company_name &&
          parsedInfo.role &&
          parsedInfo.direct_management &&
          parsedInfo.departman
        ) {
          // User already has complete info, redirect to work response
          navigate("/kpiworkresponse", { state: { userInfo: parsedInfo } });
          return;
        }
      } catch (e) {
        // If parsing fails, continue with form
      }
    }

    setLoading(false);
  }, [navigate]);

  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if all user info fields are filled
    if (Object.values(userInfo).some((val) => !val.trim())) {
      toast.error("All user information fields are required");
      return;
    }

    // Store user info in localStorage
    localStorage.setItem("kpiUserInfo", JSON.stringify(userInfo));
    toast.success("User information saved! Proceeding to data entry...");

    // Redirect to KPI Work Response page
    setTimeout(() => {
      navigate("/kpiworkresponse", { state: { userInfo } });
    }, 1500);
  };

  const handleEditAndSave = async (e) => {
    e.preventDefault();

    // Check if all user info fields are filled
    if (Object.values(userInfo).some((val) => !val.trim())) {
      toast.error("All user information fields are required");
      return;
    }

    try {
      // Save user info to database via API
      const response = await fetch("/api/kpientry/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personal_code: userInfo.personal_code,
          full_name: userInfo.full_name,
          company_name: userInfo.company_name,
          role: userInfo.role,
          direct_management: userInfo.direct_management,
          departman: userInfo.departman,
          category: "UserInfo",
          tasks: [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save user information");
      }

      // Store user info in localStorage
      localStorage.setItem("kpiUserInfo", JSON.stringify(userInfo));

      // Trigger storage event for sidebar update
      window.dispatchEvent(new Event("storage"));

      toast.success("User information saved successfully!");

      // Redirect to KPI Work Response page
      setTimeout(() => {
        navigate("/kpiworkresponse", { state: { userInfo } });
      }, 1500);
    } catch (error) {
      console.error("Error saving user information:", error);
      toast.error(error.message || "Error saving user information");
    }
  };

  const isLight = document.documentElement.classList.contains("light");

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"User Information"} />
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
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-300 text-xl">Loading...</div>
        </div>
      ) : (
        <main className="w-full lg:px-8 mb-10 mt-10">
          <div
            className={`max-w-4xl mx-auto rounded-lg shadow p-6 ${
              isLight ? "bg-white" : "bg-gray-800"
            }`}
          >
            <h2
              className={`text-2xl font-bold mb-6 ${
                isLight ? "text-gray-900" : "text-gray-200"
              }`}
            >
              User Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
              <div
                className={`p-4 rounded-lg border ${
                  isLight
                    ? "bg-gray-100 border-gray-200"
                    : "bg-gray-700 border-gray-600"
                }`}
              >
                <div
                  dir="rtl"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isLight ? "text-gray-900" : "text-gray-200"
                      }`}
                    >
                      Personal Code *
                    </label>
                    <input
                      type="text"
                      name="personal_code"
                      value={userInfo.personal_code}
                      onChange={handleUserInfoChange}
                      placeholder="Enter personal code"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isLight
                          ? "border-gray-300"
                          : "border-gray-600 bg-gray-800 text-gray-200"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isLight ? "text-gray-900" : "text-gray-200"
                      }`}
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={userInfo.full_name}
                      onChange={handleUserInfoChange}
                      placeholder="Enter full name"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isLight
                          ? "border-gray-300"
                          : "border-gray-600 bg-gray-800 text-gray-200"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isLight ? "text-gray-900" : "text-gray-200"
                      }`}
                    >
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={userInfo.company_name}
                      onChange={handleUserInfoChange}
                      placeholder="Enter company name"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isLight
                          ? "border-gray-300"
                          : "border-gray-600 bg-gray-800 text-gray-200"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isLight ? "text-gray-900" : "text-gray-200"
                      }`}
                    >
                      Role *
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={userInfo.role}
                      onChange={handleUserInfoChange}
                      placeholder="Enter role"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isLight
                          ? "border-gray-300"
                          : "border-gray-600 bg-gray-800 text-gray-200"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isLight ? "text-gray-900" : "text-gray-200"
                      }`}
                    >
                      Direct Management
                    </label>
                    <input
                      type="text"
                      name="direct_management"
                      value={userInfo.direct_management}
                      disabled={true}
                      placeholder="Auto-filled from system"
                      className={`w-full px-4 py-2 border rounded-lg ${
                        isLight
                          ? "border-gray-300 bg-gray-100 text-gray-900"
                          : "border-gray-300 bg-gray-800 text-gray-200"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isLight ? "text-gray-900" : "text-gray-200"
                      }`}
                    >
                      Department *
                    </label>
                    <input
                      type="text"
                      name="departman"
                      value={userInfo.departman}
                      onChange={handleUserInfoChange}
                      placeholder="Enter department"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isLight
                          ? "border-gray-300"
                          : "border-gray-600 bg-gray-800 text-gray-200"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  onClick={handleEditAndSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  Continue to KPI Data Entry
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/kpidashboard")}
                  className={`flex-1 text-white font-medium py-2 px-4 rounded-lg transition duration-200 ${
                    isLight
                      ? "bg-gray-300 hover:bg-gray-400 text-gray-900"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      )}
    </div>
  );
};

export default KpiUserInfo;
