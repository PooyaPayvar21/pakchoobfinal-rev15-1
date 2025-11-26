import { getSubmitFormList } from "../api";

/**
 * Determines the form type from a form object
 * @param {Object} form - The form object
 * @returns {string|null} The form type (PM, EM, CM, GM) or null if not found
 */
export const getFormType = (form) => {
  if (!form) return null;

  // Try to get form type from various fields
  const formTypeValue = (form.formtype || "").toLowerCase();
  const workTypeValue = (form.worktype || "").toLowerCase();
  const description = (form.description || "").toLowerCase();
  const title = (form.title || "").toLowerCase();

  // Debug logging for all forms
  console.log("Checking form type:", {
    id: form.id,
    formcode: form.formcode,
    formtype: form.formtype,
    worktype: form.worktype,
    description: form.description,
    title: form.title,
  });

  // First check formtype field directly
  if (formTypeValue) {
    if (formTypeValue === "pm" || formTypeValue.includes("preventive")) {
      console.log("Found PM form by formtype");
      return "pm";
    }
    if (formTypeValue === "em" || formTypeValue.includes("emergency")) {
      console.log("Found EM form by formtype");
      return "em";
    }
    if (formTypeValue === "cm" || formTypeValue.includes("corrective")) {
      console.log("Found CM form by formtype");
      return "cm";
    }
    if (formTypeValue === "gm" || formTypeValue.includes("general")) {
      console.log("Found GM form by formtype");
      return "gm";
    }
  }

  // If no formtype, try to categorize based on worktype and other fields
  if (workTypeValue) {
    // Check for emergency-related text in any field
    if (
      workTypeValue === "em" ||
      workTypeValue.includes("emergency") ||
      description.includes("emergency") ||
      title.includes("emergency")
    ) {
      console.log("Found EM form by worktype/description/title");
      return "em";
    }
    // Check for corrective-related text in any field
    if (
      workTypeValue === "cm" ||
      workTypeValue.includes("corrective") ||
      description.includes("corrective") ||
      title.includes("corrective")
    ) {
      console.log("Found CM form by worktype/description/title");
      return "cm";
    }
    // Check for preventive-related text in any field
    if (
      workTypeValue === "pm" ||
      workTypeValue.includes("preventive") ||
      description.includes("preventive") ||
      title.includes("preventive")
    ) {
      console.log("Found PM form by worktype/description/title");
      return "pm";
    }
    // Check for general-related text in any field
    if (
      workTypeValue === "gm" ||
      workTypeValue.includes("general") ||
      description.includes("general") ||
      title.includes("general")
    ) {
      console.log("Found GM form by worktype/description/title");
      return "gm";
    }
  }

  // If no match found, try to infer from department worktypes
  if (
    workTypeValue === "mechanic" ||
    workTypeValue === "electric" ||
    workTypeValue === "utility" ||
    workTypeValue === "metalworking" ||
    workTypeValue === "tarashkari"
  ) {
    // For department worktypes, check if there's any emergency-related text in other fields
    if (description.includes("emergency") || title.includes("emergency")) {
      console.log("Found EM form in department worktype");
      return "em";
    }
    if (description.includes("corrective") || title.includes("corrective")) {
      console.log("Found CM form in department worktype");
      return "cm";
    }
    if (description.includes("preventive") || title.includes("preventive")) {
      console.log("Found PM form in department worktype");
      return "pm";
    }
    if (description.includes("general") || title.includes("general")) {
      console.log("Found GM form in department worktype");
      return "gm";
    }
  }

  // If still no match, try to infer from formcode
  if (form.formcode) {
    const formCode = form.formcode.toLowerCase();
    if (formCode.includes("em") || formCode.includes("emergency")) {
      console.log("Found EM form by formcode");
      return "em";
    }
    if (formCode.includes("pm") || formCode.includes("preventive")) {
      console.log("Found PM form by formcode");
      return "pm";
    }
    if (formCode.includes("cm") || formCode.includes("corrective")) {
      console.log("Found CM form by formcode");
      return "cm";
    }
    if (formCode.includes("gm") || formCode.includes("general")) {
      console.log("Found GM form by formcode");
      return "gm";
    }
  }

  // If we still can't determine the type, return null
  console.log("No form type found for form:", form.id);
  return null;
};

