/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useRef, useCallback, useMemo } from "react";
import { api } from "../api";
import Header from "../components/Common/Header";
import "../styles/SubmitForm.css";
import { ToastContainer } from "react-toastify";
import { motion } from "framer-motion";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "moment/locale/fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/WaterTreatmentModal.css";

const waterOptions = {
  "فشار ترنسمیتر های دستگاه RO": [
    { name: "فشار خروجی از پمپ فید 1", transmitter: "101" },
    { name: "فشار خروجی از پمپ فید 2", transmitter: "102" },
    { name: "فشار خروجی از پمپ فید 3", transmitter: "103" },
    { name: "خروجی سند فیلترها", transmitter: "105" },
    { name: "فشار خروجی از فیلتر شنی شماره 1", transmitter: "106" },
    { name: "فشار خروجی از فیلتر شنی شماره 2", transmitter: "107" },
    { name: "فشار خروجی از فیلتر شنی شماره 3", transmitter: "108" },
    { name: "فشار خروجی از فیلتر شنی شماره 4", transmitter: "109" },
    { name: "فشار خروجی از فیلتر شنی شماره 5", transmitter: "110" },
    { name: "ورودی به فیلتر کربنی", transmitter: "111" },
    { name: "فشار خروجی از فیلتر کربنی شماره 1", transmitter: "112" },
    { name: "فشار خروجی از فیلتر کربنی شماره 2", transmitter: "113" },
    { name: "فشار خروجی از لامپ های UV", transmitter: "114" },
    { name: "فشار خروجی از فیلتر های کاتریج1", transmitter: "115" },
    { name: "فشار خروجی از فیلتر های کاتریج2", transmitter: "116" },
    { name: "فشار ورودی پمپ های HP", transmitter: "117" },
    { name: "فشار خروجی از پمپ HP شماره 1", transmitter: "118" },
    { name: "فشار خروجی از پمپ HP شماره 2", transmitter: "119" },
    { name: "فشار خروجی از پمپ HP شماره 3", transmitter: "120" },
    { name: "فشار خروجی از استیج 1", transmitter: "121" },
    { name: "فشار خروجی از استیج 2", transmitter: "122" },
  ],
  "فشار گیج های دستگاه RO": [
    "فشار ورودی به فیلتر شنی شماره 1",
    "فشار ورودی به فیلتر شنی شماره 2",
    "فشار ورودی به فیلتر شنی شماره 3",
    "فشار ورودی به فیلتر شنی شماره 4",
    "فشار ورودی به فیلتر شنی شماره 5",
    "فشار ورودی به فیلتر کربنی 1",
    "فشار ورودی به فیلتر کربنی 2",
    "فشار خروجی از لامپ های UV",
    "فشار خروجی از فیلتر کاتریجی",
    "فشار ورودی به استیج اول",
    "فشار خروجی از استیج اول",
    "فشار خروجی از استیج دوم",
    "فشار خروجی از پکیج آب شرب",
    "فشار خروجی از پمپ فید RO2",
    "فشار خروجی از پمپ های ارسال RO1",
    "فشار خروجی از پمپ های ارسال RO2",
    "فشار خروجی پمپ CIP",
    "فشار خروجی از فیلتر کاتریجی CIP",
    "فشار خروجی از پرشروسل RO2",
  ],
  "پارامترهای کیفی آب": [
    "TDS آب خام",
    "EC آب خام",
    "PH آب خام",
    "TH آب خام",
    "TDS آب RO1",
    "EC آب RO1",
    "PH آب RO1",
    "TH آب RO1",
    "TDS آب RO2",
    "EC آب RO2",
    "PH آب RO2",
    "TH آب RO2",
    "TDS آب شرب",
    "EC آب شرب",
    "PH آب شرب",
    "TH آب شرب",
    "کلر آب شرب",
    "TDS آب سختی گیر رزینی",
    "EC آب سختی گیر رزینی",
    "PH آب سختی گیر رزینی",
    "TH آب سختی گیر رزینی",
    "دمای آب ورودی به RO",
    "SDI خروجی از فیلتر شنی افقی",
    "SDI خروجی از فیلتر شنی دستگاه RO",
    "SDI خروجی از فیلتر کاتریجی دستگاه RO",
    "NTU خروجی از فیلتر شنی افقی",
    "NTU خروجی از فیلتر شنی دستگاه RO",
    "NTU خروجی از فیلتر کاتریجی دستگاه RO",
    "TDS وسل شماره 1",
    "TDS وسل شماره 2",
    "TDS وسل شماره 3",
    "TDS وسل شماره 4",
    "TDS وسل شماره 5",
    "TDS وسل شماره 6",
    "TDS وسل شماره 7",
    "TDS وسل شماره 8",
    "TDS وسل شماره 9",
    "TDS وسل شماره 10",
    "TDS وسل RO2",
    "TDS مخزن 1000",
    "EC مخزن 1000",
    "PH مخزن 1000",
    "TH مخزن 1000",
    "TDS مخزن DM",
    "EC مخزن DM",
    "PH مخزن DM",
    "TH مخزن DM",
    "TDS پساب RO",
  ],
  "مواد افزودنی به آب": [
    "تزریق نترولایزر",
    "تزریق آنتی اسکالانت",
    "تزریق کلر",
    "تزریق سود",
  ],
  "فلومتر و کنتور دستگاه تصفیه": [
    "میزان آب خروجی از فلومتر بعد از کاتریج",
    "میزان آب پرمیت از فلومتر دستگاه RO",
    "میزان آب پساب از فلومتر دستگاه RO",
    "میزان آب میکس از فلومتر دستگاه RO",
    "میزان آب تولیدی RO2 از فلومتر دستگاه RO",
    "میزان آب پساب RO2 از فلومتر دستگاه RO",
    "میزان آب خروجی از پمپ فید RO2",
    "میزان آب شرب از فلومتر دستگاه RO",
    "کنتور آب خام ورودی",
    "کنتور آب شرب",
    "کنتور آب آبیاری",
    "کنتور آب نرم",
    "کنتور آب RO",
    "کنتور آب RO2",
  ],
  "چک و عملکرد پمپ های تصفیه خانه": [
    "پمپ 1 فید فیلتر شنی افقی",
    "پمپ 2 فید فیلتر شنی افقی",
    "پمپ 1 مخزن آب شرب بیرون",
    "پمپ 2 مخزن آب شرب بیرون",
    "پمپ 3 مخزن آب شرب بیرون",
    "پمپ 1 آبیاری",
    "پمپ 2 آبیاری",
    "پمپ 1 آب نرم",
    "پمپ 2 آب نرم",
    "پمپ 1 آب شرب داخل",
    "پمپ 2 آب شرب داخل",
    "پمپ 1 ارسال RO2",
    "پمپ 2 ارسال RO3",
    "پمپ تغذیه آب RO2",
    "پمپ 1 ارسال RO1",
    "پمپ 2 ارسال RO2",
    "پمپ 1 تغذیه RO",
    "پمپ 2 تغذیه RO",
    "پمپ 3 تغذیه RO",
    "پمپ 1 های پرشر RO",
    "پمپ 2 های پرشر RO",
    "پمپ 3 های پرشر RO",
    "پمپ 1 CIP",
    "پمپ 2 CIP",
    "جوکی پمپ آتشنشانی",
    "پمپ 1 آتشنشانی",
    "پمپ 2 آتشنشانی",
    "دیزل پمپ آتشنشانی",
  ],
  "شستشو و بکواش و فیلترهای مصرفی": [
    "فیلتر شنی افقی بیرون",
    "فیلتر شنی شماره 1 دستگاه RO",
    "فیلتر شنی شماره 2 دستگاه RO",
    "فیلتر شنی شماره 3 دستگاه RO",
    "فیلتر شنی شماره 4 دستگاه RO",
    "فیلتر شنی شماره 5 دستگاه RO",
    "فیلتر کربنی شماره 1 دستگاه RO",
    "فیلتر کربنی شماره 2 دستگاه RO",
    "فیلتر کاتریجی دستگاه RO",
    "فیلتر آب شرب دستگاه RO",
    "فیلتر کاتریجی فلاشینگ",
  ],
  "چک و عملکرد کلی تصفیه خانه": [
    "چک و بررسی پایپینگ هوا فشرده",
    "هواگیری مخزن رزینی",
    "هواگیری فیلتر شنی افقی",
    "هواگیری فیلتر شنی دستگاه RO",
    "هواگیری فیلتر کربنی دستگاه RO",
    "هواگیری پکیج لامپ UV دستگاه RO",
    "هواگیری پکیج فیلترهای ممبران دستگاه RO 3",
  ],
};

