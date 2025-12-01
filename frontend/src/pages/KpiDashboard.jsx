import React, { useState, useEffect } from "react";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { kpiApi } from "../services/kpiApi";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";

function KpiDashboard() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const [facilities, setFacilities] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [kpiMetrics, setKpiMetrics] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [selectedPieSegment, setSelectedPieSegment] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [facilityMetrics, setFacilityMetrics] = useState([]);
  const [isLoadingFacilityMetrics, setIsLoadingFacilityMetrics] =
    useState(false);
  const [showBarChart, setShowBarChart] = useState(false);
  const isLight = document.documentElement.classList.contains("light");

  // Load facilities and KPI metrics on mount
  useEffect(() => {
    // Get company_name from localStorage
    const kpiUserInfo = JSON.parse(localStorage.getItem("kpiUserInfo") || "{}");
    if (kpiUserInfo.company_name) {
      setCompanyName(kpiUserInfo.company_name);
    }
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [facilitiesData, sectionsData, metricsData] = await Promise.all([
        kpiApi.fetchFacilities(),
        kpiApi.fetchSections(),
        kpiApi.getKPIMetrics(),
      ]);

      // Filter facilities by company_name if user's company is "تخته فشرده"
      const kpiUserInfo = JSON.parse(
        localStorage.getItem("kpiUserInfo") || "{}"
      );
      const userCompanyName = kpiUserInfo.company_name;

      let filteredFacilities = facilitiesData;
      if (
        userCompanyName === "تخته فشرده" ||
        userCompanyName === "پاک چوب تخته فشرده"
      ) {
        filteredFacilities = facilitiesData.filter(
          (facility) =>
            facility === "پاک چوب تخته فشرده" || facility === "تخته فشرده"
        );
      }

      setFacilities(filteredFacilities);
      setSections(sectionsData);
      setKpiMetrics(metricsData);

      // Load metrics for ALL facilities (for bar chart)
      // Use facilitiesData instead of filteredFacilities to show all companies
      if (facilitiesData.length > 0) {
        loadFacilityMetrics(facilitiesData);
      }
    } catch (error) {
      toast.error("خطا در بارگذاری داده‌ها");
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFacilityMetrics = async (facilitiesList) => {
    try {
      setIsLoadingFacilityMetrics(true);
      const metricsPromises = facilitiesList.map(async (facility) => {
        try {
          const metrics = await kpiApi.getKPIMetrics({ facility });
          return {
            name: facility,
            completed: parseInt(metrics.completed || 0),
            working: parseInt(metrics.working || 0),
            notDone: parseInt(metrics.not_done || 0),
            total: parseInt(metrics.total_works || 0),
          };
        } catch (error) {
          console.error(`Error loading metrics for ${facility}:`, error);
          return {
            name: facility,
            completed: 0,
            working: 0,
            notDone: 0,
            total: 0,
          };
        }
      });

      const metricsData = await Promise.all(metricsPromises);
      setFacilityMetrics(metricsData);
    } catch (error) {
      console.error("Error loading facility metrics:", error);
      toast.error("خطا در بارگذاری داده‌های شرکت‌ها");
    } finally {
      setIsLoadingFacilityMetrics(false);
    }
  };

  const handleCardClick = (title) => {
    setSelectedCard(title);
    setSelectedSection(null);
    setSelectedPerson(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <Header title={"داشبورد"} />
        <main className="w-full lg:px-8 mb-10">
          <div className="mt-8 px-4 text-center text-gray-400">
            درحال بارگذاری...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"داشبورد"} />
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
      <main className="w-full lg:px-8 mb-10">
        {!selectedCard ? (
          <div className="mt-8 px-4">
            {/* Overall KPI Status */}
            <div className="mb-8" dir="rtl">
              <h2
                className={`text-2xl font-bold mb-4 ${
                  isLight ? "text-gray-900" : "text-gray-100"
                }`}
              >
                وضعیت کل KPI شرکت ها
              </h2>
              <div
                className={`backdrop-blur-md shadow-lg rounded-xl p-6 border ${
                  isLight
                    ? "bg-white/90 border-gray-200"
                    : "bg-gray-800/60 border-gray-700"
                }`}
              >
                {kpiMetrics ? (
                  <div className="flex flex-col items-center">
                    {/* Modern Donut Chart with Center Text */}
                    <div
                      className="relative w-full max-w-lg mx-auto cursor-pointer"
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowBarChart((prev) => !prev)}
                    >
                      <ResponsiveContainer width="100%" height={450}>
                        <PieChart
                          className="cursor-pointer"
                          style={{ cursor: "pointer" }}
                        >
                          <defs>
                            <linearGradient
                              id="pieGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              {/* Change these colors to customize Pie Chart */}
                              {/* Example: Green gradient: #10b981, #059669, #047857 */}
                              {/* Example: Purple gradient: #8b5cf6, #7c3aed, #6d28d9 */}
                              {/* Example: Red gradient: #ef4444, #dc2626, #b91c1c */}
                              {/* Example: Orange gradient: #f97316, #ea580c, #c2410c */}
                              <stop
                                offset="0%"
                                stopColor="#016630"
                                stopOpacity={1}
                              />
                              <stop
                                offset="50%"
                                stopColor="#016630"
                                stopOpacity={1}
                              />
                              <stop
                                offset="100%"
                                stopColor="#016630"
                                stopOpacity={1}
                              />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={[
                              {
                                name: "کل KPI",
                                value: parseInt(kpiMetrics.total_works || 0),
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                            stroke="none"
                            fill="url(#pieGradient)"
                          >
                            <Cell fill="url(#pieGradient)" />
                          </Pie>
                          <Tooltip
                            formatter={(value) => [
                              `${parseInt(value).toLocaleString()} KPI`,
                              "کل KPI",
                            ]}
                            contentStyle={{
                              backgroundColor: "#016630",
                              border: "1px solid #016630",
                              borderRadius: "12px",
                              color: "white",
                              direction: "rtl",
                              padding: "16px",
                              fontSize: "14px",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-6xl font-bold text-blue-400 mb-2">
                          {parseInt(
                            kpiMetrics.total_works || 0
                          ).toLocaleString()}
                        </div>
                        <div className="text-xl text-gray-300 font-semibold">
                          کل KPI
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          مجموع کل سیستم
                        </div>
                      </div>
                    </div>

                    {/* Summary Card with Modern Design */}
                    {/* <div className="mt-8 w-full max-w-2xl">
                      <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-2xl p-8 border border-blue-500/50 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-100 mb-2">
                              آمار کلی KPI
                            </h3>
                            <p className="text-gray-400 text-sm">
                              نمای کلی از تمام KPI های سیستم
                            </p>
                          </div>
                          <div className="text-5xl">📊</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                            <div className="text-sm text-gray-400 mb-2">
                              تعداد کل
                            </div>
                            <div className="text-4xl font-bold text-blue-400">
                              {parseInt(
                                kpiMetrics.total_works || 0
                              ).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              KPI
                            </div>
                          </div>
                          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                            <div className="text-sm text-gray-400 mb-2">
                              وضعیت
                            </div>
                            <div className="text-2xl font-bold text-green-400">
                              فعال
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              سیستم در حال کار
                            </div>
                          </div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-20">
                    در حال بارگذاری داده‌ها...
                  </div>
                )}
              </div>
            </div>

            {/* Facilities Grid + Bar Chart */}
            <div>
              {/* Modern Bar Chart for Facilities (toggled by pie chart click) */}
              {showBarChart && (
                <div
                  className={`backdrop-blur-md shadow-2xl rounded-2xl p-8 border mb-8 ${
                    isLight
                      ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
                      : "bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700/50"
                  }`}
                >
                  <div className="mb-8" dir="rtl">
                    <h3
                      className={`text-2xl font-bold mb-2 ${
                        isLight ? "text-gray-900" : "text-gray-100"
                      }`}
                    >
                      مقایسه KPI شرکت‌ها
                    </h3>
                    <p
                      className={`${
                        isLight ? "text-gray-600" : "text-gray-400"
                      } text-sm`}
                    >
                      نمایش تعداد KPI هر شرکت به صورت مقایسه‌ای
                    </p>
                  </div>
                  {isLoadingFacilityMetrics ? (
                    <div className="text-center text-gray-400 py-20">
                      <div className="animate-pulse">
                        در حال بارگذاری داده‌های شرکت‌ها...
                      </div>
                    </div>
                  ) : facilityMetrics.length > 0 ? (
                    <div dir="rtl">
                      <ResponsiveContainer width="100%" height={500}>
                        <BarChart
                          data={facilityMetrics}
                          margin={{
                            top: 30,
                            right: 40,
                            left: 30,
                            bottom: 140,
                          }}
                          barCategoryGap="20%"
                        >
                          <defs>
                            <linearGradient
                              id="barGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              {/* Change these colors to customize Bar Chart */}
                              {/* Example: Green gradient: #10b981, #059669, #047857 */}
                              {/* Example: Purple gradient: #8b5cf6, #7c3aed, #6d28d9 */}
                              {/* Example: Red gradient: #ef4444, #dc2626, #b91c1c */}
                              {/* Example: Orange gradient: #f97316, #ea580c, #c2410c */}
                              <stop
                                offset="0%"
                                stopColor="#016630"
                                stopOpacity={1}
                              />
                              <stop
                                offset="50%"
                                stopColor="#016630"
                                stopOpacity={1}
                              />
                              <stop
                                offset="100%"
                                stopColor="#016630"
                                stopOpacity={1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 0"
                            stroke="#374151"
                            opacity={0.5}
                            vertical={true}
                          />
                          <XAxis
                            dataKey="name"
                            angle={-90}
                            textAnchor="center"
                            height={100}
                            tick={{
                              fill: "#e5e7eb",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                            interval={0}
                            axisLine={{ stroke: "#016630", strokeWidth: 2 }}
                            tickLine={{ stroke: "#4b5563" }}
                          />
                          <YAxis
                            tick={{
                              fill: "#1F2937",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                            axisLine={{ stroke: "#1F2937", strokeWidth: 2 }}
                            tickLine={{ stroke: "#4b5563" }}
                            label={{
                              value: "تعداد KPI",
                              angle: -90,
                              position: "insideLeft",
                              style: {
                                textAnchor: "middle",
                                fill: "#e5e7eb",
                                fontSize: 15,
                                fontWeight: 700,
                              },
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "2px solid #3b82f6",
                              borderRadius: "12px",
                              color: "white",
                              direction: "rtl",
                              padding: "16px",
                              fontSize: "14px",
                              boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
                            }}
                            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                            formatter={(value) => {
                              return [
                                `${parseInt(value).toLocaleString()} KPI`,
                                "کل KPI",
                              ];
                            }}
                            labelFormatter={(label) => `شرکت: ${label}`}
                            labelStyle={{
                              color: "#ffffff",
                              fontWeight: "bold",
                              fontSize: "16px",
                              marginBottom: "8px",
                            }}
                          />
                          <Bar
                            dataKey="total"
                            name="total"
                            fill="url(#barGradient)"
                            radius={[12, 12, 0, 0]}
                            animationDuration={1200}
                            animationEasing="ease-out"
                            onClick={(data, index) => {
                              if (data && facilityMetrics[index]) {
                                handleCardClick(facilityMetrics[index].name);
                              }
                            }}
                          >
                            {facilityMetrics.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                onClick={() => {
                                  handleCardClick(entry.name);
                                }}
                                style={{
                                  filter:
                                    "drop-shadow(0 4px 8px rgba(1, 102, 48, 0.3))",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (e.target) {
                                    e.target.style.filter =
                                      "drop-shadow(0 6px 12px rgba(1, 102, 48, 0.5)) brightness(1.1)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (e.target) {
                                    e.target.style.filter =
                                      "drop-shadow(0 4px 8px rgba(1, 102, 48, 0.3))";
                                  }
                                }}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Modern Summary Stats */}
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-xl p-6 border border-blue-500/50 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-300 font-medium">
                              مجموع کل
                            </div>
                            <div className="text-2xl">📈</div>
                          </div>
                          <div className="text-3xl font-bold text-blue-400">
                            {facilityMetrics
                              .reduce((sum, f) => sum + f.total, 0)
                              .toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            KPI تمام شرکت‌ها
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-700/20 rounded-xl p-6 border border-indigo-500/50 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-300 font-medium">
                              تعداد شرکت‌ها
                            </div>
                            <div className="text-2xl">🏢</div>
                          </div>
                          <div className="text-3xl font-bold text-indigo-400">
                            {facilityMetrics.length}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            شرکت فعال
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-xl p-6 border border-purple-500/50 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-300 font-medium">
                              میانگین
                            </div>
                            <div className="text-2xl">📊</div>
                          </div>
                          <div className="text-3xl font-bold text-purple-400">
                            {facilityMetrics.length > 0
                              ? Math.round(
                                  facilityMetrics.reduce(
                                    (sum, f) => sum + f.total,
                                    0
                                  ) / facilityMetrics.length
                                ).toLocaleString()
                              : 0}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            KPI به ازای هر شرکت
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-20">
                      <div className="text-4xl mb-4">📊</div>
                      <div>داده‌ای برای نمایش وجود ندارد</div>
                    </div>
                  )}
                </div>
              )}

              {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {facilities.map((title) => (
                  <div
                    key={title}
                    className={`backdrop-blur-md shadow-lg rounded-xl p-6 border hover:shadow-xl transition-shadow duration-300 hover:scale-105 cursor-pointer ${
                      title === "پاک چوب تخته فشرده" || title === "تخته فشرده"
                        ? "bg-amber-800 bg-opacity-50 border-amber-500"
                        : "bg-green-800 bg-opacity-50 border-gray-700 hover:bg-gray-600"
                    }`}
                    onClick={() => handleCardClick(title)}
                  >
                    <h3 className="text-lg font-semibold text-gray-100 text-center">
                      {title}
                    </h3>
                  </div>
                ))}
              </div> */}
            </div>
          </div>
        ) : (
          <SectionView
            facility={selectedCard}
            sections={sections}
            onBack={() => setSelectedCard(null)}
            onSelectSection={(section) => setSelectedSection(section)}
            onSelectPerson={(person) => setSelectedPerson(person)}
            selectedSection={selectedSection}
            selectedPerson={selectedPerson}
          />
        )}
      </main>
    </div>
  );
}

function SectionView({
  facility,
  sections,
  onBack,
  onSelectSection,
  onSelectPerson,
  selectedSection,
  selectedPerson,
}) {
  const [facilitySectionMetrics, setFacilitySectionMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sectionMetrics, setSectionMetrics] = useState([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  // Load metrics for facility (on mount) and for facility+section when section changes
  useEffect(() => {
    loadMetrics();
  }, [selectedSection, facility]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      // If a section is selected, fetch metrics for facility+section; otherwise
      // fetch facility-level metrics and per-section metrics for bar chart
      const baseParams = { facility };

      if (selectedSection) {
        const metrics = await kpiApi.getKPIMetrics({
          ...baseParams,
          section: selectedSection,
        });
        setFacilitySectionMetrics(metrics);
        setSectionMetrics([]);
      } else {
        const facilityMetrics = await kpiApi.getKPIMetrics(baseParams);
        setFacilitySectionMetrics(facilityMetrics);

        // Load metrics for each section of this facility to show as bar chart
        setIsLoadingSections(true);
        const sectionPromises = sections.map(async (section) => {
          try {
            const metrics = await kpiApi.getKPIMetrics({
              facility,
              section,
            });
            return {
              name: section,
              total: parseInt(metrics.total_works || 0),
              completed: parseInt(metrics.completed || 0),
              working: parseInt(metrics.working || 0),
              notDone: parseInt(metrics.not_done || 0),
            };
          } catch (error) {
            console.error(
              `Error loading metrics for facility ${facility}, section ${section}:`,
              error
            );
            return {
              name: section,
              total: 0,
              completed: 0,
              working: 0,
              notDone: 0,
            };
          }
        });

        const sectionData = await Promise.all(sectionPromises);
        setSectionMetrics(sectionData);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingSections(false);
    }
  };

  if (selectedSection && !selectedPerson) {
    return (
      <SectionDetailView
        facility={facility}
        section={selectedSection}
        onBack={() => onSelectSection(null)}
        onSelectPerson={(person) => onSelectPerson(person)}
        metrics={facilitySectionMetrics}
      />
    );
  }

  if (selectedPerson) {
    return (
      <PersonDetailView
        facility={facility}
        section={selectedSection}
        person={selectedPerson}
        onBack={() => onSelectPerson(null)}
      />
    );
  }

  return (
    <div className="mt-8 px-4">
      <button
        onClick={onBack}
        className={`mb-6 px-4 py-2 rounded-lg transition-colors ${
          isLight
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-700 text-gray-100 hover:bg-gray-600"
        }`}
      >
        ← برگشت
      </button>
      <h2
        className={`text-2xl font-bold mb-6 ${
          isLight ? "text-gray-900" : "text-gray-100"
        }`}
        dir="rtl"
      >
        شرکت: {facility}
      </h2>
      {/* Facility-level KPI summary */}
      {/* <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 mb-6">
        <h3 className="text-xl font-semibold text-gray-100 mb-4" dir="rtl">
          وضعیت کلی واحد
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" dir="rtl">
          <div
            className="bg-green-600 bg-opacity-30 rounded-lg p-4 border border-green-500"
            dir="rtl"
          >
            <div className="text-sm text-gray-100 mb-2">KPI انجام شده</div>
            <div className="text-3xl font-bold text-green-400">
              {facilitySectionMetrics?.completed_percentage ?? 0}%
            </div>
          </div>
          <div className="bg-yellow-600 bg-opacity-30 rounded-lg p-4 border border-yellow-500">
            <div className="text-sm text-gray-100 mb-2">KPI در حال انجام</div>
            <div className="text-3xl font-bold text-yellow-400">
              {facilitySectionMetrics?.working_percentage ?? 0}%
            </div>
          </div>
          <div className="bg-red-600 bg-opacity-30 rounded-lg p-4 border border-red-500">
            <div className="text-sm text-gray-100 mb-2">KPI باقی مانده</div>
            <div className="text-3xl font-bold text-red-400">
              {facilitySectionMetrics?.not_done_percentage ?? 0}%
            </div>
          </div>
        </div>
      </div> */}

      {/* Sections as bar chart instead of grid */}
      <div
        className={`backdrop-blur-md shadow-2xl rounded-2xl p-8 border mb-8 ${
          isLight
            ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
            : "bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700/50"
        }`}
      >
        <div className="mb-8" dir="rtl">
          <h3
            className={`text-2xl font-bold mb-2 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}
          >
            وضعیت KPI به تفکیک بخش‌ها
          </h3>
          <p
            className={`${isLight ? "text-gray-600" : "text-gray-400"} text-sm`}
          >
            نمایش تعداد KPI هر بخش در شرکت {facility}
          </p>
        </div>

        {isLoadingSections ? (
          <div className="text-center text-gray-400 py-20">
            <div className="animate-pulse">
              در حال بارگذاری داده‌های بخش‌ها...
            </div>
          </div>
        ) : sectionMetrics.length > 0 ? (
          <div dir="rtl">
            <ResponsiveContainer width="100%" height={450}>
              <BarChart
                data={sectionMetrics}
                margin={{ top: 30, right: 40, left: 30, bottom: 120 }}
                barCategoryGap="20%"
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#016630" stopOpacity={1} />
                    <stop offset="50%" stopColor="#016630" stopOpacity={1} />
                    <stop offset="100%" stopColor="#016630" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 0"
                  stroke="#374151"
                  opacity={0.5}
                  vertical={true}
                />
                <XAxis
                  dataKey="name"
                  angle={-90}
                  textAnchor="center"
                  height={100}
                  tick={{
                    fill: "#e5e7eb",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  interval={0}
                  axisLine={{ stroke: "#016630", strokeWidth: 2 }}
                  tickLine={{ stroke: "#4b5563" }}
                />
                <YAxis
                  tick={{
                    fill: "#d1d5db",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                  axisLine={{ stroke: "#4b5563", strokeWidth: 2 }}
                  tickLine={{ stroke: "#4b5563" }}
                  label={{
                    value: "تعداد KPI",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fill: "#e5e7eb",
                      fontSize: 15,
                      fontWeight: 700,
                    },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "2px solid #3b82f6",
                    borderRadius: "12px",
                    color: "white",
                    direction: "rtl",
                    padding: "16px",
                    fontSize: "14px",
                    boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
                  }}
                  cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                  formatter={(value) => [
                    `${parseInt(value).toLocaleString()} KPI`,
                    "کل KPI",
                  ]}
                  labelFormatter={(label) => `بخش: ${label}`}
                />
                <Bar
                  dataKey="total"
                  name="total"
                  fill="url(#barGradient)"
                  radius={[12, 12, 0, 0]}
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {sectionMetrics.map((entry, index) => (
                    <Cell
                      key={`section-cell-${index}`}
                      onClick={() => onSelectSection(entry.name)}
                      style={{
                        filter: "drop-shadow(0 4px 8px rgba(1, 102, 48, 0.3))",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (e.target) {
                          e.target.style.filter =
                            "drop-shadow(0 6px 12px rgba(1, 102, 48, 0.5)) brightness(1.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (e.target) {
                          e.target.style.filter =
                            "drop-shadow(0 4px 8px rgba(1, 102, 48, 0.3))";
                        }
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-20">
            <div className="text-4xl mb-4">📊</div>
            <div>داده‌ای برای نمایش وجود ندارد</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionDetailView({
  facility,
  section,
  onBack,
  onSelectPerson,
  metrics,
}) {
  const [selectedRole, setSelectedRole] = useState("");
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const roles = ["مدیر", "رئیس", "کارشناس"];

  // Load people when role changes
  useEffect(() => {
    if (selectedRole) {
      loadPeople();
    }
  }, [selectedRole]);

  const loadPeople = async () => {
    try {
      setIsLoading(true);
      const peopleData = await kpiApi.fetchPeopleByRole(selectedRole);
      setPeople(peopleData);
    } catch (error) {
      toast.error("خطا در بارگذاری لیست افراد");
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
  };

  return (
    <div className="mt-8 px-4">
      <button
        onClick={onBack}
        className={`mb-6 px-4 py-2 rounded-lg transition-colors ${
          isLight
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-700 text-gray-100 hover:bg-gray-600"
        }`}
      >
        ← برگشت
      </button>

      <div
        className={`backdrop-blur-md shadow-lg rounded-xl p-6 border mb-6 ${
          isLight
            ? "bg-white/90 border-gray-200"
            : "bg-gray-800/60 border-gray-700"
        }`}
        dir="rtl"
      >
        <h2
          className={`text-2xl font-bold mb-2 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}
        >
          {section}
        </h2>
        <p className={`${isLight ? "text-gray-700" : "text-gray-300"}`}>
          واحد: {facility}
        </p>
      </div>

      {/* Section KPI Status */}
      <div
        className={`backdrop-blur-md shadow-lg rounded-xl p-6 border mb-6 ${
          isLight
            ? "bg-white/90 border-gray-200"
            : "bg-gray-800/60 border-gray-700"
        }`}
        dir="rtl"
      >
        <h3
          className={`text-xl font-semibold mb-4 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}
        >
          وضعیت KPI
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-600 bg-opacity-30 rounded-lg p-4 border border-green-500">
            <div className="text-sm text-gray-100 mb-2">KPI انجام شده</div>
            <div className="text-3xl font-bold text-green-400">
              {metrics?.completed_percentage || 0}%
            </div>
          </div>
          <div className="bg-yellow-600 bg-opacity-30 rounded-lg p-4 border border-yellow-500">
            <div className="text-sm text-gray-100 mb-2">KPI در حال انجام</div>
            <div className="text-3xl font-bold text-yellow-400">
              {metrics?.working_percentage || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Role and Person Selection */}
      <div
        className={`backdrop-blur-md shadow-lg rounded-xl p-6 border ${
          isLight
            ? "bg-white/90 border-gray-200"
            : "bg-gray-800/60 border-gray-700"
        }`}
        dir="rtl"
      >
        <h3
          className={`text-xl font-semibold mb-6 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}
        >
          انتخاب نفرات
        </h3>

        <div className="mb-6">
          <label className="block text-sm text-gray-200 mb-3 font-semibold">
            نقش را انتخاب کنید
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedRole === role
                    ? isLight
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-green-700 text-white shadow-lg"
                    : isLight
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* People List */}
        {selectedRole && (
          <div className="mb-6" dir="rtl">
            <label
              className={`block text-sm mb-3 font-semibold ${
                isLight ? "text-gray-900" : "text-gray-200"
              }`}
            >
              نام {selectedRole} را انتخاب کنید
            </label>
            {isLoading ? (
              <div className="text-center text-gray-400">درحال بارگذاری...</div>
            ) : people.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {people.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => onSelectPerson(person)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      isLight
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {person.username}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                هیچ فردی با این نقش یافت نشد
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonDetailView({ facility, section, person, onBack }) {
  const [workHistory, setWorkHistory] = useState([]);
  const [personMetrics, setPersonMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPersonData();
  }, [person]);

  const loadPersonData = async () => {
    try {
      setIsLoading(true);
      const workData = await kpiApi.getPersonWorkHistory(person.id);
      setWorkHistory(workData.work_history);
      setPersonMetrics(workData.metrics);
    } catch (error) {
      toast.error("خطا در بارگذاری داده‌های فرد");
      console.error("Error loading person data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Done":
        return "bg-green-600";
      case "Working":
        return "bg-yellow-600";
      case "Not Done":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "Done":
        return "انجام شده";
      case "Working":
        return "در حال انجام";
      case "Not Done":
        return "انجام نشده";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 px-4">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← برگشت
        </button>
        <div className="text-center text-gray-400">درحال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="mt-8 px-4">
      <button
        onClick={onBack}
        className={`mb-6 px-4 py-2 rounded-lg transition-colors ${
          isLight
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-700 text-gray-100 hover:bg-gray-600"
        }`}
      >
        ← برگشت
      </button>
      {/* Person Header */}
      <div
        className={`backdrop-blur-md shadow-lg rounded-xl p-6 border mb-6 ${
          isLight
            ? "bg-white/90 border-gray-200"
            : "bg-gray-800/60 border-gray-700"
        }`}
        dir="rtl"
      >
        <h2
          className={`text-2xl font-bold mb-4 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}
        >
          {person.username}
        </h2>
        <div
          className={`grid grid-cols-2 gap-4 ${
            isLight ? "text-gray-700" : "text-gray-300"
          }`}
        >
          <div>
            <span className="text-sm">واحد:</span> {facility}
          </div>
          <div>
            <span className="text-sm">بخش:</span> {section}
          </div>
        </div>
      </div>

      {/* Person KPI Metrics */}
      {personMetrics && (
        <div
          className={`backdrop-blur-md shadow-lg rounded-xl p-6 border mb-6 ${
            isLight
              ? "bg-white/90 border-gray-200"
              : "bg-gray-800/60 border-gray-700"
          }`}
          dir="rtl"
        >
          <h3
            className={`text-xl font-semibold mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}
          >
            کارکرد فرد
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-600 bg-opacity-30 rounded-lg p-4 border border-green-500">
              <div className="text-sm text-gray-200">انجام شده</div>
              <div className="text-2xl font-bold text-green-400">
                {personMetrics.completed_percentage}%
              </div>
            </div>
            <div className="bg-yellow-600 bg-opacity-30 rounded-lg p-4 border border-yellow-500">
              <div className="text-sm text-gray-200">در حال انجام</div>
              <div className="text-2xl font-bold text-yellow-400">
                {personMetrics.working_percentage}%
              </div>
            </div>
            <div className="bg-red-600 bg-opacity-30 rounded-lg p-4 border border-red-500">
              <div className="text-sm text-gray-200">انجام نشده</div>
              <div className="text-2xl font-bold text-red-400">
                {personMetrics.not_done_percentage}%
              </div>
            </div>
            <div className="bg-blue-600 bg-opacity-30 rounded-lg p-4 border border-blue-500">
              <div className="text-sm text-gray-200">میانگین انجام</div>
              <div className="text-2xl font-bold text-blue-400">
                {personMetrics.completion_percentage}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work History */}
      <div
        className={`backdrop-blur-md shadow-lg rounded-xl p-6 border ${
          isLight
            ? "bg-white/90 border-gray-200"
            : "bg-gray-800/60 border-gray-700"
        }`}
        dir="rtl"
      >
        <h3
          className={`text-xl font-semibold mb-4 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}
        >
          تاریخچه کار
        </h3>
        {workHistory.length > 0 ? (
          <div className="space-y-4">
            {workHistory.map((work, index) => (
              <div
                key={work.id || index}
                className="bg-gray-900 bg-opacity-40 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-100">
                      {work.task_name}
                    </h4>
                    <p className="text-sm text-gray-400">{work.created_at}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getStatusColor(
                      work.status
                    )}`}
                  >
                    {getStatusLabel(work.status)}
                  </span>
                </div>

                {work.description && (
                  <p className="text-gray-300 mb-3">{work.description}</p>
                )}

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">درصد انجام</span>
                    <span className="text-sm font-semibold text-gray-100">
                      {work.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        work.percentage === 100
                          ? "bg-green-500"
                          : work.percentage > 0
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${work.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {work.notes && (
                  <p className="text-sm text-gray-400 italic">
                    یادداشت: {work.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400">هیچ کاری ثبت نشده است</div>
        )}
      </div>
    </div>
  );
}

export default KpiDashboard;
