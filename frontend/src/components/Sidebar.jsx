/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { href, Link } from "react-router-dom";
import {
  BarChart2,
  Menu,
  Power,
  BookOpenCheck,
  ClipboardList,
  PersonStanding,
  BookOpenText,
  Calendar,
  Settings as SettingsIcon,
} from "lucide-react";
import { AnimatePresence, color, motion } from "framer-motion";
import { Tooltip } from "@mui/material";
import { api, getUnreadFormsCount } from "../api";

const Sidebar = () => {
  // Initialize default menu items
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userType, setUserType] = useState(null);
  const [menuItems, setMenuItems] = useState(() => {
    const baseItems = [
      {
        name: "KPI Dashboard",
        icon: BarChart2,
        color: "#F59E0B",
        href: "/kpidashboard",
      },
      {
        name: "User Info",
        icon: PersonStanding,
        color: "#8B5CF6",
        href: "/kpiuserinfo",
      },
      {
        name: "اعلان‌ها",
        icon: Calendar,
        color: "#60A5FA",
        href: "/notifications",
      },
    ];

    const role = localStorage.getItem("user_role");
    if (role === "management") {
      baseItems.push(
        {
          name: "Submit KPI",
          icon: BookOpenCheck,
          color: "#EC4899",
          href: "/kpidataentry",
        },
        {
          name: "Relation",
          icon: BookOpenCheck,
          color: "#EC4899",
          href: "/kpirelation",
        },
        {
          name: "Management Review",
          icon: BookOpenCheck,
          color: "#EC4899",
          href: "/kpimanagerreview",
        }
      );
    }
    baseItems.push({
      name: "تنظیمات",
      icon: SettingsIcon,
      color: "#3B82F6",
      href: "/settings",
    });

    baseItems.push({
      name: "خروج",
      icon: Power,
      color: "#6ee7b7",
      href: "/logout",
    });

    return baseItems;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [unreadFormsCount, setUnreadFormsCount] = useState(0);
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("full_name")
  );
  const [departman, setDepartman] = useState(null);
  const [companyName, setCompanyName] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const updateDisplayName = () => {
      const kpiUserInfo = JSON.parse(
        localStorage.getItem("kpiUserInfo") || "{}"
      );
      if (kpiUserInfo.full_name) {
        setDisplayName(kpiUserInfo.full_name);
      }
      if (kpiUserInfo.departman) {
        setDepartman(kpiUserInfo.departman);
      }
      if (kpiUserInfo.company_name) {
        setCompanyName(kpiUserInfo.company_name);
      }
    };

    updateDisplayName();
    window.addEventListener("storage", updateDisplayName);
    return () => window.removeEventListener("storage", updateDisplayName);
  }, []);

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const storedUserType = localStorage.getItem("user_type");
        if (storedUserType) {
          setUserType(storedUserType);
          setIsLoading(false);
          return;
        }

        const response = await api.get("/user/info/");
        if (response.data && response.data.user_type) {
          setUserType(response.data.user_type);
          localStorage.setItem("user_type", response.data.user_type);
        }
      } catch (error) {
        console.error("Error fetching user type:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserType();
  }, []);

  useEffect(() => {
    const get_unread_forms_count = async () => {
      try {
        const response = await api.get("/forms/unread/");
        if (response.data && response.data.count !== undefined) {
          setUnreadFormsCount(response.data.count);
        } else {
          setUnreadFormsCount(0);
        }
      } catch (error) {
        console.error("Error fetching unread forms count:", error);
        setUnreadFormsCount(0);
      }
    };

    get_unread_forms_count();
    const interval = setInterval(get_unread_forms_count, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update menu items badge when unreadFormsCount changes
  useEffect(() => {
    setMenuItems((prevItems) =>
      prevItems.map((item) =>
        item.name === "فرم ها" ? { ...item, badge: unreadFormsCount } : item
      )
    );
  }, [unreadFormsCount]);

  useEffect(() => {
    if (!departman) {
      // Keep the default menu when departman is not available
      // The default menu is already set in useState
      return;
    }

    const menuConfig = {
      "General Utility": [
        {
          name: "داشبورد تصفیه خانه",
          icon: BarChart2,
          color: "#6366f1",
          href: "/watertreatmentdashboard",
        },
        {
          name: "ثبت فرم تصفیه خانه",
          icon: BookOpenCheck,
          color: "#EC4899",
          href: "/watertreatmentsubmit",
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      Machinary: [
        {
          name: "داشبورد ماشین آلات",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      "Technical Office": [
        {
          name: "دفتر فنی",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      "Technical Engineering": [
        {
          name: "مهندسی فنی",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      "Electric 1": [
        {
          name: "داشبورد برق 1",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      "Electric 2": [
        {
          name: "داشبورد برق 2",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      "Utility 1": [
        {
          name: "داشبورد یوتیلیتی 1",
          icon: BarChart2,
          color: "#6366f1",
          href: "/watertreatmentdashboard",
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      "Utility 2": [
        {
          name: "داشبورد یوتیلیتی 2",
          icon: BarChart2,
          color: "#6366f1",
          href: "/watertreatmentdashboard",
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      "Technical Office -General Mechanic": [
        {
          name: "دفتر فنی مکانیک عمومی",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      "Mechanic 1": [
        {
          name: "داشبورد مکانیک 1",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      "Mechanic 2": [
        {
          name: "داشبورد مکانیک 2",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      "Preventive Maintenance": [
        // {
        //   name: "داشبورد نگهداری پیشگیرانه",
        //   icon: BarChart2,
        //   color: "#6366f1",
        //   href: "/admindashboard",
        // },
        // {
        //   name: "فرم های PM",
        //   icon: ClipboardList,
        //   color: "#10B981",
        //   href: "/pmforms",
        // },
        {
          name: "داشبورد KPI",
          icon: BarChart2,
          color: "#F59E0B",
          href: "/kpidashboard",
        },
        {
          name: "اعلان‌ها",
          icon: Calendar,
          color: "#60A5FA",
          href: "/notifications",
        },
        {
          name: "تنظیمات",
          icon: SettingsIcon,
          color: "#3B82F6",
          href: "/settings",
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
    };

    setMenuItems((prevItems) => {
      const newMenu = menuConfig[departman] || prevItems;
      return newMenu;
    });
  }, [departman]);

  // Debug output for troubleshooting
  if (process.env.NODE_ENV !== "production") {
    console.log("Sidebar departman:", departman);
    console.log("Sidebar menuItems:", menuItems);
  }

  if (isLoading && menuItems.length === 0) {
    return (
      <div className="w-20 h-full bg-gray-800 bg-opacity-50 backdrop-blur-md p-4 flex flex-col border-r border-gray-700">
        <div className="animate-pulse h-6 w-6 bg-gray-700 rounded-full" />
        {/* Debug info */}
        <div className="text-xs text-red-400 mt-2">
          departman: {String(departman)}
        </div>
        <div className="text-xs text-yellow-400 mt-1">
          menuItems: {JSON.stringify(menuItems)}
        </div>
      </div>
    );
  }

  const isLight = document.documentElement.classList.contains("light");

  return (
    <>
      <motion.div
        className={`fixed md:static z-[9999] transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-full md:w-52" : "w-full md:w-16"
        } bottom-0 md:bottom-auto ${
          isLight
            ? "bg-white/95 backdrop-blur-md shadow-lg md:shadow-none"
            : "bg-gray-800 bg-opacity-95 backdrop-blur-md shadow-lg md:shadow-none"
        }`}
        animate={{
          width: isMobile ? "100%" : isSidebarOpen ? "210px" : "64px",
          height: isMobile ? (isSidebarOpen ? "auto" : "auto") : "100%",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div
          className={`h-full p-2 md:p-4 flex flex-col border-t md:border-r ${
            isLight ? "border-gray-200" : "border-gray-700"
          }`}
        >
          <div className="flex justify-between items-center mb-2 md:mb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-full transition-colors max-w-fit hidden md:block ${
                isLight ? "hover:bg-gray-200" : "hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Menu size={24} />
                <AnimatePresence mode="wait">
                  {isSidebarOpen && (
                    <motion.span
                      className={`text-sm font-bold ${
                        isLight ? "text-gray-700" : "text-gray-300"
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.1 }}
                    >
                      {displayName}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.span
                  className={`text-lg font-semibold hidden md:block ${
                    isLight ? "text-gray-900" : "text-white"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.1 }}
                ></motion.span>
              )}
            </AnimatePresence>
          </div>
          <nav
            className={`flex-grow flex ${
              isMobile
                ? "flex-row md:flex-col justify-between md:justify-start gap-1"
                : "flex-col gap-2"
            }`}
          >
            {menuItems &&
              menuItems.map((item) => (
                <Link key={item.href} to={item.href}>
                  <Tooltip
                    title={item.name}
                    placement={isMobile ? "top" : "right"}
                  >
                    <motion.div
                      className={`flex items-center p-2 md:p-4 text-sm font-medium rounded-lg transition-colors ${
                        !isSidebarOpen
                          ? "flex-col justify-center"
                          : "flex-row justify-start gap-3"
                      } ${isLight ? "hover:bg-gray-200" : "hover:bg-gray-700"}`}
                    >
                      <div className="flex items-center gap-3 relative">
                        <item.icon
                          size={22}
                          style={{ color: item.color, minWidth: "22px" }}
                        />
                        {item.badge && item.badge > 0 && (
                          <span className="absolute -top-0 -right-6 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg z-50 border border-white">
                            {item.badge}
                          </span>
                        )}
                        <AnimatePresence mode="wait">
                          {isSidebarOpen && (
                            <motion.span
                              className={`text-xs md:text-sm whitespace-nowrap ${
                                isLight ? "text-gray-700" : "text-gray-100"
                              }`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{
                                duration: 0.1,
                              }}
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </Tooltip>
                </Link>
              ))}
          </nav>
        </div>
      </motion.div>
      <div className="mb-48 md:mb-0 min-h-[100vh]">
        {/* This div will add margin to the bottom of the main content and ensure minimum height */}
      </div>
    </>
  );
};

export default Sidebar;