// Stable Input Component
const TopicInput = React.memo(
  ({ topic, value, onChange, required, transmitter, section }) => {
    const inputRef = useRef(null);

    const handleChange = useCallback(
      (e) => {
        if (
          section === "چک و عملکرد پمپ های تصفیه خانه" ||
          section === "شستشو و بکواش و فیلترهای مصرفی" ||
          section === "چک و عملکرد کلی تصفیه خانه"
        ) {
          // Toggle between "بررسی شد" and "بررسی نشد" when checkbox is clicked
          onChange(topic, e.target.checked ? "بررسی شد" : "بررسی نشد");
        } else {
          onChange(topic, e.target.value);
        }
      },
      [topic, onChange, section]
    );
    if (section === "چک و عملکرد پمپ های تصفیه خانه") {
      const isChecked = value === "بررسی شد";
      return (
        <div
          className="topic-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <label className="topic-label" style={{ flex: 1, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleChange}
                className="pump-checkbox"
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  marginLeft: "10px",
                }}
              />
              <span
                style={{
                  color: isChecked ? "#4CAF50" : "#F44336",
                  fontWeight: isChecked ? "bold" : "normal",
                }}
              >
                {topic} - {isChecked ? "بررسی شد" : "بررسی نشد"}
              </span>
            </div>
          </label>
        </div>
      );
    }
    if (section === "شستشو و بکواش و فیلترهای مصرفی") {
      const isChecked = value === "بررسی شد";
      return (
        <div
          className="topic-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <label className="topic-label" style={{ flex: 1, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleChange}
                className="pump-checkbox"
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  marginLeft: "10px",
                }}
              />
              <span
                style={{
                  color: isChecked ? "#4CAF50" : "#F44336",
                  fontWeight: isChecked ? "bold" : "normal",
                }}
              >
                {topic} - {isChecked ? "بررسی شد" : "بررسی نشد"}
              </span>
            </div>
          </label>
        </div>
      );
    }
    if (section === "چک و عملکرد کلی تصفیه خانه") {
      const isChecked = value === "بررسی شد";
      return (
        <div
          className="topic-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <label className="topic-label" style={{ flex: 1, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleChange}
                className="pump-checkbox"
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  marginLeft: "10px",
                }}
              />
              <span
                style={{
                  color: isChecked ? "#4CAF50" : "#F44336",
                  fontWeight: isChecked ? "bold" : "normal",
                }}
              >
                {topic} - {isChecked ? "بررسی شد" : "بررسی نشد"}
              </span>
            </div>
          </label>
        </div>
      );
    }

    return (
      <div
        className="topic-item"
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        {transmitter && (
          <span style={{ minWidth: "40px", textAlign: "center" }}>
            {transmitter}
          </span>
        )}
        <label className="topic-label">{topic}</label>
        <input
          ref={inputRef}
          type="text"
          value={value || ""}
          onChange={handleChange}
          placeholder="مقدار را وارد کنید"
          className="topic-input"
          autoComplete="off"
          spellCheck="false"
          autoCorrect="off"
          autoCapitalize="off"
          required={required}
        />
      </div>
    );
  }
);

