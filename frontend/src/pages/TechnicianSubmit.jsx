/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import "../styles/SubmitForm.css";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/Common/Header";
import { api } from "../api";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import moment from "moment-jalaali";
import "moment/locale/fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { toast, ToastContainer } from "react-toastify";

function TechnicianSubmit() {
  const [values, setValues] = useState({
    formcode: "",
    failurepart: "",
    failuretime: "00:00",
    sparetime: "00:00",
    wastedtime: "00:00",
    startfailuretime: "00:00",
    problemdescription: "",
    jobstatus: "بله",
  });
  const { formcode } = useParams();
  const [show, setShow] = useState(false);
  const [userType, setUserType] = useState("admin");
  const [showPermit, setShowPermit] = useState(false);
  const [showAghlam, setShowAghlam] = useState(false);
  const [showTech, setShowTech] = useState(false);
  const [generatedFormCode, setGeneratedFormCode] = useState("");
  const [aghlam, setAghlam] = useState({
    formcode: "",
    kalaname: "",
    countkala: "",
    vahedkala: "عدد",
    codekala: "",
    flamekala: "خیر",
  });
  const [tech, setTech] = useState({
    formcode: formcode || "",
    personel: "",
    personelnumber: "",
    datesubmit: "",
    specialjob: "کارشناس",
    starttimerepair: "",
    endtimerepair: "",
    repairstatus: "تعمیر کامل و قابل کاربری است",
    unitrepair: "Mechanic",
    shift: "A",
    delayreason: "ندارد",
    failurereason: "ندارد",
    failurereasondescription: "",
    suggestionfailure: "",
  });
  const [otherFailureReason, setOtherFailureReason] = useState("");
  const navigate = useNavigate();

  const formatDateTime = (datetime) => {
    if (!datetime) {
      return null;
    }

    try {
      // If it's already a JavaScript Date object
      if (datetime instanceof Date) {
        return datetime.toISOString();
      }

      // If it's a Persian date picker object
      if (datetime && typeof datetime === "object" && datetime.toDate) {
        return datetime.toDate().toISOString();
      }

      // If it's a string, try to parse it
      if (typeof datetime === "string") {
        // Try parsing as ISO string
        const date = new Date(datetime);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        let token = localStorage.getItem("token");

        // If not token exists, check if user_token is used instead
        if (!token) {
          const userToken = localStorage.getItem("user_token");
          // If user_token exists but token doesn't, copy it
          if (userToken) {
            localStorage.setItem("token", userToken);
            token = userToken;
          }
        }

        if (!token) {
          return;
        }

        const res = await api.get(`/submitform/${formcode}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setValues(res.data);
      } catch (error) {
        toast.error("Error Fetching form data", error);
      }
    };

    if (formcode) fetchFormData();
  }, [formcode]);

  useEffect(() => {
    setTech((prevTech) => ({
      ...prevTech,
      formcode: formcode || "",
    }));
  }, [formcode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.failurepart || !values.problemdescription) {
      toast.error("لطفا همه فیلدهای مورد نیاز را پر کنید");
      return;
    }
    try {
      // Submit technician form
      const response = await api.post("/techniciansubmit/", {
        formcode: values?.formcode || formcode,
        failurepart: values.failurepart,
        failuretime: values.failuretime || "00:00",
        sparetime: values.sparetime || "00:00",
        wastedtime: values.wastedtime || "00:00",
        startfailuretime: values.startfailuretime || "00:00",
        problemdescription: values.problemdescription,
        jobstatus: values.jobstatus || "بله",
      });

      if (response.data.status === "success") {
        // Update form status in workflow
        await api.post(`/forms/${formcode}/status/`, {
          action: "technician_submit",
        });
        // Show success message
        toast.success("فرم با موفقیت ثبت شد");
        // Navigate back
        navigate(-1);
      } else {
        toast.error("خطا در ثبت فرم");
      }
    } catch (error) {
      toast.error("خطا در ثبت فرم");
    }
  };

  // Check UserRole For unitRepair
  useEffect(() => {
    const worktype = localStorage.getItem("user_type");
    setTech((prev) => ({
      ...prev,
      unitrepair: worktype?.toLowerCase() || "",
    }));
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "failurereason" && value === "") {
      setTech((prevTech) => ({
        ...prevTech,
        [name]: value,
      }));
    } else if (name === "otherFailureReason") {
      setOtherFailureReason(value);
      setTech((prevTech) => ({
        ...prevTech,
        failurereason: value,
      }));
    } else {
      setTech((prevTech) => ({
        ...prevTech,
        [name]: value,
      }));
    }

    if (
      ["kalaname", "countkala", "vahedkala", "codekala", "flamekala"].includes(
        name
      )
    ) {
      setAghlam((prevAghlam) => ({
        ...prevAghlam,
        [name]: value,
      }));
    } else {
      setValues((prevValues) => ({
        ...prevValues,
        [name]: value,
      }));
    }
  };

  const handleAghlamSubmit = async (e) => {
    e.preventDefault();
    if (!aghlam.kalaname || !aghlam.countkala) {
      toast.error("لطفا همه فیلدهای مورد نیاز را پر کنید");
      return;
    }
    try {
      const response = await api.post("/aghlam/", {
        formcode: values.formcode || formcode,
        kalaname: aghlam.kalaname,
        countkala: aghlam.countkala,
        vahedkala: aghlam.vahedkala,
        codekala: aghlam.codekala,
        flamekala: aghlam.flamekala,
      });

      if (response.data.status === "success") {
        toast.success("فرم ثبت شد");
        setGeneratedFormCode(response.data.formcode);
        setAghlam({
          formcode: formcode,
          kalaname: "",
          countkala: "",
          vahedkala: "عدد",
          codekala: "",
          flamekala: "خیر",
        });
        setTimeout(() => {
          setGeneratedFormCode("");
        }, 3000);
      } else {
        toast.error("⚠️ خطا در ثبت فرم:", response.data.message);
      }
    } catch (error) {
      toast.error("❌ خطا در ثبت فرم:", error);
    }
  };

  const handleTechSubmit = async (e) => {
    e.preventDefault();
    if (
      !tech.personel ||
      !tech.personelnumber ||
      !tech.failurereasondescription
    ) {
      toast.error("لطفا همه فیلدهای مورد نیاز را پر کنید");
      return;
    }
    const startTimeRepair = formatDateTime(tech.starttimerepair);
    const endTimeRepair = formatDateTime(tech.endtimerepair);

    try {
      // Format dates;
      const response = await api.post("/personel/", {
        formcode: tech.formcode || formcode,
        personel: tech.personel,
        personelnumber: tech.personelnumber,
        specialjob: tech.specialjob,
        starttimerepair: tech.starttimerepair.toString(),
        endtimerepair: tech.endtimerepair.toString(),
        repairstatus: tech.repairstatus,
        unitrepair: tech.unitrepair,
        shift: tech.shift,
        delayreason: tech.delayreason,
        failurereason: tech.failurereason,
        failurereasondescription: tech.failurereasondescription,
        suggestionfailure: tech.suggestionfailure,
      });

      if (response.data.status === "success") {
        toast.success("فرم ثبت شد");
        setTech((prevTech) => ({
          ...prevTech,
          personel: "",
          personelnumber: "",
          datesubmit: "",
          specialjob: "کارشناس",
          repairstatus: "تعمیر کامل و قابل کاربری است",
          unitrepair: values.unitrepair,
          shift: values.shift,
          delayreason: "ندارد",
          failurereason: "ندارد",
          failurereasondescription: values.failurereasondescription,
          suggestionfailure: values.suggestionfailure,
        }));
      } else {
        toast.error("خطا در ثبت فرم");
      }
    } catch (error) {
      toast.error("خطا در ثبت فرم");
    }
  };

  const handleDateChangeStart = (date) => {
    // Store the Persian date value directly from the picker
    setTech((prev) => ({
      ...prev,
      starttimerepair: date, // Persian date instance from DatePicker
    }));
  };

  const handleDateChangeEnd = (date) => {
    // Store the Persian date value directly from the picker
    setTech((prev) => ({
      ...prev,
      endtimerepair: date, // Persian date instance from DatePicker
    }));
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"ثبت فرم تکنیسین"} />
      <ToastContainer />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="body sm:grid-cols-1 dark:bg-secondary-dark-bg rounded-3xl">
            <div className="container">
              <form onSubmit={handleSubmit}>
                <div className="form first">
                  <div className="details personal">
                    <div className="fields">
                      <div className="input-field">
                        <label
                          htmlFor="formcode"
                          className="flex justify-center text-center"
                        >
                          شماره درخواست
                        </label>
                        <input
                          type="text"
                          id="formcode"
                          placeholder="شماره درخواست"
                          className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                          value={values?.formcode || formcode} // Pre-fill with formcode from URL
                          disabled
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="jobstatus"
                          className="flex justify-center items-center"
                        >
                          وضعیت کار
                        </label>
                        <select
                          name="jobstatus"
                          id="jobstatus"
                          value={values.jobstatus}
                          onChange={handleInputChange}
                        >
                          <option value="بله">کار انجام شد</option>
                          <option value="خیر">کار انجام نشد</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="failurepart"
                          className="flex justify-center items-center"
                        >
                          نام قسمت معیوب(بر اساس تکسونومی)
                        </label>
                        <input
                          type="text"
                          name="failurepart"
                          id="failurepart"
                          placeholder="نام قسمت معیوب(بر اساس تکسونومی)"
                          className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 "
                          value={values.failurepart}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="failuretime"
                          className="flex justify-center items-center"
                        >
                          مدت زمان تشخیص عیب
                        </label>
                        <input
                          type="text"
                          name="failuretime"
                          className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11"
                          id="failuretime"
                          value={values.failuretime}
                          placeholder="00:00"
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="wastedtime"
                          className="flex justify-center items-center"
                        >
                          زمان تلف شده
                        </label>
                        <input
                          type="text"
                          name="wastedtime"
                          className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11"
                          id="wastedtime"
                          value={values.wastedtime}
                          placeholder="00:00"
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="sparetime"
                          className="flex justify-center items-center"
                        >
                          مدت زمان تهیه لوازم یدکی
                        </label>
                        <input
                          type="text"
                          name="sparetime"
                          id="sparetime"
                          className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11"
                          placeholder="00:00"
                          value={values.sparetime}
                          onChange={handleInputChange}
                        />
                      </div>
                      {/* <div className="input-field">
                        <label
                          htmlFor="startfailuretime"
                          className="flex justify-center items-center"
                        >
                          (ساعت)میزان ساعت کار تجهیز در زمان شروع به رفع عیب
                        </label>
                        <input
                          type="text"
                          name="startfailuretime"
                          id="startfailuretime"
                          className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 h-11 "
                          value={values.startfailuretime}
                          placeholder="00:00"
                          onChange={handleInputChange}
                        />
                      </div> */}
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
                          className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                          placeholder="کلیات شرح عیب مشاهده شده را توضیح دهید : "
                          value={values.problemdescription}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-center text-center aling-center">
                      <button
                        type="button"
                        className="nextBtn"
                        onClick={() => setShowAghlam(true)}
                      >
                        اقلام
                      </button>
                      <button
                        type="button"
                        className="nextBtn"
                        onClick={() => setShowTech(true)}
                      >
                        تکنیسین
                      </button>
                      <button type="submit" className="nextBtn">
                        ثبت
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Aghlam Form */}
      {showAghlam && (
        <div className="fixed inset-0 flex items-center justify-center z-20">
          <div className="fixed inset-0 bg-gray-700 opacity-50" />
          <div className="w-[520px] justify-center flex aling-center rounded-2xl">
            <div className="container">
              <form onSubmit={handleAghlamSubmit}>
                <header className="flex mb-6 justify-center text-center font-bold">
                  شرح و مشخصات قطعات یدکی مصرف شده
                </header>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-field">
                    <label
                      htmlFor="formcode"
                      className="flex justify-center text-center"
                    >
                      شماره درخواست
                    </label>
                    <input
                      type="text"
                      id="formcode"
                      placeholder="شماره درخواست"
                      value={values?.formcode || formcode} // Pre-fill with formcode from URL
                      disabled
                      required
                    />
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="kalaname"
                      className="flex justify-center items-center"
                    >
                      نام قطعه
                    </label>
                    <input
                      type="text"
                      name="kalaname"
                      id="kalaname"
                      placeholder="نام قطعه"
                      value={aghlam.kalaname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="countkala"
                      className="flex justify-center items-center"
                    >
                      تعداد
                    </label>
                    <input
                      type="text"
                      name="countkala"
                      id="countkala"
                      placeholder="تعداد"
                      value={aghlam.countkala}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="vahedkala"
                      className="flex justify-center items-center"
                    >
                      واحد
                    </label>
                    <select
                      name="vahedkala"
                      id="vahedkala"
                      value={aghlam.vahedkala}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="عدد">عدد</option>
                      <option value="سانتی متر">سانتی متر</option>
                      <option value="گرم">گرم</option>
                      <option value="لیتر">لیتر</option>
                      <option value="کیلوگرم">کیلوگرم</option>
                      <option value="متر">متر</option>
                      <option value="متر مربع">متر مربع</option>
                      <option value="شاخه">شاخه</option>
                      <option value="بسته">بسته</option>
                    </select>
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="codekala"
                      className="flex justify-center items-center"
                    >
                      کد قطعه
                    </label>
                    <input
                      type="text"
                      name="codekala"
                      id="codekala"
                      placeholder="کد قطعه"
                      value={aghlam.codekala}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  {/* <div className="input-field">
                    <label
                      htmlFor="flamekala"
                      className="flex justify-center items-center"
                    >
                      آیا قطعه مستعمل است؟
                    </label>
                    <select
                      name="flamekala"
                      id="flamekala"
                      value={aghlam.flamekala}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="خیر">خیر</option>
                      <option value="بله">بله</option>
                    </select>
                  </div> */}
                </div>
                <div className="flex justify-center text-center">
                  <button
                    className="nextBtn"
                    type="submit"
                    onClick={handleAghlamSubmit}
                  >
                    تایید
                  </button>
                  <button
                    className="nextBtnCancel"
                    onClick={() => setShowAghlam(false)}
                  >
                    خروج
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Technician Form */}
      {showTech && (
        <div className="fixed inset-0 flex items-center justify-center z-20">
          <div className="fixed inset-0 bg-gray-700 opacity-50" />
          <div className="flex justify-center items-center w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-4 relative z-30">
            <div className="container">
              <form onSubmit={handleTechSubmit}>
                <header className="flex text-center justify-center mb-2">
                  سرپرست/مسئول تعمیرات
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-field">
                    <label
                      htmlFor="formcode"
                      className="flex justify-center text-center"
                    >
                      شماره درخواست
                    </label>
                    <input
                      type="text"
                      id="formcode"
                      placeholder="شماره درخواست"
                      value={values?.formcode || formcode} // Pre-fill with formcode from URL
                      disabled
                      required
                    />
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="personel"
                      className="flex justify-center items-center"
                    >
                      پرسنل انجام دهنده
                    </label>
                    <input
                      type="text"
                      name="personel"
                      id="personel"
                      placeholder="نام و نام خانوادگی پرسنل"
                      value={tech.personel}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="personelnumber"
                      className="flex justify-center items-center"
                    >
                      شماره پرسنلی
                    </label>
                    <input
                      type="text"
                      name="personelnumber"
                      id="personelnumber"
                      placeholder="شماره پرسنلی را وارد کنید"
                      className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                      value={tech.personelnumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="specialjob"
                      className="flex justify-center items-center"
                    >
                      مهارت
                    </label>
                    <select
                      name="specialjob"
                      id="specialjob"
                      className="outline-none text-14 w-full font-normal flex text-center items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                      value={tech.specialjob}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="تکنسین">تکنسین</option>
                      <option value="سرشیفت">سرشیفت</option>
                      <option value="کارشناس">کارشناس</option>
                      <option value="رئیس">رئیس</option>
                      <option value="سرپرست">سرپرست</option>
                      <option value="تعمیرکار">تعمیرکار</option>
                    </select>
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="starttimerepair"
                      className="flex justify-center items-center"
                    >
                      ساعت شروع تعمیرات
                    </label>
                    <DatePicker
                      value={tech.starttimerepair}
                      onChange={handleDateChangeStart}
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
                      htmlFor="endtimerepair"
                      className="flex justify-center items-center"
                    >
                      ساعت پایان تعمیرات
                    </label>
                    <DatePicker
                      value={tech.endtimerepair}
                      onChange={handleDateChangeEnd}
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
                      htmlFor="repairstatus"
                      className="flex justify-center items-center"
                    >
                      وضعیت تعمیر
                    </label>
                    <select
                      name="repairstatus"
                      id="repairstatus"
                      className="outline-none text-14 text-center w-full font-normal flex items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                      value={tech.repairstatus}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="تعمیر کامل و قابل کاربری است">
                        تعمیر کامل و قابل کاربری است
                      </option>
                      <option value="نیاز به تعمیر مجدد دارد">
                        نیاز به تعمیر مجدد دارد
                      </option>
                      <option value="نیاز به بازرسی مجدد دارد">
                        نیاز به بازرسی مجدد دارد
                      </option>
                      <option value="تعمیر کامل نیست و نیاز به تکمیل دارد">
                        تعمیر کامل نیست و نیاز به تکمیل دارد
                      </option>
                    </select>
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="unitrepair"
                      className="flex justify-center items-center"
                    >
                      واحد تعمیرات
                    </label>
                    <select
                      name="unitrepair"
                      id="unitrepair"
                      value={tech.unitrepair}
                      onChange={handleInputChange}
                      disabled
                    >
                      <option value="">
                        {localStorage.getItem("user_type")?.toLowerCase()}
                      </option>
                    </select>
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
                      id="shift"
                      className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                      value={tech.shift}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="روزکار">روزکار</option>
                    </select>
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="delayreason"
                      className="flex justify-center items-center"
                    >
                      دلیل تاخیر
                    </label>
                    <select
                      name="delayreason"
                      id="delayreason"
                      className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                      value={tech.delayreason}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="ندارد">ندارد</option>
                      <option value="نبود قطعه یدکی">نبود قطعه یدکی</option>
                      <option value="نبودابزار و تجهیزات مناسب">
                        نبود ابزار و تجهیزات مناسب
                      </option>
                      <option value="عدم حضور متخصص تعمیرات">
                        عدم حضوری متخصص تعمیرات
                      </option>
                      <option value="کمبود نیرو">کمبود نیرو</option>
                      <option value="برونسپاری">برونسپاری</option>
                      <option value="تاخیر در صدور مجوزها">
                        تاخیر در صدور مجوزها
                      </option>
                      <option value="تاخیر در ماشین آلات">
                        تاخیر در ماشین آلات
                      </option>
                    </select>
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="failurereason"
                      className="flex justify-center items-center"
                    >
                      دلیل خرابی
                    </label>
                    <select
                      name="failurereason"
                      id="failurereason"
                      className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                      value={tech.failurereason}
                      onChange={handleInputChange}
                      required
                    >
                      {" "}
                      <option value="ندارد">ندارد</option>
                      <option value="اضافه بار">اضافه بار</option>
                      <option value="تنظیم نادرست">تنظیم نادرست</option>
                      <option value="تنظیم نادرست">تنظیم نادرست</option>
                      <option value="حادثه">حادثه</option>
                      <option value="طراحی غلط">طراحی غلط</option>
                      <option value="بهره برداری نادرست">
                        بهره برداری نادرست
                      </option>
                      <option value="نگهداری ضعیف">نگهداری ضعیف</option>
                      <option value="فرسودگی">فرسودگی</option>
                      <option value="نامرغوب بودن قطعات">
                        نامرغوب بودن قطعات
                      </option>
                      <option value="نبود / کمبود اطلاعات فنی">
                        نبود / کمبود اطلاعات فنی
                      </option>
                      <option value="تاخیر در ارجاع مکاتبات">
                        تاخیر در ارجاع مکاتبات
                      </option>
                      <option value="نامناسب بودن تعمیرات قبلی">
                        نامناسب بودن تعمیرات قبلی
                      </option>
                      <option value="">موارد دیگر</option>
                    </select>
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="failurereasondescription"
                      className="flex justify-center items-center"
                    >
                      شرح کار انجام شده
                    </label>
                    <textarea
                      placeholder="شرح کار انجام شده را توضیح دهید"
                      name="failurereasondescription"
                      id="failurereasondescription"
                      className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                      value={tech.failurereasondescription}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="suggestionfailure"
                      className="flex justify-center items-center"
                    >
                      پیشنهاد
                    </label>
                    <textarea
                      placeholder="پیشنهاد تکنیسین"
                      name="suggestionfailure"
                      id="suggestionfailure"
                      className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                      value={tech.suggestionfailure}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>
                <div className="flex justify-center text-center">
                  <button
                    className="nextBtn"
                    type="submit"
                    onClick={handleTechSubmit}
                  >
                    تایید
                  </button>
                  <button
                    className="nextBtnCancel"
                    onClick={() => setShowTech(false)}
                  >
                    خروج
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TechnicianSubmit;
