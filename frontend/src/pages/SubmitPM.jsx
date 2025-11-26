/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import { motion } from "framer-motion";
import "../styles/SubmitForm.css";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "../styles/persian-calendar.css";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { MultiSelect } from "primereact/multiselect";
import { api } from "../api";

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
  Melamine1: "01",
  Melamine2: "02",
  "High Gloss": "05",
  Formalin: "08",
  Resin: "07",
  "Water Treatment Plant": "09",
  "Paper Impregnation 1": "10",
  "Paper Impregnation 2": "11",
  "Paper Impregnation 3": "12",
};

function SubmitPM() {
  const [values, setValues] = useState({});
  const [selectedWorktype, setSelectedWorktype] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!values.pmsubmitdate || !values.pmserial || !values.pmsubject) {
      toast.error("لطفا فیلدهای الزامی را پر کنید");
      return;
    }

    const dateIso =
      values.pmsubmitdate && values.pmsubmitdate.toDate
        ? values.pmsubmitdate.toDate().toISOString()
        : values.pmsubmitdate?.toString?.() || null;

    const payload = {
      pmsubmitdate: dateIso,
      pmserial: values.pmserial,
      pmsubject: values.pmsubject,
      pmsection: values.sectionName || values.sectionCode || "",
      pmworktype: values.worktype || "",
    };

    try {
      const response = await api.post("/submitpm/", payload);
      if (!(response && response.status >= 200 && response.status < 300)) {
        throw new Error("Server Error");
      }
      toast.success("دستور تعمیرات با موفقیت ثبت شد");
      setValues({});
      setSelectedWorktype([]);
    } catch (error) {
      console.error(error);
      toast.error("خطا در ثبت، مجددا تلاش کنید");
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"ثبت دستورات تعمیرات"} />
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
                <div className="form first">
                  <div className="details personal">
                    <div className="fields">
                      <div className="input-field">
                        <label
                          htmlFor="pmsubmitdate"
                          className="flex justify-center items-center"
                        >
                          تاریخ ثبت دستور تعمیرات
                        </label>
                        <DatePicker
                          value={values.pmsubmitdate || null}
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
                          onChange={(d) =>
                            setValues((prev) => ({ ...prev, pmsubmitdate: d }))
                          }
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="pmserial"
                          className="flex justify-center items-center"
                        >
                          شماره دستور تعمیرات
                        </label>
                        <input
                          type="text"
                          name="pmserial"
                          id="pmserial"
                          className="text-center bg-gray-100"
                          value={values.pmserial}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              pmserial: e.target.value,
                            }))
                          }
                        />
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
                          className="flex text-center justify-center items-center"
                          value={values.sectionCode || ""}
                          onChange={(e) => {
                            const code = e.target.value;
                            const name =
                              Object.keys(sectionCodes).find(
                                (k) => sectionCodes[k] === code
                              ) || "";
                            setValues((prev) => ({
                              ...prev,
                              sectionCode: code,
                              sectionName: name,
                            }));
                          }}
                        >
                          <option value="">-- یک بخش را انتخاب کنید --</option>
                          {Object.entries(sectionCodes).map(([name, code]) => (
                            <option value={code} key={code}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="pmsubject"
                          className="flex justify-center items-center"
                        >
                          موضوع دستور تعمیرات
                        </label>
                        <input
                          type="text"
                          name="pmsubject"
                          id="pmsubject"
                          className="text-center bg-gray-100"
                          value={values.pmsubject || ""}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              pmsubject: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="input-field">
                        <label
                          htmlFor="pmunit"
                          className="flex justify-center items-center"
                        >
                          واحد مربوطه
                        </label>
                        <MultiSelect
                          className="text-center flex justify-center items-center"
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
    </div>
  );
}

export default SubmitPM;
