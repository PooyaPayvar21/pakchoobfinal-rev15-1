/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import "../styles/SubmitForm.css";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/Common/Header";
import { api, pmAghlamsubmit, pmPersonelsubmit } from "../api.js";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "moment/locale/fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { toast } from "react-toastify";

const PmSubmitForm = () => {
  const [values, setValues] = useState({
    pmformcode: "",
    pmfailurereason: "",
    pmworktype: "",
    pmproblemdescription: "",
    startpmrepairtime: "",
    endpmrepairtime: "",
    worktime: "00:00",
    notdonereason: "",
    pmjobstatus: "بله",
  });
  const { pmformcode } = useParams();
  const [show, setShow] = useState(false);
  const [userType, setUserType] = useState("admin");
  const [showPmAghlam, setShowPmAghlam] = useState(false);
  const [showPmPersonel, setShowPmPersonel] = useState(false);
  const [generatedFormCode, setGeneratedFormCode] = useState("");

  // Aghlam Values
  const [pmAghlam, setPmAghlam] = useState({
    pmformcode: "",
    kalaname: "",
    countkala: "",
    vahedkala: "",
    codekala: "",
  });

  // Personel Values
  const [pmPersonel, setPmPersonel] = useState({
    pmformcode: "",
    personel: "",
    personelnumber: "",
    specialjob: "",
    starttimerepair: "",
    endtimerepair: "",
    repairstatus: "",
    unitrepair: "",
    shift: "",
  });

  const navigate = useNavigate();

  // Date Time => Persian

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
          console.log("user_token exists:", !!userToken);

          // If user_token exists but token doesn't, copy it
          if (userToken) {
            localStorage.setItem("token", userToken);
            token = userToken;
            console.log("Copied token from user_token to token");
          }
        }

        if (!token) {
          console.error("Token is missing!");
          return;
        }

        const res = await api.get(`/pmformssubmit/${pmformcode}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setValues(res.data);
      } catch (error) {
        console.error("Error Fetching form data", error);
      }
    };

    if (pmformcode) fetchFormData();
  }, [pmformcode]);

  // Save

  useEffect(() => {
    setPmPersonel((prevPersonel) => ({
      ...prevPersonel,
      pmformcode: pmformcode || "",
    }));
  }, [pmformcode]);

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !values.worktime ||
      !values.pmworktype ||
      !values.pmproblemdescription
    ) {
      alert("لطفا همه فیلدهای مورد نیاز را پر کنید");
      return;
    }

    try {
      // Convert date strings to ISO format
      const startPmRepairTime = formatDateTime(values.startpmrepairtime);
      const endPmRepairTime = formatDateTime(values.endpmrepairtime);

      // Submit technician form
      const response = await api.post("/pmtechniciansubmit/", {
        pmformcode: values?.pmformcode || pmformcode,
        pmfailurereason: values.pmfailurereason || "استهلاک طبیعی", // Ensure default value
        pmworktype: values.pmworktype,
        pmproblemdescription: values.pmproblemdescription,
        startpmrepairtime: startPmRepairTime,
        endpmrepairtime: endPmRepairTime,
        worktime: values.worktime,
        notdonereason: values.notdonereason || "نبود قطعه", // Ensure default value
        pmjobstatus: values.pmjobstatus || "بله",
      });

      if (response.data.status === "success") {
        // Update form status in workflow
        try {
          await api.post(`/pmformssubmit/${pmformcode}/status/`, {
            action: "worktype_technician_submit",
          });

          // Show success message
          toast.success("فرم با موفقیت ثبت شد");

          // Navigate back
          navigate(-1);
        } catch (error) {
          console.error("Error submitting form:", error);
          toast.error("خطا در ثبت فرم");
        }
      } else {
        toast.error("خطا در ثبت فرم");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("خطا در ثبت فرم");
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setPmPersonel((prevPersonel) => ({
      ...prevPersonel,
      [name]: value,
    }));

    if (
      ["kalaname", "countkala", "vahedkala", "codekala", "flamekala"].includes(
        name
      )
    ) {
      setPmAghlam((prevPmAghlam) => ({
        ...prevPmAghlam,
        [name]: value,
      }));
    } else {
      setValues((prevValues) => ({
        ...prevValues,
        [name]: value,
      }));
    }
  };

  {
    /* PM AGHLAM SUBMIT */
  }
  const handlePmAghlamSubmit = async (e) => {
    e.preventDefault();
    if (!pmAghlam.kalaname || !pmAghlam.countkala) {
      toast.error("لطفا تمامی فیلد ها را پر کنید");
      return;
    }
    try {
      const response = await pmAghlamsubmit({
        pmformcode: values?.pmformcode || pmformcode,
        kalaname: pmAghlam.kalaname,
        countkala: pmAghlam.countkala,
        vahedkala: pmAghlam.vahedkala || "عدد",
        codekala: pmAghlam.codekala,
      });

      if (response.data.status === "success" || response.status === 200) {
        toast.success("فرم با موفقیت ثبت شد");
        setPmAghlam({
          pmformcode: pmformcode,
          kalaname: "",
          countkala: "",
          vahedkala: "عدد",
          codekala: "",
        });
        setGeneratedFormCode("");
      } else {
        toast.error("خطا در ثبت فرم");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.message || "خطا در ثبت فرم");
    }
  };

  {
    /* PM PERSONEL SUBMIT */
  }
  const handlePmPersonelSubmit = async (e) => {
    e.preventDefault();
    if (!pmPersonel.personel || !pmPersonel.personelnumber) {
      toast.error("لطفا تمامی فیلد ها را پر کنید");
      return;
    }
    try {
      const response = await pmPersonelsubmit({
        pmformcode: values?.pmformcode || pmformcode, // Changed from pmformcode to formcode to match backend model
        personel: pmPersonel.personel,
        personelnumber: pmPersonel.personelnumber,
        specialjob: pmPersonel.specialjob || "کارشناس",
        starttimerepair: formatDateTime(pmPersonel.starttimerepair),
        endtimerepair: formatDateTime(pmPersonel.endtimerepair),
        repairstatus: pmPersonel.repairstatus || "تعمیر کامل و قابل کاربری است",
        unitrepair: pmPersonel.unitrepair || "Mechanic",
        shift: pmPersonel.shift || "A",
      });

      if (response.data.status === "success" || response.status === 200) {
        toast.success("فرم با موفقیت ثبت شد");
        setPmPersonel({
          pmformcode: pmformcode,
          personel: "",
          personelnumber: "",
          specialjob: "کارشناس",
          starttimerepair: "",
          endtimerepair: "",
          repairstatus: "تعمیر کامل و قابل کاربری است",
          unitrepair: "",
          shift: "A",
        });
        setGeneratedFormCode("");
      } else {
        toast.error("خطا در ثبت فرم");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.message || "خطا در ثبت فرم");
    }
  };

  // Check UserRole For unitRepair
  useEffect(() => {
    const worktype = localStorage.getItem("user_type");
    setPmPersonel((prev) => ({
      ...prev,
      unitrepair: worktype?.toLowerCase() || "",
    }));
  }, []);

  {
    /* Start time Change for date */
  }
  const handleStartTimeChange = (date) => {
    if (date) {
      setPmPersonel((prev) => ({
        ...prev,
        starttimerepair: date.toDate ? date.toDate() : date,
      }));
    }
  };
  const handleEndTimeChange = (date) => {
    if (date) {
      setPmPersonel((prev) => ({
        ...prev,
        endtimerepair: date.toDate ? date.toDate() : date,
      }));
    }
  };

  const handleStartPmRepairTimeChange = (date) => {
    if (date) {
      setValues((v) => ({
        ...v,
        startpmrepairtime: date.toDate ? date.toDate() : date,
      }));
    }
  };
  const handleEndPmRepairTimeChange = (date) => {
    if (date) {
      setValues((v) => ({
        ...v,
        endpmrepairtime: date.toDate ? date.toDate() : date,
      }));
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"ثبت فرم تکنیسین"} />
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
                          htmlFor="pmformcode"
                          className="flex justify-center text-center"
                        >
                          شماره درخواست
                        </label>
                        <input
                          type="text"
                          id="pmformcode"
                          name="pmformcode"
                          placeholder="شماره درخواست"
                          value={values?.pmformcode || pmformcode} // Pre-fill with formcode from URL
                          disabled
                          required
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="pmjobstatus"
                          className="flex justify-center items-center"
                        >
                          وضعیت کار
                        </label>
                        <select
                          name="pmjobstatus"
                          id="pmjobstatus"
                          value={values.pmjobstatus}
                          onChange={handleInputChange}
                        >
                          <option value="بله">کار انجام شد</option>
                          <option value="خیر">کار انجام نشد</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="pmfailurereason"
                          className="flex justify-center items-center"
                        >
                          علت خرابی
                        </label>
                        <select
                          name="pmfailurereason"
                          id="pmfailurereason"
                          value={values.pmfailurereason}
                          onChange={handleInputChange}
                        >
                          {" "}
                          <option value="">-- نوع کار را انتخاب کنید --</option>
                          <option value="استهلاک طبیعی">استهلاک طبیعی</option>
                          <option value="نگهداری و تعمیرات پیشگیرانه">
                            نگهداری و تعمیرات پیشگیرانه
                          </option>
                          <option value="نامناسب بودن تعمیرات قبلی">
                            نامناسب بودن تعمیرات قبلی
                          </option>
                          <option value="عدم دقت اپراتور">
                            عدم دقت اپراتور
                          </option>
                          <option value="کیفیت پایین قطعات یدکی">
                            کیفیت پایین قطعات یدکی
                          </option>
                          <option value="سرویس و نگهداری نامناسب">
                            سرویس و نگهداری نامناسب
                          </option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="pmworktype"
                          className="flex justify-center items-center"
                        >
                          نوع کار
                        </label>
                        <select
                          name="pmworktype"
                          id="pmworktype"
                          value={values.pmworktype}
                          onChange={handleInputChange}
                        >
                          <option value="">-- نوع کار را انتخاب کنید --</option>
                          <option value="روانکاری">روانکاری</option>
                          <option value="بازرسی">بازرسی</option>
                          <option value="آچارکشی">آچارکشی</option>
                          <option value="نصب">نصب</option>
                          <option value="تنظیم">تنظیم</option>
                          <option value="تعمیر">تعمیر</option>
                          <option value="تعویض">تعویض</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="startpmrepairtime"
                          className="flex justify-center items-center"
                        >
                          شروع کار تعمیرات
                        </label>
                        <DatePicker
                          value={values.startpmrepairtime}
                          onChange={handleStartPmRepairTimeChange}
                          calendar={persian}
                          locale={persian_fa}
                          calendarPosition="bottom-right"
                          format="YYYY/MM/DD HH:mm"
                          inputClass="outline-none text-14 w-full font-normal flex justify-center text-center items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                          containerClassName="w-full"
                          plugins={[
                            <TimePicker
                              position="bottom"
                              title="زمان"
                              hourLabel="ساعت"
                              minuteLabel="دقیقه"
                            />,
                          ]}
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
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="endpmrepairtime"
                          className="flex justify-center items-center"
                        >
                          پایان کار تعمیرات
                        </label>
                        <DatePicker
                          value={values.endpmrepairtime}
                          onChange={handleEndPmRepairTimeChange}
                          calendar={persian}
                          locale={persian_fa}
                          calendarPosition="bottom-right"
                          format="YYYY/MM/DD HH:mm"
                          inputClass="outline-none text-14 w-full font-normal flex justify-center text-center items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                          containerClassName="w-full"
                          plugins={[
                            <TimePicker
                              position="bottom"
                              title="زمان"
                              hourLabel="ساعت"
                              minuteLabel="دقیقه"
                            />,
                          ]}
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
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="worktime"
                          className="flex justify-center items-center"
                        >
                          مدت کارکرد
                        </label>
                        <input
                          type="text"
                          name="worktime"
                          id="worktime"
                          className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 h-11 "
                          value={values.worktime}
                          placeholder="00:00"
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="input-field">
                        <label
                          htmlFor="notdonereason"
                          className="flex justify-center items-center"
                        >
                          علت عدم انجام تعمیر
                        </label>
                        <select
                          name="notdonereason"
                          id="notdonereason"
                          value={values.notdonereason}
                          onChange={handleInputChange}
                        >
                          <option value="">-- نوع کار را انتخاب کنید --</option>
                          <option value="ندارد">ندارد</option>
                          <option value="نت پیشگیرانه">نت پیشگیرانه</option>
                          <option value="نبود قطعه">نبود قطعه</option>
                          <option value="نرسیدن زمان انجام">
                            نرسیدن زمان انجام
                          </option>
                          <option value="نبود زمان کافی">نبود زمان کافی</option>
                          <option value="لغو سرویس بنا به تشخیص سرپرست تعمیراتی">
                            لغو سرویس بنا به تشخیص سرپرست تعمیراتی
                          </option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="pmproblemdescription"
                          className="flex justify-center items-center"
                        >
                          کلیات شرح عیب مشاهده شده
                        </label>
                        <textarea
                          name="pmproblemdescription"
                          id="pmproblemdescription"
                          className="outline-none text-14 w-full font-normal flex justify-center text-center  items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                          placeholder="کلیات شرح عیب مشاهده شده را توضیح دهید"
                          value={values.pmproblemdescription}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-center text-center aling-center">
                      <button
                        type="button"
                        className="nextBtn"
                        onClick={() => setShowPmAghlam(true)}
                      >
                        اقلام
                      </button>
                      <button
                        type="button"
                        className="nextBtn"
                        onClick={() => setShowPmPersonel(true)}
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
      {showPmAghlam && (
        <div className="fixed inset-0 flex items-center justify-center z-20">
          <div className="fixed inset-0 bg-gray-700 opacity-50" />
          <div className="w-[520px] justify-center flex aling-center rounded-2xl">
            <div className="container">
              <form onSubmit={handlePmAghlamSubmit}>
                <header className="flex mb-6 justify-center text-center font-bold">
                  شرح و مشخصات قطعات یدکی مصرف شده
                </header>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-field">
                    <label
                      htmlFor="pmformcode"
                      className="flex justify-center text-center"
                    >
                      شماره درخواست
                    </label>
                    <input
                      type="text"
                      id="pmformcode"
                      placeholder="شماره درخواست"
                      value={values?.pmformcode || pmformcode} // Pre-fill with formcode from URL
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
                      value={pmAghlam.kalaname}
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
                      value={pmAghlam.countkala}
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
                      value={pmAghlam.vahedkala}
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
                      value={pmAghlam.codekala}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="input-field">
                    <label
                      htmlFor="flamekala"
                      className="flex justify-center items-center"
                    >
                      آیا قطعه مستعمل است؟
                    </label>
                    <select
                      name="flamekala"
                      id="flamekala"
                      value={pmAghlam.flamekala}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="خیر">خیر</option>
                      <option value="بله">بله</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-center text-center">
                  <button
                    className="nextBtn"
                    type="submit"
                    onClick={handlePmAghlamSubmit}
                  >
                    تایید
                  </button>
                  <button
                    className="nextBtnCancel"
                    onClick={() => setShowPmAghlam(false)}
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
      {showPmPersonel && (
        <div className="fixed inset-0 flex items-center justify-center z-20">
          <div className="fixed inset-0 bg-gray-700 opacity-50" />
          <div className="w-[600px] justify-center flex aling-center rounded-2xl">
            <div className="container">
              <form onSubmit={handlePmPersonelSubmit}>
                <header className="flex text-center justify-center mb-2">
                  سرپرست/مسئول تعمیرات
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-field">
                    <label
                      htmlFor="pmformcode"
                      className="flex justify-center text-center"
                    >
                      شماره درخواست
                    </label>
                    <input
                      type="text"
                      id="pmformcode"
                      placeholder="شماره درخواست"
                      value={values?.pmformcode || pmformcode} // Pre-fill with formcode from URL
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
                      value={pmPersonel.personel}
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
                      value={pmPersonel.personelnumber}
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
                      value={pmPersonel.specialjob}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="کارشناس">کارشناس</option>
                      <option value="رئیس">رئیس</option>
                      <option value="سرشیفت">سرشیفت</option>
                      <option value="سرپرست">سرپرست</option>
                      <option value="تکنسین">تکنسین</option>
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
                      value={pmPersonel.starttimerepair}
                      onChange={handleStartTimeChange}
                      calendar={persian}
                      locale={persian_fa}
                      calendarPosition="bottom-right"
                      format="YYYY/MM/DD HH:mm"
                      inputClass="outline-none text-14 w-full font-normal flex justify-center text-center items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                      containerClassName="w-full"
                      plugins={[
                        <TimePicker
                          position="bottom"
                          title="زمان"
                          hourLabel="ساعت"
                          minuteLabel="دقیقه"
                        />,
                      ]}
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
                      value={pmPersonel.endtimerepair}
                      onChange={handleEndTimeChange}
                      calendar={persian}
                      locale={persian_fa}
                      calendarPosition="bottom-right"
                      format="YYYY/MM/DD HH:mm"
                      inputClass="outline-none text-14 w-full font-normal flex justify-center text-center items-center rounded-md shadow-lg border-2 p-2 h-11 m-2"
                      containerClassName="w-full"
                      plugins={[
                        <TimePicker
                          position="bottom"
                          title="زمان"
                          hourLabel="ساعت"
                          minuteLabel="دقیقه"
                        />,
                      ]}
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
                    />
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
                      value={pmPersonel.unitrepair}
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
                      value={pmPersonel.shift}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-center text-center">
                  <button
                    className="nextBtn"
                    type="submit"
                    onClick={handlePmPersonelSubmit}
                  >
                    تایید
                  </button>
                  <button
                    className="nextBtnCancel"
                    onClick={() => setShowPmPersonel(false)}
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
};

export default PmSubmitForm;
