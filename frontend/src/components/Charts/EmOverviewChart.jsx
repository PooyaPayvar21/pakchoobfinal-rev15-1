/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { api } from "../../api";

// Persian month names
const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

// Form type colors
const FORM_TYPE_COLORS = {
  em: "#6366F1", // Indigo
  pm: "#10B981", // Green
  cm: "#F59E0B", // Amber
  gm: "#8B5CF6", // Purple
};

// Convert a Gregorian date to Persian month
const toPersianMonth = (gregorianDate) => {
  try {
    const date = new Date(gregorianDate);

    // Basic conversion for demonstration
    // Persian new year starts around March 21st (Spring equinox)
    const gregMonth = date.getMonth(); // 0-11
    const gregDay = date.getDate(); // 1-31

    // Very simplified conversion
    // If date is after March 21, Persian month is roughly 3 months behind Gregorian
    if (gregMonth === 0) return 10; // January -> Dey
    if (gregMonth === 1) return 11; // February -> Bahman
    if (gregMonth === 2) return gregDay < 21 ? 12 : 1; // March -> Esfand/Farvardin
    if (gregMonth === 3) return gregDay < 21 ? 1 : 2; // April -> Farvardin/Ordibehesht
    if (gregMonth === 4) return gregDay < 22 ? 2 : 3; // May -> Ordibehesht/Khordad
    if (gregMonth === 5) return gregDay < 22 ? 3 : 4; // June -> Khordad/Tir
    if (gregMonth === 6) return gregDay < 23 ? 4 : 5; // July -> Tir/Mordad
    if (gregMonth === 7) return gregDay < 23 ? 5 : 6; // August -> Mordad/Shahrivar
    if (gregMonth === 8) return gregDay < 23 ? 6 : 7; // September -> Shahrivar/Mehr
    if (gregMonth === 9) return gregDay < 23 ? 7 : 8; // October -> Mehr/Aban
    if (gregMonth === 10) return gregDay < 22 ? 8 : 9; // November -> Aban/Azar
    if (gregMonth === 11) return gregDay < 22 ? 9 : 10; // December -> Azar/Dey

    return 1; // Default to Farvardin if conversion fails
  } catch (err) {
    console.error("Error in date conversion:", err);
    return 1; // Default to Farvardin
  }
};

// Get Persian month name from month number (1-12)
const getMonthName = (month) => {
  return PERSIAN_MONTHS[month - 1] || month.toString();
};

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

