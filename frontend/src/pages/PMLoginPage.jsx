import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import "../styles/Login.css";

const PMLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTypeState, setUserTypeState] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && userTypeState) {
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      switch (userTypeState) {
        case "pm":
          navigate("/admindashboard");
          break;
        default:
          navigate("/");
          setError("Invalid user type.");
          break;
      }
    }
  }, [isAuthenticated, userTypeState, navigate, onLoginSuccess]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/pmloginpage", {
        username,
        password,
      });
      if (response.data.status === "success") {
        localStorage.setItem("token", response.data.token);
        setIsAuthenticated(true);
        setUserTypeState("pm");
      }
    } catch (error) {
      setError("Invalid username or password.");
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

export default PMLoginPage;
