import React from "react";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function KpiDashboard() {
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"داشبورد KPI"} />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={true}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
      />
      <main className="w-full lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-1 mb-8">
          <div className="w-full justify-center items-center p-4"></div>
        </div>
      </main>
    </div>
  );
}

export default KpiDashboard;
