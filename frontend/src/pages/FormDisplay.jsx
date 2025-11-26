/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { toast } from "react-toastify";
import moment from "moment-jalaali";
import { motion } from "framer-motion";

// Format for stop time and other main form dates
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    // Subtract 3 hours and 30 minutes to correct for UTC to Iran timezone conversion
    const date = moment(dateString)
      .subtract(3, "hours")
      .subtract(30, "minutes");
    return date.locale("fa").format("jYYYY/jMM/jDD HH:mm");
  } catch (e) {
    console.error("Error formatting date:", e);
    return "-";
  }
};

// Format for repair times
const formatRepairTime = (timeString) => {
  if (!timeString) return "-";
  try {
    // Subtract 3 hours and 30 minutes to correct for UTC to Iran timezone conversion
    const time = moment(timeString)
      .subtract(3, "hours")
      .subtract(30, "minutes");
    return time.locale("fa").format("jYYYY/jMM/jDD HH:mm");
  } catch (e) {
    console.error("Error formatting repair time:", e);
    return "-";
  }
};

// Format for signature dates
const formatSignatureDate = (dateString) => {
  if (!dateString) return "-";
  try {
    // Parse the date and subtract 3 hours and 30 minutes to correct timezone
    const date = moment(dateString);
    return date.locale("fa").format("jYYYY/jMM/jDD HH:mm");
  } catch (e) {
    console.error("Error formatting signature date:", e);
    return "-";
  }
};

const getStatusDisplay = (status) => {
  const statusMap = {
    pending_technician: "در انتظار بررسی تکنسین",
    technician_submitted: "ارسال شده توسط تکنسین",
    pending_management: "در انتظار تایید مدیریت",
    management_approved: "تایید شده توسط مدیریت",
    pending_production: "در انتظار تایید تولید",
    production_confirmed: "تایید شده توسط تولید",
    pending_pm: "در انتظار بررسی PM",
    completed: "تکمیل شده",
    rejected: "رد شده",
  };
  return statusMap[status] || status;
};

const getWorktypeDisplay = (worktype) => {
  const worktypeMap = {
    mechanic: "مکانیک",
    electric: "برق",
    utility: "تاسیسات",
    metalworking: "فلزکاری",
    tarashkari: "تراشکاری",
  };
  return worktypeMap[worktype] || worktype;
};

