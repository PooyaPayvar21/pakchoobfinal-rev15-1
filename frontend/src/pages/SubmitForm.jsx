/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SubmitForm.css";
import "../styles/persian-calendar.css";
import { motion } from "framer-motion";
import Header from "../components/Common/Header";
import { api } from "../api";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { MultiSelect } from "primereact/multiselect";
import "moment/locale/fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const sectionCodes2 = {
  Chipper: "01",
  "Conveyor Line": "02",
  "Dryer & Air Grader": "03",
  Refiner: "04",
  "Before Press": "05",
  Press: "06",
  "After Press": "07",
  Sanding: "09",
  "Cooling System": "08",
  "Steam Boiler": "10",
  General: "11",
};

const worktype = [
  { name: "mechanic", label: "مکانیک" },
  { name: "electric", label: "برق" },
  { name: "utility", label: "تاسیسات" },
  { name: "metalworking", label: "فلزکاری" },
  { name: "tarashkari", label: "تراشکاری" },
  { name: "generalmechanic", label: "مکانیک عمومی" },
  { name: "paint", label: "رنگ و سندبلاست" },
];

const sectionCodes = {
  Melamine: "01",
  "High Gloss": "05",
  Formalin: "08",
  Resin: "07",
  "Water Treatment Plant": "09",
  "Paper Impregnation 1": "03",
  "Paper Impregnation 2": "03",
  "Paper Impregnation 3": "03",
};

const initialFormState = {
  formcode: "",
  problemdate: null,
  phase: "empty",
  productionstop: "خیر",
  section: "empty",
  machinename: "",
  machinecode: "",
  machineplacecode: "",
  worktype: "",
  stoptime: "",
  stoptype: "",
  failuretimesubmit: "",
  shift: "",
  suggesttime: "",
  worksuggest: "",
  fixrepair: "",
  reportinspection: "",
  faultdm: "",
  operatorname: "",
  problemdescription: "",
  availableSections: [],
};

