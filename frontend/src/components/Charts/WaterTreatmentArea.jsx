/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { api } from "../../api";
import { toast, ToastContainer } from "react-toastify";
import jaalali from "jalaali-js";
import { waterOption } from "../../components/WaterOption";
import "react-toastify/dist/ReactToastify.css";

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

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div style={{ background: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px', padding: '10px', color: '#F3F4F6', fontSize: '1rem' }}>
        <div style={{ color: '#9CA3AF', fontWeight: 'bold', marginBottom: '6px' }}>{label}</div>
        {payload.map((item, idx) => (
          <div key={item.dataKey} style={{ color: item.color, marginBottom: '4px' }}>
            {item.name || item.dataKey}: <b>{item.value}</b>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const getPersianDateParts = (gregorianDate) => {
  const date = new Date(gregorianDate);
  const { jy, jm, jd } = jaalali.toJalaali(date)

  const week = Math.ceil(jd / 7);
  return { year: jy, month: jm, week }
}

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

const getMonthName = (month) => {
  return PERSIAN_MONTHS[month - 1] || month.toString();
};

const CustomTooltip = ({ active, payload, label, hoveredLine }) => {
  if (!active || !payload || payload.length === 0) return null;

  // Find the hovered line's payload
  const hoveredPayload = hoveredLine
    ? payload.find((item) => item.dataKey === hoveredLine)
    : null;

  if (!hoveredPayload) return null;

  return (
    <div className="font-semibold"
      style={{
        backgroundColor: "#1F2937",
        borderColor: "#4B5563",
        borderRadius: "0.5rem",
        padding: "0.5rem",
        color: "#F3F4F6",
        fontSize: "1rem",
        border: "1px solid #4B5563",
      }}
    >
      <div
        style={{
          color: "#9CA3AF",
          marginBottom: "8px",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        {label}
      </div>
      <div style={{ color: hoveredPayload.color }}>
        <span style={{ fontWeight: "bold" }}>{hoveredPayload.name}: </span>
        {hoveredPayload.value != null
          ? Number(hoveredPayload.value).toFixed(2)
          : "-"}
      </div>
    </div>
  );
};

const WaterTreatmentArea = () => {
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [hoveredLine, setHoveredLine] = useState(null)
  const [visisbleLines, setVisibleLines] = useState({})
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(
    "فشار ترنسمیتر های دستگاه RO"
  );
  const [selectedTransmitters, setSelectedTransmitters] = useState([]);
  const [barKeys, setBarKeys] = useState([]);
  const [visibleBars, setVisibleBars] = useState({});

  const lineKeys = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(
      (key) => !["name", "date", "shift"].includes(key)
    )
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const keys = Object.keys(data[0]).filter(
        (key) => !["name", "date", 'shift'].includes(key)
      );
      const initial = {}
      keys.forEach((key) => {
        initial[key] = true
      });
      setVisibleLines(initial);
    }
  }, [data]);

  // const renderLegend = React.useCallback((props) => {
  //   const { payload } = props;
  //   return (
  //     <div
  //       style={{
  //         display: "flex",
  //         justifyContent: "left",
  //         alignItems: "left",
  //         flexWrap: "wrap",
  //         gap: "8px",
  //         padding: "8px 0 16px 0",
  //         maxWidth: "100%",
  //         overflowX: "auto",
  //         boxSizing: "border-box",
  //         background: "rgba(31,41,55,0.85)",
  //         borderRadius: "10px",
  //         border: "1px solid #374151",
  //         margin: "0 auto",
  //         scrollbarWidth: "thin",
  //       }}
  //     >
  //       {payload.map((entry) => (
  //         <label
  //           key={entry.dataKey}
  //           style={{
  //             display: "flex",
  //             alignItems: "left",
  //             cursor: "pointer",
  //             background: visisbleLines[entry.dataKey] ? "#374151" : "transparent",
  //             border: visisbleLines[entry.dataKey]
  //               ? `2px solid ${entry.color}`
  //               : "1px solid #4B5563",
  //             borderRadius: "6px",
  //             padding: "4px 10px",
  //             color: visisbleLines[entry.dataKey] ? entry.color : "#9CA3AF",
  //             fontWeight: visisbleLines[entry.dataKey] ? "bold" : "normal",
  //             transition: "all 0.2s",
  //             userSelect: "none",
  //             minWidth: "120px",
  //             fontSize: "0.95rem",
  //           }}
  //         >
  //           <input
  //             type="checkbox"
  //             checked={!!visisbleLines[entry.dataKey]}
  //             onChange={() =>
  //               setVisibleLines((prev) => ({
  //                 ...prev,
  //                 [entry.dataKey]: !prev[entry.dataKey],
  //               }))
  //             }
  //             style={{
  //               accentColor: entry.color,
  //               marginRight: "8px",
  //               width: "18px",
  //               height: "18px",
  //               borderRadius: "4px",
  //               border: "1px solid #4B5563",
  //               background: "#1F2937",
  //             }}
  //           />
  //           {entry.value}
  //         </label>
  //       ))}
  //     </div>
  //   );
  // }, [visisbleLines]);


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/watertreatment/");
      if (response.data && response.data.status === "success") {
        const processedData = processChartData(
          response.data.data,
          selectedOption
        );
        setData(processedData);
      } else {
        throw new Error("خطا در دریافت اطلاعات تصفیه خانه آب");
      }
    } catch (error) {
      console.error("Error fetching water treatment data:", error);
      toast.error("خطا در دریافت اطلاعات تصفیه خانه آب");
    } finally {
      setLoading(false);
    }
  }, [selectedOption]);

  const processChartData = (rawData, option) => {
    const result = [];
    const transmitters = new Set();

    console.log("Raw data received:", rawData);

    // First pass: collect all unique transmitters and create data points
    rawData.forEach((item) => {
      if (item.ghesmat === option && item.mozu) {
        const cleanMozu = item.mozu.trim();
        if (!cleanMozu) return;

        const date = new Date(item.tarikhesabt);
        const dateStr = date.toLocaleDateString("fa-IR");
        const shift = item.shift || "";
        const name = `${dateStr} (شیفت ${shift})`;

        // Create or update data point
        let dataPoint = result.find((dp) => dp.name === name);
        if (!dataPoint) {
          dataPoint = { name, date: item.tarikhesabt, shift };
          result.push(dataPoint);
        }

        // Add the value
        const cleanValue = String(item.value || "")
          .replace(/,/g, ".")
          .trim();
        const numericValue = parseFloat(cleanValue);
        if (!isNaN(numericValue)) {
          const key = cleanMozu.replace(/\s+/g, "_");
          dataPoint[key] = numericValue;
          transmitters.add(cleanMozu);
        }
      }
    });

    // Ensure all data points have all transmitters
    const allTransmitters = Array.from(transmitters);
    result.forEach((item) => {
      allTransmitters.forEach((tx) => {
        const key = tx.replace(/\s+/g, "_");
        if (item[key] === undefined) {
          item[key] = null;
        }
      });
    });

    console.log("Processed data points:", result);
    console.log("Available transmitters:", allTransmitters);

    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Define colors for the lines
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#d0ed57",
    "#a4de6c",
    "#8dd1e1",
    "#83a6ed",
    "#ff6b6b",
    "#4ecdc4",
  ];

  const filteredData = data.filter(d => {
    const { year, month, week } = getPersianDateParts(d.date);
    return (
      (!selectedYear || year === selectedYear) &&
      (!selectedMonth || month === selectedMonth) &&
      (!selectedWeek || week === selectedWeek)
    )
  })

  const handleReset = useCallback(() => {
    const resetState = {};
    lineKeys.forEach((key) => {
      resetState[key] = true;
    });
    setVisibleLines(resetState);
  }, [lineKeys]);

  const renderLegend = useMemo(() => (
    <div className="font-semibold"
      style={{
        width: "full",
        maxHeight: 560,
        overflowY: "auto",
        marginRight: 24,
        background: "rgba(31,41,55,0.85)",
        borderRadius: "10px",
        border: "1px solid #374151",
        padding: "8px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <button
        className="bg-blue-600 hover:bg-blue-700 font-semibold"
        onClick={handleReset}
        style={{
          marginBottom: "10px",
          padding: "6px 12px",
          color: "#fff",
          border: "1px solid #4B5563",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "0.95rem"
        }}
      >
        ریست
      </button>
      {lineKeys.map((key, idx) => (
        <label
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            background: visisbleLines[key] ? "#374151" : "transparent",
            border: visisbleLines[key] ? `2px solid ${colors[idx % colors.length]}` : "1px solid #4B5563",
            borderRadius: "6px",
            padding: "4px 10px",
            color: visisbleLines[key] ? colors[idx % colors.length] : "#9CA3AF",
            fontWeight: visisbleLines[key] ? "bold" : "normal",
            transition: "all 0.2s",
            userSelect: "none",
            minWidth: "120px",
            fontSize: "0.95rem",
          }}
        >
          <input
            type="checkbox"
            checked={!!visisbleLines[key]}
            onChange={() =>
              setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            style={{
              accentColor: colors[idx % colors.length],
              marginRight: "8px",
              width: "18px",
              height: "18px",
              borderRadius: "4px",
              border: "1px solid #4B5563",
              background: "#1F2937",
            }}
          />
          {key.replace(/_/g, " ")}
        </label>
      ))}
    </div>
  ), [handleReset, lineKeys, visibleBars, colors]);

  return (
    <div className="items-center p-4 m-auto w-full font-semibold" style={{ maxWidth: "1400px", boxSizing: "border-box" }}>
      <motion.div
        className="w-full bg-gray-900 bg-opacity-70 backdrop-blur-lg shadow-xl rounded-2xl p-6 border border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl text-gray-100 mb-4 md:mb-0 font-semibold">
            نمودار فشار دستگاه تصفیه آب
          </h2>

          <div className="flex items-center">
            <label className="text-gray-200 mr-2 font-semibold">نوع داده:</label>
            <select
              className="bg-gray-700 text-white rounded px-3 py-1 mr-2"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              style={{
                minWidth: "180px",
                fontSize: "1rem",
                border: "1px solid #4B5563",
                background: "#1F2937",
              }}
            >
              {Object.keys(waterOption).map((key) => (
                <option value={key} key={key}>{key}</option>
              ))}
            </select>
            <label htmlFor="" className="text-gray-200 font-semibold mr-2">سال:</label>
            <select className="bg-gray-800 text-white rounded px-2 py-1 mr-2" value={selectedYear || ""} onChange={e => setSelectedYear(Number(e.target.value))} style={{ minWidth: "80px" }}>
              <option value="" className="font-semibold">همه</option>
              {Array.from(new Set(data.map(d => getPersianDateParts(d.date).year))).map(year => <option className="font-semibold" key={year} value={year}>{year}</option>)}
            </select>
            <label htmlFor="" className="text-gray-200 font-semibold mr-2">ماه:</label>
            <select className="bg-gray-800 text-white rounded px-2 py-1 mr-2" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ minWidth: "80px" }}>
              <option value="" className="font-semibold">همه</option>
              {Array.from(new Set(data.map(d => getPersianDateParts(d.date).month)))
                .sort((a, b) => a - b)
                .map(month => (
                  <option className="font-semibold" key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
            </select>
            <label htmlFor="" className="text-gray-200 font-semibold mr-2">هفته:</label>
            <select className="bg-gray-800 text-white rounded px-2 py-1 mr-2" value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))} style={{ minWidth: "80px" }}>
              <option value="">همه</option>
              {Array.from(new Set(data.map(d => getPersianDateParts(d.date).week))).map(week => <option className="font-semibold" key={week} value={week}>{week}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            داده‌ای برای نمایش وجود ندارد
          </div>
        ) : (
          <div className="flex w-full" style={{
            minHeight: "600px",
            background: "rgba(31,41,55,0.7)",
            borderRadius: "16px",
            padding: "24px",
            maxWidth: "1400px",
            margin: "0 auto",
            boxSizing: "border-box",
          }}>
            {/* Legend on the left */}
            {renderLegend}
            {/* Chart on the right */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={600}>
                <LineChart
                  data={filteredData}
                  margin={{ top: 20, right: 40, left: 30, bottom: 20 }}
                  width={1200}
                  height={600}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9CA3AF", fontSize: 13 }}
                    tickMargin={10}
                    height={60}
                    angle={-30}
                    textAnchor="end"
                    axisLine={{ stroke: "#4B5563" }}
                    style={{ fontWeight: "bold" }}
                    tickFormatter={(date) => {
                      const { year, month, week } = getPersianDateParts(date);
                      return PERSIAN_MONTHS[month - 1] || month.toString() + " " + year;
                    }}
                  />
                  <YAxis
                    label={{
                      value: "فشار (bar)",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#9CA3AF",
                      offset: 0,
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                    tick={{ fill: "#9CA3AF", fontSize: 13 }}
                    domain={["dataMin - 10", "dataMax + 10"]}
                    tickFormatter={(value) => Number(value).toFixed(1)}
                    width={80}
                    axisLine={{ stroke: "#4B5563" }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  {barKeys.map((key, idx) =>
                    visibleBars[key] ? (
                      <Bar key={key} dataKey={key} fill={colors[idx % colors.length]} radius={[6, 6, 0, 0]} />
                    ) : null
                  )}
                  {lineKeys.map((key, idx) => {
                    const displayName = key.replace(/_/g, " ");
                    const validDataPoints = data.filter(item => item[key] != null).length;
                    if (!visisbleLines[key]) return null;
                    return (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={displayName}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={hoveredLine === key ? 4 : 2}
                        dot={{ r: hoveredLine === key ? 6 : 4 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        isAnimationActive={false}
                        connectNulls={true}
                        hide={validDataPoints === 0}
                        opacity={hoveredLine === null || hoveredLine === key ? 1 : 0.2}
                        onMouseOver={() => setHoveredLine(key)}
                        onMouseOut={() => setHoveredLine(null)}
                        onClick={() => setVisibleLines((prev) => ({
                          ...prev, [key]: !prev[key],
                        }))}
                        style={{ cursor: "pointer" }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </motion.div>
      <ToastContainer rtl={true} position="top-center" autoClose={5000} />
    </div>
  );
}
export default WaterTreatmentArea;
