/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "framer-motion";

const StatCard = ({ name, icon: Icon, value, color }) => {
  // Ensure value is a string and handle undefined/null
  const displayValue = value ? value.toString() : "0";

  const isLight = document.documentElement.classList.contains("light");

  return (
    <motion.div
      className={`${
        isLight
          ? "bg-white/90 border border-gray-200"
          : "bg-gray-800/60 border border-gray-700"
      } backdrop-blur-md overflow-hidden shadow-lg rounded-xl`}
      whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
    >
      <div className="px-4 py-5 sm:p-6">
        <span
          className={`flex items-center text-sm font-medium ${
            isLight ? "text-gray-600" : "text-gray-400"
          }`}
        >
          <Icon size={20} className="mr-2" style={{ color }} />
          {name}
        </span>
        <p
          className={`mt-1 text-3xl font-semibold ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}
        >
          {displayValue}
        </p>
      </div>
    </motion.div>
  );
};

export default StatCard;