const FormOverviewChart = () => {
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(null);
  const [totalForms, setTotalForms] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [formTypeCounts, setFormTypeCounts] = useState({
    em: 0,
    pm: 0,
    cm: 0,
    gm: 0,
  });

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

        // Count forms by type
        const counts = {
          em: 0,
          pm: 0,
          cm: 0,
          gm: 0,
        };

        filteredForms.forEach((form) => {
          if (form.form_type === "pm_form") {
            // Only count completed PM forms (تکمیل شده)
            if (form.pmstatus === "completed") {
              counts.pm++;
              console.log(
                `Found completed PM form from pmforms endpoint:`,
                form.formcode
              );
            }
          } else {
            const type = getFormType(form);
            if (type) {
              counts[type]++;
            }
          }
        });

        console.log("Form counts:", {
          PM: counts.pm,
          EM: counts.em,
          CM: counts.cm,
          GM: counts.gm,
        });

        setFormTypeCounts(counts);
        setTotalForms(filteredForms.length);

        // Create a structured array for all 12 months with proper order
        const chartData = [];
        for (let i = 1; i <= 12; i++) {
          chartData.push({
            month: i,
            monthName: getMonthName(i),
            em: 0,
            pm: 0,
            cm: 0,
            gm: 0,
          });
        }

        // Count forms by month and type
        filteredForms.forEach((form) => {
          if (form.problemdate) {
            try {
              const persianMonth = toPersianMonth(form.problemdate);
              if (persianMonth >= 1 && persianMonth <= 12) {
                if (form.form_type === "pm_form") {
                  // Only count PM forms with completed status
                  if (form.pmstatus === "completed") {
                    chartData[persianMonth - 1].pm++;
                  }
                } else {
                  const type = getFormType(form);
                  if (type) {
                    chartData[persianMonth - 1][type]++;
                  }
                }
              }
            } catch (err) {
              console.error("Error parsing date:", form.problemdate, err);
            }
          }
        });

        setFormData(chartData);
      } catch (error) {
        console.error("Error fetching form data:", error);
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

  // Memoized event handlers to prevent re-renders
  const handleMouseOver = useCallback((data) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const { payload } = data.activePayload[0];
      setActiveMonth(payload.month);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveMonth(null);
  }, []);

  // Memoized dot renderer for the chart
  const renderDot = useCallback(
    (props) => {
      const isActive = props.payload.month === activeMonth;
      const type = props.dataKey;
      return (
        <circle
          cx={props.cx}
          cy={props.cy}
          r={isActive ? 8 : 6}
          fill={isActive ? FORM_TYPE_COLORS[type] : FORM_TYPE_COLORS[type]}
          stroke="#fff"
          strokeWidth={isActive ? 2 : 1}
          style={{
            filter: isActive
              ? `drop-shadow(0 0 6px ${FORM_TYPE_COLORS[type]}80)`
              : "none",
            transition: "all 0.2s ease",
          }}
        />
      );
    },
    [activeMonth]
  );

  const renderChart = useCallback(() => {
    if (
      formData.length === 0 ||
      formData.every(
        (item) =>
          item.em === 0 && item.pm === 0 && item.cm === 0 && item.gm === 0
      )
    ) {
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
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <p className="mt-4">No form data available</p>
        </div>
      );
    }

    // Calculate averages inside the useCallback
    const calculateAverage = (type) => {
      if (formData.length === 0) return 0;
      const total = formData.reduce((sum, item) => sum + item[type], 0);
      return total / formData.length;
    };

    const averages = {
      em: calculateAverage("em"),
      pm: calculateAverage("pm"),
      cm: calculateAverage("cm"),
      gm: calculateAverage("gm"),
    };

    const isLight = document.documentElement.classList.contains("light");
    return (
      <ResponsiveContainer width={"100%"} height={"100%"}>
        <LineChart
          data={formData}
          onMouseMove={handleMouseOver}
          onMouseLeave={handleMouseLeave}
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray={"3 3"} stroke={isLight ? "#e5e7eb" : "#4b5563"} />
          <XAxis
            dataKey={"monthName"}
            stroke={isLight ? "#9ca3af" : "#9ca3af"}
            tick={{ fill: isLight ? "#374151" : "#e5e7eb", fontSize: 11 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            stroke={isLight ? "#9ca3af" : "#9ca3af"}
            tick={{ fill: isLight ? "#374151" : "#e5e7eb", fontSize: 12 }}
            padding={{ top: 20 }}
            tickFormatter={(value) => Math.round(value)}
            domain={[0, "auto"]}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isLight ? "rgba(255,255,255,0.9)" : "rgba(31,41,55,0.8)",
              borderColor: isLight ? "#e5e7eb" : "#4B5563",
              borderRadius: "4px",
              padding: "8px 12px",
            }}
            itemStyle={{ color: isLight ? "#374151" : "#e5e7eb" }}
            formatter={(value, name) => [`${value} forms`, name]}
            labelFormatter={(value) => `Month: ${value}`}
          />
          <Legend verticalAlign="top" height={36} />
          {Object.entries(FORM_TYPE_COLORS).map(([type, color]) => {
            // Only render the line if it's the selected type or no type is selected
            if (selectedType === null || selectedType === type) {
              return (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  name={type.toUpperCase()}
                  stroke={color}
                  strokeWidth={3}
                  dot={renderDot}
                  activeDot={{
                    r: 8,
                    strokeWidth: 2,
                    stroke: "#fff",
                    fill: color,
                    style: {
                      filter: `drop-shadow(0 0 6px ${color}80)`,
                    },
                  }}
                  connectNulls={true}
                  isAnimationActive={false}
                />
              );
            }
            return null;
          })}
          {Object.entries(averages).map(([type, average]) => {
            // Only render the average line if it's the selected type or no type is selected
            if (selectedType === null || selectedType === type) {
              return (
                <ReferenceLine
                  key={type}
                  y={average}
                  stroke={FORM_TYPE_COLORS[type]}
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  label={{
                    value: `${type.toUpperCase()} Avg`,
                    position: "right",
                    fill: FORM_TYPE_COLORS[type],
                    fontSize: 12,
                  }}
                />
              );
            }
            return null;
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  }, [formData, handleMouseOver, handleMouseLeave, renderDot, selectedType]);

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
      <div className="flex justify-between items-center mb-4">
        <h2
          className={`text-lg font-medium ${
            document.documentElement.classList.contains("light")
              ? "text-gray-900"
              : "text-gray-100"
          }`}
        >
          Forms Overview by Type
        </h2>
        <div className="flex gap-2">
          {Object.entries(FORM_TYPE_COLORS).map(([type, color]) => (
            <button
              key={type}
              className={`text-sm font-medium px-3 py-1 rounded-full transition-all duration-200 hover:opacity-80 ${
                selectedType === type
                  ? `ring-2 ring-offset-2 ${
                      document.documentElement.classList.contains("light")
                        ? "ring-offset-white"
                        : "ring-offset-gray-800"
                    }`
                  : ""
              }`}
              style={{
                backgroundColor: `${color}40`,
                color: color,
                cursor: "pointer",
                border: `1px solid ${color}80`,
                opacity:
                  selectedType === null || selectedType === type ? 1 : 0.5,
              }}
              onClick={() => {
                setSelectedType(selectedType === type ? null : type);
              }}
            >
              {type.toUpperCase()}: {formTypeCounts[type] || 0}
            </button>
          ))}
        </div>
      </div>
      {activeMonth !== null && (
        <div
          className={`mb-4 text-sm ${
            document.documentElement.classList.contains("light")
              ? "text-gray-700"
              : "text-gray-300"
          }`}
        >
          <span className="font-semibold">{getMonthName(activeMonth)}:</span>{" "}
          {Object.entries(formData.find((d) => d.month === activeMonth) || {})
            .filter(([key]) => ["em", "pm", "cm", "gm"].includes(key))
            .filter(([key]) => selectedType === null || selectedType === key)
            .map(([type, count]) => (
              <span key={type} className="ml-2">
                {type.toUpperCase()}: {count}
              </span>
            ))}
        </div>
      )}
      <div className="h-80">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          renderChart()
        )}
      </div>
    </motion.div>
  );
};

export default FormOverviewChart;
