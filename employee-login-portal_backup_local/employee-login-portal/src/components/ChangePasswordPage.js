import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './ResetPassword.css'; // Assuming the CSS file is named ResetPassword.css

function ChangePasswordPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmployeeId = localStorage.getItem("employeeId");
    if (storedEmployeeId) {
      setEmployeeId(storedEmployeeId);
    } else {
      setError("Employee ID not found. Please login again.");
    }
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setError("❌ Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("❌ Passwords do not match.");
      return;
    }

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordPattern.test(newPassword)) {
      setError(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (!employeeId) {
      setError("Employee ID is missing. Please login again.");
      return;
    }

    try {
      const res = await axios.post(
        "/api/auth/change-password",
        { employeeId, newPassword }
      );

      if (res.data.message === "Password changed successfully") {
        setMessage("✅ Password changed successfully! Redirecting to LoginPage...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError("❌ " + res.data.message);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "❌ Server error. Please try again."
      );
    }
  };

  return (
    <div className="reset-page">
      <div className="container">
        <div className="left-side">
          <div className="logo-container">
            <img
              src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")}
              alt="Xevyte Logo"
              className="xevyte-logo"
            />
          </div>
          <img
            src={require("../assets/reset.jpg")}
            alt="office"
            className="office-img"
          />
        </div>

        <div className="right-side">
          <div className="for-container">
            <h3 className="fon">Change Your Password</h3>
            <p className="single-line">This is your first login. Please change your password to continue.</p>
            <form onSubmit={handleChangePassword}>
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$"
                title="At least 8 characters, uppercase, lowercase, number, and special character"
              />

              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <button className="cor" type="submit">Submit</button>
            </form>

            {error && <p className="error-msg">{error}</p>}
            {message && <p className="success-msg">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;