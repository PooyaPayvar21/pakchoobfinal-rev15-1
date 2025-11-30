/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  Sector,
} from "recharts";
import { motion } from "framer-motion";
import { api } from "../../api";

// Get form type from form data
const getFormType = (form) => {
  const formTypeValue = (form.formtype || "").toLowerCase();
  const workTypeValue = (form.worktype || "").toLowerCase();

  // First check formtype field
  if (formTypeValue === "pm" || formTypeValue.includes("preventive"))
    return "pm";
  if (formTypeValue === "em" || formTypeValue.includes("emergency"))
    return "em";
  if (formTypeValue === "cm" || formTypeValue.includes("corrective"))
    return "cm";
  if (formTypeValue === "gm" || formTypeValue.includes("general")) return "gm";

  // Then check worktype field
  if (workTypeValue === "pm" || workTypeValue.includes("preventive"))
    return "pm";
  if (workTypeValue === "em" || workTypeValue.includes("emergency"))
    return "em";
  if (workTypeValue === "cm" || workTypeValue.includes("corrective"))
    return "cm";
  if (workTypeValue === "gm" || workTypeValue.includes("general")) return "gm";

  // If no clear type is found, return null
  return null;
};

const COLORS = ["#6366F1", "#8B5CF6", "#ec4899", "#10b981"];

// Full form name mapping
const FORM_TYPE_LABELS = {
  PM: "Preventive Maintenance",
  EM: "Emergency Maintenance",
  CM: "Corrective Maintenance",
  GM: "General Maintenance",
};

// Active shape component for the pie chart when a slice is clicked
const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin((-midAngle * Math.PI) / 180);
  const cos = Math.cos((-midAngle * Math.PI) / 180);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
        strokeWidth={2}
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#E5E7EB"
        fontSize={12}
      >
        {FORM_TYPE_LABELS[payload.name] || payload.name}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#E5E7EB"
        fontSize={12}
      >
        {`${value} forms (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

const FormOverviewChart = () => {
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoading(true);

        // Get user info from localStorage
        const userType = localStorage.getItem("user_type");
        const userRole = localStorage.getItem("user_role");
        const sections = localStorage.getItem("sections");
        const username = localStorage.getItem("username");

        if (!sections) {
          console.error("No sections found in localStorage");
          return;
        }

        // Fetch both regular forms and PM forms
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

        // Add form_type to distinguish between form types
        const regularFormsWithType = regularForms.map((form) => ({
          ...form,
          form_type: "submit_form",
        }));
        const pmFormsWithType = pmForms.map((form) => ({
          ...form,
          form_type: "pm_form",
          problemdate: form.pmformdate,
          section: form.pmsection,
          worktype: form.pmworktype,
          status: form.pmstatus || "pending_technician",
        }));

        // Combine all forms
        let forms = [...regularFormsWithType, ...pmFormsWithType];

        console.log("Initial forms count:", forms.length);

        // Filter forms based on user role and type
        let filteredForms = forms;
        const userSections = sections.split(",");

        if (userType === "pm") {
          // PM users see all forms
          filteredForms = forms;
        } else if (userType === "production") {
          if (userRole === "management") {
            // Production management sees forms in their sections
            filteredForms = forms.filter((form) =>
              userSections.some((section) =>
                form.section?.toLowerCase().includes(section.toLowerCase())
              )
            );
          } else if (userRole === "operator") {
            // Production operators see forms in their sections
            filteredForms = forms.filter((form) =>
              userSections.some((section) =>
                form.section?.toLowerCase().includes(section.toLowerCase())
              )
            );
          }
        } else if (
          [
            "mechanic",
            "electric",
            "utility",
            "metalworking",
            "tarashkari",
          ].includes(userType)
        ) {
          // Technicians see forms in their department
          filteredForms = forms.filter((form) => form.worktype === userType);
        }

        console.log("Forms after section filtering:", filteredForms.length);

        // Count forms by type using getFormType function
        const counts = {
          PM: 0,
          EM: 0,
          CM: 0,
          GM: 0,
        };

        filteredForms.forEach((form) => {
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
            }
          }
        });

        console.log("Form counts:", counts);

        // Transform data for the pie chart
        const chartData = Object.entries(counts)
          .filter(([_, value]) => value > 0)
          .map(([name, value]) => ({
            name,
            value,
            fullName: FORM_TYPE_LABELS[name] || name,
          }));

        setFormData(chartData);
      } catch (error) {
        console.error("Error fetching form data for pie chart:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadFormData();

    // Set up polling every 30 seconds
    const intervalId = setInterval(loadFormData, 600000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handlePieClick = useCallback((_, index) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  }, []);

  const handleLegendClick = useCallback(
    (data) => {
      const index = formData.findIndex((item) => item.name === data.value);
      setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
    },
    [formData]
  );

  const renderPieChart = useCallback(() => {
    if (formData.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <p className="mt-4">No form data available</p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width={"100%"} height={"100%"}>
        <PieChart>
          <Pie
            data={formData}
            cx={"50%"}
            cy={"50%"}
            labelLine={activeIndex === null}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            outerRadius={80}
            fill="#8884d8"
            dataKey={"value"}
            nameKey={"name"}
            label={
              activeIndex === null
                ? ({ name, value, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                : null
            }
            onClick={handlePieClick}
            isAnimationActive={true}
            paddingAngle={3}
            cursor="pointer"
          >
            {formData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                style={{
                  filter:
                    index === activeIndex
                      ? "drop-shadow(0 0 8px rgba(255,255,255,0.5))"
                      : "none",
                  opacity:
                    activeIndex === null || index === activeIndex ? 1 : 0.6,
                  transition: "opacity 0.2s ease, filter 0.2s ease",
                }}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${value} forms`,
              FORM_TYPE_LABELS[name] || name,
            ]}
            contentStyle={{
              backgroundColor: document.documentElement.classList.contains("light")
                ? "rgba(255,255,255,0.95)"
                : "rgba(31,41,55,0.8)",
              borderColor: document.documentElement.classList.contains("light")
                ? "#e5e7eb"
                : "#4b5563",
              borderRadius: "4px",
              padding: "8px 12px",
            }}
            itemStyle={{
              color: document.documentElement.classList.contains("light")
                ? "#374151"
                : "#e5e7eb",
            }}
            labelStyle={{
              color: document.documentElement.classList.contains("light")
                ? "#111827"
                : "#e5e7eb",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          />
          <Legend
            formatter={(value) => FORM_TYPE_LABELS[value] || value}
            onClick={handleLegendClick}
            wrapperStyle={{ paddingTop: "10px", cursor: "pointer" }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }, [formData, activeIndex, handlePieClick, handleLegendClick]);

  return (
    <motion.div
      className={`backdrop-blur-md shadow-lg rounded-xl p-6 border ${
        document.documentElement.classList.contains("light")
          ? "bg-white/90 border-gray-200"
          : "bg-gray-800/60 border-gray-700"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <h2
        className={`text-lg font-medium mb-4 ${
          document.documentElement.classList.contains("light")
            ? "text-gray-900"
            : "text-gray-100"
        }`}
      >
        Forms Overview
      </h2>
      {activeIndex !== null && formData[activeIndex] && (
        <div className="mb-4 text-sm text-gray-300">
          <span className="font-semibold">
            {formData[activeIndex].fullName}:
          </span>{" "}
          {formData[activeIndex].value} forms
        </div>
      )}
      <div className="h-80">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          renderPieChart()
        )}
      </div>
    </motion.div>
  );
};

export default FormOverviewChart;
