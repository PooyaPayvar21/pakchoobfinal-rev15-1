/* eslint-disable no-unused-vars */
// In api.js
import axios from "axios";

export const ACCESS_TOKEN = "token";

// Get the current hostname and protocol
const getBaseUrl = () => {
  // In development, prefer proxy path unless overridden by VITE_API_URL
  if (import.meta.env.DEV) {
    const devUrl = import.meta.env.VITE_API_URL || "/api/";
    return devUrl.endsWith("/") ? devUrl : `${devUrl}/`;
  }
  // In production, use the current hostname without port
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  // For cPanel Python apps, we don't need to specify the port
  return `${protocol}//${hostname}/api/`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

export { api };

// Function to get CSRF token from cookie
const getCsrfToken = () => {
  const name = "csrftoken";
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    // Ensure method is uppercase
    config.method = config.method.toUpperCase();

    // Add CSRF token to all requests
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }

    // Add auth token if it exists (skip for auth endpoints)
    const urlPath = (config.url || "").replace(/^\/+/, "");
    const isAuthEndpoint = urlPath === "login/" || urlPath === "register/";
    if (!isAuthEndpoint) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    }

    // Add user type and role to headers
    const userType = localStorage.getItem("user_type");
    const userRole = localStorage.getItem("user_role");
    const userPhase = localStorage.getItem("phase");
    const userSections = localStorage.getItem("sections");

    if (userType) {
      config.headers["X-User-Type"] = userType;
    }

    if (userRole) {
      config.headers["X-User-Role"] = userRole;
    }

    if (userPhase) {
      config.headers["X-User-Phase"] = userPhase === "phase1" ? "01" : "02";
    }

    if (userSections) {
      config.headers["X-User-Section"] = userSections;
    }

    // Log the request configuration for debugging
    console.log("Request config:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Check if the response is HTML instead of JSON
    if (response.headers["content-type"]?.includes("text/html")) {
      throw new Error("Received HTML instead of JSON response");
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Error Response:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url,
        method: error.config.method,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API Error Request:", {
        url: error.config.url,
        method: error.config.method,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Helper function to fetch notifications
export const fetchNotifications = async (personal_code = null) => {
  try {
    const url = personal_code
      ? `/notifications/?personal_code=${encodeURIComponent(personal_code)}`
      : "/notifications/";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// Auth endpoints
export const login = (username, password) =>
  api.post("login/", { username, password });

export const logout = () => api.post("/logout/");

export const getUserInfo = () => api.get("/user/info/");

export const register = (userData) => api.post("/register/", userData);

export const updateUserAdditionalRoles = (username, additionalRoles) =>
  api.post("/user/update-additional-roles/", {
    username,
    additional_roles: additionalRoles,
  });

export const changePassword = (old_password, new_password) =>
  api.post("/user/change-password/", { old_password, new_password });

// Form workflow endpoints
export const getForms = () => api.get("/submitform/list/");

// Separate functions for getting different form types
export const getSubmitForms = () => api.get("/submitform/list/");
export const getPmForms = () => api.get("/pmformssubmit/list/");

export const getFormsByRole = (role) => api.get(`/forms/role/${role}/`);

export const getFormByCode = (formcode) => api.get(`/submitform/${formcode}/`);

export const createForm = (formData) => api.post("/submitform/", formData);

export const createFormWater = (formData) =>
  api.post("/watertreatment/", formData);

export const updateForm = (formcode, formData) =>
  api.patch(`/submitform/${formcode}/`, formData);

export const updateFormType = (formcode, formtype) =>
  api.patch(`/forms/${formcode}/type/`, { formtype });

export const updateFormStatus = (formcode, status) =>
  api.post(`/forms/${formcode}/status/`, { action: status });

// Technician endpoints
export const submitTechnicianForm = (formData) =>
  api.post("/techniciansubmit/", formData);

export const getTechnicianForms = () => api.get("/techniciansubmit/list/");

export const createTechnicianForm = (data) =>
  api.post("/techniciansubmit/", data);

// Parts (Aghlam) endpoints
export const submitAghlam = (aghlamData) => api.post("/aghlam/", aghlamData);

export const getAghlams = () => api.get("/aghlam/list/");

export const createAghlam = (data) => api.post("/aghlam/", data);

// Personnel endpoints
export const submitPersonel = (personelData) =>
  api.post("/personel/", personelData);

export const getPersonels = () => api.get("/personel/list/");

export const createPersonel = (data) => api.post("/personel/", data);

// Form submission
export const submitForm = (formData) => api.post("/submitform/", formData);
export const SubmitPM = async (payload) => {
  // show resolved full URL
  const fullUrl = (api.defaults.baseURL || "") + "/submitpm/";
  console.log("SubmitPM -> POST", fullUrl, payload);
  try {
    const res = await api.post("/submitpm/", payload);
    console.log("SubmitPM response:", res.status, res.data);
    return res.data;
  } catch (err) {
    console.error("SubmitPM error:", {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    // rethrow so caller can handle toast/errors
    throw err;
  }
};

export const pmFormsubmit = (formData) => api.post("/pmformssubmit/", formData);
export const deletePmForm = (pmformcode) =>
  api.delete(`/pmformssubmit/${pmformcode}/delete/`);
export const pmAghlamsubmit = (formData) => api.post("/pmaghlam/", formData);
export const getPmAghlamsByFormCode = async (pmformcode) => {
  try {
    // First try the query parameter endpoint
    const response = await api.get(`/pmaghlam/?pmformcode=${pmformcode}`);
    return response;
  } catch (error) {
    // If that fails, try the detail endpoint
    return api.get(`/pmaghlam/${pmformcode}/`);
  }
};
export const pmPersonelsubmit = (formData) =>
  api.post("/pmpersonel/", formData);
export const getPmPersonelsByFormCode = async (pmformcode) => {
  try {
    // First try the query parameter endpoint
    const response = await api.get(`/pmpersonel/?pmformcode=${pmformcode}`);
    return response;
  } catch (error) {
    // If that fails, try the detail endpoint
    return api.get(`/pmpersonel/${pmformcode}/`);
  }
};
export const getPmTechniciansByFormCode = (pmformcode) =>
  api.get(`/pmtechniciansubmit/list/?pmformcode=${pmformcode}`);
export const pmTechnicianSubmit = (pmformcode, action = null) => {
  // Get user type from localStorage to determine the correct action
  const userType = localStorage.getItem("user_type");
  const userRole = localStorage.getItem("user_role");

  // If no action is provided, determine the appropriate action based on user type and role
  if (!action) {
    if (userType === "pm" && userRole === "technician") {
      action = "pm_technician_submit";
    } else if (userType === "mechanic" && userRole === "technician") {
      action = "worktype_technician_submit";
    } else {
      // Default fallback
      action = "pm_technician_submit";
    }
  }

  return api.post(`/pmformssubmit/${pmformcode}/status/`, { action });
};

export const getPmFormByCode = (pmformcode) =>
  api.get(`/pmformssubmit/${pmformcode}/`);

export const getSubmitFormList = () => api.get("/submitform/list/");
export const getSubmitFormByCode = (formcode) =>
  api.get(`/submitform/${formcode}/`);
export const getSubmitFormDetail = (pk) => api.get(`/submitform/detail/${pk}/`);
export const deleteSubmitForm = (pk) => api.delete(`/submitform/delete/${pk}/`);
export const sendFormData = (data) => api.post("/forms/send", data);
export const deleteForm = (pk) => api.delete(`/submitform/delete/${pk}/`);
export const getUnreadFormsCount = () => api.get("/forms/unread/");
export const sendReminders = (data) => api.post("/send-reminders/", data);

// Notifications
export const sendNotification = ({ personal_code, title, message, type }) =>
  api.post("/notifications/send/", { personal_code, title, message, type });