const SubmitForm = () => {
  const [values, setValues] = useState({
    formcode: "",
    problemdate: null,
    phase: "empty",
    productionstop: "خیر",
    section: "empty",
    machinename: "",
    machinecode: "",
    machineplacecode: "",
    worktype: "",
    stoptime: "",
    stoptype: "",
    failuretimesubmit: "",
    shift: "",
    suggesttime: "",
    worksuggest: "",
    fixrepair: "",
    reportinspection: "",
    faultdm: "",
    operatorname: "",
    problemdescription: "",
    availableSections: [],
  });
  const [selectedWorktype, setSelectedWorktype] = useState(null);
  const [userType, setUserType] = useState("");
  const [userRole, setUserRole] = useState("");
  const [generatedFormCode, setGeneratedFormCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  // Load user info on component mount
  useEffect(() => {
    const storedUserType = localStorage.getItem("user_type");
    const storedRole = localStorage.getItem("user_role");
    const storedSections = localStorage.getItem("sections");

    if (storedUserType && storedRole) {
      setUserType(storedUserType);
      setUserRole(storedRole);
    }

    // Set the available sections from user's sections and determine phase
    if (storedSections) {
      const sectionsArray = storedSections.split(",");

      // Check if sections match sectionCodes or sectionCodes2
      const isPhase1 = sectionsArray.some((section) =>
        Object.keys(sectionCodes).includes(section)
      );
      const isPhase2 = sectionsArray.some((section) =>
        Object.keys(sectionCodes2).includes(section)
      );

      // If user has access to both phases, enable the phase field
      const hasBothPhases = isPhase1 && isPhase2;

      setValues((prev) => ({
        ...prev,
        availableSections: sectionsArray,
        section: "empty", // Always set to empty initially
        phase: hasBothPhases ? "empty" : isPhase1 ? "01" : "02", // Set phase based on available sections
      }));

      // Enable/disable phase field based on whether user has access to both phases
      const phaseSelect = document.getElementById("phase");
      if (phaseSelect) {
        phaseSelect.disabled = !hasBothPhases;
      }
    }
  }, []);

  const handleDateChange = (date) => {
    // Store the Persian date value directly from the picker
    setValues((prev) => ({
      ...prev,
      problemdate: date, // Persian date instance from DatePicker
    }));
  };

  // Phone number mapping for each worktype and phase
  const worktypePhones = {
    phase1: {
      mechanic: ["09169391746", "09160609123", "09383158671", "09167910911"],
      electric: ["09160944501", "09961355592", "09167921306", "09169036825"],
      utility: ["09168162605", "09169097479", "09163421161", "09168428547"],
      metalworking: ["09169423734", "09163409910"],
      tarashkari: ["09160546339", "09169423734"],
      generalmechanic: ["09169423734", "09941269048"],
      paint: ["09169409383", "09169423734"],
    },
    phase2: {
      mechanic: [
        "09163458674",
        "09966871494",
        "09353515581",
        "09163221873",
        "09165399685",
      ],
      electric: ["09166436659", "09164160521", "09939048795", "09166423991"],
      utility: ["09169443851", "09966021018", "09930161411", "09160119660"],
      metalworking: ["09169423734", "09163409910"],
      tarashkari: ["09160546339", "09169423734"],
      generalmechanic: ["09169423734", "09941269048"],
      paint: ["09169409383", "09169423734"],
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // اگر چند worktype انتخاب شده باشد، برای هر کدام یک فرم جداگانه ارسال می‌کنیم
      if (selectedWorktype && selectedWorktype.length > 0) {
        let lastFormCode = null;

        // برای هر worktype یک فرم جداگانه ارسال می‌کنیم
        for (const type of selectedWorktype) {
          const formData = {
            ...values,
            problemdate: values.problemdate
              ? values.problemdate.toString()
              : null,
            stoptime: values.stoptime ? values.stoptime.toString() : null,
            user_type: userType,
            user_role: userRole,
            worktype: type.name, // فقط نام worktype را ارسال می‌کنیم
            last_form_code: lastFormCode, // کد فرم قبلی را برای شماره‌گذاری متوالی ارسال می‌کنیم
          };

          const formResponse = await api.post("/submitform/", formData);

          if (formResponse.data.status === "success") {
            lastFormCode = formResponse.data.formcode; // کد فرم جدید را ذخیره می‌کنیم
            toast.success(`فرم ${type.label} با موفقیت ثبت شد`);

            // Send SMS notification
            try {
              // Get the array of phone numbers for this worktype
              const phoneNumbers =
                worktypePhones[values.phase === "01" ? "phase1" : "phase2"][
                  type.name
                ];

              // Send SMS to each phone number
              for (const phoneNumber of phoneNumbers) {
                const smsResponse = await api.post("/send-sms/", {
                  to: phoneNumber,
                  message: `دستور کار به شماره ${lastFormCode} مربوط به بخش ${values.section} - برای واحد ${type.label} - دستگاه: ${values.machinename} صادر گردید`,
                });
                if (smsResponse.data.status === "success") {
                  console.log(
                    `SMS sent to ${phoneNumber} for ${type.label} team`
                  );
                }
              }
            } catch (smsError) {
              console.error(
                `Failed to send SMS to ${type.label} team:`,
                smsError
              );
            }
          } else {
            toast.error(`خطا در ثبت فرم ${type.label}`);
          }
        }

        // پس از ثبت همه فرم‌ها، فرم را ریست می‌کنیم
        const storedSections = localStorage.getItem("sections");
        const sectionsArray = storedSections ? storedSections.split(",") : [];

        const isPhase1 = sectionsArray.some((section) =>
          Object.keys(sectionCodes).includes(section)
        );
        const isPhase2 = sectionsArray.some((section) =>
          Object.keys(sectionCodes2).includes(section)
        );
        const hasBothPhases = isPhase1 && isPhase2;

        setValues({
          ...initialFormState,
          availableSections: sectionsArray,
          section: "empty",
          phase: hasBothPhases ? "empty" : isPhase1 ? "01" : "02",
        });
        setSelectedWorktype(null);
      } else {
        toast.error("لطفاً حداقل یک واحد مربوطه را انتخاب کنید");
      }
    } catch (error) {
      toast.error("خطا در ثبت فرم");
      console.error(error);
    }
  };

  const isStopTimeDisabled = values.productionstop === "خیر";

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setValues((prevValues) => {
      const newValues = { ...prevValues, [name]: value };

      // Reset section field when phase field is set to empty
      if (name === "phase" && value === "empty") {
        newValues.section = "empty"; // Set section to empty to match phase
      }

      // Dynamically update section options based on the selected phase
      if (name === "phase" && value !== "empty") {
        const updatedSection = Object.keys(
          value === "01" ? sectionCodes : sectionCodes2
        )[0];
        newValues.section = updatedSection; // Update section if phase is valid
      }

      return newValues;
    });
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"ثبت فرم"} />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="body dark:bg-secondary-dark-bg rounded-3xl z-10">
            <div className="container">
              <form onSubmit={handleSubmit}>
                {generatedFormCode && (
                  <div>
                    <h3>کد فرم شما : {generatedFormCode}</h3>
                  </div>
                )}
                <div className="form first">
                  <div className="details personal">
                    <div className="fields">
                      <div className="input-field">
                        <label
                          htmlFor="problemdate"
                          className="flex justify-center items-center"
                        >
                          تاریخ ثبت درخواست
                        </label>
                        <DatePicker
                          value={values.problemdate}
                          onChange={handleDateChange}
                          calendar={persian}
                          locale={persian_fa}
                          calendarPosition="bottom-right"
                          inputClass="outline-none text-12 w-[full] sm:w-full font-normal flex justify-center text-center items-center rounded-md shadow-lg border-2 p-2"
                          containerClassName="w-full"
                          plugins={[
                            <TimePicker
                              position="bottom"
                              title="زمان"
                              hourLabel="ساعت"
                              minuteLabel="دقیقه"
                              secondLabel="ثانیه"
                              hourStep={1}
                              minuteStep={5}
                              secondStep={10}
                            />,
                          ]}
                          format="YYYY/MM/DD HH:mm"
                          digits={[
                            "۰",
                            "۱",
                            "۲",
                            "۳",
                            "۴",
                            "۵",
                            "۶",
                            "۷",
                            "۸",
                            "۹",
                          ]}
                          mapDays={({ date }) => {
                            let props = {};
                            let isWeekend = date.weekDay.index === 6;
                            if (isWeekend)
                              props.className = "highlight highlight-red";
                            return props;
                          }}
                          required
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="productionstop"
                          className="flex justify-center items-center"
                        >
                          فاز
                        </label>
                        <select
                          name="phase"
                          className="text-center bg-gray-100"
                          id="phase"
                          value={values.phase}
                          onChange={handleInputChange}
                        >
                          <option value="empty">
                            -- یک فاز را انتخاب کنید --
                          </option>
                          <option value="01">Phase 1</option>
                          <option value="02">Phase 2</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="productionstop"
                          className="flex justify-center items-center"
                        >
                          مشکل باعث توقف خط شده است ؟
                        </label>
                        <select
                          name="productionstop"
                          className="text-center"
                          id="productionstop"
                          value={values.productionstop}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="خیر">خیر</option>
                          <option value="بله">بله</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="section"
                          className="flex justify-center items-center"
                        >
                          بخش
                        </label>
                        <select
                          name="section"
                          id="section"
                          className="text-center"
                          value={values.section}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="empty">
                            -- یک بخش را انتخاب کنید --
                          </option>
                          {values.availableSections?.map((section) => (
                            <option key={section} value={section}>
                              {section}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="machinename"
                          className="flex justify-center items-center"
                        >
                          نام دستگاه
                        </label>
                        <input
                          type="text"
                          name="machinename"
                          placeholder="نام دستگاه را وارد کنید"
                          id="machinename"
                          className="text-center"
                          value={values.machinename}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      {/* <div className="input-field">
                        <label
                          htmlFor="machinecode"
                          className="flex justify-center items-center"
                        >
                          کد دستگاه
                        </label>
                        <input
                          type="text"
                          name="machinecode"
                          placeholder="کد دستگاه را وارد کنید"
                          id="machinecode"
                          className="text-center"
                          value={values.machinecode}
                          onChange={handleInputChange}
                          
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="machineplacecode"
                          className="flex justify-center items-center"
                        >
                          کد محل استقرار دستگاه
                        </label>
                        <input
                          type="text"
                          name="machineplacecode"
                          placeholder="کد محل استقرار دستگاه را وارد کنید"
                          id="machineplacecode"
                          className="text-center"
                          value={values.machineplacecode}
                          onChange={handleInputChange}
                        />
                      </div> */}
                      <div className="input-field">
                        <label
                          htmlFor="worktype"
                          className="flex justify-center items-center"
                        >
                          واحد مربوطه
                        </label>
                        <MultiSelect
                          value={selectedWorktype}
                          onChange={(e) => {
                            setSelectedWorktype(e.value);
                            setValues((prev) => ({
                              ...prev,
                              worktype: e.value
                                .map((item) => item.name)
                                .join(","),
                            }));
                          }}
                          options={worktype}
                          optionLabel="label"
                          display="chip"
                          placeholder="واحد مربوطه را انتخاب کنید"
                          maxSelectedLabels={3}
                          showSelectAll={false}
                          showClear={true}
                          checkboxIcon={true}
                        />
                      </div>
                      {values.productionstop === "بله" && (
                        <div className="input-field">
                          <label
                            htmlFor="stoptype"
                            className="flex justify-center items-center"
                          >
                            نوع توقف
                          </label>
                          <select
                            value={values.stoptype}
                            name="stoptype"
                            id="stoptype"
                            onChange={handleInputChange}
                          >
                            <option value="">
                              -- نوع توقف را انتخاب کنید --
                            </option>
                            <option value="خط">خط</option>
                            <option value="تجهیز">تجهیز</option>
                          </select>
                        </div>
                      )}
                      <div className="input-field">
                        <label
                          htmlFor="stoptime"
                          className="flex justify-center items-center"
                        >
                          ساعت شروع توقف
                        </label>
                        <DatePicker
                          value={values.stoptime}
                          onChange={(date) =>
                            setValues((prev) => ({ ...prev, stoptime: date }))
                          }
                          calendar={persian}
                          locale={persian_fa}
                          calendarPosition="bottom-right"
                          inputClass="outline-none text-14 w-full font-normal flex justify-center text-center items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                          containerClassName="w-full"
                          plugins={[
                            <TimePicker
                              position="bottom"
                              title="زمان"
                              hourLabel="ساعت"
                              minuteLabel="دقیقه"
                              secondLabel="ثانیه"
                              hourStep={1}
                              minuteStep={5}
                              secondStep={10}
                            />,
                          ]}
                          format="YYYY/MM/DD HH:mm"
                          digits={[
                            "۰",
                            "۱",
                            "۲",
                            "۳",
                            "۴",
                            "۵",
                            "۶",
                            "۷",
                            "۸",
                            "۹",
                          ]}
                          mapDays={({ date }) => {
                            let props = {};
                            let isWeekend = date.weekDay.index === 6;
                            if (isWeekend)
                              props.className = "highlight highlight-red";
                            return props;
                          }}
                          disabled={isStopTimeDisabled}
                        />
                      </div>
                      {/* <div className="input-field">
                        <label
                          htmlFor="failuretimesubmit"
                          className="flex justify-center text-center"
                        >
                          (ساعت)میزان ساعت کار تجهیز در زمان بروز عیب
                        </label>
                        <input
                          type="text"
                          name="failuretimesubmit"
                          id="failuretimesubmit"
                          className="flex justify-center text-center"
                          placeholder="میزان ساعت کار را وارد کنید"
                          value={values.failuretimesubmit}
                          onChange={handleInputChange}
                        />
                      </div> */}
                      <div className="input-field">
                        <label
                          htmlFor="shift"
                          className="flex justify-center items-center"
                        >
                          شیفت
                        </label>
                        <select
                          name="shift"
                          className="text-center"
                          id="shift"
                          value={values.shift}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">-- شیفت را انتخاب کنید -- </option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="suggesttime"
                          className="flex justify-center items-center"
                        >
                          زمان پیشنهادی برای شروع تعمیر
                        </label>
                        <select
                          name="suggesttime"
                          className="text-center"
                          id="suggesttime"
                          value={values.suggesttime}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">
                            -- زمان پیشنهادی برای شروع تعمیر را انتخاب کنید --{" "}
                          </option>
                          <option value="فوری">فوری</option>
                          <option value="ساعات آتی">ساعات آتی</option>
                          <option value="اولین روز کاری">اولین روز کاری</option>
                          <option value="در اولین فرصت">در اولین فرصت</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="worksuggest"
                          className="flex justify-center items-center"
                        >
                          نوع کار درخواستی
                        </label>
                        <select
                          name="worksuggest"
                          className="text-center"
                          id="worksuggest"
                          value={values.worksuggest}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">
                            -- نوع کار درخواستی را انتخاب کنید --
                          </option>
                          <option value="اضطراری">اضطراری</option>
                          <option value="بهسازی">بهسازی</option>
                          <option value="پایش وضعیت(غیر برنامهای)">
                            پایش وضعیت(غیر برنامه ای)
                          </option>
                          <option value="آماده سازی برای تعمیرات">
                            آماده سازی برای تعمیر
                          </option>
                          <option value="خدمات عمومی">خدمات عمومی</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="fixrepair"
                          className="flex justify-center items-center"
                        >
                          تعمیر و تعویض اصلاحی ناشی از
                        </label>
                        <select
                          name="fixrepair"
                          className="text-center"
                          id="fixrepair"
                          value={values.fixrepair}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">
                            -- نوع تعمیر و تعویض اصلاحی را انتخاب کنید --
                          </option>
                          <option value="درخواست اپراتور">
                            درخواست اپراتور
                          </option>
                          <option value="درخواست واحد نت">
                            درخواست واحد نت
                          </option>
                          <option value="گزارش واحد ایمنی">
                            گزارش واحد ایمنی
                          </option>
                          <option value="آماده سازی برای تعمیر">
                            آماده سازی برای تعمیر
                          </option>
                          <option value="خدمات عمومی">خدمات عمومی</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="reportinspection"
                          className="flex justify-center items-center"
                        >
                          گزارش بازرسی
                        </label>
                        <select
                          name="reportinspection"
                          className="text-center"
                          id="reportinspection"
                          value={values.reportinspection}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">
                            -- نوع گزارش بازرسی را انتخاب کنید --{" "}
                          </option>
                          <option value="بازرسی فنی">بازرسی فنی</option>
                          <option value="واحد نت">واحد نت</option>
                          <option value="اپراتور">اپراتور</option>
                          <option value="سایر">سایر</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="faultdm"
                          className="flex justify-center items-center"
                        >
                          روش کشف عیب
                        </label>
                        <select
                          name="faultdm"
                          className="text-center"
                          id="faultdm"
                          value={values.faultdm}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">
                            -- روش کشف عیب را انتخاب کنید --
                          </option>
                          <option value="اختلال در کارکرد">
                            اختلال در کارکرد
                          </option>
                          <option value="تعمیرات دوره ای">
                            تعمیرات دوره ای
                          </option>
                          <option value="مشاهده تصادفی">مشاهده تصادفی</option>
                          <option value="بازرسی دوره ای">بازرسی دوره ای</option>
                          <option value="تست عملکرد">تست عملکرد</option>
                          <option value="پایش وضعیت دوره ای">
                            پایش وضعیت دوره ای
                          </option>
                          <option value="آماده به کار نبودن در حین نیاز">
                            آماده به کار نبودن در حین نیاز
                          </option>
                          <option value="در حین انجام تعمیرات اصلاحی">
                            در حین انجام تعیرات اصلاحی
                          </option>
                          <option value="فالت با آلارم">فالت با آلارم</option>
                          <option value="سایر روش ها">سایر</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="operatorname"
                          className="flex justify-center items-center"
                        >
                          نام اپراتور
                        </label>
                        <input
                          type="text"
                          name="operatorname"
                          id="operatorname"
                          className="text-center"
                          placeholder="نام اپراتور را وارد کنید"
                          value={values.operatorname}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="problemdescription"
                          className="flex justify-center items-center"
                        >
                          کلیات شرح عیب مشاهده شده
                        </label>
                        <textarea
                          name="problemdescription"
                          id="problemdescription"
                          className="flex justify-center m-0 p-0 text-center"
                          placeholder="کلیات شرح عیب مشاهده شده را توضیح دهید : "
                          value={values.problemdescription}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="nextBtn">
                      ثبت
                    </button>
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

export default SubmitForm;
