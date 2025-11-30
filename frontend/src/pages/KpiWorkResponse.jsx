import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Header from "../components/Common/Header";

const KpiWorkResponse = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [category, setCategory] = useState("");
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({
    obj_weight: "",
    KPIEn: "",
    KPIFa: "",
    KPI_Info: "",
    target: "",
    KPI_weight: "",
    KPI_Achievement: "",
    Percentage_Achievement: "",
    Score_Achievement: "",
    Type: "",
    Sum: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [locked, setLocked] = useState(false);
  const [userInfo, setUserInfo] = useState({
    personal_code: "",
    full_name: "",
    company_name: "",
    role: "",
    direct_management: "",
    departman: "",
  });

  useEffect(() => {
    // Try to get user info from route state or localStorage
    const userInfoData =
      location.state?.userInfo ||
      JSON.parse(localStorage.getItem("kpiUserInfo"));

    if (!userInfoData) {
      toast.error("Please complete user information first");
      navigate("/kpiuserinfo");
      return;
    }

    setUserInfo(userInfoData);
  }, [location, navigate]);

  useEffect(() => {
    if (userInfo.personal_code) {
      const selectedCategory = category || "All";
      const url = `/api/kpientry/create/?personal_code=${encodeURIComponent(
        userInfo.personal_code
      )}&category=${encodeURIComponent(selectedCategory)}`;
      fetch(url)
        .then((response) => {
          console.log("Fetch response status:", response.status);
          if (!response.ok) throw new Error("Failed to fetch tasks");
          return response.json();
        })
        .then((data) => {
          console.log("Received data:", data);
          // Map database field names to component field names
          if (data.tasks && Array.isArray(data.tasks)) {
            console.log("Found", data.tasks.length, "tasks");
            const fetchedTasks = data.tasks.map((task) => ({
              id: task.row || Date.now() + Math.random() * 10000,
              obj_weight: task.obj_weight || "",
              KPIEn: task.kpi_en || "",
              KPIFa: task.kpi_fa || "",
              KPI_Info: task.kpi_info || "",
              target: task.target || "",
              KPI_weight: task.kpi_weight || "",
              KPI_Achievement: task.kpi_achievement || "",
              Percentage_Achievement:
                task.percentage_achievement || task.score_achievement_alt || 0,
              Score_Achievement: task.score_achievement || 0,
              Type: task.entry_type || "",
              Sum: task.sum_value || "",
            }));
            setTasks(fetchedTasks);
            setCategory(selectedCategory);
            // Determine lock based on backend editable flag
            const editable = Boolean(data.editable);
            setLocked(!editable);
            setCurrentPage(1);
          } else {
            console.log("No tasks in response or invalid format");
          }
        })
        .catch((error) => {
          console.log("Error fetching tasks:", error.message);
          // Not an error state - just means no tasks exist yet
        });
    } else {
      console.log("No personal_code available yet");
    }
  }, [userInfo.personal_code, category]);

  const initialTaskState = {
    obj_weight: "",
    KPIEn: "",
    KPIFa: "",
    KPI_Info: "",
    target: "",
    KPI_weight: "",
    KPI_Achievement: "",
    Percentage_Achievement: "",
    Score_Achievement: "",
    Type: "",
    Sum: "",
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleAddTask = () => {
    if (locked) {
      toast.info("Form is locked; cannot add tasks");
      return;
    }
    if (!category) {
      toast.error("Please select a category first");
      return;
    }
    const newTask = {
      id: Date.now() + Math.floor(Math.random() * 10000),
      ...initialTaskState,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

  const formatNumber = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return n.toString();
  };

  const formatPercent = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return (n * 100).toString();
  };

  const parsePercent = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return n / 100;
  };

  const computePercentage = (N, P, S) => {
    // N = target, P = achievement, S = type (+ or -)
    if (
      N === "" ||
      P === "" ||
      N === null ||
      P === null ||
      N === undefined ||
      P === undefined
    )
      return 0;
    const n = Number(N);
    const p = Number(P);
    if (isNaN(n) || isNaN(p)) return 0;
    if (n === 0 && p === 0) return 1;
    if (S === "+") return round2(p / n);
    return round2(n / p);
  };

  const computeScore = (Q, O, J) => {
    const q = Number(Q);
    const o = Number(O) || 0;
    const j = Number(J) || 0;
    if (isNaN(q)) return 0;
    if ((q >= 0.6 && q < 1) || q === 1) {
      return q * (o * j) * 100;
    }
    if (q > 1) {
      return j * o * 100;
    }
    return 0;
  };

  const handleTaskChange = (id, name, value) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const updated = { ...task, [name]: value };

        const N = updated.target;
        const P = updated.KPI_Achievement;
        const S = updated.Type;
        const O = updated.KPI_weight;
        const J = updated.obj_weight;

        const Q = computePercentage(N, P, S);
        const R = computeScore(Q, O, J);

        updated.Percentage_Achievement = Q;
        updated.Score_Achievement = round2(R);

        return updated;
      })
    );
  };

  const handleRemoveTask = (id) => {
    if (locked) {
      toast.info("Form is locked; cannot remove tasks");
      return;
    }
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast.info("Task removed");
  };

  const clearFilters = () => {
    setFilters({
      obj_weight: "",
      KPIEn: "",
      KPIFa: "",
      KPI_Info: "",
      target: "",
      KPI_weight: "",
      KPI_Achievement: "",
      Percentage_Achievement: "",
      Score_Achievement: "",
      Type: "",
      Sum: "",
    });
    setCurrentPage(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    if (tasks.length === 0) {
      toast.error("Please add at least one task");
      return;
    }

    if (Object.values(userInfo).some((val) => !val.trim())) {
      toast.error("All user information fields are required");
      return;
    }

    const optionalTaskFields = [
      "KPI_Achievement",
      "Percentage_Achievement",
      "Score_Achievement",
      "Sum",
    ];
    const allTasksValid = tasks.every((task) =>
      Object.entries(task).every(
        ([key, val]) =>
          key === "id" ||
          optionalTaskFields.includes(key) ||
          (val !== null && val !== undefined && val.toString().trim() !== "")
      )
    );

    if (!allTasksValid) {
      toast.error("All fields are required for all tasks");
      return;
    }

    const submitData = {
      ...userInfo,
      category,
      tasks,
    };

    // Send to API
    fetch("/api/kpientry/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((error) => {
            throw new Error(error.message || "Failed to submit data");
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("API Response:", data);
        toast.success(data.message || "Data submitted successfully!");

        // After submit, lock the form until manager grants edit permission again
        setLocked(true);
      })
      .catch((error) => {
        console.error("Submission error:", error);
        toast.error(error.message || "Error submitting data");
      });
  };

  const uniqueValues = {
    obj_weight: Array.from(
      new Set(
        tasks
          .map((t) => formatPercent(t.obj_weight))
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
    KPIEn: Array.from(
      new Set(
        tasks
          .map((t) => t.KPIEn)
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
    KPIFa: Array.from(
      new Set(
        tasks
          .map((t) => t.KPIFa)
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
    KPI_Info: Array.from(
      new Set(
        tasks
          .map((t) => t.KPI_Info)
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
    target: Array.from(
      new Set(
        tasks
          .map((t) => formatPercent(t.target))
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
    KPI_weight: Array.from(
      new Set(
        tasks
          .map((t) => formatPercent(t.KPI_weight))
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
    KPI_Achievement: Array.from(
      new Set(
        tasks
          .map((t) => formatPercent(t.KPI_Achievement))
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
    Percentage_Achievement: Array.from(
      new Set(
        tasks
          .map((t) => formatNumber(t.Percentage_Achievement))
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
    Score_Achievement: Array.from(
      new Set(
        tasks
          .map((t) => formatNumber(t.Score_Achievement))
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
    Type: Array.from(
      new Set(
        tasks
          .map((t) => t.Type)
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
    Sum: Array.from(
      new Set(
        tasks
          .map((t) => formatPercent(t.Sum))
          .filter((v) => v !== "" && v !== null && v !== undefined)
      )
    ),
  };

  const filteredTasks = tasks.filter((task) => {
    return Object.entries(filters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      const rawValue = task[key];
      if (rawValue === null || rawValue === undefined) return false;

      let displayValue;
      if (
        key === "obj_weight" ||
        key === "target" ||
        key === "KPI_weight" ||
        key === "KPI_Achievement" ||
        key === "Sum"
      ) {
        displayValue = formatPercent(rawValue);
      } else if (
        key === "Percentage_Achievement" ||
        key === "Score_Achievement"
      ) {
        displayValue = formatNumber(rawValue);
      } else {
        displayValue = String(rawValue);
      }

      return String(displayValue) === String(filterValue);
    });
  });

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"داشبورد"} />
      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={true}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
      />
      <main className="w-full lg:px-8 mb-10 mt-10">
        <div className="w-full max-w-full mx-auto bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-200" dir="rtl">
            KPI Data Entry
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User info (single) and editable tasks table */}
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 mb-4">
              <div className="flex justify-between items-center mb-4" dir="rtl">
                <h3 className="text-lg font-semibold text-gray-200">
                  User Information
                </h3>
              </div>
              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"
                dir="rtl"
              >
                <div>
                  <label className="text-gray-400 block mb-1">
                    Personal Code
                  </label>
                  <input
                    type="text"
                    value={userInfo.personal_code}
                    onChange={(e) =>
                      setUserInfo((prev) => ({
                        ...prev,
                        personal_code: e.target.value,
                      }))
                    }
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-800 text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={userInfo.full_name}
                    onChange={(e) =>
                      setUserInfo((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-800 text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Company</label>
                  <input
                    type="text"
                    value={userInfo.company_name}
                    onChange={(e) =>
                      setUserInfo((prev) => ({
                        ...prev,
                        company_name: e.target.value,
                      }))
                    }
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-800 text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Role</label>
                  <input
                    type="text"
                    value={userInfo.role}
                    onChange={(e) =>
                      setUserInfo((prev) => ({ ...prev, role: e.target.value }))
                    }
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-800 text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">
                    Direct Management
                  </label>
                  <input
                    type="text"
                    value={userInfo.direct_management}
                    onChange={(e) =>
                      setUserInfo((prev) => ({
                        ...prev,
                        direct_management: e.target.value,
                      }))
                    }
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-800 text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Department</label>
                  <input
                    type="text"
                    value={userInfo.departman}
                    onChange={(e) =>
                      setUserInfo((prev) => ({
                        ...prev,
                        departman: e.target.value,
                      }))
                    }
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-800 text-gray-200"
                  />
                </div>
              </div>
              <div className="mt-4" dir="rtl">
                <label className="text-gray-400 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg bg-gray-800 text-gray-200"
                >
                  <option value="">Select a category</option>
                  <option value="All">All</option>
                  <option value="MainTasks">Main Tasks</option>
                </select>
              </div>
            </div>

            <div className="mt-2 overflow-auto border-t border-gray-600 pt-6 text-center">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-center">
                    <th className="px-2 py-2 text-gray-400">#</th>
                    <th className="px-2 py-2 text-gray-400">Object Weight</th>
                    <th className="px-2 py-2 text-gray-400">KPI English</th>
                    <th className="px-2 py-2 text-gray-400">KPI Farsi</th>
                    <th className="px-2 py-2 text-gray-400">KPI Info</th>
                    <th className="px-2 py-2 text-gray-400">Target</th>
                    <th className="px-2 py-2 text-gray-400">KPI Weight</th>
                    <th className="px-2 py-2 text-gray-400">KPI Achievement</th>
                    <th className="px-2 py-2 text-gray-400">
                      Percentage Achievement
                    </th>
                    <th className="px-2 py-2 text-gray-400">
                      Score Achievement
                    </th>
                    <th className="px-2 py-2 text-gray-400">Type</th>
                    <th className="px-2 py-2 text-gray-400">Sum</th>
                    <th className="px-2 py-2 text-gray-400">Actions</th>
                  </tr>
                  <tr className="text-center bg-gray-900">
                    <th className="px-2 py-1 text-gray-400"></th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.obj_weight}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              obj_weight: e.target.value,
                            }))
                          }
                          className="w-24 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.obj_weight.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              obj_weight: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.KPIEn}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              KPIEn: e.target.value,
                            }))
                          }
                          className="w-32 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.KPIEn.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              KPIEn: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.KPIFa}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              KPIFa: e.target.value,
                            }))
                          }
                          className="w-32 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.KPIFa.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              KPIFa: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.KPI_Info}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_Info: e.target.value,
                            }))
                          }
                          className="w-40 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.KPI_Info.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_Info: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.target}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              target: e.target.value,
                            }))
                          }
                          className="w-24 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.target.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              target: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.KPI_weight}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_weight: e.target.value,
                            }))
                          }
                          className="w-20 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.KPI_weight.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_weight: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.KPI_Achievement}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_Achievement: e.target.value,
                            }))
                          }
                          className="w-24 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.KPI_Achievement.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              KPI_Achievement: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Percentage_Achievement}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Percentage_Achievement: e.target.value,
                            }))
                          }
                          className="w-24 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.Percentage_Achievement.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Percentage_Achievement: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Score_Achievement}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Score_Achievement: e.target.value,
                            }))
                          }
                          className="w-24 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.Score_Achievement.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Score_Achievement: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Type}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Type: e.target.value,
                            }))
                          }
                          className="w-20 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.Type.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Type: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <select
                          value={filters.Sum}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              Sum: e.target.value,
                            }))
                          }
                          className="w-24 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-200 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueValues.Sum.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {String(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              Sum: "",
                            }))
                          }
                          className="text-gray-400 hover:text-gray-200 text-xl rounded-2xl text-center items-center cursor-pointer ml-2 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                    <th className="px-2 py-1 text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600 text-center">
                  {filteredTasks.length === 0 && (
                    <tr className="bg-gray-700">
                      <td className="px-3 py-4 text-gray-300" colSpan={13}>
                        No tasks yet. Use the button below to add a new row.
                      </td>
                    </tr>
                  )}
                  {filteredTasks
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((task, index) => (
                      <tr key={task.id} className="bg-gray-700 align-top">
                        <td className="px-2 py-2 text-gray-200">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(task.obj_weight)}
                            onChange={(e) =>
                              handleTaskChange(
                                task.id,
                                "obj_weight",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            disabled={locked}
                            placeholder="Object weight"
                            className="w-28 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={task.KPIEn}
                            onChange={(e) =>
                              handleTaskChange(task.id, "KPIEn", e.target.value)
                            }
                            disabled={locked}
                            placeholder="KPI English"
                            className="w-48 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={task.KPIFa}
                            dir="rtl"
                            onChange={(e) =>
                              handleTaskChange(task.id, "KPIFa", e.target.value)
                            }
                            disabled={locked}
                            placeholder="KPI Farsi"
                            className="w-48 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <textarea
                            value={task.KPI_Info}
                            dir="rtl"
                            onChange={(e) =>
                              handleTaskChange(
                                task.id,
                                "KPI_Info",
                                e.target.value
                              )
                            }
                            disabled={locked}
                            placeholder="KPI info"
                            rows={2}
                            className="w-56 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(task.target)}
                            onChange={(e) =>
                              handleTaskChange(
                                task.id,
                                "target",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            disabled={locked}
                            placeholder="Target"
                            className="w-28 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(task.KPI_weight)}
                            onChange={(e) =>
                              handleTaskChange(
                                task.id,
                                "KPI_weight",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            disabled={locked}
                            placeholder="KPI weight"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(task.KPI_Achievement)}
                            onChange={(e) =>
                              handleTaskChange(
                                task.id,
                                "KPI_Achievement",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            disabled={locked}
                            placeholder="KPI Achievement"
                            className="w-28 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={formatNumber(task.Percentage_Achievement)}
                            readOnly
                            disabled={locked}
                            placeholder="% Achievement"
                            className="w-28 px-2 py-1 border border-gray-300 rounded-lg bg-gray-900 text-gray-200"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatNumber(task.Score_Achievement)}
                            readOnly
                            disabled={locked}
                            placeholder="Score Achievement"
                            className="w-28 px-2 py-1 border border-gray-300 rounded-lg bg-gray-900 text-gray-200"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={task.Type}
                            onChange={(e) =>
                              handleTaskChange(task.id, "Type", e.target.value)
                            }
                            disabled={locked}
                            placeholder="Type"
                            className="w-24 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="any"
                            value={formatPercent(task.Sum)}
                            onChange={(e) =>
                              handleTaskChange(
                                task.id,
                                "Sum",
                                e.target.value === ""
                                  ? ""
                                  : parsePercent(e.target.value)
                              )
                            }
                            disabled={locked}
                            placeholder="Sum"
                            className="w-28 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-2">
                            {!locked && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTask(task.id)}
                                className="bg-red-600 cursor-pointer hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition duration-200"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-gray-200">
                  <strong>Total Score:</strong>{" "}
                  {(() => {
                    const total = filteredTasks.reduce(
                      (s, t) => s + (Number(t.Score_Achievement) || 0),
                      0
                    );
                    return Math.round((total + Number.EPSILON) * 100) / 100;
                  })()}
                  %
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="bg-gray-700 cursor-pointer hover:bg-gray-800 text-white px-3 py-1 rounded text-sm"
                  >
                    Clear Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-gray-600 cursor-pointer disabled:opacity-50 hover:bg-gray-700 text-white px-3 py-1 rounded"
                  >
                    Prev
                  </button>
                  {Array.from(
                    { length: Math.ceil(filteredTasks.length / pageSize) },
                    (_, i) => i + 1
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1 rounded ${
                        currentPage === p
                          ? "bg-blue-600 text-white"
                          : "bg-gray-600 text-white hover:bg-gray-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(
                          Math.ceil(filteredTasks.length / pageSize) || 1,
                          p + 1
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      (Math.ceil(filteredTasks.length / pageSize) || 1)
                    }
                    className="bg-gray-600 cursor-pointer disabled:opacity-50 hover:bg-gray-700 text-white px-3 py-1 rounded"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    disabled={locked}
                    className="bg-green-600 mb-10 cursor-pointer hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                  >
                    {locked ? "Locked" : `+ Add ${category || "Task"}`}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={locked}
              className="w-full bg-blue-600 mb-10 cursor-pointer hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              {locked ? "Form Submitted & Locked" : "Submit All Tasks"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default KpiWorkResponse;
