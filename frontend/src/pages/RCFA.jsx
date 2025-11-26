import React from "react";
import Header from "../components/Common/Header";
import { motion } from "framer-motion";
import InteractiveTreeDiagram from "../components/InteractiveTreeDiagram";

function RCFA() {
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"RCFA"} />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <InteractiveTreeDiagram />
        </motion.div>
      </main>
    </div>
  );
}

export default RCFA;
