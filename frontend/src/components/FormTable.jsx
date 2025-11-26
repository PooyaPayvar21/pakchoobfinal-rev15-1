/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { motion } from "framer-motion";
import { api, getUserInfo } from "../api";
import "../styles/SubmitForm.css";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Dialog, DialogTitle, DialogContent, Tooltip } from "@mui/material";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import moment from "moment-jalaali";
import "moment/locale/fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { CheckCircle2 } from "lucide-react";

export default function FormTable({ forms, setForms }) {
  const { formcode } = useParams();
  const [noteValue, setNoteValue] = useState("");
  const [notePmValue, setNotePmValue] = useState("");
  const [formNotes, setFormNotes] = useState([]);
  const [formPmNotes, setFormPmNotes] = useState([]);
  const [pmNoteValue, setPmNoteValue] = useState("");
  const [userType, setUserType] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredForms, setFilteredForms] = useState([]);
  const [filteredPmForms, setFilteredPmForms] = useState([]);
  const [activeTab, setActiveTab] = useState("regular"); // Add state for active tab
  const [activeFormType, setActiveFormType] = useState("EM"); // Add state for form type selection
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [pmPaginationModel, setPmPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  });

  // State for form type selection modal
  const [isFormTypeModalOpen, setIsFormTypeModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedPmForm, setSelectedPmForm] = useState(null);
  const [selectedFormType, setSelectedFormType] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPmDialogOpen, setIsPmDialogOpen] = useState(false);
  const [aghlams, setAghlams] = useState([]);
  const [technicianForms, setTechnicianForms] = useState([]);
  const [personel, setPersonel] = useState([]);
  const [userInfo, setUserInfo] = useState({
    user_type: "guest",
    role: "guest",
  });
  const [editingEndTimes, setEditingEndTimes] = useState({});
  const [editingEndTime, setEditingEndTime] = useState(null);
  const [editingFormCode, setEditingFormCode] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [editingTechnicianData, setEditingTechnicianData] = useState(null);
  const [editingPersonnelData, setEditingPersonnelData] = useState(null);

  // Form type reference options
  const formTypeOptions = [
    { value: "pm", label: "PM - تعمیرات پیشگیرانه" },
    { value: "em", label: "EM - تعمیرات اضطراری" },
    { value: "cm", label: "CM - تعمیرات اصلاحی" },
    { value: "gm", label: "GM - تعمیرات عمومی" },
  ];

  // Add state to track selected form types
  const [selectedFormTypes, setSelectedFormTypes] = useState({});

  // Filter forms based on user role and sections
  useEffect(() => {
    const filterForms = () => {
      if (!forms || forms.length === 0) {
        console.log("No forms available to filter");
        return { regularForms: [], pmForms: [] };
      }

      // Get user type and role from localStorage
      const userType = localStorage.getItem("user_type");
      const userRole = localStorage.getItem("user_role");
      const userSections = localStorage.getItem("sections")?.split(",") || [];

      console.log("Filtering forms in FormTable:", {
        totalForms: forms.length,
        userType,
        userRole,
        userSections,
      });

      // Add form_type to each form to distinguish between SubmitForm and PmForms
      const formsWithType = forms.map((form) => {
        // Check if it's a PM form by looking for PM-specific fields
        const isPmForm = form.pmsubject || form.pmsection || form.pmformdate;
        if (isPmForm) {
          console.log("Found PM form:", form);
          // Map PM form fields to match regular form fields for consistent display
          return {
            ...form,
            form_type: "pm_form",
            // Map PM form fields to regular form fields for consistent display
            pmformdate: form.pmformdate,
            pmphase: form.pmphase,
            pmmachinename: form.pmmachinename,
            pmsection: form.pmsection,
            pmworktype: form.pmworktype,
            pmstatus: form.pmstatus || "pending_technician",
          };
        }
        // Otherwise it's a regular SubmitForm
        return { ...form, form_type: "submit_form" };
      });

      // Separate PM forms and regular forms
      const pmForms = formsWithType.filter(
        (form) => form.form_type === "pm_form"
      );
      const regularForms = formsWithType.filter(
        (form) => form.form_type === "submit_form"
      );

      console.log("Separated forms:", {
        totalForms: formsWithType.length,
        pmFormsCount: pmForms.length,
        regularFormsCount: regularForms.length,
        pmForms: pmForms,
        regularForms: regularForms,
      });

      // For PM Management, show all forms
      if (userType === "pm" && userRole === "management") {
        console.log("PM Management - showing all forms");
        return { regularForms, pmForms };
      }

      // For PM Technician, only show forms in their assigned sections
      if (userType === "pm" && userRole !== "management") {
        console.log("PM Technician - filtering by assigned sections");
        const filteredRegularForms = regularForms.filter(
          (form) =>
            userSections.includes("all") ||
            userSections.some(
              (section) =>
                form.section?.toLowerCase().trim() ===
                section.toLowerCase().trim()
            )
        );
        const filteredPmForms = pmForms.filter(
          (form) =>
            userSections.includes("all") ||
            userSections.some(
              (section) =>
                form.pmsection?.toLowerCase().trim() ===
                section.toLowerCase().trim()
            )
        );
        console.log("Filtered PM Technician forms:", {
          filteredRegularFormsCount: filteredRegularForms.length,
          filteredPmFormsCount: filteredPmForms.length,
        });
        return { regularForms: filteredRegularForms, pmForms: filteredPmForms };
      }

      // For other users, forms are already filtered in Forms.jsx
      return { regularForms, pmForms };
    };

    const { regularForms, pmForms } = filterForms();
    console.log("Setting filtered forms:", {
      regularFormsCount: regularForms.length,
      pmFormsCount: pmForms.length,
    });
    setFilteredForms(regularForms);
    setFilteredPmForms(pmForms);
  }, [forms]);

  // Handle FormNote Submit
  const handleFormNoteSubmit = async (e) => {
    e.preventDefault();

    if (!selectedForm) {
      toast.error("هیچ فرمی انتخاب نشده است");
      return;
    }

    if (!noteValue.trim()) {
      toast.error("لطفا توضیحات را وارد کنید");
      return;
    }

    try {
      const response = await api.put("/submitform/", {
        formcode: selectedForm.formcode,
        note: noteValue,
      });

      if (response.data.status === "success") {
        toast.success("توضیحات با موفقیت ثبت شد");

        // Update forms in local state with the returned note
        setForms((prevForms) =>
          prevForms.map((form) =>
            form.formcode === selectedForm.formcode
              ? { ...form, formnote: response.data.form.formnote }
              : form
          )
        );

        // Clear input and update form notes
        setNoteValue("");
        setFormNotes([{ formnote: response.data.form.formnote }]);

        // Disable all input fields in the dialog after successful submission
        const dialogInputs = document.querySelectorAll(
          ".MuiDialogContent-root input, .MuiDialogContent-root textarea"
        );
        dialogInputs.forEach((input) => {
          input.disabled = true;
        });

        // Keep the dialog open to show the submitted note
      } else {
        toast.error("خطا در ثبت توضیحات");
      }
    } catch (error) {
      console.error("خطا در ثبت فرم ", error);
      toast.error("خطا در ثبت توضیحات");
    }
  };

  // Handle PM Form Note Submit
  // Handle FormNote Submit
  const handlePmFormNoteSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPmForm) {
      toast.error("هیچ فرمی انتخاب نشده است");
      return;
    }

    if (!notePmValue.trim()) {
      toast.error("لطفا توضیحات را وارد کنید");
      return;
    }

    try {
      const response = await api.put("/pmformssubmit/", {
        pmformcode: selectedPmForm.pmformcode,
        pmnote: notePmValue,
      });

      if (response.data.status === "success") {
        toast.success("توضیحات با موفقیت ثبت شد");

        // Update forms in local state with the returned note
        setForms((prevForms) =>
          prevForms.map((form) =>
            form.pmformcode === selectedPmForm.pmformcode
              ? { ...form, pmformnote: response.data.form.pmformnote }
              : form
          )
        );

        // Clear input and update form notes
        setNoteValue("");
        setFormNotes([{ pmformnote: response.data.form.pmformnote }]);

        // Disable all input fields in the dialog after successful submission
        const dialogInputs = document.querySelectorAll(
          ".MuiDialogContent-root input, .MuiDialogContent-root textarea"
        );
        dialogInputs.forEach((input) => {
          input.disabled = true;
        });

        // Keep the dialog open to show the submitted note
      } else {
        toast.error("خطا در ثبت توضیحات");
      }
    } catch (error) {
      console.error("خطا در ثبت فرم ", error);
      toast.error("خطا در ثبت توضیحات");
    }
  };

  const openNoteDialog = (form) => {
    setSelectedForm(form);
    const existingNote = form.formnote || "";
    setNoteValue(""); // Always start with empty input
    setFormNotes(existingNote ? [{ formnote: existingNote }] : []);
    setIsDialogOpen(true);

    // If there's an existing note, disable the input field
    if (existingNote) {
      setTimeout(() => {
        const dialogInputs = document.querySelectorAll(
          ".MuiDialogContent-root input, .MuiDialogContent-root textarea"
        );
        dialogInputs.forEach((input) => {
          input.disabled = true;
        });
      }, 100);
    }
  };
  const openPmNoteDialog = (form) => {
    setSelectedPmForm(form);
    const existingPmNote = form.pmformnote || "";
    setNotePmValue(""); // Always start with empty input
    setFormPmNotes(existingPmNote ? [{ pmformnote: existingPmNote }] : []);
    setIsPmDialogOpen(true);

    // If there's an existing note, disable the input field
    if (existingPmNote) {
      setTimeout(() => {
        const dialogInputs = document.querySelectorAll(
          ".MuiDialogContent-root input, .MuiDialogContent-root textarea"
        );
        dialogInputs.forEach((input) => {
          input.disabled = true;
        });
      }, 100);
    }
  };

  // Fetch user info and forms on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await getUserInfo();
        setUserInfo(response.data);
      } catch (error) {
        console.error("Error fetching user info:", error);
        // Fallback to localStorage
        const storedUserType = localStorage.getItem("user_type");
        const storedRole = localStorage.getItem("user_role");
        console.log("API error, using localStorage:", {
          storedUserType,
          storedRole,
        });
        setUserInfo({
          user_type: storedUserType || "guest",
          role: storedRole || "guest",
        });
      }
    };

    const fetchData = async () => {
      try {
        // Fetch Aghlam data
        const aghlamResponse = await api.get("/aghlam/list/");
        setAghlams(aghlamResponse.data);

        // Fetch TechnicianSubmit data
        const technicianResponse = await api.get("/techniciansubmit/list/");
        setTechnicianForms(technicianResponse.data);

        const personelResponse = await api.get("/personel/list/");
        setPersonel(personelResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchUserInfo();
    fetchData();
  }, []);

  const handleFormDiscard = async (formcode) => {
    // Confirm before discarding
    if (
      !window.confirm(
        "آیا از لغو فرم این فرم اطمینان دارید؟ این عمل باعث می‌شود فرم به مرحله قبل بازگردد و آماده ویرایش شود."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting PM form discard:", {
        formcode,
        currentUserType: localStorage.getItem("user_type"),
        currentUserRole: localStorage.getItem("user_role"),
      });

      const response = await api.post(`/submitform/${formcode}/discard/`, {});

      console.log("Discard response:", {
        data: response.data,
        formStatus: response.data.form?.status,
        status: response.data.status,
        message: response.data.message,
      });

      // Update the form in the local state
      setForms((prevForms) => {
        const updatedForms = prevForms.map((form) => {
          if (form.formcode === formcode) {
            const previousStatus = response.data.form?.status || "pending";

            console.log("Updating PM form status after discard:", {
              formcode,
              oldStatus: form.status,
              newStatus: previousStatus,
            });

            return {
              ...form,
              formstatus: previousStatus,
              status: previousStatus, // Update both for consistency
            };
          }
          return form;
        });
        return updatedForms;
      });

      // Show success message
      toast.success("فرم با موفقیت به مرحله قبل بازگشت و آماده ویرایش است");
    } catch (error) {
      console.error("Error discarding PM form status:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError("Failed to discard PM form. Please try again.");
      toast.error("خطا در بازگشت فرم به مرحله قبل");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePmFormDiscard = async (pmformcode) => {
    // Confirm before discarding
    if (
      !window.confirm(
        "آیا از لغو فرم این فرم اطمینان دارید؟ این عمل باعث می‌شود فرم به مرحله قبل بازگردد و آماده ویرایش شود."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting PM form discard:", {
        pmformcode,
        currentUserType: localStorage.getItem("user_type"),
        currentUserRole: localStorage.getItem("user_role"),
      });

      const response = await api.post(
        `/pmformssubmit/${pmformcode}/discard/`,
        {}
      );

      console.log("Discard response:", {
        data: response.data,
        formStatus: response.data.form?.pmstatus,
        status: response.data.status,
        message: response.data.message,
      });

      // Update the form in the local state
      setForms((prevForms) => {
        const updatedForms = prevForms.map((form) => {
          if (form.pmformcode === pmformcode) {
            const previousStatus = response.data.form?.pmstatus || "pending";

            console.log("Updating PM form status after discard:", {
              pmformcode,
              oldStatus: form.pmstatus,
              newStatus: previousStatus,
            });

            return {
              ...form,
              pmstatus: previousStatus,
              status: previousStatus, // Update both for consistency
            };
          }
          return form;
        });
        return updatedForms;
      });

      // Show success message
      toast.success("فرم با موفقیت به مرحله قبل بازگشت و آماده ویرایش است");
    } catch (error) {
      console.error("Error discarding PM form status:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError("Failed to discard PM form. Please try again.");
      toast.error("خطا در بازگشت فرم به مرحله قبل");
    } finally {
      setIsLoading(false);
    }
  };

  const getNewStatusFromAction = (action, oldStatus) => {
    // All transitions based on your latest workflow
    if (action === "technician_submit" && oldStatus === "pending_technician")
      return "technician_submitted";
    if (action === "production_start" && oldStatus === "technician_submitted")
      return "pending_production";
    if (action === "production_confirm" && oldStatus === "pending_production")
      return "production_confirmed";
    if (action === "management_approve" && oldStatus === "production_confirmed")
      return "management_approved";
    if (
      action === "production_management_confirm" &&
      oldStatus === "management_approved"
    )
      return "production_management_confirm";
    if (
      action === "pm_pending" &&
      oldStatus === "production_management_confirm"
    )
      return "pending_pm";
    if (action === "pm_complete" && oldStatus === "pending_pm")
      return "completed";
    if (action === "pm_reject" && oldStatus === "pending_pm") return "rejected";
    return null;
  };

  // Handle form status updates
  const handleSubmitFormStatusUpdate = async (formcode, action) => {
    setIsLoading(true);
    try {
      const response = await api.post(`/forms/${formcode}/status/`, { action });
      setForms((prevForms) =>
        prevForms.map((form) => {
          if (form.formcode === formcode) {
            const newStatus =
              getNewStatusFromAction(action, form.status) ||
              response.data.form?.status ||
              response.data.status ||
              "completed";
            return { ...form, status: newStatus };
          }
          return form;
        })
      );
      toast.success("وضعیت فرم با موفقیت به‌روزرسانی شد");
    } catch (error) {
      setError("Failed to update form status. Please try again.");
      toast.error("خطا در به‌روزرسانی وضعیت فرم");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePmFormStatusUpdate = async (pmformcode, action) => {
    setIsLoading(true);
    try {
      console.log("Starting PM form status update:", {
        pmformcode,
        action,
        currentUserType: localStorage.getItem("user_type"),
        currentUserRole: localStorage.getItem("user_role"),
      });

      // Log the exact request being made
      console.log(`Making request to: /pmformssubmit/${pmformcode}/status/`);
      console.log("Request payload:", { action });

      const response = await api.post(`/pmformssubmit/${pmformcode}/status/`, {
        action: action,
      });

      console.log("Status update response:", {
        data: response.data,
        formStatus: response.data.form?.pmstatus,
        status: response.data.status,
        message: response.data.message,
      });

      // Update the form in the local state
      setForms((prevForms) => {
        const updatedForms = prevForms.map((form) => {
          if (form.pmformcode === pmformcode) {
            let newStatus;

            // Map actions to their corresponding statuses for PM forms
            switch (action) {
              case "pm_technician_submit":
                newStatus = "pending_pm_management";
                break;
              case "pm_management_first_approve":
                newStatus = "pending_worktype_technician";
                break;
              case "worktype_technician_submitted":
                newStatus = "pending_production_operator";
                break;
              case "production_operator_confirmed":
                newStatus = "pending_worktype_management";
                break;
              case "worktype_management_approve":
                newStatus = "worktype_management_approved";
                break;
              case "production_management_confirm":
                newStatus = "production_management_confirmed";
                break;
              case "pm_technician_final_submit":
                newStatus = "pending_final_pm_management";
                break;
              case "pm_management_final_approve":
                newStatus = "completed";
                break;
              default:
                newStatus =
                  response.data.form?.pmstatus ||
                  response.data.status ||
                  "completed";
            }
            console.log("Updating PM form status:", {
              pmformcode,
              oldStatus: form.pmstatus,
              newStatus,
              action,
              responseData: response.data,
            });

            return {
              ...form,
              pmstatus: newStatus,
              status: newStatus, // Update both for consistency
            };
          }
          return form;
        });
        console.log("Updated forms state:", updatedForms);
        return updatedForms;
      });

      // Show success message
      toast.success("وضعیت فرم با موفقیت به‌روزرسانی شد");
    } catch (error) {
      console.error("Error updating PM form status:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError("Failed to update PM form status. Please try again.");
      toast.error("خطا در به‌روزرسانی وضعیت فرم");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form type selection
  const handleFormTypeChange = async (formcode, formType) => {
    try {
      // Update local state first for immediate UI feedback
      setSelectedFormTypes((prev) => ({
        ...prev,
        [formcode]: formType,
      }));

      // Get the current form to check its status
      const currentForm = forms.find((f) => f.formcode === formcode);
      if (!currentForm) {
        throw new Error("Form not found");
      }

      // If the form is production_confirmed, first update its status to pending_pm
      if (currentForm.status === "production_confirmed") {
        await handleSubmitFormStatusUpdate(formcode, "pending_pm");
      }

      // Call API to update form type
      const response = await api.post(`/forms/${formcode}/type/`, {
        formtype: formType.toLowerCase(),
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("نوع فرم با موفقیت به‌روزرسانی شد");

        // Update the form in the local state
        setForms((prevForms) =>
          prevForms.map((form) =>
            form.formcode === formcode
              ? {
                  ...form,
                  formtype: formType.toLowerCase(),
                  status: "completed",
                }
              : form
          )
        );
      }
    } catch (error) {
      console.error("Error updating form type:", error);
      toast.error("خطا در به‌روزرسانی نوع فرم");

      // Revert the local state on error
      setSelectedFormTypes((prev) => {
        const newState = { ...prev };
        delete newState[formcode];
        return newState;
      });
    }
  };

  // Add delete form function
  const handleDeleteForm = async (formcode) => {
    try {
      // Show confirmation dialog
      if (
        !window.confirm("آیا مطمئن هستید که می‌خواهید این فرم را حذف کنید؟")
      ) {
        return;
      }

      // Call API to delete the form
      await api.delete(`/forms/${formcode}/`);

      // Update local state to remove the deleted form
      setForms(forms.filter((form) => form.formcode !== formcode));

      // Show success message
      toast.success("فرم با موفقیت حذف شد");
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("خطا در حذف فرم");
    }
  };

  const handleDeletePmForm = async (pmformcode) => {
    try {
      // Show Confirmation Dialog
      if (
        !window.confirm("آیا مطمئن هستید که می‌خواهید این فرم را حذف کنید؟")
      ) {
        return;
      }

      await api.delete(`/pmformssubmit/${pmformcode}/delete/`);

      setForms(forms.filter((form) => form.pmformcode !== pmformcode));

      toast.success("فرم با موفقیت حذف شد");
    } catch (error) {
      console.error("Error deleting PM Form:", error);
      toast.error("خطا در حذف فرم");
    }
  };

  // Open form type selection modal
  const openFormTypeModal = (form) => {
    setSelectedForm(form);
    setSelectedFormType("");
    setIsFormTypeModalOpen(true);
  };

  const handleFormDisplay = (form) => {
    if (!form) {
      toast.error("اطلاعات فرم یافت نشد");
      return;
    }

    // Find matching technician form with the same formcode
    const matchingTechnicianForm = technicianForms.find(
      (techForm) => techForm.formcode === form.formcode
    );

    // Find matching aghlam data with the same formcode
    const matchingAghlams = aghlams.filter(
      (aghlam) => aghlam.formcode === form.formcode
    );

    setSelectedForm({
      ...form,
      technicianForm: matchingTechnicianForm,
      aghlams: matchingAghlams,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedForm(null);
  };
  const handleClosePmDialog = () => {
    setIsPmDialogOpen(false);
    setSelectedPmForm(null);
  };

  // Modify renderActionButtons function
  const renderActionButtons = (form) => {
    const storedUserType = localStorage.getItem("user_type");
    const storedUserRole = localStorage.getItem("user_role");
    const isPmManagement =
      storedUserType === "pm" && storedUserRole === "management";

    // Add edit button for completed forms
    // if (form.status !== "completed") {
    //   return (
    //     <div className="flex space-x-2 justify-center">
    //       <button
    //         className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
    //         onClick={() => handleEditForm(form)}
    //       >
    //         ویرایش
    //       </button>
    //       <Link to={`/forms/${form.formcode}`}>
    //         <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs">
    //           مشاهده
    //         </button>
    //       </Link>
    //     </div>
    //   );
    // }

    // For Production Operator
    if (storedUserType === "production" && storedUserRole === "operator") {
      if (form.status === "technician_submitted") {
        return (
          <div className="flex space-x-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() =>
                handleSubmitFormStatusUpdate(
                  form.formcode,
                  "production_confirm"
                )
              }
            >
              تایید اپراتور تولید
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() => handleFormDiscard(form.formcode)}
            >
              لغو فرم
            </button>
            <Link
              to={`/forms/${form.formcode}`}
              className="flex space-x-2 justify-center"
            >
              <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs m-3">
                مشاهده
              </button>
            </Link>
          </div>
        );
      }
    }
    // For Production Management
    else if (
      storedUserType === "production" &&
      storedUserRole === "management"
    ) {
      if (form.status === "management_approved") {
        return (
          <div className="flex space-x-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 m-3 rounded text-xs"
              onClick={() =>
                handleSubmitFormStatusUpdate(
                  form.formcode,
                  "production_management_confirm"
                )
              }
            >
              تایید مدیر تولید
            </button>{" "}
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() => handleFormDiscard(form.formcode)}
            >
              لغو فرم
            </button>
            <Link
              to={`/forms/${form.formcode}`}
              className="flex space-x-2 justify-center"
            >
              <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs m-3">
                مشاهده
              </button>
            </Link>
          </div>
        );
      }
    }
    // For PM Management
    else if (storedUserType === "pm" && storedUserRole === "management") {
      if (form.status === "production_management_confirm") {
        return (
          <div className="flex space-x-2 justify-center">
            <select
              className="bg-white border border-gray-300 rounded px-2 py-1 m-3 text-xs"
              value={selectedFormTypes[form.formcode] || ""}
              onChange={(e) =>
                handleFormTypeChange(form.formcode, e.target.value)
              }
            >
              <option value="">انتخاب نوع فرم</option>
              {formTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Link
              to={`/forms/${form.formcode}`}
              className="flex space-x-2 justify-center"
            >
              <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs m-3">
                مشاهده
              </button>
            </Link>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() => handleDeleteForm(form.formcode)}
            >
              حذف
            </button>
          </div>
        );
      }
    }
    // For PM Technician
    else if (storedUserType === "pm" && storedUserRole === "technician") {
      if (form.status === "production_management_confirm") {
        return (
          <div className="flex space-x-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 m-3 rounded text-xs"
              onClick={() =>
                handleSubmitFormStatusUpdate(
                  form.formcode,
                  "pm_technician_submit"
                )
              }
            >
              ثبت فرم توسط کارشناس نت
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() => handleFormDiscard(form.formcode)}
            >
              لغو فرم
            </button>
            <Link
              to={`/forms/${form.formcode}`}
              className="flex space-x-2 justify-center"
            >
              <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs m-3">
                مشاهده
              </button>
            </Link>
          </div>
        );
      }
    }
    // For Technician
    else if (storedUserRole === "technician") {
      if (form.status === "pending_technician") {
        return (
          <div className="flex space-x-2 justify-center">
            <Link to={`/techniciansubmit/${form.formcode}`}>
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs">
                ثبت فرم تکنیسین
              </button>
            </Link>
          </div>
        );
      }
    }
    // For Technician Management
    else if (
      (storedUserType === "mechanic" ||
        storedUserType === "electric" ||
        storedUserType === "generalmechanic" ||
        storedUserType === "utility") &&
      storedUserRole === "management"
    ) {
      if (form.status === "production_confirmed") {
        return (
          <div className="flex space-x-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 m-3 rounded text-xs"
              onClick={() =>
                handleSubmitFormStatusUpdate(
                  form.formcode,
                  "management_approve"
                )
              }
            >
              تایید رئیس فنی
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() => handleFormDiscard(form.formcode)}
            >
              لغو فرم
            </button>
            <div className="flex space-x-2 justify-center">
              <Link to={`/forms/${form.formcode}`}>
                <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs">
                  مشاهده
                </button>
              </Link>
            </div>
          </div>
        );
      }
    }

    // View button for production_management_confirm status
    if (form.status === "production_management_confirm") {
      return (
        <div className="flex space-x-2 justify-center">
          <Link to={`/forms/${form.formcode}`}>
            <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs">
              مشاهده
            </button>
          </Link>
          {/* {isPmManagement && (
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs mr-2"
              onClick={() => handleDeleteForm(form.formcode)}
            >
              حذف
            </button>
          )} */}
        </div>
      );
    }

    // Default view for completed forms
    if (form.status === "completed") {
      return (
        <div className="flex space-x-2 justify-center">
          <Link to={`/forms/${form.formcode}`}>
            <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs">
              مشاهده
            </button>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex space-x-2 justify-center">
        <Link to={`/forms/${form.formcode}`}>
          <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs">
            مشاهده
          </button>
        </Link>
        {isPmManagement && (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3 mr-2"
            onClick={() => handleDeleteForm(form.formcode)}
          >
            حذف
          </button>
        )}
      </div>
    );
  };

  // PM Forms
  const renderPmFormsActionButtons = (form) => {
    const storedUserType = localStorage.getItem("user_type");
    const storedUserRole = localStorage.getItem("user_role");
    const isPmManagement =
      storedUserType === "pm" && storedUserRole === "management";

    // PM Technician initial review
    if (storedUserType === "pm" && storedUserRole === "technician") {
      if (form.pmstatus === "pending_pm_technician") {
        return (
          <div className="flex space-x-2 justify-center m-3">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs"
              onClick={() =>
                handlePmFormStatusUpdate(
                  form.pmformcode,
                  "pm_technician_submit"
                )
              }
            >
              ثبت فرم توسط کارشناس نت
            </button>
          </div>
        );
      }
      // PM Technician final review
      else if (form.pmstatus === "production_management_confirmed") {
        return (
          <div className="flex space-x-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() =>
                handlePmFormStatusUpdate(
                  form.pmformcode,
                  "pm_technician_final_submit"
                )
              }
            >
              بررسی نهایی کارشناس نت
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() => handlePmFormDiscard(form.pmformcode)}
            >
              لغو فرم
            </button>
          </div>
        );
      }
    }
    // PM Management first review
    else if (storedUserType === "pm" && storedUserRole === "management") {
      if (form.pmstatus === "pending_pm_management") {
        return (
          <div className="flex space-x-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() =>
                handlePmFormStatusUpdate(
                  form.pmformcode,
                  "pm_management_first_approve"
                )
              }
            >
              تایید اولیه مدیر نت
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() => handlePmFormDiscard(form.pmformcode)}
            >
              لغو فرم
            </button>
          </div>
        );
      }
      // PM Management final approval
      else if (form.pmstatus === "pending_final_pm_management") {
        return (
          <div className="flex space-x-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() =>
                handlePmFormStatusUpdate(
                  form.pmformcode,
                  "pm_management_final_approve"
                )
              }
            >
              تایید نهایی مدیر نت
            </button>
          </div>
        );
      }
    }
    // Worktype Technician review
    else if (
      storedUserRole === "technician" &&
      storedUserType === form.pmworktype
    ) {
      if (form.pmstatus === "pending_worktype_technician") {
        return (
          <div className="flex space-x-2 justify-center">
            <Link to={`/pmtechniciansubmit/${form.pmformcode}`}>
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs">
                ثبت فرم تکنیسین
              </button>
            </Link>
          </div>
        );
      }
    }
    // Worktype Management approval
    else if (
      storedUserRole === "management" &&
      (storedUserType === "mechanic" ||
        storedUserType === "electric" ||
        storedUserType === "generalmechanic" ||
        storedUserType === "utility")
    ) {
      if (form.pmstatus === "pending_worktype_management") {
        return (
          <div className="flex space-x-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() =>
                handlePmFormStatusUpdate(
                  form.pmformcode,
                  "worktype_management_approve"
                )
              }
            >
              تایید رئیس فنی
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() => handlePmFormDiscard(form.pmformcode)}
            >
              لغو فرم
            </button>
            <Link to={`/pmforms/${form.pmformcode}`}>
              <button className="bg-gray-500 cursor-pointer hover:bg-gray-700 text-white font-bold py-1 px-3 m-3 rounded text-xs">
                مشاهده
              </button>
            </Link>
          </div>
        );
      }
    }
    // Production Operator confirmation
    else if (storedUserType === "production" && storedUserRole === "operator") {
      if (form.pmstatus === "worktype_technician_submitted") {
        return (
          <div className="flex space-x-2 justify-center ">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() =>
                handlePmFormStatusUpdate(
                  form.pmformcode,
                  "production_operator_confirmed"
                )
              }
            >
              تایید اپراتور تولید
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() => handlePmFormDiscard(form.pmformcode)}
            >
              لغو فرم
            </button>
            <Link to={`/pmforms/${form.pmformcode}`}>
              <button className="bg-gray-500 cursor-pointer hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs m-3">
                مشاهده
              </button>
            </Link>
          </div>
        );
      }
    }
    // Production Management confirmation
    else if (
      storedUserType === "production" &&
      storedUserRole === "management"
    ) {
      if (form.pmstatus === "worktype_management_approved") {
        return (
          <div className="flex space-x-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() =>
                handlePmFormStatusUpdate(
                  form.pmformcode,
                  "production_management_confirm"
                )
              }
            >
              تایید رئیس تولید
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3"
              onClick={() => handlePmFormDiscard(form.pmformcode)}
            >
              لغو فرم
            </button>
            <Link to={`/pmforms/${form.pmformcode}`}>
              <button className="bg-gray-500 cursor-pointer hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs m-3">
                مشاهده
              </button>
            </Link>
          </div>
        );
      }
    }

    // View button for production_management_confirmed status
    if (form.pmstatus === "production_management_confirmed") {
      return (
        <div className="flex space-x-2 justify-center">
          <Link to={`/pmforms/${form.pmformcode}`}>
            <button className="bg-gray-500 cursor-pointer hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs">
              مشاهده
            </button>
          </Link>
          {isPmManagement && (
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs m-3 mr-2"
              onClick={() => handleDeletePmForm(form.pmformcode)}
            >
              حذف
            </button>
          )}
        </div>
      );
    }

    // Default view for completed forms
    if (form.pmstatus === "completed") {
      return (
        <div className="flex space-x-2 justify-center">
          <Link to={`/pmforms/${form.pmformcode}`}>
            <button className="bg-gray-500 cursor-pointer hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs">
              مشاهده
            </button>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex space-x-2 justify-center">
        <Link to={`/pmforms/${form.pmformcode}`}>
          <button className="bg-gray-500 cursor-pointer hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs">
            مشاهده
          </button>
        </Link>
        {isPmManagement && (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded m-3 text-xs mr-2"
            onClick={() => handleDeletePmForm(form.pmformcode)}
          >
            حذف
          </button>
        )}
      </div>
    );
  };

  const handleEndTimeChange = async (formcode, newEndTime) => {
    try {
      console.log("Updating end time:", { formcode, newEndTime });

      // Convert to local time while preserving the time components
      let formattedEndTime;
      if (typeof newEndTime === "object" && newEndTime.toDate) {
        // If it's a Persian DatePicker object
        const localDate = newEndTime.toDate();
        // Preserve local time by explicitly setting timezone to local
        formattedEndTime = moment(localDate).local().format();
      } else {
        // If it's already a string or Date object
        formattedEndTime = moment(newEndTime).local().format();
      }

      console.log("Formatted end time:", formattedEndTime);

      const response = await api.post(`/forms/${formcode}/endtime/`, {
        endtime: formattedEndTime,
      });

      console.log("Update response:", response.data);

      if (response.status === 200 || response.status === 201) {
        toast.success("زمان توقف با موفقیت بروزرسانی شد");
        setForms((prevForms) =>
          prevForms.map((form) =>
            form.formcode === formcode
              ? { ...form, endtime: response.data.data.form.endtime }
              : form
          )
        );
      } else {
        toast.error("خطا در بروزرسانی زمان توقف");
      }
    } catch (error) {
      console.error("Error updating end time:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("خطا در بروزرسانی زمان توقف");
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const userPhase = localStorage.getItem("phase");
      const phaseValue = userPhase === "phase1" ? "01" : "02";

      // Add phase to form data
      const formDataWithPhase = {
        ...formData,
        phase: phaseValue,
      };

      const response = await api.post("/submitform/create/", formDataWithPhase);

      if (response.status === 201) {
        toast.success("فرم با موفقیت ثبت شد");
        getForms();
      } else {
        toast.error("خطا در ثبت فرم");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("خطا در ثبت فرم");
    }
  };

  const getForms = async (phase, sections) => {
    try {
      console.log(
        "Fetching forms with phase:",
        phase,
        "and sections:",
        sections
      );

      // Set headers for the API request
      const headers = {
        "X-User-Phase": phase,
        "X-User-Section": sections.join(","),
        "X-User-Type": userInfo?.user_type || "",
        "X-User-Role": userInfo?.role || "",
      };

      console.log("Request headers:", headers);

      const response = await api.get("/submitform/list/", { headers });
      console.log("API response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        let filteredForms = response.data;

        // If user is PM or has 'all' sections, show all forms without filtering
        if (userInfo?.user_type === "pm" || sections.includes("all")) {
          console.log("User is PM or has 'all' sections, showing all forms");
          setForms(filteredForms);
          return;
        }

        // Filter forms based on phase
        filteredForms = filteredForms.filter((form) => {
          const formPhase = form.phase === "01" ? "phase1" : "phase2";
          return formPhase === phase;
        });

        // Filter forms based on user's sections
        filteredForms = filteredForms.filter((form) => {
          return sections.some(
            (section) => form.section.toLowerCase() === section.toLowerCase()
          );
        });

        console.log("Filtered forms:", filteredForms);
        setForms(filteredForms);
      } else {
        console.error("Invalid response data format:", response.data);
        setForms([]);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      setForms([]);
    }
  };

  // Define columns for the data grid
  const columns = [
    {
      field: "formcode",
      headerName: "کد فرم",
      width: 120,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "problemdate",
      headerName: "تاریخ مشکل",
      width: 180,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const value = params.row?.problemdate;
        if (!value) return <div className="w-full text-center"></div>;
        return (
          <div className="w-full text-center">
            {moment(value).utc().locale("fa").format("jYYYY/jMM/jDD HH:mm:ss")}
          </div>
        );
      },
    },
    // {
    //   field: "phase",
    //   headerName: "فاز",
    //   width: 100,
    //   headerAlign: "center",
    //   align: "center",
    //   renderCell: (params) => {
    //     const value = params.row?.phase;

    //     // Handle different possible formats of phase data
    //     if (value === "01" || value === 1 || value === "1") {
    //       return <div className="w-full text-center">Phase 1</div>;
    //     } else if (value === "02" || value === 2 || value === "2") {
    //       return <div className="w-full text-center">Phase 2</div>;
    //     } else {
    //       return <div className="w-full text-center">{value || ""}</div>;
    //     }
    //   },
    // },
    {
      field: "machinename",
      headerName: "نام ماشین",
      width: 150,
      headerAlign: "center",
      align: "center",
    },
    // {
    //   field: "machinecode",
    //   headerName: "کد ماشین",
    //   width: 120,
    //   headerAlign: "center",
    //   align: "center",
    // },

    // {
    //   field: "machineplacecode",
    //   headerName: "کد محل ماشین",
    //   width: 150,
    //   headerAlign: "center",
    //   align: "center",
    // },
    {
      field: "worktype",
      headerName: "نوع کار",
      width: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const value = params.row?.worktype;
        if (!value) return <div className="w-full text-center"></div>;

        const worktypeMap = {
          mechanic: "مکانیک",
          electric: "برق",
          utility: "تاسیسات",
          metalworking: "فلزکاری",
          tarashkari: "تراشکاری",
          paint: "رنگ و سندبلاست",
          generalmechanic: "مکانیک عمومی",
        };

        return (
          <div className="w-full text-center">
            {worktypeMap[value] || value}
          </div>
        );
      },
    },
    // {
    //   field: "stoptime",
    //   headerName: "زمان توقف",
    //   width: 180,
    //   headerAlign: "center",
    //   align: "center",
    //   renderCell: (params) => {
    //     const value = params.row?.stoptime;
    //     if (!value) return <div className="w-full text-center"></div>;
    //     try {
    //       return (
    //         <div className="w-full text-center">
    //           {new Date(value).toLocaleString("fa-IR")}
    //         </div>
    //       );
    //     } catch (e) {
    //       console.error("Error formatting date:", e);
    //       return <div className="w-full text-center">{value}</div>;
    //     }
    //   },
    // },
    // {
    //   field: "failuretimesubmit",
    //   headerName: "زمان خرابی",
    //   width: 120,
    //   headerAlign: "center",
    //   align: "center",
    // },
    // {
    //   field: "operatorname",
    //   headerName: "نام اپراتور",
    //   width: 150,
    //   headerAlign: "center",
    //   align: "center",
    // },
    // {
    //   field: "productionstop",
    //   headerName: "توقف تولید",
    //   width: 120,
    //   headerAlign: "center",
    //   align: "center",
    // },
    // {
    //   field: "section",
    //   headerName: "بخش",
    //   width: 100,
    //   headerAlign: "center",
    //   align: "center",
    // },
    {
      field: "shift",
      headerName: "شیفت",
      width: 100,
      headerAlign: "center",
      align: "center",
    },
    // {
    //   field: "suggesttime",
    //   headerName: "زمان پیشنهادی",
    //   width: 150,
    //   headerAlign: "center",
    //   align: "center",
    // },
    // {
    //   field: "worksuggest",
    //   headerName: "پیشنهاد کار",
    //   width: 150,
    //   headerAlign: "center",
    //   align: "center",
    // },
    // {
    //   field: "fixrepair",
    //   headerName: "تعمیر ثابت",
    //   width: 120,
    //   headerAlign: "center",
    //   align: "center",
    // },
    // {
    //   field: "reportinspection",
    //   headerName: "گزارش بازرسی",
    //   width: 150,
    //   headerAlign: "center",
    //   align: "center",
    // },
    // {
    //   field: "faultdm",
    //   headerName: "روش کشف عیب",
    //   width: 120,
    //   headerAlign: "center",
    //   align: "center",
    // },
    {
      field: "problemdescription",
      headerName: "توضیحات مشکل",
      width: 200,
      headerAlign: "center",
      align: "center",
    },
    // {
    //   field: "formtype",
    //   headerName: "نوع فرم",
    //   width: 120,
    //   headerAlign: "center",
    //   align: "center",
    //   renderCell: (params) => {
    //     const value = params.row?.formtype;
    //     if (!value) return <div className="w-full text-center">-</div>;

    //     // Find the matching form type option
    //     const formTypeOption = formTypeOptions.find(
    //       (option) => option.value === value
    //     );
    //     return (
    //       <div className="w-full text-center">
    //         {formTypeOption ? formTypeOption.label.split(" - ")[0] : value}
    //       </div>
    //     );
    //   },
    // },
    {
      field: "endtime",
      headerName: "زمان پایان توقف",
      width: 250,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const value = params.row?.endtime;
        const formcode = params.row?.formcode;
        const status = params.row?.status;
        const storedUserType = localStorage.getItem("user_type");
        const storedUserRole = localStorage.getItem("user_role");
        const isProductionOperator =
          storedUserType === "production" && storedUserRole === "operator";

        // Unified display logic for all users
        if (value) {
          const m = moment(value);
          return m.isValid() ? (
            <div className="w-full text-center">
              {m.locale("fa").format("jYYYY/jMM/jDD HH:mm:ss")}
            </div>
          ) : (
            <div className="w-full text-center">-</div>
          );
        }

        // Only show date picker for Production Operators
        if (
          isProductionOperator &&
          (status === "technician_submitted" ||
            status === "pending_production") &&
          editingFormCode === formcode
        ) {
          return (
            <div className="w-full flex justify-center h-full">
              <DatePicker
                className="w-full flex justify-center h-ful text-center z-10 custom-rmdp"
                value={editingEndTime ? new Date(editingEndTime) : null}
                onChange={(date) => {
                  if (date) {
                    const selectedDate = date.toDate();
                    setEditingEndTime(selectedDate);
                  }
                }}
                calendar={persian}
                locale={persian_fa}
                plugins={[
                  <TimePicker
                    position="bottom"
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: "10px",
                    }}
                  />,
                ]}
                format="YYYY/MM/DD HH:mm"
                calendarPosition="bottom-right"
                inputClass="border rounded p-1 text-sm w-40"
                style={{ direction: "ltr" }}
                containerClassName="w-full"
                editable={true}
                inputMode="text"
              />
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-3 rounded m-2 text-xs"
                onClick={() => {
                  if (editingEndTime) {
                    const formatted = moment(editingEndTime).format(
                      "YYYY-MM-DDTHH:mm:ss"
                    );
                    handleEndTimeChange(formcode, formatted);
                    setEditingFormCode(null);
                    setEditingEndTime(null);
                  }
                }}
              >
                ثبت
              </button>
            </div>
          );
        }

        // Show add button only for Production Operators
        if (
          isProductionOperator &&
          (status === "technician_submitted" || status === "pending_production")
        ) {
          return (
            <div
              className="w-full text-center cursor-pointer text-blue-500 hover:text-blue-700"
              onClick={() => {
                setEditingFormCode(formcode);
                setEditingEndTime("");
              }}
            >
              افزودن زمان توقف
            </div>
          );
        }

        // Default empty state for non-Production Operators
        return <div className="w-full text-center">-</div>;
      },
    },
    {
      field: "status",
      headerName: "وضعیت",
      width: 200,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const status = params.value;
        console.log("Status column rendering:", { status, row: params.row });
        let displayText = "";
        let bgColor = "";

        switch (status) {
          case "pending_technician":
            displayText = "در انتظار بررسی تکنیسین";
            bgColor = "bg-blue-500";
            break;
          case "technician_submitted":
            displayText = "در انتظار تایید اپراتور تولید";
            bgColor = "bg-purple-500";
            break;
          case "pending_management":
            displayText = "در انتظار تایید رئیس فنی";
            bgColor = "bg-yellow-500";
            break;
          case "management_approved":
            displayText = "در انتظار تایید رئیس تولید";
            bgColor = "bg-green-500";
            break;
          case "pending_production":
            displayText = "در انتظار تایید اپراتور تولید";
            bgColor = "bg-indigo-500";
            break;
          case "production_confirmed":
            displayText = "در انتظار تایید رئیس فنی";
            bgColor = "bg-pink-500";
            break;
          case "production_management_confirm":
            displayText = "در انتظار تایید کارشناس نت";
            bgColor = "bg-red-500";
            break;
          case "pm_technician_pending":
            displayText = "در انتظار تایید رئیس نت";
            bgColor = "bg-orange-400";
            break;
          case "pending_pm":
            displayText = "در انتظار تایید رئیس نت";
            bgColor = "bg-orange-500";
            break;
          case "completed":
            displayText = "تکمیل شده";
            bgColor = "bg-green-700";
            break;
          case "rejected":
            displayText = "رد شده";
            bgColor = "bg-red-500";
            break;

          default:
            // If we get an invalid status, show it as unknown
            displayText = "نامشخص";
            bgColor = "bg-gray-500";
            console.warn("Invalid status received:", status);
        }

        return (
          <span className={`text-white px-2 py-1 rounded ${bgColor}`}>
            {displayText}
          </span>
        );
      },
    },
    // {
    //   field: "formnote"
    //   headerName: "توضیحات فرم",
    //   width: 100,
    //   align: "center",
    //   renderCell: (params) => (
    //     <Tooltip title="مشاهده جزئیات">
    //       <button
    //         onClick={() => openNoteDialog(params.row)}
    //         className="text-blue-500 hover:text-blue-700"
    //       >
    //         <CheckCircle2 className="w-5 h-5" />
    //       </button>
    //     </Tooltip>
    //   ),
    // },
    {
      field: "actions",
      headerName: "عملیات",
      width: 350,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => renderActionButtons(params.row),
    },
  ];

  const pmColumns = [
    {
      field: "pmformcode",
      headerName: "کد فرم",
      width: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "pmformdate",
      headerName: "زمان توقف",
      width: 180,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const value = params.row?.pmformdate;
        if (!value) return <div className="w-full text-center"></div>;
        try {
          return (
            <div className="w-full text-center">
              {new Date(value).toLocaleString("fa-IR")}
            </div>
          );
        } catch (e) {
          console.error("Error formatting date:", e);
          return <div className="w-full text-center">{value}</div>;
        }
      },
    },
    {
      field: "pmphase",
      headerName: "فاز",
      width: 100,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const value = params.row?.pmphase;

        // Handle different possible formats of phase data
        if (value === "01" || value === 1 || value === "1") {
          return <div className="w-full text-center">Phase 1</div>;
        } else if (value === "02" || value === 2 || value === "2") {
          return <div className="w-full text-center">Phase 2</div>;
        } else {
          return <div className="w-full text-center">{value || ""}</div>;
        }
      },
    },
    {
      field: "pmsection",
      headerName: "بخش",
      width: 200,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "pmsubject",
      headerName: "موضوع تعمیرات",
      width: 200,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "pmworktype",
      headerName: "نوع کار",
      width: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const value = params.row?.pmworktype;
        if (!value) return <div className="w-full text-center"></div>;

        const worktypeMap = {
          mechanic: "مکانیک",
          electric: "برق",
          utility: "تاسیسات",
          metalworking: "فلزکاری",
          tarashkari: "تراشکاری",
          generalmechanic: "مکانیک عمومی",
          paint: "رنگ و سند بلاست",
        };

        return (
          <div className="w-full text-center">
            {worktypeMap[value] || value}
          </div>
        );
      },
    },
    {
      field: "pmstatus",
      headerName: "وضعیت",
      width: 200,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const status = params.value;
        let displayText = "";
        let bgColor = "";

        switch (status) {
          case "pending_pm_technician":
            displayText = "در انتظار بررسی کارشناس نت";
            bgColor = "bg-blue-500";
            break;
          case "pending_pm_management":
            displayText = "در انتظار تایید مدیر نت";
            bgColor = "bg-yellow-500";
            break;
          case "pending_worktype_technician":
            displayText = "در انتظار بررسی تکنیسین";
            bgColor = "bg-blue-500";
            break;
          case "worktype_technician_submitted":
            displayText = "ارسال شده توسط تکنیسین";
            bgColor = "bg-purple-500";
            break;
          case "pending_production_operator":
            displayText = "ارسال شده توسط تکنیسین";
            bgColor = "bg-purple-500";
            break;
          case "worktype_management_approved":
            displayText = "تایید شده توسط رئیس فنی";
            bgColor = "bg-green-500";
            break;
          case "pending_worktype_management":
            displayText = "در انتظار تایید توسط رئیس فنی";
            bgColor = "bg-green-500";
            break;
          case "production_operator_confirmed":
            displayText = "تایید شده توسط اپراتور تولید";
            bgColor = "bg-pink-500";
            break;
          case "production_management_confirmed":
            displayText = "تایید شده توسط مدیر تولید";
            bgColor = "bg-red-500";
            break;
          case "pending_final_pm_management":
            displayText = "در انتظار تایید نهایی مدیر نت";
            bgColor = "bg-orange-400";
            break;
          case "completed":
            displayText = "تکمیل شده";
            bgColor = "bg-green-700";
            break;
          case "rejected":
            displayText = "رد شده";
            bgColor = "bg-red-500";
            break;
          default:
            displayText = "نامشخص";
            bgColor = "bg-gray-500";
        }

        return (
          <span className={`text-white px-2 py-1 rounded ${bgColor}`}>
            {displayText}
          </span>
        );
      },
    },
    // {
    //   field: "pmformnote",
    //   headerName: "توضیحات فرم",
    //   width: 100,
    //   align: "center",
    //   renderCell: (params) => (
    //     <Tooltip title="مشاهده جزئیات">
    //       <button
    //         onClick={() => openPmNoteDialog(params.row)}
    //         className="text-blue-500 hover:text-blue-700"
    //       >
    //         <CheckCircle2 className="w-5 h-5" />
    //       </button>
    //     </Tooltip>
    //   ),
    // },
    {
      field: "pmactions",
      headerName: "عملیات",
      width: 300,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => renderPmFormsActionButtons(params.row),
    },
  ];

  // Add this function after the existing handleFormDisplay function
  const handleEditForm = async (form) => {
    if (!form) {
      toast.error("اطلاعات فرم یافت نشد");
      return;
    }

    try {
      // Fetch form data
      const formResponse = await api.get(`/submitform/${form.formcode}/`);
      const formData = formResponse.data;

      // Initialize empty objects for technician and personnel data
      let technicianData = {};
      let personnelData = {};

      try {
        // Try to fetch technician data
        const technicianResponse = await api.get(`/techniciansubmit/list/`);
        const technicianList = technicianResponse.data;
        technicianData =
          technicianList.find((tech) => tech.formcode === form.formcode) || {};
      } catch (error) {
        console.warn("No technician data found:", error);
      }

      try {
        // Try to fetch personnel data
        const personnelResponse = await api.get(`/personel/list/`);
        const personnelList = personnelResponse.data;
        personnelData =
          personnelList.find((person) => person.formcode === form.formcode) ||
          {};
      } catch (error) {
        console.warn("No personnel data found:", error);
      }

      // Set all the data in state
      setEditingForm(formData);
      setEditingTechnicianData(technicianData);
      setEditingPersonnelData(personnelData);
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error fetching form data:", error);
      toast.error("خطا در دریافت اطلاعات فرم");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update form data
      await api.put(`/submitform/${editingForm.formcode}/`, {
        problemdescription: editingForm.problemdescription,
        formnote: editingForm.formnote,
        endtime: editingForm.endtime,
      });

      // Update or create technician data
      try {
        if (
          editingTechnicianData &&
          Object.keys(editingTechnicianData).length > 0
        ) {
          // Use PUT for updating existing technician data
          await api.put("/techniciansubmit/", {
            formcode: editingForm.formcode,
            failurepart: editingTechnicianData.failurepart,
            failuretime: editingTechnicianData.failuretime,
            sparetime: editingTechnicianData.sparetime,
            wastedtime: editingTechnicianData.wastedtime,
            startfailuretime: editingTechnicianData.startfailuretime,
            problemdescription: editingTechnicianData.problemdescription,
            jobstatus: editingTechnicianData.jobstatus,
          });
        }
      } catch (error) {
        console.error("Error updating technician data:", error);
        toast.error("خطا در بروزرسانی اطلاعات تکنیسین");
      }

      // Update or create personnel data
      try {
        if (
          editingPersonnelData &&
          Object.keys(editingPersonnelData).length > 0
        ) {
          // Helper function to format datetime to Persian format
          const formatToPersianDateTime = (dateTimeStr) => {
            if (!dateTimeStr) return null;
            try {
              // First try to parse the date string
              let date;
              if (typeof dateTimeStr === "string") {
                // Handle ISO format dates
                if (dateTimeStr.includes("T")) {
                  date = new Date(dateTimeStr);
                } else {
                  // Try parsing as Persian date first
                  const parts = dateTimeStr.split(" ");
                  if (parts.length === 2) {
                    const [datePart, timePart] = parts;
                    const [year, month, day] = datePart.split("/").map(Number);
                    const [hour, minute] = timePart.split(":").map(Number);

                    // Create a Persian date using moment-jalaali
                    date = moment(
                      `${year}/${month}/${day} ${hour}:${minute}`,
                      "jYYYY/jMM/jDD HH:mm"
                    ).toDate();
                  } else {
                    date = new Date(dateTimeStr);
                  }
                }
              } else if (dateTimeStr instanceof Date) {
                date = dateTimeStr;
              } else {
                return null;
              }

              // Check if the date is valid
              if (isNaN(date.getTime())) {
                console.warn("Invalid date:", dateTimeStr);
                return null;
              }

              // Format to Persian date using moment-jalaali
              return moment(date).format("jYYYY/jMM/jDD HH:mm");
            } catch (error) {
              console.error("Error formatting date:", error);
              return null;
            }
          };

          // Create the personnel data object with formatted datetime values
          const personnelData = {
            formcode: editingForm.formcode,
            personel: editingPersonnelData.personel,
            personelnumber: editingPersonnelData.personelnumber,
            specialjob: editingPersonnelData.specialjob,
            starttimerepair: formatToPersianDateTime(
              editingPersonnelData.starttimerepair
            ),
            endtimerepair: formatToPersianDateTime(
              editingPersonnelData.endtimerepair
            ),
            personel2: editingPersonnelData.personel2,
            personelnumber2: editingPersonnelData.personelnumber2,
            specialjob2: editingPersonnelData.specialjob2,
            starttimerepair2: formatToPersianDateTime(
              editingPersonnelData.starttimerepair2
            ),
            endtimerepair2: formatToPersianDateTime(
              editingPersonnelData.endtimerepair2
            ),
            personel3: editingPersonnelData.personel3,
            personelnumber3: editingPersonnelData.personelnumber3,
            specialjob3: editingPersonnelData.specialjob3,
            starttimerepair3: formatToPersianDateTime(
              editingPersonnelData.starttimerepair3
            ),
            endtimerepair3: formatToPersianDateTime(
              editingPersonnelData.endtimerepair3
            ),
            personel4: editingPersonnelData.personel4,
            personelnumber4: editingPersonnelData.personelnumber4,
            specialjob4: editingPersonnelData.specialjob4,
            starttimerepair4: formatToPersianDateTime(
              editingPersonnelData.starttimerepair4
            ),
            endtimerepair4: formatToPersianDateTime(
              editingPersonnelData.endtimerepair4
            ),
            personel5: editingPersonnelData.personel5,
            personelnumber5: editingPersonnelData.personelnumber5,
            specialjob5: editingPersonnelData.specialjob5,
            starttimerepair5: formatToPersianDateTime(
              editingPersonnelData.starttimerepair5
            ),
            endtimerepair5: formatToPersianDateTime(
              editingPersonnelData.endtimerepair5
            ),
            personel6: editingPersonnelData.personel6,
            personelnumber6: editingPersonnelData.personelnumber6,
            specialjob6: editingPersonnelData.specialjob6,
            starttimerepair6: formatToPersianDateTime(
              editingPersonnelData.starttimerepair6
            ),
            endtimerepair6: formatToPersianDateTime(
              editingPersonnelData.endtimerepair6
            ),
            personel7: editingPersonnelData.personel7,
            personelnumber7: editingPersonnelData.personelnumber7,
            specialjob7: editingPersonnelData.specialjob7,
            starttimerepair7: formatToPersianDateTime(
              editingPersonnelData.starttimerepair7
            ),
            endtimerepair7: formatToPersianDateTime(
              editingPersonnelData.endtimerepair7
            ),
            personel8: editingPersonnelData.personel8,
            personelnumber8: editingPersonnelData.personelnumber8,
            specialjob8: editingPersonnelData.specialjob8,
            starttimerepair8: formatToPersianDateTime(
              editingPersonnelData.starttimerepair8
            ),
            endtimerepair8: formatToPersianDateTime(
              editingPersonnelData.endtimerepair8
            ),
            repairstatus: editingPersonnelData.repairstatus,
            unitrepair: editingPersonnelData.unitrepair,
            shift: editingPersonnelData.shift,
            delayreason: editingPersonnelData.delayreason,
            failurereason: editingPersonnelData.failurereason,
            failurereasondescription:
              editingPersonnelData.failurereasondescription,
            suggestionfailure: editingPersonnelData.suggestionfailure,
          };

          // Remove null values from the request data
          Object.keys(personnelData).forEach((key) => {
            if (personnelData[key] === null) {
              delete personnelData[key];
            }
          });

          if (editingPersonnelData.id) {
            // Update existing personnel data
            await api.put("/personel/", personnelData);
          } else {
            // Create new personnel data
            await api.put("/personel/", personnelData);
          }
        }
      } catch (error) {
        console.error("Error updating personnel data:", error);
        toast.error("خطا در بروزرسانی اطلاعات پرسنل");
      }

      toast.success("اطلاعات با موفقیت بروزرسانی شد");
      setIsEditDialogOpen(false);
      setEditingForm(null);
      setEditingTechnicianData(null);
      setEditingPersonnelData(null);
    } catch (error) {
      console.error("Error updating form data:", error);
      toast.error("خطا در بروزرسانی اطلاعات");
    }
  };

  return (
    <main className="flex-1 overflow-auto relative z-10 w-full py-6 px-4">
      <motion.div
        className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg p-6 border border-gray-700 mb-8 rounded w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Form Type Selection Buttons */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${
              activeFormType === "EM"
                ? "bg-blue-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => setActiveFormType("EM")}
          >
            لیست درخواست تعمیر
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${
              activeFormType === "PM"
                ? "bg-blue-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => setActiveFormType("PM")}
          >
            لیست دستورات تعمیرات
          </button>
        </div>

        {/* Regular Forms Table */}
        {activeFormType === "EM" && (
          <div className="bg-white shadow-md rounded-lg p-6 w-full">
            <h2 className="text-2xl font-arial font-bold mb-4 text-center text-gray-700">
              لیست درخواست تعمیر
            </h2>

            {isLoading ? (
              <div className="flex justify-center items-center h-46">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="overflow-x-auto w-full h-[800px]">
                {filteredForms.length > 0 ? (
                  <DataGrid
                    rows={filteredForms}
                    columns={columns}
                    getRowId={(row) => row.formcode || `form-${row.id}`}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 25]}
                    disableRowSelectionOnClick
                    localeText={{
                      noRowsLabel: "هیچ فرمی یافت نشد",
                    }}
                    loading={isLoading}
                    sx={{
                      width: "100%",
                      "& .MuiDataGrid-main": {
                        width: "100%",
                      },
                    }}
                  />
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    هیچ فرمی یافت نشد
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PM Forms Table */}
        {activeFormType === "PM" && (
          <div className="bg-white shadow-md rounded-lg p-6 w-full">
            <h2 className="text-2xl font-arial font-bold mb-4 text-center text-gray-700">
              لیست دستورات تعمیرات
            </h2>

            {isLoading ? (
              <div className="flex justify-center items-center h-46">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="overflow-x-auto w-full h-[800px]">
                {filteredPmForms.length > 0 ? (
                  <DataGrid
                    rows={filteredPmForms}
                    columns={pmColumns}
                    getRowId={(row) => row.pmformcode || `pm-${row.id}`}
                    paginationModel={pmPaginationModel}
                    onPaginationModelChange={setPmPaginationModel}
                    pageSizeOptions={[10, 25]}
                    disableRowSelectionOnClick
                    localeText={{
                      noRowsLabel: "هیچ فرم PM یافت نشد",
                    }}
                    loading={isLoading}
                    sx={{
                      width: "100%",
                      "& .MuiDataGrid-main": {
                        width: "100%",
                      },
                    }}
                  />
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    هیج فرمی یافت نشد
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Form Type Selection Modal */}
        {isFormTypeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-[100%] shadow-xl">
              <h3 className="text-xl font-bold text-center mb-4 text-gray-800">
                انتخاب نوع فرم
              </h3>
              <div className="mb-4">
                <p className="text-gray-800 mb-2">
                  فرم شماره: {selectedForm?.formcode}
                </p>
                <p className="text-gray-800 mb-4">
                  ماشین: {selectedForm?.machinename}
                </p>

                <label className="block text-gray-800 text-sm font-bold mb-3">
                  نوع فرم را انتخاب کنید:
                </label>

                <div className="flex flex-col space-y-3">
                  {formTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className="inline-flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors"
                    >
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-purple-600"
                        name="formType"
                        value={option.value}
                        checked={selectedFormType === option.value}
                        onChange={() => setSelectedFormType(option.value)}
                      />
                      <span className="mr-3 text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
                  onClick={() => {
                    setIsFormTypeModalOpen(false);
                    setSelectedForm(null);
                    setSelectedFormType("");
                  }}
                >
                  انصراف
                </button>

                <button
                  className={`${
                    !selectedFormType
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-purple-500 hover:bg-purple-600"
                  } text-white font-bold py-2 px-4 rounded transition-colors`}
                  onClick={() =>
                    handleFormTypeChange(
                      selectedForm.formcode,
                      selectedFormType
                    )
                  }
                  disabled={!selectedFormType}
                >
                  ثبت
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <div className="bg-gray-800 p-4">
          <DialogTitle className="flex text-white justify-center text-2xl font-bold border-b border-gray-700 pb-4">
            توضیحات فرم با کد : {selectedForm?.formcode}
          </DialogTitle>
          <DialogContent className="mt-4">
            {selectedForm && (
              <div className="overflow-auto relative z-10">
                <div className="rounded-3xl z-10">
                  <form onSubmit={handleFormNoteSubmit} className="space-y-4">
                    <div className="input-field">
                      <input
                        type="text"
                        placeholder="توضیحات خود را بنویسید"
                        name="formnote"
                        id="formnote"
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="text-center justify-center space-y-2 max-h-40 overflow-y-auto">
                      {formNotes.map((note, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-700 rounded-lg text-white"
                        >
                          {note.formnote}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ثبت
                      </button>
                      <button
                        onClick={handleCloseDialog}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        بستن
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </DialogContent>
        </div>
      </Dialog>
      <Dialog
        open={isPmDialogOpen}
        onClose={handleClosePmDialog}
        maxWidth="sm"
        fullWidth
      >
        <div className="bg-gray-800 p-4">
          <DialogTitle className="flex text-white justify-center text-2xl font-bold border-b border-gray-700 pb-4">
            توضیحات فرم با کد : {selectedPmForm?.pmformcode}
          </DialogTitle>
          <DialogContent className="mt-4">
            {selectedPmForm && (
              <div className="overflow-auto relative z-10">
                <div className="rounded-3xl z-10">
                  <form onSubmit={handlePmFormNoteSubmit} className="space-y-4">
                    <div className="input-field">
                      <input
                        type="text"
                        placeholder="توضیحات خود را بنویسید"
                        name="pmformnote"
                        id="pmformnote"
                        value={notePmValue}
                        onChange={(e) => setNotePmValue(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="text-center justify-center space-y-2 max-h-40 overflow-y-auto">
                      {formPmNotes.map((pmnote, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-700 rounded-lg text-white"
                        >
                          {pmnote.pmformnote}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ثبت
                      </button>
                      <button
                        onClick={handleClosePmDialog}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        بستن
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </DialogContent>
        </div>
      </Dialog>
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <div className="bg-gray-800 p-4">
          <DialogTitle className="flex text-white justify-center text-2xl font-bold border-b border-gray-700 pb-4">
            ویرایش فرم با کد: {editingForm?.formcode}
          </DialogTitle>
          <DialogContent className="mt-4">
            {editingForm && (
              <div className="overflow-auto relative z-10">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  {/* Form Data Section */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      اطلاعات فرم
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          توضیحات مشکل
                        </label>
                        <textarea
                          value={editingForm.problemdescription || ""}
                          onChange={(e) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              problemdescription: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                          rows="3"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          توضیحات فرم
                        </label>
                        <textarea
                          value={editingForm.formnote || ""}
                          onChange={(e) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              formnote: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Technician Data Section */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      اطلاعات تکنیسین
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          بخش خرابی
                        </label>
                        <input
                          type="text"
                          value={editingTechnicianData?.failurepart || ""}
                          onChange={(e) =>
                            setEditingTechnicianData((prev) => ({
                              ...prev,
                              failurepart: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          زمان خرابی
                        </label>
                        <input
                          type="text"
                          value={editingTechnicianData?.failuretime || ""}
                          onChange={(e) =>
                            setEditingTechnicianData((prev) => ({
                              ...prev,
                              failuretime: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          زمان قطعه
                        </label>
                        <input
                          type="text"
                          value={editingTechnicianData?.sparetime || ""}
                          onChange={(e) =>
                            setEditingTechnicianData((prev) => ({
                              ...prev,
                              sparetime: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          زمان هدر رفته
                        </label>
                        <input
                          type="text"
                          value={editingTechnicianData?.wastedtime || ""}
                          onChange={(e) =>
                            setEditingTechnicianData((prev) => ({
                              ...prev,
                              wastedtime: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          زمان شروع خرابی
                        </label>
                        <input
                          type="text"
                          value={editingTechnicianData?.startfailuretime || ""}
                          onChange={(e) =>
                            setEditingTechnicianData((prev) => ({
                              ...prev,
                              startfailuretime: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          وضعیت کار
                        </label>
                        <select
                          value={editingTechnicianData?.jobstatus || ""}
                          onChange={(e) =>
                            setEditingTechnicianData((prev) => ({
                              ...prev,
                              jobstatus: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        >
                          <option value="بله">کار انجام شد</option>
                          <option value="خیر">کار انجام نشد</option>
                          <option value="در حال انجام">در حال انجام</option>
                        </select>
                      </div>
                      <div className="input-field col-span-2">
                        <label className="block text-white mb-2">
                          توضیحات تکنیسین
                        </label>
                        <textarea
                          value={
                            editingTechnicianData?.problemdescription || ""
                          }
                          onChange={(e) =>
                            setEditingTechnicianData((prev) => ({
                              ...prev,
                              problemdescription: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Personnel Data Section */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      اطلاعات پرسنل
                    </h3>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                      // Check if this personnel entry has any data
                      const hasPersonnelData =
                        editingPersonnelData?.[`personel${num}`] ||
                        editingPersonnelData?.[`personelnumber${num}`] ||
                        editingPersonnelData?.[`specialjob${num}`] ||
                        editingPersonnelData?.[`starttimerepair${num}`] ||
                        editingPersonnelData?.[`endtimerepair${num}`];

                      // Only render if there is data
                      if (!hasPersonnelData) return null;

                      return (
                        <div
                          key={num}
                          className="mb-4 p-4 border border-gray-700 rounded-lg"
                        >
                          <h4 className="text-lg font-bold text-white mb-2">
                            پرسنل {num}
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="input-field">
                              <label className="block text-white mb-2">
                                نام پرسنل
                              </label>
                              <input
                                type="text"
                                value={
                                  editingPersonnelData?.[`personel${num}`] || ""
                                }
                                onChange={(e) =>
                                  setEditingPersonnelData((prev) => ({
                                    ...prev,
                                    [`personel${num}`]: e.target.value,
                                  }))
                                }
                                className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="input-field">
                              <label className="block text-white mb-2">
                                شماره پرسنلی
                              </label>
                              <input
                                type="text"
                                value={
                                  editingPersonnelData?.[
                                    `personelnumber${num}`
                                  ] || ""
                                }
                                onChange={(e) =>
                                  setEditingPersonnelData((prev) => ({
                                    ...prev,
                                    [`personelnumber${num}`]: e.target.value,
                                  }))
                                }
                                className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="input-field">
                              <label className="block text-white mb-2">
                                تخصص
                              </label>
                              <input
                                type="text"
                                value={
                                  editingPersonnelData?.[`specialjob${num}`] ||
                                  ""
                                }
                                onChange={(e) =>
                                  setEditingPersonnelData((prev) => ({
                                    ...prev,
                                    [`specialjob${num}`]: e.target.value,
                                  }))
                                }
                                className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="input-field">
                              <label className="block text-white mb-2">
                                زمان شروع تعمیر
                              </label>
                              <input
                                type="datetime-local"
                                value={
                                  editingPersonnelData?.[
                                    `starttimerepair${num}`
                                  ]
                                    ? new Date(
                                        editingPersonnelData[
                                          `starttimerepair${num}`
                                        ]
                                      )
                                        .toISOString()
                                        .slice(0, 16)
                                    : ""
                                }
                                onChange={(e) =>
                                  setEditingPersonnelData((prev) => ({
                                    ...prev,
                                    [`starttimerepair${num}`]: e.target.value,
                                  }))
                                }
                                className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="input-field">
                              <label className="block text-white mb-2">
                                زمان پایان تعمیر
                              </label>
                              <input
                                type="datetime-local"
                                value={
                                  editingPersonnelData?.[`endtimerepair${num}`]
                                    ? new Date(
                                        editingPersonnelData[
                                          `endtimerepair${num}`
                                        ]
                                      )
                                        .toISOString()
                                        .slice(0, 16)
                                    : ""
                                }
                                onChange={(e) =>
                                  setEditingPersonnelData((prev) => ({
                                    ...prev,
                                    [`endtimerepair${num}`]: e.target.value,
                                  }))
                                }
                                className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Additional Personnel Fields */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          وضعیت تعمیر
                        </label>
                        <input
                          type="text"
                          value={editingPersonnelData?.repairstatus || ""}
                          onChange={(e) =>
                            setEditingPersonnelData((prev) => ({
                              ...prev,
                              repairstatus: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          واحد تعمیر
                        </label>
                        <input
                          type="text"
                          value={editingPersonnelData?.unitrepair || ""}
                          onChange={(e) =>
                            setEditingPersonnelData((prev) => ({
                              ...prev,
                              unitrepair: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">شیفت</label>
                        <input
                          type="text"
                          value={editingPersonnelData?.shift || ""}
                          onChange={(e) =>
                            setEditingPersonnelData((prev) => ({
                              ...prev,
                              shift: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          دلیل تاخیر
                        </label>
                        <input
                          type="text"
                          value={editingPersonnelData?.delayreason || ""}
                          onChange={(e) =>
                            setEditingPersonnelData((prev) => ({
                              ...prev,
                              delayreason: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          دلیل خرابی
                        </label>
                        <input
                          type="text"
                          value={editingPersonnelData?.failurereason || ""}
                          onChange={(e) =>
                            setEditingPersonnelData((prev) => ({
                              ...prev,
                              failurereason: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          توضیحات دلیل خرابی
                        </label>
                        <input
                          type="text"
                          value={
                            editingPersonnelData?.failurereasondescription || ""
                          }
                          onChange={(e) =>
                            setEditingPersonnelData((prev) => ({
                              ...prev,
                              failurereasondescription: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="input-field">
                        <label className="block text-white mb-2">
                          پیشنهاد خرابی
                        </label>
                        <input
                          type="text"
                          value={editingPersonnelData?.suggestionfailure || ""}
                          onChange={(e) =>
                            setEditingPersonnelData((prev) => ({
                              ...prev,
                              suggestionfailure: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ثبت تغییرات
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditDialogOpen(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              </div>
            )}
          </DialogContent>
        </div>
      </Dialog>
    </main>
  );
}
