/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { api } from "../api";
import moment from "moment-jalaali";

const worktypePhones = {
  generalmechanic: ["09169423734", "09941269048", "09903515933"],
};

const CalendarReminder = () => {
  const [reminders, setReminders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    datetime: new Date(),
    phoneNumbers: [],
    workType: "",
    description: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Add state to track sent reminders
  const [sentReminders, setSentReminders] = useState(new Set());

  const workTypes = [
    "Installation",
    "Maintenance",
    "Repair",
    "Inspection",
    "Emergency",
    "Consultation",
    "Training",
    "Other",
  ];

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await api.get("/reminders/");
      setReminders(response.data);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      showSnackbar("Error fetching reminders", "error");
    }
  };

  const handleSubmit = async () => {
    try {
      // Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        showSnackbar("You must be logged in to create reminders", "error");
        return;
      }

      if (editingReminder) {
        await api.put(`/reminders/${editingReminder.id}/`, formData);
        showSnackbar("Reminder updated successfully!", "success");
      } else {
        console.log("Attempting to create reminder with data:", formData);
        const response = await api.post("/reminders/", formData);
        console.log("Reminder creation response:", response);
        showSnackbar("Reminder created successfully!", "success");

        // Send SMS only for General Mechanic work type
        if (formData.workType.toLowerCase() === "generalmechanic") {
          try {
            // Get the array of phone numbers for generalmechanic
            const phoneNumbers = worktypePhones.phase1.generalmechanic || [];

            // Send SMS to each phone number
            for (const phoneNumber of phoneNumbers) {
              const smsResponse = await api.post("/send-sms/", {
                reminder_id: response.data.id,
                to: phoneNumber,
                message: `یادآوری: ${formData.name}\nزمان: ${formatDateTime(
                  formData.datetime
                )}\nنوع کار: ${formData.workType}${
                  formData.description
                    ? `\nتوضیحات: ${formData.description}`
                    : ""
                }`,
              });
              if (smsResponse.data.status === "success") {
                console.log(`SMS sent to ${phoneNumber}`);
              }
            }
          } catch (smsError) {
            console.error("Failed to send SMS:", smsError);
            showSnackbar("Error sending SMS notifications", "error");
          }
        }
      }

      setOpenDialog(false);
      setEditingReminder(null);
      resetForm();
      fetchReminders();
    } catch (error) {
      console.error("Error saving reminder:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      showSnackbar(
        `Error saving reminder: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reminders/${id}/`);
      showSnackbar("Reminder deleted successfully!", "success");
      fetchReminders();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      showSnackbar("Error deleting reminder", "error");
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      name: reminder.name,
      datetime: new Date(reminder.datetime),
      phoneNumbers: reminder.phoneNumbers || [],
      workType: reminder.workType,
      description: reminder.description || "",
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      datetime: new Date(),
      phoneNumbers: [],
      workType: "",
      description: "",
    });
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    const persianDate = moment(date).format("jYYYY/jMM/jDD HH:mm");
    return persianDate;
  };

  const getStatusColor = (datetime) => {
    const now = new Date();
    const reminderTime = new Date(datetime);
    const diffInMinutes = (reminderTime - now) / (1000 * 60);

    if (diffInMinutes < 0) return "error";
    if (diffInMinutes < 60) return "warning";
    return "success";
  };

  const getStatusText = (datetime) => {
    const now = new Date();
    const reminderTime = new Date(datetime);
    const diffInMinutes = (reminderTime - now) / (1000 * 60);

    if (diffInMinutes < 0) return "Overdue";
    if (diffInMinutes < 60) return "Due Soon";
    return "Scheduled";
  };

  // Add function to check and send SMS for due reminders
  const checkAndSendDueReminders = async () => {
    const now = new Date();

    for (const reminder of reminders) {
      const reminderTime = new Date(reminder.datetime);
      const diffInMinutes = (reminderTime - now) / (1000 * 60);

      // If reminder is due (within 1 minute) and hasn't been sent yet
      if (
        diffInMinutes >= 0 &&
        diffInMinutes <= 1 &&
        !sentReminders.has(reminder.id)
      ) {
        try {
          // Get phone numbers based on work type
          const phoneNumbers =
            reminder.workType.toLowerCase() === "generalmechanic"
              ? worktypePhones.generalmechanic
              : reminder.phoneNumbers || [];

          // Send SMS to each phone number
          for (const phoneNumber of phoneNumbers) {
            const smsResponse = await api.post("/send-sms/", {
              reminder_id: reminder.id,
              to: phoneNumber,
              message: `یادآوری: ${reminder.name}\nزمان: ${formatDateTime(
                reminder.datetime
              )}\nنوع کار: ${reminder.workType}${
                reminder.description ? `\nتوضیحات: ${reminder.description}` : ""
              }`,
            });

            if (smsResponse.data.status === "success") {
              console.log(
                `SMS sent to ${phoneNumber} for reminder ${reminder.id}`
              );
            }
          }

          // Mark reminder as sent
          setSentReminders((prev) => new Set([...prev, reminder.id]));
          showSnackbar(`SMS sent for reminder: ${reminder.name}`, "success");
        } catch (error) {
          console.error("Error sending SMS for due reminder:", error);
          showSnackbar("Error sending SMS for due reminder", "error");
        }
      }
    }
  };

  // Set up periodic check for due reminders
  useEffect(() => {
    // Check immediately when component mounts
    checkAndSendDueReminders();

    // Set up interval to check every minute
    const intervalId = setInterval(checkAndSendDueReminders, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [reminders, sentReminders]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="flex-1 overflow-auto relative z-10 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={4}
          >
            <Typography
              variant="h4"
              component="h1"
              className="text-white font-bold"
            >
              <NotificationsIcon className="mr-2" />
              Calendar Reminders
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
              sx={{
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)",
                },
              }}
            >
              Add Reminder
            </Button>
          </Box>

          <Grid container spacing={3}>
            {reminders.map((reminder) => (
              <Grid item xs={12} md={6} lg={4} key={reminder.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    sx={{
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        transition: "transform 0.3s ease",
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={2}
                      >
                        <Typography
                          variant="h6"
                          className="text-white font-semibold"
                        >
                          {reminder.name}
                        </Typography>
                        <Chip
                          label={getStatusText(reminder.datetime)}
                          color={getStatusColor(reminder.datetime)}
                          size="small"
                        />
                      </Box>

                      <Box mb={2}>
                        <Box
                          display="flex"
                          alignItems="center"
                          mb={1}
                          className="text-gray-300"
                        >
                          <ScheduleIcon fontSize="small" className="mr-2" />
                          <Typography variant="body2">
                            {formatDateTime(reminder.datetime)}
                          </Typography>
                        </Box>

                        <Box
                          display="flex"
                          alignItems="center"
                          mb={1}
                          className="text-gray-300"
                        >
                          <PhoneIcon fontSize="small" className="mr-2" />
                          <Typography variant="body2">
                            {reminder.phoneNumbers?.join(", ") ||
                              reminder.phoneNumber}
                          </Typography>
                        </Box>

                        <Box
                          display="flex"
                          alignItems="center"
                          mb={1}
                          className="text-gray-300"
                        >
                          <WorkIcon fontSize="small" className="mr-2" />
                          <Typography variant="body2">
                            {reminder.workType}
                          </Typography>
                        </Box>
                      </Box>

                      {reminder.description && (
                        <Typography
                          variant="body2"
                          className="text-gray-400 mb-2"
                        >
                          {reminder.description}
                        </Typography>
                      )}

                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(reminder)}
                          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(reminder.id)}
                          sx={{ color: "rgba(255, 100, 100, 0.7)" }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {reminders.length === 0 && (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              minHeight="400px"
              className="text-gray-400"
            >
              <NotificationsIcon sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h6">No reminders yet</Typography>
              <Typography variant="body2">
                Click "Add Reminder" to create your first reminder
              </Typography>
            </Box>
          )}
        </motion.div>

        {/* Add/Edit Reminder Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: "rgba(30, 30, 30, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          <DialogTitle className="text-white">
            {editingReminder ? "Edit Reminder" : "Add New Reminder"}
          </DialogTitle>
          <DialogContent>
            <Box mt={2}>
              <TextField
                fullWidth
                label="Reminder Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                margin="normal"
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "rgba(255, 255, 255, 0.7)",
                  },
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.5)",
                    },
                  },
                }}
              />

              <DateTimePicker
                label="Date & Time"
                value={formData.datetime}
                onChange={(newValue) =>
                  setFormData({ ...formData, datetime: newValue })
                }
                slots={{
                  textField: TextField,
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    sx: {
                      "& .MuiInputLabel-root": {
                        color: "rgba(255, 255, 255, 0.7)",
                      },
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        "& fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.5)",
                        },
                      },
                    },
                  },
                }}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  Phone Numbers
                </InputLabel>
                <Select
                  multiple
                  value={formData.phoneNumbers}
                  onChange={(e) => {
                    console.log("Selected values:", e.target.value);
                    setFormData({ ...formData, phoneNumbers: e.target.value });
                  }}
                  label="Phone Numbers"
                  sx={{
                    color: "white",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.5)",
                    },
                    "& .MuiSvgIcon-root": { color: "white" },
                  }}
                >
                  <MenuItem value="09169423734">Eynolvand</MenuItem>
                  <MenuItem value="09941269048">Orsham</MenuItem>
                  <MenuItem value="09903515933">Payvar</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  Work Type
                </InputLabel>
                <Select
                  value={formData.workType}
                  onChange={(e) =>
                    setFormData({ ...formData, workType: e.target.value })
                  }
                  label="Work Type"
                  sx={{
                    color: "white",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.5)",
                    },
                    "& .MuiSvgIcon-root": { color: "white" },
                  }}
                >
                  {workTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Description (Optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                margin="normal"
                multiline
                rows={3}
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "rgba(255, 255, 255, 0.7)",
                  },
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.5)",
                    },
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenDialog(false)}
              className="text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={
                !formData.name ||
                !formData.phoneNumbers.length ||
                !formData.workType
              }
              sx={{
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)",
                },
              }}
            >
              {editingReminder ? "Update" : "Create"} Reminder
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default CalendarReminder;
