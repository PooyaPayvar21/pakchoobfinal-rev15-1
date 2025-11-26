/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

const getStatusDisplay = (pmstatus) => {
  const statusMap = {
    pending_pm_technician: "در انتظار تایید کارشناس نت",
    pending_pm_management: "در انتظار تایید رئیس نت",
    pending_worktype_technician: "در انتظار ثبت فرم توسط تکنیسین فنی",
    worktype_technician_submitted:
      "ثبت فرم توسط تکنیسین فنی و ارسال به رئیس فنی ",
    pending_worktype_management: "در انتظار تایید رئیس فنی",
    worktype_management_approved: "تایید شده توسط رئیس فنی",
    pending_production_operator: "در انتظار تایید توسط اپراتور تولید",
    production_operator_confirmed: "تایید شده توسط اپراتور تولید",
    pending_production_management: "در انتظار تایید توسط رئیس فنی",
    production_management_confirmed: "تایید شده توسط رئیس فنی",
    pending_final_pm_technician: "در انتظار تایید کارشناس نت",
    pending_final_pm_management: "در انتظار تایید رئیس نت",
    completed: "تکمیل شده",
    rejected: "رد شده",
  };
  return statusMap[pmstatus] || pmstatus;
};

const getWorktypeDisplay = (pmworktype) => {
  const worktypeMap = {
    mechanic: "مکانیک",
    electric: "برق",
    utility: "تاسیسات",
    metalworking: "فلزکاری",
    tarashkari: "تراشکاری",
  };
  return worktypeMap[pmworktype] || pmworktype;
};

