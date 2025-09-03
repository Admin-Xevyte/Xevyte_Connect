import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";
 
function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
 
const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const res = await axios.post("http://3.7.139.212:8080/api/auth/login", {
      employeeId,
      password,
    });

    if (res.data.message === "SUCCESS") {
      // Store info and token
      localStorage.setItem("employeeId", res.data.employeeId);
      localStorage.setItem("employeeName", res.data.name);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("managerId", res.data.managerId);
      localStorage.setItem("token", res.data.token);

     if (res.data.mustChangePassword) {
  navigate("/change-password");
} else {
  navigate("/dashboard");
}

    } else {
      setError("❌ Invalid credentials. Please reset your password.");
    }
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      const status = err.response.status;
      const msg = err.response.data.message;

      if (status === 401) {
        setError("❌ " + msg);
      } else if (status === 423) {
        setError("🔒 " + msg);
      } else if (status === 404) {
        setError("❌ " + msg);
      } else {
        setError("❗ " + msg);
      }
    } else {
      setError("🔌 Network error. Please check your connection.");
    }
  }
};

 
  return (
    <div className="login-page">
      <div className="left-side">
        <div className="logo-container">
          <img
            src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")}
            alt="Xevyte Logo"
            className="xevyte-logo"
          />
        </div>
        <img
          src={require("../assets/Sign_in_Page[1].jpg")}
          alt="office"
          className="office-img"
        />
      </div>
      <div className="right-side">
        <div className="for-container">
          <h2>Welcome To Xevyte Hub</h2>
          <p>Please enter your details</p>
 
          <form onSubmit={handleLogin}>
            <label htmlFor="employeeId">Employee ID</label>
            <input
              type="text"
              id="employeeId"
              placeholder="Enter Id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
 
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
             pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$"
title="Must be at least 8 characters, include uppercase and lowercase letters, one number, and one special character"

              required
              className="password-input"
            />
 
            <div className="forgot">
              <Link to="/forgot-password">
                <u>Forgot password?</u>
              </Link>
            </div>
 
            <button className="cor" type="submit">
              Sign in
            </button>
          </form>
 
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
 
export default LoginPage;
