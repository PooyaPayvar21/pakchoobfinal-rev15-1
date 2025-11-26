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

function Logout() {
  localStorage.clear();
  return <Navigate to={"/login"} />;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
    setLoading(false);
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

  return (
    <div>
      <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
        {/* BackGround */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-80" />
          <div className="absolute inset-0 backdrop-blur-sm" />
        </div>

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
          <Route path="/pmformsubmit" element={<PmFormSubmit />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/forms" element={<Forms />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
