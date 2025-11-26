/* eslint-disable no-unused-vars */
import React from "react";
import Header from "../components/Common/Header";

import { Zap, Loader } from "lucide-react";
import { motion } from "framer-motion";
import WaterTreatmentArea from "../components/Charts/WaterTreatmentArea";
import WaterTreatmentBar from "../components/Charts/WaterTreatmentBar";

const WaterTreatmentDashboard = () => {
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="داشبورد تصفیه خانه" />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        ></motion.div>
        <div className="flex flex-col gap-8">
          <WaterTreatmentArea />
          <WaterTreatmentBar />
        </div>
      </main>
    </div>
  );
};

export default WaterTreatmentDashboard;
