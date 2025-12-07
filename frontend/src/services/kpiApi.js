import axios from "axios";

const env = typeof import.meta !== "undefined" ? import.meta.env || {} : {};
const API_BASE_URL = env.VITE_API_URL || env.REACT_APP_API_URL || "/api";

// Create axios instance with default headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// KPI API Service
export const kpiApi = {
  /**
   * Get list of all facilities
   */
  fetchFacilities: async () => {
    try {
      const response = await apiClient.get("/kpi/facilities/");
      return response.data.facilities;
    } catch (error) {
      console.error("Error fetching facilities:", error);
      throw error;
    }
  },

  /**
   * Get list of all sections
   */
  fetchSections: async () => {
    try {
      const response = await apiClient.get("/kpi/sections/");
      return response.data.sections;
    } catch (error) {
      console.error("Error fetching sections:", error);
      throw error;
    }
  },

  /**
   * Get list of all roles
   */
  fetchRoles: async () => {
    try {
      const response = await apiClient.get("/kpi/roles/");
      return response.data.roles;
    } catch (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }
  },

  /**
   * Get list of people for a specific role
   * @param {string} role - The role to filter by (e.g., "مدیر", "رئیس", "کارشناس")
   */
  fetchPeopleByRole: async (role) => {
    try {
      const response = await apiClient.get("/kpi/people/", {
        params: { role },
      });
      return response.data.people;
    } catch (error) {
      console.error("Error fetching people by role:", error);
      throw error;
    }
  },

  /**
   * Get KPI personnel filtered by departman
   * @param {string} departman - Department name (e.g., "امورمالی")
   */
  fetchPersonelByDepartman: async (departman) => {
    try {
      const response = await apiClient.get("/kpi/personel/", {
        params: { departman },
      });
      return response.data.people;
    } catch (error) {
      console.error("Error fetching KPI personnel by departman:", error);
      throw error;
    }
  },

  /**
   * Submit a KPI work entry
   * @param {object} workData - Work entry data
   * {
   *   facility: string,
   *   section: string,
   *   role: string,
   *   person_id: number,
   *   task_name: string,
   *   description: string,
   *   status: string ('Done', 'Working', 'Not Done'),
   *   percentage: number (0-100),
   *   due_date: string (YYYY-MM-DD),
   *   notes: string
   * }
   */
  submitWork: async (workData) => {
    try {
      console.log(`[KPI] submitWork called with:`, workData);
      const response = await apiClient.post("/kpi/work/", workData);
      console.log(`[KPI] submitWork response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[KPI] Error submitting work:`, error);
      console.error(`[KPI] Error response:`, error.response?.data);
      throw error;
    }
  },

  /**
   * Get work history for a specific person
   * @param {number} personId - Person ID to fetch history for
   */
  getPersonWorkHistory: async (personId) => {
    try {
      const response = await apiClient.get(`/kpi/work/${personId}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching work history:", error);
      throw error;
    }
  },

  /**
   * Get KPI metrics for specified filters
   * @param {object} filters - Filter options
   * { facility?: string, section?: string }
   */
  getKPIMetrics: async (filters = {}) => {
    try {
      const params = {};
      if (filters.facility) params.facility = filters.facility;
      if (filters.section) params.section = filters.section;

      const response = await apiClient.get("/kpi/metrics/", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching KPI metrics:", error);
      throw error;
    }
  },

  /**
   * Get assigned KPI works for a person
   * @param {number} personId - Person ID
   */
  getAssignedWorks: async (personId) => {
    try {
      console.log(`[KPI] Fetching assigned works for person_id=${personId}`);
      const response = await apiClient.get("/kpi/assigned/", {
        params: { person_id: personId },
      });
      console.log(`[KPI] Full response for assigned works:`, response.data);
      let works = response.data.works || [];
      console.log(`[KPI] Extracted ${works.length} works:`, works);

      // Ensure `percentage` is always a number (0-100) so the UI can render it
      works = works.map((work) => {
        const raw = work.percentage;
        // Accept strings or numbers, coerce to integer, clamp between 0 and 100
        let pct = 0;
        let parsedValue = undefined;
        let missing = false;
        if (raw === null || raw === undefined || raw === "") {
          missing = true;
        } else {
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) parsedValue = Math.round(parsed);
        }

        if (parsedValue !== undefined) pct = parsedValue;
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;

        const normalized = {
          ...work,
          percentage: pct,
          // Debug flags for UI to display badges when helpful
          _debug_missing_percentage: missing,
          _debug_normalized_percentage: parsedValue,
        };
        console.log(
          `[KPI] Work ${work.id}: ${work.task_name} - normalized percentage=${
            normalized.percentage
          } (original: ${raw}, type: ${typeof raw}, parsed: ${parsedValue}, missing: ${missing})`
        );
        return normalized;
      });

      return works;
    } catch (error) {
      console.error(
        `[KPI] Error fetching assigned works for person_id=${personId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Submit a response to a KPI work
   * @param {object} responseData - Response data
   * {
   *   kpi_work_id: number,
   *   respondent_id: number,
   *   response_text: string,
   *   completion_notes: string,
   *   attachments: array,
   *   status: string
   * }
   */
  submitWorkResponse: async (responseData) => {
    try {
      const response = await apiClient.post("/kpi/response/", responseData);
      return response.data;
    } catch (error) {
      console.error("Error submitting work response:", error);
      throw error;
    }
  },

  /**
   * Submit a minimal KPIEntry (company_name, personal_code, full_name, role, direct_management, departman)
   */
  submitKPIEntry: async (entryData) => {
    try {
      const response = await apiClient.post("/kpientry/create/", entryData);
      return response.data;
    } catch (error) {
      console.error("Error submitting KPIEntry:", error);
      throw error;
    }
  },

  /**
   * Get all responses for a KPI work
   * @param {number} kpiWorkId - KPI Work ID
   */
  getWorkResponses: async (kpiWorkId) => {
    try {
      const response = await apiClient.get(`/kpi/response/${kpiWorkId}/`);
      return response.data.responses;
    } catch (error) {
      console.error("Error fetching work responses:", error);
      throw error;
    }
  },

  /**
   * Update the status of a KPI work
   * @param {number} kpiWorkId - KPI Work ID
   * @param {string} status - New status value (e.g., "Done", "Working", "Not Done")
   */
  updateWorkStatus: async (kpiWorkId, status) => {
    try {
      console.log(`[KPI] Updating work ${kpiWorkId} status to: ${status}`);
      const response = await apiClient.put(`/kpi/work/${kpiWorkId}/status/`, {
        status: status,
      });
      console.log(`[KPI] Work status updated:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[KPI] Error updating work status:`, error);
      throw error;
    }
  },
  fetchKPIEntryOptions: async () => {
    try {
      const response = await apiClient.get("/kpientry/options/");
      return response.data;
    } catch (error) {
      console.error("Error fetching KPIEntry options:", error);
      throw error;
    }
  },
  updateKPIEntryManagement: async (payload) => {
    try {
      const response = await apiClient.post(
        "/kpientry/update-management/",
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error updating KPIEntry management:", error);
      throw error;
    }
  },
  fetchSubordinateEntries: async ({
    manager,
    personal_code,
    category,
    departman,
    not_managed,
    outside_department,
  }) => {
    try {
      const mgr = String(manager || "").trim();
      const code = String(personal_code || "").trim();
      const cat = category != null ? String(category) : undefined;
      const dept = String(departman || "").trim();
      const nm = Boolean(not_managed) && dept !== "";
      const od = Boolean(outside_department) && dept !== "";

      if (
        !mgr &&
        !code &&
        (Boolean(not_managed) || Boolean(outside_department))
      ) {
        return {
          status: "no_results",
          count: 0,
          tasks: [],
          debug: { client_sanitized: true },
        };
      }

      const params = {};
      if (mgr) params.manager = mgr;
      if (code) params.personal_code = code;
      if (cat !== undefined) params.category = cat;
      if (dept) params.departman = dept;
      params.not_managed = nm ? "true" : "false";
      params.outside_department = od ? "true" : "false";

      const response = await apiClient.get("/kpientry/subordinates/", {
        params,
      });
      // Return the full response object so frontend can access debug info
      return response.data;
    } catch (error) {
      console.error("Error fetching subordinate entries:", error);
      throw error;
    }
  },
  updateKPIEntryRow: async (row, data) => {
    try {
      const response = await apiClient.put(`/kpientry/row/${row}/`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating KPIEntry row:", error);
      throw error;
    }
  },
  deleteKPIEntryRow: async (row) => {
    try {
      const response = await apiClient.delete(`/kpientry/row/${row}/delete/`);
      return response.data;
    } catch (error) {
      console.error("Error deleting KPIEntry row:", error);
      throw error;
    }
  },
  confirmKPIEntryRow: async (row) => {
    try {
      const response = await apiClient.post(`/kpientry/row/${row}/confirm/`);
      return response.data;
    } catch (error) {
      console.error("Error confirming KPIEntry row:", error);
      throw error;
    }
  },
  grantEditPermission: async ({
    personal_code,
    category,
    manager_departman,
  }) => {
    try {
      const response = await apiClient.post("/kpientry/grant-edit/", {
        personal_code,
        category,
        manager_departman,
      });
      return response.data;
    } catch (error) {
      console.error("Error granting edit permission:", error);
      throw error;
    }
  },
  revokeEditPermission: async ({
    personal_code,
    category,
    manager_departman,
  }) => {
    try {
      const response = await apiClient.post("/kpientry/revoke-edit/", {
        personal_code,
        category,
        manager_departman,
      });
      return response.data;
    } catch (error) {
      console.error("Error revoking edit permission:", error);
      throw error;
    }
  },
};

export default kpiApi;
