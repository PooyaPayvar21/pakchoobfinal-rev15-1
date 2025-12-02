import React, { useState } from "react";
import "../styles/register.css";
import { register, updateUserAdditionalRoles } from "../api";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("pm");
  const [subUserType, setSubUserType] = useState("management");
  const [sections, setSections] = useState([]);
  const [additionalRoles, setAdditionalRoles] = useState([]);
  const [message, setMessage] = useState("");
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Define user types and their corresponding sub-user types
  const userTypeOptions = [
    { value: "superadmin", label: "Super Admin" },
    { value: "ceo", label: "CEO" },
    { value: "management", label: "Management" },
    { value: "manager", label: "Manager" },
    // { value: "pm", label: "PM" },
    // { value: "production", label: "Production" },
    // { value: "mechanic", label: "Mechanic" },
    // { value: "generalmechanic", label: "General Mechanic" },
    // { value: "electric", label: "Electric" },
    // { value: "utility", label: "Utility" },
    // { value: "metalworking", label: "Metal Working" },
    // { value: "tarashkari", label: "Tarash Kari" },
    // { value: "paint", label: "Paint" },
  ];

  // Define section options
  const sectionOptions = [
    { value: "Chipper", label: "Chipper" },
    { value: "Conveyor Line", label: "Conveyor Line" },
    { value: "Dryer & Air Grader", label: "Dryer & Air Grader" },
    { value: "Refiner", label: "Refiner" },
    { value: "Energy Plant", label: "Energy Plant" },
    { value: "Before Press", label: "Before Press" },
    { value: "Press", label: "Press" },
    { value: "After Press", label: "After Press" },
    { value: "Sanding", label: "Sanding" },
    { value: "Cooling System", label: "Cooling System" },
    { value: "Steam Boiler", label: "Steam Boiler" },
    { value: "General", label: "General" },
    { value: "Melamine", label: "Melamine" },
    { value: "High Glass", label: "High Glass" },
    { value: "Formalin", label: "Formalin" },
    { value: "Resin", label: "Resin" },
    { value: "Water Treatment Plant", label: "Water Treatment Plant" },
    { value: "Paper Impregnation 1", label: "Paper Impregnation 1" },
    { value: "Paper Impregnation 2", label: "Paper Impregnation 2" },
    { value: "Paper Impregnation 3", label: "Paper Impregnation 3" },
  ];

  // Get available sub-user types based on selected user type
  const getSubUserTypes = (selectedUserType) => {
    switch (selectedUserType) {
      case "superadmin":
        return [{ value: "superadmin", label: "Super Admin" }];
      case "ceo":
        return [{ value: "ceo", label: "CEO" }];
      case "management":
        return [{ value: "management", label: "Management" }];
      case "manager":
        return [{ value: "manager", label: "Manager" }];
      case "production":
        return [
          { value: "management", label: "Management" },
          { value: "operator", label: "Operator" },
        ];
      case "pm":
        return [
          { value: "management", label: "Management" },
          { value: "technician", label: "Technician" },
        ];
      default:
        return [{ value: "technician", label: "Technician" }];
    }
  };

  // Get Additional Rules
  const getAdditionalRulesTypes = (selectedUserType) => {
    if (selectedUserType === "generalmechanic") {
      return [
        { value: "metalworking", label: "Metal Working" },
        { value: "tarashkari", label: "Tarash Kari" },
        { value: "paint", label: "Paint" },
      ];
    }
    return [];
  };

  const handleUserTypeChange = (e) => {
    const newUserType = e.target.value;
    setUserType(newUserType);
    // Set default sub-user type based on the selected user type
    setSubUserType(getSubUserTypes(newUserType)[0].value);
    // Reset additional roles when user type changes
    setAdditionalRoles([]);
  };

  const handleSectionChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    // Ensure at least one section is selected
    if (selectedOptions.length === 0) {
      setSections(["General"]);
    } else {
      setSections(selectedOptions);
    }
  };

  const handleAdditionalRolesChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setAdditionalRoles(selectedOptions);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // Ensure sections is always an array (can be empty)
      const sectionsToSend = Array.isArray(sections) ? sections : [];

      if (isUpdateMode) {
        // Update additional roles for existing user
        const response = await updateUserAdditionalRoles(
          username,
          additionalRoles
        );
        if (response.data.status === "success") {
          setMessage("Additional roles updated successfully!");
          // Clear form after successful update
          setUsername("");
          setAdditionalRoles([]);
          setIsUpdateMode(false);
        }
      } else {
        // Register new user
        const response = await register({
          username,
          password,
          user_type: userType,
          sub_user_type: subUserType,
          sections: sectionsToSend,
          additional_roles: additionalRoles,
        });

        if (response.data.status === "success") {
          setMessage("User registered successfully!");
          // Clear form after successful registration
          setUsername("");
          setPassword("");
          setUserType("pm");
          setSubUserType("management");
          setSections(["General"]);
          setAdditionalRoles([]);
        }
      }
    } catch (error) {
      console.error("Operation error:", error);
      if (error.response?.data?.message === "Username already exists") {
        setMessage(
          "Username exists. Switching to update mode. Please enter additional roles."
        );
        setIsUpdateMode(true);
      } else {
        setMessage(error.response?.data?.message || "Operation failed");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="w-[550px] bg-transparent border border-gray-600 shadow-2xl backdrop-blur-xs text-center">
        <h2 className="text-2xl text-center font-mono">
          {isUpdateMode ? "Update User Additional Roles" : "Register New User"}
        </h2>
        {message && (
          <p
            style={{
              color: message.includes("successfully") ? "yellow" : "red",
            }}
          >
            {message}
          </p>
        )}
        <form onSubmit={handleRegister} className="h-180">
          <div className="input-box">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {!isUpdateMode && (
            <>
              <div className="input-box">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="input-box">
                <select
                  value={userType}
                  onChange={handleUserTypeChange}
                  required
                  className="w-full p-5 text-center  h-full bg-transparent border-2 border-white/20 rounded-full px-5 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {userTypeOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-gray-800"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-box">
                <select
                  value={subUserType}
                  onChange={(e) => setSubUserType(e.target.value)}
                  required
                  className="w-full p-5 text-center h-full bg-transparent border-2 border-white/20 rounded-full px-5 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {getSubUserTypes(userType).map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-gray-800"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-box">
                <label className="block text-sm font-medium text-gray-300">
                  Sections (Select Multiple)
                </label>
                <div className="relative">
                  <select
                    multiple
                    value={sections}
                    onChange={handleSectionChange}
                    className="w-full p-2 border rounded-md"
                  >
                    {sectionOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="py-2 px-3 hover:bg-blue-600/50 cursor-pointer"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-400">
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 0 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Hold Ctrl (Windows) or Command (Mac) to select multiple
                  sections
                </div>
              </div>
            </>
          )}
          {getAdditionalRulesTypes(userType).length > 0 && (
            <div className="input-box">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Roles (Select Multiple)
              </label>
              <div className="relative">
                <select
                  multiple
                  value={additionalRoles}
                  onChange={handleAdditionalRolesChange}
                  className="w-full min-h-[120px] bg-gray-800/50 border-2 border-white/20 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                  size={3}
                >
                  {getAdditionalRulesTypes(userType).map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="py-2 px-3 hover:bg-blue-600/50 cursor-pointer"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-400">
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 0 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Hold Ctrl (Windows) or Command (Mac) to select multiple roles
              </div>
            </div>
          )}

          <button type="submit">
            {isUpdateMode ? "Update Additional Roles" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