export default function FormDisplay() {
  const { formcode } = useParams();
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
          <title>Form ${formcode}</title>
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
      if (!formcode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Try both API endpoints to ensure we get the data
        let formResponse;
        try {
          // First try the ViewSet endpoint
          formResponse = await api.get(`/forms/${formcode}/`);
        } catch (error) {
          // If that fails, try the legacy endpoint
          formResponse = await api.get(`/submitform/${formcode}/`);
        }

        // Extract the form data from the response
        const formData = formResponse.data.form_data || formResponse.data;
        setFormData(formData);

        // Fetch technician data with formcode filter
        const technicianResponse = await api.get(
          `/techniciansubmit/list/?formcode=${formcode}`
        );

        // Filter technician data by formcode
        const techData = Array.isArray(technicianResponse.data)
          ? technicianResponse.data.filter((tech) => tech.formcode === formcode)
          : [];
        setTechnicianData(techData);

        // Fetch aghlam data with formcode filter
        const aghlamResponse = await api.get(
          `/aghlam/list/?formcode=${formcode}`
        );

        // Filter aghlam data by formcode
        const filteredAghlamData = Array.isArray(aghlamResponse.data)
          ? aghlamResponse.data.filter((aghlam) => aghlam.formcode === formcode)
          : [];
        setAghlamData(filteredAghlamData);

        // Fetch personel data with formcode filter
        const personelResponse = await api.get(
          `/personel/list/?formcode=${formcode}`
        );

        // Filter personel data by formcode
        const filteredPersonelData = Array.isArray(personelResponse.data)
          ? personelResponse.data.filter(
              (person) => person.formcode === formcode
            )
          : [];
        setPersonelData(filteredPersonelData);
      } catch (error) {
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
  }, [formcode]);

  function extractPersonnelRows(personelData) {
    // Process all personnel records
    const result = [];

    // Loop through all personnel objects in the array
    personelData.forEach((personelObj) => {
      // For each personnel object, extract all personnel entries (1-8)
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
    });

    return result;
  }

  const personnelRows =
    personelData.length > 0 ? extractPersonnelRows(personelData) : [];

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
          <h2 className="text-2xl font-bold mb-6 text-center">
            جزئیات فرم {formcode}
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
        <div className="no-print  mb-4 flex justify-between">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center text-sm md:text-base">
            <Link className="w-full" to={`/forms/`}>
              Back
            </Link>
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-500 cursor-pointer hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center gap-2 text-sm md:text-base"
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
              <div>{formData.formcode}</div>
            </div>
            <div className="text-center mt-8 md:mt-12 p-0">
              <div className="flex justify-center text-center items-center font-bold text-lg md:text-xl">
                فرم درخواست تعمیرات
              </div>
              <div className="flex justify-center text-center items-center font-bold text-lg md:text-xl">
                شرکت تخته فشرده پاک چوب
              </div>
            </div>
            <div className="p-1 hidden md:block">
              <img src="/pakchoob.png" alt="Logo" className="w-full h-auto" />
            </div>
          </div>

          {/* Form Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-black">
            <div className="p-2 md:p-4 border-l border-black">
              <div className="font-bold text-center text-sm md:text-base">
                زمان پایان توقف
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-4 text-center justify-center mt-1">
                <div className="mt-2 md:mt-5 border border-black text-center text-xs md:text-sm">
                  تاریخ
                </div>
                <div className="mt-2 md:mt-5 border border-black p-1 text-xs md:text-sm">
                  {formatDate(formData.endtime) || "-"}
                </div>
              </div>
            </div>
            <div className="p-2 md:p-4 text-right border-l border-black">
              <div className="font-bold mb-2 text-sm md:text-base">
                میزان ساعت کار تجهیز در زمان بروز عیب (ساعت)
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-4 lg:mt-4 md:mt-8 text-center">
                <div className="border border-black text-center text-xs md:text-sm">
                  ساعت
                </div>
                <div className="border border-black text-center text-xs md:text-sm">
                  {formData.failuretime || "-"}
                </div>
              </div>
            </div>

            <div className="p-2 md:p-4 text-right border-l border-black">
              <div className="font-bold mb-2 text-sm md:text-base">
                ساعت شروع توقف
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-4 lg:mt-4 md:mt-8 text-center">
                <div className="border border-black text-center text-xs md:text-sm">
                  ساعت
                </div>
                <div className="border border-black text-center text-xs md:text-sm">
                  {formatDate(formData.stoptime) || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-6 border-b border-black">
            <div className="p-2 md:p-4 border-l border-black text-right">
              <div className="font-bold text-sm md:text-base">
                : تاریخ درخواست
              </div>
              <div className="text-center text-xs md:text-sm">
                {formatDate(formData.problemdate) || "-"}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black text-right">
              <div className="font-bold text-sm md:text-base">
                : کد محل ماشین
              </div>
              <div className="text-center text-xs md:text-sm">
                {formData.machineplacecode || "-"}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black text-right">
              <div className="font-bold text-sm md:text-base">: زمان خرابی</div>
              <div className="text-center text-xs md:text-sm">
                {formData.failuretimesubmit || "-"}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black text-center">
              <div className="font-bold text-right text-sm md:text-base">
                : کد دستگاه
              </div>
              <div className="text-center text-xs md:text-sm">
                {formData.machinecode || "-"}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black text-right">
              <div className="font-bold text-sm md:text-base">
                : محل استقرار
              </div>
              <div className="text-center text-xs md:text-sm">
                {formData.section || "-"}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black text-right">
              <div className="font-bold text-sm md:text-base">: نوع توقف </div>
              <div className="text-center text-xs md:text-sm">
                {formData.stoptype || "-"}
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div className="p-2 md:p-4 border-b border-black text-right">
            <div className="font-bold mb-2 text-sm md:text-base">
              : کلیات شرح عیب مشاهده شده
            </div>
            <div className="min-h-[40px] md:min-h-[60px] text-xs md:text-sm">
              {formData.problemdescription}
            </div>
          </div>
          <div className="p-2 md:p-4 border-b border-black text-right">
            <div className="font-bold mb-2 text-sm md:text-base">
              : شرح دلیل خرابی
            </div>
            <div className="min-h-[40px] md:min-h-[60px] text-xs md:text-sm">
              <div>{personelData[0]?.failurereasondescription}</div>
            </div>
          </div>

          {/* Form Types */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 p-2 md:p-4 border-b border-black text-xs md:text-sm text-center">
            <div className="flex items-center gap-1 md:gap-2 text-center justify-center">
              <input
                type="checkbox"
                className="w-3 h-3 md:w-4 md:h-4"
                checked={formData.formtype === "em"}
                readOnly
              />
              <span>EM</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2 text-center justify-center">
              <input
                type="checkbox"
                checked={formData.formtype === "cm"}
                readOnly
                className="w-3 h-3 md:w-4 md:h-4"
              />
              <span>CM</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2 text-center justify-center">
              <input
                type="checkbox"
                checked={formData.formtype === "pm"}
                readOnly
                className="w-3 h-3 md:w-4 md:h-4"
              />
              <span>PM</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2 text-center justify-center">
              <input
                type="checkbox"
                checked={formData.formtype === "gm"}
                readOnly
                className="w-3 h-3 md:w-4 md:h-4"
              />
              <span>GM</span>
            </div>
          </div>

          {/* Equipment Status */}
          <div className="grid grid-cols-1 md:grid-cols-6 border-b border-black text-center">
            <div className="p-2 md:p-4">
              <div className="font-bold mb-2 text-sm md:text-base">
                وضعیت تجهیز
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="items-center text-center text-xs md:text-sm">
                  <input
                    type="checkbox"
                    checked={formData.productionstop === "خیر"}
                    readOnly
                    className="w-3 h-3 md:w-4 md:h-4"
                  />
                  <span>در حال کار</span>
                </div>
                <div className="items-center text-center text-xs md:text-sm">
                  <input
                    type="checkbox"
                    checked={formData.productionstop === "بله"}
                    readOnly
                    className="w-3 h-3 md:w-4 md:h-4"
                  />
                  <span>متوقف</span>
                </div>
              </div>
            </div>
            <div className="border-l border-black text-center p-2 md:p-4">
              <div className="font-bold mb-4 text-sm md:text-base ">شیفت</div>
              <div className=" text-sm md:text-base">
                {formData.shift || "-"}
              </div>
            </div>
            <div className="border-l border-black text-center p-2 md:p-4">
              <div className="font-bold mb-4 text-sm md:text-base ">
                زمان پیشنهادی
              </div>
              <div className="text-sm md:text-base">
                {formData.suggesttime || "-"}
              </div>
            </div>
            <div className="border-l border-black text-center p-2 md:p-4">
              <div className="font-bold mb-4 text-sm md:text-base ">
                پیشنهاد کار
              </div>
              <div className="text-sm md:text-base">
                {formData.worksuggest || "-"}
              </div>
            </div>
            <div className="border-l border-black text-center p-2 md:p-4">
              <div className="font-bold mb-4 text-sm md:text-base ">
                درخواست تعمیر
              </div>
              <div className="text-sm md:text-base">
                {formData.fixrepair || "-"}
              </div>
            </div>
            <div className="border-l border-black text-center p-2 md:p-4">
              <div className="font-bold mb-4 text-sm md:text-base ">
                گزارش بازرسی
              </div>
              <div className="text-sm md:text-base">
                {formData.reportinspection || "-"}
              </div>
            </div>
          </div>

          {/* Job Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-black text-center">
            <div className="p-2 md:p-4">
              <div className="font-bold mb-2 text-sm md:text-base">
                وضعیت کار
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="items-center text-center text-xs md:text-sm">
                  <input
                    type="checkbox"
                    checked={technicianData[0]?.jobstatus === "بله"}
                    readOnly
                    className="w-3 h-3 md:w-4 md:h-4"
                  />
                  <span className="mr-1 md:mr-2">کار انجام شد</span>
                </div>
                <div className="items-center text-center text-xs md:text-sm">
                  <input
                    type="checkbox"
                    checked={technicianData[0]?.jobstatus === "خیر"}
                    readOnly
                    className="w-3 h-3 md:w-4 md:h-4"
                  />
                  <span className="mr-1 md:mr-2">کار انجام نشد</span>
                </div>
              </div>
            </div>
            <div className="border-l border-black p-2 md:p-4">
              <div className=" font-bold mb-2 text-sm md:text-base">
                روش کشف عیب
              </div>
              <div className="text-sm md:text-base">
                {formData.faultdm || "-"}
              </div>
            </div>
            <div className="border-l border-black p-2 md:p-4">
              <div className=" font-bold mb-2 text-sm md:text-base">
                توضیحات
              </div>
              <div className="text-sm md:text-base">
                {getStatusDisplay(formData.status || "")}
              </div>
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
                      {personnelRows.map((person, index) => (
                        <tr
                          key={person.id || index}
                          className="border-b border-black text-xs md:text-sm"
                        >
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {formatRepairTime(person.endtimerepair) || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {formatRepairTime(person.starttimerepair) || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {person.shift || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {person.personelnumber || "-"}
                          </td>
                          <td className="border-l border-black p-1 md:p-2 text-center">
                            {person.personel || "-"}
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
                نام و امضاء درخواست کننده
              </div>
              <div className="my-2 md:my-4 text-xs md:text-sm">
                {formData.operator_confirmation_name}
              </div>
              <div className="text-xs md:text-sm">
                تاریخ:{" "}
                {formatSignatureDate(formData.operator_confirmation_date) ||
                  "-"}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black border-b md:border-b-0 text-center">
              <div className="text-xs md:text-sm">
                نام و امضاء مسئول تعمیرات
              </div>
              <div className="my-2 md:my-4 text-xs md:text-sm">
                {formData.technician_confirmation_name || "-"}
              </div>
              <div className="text-xs md:text-sm">
                تاریخ:{" "}
                {formatSignatureDate(formData.technician_confirmation_date) ||
                  "-"}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black border-b md:border-b-0 text-center">
              <div className="text-xs md:text-sm">نام و امضاء رئیس فنی</div>
              <div className="my-2 md:my-4 text-xs md:text-sm">
                {formData.management_confirmation_name || "-"}
              </div>
              <div className="text-xs md:text-sm">
                تاریخ:{" "}
                {formatSignatureDate(formData.management_confirmation_date) ||
                  "-"}
              </div>
            </div>
            <div className="p-2 md:p-4 border-l border-black border-b md:border-b-0 text-center">
              <div className="text-xs md:text-sm">نام و امضاء رئیس تولید</div>
              <div className="my-2 md:my-4 text-xs md:text-sm">
                {formData.production_management_confirmation_name || "-"}
              </div>
              <div className="text-xs md:text-sm">
                تاریخ:{" "}
                {formatSignatureDate(
                  formData.production_management_confirmation_date
                ) || "-"}
              </div>
            </div>
            <div className="p-2 md:p-4 text-center border-l border-black border-b md:border-b-0">
              <div className="text-xs md:text-sm">نام و امضاء رئیس نت</div>
              <div className="my-2 md:my-4 text-xs md:text-sm">
                {formData.pm_confirmation_name || "-"}
              </div>
              <div className="mb-2 text-xs md:text-sm">
                تاریخ:{" "}
                {formatSignatureDate(formData.pm_confirmation_date) || "-"}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
