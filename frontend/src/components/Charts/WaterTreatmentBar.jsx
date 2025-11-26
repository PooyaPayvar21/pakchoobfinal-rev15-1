/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api } from "../../api";
import { motion } from "framer-motion";
import jaalali from "jalaali-js";
import { waterOption } from "../WaterOption";

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const getPersianDateParts = (gregorianDate) => {
  const date = new Date(gregorianDate);
  const { jy, jm, jd } = jaalali.toJalaali(date)

  const week = Math.ceil(jd / 7);
  return { year: jy, month: jm, week }
}

const getMonthName = (month) => PERSIAN_MONTHS[month - 1] || month.toString()

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

const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#d0ed57", "#a4de6c", "#8dd1e1", "#83a6ed", "#ff6b6b", "#4ecdc4"];

const WaterTreatmentBar = () => {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barKeys, setBarKeys] = useState([]);
  // All bars visible by default (checked)
  const [visibleBars, setVisibleBars] = useState({});
  const [selectedOption, setSelectedOption] = useState("فشار ترنسمیتر های دستگاه RO");

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const { year, month, week } = getPersianDateParts(d.date);
      return (
        (!selectedYear || year === selectedYear) &&
        (!selectedMonth || month === selectedMonth) &&
        (!selectedWeek || week === selectedWeek)
      );
    });
  }, [data, selectedYear, selectedMonth, selectedWeek]);


  // Process chart data like Area chart
  const processChartData = (rawData, option) => {
    const result = [];
    const transmitters = new Set();

    rawData.forEach((item) => {
      if (item.ghesmat === option && item.mozu) {
        const cleanMozu = item.mozu.trim();
        if (!cleanMozu) return;

        const date = new Date(item.tarikhesabt);
        const dateStr = date.toLocaleDateString("fa-IR");
        const shift = item.shift || "";
        const name = `${dateStr} (شیفت ${shift})`;

        let dataPoint = result.find((dp) => dp.name === name);
        if (!dataPoint) {
          dataPoint = { name, date: item.tarikhesabt, shift };
          result.push(dataPoint);
        }

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

    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Fetch data from backend
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/watertreatment/");
      if (response.data && response.data.status === "success") {
        const processedData = processChartData(response.data.data, selectedOption);
        setData(processedData);
        if (processedData.length > 0) {
          const keys = Object.keys(processedData[0]).filter((key) => !["name", "date", "shift"].includes(key));
          setBarKeys(keys);
          const initial = {};
          keys.forEach((key) => { initial[key] = true; });
          setVisibleBars(initial);
        }
      } else {
        setData([]);
        setBarKeys([]);
      }
    } catch (err) {
      setData([]);
      setBarKeys([]);
    } finally {
      setLoading(false);
    }
  }, [selectedOption]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset all checkboxes to checked
  const handleReset = useCallback(() => {
    const resetState = {};
    barKeys.forEach((key) => {
      resetState[key] = true;
    });
    setVisibleBars(resetState);
  }, [barKeys]);
  // Custom legend for left side
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
      {barKeys.map((key, idx) => (
        <label
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            background: visibleBars[key] ? "#374151" : "transparent",
            border: visibleBars[key] ? `2px solid ${colors[idx % colors.length]}` : "1px solid #4B5563",
            borderRadius: "6px",
            padding: "4px 10px",
            color: visibleBars[key] ? colors[idx % colors.length] : "#9CA3AF",
            fontWeight: visibleBars[key] ? "bold" : "normal",
            transition: "all 0.2s",
            userSelect: "none",
            minWidth: "120px",
            fontSize: "0.95rem",
          }}
        >
          <input
            type="checkbox"
            checked={visibleBars[key]}
            onChange={() =>
              setVisibleBars((prev) => ({ ...prev, [key]: !prev[key] }))
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
          {key}
        </label>
      ))}
    </div>
  ), [visibleBars, barKeys, handleReset]);

  return (
    <div className="items-center p-4 m-auto w-full font-semibold">
      <motion.div
        className="w-full bg-gray-900 bg-opacity-70 backdrop-blur-lg shadow-xl rounded-2xl p-6 border border-gray-700 font-semibold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl text-gray-100 mb-4 md:mb-0 ">نمودار Bar</h2>
          <div className="flex items-center">
            <label className="text-gray-200 mr-2">نوع داده:</label>
            <select
              className="bg-gray-800 text-white rounded px-2 py-1 mr-2"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              style={{ minWidth: "180px", fontSize: "1rem", border: "1px solid #4B5563", background: "#1F2937" }}
            >
              {Object.keys(waterOption).map((key) => (
                <option value={key} key={key}>{key}</option>
              ))}
            </select>
            {/* فیلتر سال */}
            <label htmlFor="" className="text-gray-200 mr-2 cursor-pointer">سال:</label>
            <select className="bg-gray-800 text-white rounded px-2 py-1 mr-2" value={selectedYear || ""} onChange={e => setSelectedYear(Number(e.target.value))} style={{ minWidth: "80px" }}>
              <option value="">همه</option>
              {Array.from(new Set(data.map(d => getPersianDateParts(d.date).year))).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <label htmlFor="" className="text-gray-200 mr-2 cursor-pointer">ماه:</label>
            <select className="bg-gray-800 text-white rounded px-2 py-1 mr-2" value={selectedMonth || ""} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ minWidth: "80px" }}>
              <option value="">همه</option>
              {Array.from(new Set(data.map(d => getPersianDateParts(d.date).month)))
                .sort((a, b) => a - b)
                .map(month => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
            </select>
            <label htmlFor="" className="text-gray-200 mr-2 cursor-pointer">هفته:</label>
            <select className="bg-gray-800 text-white rounded px-2 py-1 mr-2" value={selectedWeek || ""} onChange={e => setSelectedWeek(Number(e.target.value))} style={{ minWidth: "80px" }}>
              <option value="">همه</option>
              {Array.from(new Set(data.map(d => getPersianDateParts(d.date).week))).map(week => (
                <option key={week} value={week}>{week}</option>
              ))}
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
          <div className="flex w-full" style={{ minHeight: "400px", background: "rgba(31,41,55,0.7)", borderRadius: "16px", padding: "24px", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>
            {/* Legend on the left */}
            {renderLegend}
            {/* Chart on the right */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={filteredData}
                  margin={{ top: 20, right: 40, left: 30, bottom: 20 }}
                  width={900}
                  height={350}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 13 }} tickMargin={10} height={40} style={{ fontWeight: "bold" }} tickFormatter={(date) => {
                    const { year, month, week } = getPersianDateParts(date);
                    return PERSIAN_MONTHS[month - 1] || month.toString() + " " + year;
                  }} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 13 }} width={60} axisLine={{ stroke: "#4B5563" }} />
                  <Tooltip content={<CustomBarTooltip />} />
                  {barKeys.map((key, idx) =>
                    visibleBars[key] ? (
                      <Bar key={key} dataKey={key} fill={colors[idx % colors.length]} radius={[6, 6, 0, 0]} />
                    ) : null
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default WaterTreatmentBar;
