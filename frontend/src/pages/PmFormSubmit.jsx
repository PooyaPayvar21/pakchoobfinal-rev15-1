/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SubmitForm.css";
import "../styles/persian-calendar.css";
import Header from "../components/Common/Header";
import { api } from "../api";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import moment from "moment-jalaali";
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

const sectionCodes = {
  Melamine: "01",
  "High Glass": "05",
  Formalin: "08",
  Resin: "07",
  "Water Treatment Plant": "09",
  "Paper Impregnation 1": "10",
  "Paper Impregnation 2": "11",
  "Paper Impregnation 3": "12",
};

const initialFormState = {
  pmformcode: "",
  pmformdate: "",
  pmphase: "empty",
  unitname: "",
  pmworktype: "",
  pmsection: "empty",
  pmmachinename: "",
  pmsubject: "",
  availableSections: [],
};

const PmFormSubmit = () => {
  const [values, setValues] = useState(initialFormState);
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
      const isPhase1 = sectionsArray.some((pmsection) =>
        Object.keys(sectionCodes).includes(pmsection)
      );
      const isPhase2 = sectionsArray.some((pmsection) =>
        Object.keys(sectionCodes2).includes(pmsection)
      );

      // If user has access to both phases, enable the phase field
      const hasBothPhases = isPhase1 && isPhase2;

      setValues((prev) => ({
        ...prev,
        availableSections: sectionsArray,
        pmsection: "empty", // Always set to empty initially
        pmphase: hasBothPhases ? "empty" : isPhase1 ? "01" : "02", // Set phase based on available sections
      }));

      // Enable/disable phase field based on whether user has access to both phases
      const phaseSelect = document.getElementById("phase");
      if (phaseSelect) {
        phaseSelect.disabled = !hasBothPhases;
      }
    }
  }, []);

  const handleDateChange = (date) => {
    setValues((prev) => ({
      ...prev,
      pmformdate: date,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Format dates for submission
      const formData = {
        ...values,
        // Use the native `value` from the Persian DatePicker without manipulation
        pmformdate: values.pmformdate ? values.pmformdate.toString() : null,
        user_type: userType,
        user_role: userRole,
      };

      // First submit the form data
      const formResponse = await api.post("/pmformssubmit/", formData);

      if (formResponse.data.status === "success") {
        // Set the generated form code
        setGeneratedFormCode(formResponse.data.pmformcode);

        // Send SMS notification
        try {
          // Get the array of phone numbers for this worktype
          const phoneNumbers =
            worktypePhones[values.pmphase === "01" ? "phase1" : "phase2"][
              values.pmworktype
            ];

          // Send SMS to each phone number
          for (const phoneNumber of phoneNumbers) {
            const smsResponse = await api.post("/send-sms/", {
              to: phoneNumber,
              message: `دستور کار PM به شماره ${formResponse.data.pmformcode} مربوط به بخش ${values.pmsection} - برای واحد ${values.pmworktype} - دستگاه: ${values.pmmachinename} صادر گردید`,
            });
            if (smsResponse.data.status === "success") {
              console.log(
                `SMS sent to ${phoneNumber} for ${values.pmworktype} team`
              );
            }
          }
        } catch (smsError) {
          console.error(
            `Failed to send SMS to ${values.pmworktype} team:`,
            smsError
          );
        }

        // Reset form while maintaining available sections
        const storedSections = localStorage.getItem("sections");
        const sectionsArray = storedSections ? storedSections.split(",") : [];

        // Check if sections match sectionCodes or sectionCodes2
        const isPhase1 = sectionsArray.some((pmsection) =>
          Object.keys(sectionCodes).includes(pmsection)
        );
        const isPhase2 = sectionsArray.some((pmsection) =>
          Object.keys(sectionCodes2).includes(pmsection)
        );
        const hasBothPhases = isPhase1 && isPhase2;

        setValues({
          ...initialFormState,
          availableSections: sectionsArray,
          pmsection: "empty",
          pmphase: hasBothPhases ? "empty" : isPhase1 ? "01" : "02",
        });

        // Enable/disable phase field based on whether user has access to both phases
        const phaseSelect = document.getElementById("phase");
        if (phaseSelect) {
          phaseSelect.disabled = !hasBothPhases;
        }

        toast.success("فرم با موفقیت ثبت شد");
      } else {
        toast.error("فرم ثبت نشد");
      }
    } catch (error) {
      toast.error("Failed to submit form");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setValues((prevValues) => {
      const newValues = { ...prevValues, [name]: value };

      // Reset section field when phase field is set to empty
      if (name === "pmphase" && value === "empty") {
        newValues.pmsection = "empty"; // Set section to empty to match phase
      }

      // Dynamically update section options based on the selected phase
      if (name === "pmphase" && value !== "empty") {
        const updatedSection = Object.keys(
          value === "01" ? sectionCodes : sectionCodes2
        )[0];
        newValues.pmsection = updatedSection; // Update section if phase is valid
      }

      return newValues;
    });
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"PM ثبت"} />
      <ToastContainer />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <div className="body rounded-3xl z-10">
          <div className="container">
            <form onSubmit={handleSubmit}>
              <div className="form first">
                <div className="details personal">
                  <div className="fields">
                    <div className="input-field">
                      <label
                        htmlFor="pmformdate"
                        className="flex justify-center items-center"
                      >
                        PM تاریخ
                      </label>
                      <DatePicker
                        value={values.pmformdate}
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
                      />
                    </div>
                    <div className="input-field">
                      <label
                        htmlFor="pmphase"
                        className="flex justify-center items-center"
                      >
                        فاز
                      </label>
                      <select
                        name="pmphase"
                        className="text-center bg-gray-100"
                        id="pmphase"
                        value={values.pmphase}
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
                        htmlFor="pmsection"
                        className="flex justify-center items-center"
                      >
                        بخش
                      </label>
                      <select
                        name="pmsection"
                        id="pmsection"
                        className="text-center"
                        value={values.pmsection}
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
                        htmlFor="unitname"
                        className="flex justify-center items-center"
                      >
                        نام واحد
                      </label>
                      <input
                        type="text"
                        name="unitname"
                        placeholder="نام واحد را وارد کنید"
                        id="unitname"
                        className="text-center"
                        value={values.unitname}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="input-field">
                      <label
                        htmlFor="pmmachinename"
                        className="flex justify-center items-center"
                      >
                        نام دستگاه
                      </label>
                      <input
                        type="text"
                        name="pmmachinename"
                        placeholder="نام دستگاه را وارد کنید"
                        id="pmmachinename"
                        className="text-center"
                        value={values.pmmachinename}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="input-field">
                      <label
                        htmlFor="pmworktype"
                        className="flex justify-center items-center"
                      >
                        واحد مربوطه
                      </label>
                      <select
                        name="pmworktype"
                        className="text-center"
                        id="pmworktype"
                        value={values.pmworktype}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">
                          -- واحد مربوطه را انتخاب کنید --{" "}
                        </option>
                        <option value="mechanic">Mechanic</option>
                        <option value="generalmechanic">
                          General Mechanic
                        </option>
                        <option value="electric">Electric</option>
                        <option value="utility">Utility</option>
                        <option value="metalworking">Metal Working</option>
                        <option value="tarashkari">Tarash Kari</option>
                        <option value="paint">Paint</option>
                      </select>
                    </div>
                    <div className="input-field">
                      <label
                        htmlFor="pmsubject"
                        className="flex justify-center items-center"
                      >
                        PM موضوع
                      </label>
                      <textarea
                        name="pmsubject"
                        id="pmsubject"
                        className="flex justify-center m-0 p-0 text-center"
                        placeholder="موضوع PM را توضیح دهید : "
                        value={values.pmsubject}
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
      </main>
    </div>
  );
};

export default PmFormSubmit;
