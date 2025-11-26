/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  Rectangle,
} from "recharts";
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

const COLORS = {
  PM: "#6366F1",
  EM: "#8B5CF6",
  CM: "#ec4899",
  GM: "#10b981",
};

// Full form name mapping
const FORM_TYPE_LABELS = {
  PM: "Preventive Maintenance",
  EM: "Emergency Maintenance",
  CM: "Corrective Maintenance",
  GM: "General Maintenance",
};

// Custom bar label component that shows the value
const CustomBarLabel = (props) => {
  const { x, y, width, value, formType, isActive } = props;

  return (
    <g>
      <text
        x={x + width / 2}
        y={y - 10}
        fill="#e5e7eb"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
        fontWeight="bold"
        style={{
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          filter: isActive
            ? "drop-shadow(0 0 4px rgba(255,255,255,0.6))"
            : "none",
          transition: "filter 0.2s ease",
        }}
      >
        {value}
      </text>
      <text
        x={x + width / 2}
        y={y - 30}
        fill="#e5e7eb"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight="medium"
        style={{
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          filter: isActive
            ? "drop-shadow(0 0 4px rgba(255,255,255,0.6))"
            : "none",
          transition: "filter 0.2s ease",
        }}
      >
        {formType}
      </text>
    </g>
  );
};

// Custom tooltip that doesn't use the default cursor rectangle
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      className="custom-tooltip"
      style={{
        backgroundColor: "rgba(31,41,55,0.8)",
        border: "1px solid #4b5563",
        borderRadius: "4px",
        padding: "8px 12px",
        color: "#e5e7eb",
        fontSize: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        pointerEvents: "none",
      }}
    >
      {payload.map((entry, index) => {
        if (!entry.value) return null;
        return (
          <div
            key={`tooltip-${index}`}
            className="tooltip-item"
            style={{ margin: "4px 0" }}
          >
            <span style={{ fontWeight: "bold" }}>
              {FORM_TYPE_LABELS[entry.name] || entry.name}:{" "}
            </span>
            <span>{entry.value} forms</span>
          </div>
        );
      })}
    </div>
  );
};

// Custom active shape to prevent background on hover but add glow when active
const CustomBar = (props) => {
  const { fill, x, y, width, height, isActive } = props;

  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      style={{
        filter: isActive
          ? "drop-shadow(0 0 8px rgba(255,255,255,0.4))"
          : "none",
        transition: "filter 0.3s ease",
      }}
    />
  );
};

const FormOverviewBarChart = () => {
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState(null);

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

        // Create a single data object with each form type as a property
        const transformedData = {
          name: "Forms",
          ...counts,
        };

        setFormData([transformedData]);
      } catch (error) {
        console.error("Error fetching form data for bar chart:", error);
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

  // Handle clicking on a bar section
  const handleBarClick = useCallback((data, name) => {
    setActiveType((prevType) => (prevType === name ? null : name));
    console.log(`Clicked on ${name}: ${data[name]} forms`);
  }, []);

  // Handle clicking on a legend item
  const handleLegendClick = useCallback((data) => {
    setActiveType((prevType) =>
      prevType === data.dataKey ? null : data.dataKey
    );
  }, []);

  const renderBarChart = useCallback(() => {
    if (formData.length === 0 || !formData[0]) {
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <p className="mt-4">No form data available</p>
        </div>
      );
    }

    // Always show these four form types in this specific order
    const formTypes = ["PM", "EM", "CM", "GM"];

    return (
      <ResponsiveContainer>
        <BarChart
          data={formData}
          margin={{ top: 40, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray={"3 3"} stroke="#4b5563" />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            tick={{ fill: "#e5e7eb", fontSize: 12 }}
            hide // Hide the x-axis label since we'll use the legend
          />
          <YAxis stroke="#9ca3af" tick={{ fill: "#e5e7eb", fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Legend
            formatter={(value) => FORM_TYPE_LABELS[value] || value}
            wrapperStyle={{ paddingTop: "10px", cursor: "pointer" }}
            onClick={handleLegendClick}
          />

          {/* Create a Bar for each form type in specific order */}
          {formTypes.map((type) => (
            <Bar
              key={`bar-${type}`}
              dataKey={type}
              name={type}
              fill={COLORS[type]}
              onClick={(data) => handleBarClick(data, type)}
              cursor="pointer"
              isAnimationActive={false}
              shape={(props) => (
                <CustomBar {...props} isActive={activeType === type} />
              )}
              style={{
                opacity: activeType === null || activeType === type ? 1 : 0.7,
                transition: "opacity 0.2s ease",
              }}
            >
              <LabelList
                dataKey={type}
                position="top"
                content={(props) => {
                  // Only render label if value exists and is not zero
                  if (!props.value || props.value === 0) return null;
                  return (
                    <CustomBarLabel
                      {...props}
                      formType={type}
                      isActive={activeType === type}
                    />
                  );
                }}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }, [formData, activeType, handleBarClick, handleLegendClick]);

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <h2 className="text-lg font-medium mb-4 text-gray-100">
        Forms Distribution
      </h2>
      {activeType && formData[0] && (
        <div className="mb-4 text-sm text-gray-300">
          <span className="font-semibold">{FORM_TYPE_LABELS[activeType]}:</span>{" "}
          {formData[0][activeType]} forms
        </div>
      )}
      <div className="h-80">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          renderBarChart()
        )}
      </div>
    </motion.div>
  );
};

export default FormOverviewBarChart;
