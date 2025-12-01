import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AdminLogin from "./pages/AdminLogin";
import LoginMainForm from "./components/LoginMainForm";
import Register from "./components/RegisterUser";
import AdminDashboard from "./pages/AdminDashboard";

import Start from "./pages/StartPage";
import Sidebar from "./components/Sidebar";
import SubmitForm from "./pages/SubmitForm";
import PmFormSubmit from "./pages/PmFormSubmit";
import Forms from "./pages/Forms";

import TechnicianSubmit from "./pages/TechnicianSubmit";
import FormDisplay from "./pages/FormDisplay";
import PmFormDisplay from "./pages/PmFormDisplay";
import PmTechnicianSubmit from "./pages/PmTechnicianSubmit";
import CalendarReminder from "./pages/CalendarReminder";
import WaterTreatmentSubmit from "./pages/WaterTreatmentSubmit";
import KpiOverview from "./pages/KpiOverview";
import WaterTreatmentDashboard from "./pages/WaterTreatmentDashboard";
import RCFA from "./pages/RCFA";
import SubmitPM from "./pages/SubmitPM";
import PmForms from "./pages/PmForms";
import KpiDashboard from "./pages/KpiDashboard";
import KPIDataEntry from "./pages/KPIDataEntry";
import KpiWorkResponse from "./pages/KpiWorkResponse";
import KPIPersonEntry from "./pages/KPIPersonEntry";
import KpiUserInfo from "./pages/KpiUserInfo";
import KpiManagementRelation from "./pages/KpiManagementRelation";
import KpiManagerReview from "./pages/KpiManagerReview";
import KpiPeopleWorks from "./pages/KpiPeopleWorks";
import KpiPersonReport from "./pages/KpiPersonReport";
import KpiReport from "./pages/KpiReport";
import ProtectedRoute from "./components/ProtectedRoute";
import Settings from "./pages/Settings";
import NotificationsPage from "./pages/Notifications";
import { NotificationsProvider } from "./contexts/NotificationsContext";

function Logout() {
  localStorage.clear();
  return <Navigate to={"/login"} />;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const pref = localStorage.getItem("theme_preference") || "dark";
    const root = document.documentElement;
    if (pref === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, []);

  useEffect(() => {
    const handler = () => setThemeVersion((v) => v + 1);
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const showSidebar =
    isLoggedIn &&
    !["/", "/login", "/register", "/adminlogin"].includes(location.pathname);

  if (loading) {
    return <div>Loading...</div>;
  }

  const isLight = document.documentElement.classList.contains("light");

  return (
    <div
      data-theme-version={themeVersion}
      className={`${
        isLight ? "bg-gray-100 text-gray-900" : "bg-gray-950 text-gray-100"
      } min-h-screen`}
    >
      <div className="relative flex h-screen overflow-hidden">
        <div className="fixed inset-0 z-0">
          {isLight ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-white opacity-80" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_75%_20%,rgba(236,72,153,0.12),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.12),transparent_50%)]" />
              <div className="absolute inset-0 backdrop-blur-[2px]" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-80" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.08),transparent_50%),radial-gradient(circle_at_75%_20%,rgba(236,72,153,0.06),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.06),transparent_50%)]" />
              <div className="absolute inset-0 backdrop-blur-[2px]" />
            </>
          )}
        </div>

        <NotificationsProvider>
          {showSidebar && <Sidebar />}

          <Routes>
            <Route path="/" element={<Start />} />
            <Route
              path="/login"
              element={<LoginMainForm onLoginSuccess={handleLoginSuccess} />}
            />
            <Route path="/kpioverview" element={<KpiOverview />} />
            <Route path="/register" element={<Register />} />
            <Route path="/adminlogin" element={<AdminLogin />} />
            <Route path="/admindashboard" element={<AdminDashboard />} />
            <Route
              path="/watertreatmentdashboard"
              element={<WaterTreatmentDashboard />}
            />
            <Route path="/submitpm" element={<SubmitPM />} />
            <Route path="/pmforms" element={<PmForms />} />
            <Route path="/submitform" element={<SubmitForm />} />
            <Route
              path="/kpidashboard"
              element={
                <ProtectedRoute>
                  <KpiDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpidataentry"
              element={
                <ProtectedRoute requiredRole="management">
                  <KPIDataEntry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpiuserinfo"
              element={
                <ProtectedRoute>
                  <KpiUserInfo />
                </ProtectedRoute>
              }
            />
            <Route path="/kpipersonentry" element={<KPIPersonEntry />} />
            <Route
              path="/kpiworkresponse"
              element={
                <ProtectedRoute>
                  <KpiWorkResponse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpirelation"
              element={
                <ProtectedRoute requiredRole="management">
                  <KpiManagementRelation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpimanagerreview"
              element={
                <ProtectedRoute requiredRole="management">
                  <KpiManagerReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpipeopleworks"
              element={
                <ProtectedRoute>
                  <KpiPeopleWorks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpi/person/:personal_code"
              element={
                <ProtectedRoute>
                  <KpiPersonReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpi/kpi/:kpiName"
              element={
                <ProtectedRoute>
                  <KpiReport />
                </ProtectedRoute>
              }
            />
            <Route path="/pmformsubmit" element={<PmFormSubmit />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/techniciansubmit/:formcode"
              element={<TechnicianSubmit />}
            />
            <Route
              path="/pmtechniciansubmit/:pmformcode"
              element={<PmTechnicianSubmit />}
            />
            <Route path="/forms/:formcode" element={<FormDisplay />} />
            <Route path="/pmforms/:pmformcode" element={<PmFormDisplay />} />
            <Route path="/calendar" element={<CalendarReminder />} />
            <Route
              path="/watertreatmentsubmit"
              element={<WaterTreatmentSubmit />}
            />
            <Route path="/rcfa" element={<RCFA />} />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationsProvider>
      </div>
    </div>
  );
}

export default App;