/**
 * Fetches form data and counts by type (PM, EM, CM, GM)
 * @param {string} [userSections] - Comma-separated list of user's sections
 * @returns {Promise<Object>} The form counts and processed chart data
 */
export const fetchFormTypeCounts = async (userSections) => {
  try {
    // Get sections from parameters or localStorage
    const sections = userSections || localStorage.getItem("sections");

    if (!sections) {
      console.error("Missing user sections");
      return {
        counts: { PM: 0, EM: 0, CM: 0, GM: 0 },
        chartData: [],
        rawForms: [],
      };
    }

    // Format headers
    const headers = {
      "X-User-Section": sections,
      Authorization: `Token ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    };

    const response = await getSubmitFormList(headers);
    const forms = Array.isArray(response.data) ? response.data : [];

    console.log(`Fetched ${forms.length} forms from API`);

    // Log the first few forms to debug
    if (forms.length > 0) {
      console.log("Sample form data:", forms.slice(0, 3));
    }

    // Count forms by type
    const counts = {
      PM: 0, // Preventive Maintenance
      EM: 0, // Emergency Maintenance
      CM: 0, // Corrective Maintenance
      GM: 0, // General Maintenance
    };

    const uncategorized = [];

    forms.forEach((form) => {
      // Try to get form type from various fields
      const formTypeValue = (form.formtype || "").toLowerCase();
      const workTypeValue = (form.worktype || "").toLowerCase();

      // Debug specific form type
      if (formTypeValue === "em" || workTypeValue === "em") {
        console.log("Found EM form:", {
          id: form.id,
          formcode: form.formcode,
          formtype: form.formtype,
          worktype: form.worktype,
        });
      }

      // Map worktype to form categories if formtype is not set
      let categoryType = "";

      // First check formtype field directly
      if (formTypeValue) {
        categoryType = formTypeValue;
      }
      // If no formtype, try to categorize based on worktype
      else if (workTypeValue) {
        // This is where we might need to add custom logic to map worktypes to form categories
        if (workTypeValue.includes("emergency")) {
          categoryType = "em";
        } else if (workTypeValue.includes("corrective")) {
          categoryType = "cm";
        } else if (workTypeValue.includes("preventive")) {
          categoryType = "pm";
        } else if (workTypeValue.includes("general")) {
          categoryType = "gm";
        } else if (
          workTypeValue === "mechanic" ||
          workTypeValue === "electric" ||
          workTypeValue === "utility" ||
          workTypeValue === "metalworking" ||
          workTypeValue === "tarashkari"
        ) {
          // Don't default department worktypes to any category
          categoryType = "";
        } else {
          categoryType = ""; // Don't default to any category
        }
      }

      // Count by category (case insensitive)
      if (
        categoryType === "pm" ||
        categoryType.includes("pm") ||
        categoryType.includes("preventive")
      ) {
        counts.PM += 1;
      } else if (
        categoryType === "em" ||
        categoryType.includes("em") ||
        categoryType.includes("emergency")
      ) {
        counts.EM += 1;
      } else if (
        categoryType === "cm" ||
        categoryType.includes("cm") ||
        categoryType.includes("corrective")
      ) {
        counts.CM += 1;
      } else if (
        categoryType === "gm" ||
        categoryType.includes("gm") ||
        categoryType.includes("general")
      ) {
        counts.GM += 1;
      } else {
        // Keep track of forms we couldn't categorize
        uncategorized.push({
          id: form.id,
          formcode: form.formcode,
          formtype: form.formtype,
          worktype: form.worktype,
        });
      }
    });

    console.log("Form counts by type:", counts);

    if (uncategorized.length > 0) {
      console.log(
        `Found ${uncategorized.length} uncategorized forms:`,
        uncategorized
      );
    }

    // Convert counts to chart data format
    const chartData = [
      { name: "PM", value: counts.PM },
      { name: "EM", value: counts.EM },
      { name: "CM", value: counts.CM },
      { name: "GM", value: counts.GM },
    ];

    return {
      counts,
      chartData,
      rawForms: forms,
    };
  } catch (error) {
    console.error("Error fetching form counts:", error);
    // Return empty counts instead of throwing error
    return {
      counts: { PM: 0, EM: 0, CM: 0, GM: 0 },
      chartData: [],
      rawForms: [],
    };
  }
};