TopicInput.displayName = "TopicInput";

const ImpregnationSubmit = () => {
  const [values, setValues] = useState({
    operator: "",
    tarikhesabt: null,
    ghesmat: "",
    shift: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState("");
  const [topicValues, setTopicValues] = useState({});
  const [modalData, setModalData] = useState({
    operator: "",
    tarikhesabt: null,
    ghesmat: "",
    shift: "",
  });

  const handleSectionSelected = (e) => {
    const selectedValue = e.target.value;
    setValues((prev) => ({ ...prev, ghesmat: selectedValue }));
    if (selectedValue) {
      setSelectedSection(selectedValue);
      setModalOpen(true);

      setModalData({
        operator: values.operator,
        tarikhesabt: values.tarikhesabt,
        ghesmat: values.ghesmat,
        shift: values.shift,
      });

      const initialValues = {};
      if (
        selectedValue === "چک و عملکرد پمپ های تصفیه خانه" ||
        selectedValue === "شستشو و بکواش و فیلترهای مصرفی" ||
        selectedValue === "چک و عملکرد کلی تصفیه خانه"
      ) {
        // For pumps section, initialize with "بررسی نشد"
        waterOptions[selectedValue].forEach((item) => {
          const itemName = typeof item === "string" ? item : item.name;
          initialValues[itemName] = "بررسی نشد";
        });
      } else {
        // For other sections, initialize with empty string
        waterOptions[selectedValue].forEach((item) => {
          const itemName = typeof item === "string" ? item : item.name;
          initialValues[itemName] = "";
        });
      }
      setTopicValues(initialValues);
    }
  };

  const handleTopicValueChange = useCallback((topic, value) => {
    setTopicValues((prev) => ({
      ...prev,
      [topic]: value,
    }));
  }, []);

  const handleModalSubmit = async () => {
    if (
      selectedSection !== "شستشو و بکواش و فیلترهای مصرفی" ||
      selectedSection !== "چک و عملکرد کلی تصفیه خانه"
    ) {
      const allTopicsFilled = Object.values(topicValues).every(
        (value) => value.trim() !== ""
      );

      if (!allTopicsFilled) {
        toast.error(
          "لطفا تمام موارد موضوعات را پر کنید و در صورت عدم وجود مورد موضوعات لطفا مقدار 0 را وارد کنید"
        );
        return;
      }
    }

    try {
      let formattedDate = null;
      if (values.tarikhesabt) {
        const date = values.tarikhesabt;

        formattedDate = `${date.year}/${String(date.month.number).padStart(
          2,
          "0"
        )}/${String(date.day).padStart(2, "0")} ${String(
          date.hour || 0
        ).padStart(2, "0")}:${String(date.minute || 0).padStart(2, "0")}`;
      }

      // First, submit main form data with a default mozu value
      const mainFormData = {
        operator: values.operator,
        tarikhesabt: formattedDate,
        ghesmat: values.ghesmat,
        mozu: "اطلاعات اصلی", // Default value for main form
        value: "", // Empty value for main form
        shift: values.shift,
      };

      await api.post("/watertreatment/", mainFormData);

      // Then, prepare data for each topic with a value
      const submissions = [];
      Object.entries(topicValues).forEach(([topic, value]) => {
        // For pumps section, we'll only submit if the value is not empty
        // and for checkboxes, we'll submit both checked and unchecked states
        if (
          selectedSection === "چک و عملکرد پمپ های تصفیه خانه" ||
          selectedSection === "شستشو و بکواش و فیلترهای مصرفی" ||
          selectedSection === "چک و عملکرد کلی تصفیه خانه" ||
          value.trim() !== ""
        ) {
          submissions.push({
            operator: values.operator,
            tarikhesabt: formattedDate,
            ghesmat: values.ghesmat,
            mozu: topic,
            value: value,
            shift: values.shift,
          });
        }
      });

      // Submit each topic entry
      for (const submission of submissions) {
        await api.post("/watertreatment/", submission);
      }

      if (submissions.length > 0) {
        toast.success(
          `اطلاعات اصلی و ${submissions.length} مورد موضوعات با موفقیت ثبت شد`
        );
        setModalOpen(false);
        setTopicValues({});
        setModalData({
          operator: "",
          tarikhesabt: null,
          ghesmat: "",
          shift: "",
        });
        // Reset main form after successful submission
        setValues({
          operator: "",
          tarikhesabt: null,
          ghesmat: "",
          shift: "",
        });
      } else {
        toast.success("اطلاعات اصلی با موفقیت ثبت شد");
        setModalOpen(false);
        setTopicValues({});
        setModalData({
          operator: "",
          tarikhesabt: null,
          ghesmat: "",
          shift: "",
        });
        // Reset main form after successful submission
        setValues({
          operator: "",
          tarikhesabt: null,
          ghesmat: "",
          shift: "",
        });
      }
    } catch (error) {
      toast.error(`خطا در ثبت فرم: ${error.message}`);
      console.error("Form submission error:", error);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setTopicValues({});
    setModalData({
      operator: "",
      tarikhesabt: null,
      ghesmat: "",
      shift: "",
    });
  };

  // Submit main form values
  const handleMainFormSubmit = async (e) => {
    e.preventDefault();

    try {
      // Format the date in the expected format
      let formattedDate = null;
      if (values.tarikhesabt) {
        const date = values.tarikhesabt;
        // Format as YYYY/MM/DD HH:MM as expected by backend
        formattedDate = `${date.year}/${String(date.month.number).padStart(
          2,
          "0"
        )}/${String(date.day).padStart(2, "0")} ${String(
          date.hour || 0
        ).padStart(2, "0")}:${String(date.minute || 0).padStart(2, "0")}`;
      }

      // Submit main form data with required fields
      const mainFormData = {
        operator: values.operator,
        tarikhesabt: formattedDate,
        ghesmat: values.ghesmat,
        mozu: "اطلاعات اصلی", // Default value for main form
        value: "", // Empty value for main form
        shift: values.shift,
      };

      await api.post("/watertreatment/", mainFormData);

      toast.success("اطلاعات اصلی با موفقیت ثبت شد");

      // Reset main form
      setValues({
        operator: "",
        tarikhesabt: null,
        ghesmat: "",
        shift: "",
      });
    } catch (error) {
      toast.error(`خطا در ثبت اطلاعات اصلی: ${error.message}`);
      console.error("Main form submission error:", error);
    }
  };

  const TopicModal = useMemo(() => {
    if (!modalOpen) return null;

    return (
      <div className="modal-overlay">
        <div
          className="modal-content"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          <h3>{selectedSection}</h3>
          <div className="topics-container">
            {waterOptions[selectedSection]?.map((item) => {
              const itemName = typeof item === "string" ? item : item.name;
              const transmitter =
                typeof item === "object" ? item.transmitter : "";

              return (
                <TopicInput
                  key={itemName}
                  topic={itemName}
                  value={topicValues[itemName] || ""}
                  onChange={handleTopicValueChange}
                  transmitter={transmitter}
                  section={selectedSection}
                  required
                />
              );
            })}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleModalSubmit}
            >
              ثبت همه اطلاعات
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleModalClose}
            >
              خروج
            </button>
          </div>
        </div>
      </div>
    );
  }, [
    modalOpen,
    selectedSection,
    topicValues,
    handleTopicValueChange,
    handleModalSubmit,
    handleModalClose,
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"ثبت اطلاعات تصفیه خانه"} />
      {/* <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
      /> */}
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="body dark:bg-secondary-dark-bg rounded-3xl z-10">
            <div className="container">
              <form onSubmit={handleMainFormSubmit} id="mainForm">
                <div className="form first">
                  <div className="details personal">
                    <div className="fields">
                      <div className="input-field">
                        <label
                          htmlFor="operator"
                          className="flex justify-center items-center"
                        >
                          نام اپراتور
                        </label>
                        <input
                          type="text"
                          name="operator"
                          placeholder="نام اپراتور را وارد کنید"
                          id="operator"
                          className="text-center"
                          value={values.operator}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor=""
                          className="flex justify-center items-center"
                        >
                          تاریخ و ساعت ثبت فرم
                        </label>
                        <DatePicker
                          calendar={persian}
                          locale={persian_fa}
                          calendarPosition="bottom-right"
                          containerClassName="w-full"
                          value={values.tarikhesabt}
                          onChange={(date) =>
                            setValues((prev) => ({
                              ...prev,
                              tarikhesabt: date,
                            }))
                          }
                          format="YYYY/MM/DD HH:mm"
                          plugins={[
                            <TimePicker
                              position="bottom"
                              title="زمان"
                              hourLabel="ساعت"
                              minuteLabel="دقیقه"
                              secondLabel="ثانیه"
                              hourStep={1}
                              minuteStep={1}
                            />,
                          ]}
                          mapDays={({ date }) => {
                            let props = {};
                            let isWeekend = date.weekDay.index === 6;
                            if (isWeekend)
                              props.className = "highlight highlight-blue";
                            return props;
                          }}
                          required
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="shift"
                          className="flex justify-center items-center"
                        >
                          شیفت
                        </label>
                        <select
                          name="shift"
                          className="text-center "
                          id="shift"
                          value={values.shift}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">انتخاب کنید</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="ghesmat"
                          className="flex justify-center items-center"
                        >
                          قسمت مربوطه
                        </label>
                        <select
                          name="ghesmat"
                          className="text-center"
                          id="ghesmat"
                          value={values.ghesmat}
                          onChange={handleSectionSelected}
                          required
                        >
                          <option value="">انتخاب کنید</option>
                          {Object.keys(waterOptions).map((key) => (
                            <option value={key} key={key}>
                              {key}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {TopicModal}
                    <ToastContainer position="top-right" rtl={true} />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ImpregnationSubmit;
