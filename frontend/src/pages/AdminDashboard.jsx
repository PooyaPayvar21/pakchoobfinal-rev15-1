/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import Header from "../components/Common/Header";
import StatCard from "../components/Common/StatCard";
import EmOverviewChart from "../components/Charts/EmOverviewChart";
import FormOverviewPieChart from "../components/Charts/FormOverviewPieChart";
import FormOverviewBarChart from "../components/Charts/FormOverviewBarChart";
import { motion } from "framer-motion";
import { Zap, Loader } from "lucide-react";
import { api } from "../api";
import { getFormType } from "../utils/formDataUtils";

const AdminDashboard = () => {
  const [formCounts, setFormCounts] = useState({
    PM: 0,
    EM: 0,
    CM: 0,
    GM: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add a useEffect to log state changes
  useEffect(() => {
    console.log("formCounts state changed:", formCounts);
  }, [formCounts]);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get sections and worktype from localStorage
        const sections = localStorage.getItem("sections");
        const worktype = localStorage.getItem("user_type");
        const userRole = localStorage.getItem("user_role");

        if (!sections || !worktype) {
          console.error("No sections or worktype found in localStorage");
          setError("User information not found. Please log in again.");
          return;
        }

        console.log("Loading form data for:", { sections, worktype, userRole });

        // Fetch both regular forms and PM forms separately
        const [regularFormsResponse, pmFormsResponse] = await Promise.all([
          api.get("/submitform/list/"),
          api.get("/pmformssubmit/list/"),
        ]);

        // Process regular forms
        const regularForms = Array.isArray(regularFormsResponse.data)
          ? regularFormsResponse.data
          : [];
        // Process PM forms
        const pmForms = Array.isArray(pmFormsResponse.data)
          ? pmFormsResponse.data
          : [];

        console.log("Fetched forms:", {
          regularFormsCount: regularForms.length,
          pmFormsCount: pmForms.length,
        });

        // Add form_type to distinguish between form types
        const regularFormsWithType = regularForms.map((form) => ({
          ...form,
          form_type: "submit_form",
        }));
        const pmFormsWithType = pmForms.map((form) => ({
          ...form,
          form_type: "pm_form",
          // Map PM form fields to regular form fields for consistent display
          pmformdate: form.pmformdate,
          pmphase: form.pmphase,
          pmmachinename: form.pmmachinename,
          pmsection: form.pmsection,
          pmworktype: form.pmworktype,
          pmstatus: form.pmstatus || "pending_technician",
        }));

        // Combine all forms
        let allForms = [...regularFormsWithType, ...pmFormsWithType];

        // Filter forms based on user's sections
        const userSections = sections
          .split(",")
          .map((section) => section.trim());
        let filteredForms = allForms;

        console.log(
          "Initial forms count:",
          filteredForms.length,
          "(Regular:",
          regularForms.length,
          "PM:",
          pmForms.length,
          ")"
        );

        // First filter by sections for all users
        filteredForms = filteredForms.filter((form) => {
          // Check section based on form type
          const formSection =
            form.form_type === "pm_form" ? form.pmsection : form.section;
          return (
            userSections.includes("all") ||
            userSections.some(
              (section) =>
                formSection?.toLowerCase().trim() ===
                section.toLowerCase().trim()
            )
          );
        });

        console.log("Forms after section filtering:", filteredForms.length);

        // For PM Management, show all forms regardless of worktype
        if (
          worktype.toLowerCase() === "pm" &&
          userRole?.toLowerCase() === "management"
        ) {
          // No additional filtering needed - show all forms
          console.log("PM Management user - showing all forms");
        }
        // For PM Technician, only show forms in their assigned sections
        else if (
          worktype.toLowerCase() === "pm" &&
          userRole?.toLowerCase() !== "management"
        ) {
          // No additional filtering needed - already filtered by sections
          console.log(
            "PM Technician user - showing forms in assigned sections"
          );
        }
        // For Production Operator, show all forms in their sections
        else if (worktype.toLowerCase() === "production") {
          // No additional filtering needed
          console.log("Production user - showing all forms in sections");
        } else {
          // For other users, filter by worktype
          filteredForms = filteredForms.filter((form) => {
            const formWorktype =
              form.form_type === "pm_form" ? form.pmworktype : form.worktype;
            return formWorktype?.toLowerCase() === worktype.toLowerCase();
          });
          console.log("Forms after worktype filtering:", filteredForms.length);
        }

        console.log("Filtered forms:", {
          total: regularForms.length + pmForms.length,
          filtered: filteredForms.length,
          sections: userSections,
          worktype: worktype.toLowerCase(),
          userRole: userRole?.toLowerCase(),
          forms: filteredForms,
        });
        // Calculate counts for each form type
        const counts = {
          PM: 0,
          EM: 0,
          CM: 0,
          GM: 0,
        };

        filteredForms.forEach((form) => {
          // PM forms from pmforms/list/ endpoint should be counted as PM type
          if (form.form_type === "pm_form") {
            // Only count completed PM forms (تکمیل شده)
            if (form.pmstatus === "completed") {
              counts.PM++;
              console.log(
                `Found completed PM form from pmforms endpoint:`,
                form.formcode
              );
            }
          } else {
            const type = getFormType(form);
            if (type) {
              counts[type.toUpperCase()]++;
              console.log(`Found ${type.toUpperCase()} form:`, form.id);
            } else {
              console.log("No form type identified for form:", {
                id: form.id,
                formcode: form.formcode,
                formtype: form.formtype,
                worktype: form.worktype,
              });
            }
          }
        });

        console.log("Form counts before setting state:", counts);
        setFormCounts(counts);
      } catch (error) {
        console.error("Error in loadFormData:", error);
        setError(`Failed to load form data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadFormData();
  }, []);

  const renderStatCards = () => {
    console.log("Rendering StatCards with counts:", formCounts);
    if (loading) {
      return (
        <div className="col-span-full flex justify-center items-center py-10">
          <Loader className="animate-spin text-indigo-500 mr-2" size={24} />
          <span className="text-gray-300">Loading dashboard statistics...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="col-span-full text-center py-10">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <>
        <StatCard
          name="PM"
          icon={Zap}
          value={formCounts.PM.toString()}
          color="#6366f1"
          description="تعمیرات پیشگیرانه"
        />
        <StatCard
          name="EM"
          icon={Zap}
          value={formCounts.EM.toString()}
          color="#8B5CF6"
          description="تعمیرات اضطراری"
        />
        <StatCard
          name="CM"
          icon={Zap}
          value={formCounts.CM.toString()}
          color="#ec4899"
          description="تعمیرات اصلاحی"
        />
        <StatCard
          name="GM"
          icon={Zap}
          value={formCounts.GM.toString()}
          color="#10b981"
          description="تعمیرات عمومی"
        />
      </>
    );
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="داشبورد" />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {renderStatCards()}
        </motion.div>
        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <EmOverviewChart />
          <FormOverviewPieChart />
          <div className="mb-24 md:mb-0">
            <FormOverviewBarChart />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
