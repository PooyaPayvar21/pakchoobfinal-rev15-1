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
} from "lucide-react";
import { AnimatePresence, color, motion } from "framer-motion";
import { Tooltip } from "@mui/material";
import { api, getUnreadFormsCount } from "../api";

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userType, setUserType] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [unreadFormsCount, setUnreadFormsCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        console.log("Fetching unread forms count...");
        const response = await api.get("/forms/unread/");
        console.log("Unread forms response:", response.data);
        if (response.data && response.data.count !== undefined) {
          console.log("Setting unread forms count to:", response.data.count);
          setUnreadFormsCount(response.data.count);
        } else {
          console.warn("Invalid response format:", response.data);
          setUnreadFormsCount(0);
        }
      } catch (error) {
        console.error("Error fetching unread forms count:", error);
        setUnreadFormsCount(0);
      }
    };

    // Initial fetch
    get_unread_forms_count();

    // Poll every 30 seconds instead of 10 seconds
    const interval = setInterval(get_unread_forms_count, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!userType) return;

    const storedUsername = localStorage.getItem("username");
    const isPayvar = storedUsername === "P.payvar";
    const isAlekasiri = storedUsername === "A.alekasiri";
    const isEynolvand = storedUsername === "R.eynolvand";
    const isPMManagement =
      userType === "pm" && localStorage.getItem("user_role") === "management";

    console.log("Debug values:", {
      storedUsername,
      isPayvar,
      isAlekasiri,
      isEynolvand,
      userType,
      userRole: localStorage.getItem("user_role"),
      isPMManagement,
      unreadFormsCount,
    });

    const menuConfig = {
      pm: [
        {
          name: "داشبورد",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        {
          name: "ثبت فرم تصفیه خانه",
          icon: BookOpenCheck,
          color: "#EC4899",
          href: "/watertreatmentsubmit",
        },
        {
          name: "PmSubmit",
          icon: BookOpenCheck,
          color: "#EC4899",
          href: "/submitpm",
        },
        {
          name: "PmForms",
          icon: BookOpenCheck,
          color: "#EC4899",
          href: "/pmforms",
        },
        {
          name: "KPI",
          icon: BarChart2,
          color: "#ec4899",
          href: "/kpioverview",
        },
        {
          name: "RCFA",
          icon: BarChart2,
          color: "#6366f1",
          href: "/rcfa",
        },
        {
          name: "داشبورد تصفیه خانه",
          icon: BarChart2,
          color: "#6366f1",
          href: "/watertreatmentdashboard",
        },
        ...(isPMManagement && isPayvar
          ? [
              {
                name: "ثبت درخواست تعمیرات",
                icon: PersonStanding,
                color: "#EC4899",
                href: "/submitform",
              },
            ]
          : []),
        {
          name: "PM ثبت",
          icon: BookOpenText,
          color: "#EC4899",
          href: "/pmformsubmit",
        },
        ...(isPMManagement && isPayvar
          ? [
              {
                name: "ثبت نفرات",
                icon: PersonStanding,
                color: "#EC4899",
                href: "/register",
              },
            ]
          : []),
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        ...(isPMManagement || isPayvar || isAlekasiri
          ? [
              {
                name: "یادآورهای تقویم",
                icon: Calendar,
                color: "#8B5CF6",
                href: "/calendar",
              },
            ]
          : []),
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      mechanic: [
        {
          name: "داشبورد",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        // {
        //   name: "ثبت درخواست تعمیرات",
        //   icon: PersonStanding,
        //   color: "#EC4899",
        //   href: "/submitform",
        // },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        // {
        //   name: "PmForms",
        //   icon: BookOpenCheck,
        //   color: "#EC4899",
        //   href: "/pmforms",
        // },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      electric: [
        {
          name: "داشبورد",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        // {
        //   name: "ثبت درخواست تعمیرات",
        //   icon: PersonStanding,
        //   color: "#EC4899",
        //   href: "/submitform",
        // },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      utility: [
        {
          name: "داشبورد",
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
        // {
        //   name: "ثبت درخواست تعمیرات",
        //   icon: PersonStanding,
        //   color: "#EC4899",
        //   href: "/submitform",
        // },
        // {
        //   name: "فرم ها",
        //   icon: ClipboardList,
        //   color: "#10B981",
        //   href: "/forms",
        //   badge: unreadFormsCount,
        // },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      generalmechanic: [
        {
          name: "داشبورد",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        // {
        //   name: "ثبت درخواست تعمیرات",
        //   icon: PersonStanding,
        //   color: "#EC4899",
        //   href: "/submitform",
        // },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        ...(isEynolvand
          ? [
              {
                name: "یادآورهای تقویم",
                icon: Calendar,
                color: "#8B5CF6",
                href: "/calendar",
              },
            ]
          : []),
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      production: [
        {
          name: "داشبورد",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        {
          name: "ثبت درخواست تعمیر",
          icon: BookOpenCheck,
          color: "#EC4899",
          href: "/submitform",
        },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      metalworking: [
        {
          name: "داشبورد",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        // {
        //   name: "ثبت درخواست تعمیرات",
        //   icon: PersonStanding,
        //   color: "#EC4899",
        //   href: "/submitform",
        // },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      tarashkari: [
        {
          name: "داشبورد",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        // {
        //   name: "ثبت درخواست تعمیرات",
        //   icon: PersonStanding,
        //   color: "#EC4899",
        //   href: "/submitform",
        // },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
      paint: [
        {
          name: "داشبورد",
          icon: BarChart2,
          color: "#6366f1",
          href: "/admindashboard",
        },
        // {
        //   name: "ثبت درخواست تعمیرات",
        //   icon: PersonStanding,
        //   color: "#EC4899",
        //   href: "/submitform",
        // },
        {
          name: "فرم ها",
          icon: ClipboardList,
          color: "#10B981",
          href: "/forms",
          badge: unreadFormsCount,
        },
        { name: "خروج", icon: Power, color: "#6ee7b7", href: "/logout" },
      ],
    };

    setMenuItems(menuConfig[userType] || []);
  }, [userType, unreadFormsCount]);

  if (isLoading) {
    return (
      <div className="w-20 h-full bg-gray-800 bg-opacity-50 backdrop-blur-md p-4 flex flex-col border-r border-gray-700">
        <div className="animate-pulse h-6 w-6 bg-gray-700 rounded-full" />
      </div>
    );
  }

  if (!userType) {
    return null;
  }

  return (
    <>
      <motion.div
        className={`fixed md:static z-[9999] transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-full md:w-52" : "w-full md:w-16"}
          bottom-0 md:bottom-auto
          bg-gray-800 bg-opacity-95 backdrop-blur-md
          shadow-lg md:shadow-none`}
        animate={{
          width: isMobile ? "100%" : isSidebarOpen ? "210px" : "64px",
          height: isMobile ? (isSidebarOpen ? "auto" : "auto") : "100%",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="h-full p-2 md:p-4 flex flex-col border-t md:border-r border-gray-700">
          <div className="flex justify-between items-center mb-2 md:mb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors max-w-fit hidden md:block"
            >
              <div className="flex items-center gap-2">
                <Menu size={24} />
                <AnimatePresence mode="wait">
                  {isSidebarOpen && (
                    <motion.span
                      className="text-sm font-bold text-gray-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.1 }}
                    >
                      {localStorage.getItem("username")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.span
                  className="text-white text-lg font-semibold hidden md:block"
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
                ? "flex-row md:flex-col justify-between md:justify-start"
                : "flex-col"
            } gap-2 md:gap-0`}
          >
            {menuItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <Tooltip
                  title={item.name}
                  placement={isMobile ? "top" : "right"}
                >
                  <motion.div
                    className={`flex items-center p-2 md:p-4 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors mb-0 md:mb-2 ${
                      !isSidebarOpen
                        ? "flex-col justify-center"
                        : "flex-row justify-start gap-3"
                    }`}
                  >
                    <div className="flex items-center gap-3 relative">
                      <item.icon
                        size={22}
                        style={{ color: item.color, minWidth: "22px" }}
                      />
                      {item.badge > 0 && (
                        <span className="absolute -top-0 -right-6 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg z-50 border border-white">
                          {item.badge}
                        </span>
                      )}
                      <AnimatePresence mode="wait">
                        {!isMobile && isSidebarOpen && (
                          <motion.span
                            className="text-xs md:text-sm whitespace-nowrap"
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
