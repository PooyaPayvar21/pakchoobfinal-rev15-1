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
          navigate("/admindashboard");
          break;
        case "electric":
          navigate("/admindashboard");
          break;
        case "mechanic":
          navigate("/admindashboard");
          break;
        case "utility":
          navigate("/admindashboard");
          break;
        case "production":
          navigate("/admindashboard");
          break;
        case "metalworking":
          navigate("/admindashboard");
          break;
        case "tarashkari":
          navigate("/admindashboard");
          break;
        case "generalmechanic":
          navigate("/admindashboard");
          break;
        case "paint":
          navigate("/admindashboard");
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
        localStorage.setItem("username", username);
        // Ensure sections are stored as a comma-separated string
        const sections = Array.isArray(response.data.sections)
          ? response.data.sections.join(",")
          : response.data.sections;
        localStorage.setItem("sections", sections);

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