export default function PmFormDisplay() {
  const { pmformcode } = useParams();
  const [formData, setFormData] = useState(null);
  const [technicianData, setTechnicianData] = useState([]);
  const [aghlamData, setAghlamData] = useState([]);
  const [personelData, setPersonelData] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(false);

  const handlePrint = () => {
    const printContent = document.querySelector(".print-content");
    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Form ${pmformcode}</title>
          <style>
            @page { 
              size: A4; 
              margin: 10mm;
            }
            body { 
              font-family: Arial, sans-serif; 
              direction: rtl;
              background-color: white;
              margin: 0;
              padding: 0;
            }
            .print-content {
              width: 100%;
              border: 1px solid #000;
            }
            .grid {
              display: grid;
            }
            .header-grid {
              display: grid;
              grid-template-columns: 150px 1fr 150px;
              border-bottom: 1px solid #000;
              padding: 4px;
            }
            .header-center {
              text-align: center;
              padding: 4px;
            }
            .header-right {
              padding: 4px;
            }
            .time-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              border-bottom: 1px solid #000;
              padding: 4px;
            }
            .time-box {
              border-left: 1px solid #000;
              padding: 4px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              border-bottom: 1px solid #000;
              padding: 4px;
            }
            .info-cell {
              border-left: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 4px;
              text-align: center;
            }
            .info-cell:last-child {
              border-left: none;
            }
            .description-box {
              padding: 4px;
              border-bottom: 1px solid #000;
              text-align: right;
            }
            .form-types {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              border-bottom: 1px solid #000;
              padding: 4px;
              text-align: center;
            }
            .equipment-status {
              border-bottom: 1px solid #000;
              padding: 4px;
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 4px 0;
              border: 1px solid #000;
            }
            th, td {
              border: 1px solid #000;
              padding: 2px;
              text-align: center;
              font-size: 12px;
            }
            th {
              background-color: #f0f0f0;
            }
            .signature-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              border-top: 1px solid #000;
              margin-top: 8px;
            }
            .signature-box {
              border-left: 1px solid #000;
              padding: 4px;
              text-align: center;
            }
            .signature-box:last-child {
              border-left: none;
            }
            .text-xs {
              font-size: 12px;
            }
            .text-sm {
              font-size: 14px;
            }
            .text-base {
              font-size: 16px;
            }
            .text-lg {
              font-size: 18px;
            }
            .text-xl {
              font-size: 20px;
            }
            .font-bold {
              font-weight: bold;
            }
            .text-center {
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .border-l {
              border-left: 1px solid #000;
            }
            .border-b {
              border-bottom: 1px solid #000;
            }
            .border-t {
              border-top: 1px solid #000;
            }
            .border-black {
              border-color: #000;
            }
            .p-1 {
              padding: 4px;
            }
            .p-2 {
              padding: 8px;
            }
            .p-4 {
              padding: 16px;
            }
            .mt-1 {
              margin-top: 4px;
            }
            .mt-2 {
              margin-top: 8px;
            }
            .mt-4 {
              margin-top: 16px;
            }
            .mb-1 {
              margin-bottom: 4px;
            }
            .mb-2 {
              margin-bottom: 8px;
            }
            .mb-4 {
              margin-bottom: 16px;
            }
            .my-2 {
              margin-top: 8px;
              margin-bottom: 8px;
            }
            .my-4 {
              margin-top: 16px;
              margin-bottom: 16px;
            }
            .grid-cols-1 {
              grid-template-columns: 1fr;
            }
            .grid-cols-2 {
              grid-template-columns: repeat(2, 1fr);
            }
            .grid-cols-3 {
              grid-template-columns: repeat(3, 1fr);
            }
            .grid-cols-4 {
              grid-template-columns: repeat(4, 1fr);
            }
            .grid-cols-5 {
              grid-template-columns: repeat(5, 1fr);
            }
            .gap-2 {
              gap: 8px;
            }
            .gap-4 {
              gap: 16px;
            }
            .flex {
              display: flex;
            }
            .items-center {
              align-items: center;
            }
            .justify-center {
              justify-content: center;
            }
            .justify-end {
              justify-content: flex-end;
            }
            .w-3 {
              width: 12px;
            }
            .h-3 {
              height: 12px;
            }
            .w-4 {
              width: 16px;
            }
            .h-4 {
              height: 16px;
            }
            .w-full {
              width: 100%;
            }
            .h-auto {
              height: auto;
            }
            .overflow-x-auto {
              overflow-x: auto;
            }
            .hidden {
              display: none;
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-content {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!pmformcode) {
        console.log("No pmformcode provided, skipping data fetch");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching form data for code:", pmformcode);

        // Import all API functions at once to avoid multiple imports
        const {
          getPmFormByCode,
          getPmTechniciansByFormCode,
          getPmAghlamsByFormCode,
          getPmPersonelsByFormCode,
        } = await import("../api");

        // Fetch form data
        let formResponse;
        try {
          formResponse = await getPmFormByCode(pmformcode);
          console.log(
            "Form data received from API function:",
            formResponse.data
          );
        } catch (error) {
          console.log("API function failed, trying direct endpoint");
          formResponse = await api.get(`/pmformssubmit/${pmformcode}/`);
          console.log(
            "Form data received from direct endpoint:",
            formResponse.data
          );
        }

        // Extract the form data from the response
        const formData = formResponse.data.form_data || formResponse.data;
        console.log("Processed form data:", formData);
        setFormData(formData);

        // Fetch technician data
        console.log("Fetching technician data");
        try {
          // Try to fetch technician data using the API function
          const technicianResponse = await getPmTechniciansByFormCode(
            pmformcode
          );
          console.log("Technician data received:", technicianResponse.data);

          // Handle different response formats
          let techData;
          if (Array.isArray(technicianResponse.data)) {
            techData = technicianResponse.data;
          } else if (
            technicianResponse.data &&
            typeof technicianResponse.data === "object"
          ) {
            // If it's an object with a results property (common in Django REST Framework)
            techData =
              technicianResponse.data.results ||
              (technicianResponse.data.data
                ? technicianResponse.data.data
                : []);
          } else {
            techData = [];
          }

          console.log("Processed technician data:", techData);
          setTechnicianData(techData);
        } catch (error) {
          console.error("Error fetching technician data:", error);
          // Try direct API call as fallback
          try {
            // First try the list endpoint
            const fallbackResponse = await api.get(
              `/pmtechniciansubmit/list/?pmformcode=${pmformcode}`
            );
            const fallbackData = Array.isArray(fallbackResponse.data)
              ? fallbackResponse.data
              : fallbackResponse.data?.results ||
                (fallbackResponse.data?.data ? fallbackResponse.data.data : []);
            console.log(
              "Fallback technician data from list endpoint:",
              fallbackData
            );

            if (fallbackData.length > 0) {
              setTechnicianData(fallbackData);
            } else {
              // If list endpoint returns empty, try the detail endpoint
              try {
                const detailResponse = await api.get(
                  `/pmtechniciansubmit/${pmformcode}/`
                );
                const detailData = Array.isArray(detailResponse.data)
                  ? detailResponse.data
                  : [detailResponse.data];
                console.log(
                  "Technician data from detail endpoint:",
                  detailData
                );
                setTechnicianData(detailData);
              } catch (detailError) {
                console.error("Detail technician fetch failed:", detailError);
                setTechnicianData([]);
              }
            }
          } catch (fallbackError) {
            console.error("Fallback technician fetch failed:", fallbackError);
            // Try the detail endpoint as a last resort
            try {
              const detailResponse = await api.get(
                `/pmtechniciansubmit/${pmformcode}/`
              );
              const detailData = Array.isArray(detailResponse.data)
                ? detailResponse.data
                : [detailResponse.data];
              console.log(
                "Technician data from detail endpoint (last resort):",
                detailData
              );
              setTechnicianData(detailData);
            } catch (detailError) {
              console.error(
                "Detail technician fetch failed (last resort):",
                detailError
              );
              setTechnicianData([]);
            }
          }
        }

        // Fetch aghlam data
        console.log("Fetching aghlam data");
        try {
          // Try to fetch aghlam data using the API function
          const aghlamResponse = await getPmAghlamsByFormCode(pmformcode);
          console.log("Aghlam data received:", aghlamResponse.data);

          // Handle different response formats
          let aghlamData;
          if (Array.isArray(aghlamResponse.data)) {
            aghlamData = aghlamResponse.data;
          } else if (
            aghlamResponse.data &&
            typeof aghlamResponse.data === "object"
          ) {
            // If it's an object with a results property (common in Django REST Framework)
            aghlamData =
              aghlamResponse.data.results ||
              (aghlamResponse.data.data ? aghlamResponse.data.data : []);
          } else {
            aghlamData = [];
          }

          console.log("Processed aghlam data:", aghlamData);
          setAghlamData(aghlamData);
        } catch (error) {
          console.error("Error fetching aghlam data:", error);
          // Try direct API call as fallback
          try {
            // First try the query parameter endpoint
            const fallbackResponse = await api.get(
              `/pmaghlam/?pmformcode=${pmformcode}`
            );
            const fallbackData = Array.isArray(fallbackResponse.data)
              ? fallbackResponse.data
              : fallbackResponse.data?.results ||
                (fallbackResponse.data?.data ? fallbackResponse.data.data : []);
            console.log(
              "Fallback aghlam data from query endpoint:",
              fallbackData
            );

            if (fallbackData.length > 0) {
              setAghlamData(fallbackData);
            } else {
              // If query endpoint returns empty, try the detail endpoint
              try {
                const detailResponse = await api.get(
                  `/pmaghlam/${pmformcode}/`
                );
                const detailData = Array.isArray(detailResponse.data)
                  ? detailResponse.data
                  : [detailResponse.data];
                console.log("Aghlam data from detail endpoint:", detailData);
                setAghlamData(detailData);
              } catch (detailError) {
                console.error("Detail aghlam fetch failed:", detailError);
                setAghlamData([]);
              }
            }
          } catch (fallbackError) {
            console.error("Fallback aghlam fetch failed:", fallbackError);
            // Try the detail endpoint as a last resort
            try {
              const detailResponse = await api.get(`/pmaghlam/${pmformcode}/`);
              const detailData = Array.isArray(detailResponse.data)
                ? detailResponse.data
                : [detailResponse.data];
              console.log(
                "Aghlam data from detail endpoint (last resort):",
                detailData
              );
              setAghlamData(detailData);
            } catch (detailError) {
              console.error(
                "Detail aghlam fetch failed (last resort):",
                detailError
              );
              setAghlamData([]);
            }
          }
        }

        // Fetch personel data
        console.log("Fetching personel data");
        try {
          // Try to fetch personel data using the API function
          const personelResponse = await getPmPersonelsByFormCode(pmformcode);
          console.log("Personel data received:", personelResponse.data);

          // Handle different response formats
          let personelData;
          if (Array.isArray(personelResponse.data)) {
            personelData = personelResponse.data;
          } else if (
            personelResponse.data &&
            typeof personelResponse.data === "object"
          ) {
            // If it's an object with a results property (common in Django REST Framework)
            personelData =
              personelResponse.data.results ||
              (personelResponse.data.data ? personelResponse.data.data : []);
          } else {
            personelData = [];
          }

          console.log("Processed personel data:", personelData);
          setPersonelData(personelData);
        } catch (error) {
          console.error("Error fetching personel data:", error);
          // Try direct API call as fallback
          try {
            // First try the query parameter endpoint
            const fallbackResponse = await api.get(
              `/pmpersonel/?pmformcode=${pmformcode}`
            );
            const fallbackData = Array.isArray(fallbackResponse.data)
              ? fallbackResponse.data
              : fallbackResponse.data?.results ||
                (fallbackResponse.data?.data ? fallbackResponse.data.data : []);
            console.log(
              "Fallback personel data from query endpoint:",
              fallbackData
            );

            if (fallbackData.length > 0) {
              setPersonelData(fallbackData);
            } else {
              // If query endpoint returns empty, try the detail endpoint
              try {
                const detailResponse = await api.get(
                  `/pmpersonel/${pmformcode}/`
                );
                const detailData = Array.isArray(detailResponse.data)
                  ? detailResponse.data
                  : [detailResponse.data];
                console.log("Personel data from detail endpoint:", detailData);
                setPersonelData(detailData);
              } catch (detailError) {
                console.error("Detail personel fetch failed:", detailError);
                setPersonelData([]);
              }
            }
          } catch (fallbackError) {
            console.error("Fallback personel fetch failed:", fallbackError);
            // Try the detail endpoint as a last resort
            try {
              const detailResponse = await api.get(
                `/pmpersonel/${pmformcode}/`
              );
              const detailData = Array.isArray(detailResponse.data)
                ? detailResponse.data
                : [detailResponse.data];
              console.log(
                "Personel data from detail endpoint (last resort):",
                detailData
              );
              setPersonelData(detailData);
            } catch (detailError) {
              console.error(
                "Detail personel fetch failed (last resort):",
                detailError
              );
              setPersonelData([]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("خطا در دریافت اطلاعات فرم");
        setFormData(null);
        setTechnicianData([]);
        setAghlamData([]);
        setPersonelData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pmformcode]);
  function extractPersonnelRows(personelObj) {
    // personelObj = { personel, personelnumber, ..., personel8, ... }
    const result = [];
    for (let i = 1; i <= 8; i++) {
      const suffix = i === 1 ? "" : String(i);
      const name = personelObj[`personel${suffix}`];
      if (name && name.trim() !== "") {
        result.push({
          personel: personelObj[`personel${suffix}`],
          personelnumber: personelObj[`personelnumber${suffix}`],
          specialjob: personelObj[`specialjob${suffix}`],
          starttimerepair: personelObj[`starttimerepair${suffix}`],
          endtimerepair: personelObj[`endtimerepair${suffix}`],
          shift: personelObj.shift,
        });
      }
    }
    return result;
  }

  const personnelRows =
    personelData.length > 0 ? extractPersonnelRows(personelData[0]) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl text-gray-800 font-bold mb-6 text-center">
            جزئیات فرم {pmformcode}
          </h2>
          <div className="text-center text-red-500">
            <p>اطلاعات فرم یافت نشد.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-4 px-2 lg:px-8 mb-8">
        <div className="no-print mb-4 flex justify-end">
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center gap-2 text-sm md:text-base"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 md:h-5 md:w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                clipRule="evenodd"
              />
            </svg>
            چاپ فرم
          </button>
        </div>
        <div className="print-content border border-black bg-white text-black">
          {/* Header Section */}
          <div className="grid grid-cols-[100px_1fr_100px] md:grid-cols-[200px_1fr_200px] border-b border-black">
            <div className="mt-8 md:mt-13 justify-center items-center border-l border-black text-center text-xs md:text-base">
              <div className="font-bold">شماره درخواست</div>
              <div>{formData.pmformcode}</div>
            </div>
            <div className="text-center md:mt-12 p-0">
              <div className="flex justify-center text-center items-center font-bold text-lg md:text-xl">
                شرکت صنعت چوب شمال (پاک چوب)
              </div>
            </div>
            <div className="p-1 hidden md:block">
              <img src="/pakchoob.png" alt="Logo" className="w-full h-auto" />
            </div>
          </div>

          {/* Form Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-black">
            <div className="p-2 md:p-4 border-l border-black">
              <div className="font-bold text-center text-sm md:text-base">
                مدت زمان شروع تعمیرات
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-4 text-center justify-center mt-1">
                <div className="mt-2 md:mt-5 border border-black text-center text-xs md:text-sm">
                  تاریخ
                </div>
                <div className="mt-2 md:mt-5 border border-black p-1 text-xs md:text-sm">
                  {formatDate(technicianData[0]?.startpmrepairtime) || "-"}
                </div>
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black">
              <div className="font-bold text-center text-sm md:text-base">
                مدت زمان پایان تعمیرات
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-4 text-center justify-center mt-1">
                <div className="mt-2 md:mt-5 border border-black text-center text-xs md:text-sm">
                  تاریخ
                </div>
                <div className="mt-2 md:mt-5 border border-black p-1 text-xs md:text-sm">
                  {formatDate(technicianData[0]?.endpmrepairtime) || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-black">
            <div className="p-2 md:p-4 border-l border-black text-right">
              <div className="font-bold text-sm md:text-base">
                : تاریخ درخواست
              </div>
              <div className="text-center text-xs md:text-sm">
                {formatDate(formData.pmformdate)}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black text-center">
              <div className="font-bold text-right text-sm md:text-base">
                : کد دستگاه
              </div>
              <div className="text-center text-xs md:text-sm">
                {formData.pmmachinename}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black text-right">
              <div className="font-bold text-sm md:text-base">
                : محل استقرار
              </div>
              <div className="text-center text-xs md:text-sm">
                {formData.pmsection || "-"}
              </div>
            </div>
          </div>

          {/* PM Technician Information */}
          <div className="border-b border-black">
            <div className="p-2 md:p-4">
              <div className="font-bold mb-2 text-sm md:text-base text-center">
                اطلاعات تکنسین
              </div>

              {technicianData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                  <div className="border border-black p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-right text-xs md:text-sm">
                        {getWorktypeDisplay(
                          technicianData[0].pmworktype ||
                            technicianData[0].pmworktype
                        ) || "-"}
                      </div>
                      <div className="text-right font-bold text-xs md:text-sm">
                        :نوع کار
                      </div>
                      <div className="text-right text-xs md:text-sm">
                        {technicianData[0].pmfailurereason || "-"}
                      </div>
                      <div className="text-right font-bold text-xs md:text-sm">
                        :دلیل خرابی
                      </div>

                      <div className="text-right text-xs md:text-sm">
                        {technicianData[0].worktime || "-"}
                      </div>
                      <div className="text-right font-bold text-xs md:text-sm">
                        :زمان کار
                      </div>
                    </div>
                  </div>

                  <div className="border border-black p-2">
                    <div className="text-right font-bold text-xs md:text-sm mb-1">
                      : شرح مشکل
                    </div>
                    <div className="text-right text-xs md:text-sm min-h-[40px] pt-1">
                      {technicianData[0].pmproblemdescription || "-"}
                    </div>

                    {technicianData[0]?.pmjobstatus === "خیر" && (
                      <div className="mt-2">
                        <div className="text-right font-bold text-xs md:text-sm">
                          : دلیل انجام نشدن
                        </div>
                        <div className="text-right text-xs md:text-sm border-t border-gray-300 pt-1">
                          {technicianData[0].notdonereason || "-"}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border border-black p-2">
                    <div className="font-bold mb-2 text-sm md:text-base text-center">
                      وضعیت کار
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="items-center text-center text-xs md:text-sm mt-3">
                        <input
                          type="checkbox"
                          checked={technicianData[0]?.pmjobstatus === "بله"}
                          readOnly
                          className="w-3 h-3 md:w-4 md:h-4"
                        />
                        <span className="mr-1 md:mr-2">کار انجام شد</span>
                      </div>
                      <div className="items-center text-center text-xs md:text-sm mt-3">
                        <input
                          type="checkbox"
                          checked={technicianData[0]?.pmjobstatus === "خیر"}
                          readOnly
                          className="w-3 h-3 md:w-4 md:h-4"
                        />
                        <span className="mr-1 md:mr-2">کار انجام نشد</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-xs md:text-sm">
                  اطلاعات تکنسین موجود نیست
                </div>
              )}
            </div>
          </div>
          {/* Personnel Information */}
          <div className="border-b border-black">
            <div className="p-2 md:p-4">
              <div className="font-bold mb-2 text-sm md:text-base text-center">
                اطلاعات پرسنل
              </div>

              {personnelRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border border-black">
                    <thead>
                      <tr className="border-b border-black text-xs md:text-sm">
                        <th className="border-l border-black p-1 md:p-2">
                          ساعت پایان تعمیرات
                        </th>
                        <th className="border-l border-black p-1 md:p-2">
                          ساعت شروع تعمیرات
                        </th>
                        <th className="border-l border-black p-1 md:p-2">
                          شیفت
                        </th>
                        <th className="border-l border-black p-1 md:p-2">
                          شماره پرسنلی
                        </th>
                        <th className="border-l border-black p-1 md:p-2">
                          نام پرسنل
                        </th>
                        <th className="border-l border-black p-1 md:p-2">
                          ردیف
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {personnelRows.map((p, index) => (
                        <tr
                          key={p.id || index}
                          className="border-b border-black text-xs md:text-sm"
                        >
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {formatDate(p.endtimerepair) || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {formatDate(p.starttimerepair) || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {p.shift || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {p.personelnumber || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {p.personel || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {index + 1}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-xs md:text-sm">
                  اطلاعات پرسنل موجود نیست
                </div>
              )}
            </div>
          </div>

          {/* Status Information */}
          <div className="border-b border-black">
            <div className="p-2 md:p-4">
              <div className="font-bold mb-2 text-sm md:text-base text-center">
                وضعیت فرم
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="border border-black p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-right text-xs md:text-sm">
                      {getStatusDisplay(formData.pmstatus) || "-"}
                    </div>
                    <div className="text-right font-bold text-xs md:text-sm">
                      : وضعیت فعلی
                    </div>
                    <div className="text-right text-xs md:text-sm">
                      {formatDate(formData.pmformdate) || "-"}
                    </div>
                    <div className="text-right font-bold text-xs md:text-sm">
                      : تاریخ ایجاد
                    </div>
                  </div>
                </div>

                <div className="border border-black p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-right text-xs md:text-sm">
                      {getWorktypeDisplay(formData.pmworktype) || "-"}
                    </div>
                    <div className="text-right font-bold text-xs md:text-sm">
                      : نوع کار
                    </div>
                    <div className="text-right text-xs md:text-sm">
                      {formData.pmsection || "-"}
                    </div>
                    <div className="text-right font-bold text-xs md:text-sm">
                      : بخش
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aghlam Information (Parts) */}
          <div className="border-b border-black">
            <div className="p-2 md:p-4">
              <div className="font-bold mb-2 text-sm md:text-base text-center">
                اطلاعات قطعات مصرفی
              </div>

              {aghlamData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border border-black">
                    <thead>
                      <tr className="border-b border-black text-xs md:text-sm">
                        <th className="border-l border-black p-1 md:p-2">
                          کد کالا
                        </th>
                        <th className="border-l border-black p-1 md:p-2">
                          واحد
                        </th>
                        <th className="border-l border-black p-1 md:p-2">
                          تعداد
                        </th>
                        <th className="p-1 md:p-2 border-l border-black">
                          نام کالا
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {aghlamData.map((aghlam, index) => (
                        <tr
                          key={index}
                          className="border-b border-black text-xs md:text-sm"
                        >
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {aghlam.codekala || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {aghlam.vahedkala || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {aghlam.countkala || "-"}
                          </td>
                          <td className="p-1 md:p-2 text-center border-l border-black">
                            {aghlam.kalaname || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-xs md:text-sm">
                  اطلاعات قطعات مصرفی موجود نیست
                </div>
              )}
            </div>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-1 md:grid-cols-5 border-t border-black mt-auto">
            <div className="p-2 md:p-4 border-l border-black border-b md:border-b-0 text-center">
              <div className="text-xs md:text-sm">
                نام و امضاء سرپرست شیفت تولید
              </div>
              <div className="my-2 md:my-4 text-xs md:text-sm">
                {formData.production_operator_confirmation_name || "-"}
              </div>
              <div className="text-xs md:text-sm">
                تاریخ:{" "}
                {(() => {
                  console.log("\n=== Operator Confirmation Debug ===");
                  console.log("Form Status:", formData.pmstatus);
                  console.log(
                    "Operator Confirmation Date:",
                    formData.production_operator_confirmation_date
                  );
                  console.log("Form Data:", formData);
                  return formData.production_operator_confirmation_date
                    ? formatDate(formData.production_operator_confirmation_date)
                    : "-";
                })()}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black border-b md:border-b-0 text-center">
              <div className="text-xs md:text-sm">
                نام و امضاء مسئول تعمیرات
              </div>
              <div className="my-2 md:my-4 text-xs md:text-sm">
                {formData.worktype_technician_confirmation_name || "-"}
              </div>
              <div className="text-xs md:text-sm">
                تاریخ:{" "}
                {(() => {
                  console.log("\n=== Technician Confirmation Debug ===");
                  console.log("Form Status:", formData.pmstatus);
                  console.log(
                    "Technician Confirmation Date:",
                    formData.worktype_technician_confirmation_date
                  );
                  console.log("Form Data:", formData);
                  return formData.worktype_technician_confirmation_date
                    ? formatDate(formData.worktype_technician_confirmation_date)
                    : "-";
                })()}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black border-b md:border-b-0 text-center">
              <div className="text-xs md:text-sm">
                نام و امضاء رئیس واحد تعمیرات
              </div>
              <div className="my-2 md:my-4 text-xs md:text-sm">
                {formData.worktype_management_confirmation_name || "-"}
              </div>
              <div className="text-xs md:text-sm">
                تاریخ:{" "}
                {(() => {
                  console.log("\n=== Management Confirmation Debug ===");
                  console.log("Form Status:", formData.pmstatus);
                  console.log(
                    "Management Confirmation Date:",
                    formData.worktype_management_confirmation_date
                  );
                  console.log("Form Data:", formData);
                  return formData.worktype_management_confirmation_date
                    ? formatDate(formData.worktype_management_confirmation_date)
                    : "-";
                })()}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black border-b md:border-b-0 text-center">
              <div className="text-xs md:text-sm">نام و امضاء رئیس تولید</div>
              <div className="my-2 md:my-4 text-xs md:text-sm">
                {formData.production_management_confirmation_name || "-"}
              </div>
              <div className="text-xs md:text-sm">
                تاریخ:{" "}
                {(() => {
                  console.log(
                    "\n=== Production Management Confirmation Debug ==="
                  );
                  console.log("Form Status:", formData.pmstatus);
                  console.log(
                    "Production Management Confirmation Date:",
                    formData.production_management_confirmation_date
                  );
                  console.log("Form Data:", formData);
                  return formData.production_management_confirmation_date
                    ? formatDate(
                        formData.production_management_confirmation_date
                      )
                    : "-";
                })()}
              </div>
            </div>
            <div className="p-2 md:p-4 text-center border-l border-black border-b md:border-b-0">
              <div className="text-xs md:text-sm">نام و امضاء رئیس واحد نت</div>
              <div className="my-2 md:my-4 text-xs md:text-sm">
                {formData.final_pm_management_confirmation_name || "-"}
              </div>
              <div className="mb-2 text-xs md:text-sm">
                : تاریخ
                <div className="text-base md:text-lg mt-1">
                  {(() => {
                    return formData.final_pm_management_confirmation_date
                      ? formatDate(
                          formData.final_pm_management_confirmation_date
                        )
                      : "-";
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
