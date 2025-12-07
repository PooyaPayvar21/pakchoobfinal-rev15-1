/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const LoginMainForm = ({ userType, onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTypeState, setUserTypeState] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    console.log("Auth state changed:", { isAuthenticated, userTypeState });
    if (isAuthenticated && userTypeState) {
      console.log("Navigating to dashboard for user type:", userTypeState);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      switch (userTypeState) {
        case "pm":
          navigate("/kpidashboard");
          break;
        case "electric":
          navigate("/kpidashboard");
          break;
        case "mechanic":
          navigate("/kpidashboard");
          break;
        case "utility":
          navigate("/kpidashboard");
          break;
        case "production":
          navigate("/kpidashboard");
          break;
        case "metalworking":
          navigate("/kpidashboard");
          break;
        case "tarashkari":
          navigate("/kpidashboard");
          break;
        case "generalmechanic":
          navigate("/kpidashboard");
          break;
        case "paint":
          navigate("/kpidashboard");
          break;
        case "superadmin":
          navigate("/kpidashboard");
        case "ceo":
          navigate("/kpidashboard");
          break;
        case "management":
          navigate("/kpipeopleworks");
          break;
        case "manager":
          navigate("/kpipeopleworks");
          break;
        default:
          console.warn("Unknown user type:", userTypeState);
          setError("Unknown user type. Contact support.");
          break;
      }
    }
  }, [isAuthenticated, userTypeState, navigate, onLoginSuccess]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Attempting login with:", { username, password });
      const response = await api.post("login/", {
        username,
        password,
      });
      console.log("Login response:", response.data);

      if (response.data.status === "success") {
        console.log("Login response data:", response.data);
        console.log("Setting localStorage with:", {
          token: response.data.token,
          user_type: response.data.user_type,
          user_role: response.data.role,
          additional_roles: response.data.additional_roles,
          username: username,
        });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user_type", response.data.user_type);
        localStorage.setItem("user_role", response.data.role);
        localStorage.setItem("full_name", response.data.full_name);
        localStorage.setItem("username", username);
        // Ensure sections are stored as a comma-separated string
        const sections = Array.isArray(response.data.sections)
          ? response.data.sections.join(",")
          : response.data.sections;
        localStorage.setItem("sections", sections);

        // Store KPI data if available
        if (response.data.kpi_data) {
          console.log("Storing KPI data:", response.data.kpi_data);
          // Store as kpiUserInfo for Sidebar to access
          localStorage.setItem(
            "kpiUserInfo",
            JSON.stringify(response.data.kpi_data)
          );
          // Also store individual fields for backward compatibility
          localStorage.setItem(
            "kpi_data",
            JSON.stringify(response.data.kpi_data)
          );
          localStorage.setItem(
            "personal_code",
            response.data.kpi_data.personal_code
          );
          localStorage.setItem("full_name", response.data.kpi_data.full_name);
          localStorage.setItem(
            "company_name",
            response.data.kpi_data.company_name
          );
          localStorage.setItem(
            "departman",
            response.data.kpi_data.departman || ""
          );
        }

        // Update state after successful login
        console.log("Setting user type state:", response.data.user_type);
        setUserTypeState(response.data.user_type);
        setIsAuthenticated(true);
      } else {
        console.log("Login failed:", response.data.message);
        setError(response.data.message || "Invalid Credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="wrapper">
        <h2 className="text-2xl text-center font-mono">ورود کارکنان</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="input-box">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="input-box">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginMainForm;
