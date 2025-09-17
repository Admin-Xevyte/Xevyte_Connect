import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClaimsPage.css';
import Sidebar from './Sidebar.js';

function ClaimsPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    totalClaims: 0,
    approved: 0,
    rejected: 0,
    paidAmount: 0
  });
const [canViewTasks, setCanViewTasks] = useState(false);
  const employeeId = localStorage.getItem("employeeId");
  useEffect(() => {
  if (employeeId) {
    fetch(`/claims/assigned-ids/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        setCanViewTasks(data.canViewTasks === true);
      })
      .catch(err => {
        console.error("Error fetching task visibility:", err);
        setCanViewTasks(false);
      });
  }
}, [employeeId]);
  useEffect(() => {
    if (employeeId) {
      fetch(`/claims/summary/${employeeId}`)
        .then(res => res.json())
        .then(data => {
          setSummary({
            totalClaims: data.totalClaims || 0,
            approved: data.approved || 0,
            rejected: data.rejected || 0,
            paidAmount: data.paidAmount || 0
          });
        })
        .catch(err => console.error("Error fetching summary:", err));
    }
  }, [employeeId]);
  return (
     <Sidebar>

<div style={{ marginTop: "40px" }}>
          <h2 className="title">Your Claim Updates</h2>
            <div
  className="quick-actions-grid"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",  // 4 columns in one row
    gap: "16px",
    marginTop: "10px",
    padding: "0 20px",
    boxSizing: "border-box",
    width: "100%",
     marginBottom: "40px",
  }}
>
  <div
    className="twi"
    style={{
      display: "contents", // so inner action-boxes become grid items directly
    }}
  >
    <div
      className="action-box light-purple"
      style={{
        cursor: "default",
        transition: "none",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        padding: "20px",
        borderRadius: "12px",
        background: "#f3ecff", // light-purple background
        minHeight: "120px",
        justifyContent: "space-between",
      }}
    >
      <div className="icon" style={{ cursor: 'default' }}>📝</div>
 
      <div>
        <h3>Total Claims Raised</h3>
        <p>{summary.totalClaims}</p>
      </div>
    </div>
 
    <div
      className="action-box light-green"
      style={{
        cursor: "default",
        transition: "none",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        padding: "20px",
        borderRadius: "12px",
        background: "#e4f8e9", // light-green background
        minHeight: "120px",
        justifyContent: "space-between",
      }}
    >
      <div className="icon" style={{ cursor: 'default' }}>✅</div>
 
     
      <div>
        <h3>Approved</h3>
        <p>{summary.approved}</p>
      </div>
    </div>
 
    <div
      className="action-box light-Gray cardcolor3"
      style={{
        cursor: "default",
        transition: "none",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        padding: "20px",
        borderRadius: "12px",
        background: "#f5f5f5", // light gray
        minHeight: "120px",
        justifyContent: "space-between",
      }}
    >
      <div className="icon" style={{ cursor: 'default' }}>❌</div>
     
      <div>
        <h3>Rejected</h3>
        <p>{summary.rejected}</p>
      </div>
    </div>
 
    <div
      className="action-box light-purple cardcolor4"
      style={{
        cursor: "default",
        transition: "none",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        padding: "20px",
        borderRadius: "12px",
        background: "#f3ecff",
        minHeight: "120px",
        justifyContent: "space-between",
      }}
    >
      <div className="icon"  style={{ cursor: 'default' }}>₹</div>
      <div>
        <h3>Paid Amount</h3>
        <p>₹{Math.floor(summary.paidAmount)}</p>
      </div>
    </div>
  </div>
</div>
 



          <br />

          <h2 className="title" style={{ marginBottom: "40px" }}>Quick Actions</h2>
          <div className="quick-actions-grid">
            <div className="action-box light-blue" onClick={() => navigate("/new")}>
              <div className="icon">₹</div>
              <div>
                <h3>New Claims</h3>
                <p>Create a new claim for reimbursement</p>
              </div>
              <div className="arrow">→</div>
            </div>

            <div className="action-box light-green" onClick={() => navigate("/claims/status")}>
              <div className="icon">📜</div>
              <div>
                <h3>Claims Status</h3>
                <p>Track your current claims</p>
              </div>
              <div className="arrow">→</div>
            </div>

            <div className="action-box light-yellow" onClick={() => navigate("/claims/history")}>
              <div className="icon">📊</div>
              <div>
                <h3>Claims History</h3>
                <p>View your past claims</p>
              </div>
              <div className="arrow">→</div>
            </div>

        <div className="action-box saved-drafts" onClick={() => navigate("/drafts")}>
          <div className="icon">💾</div>
          <div>
            <h3>Saved Drafts</h3>
            <p>Save your claims as drafts</p>
          </div>
          <div className="arrow">→</div>
        </div>
  <div className="action-box light-purple">
              <div className="icon">📘</div>
              <div>
                <h3>Policy Guidelines</h3>
                <p>Understand your benefits</p>
              </div>
              <div className="arrow">→</div>
            </div>
          {canViewTasks && (
  <div className="action-box light-orange" onClick={() => navigate("/task")}>
    <div className="icon">🧾</div>
    <div>
      <h3>My Tasks</h3>
      <p>View all claim tasks</p>
    </div>
    <div className="arrow">→</div>
  </div>
)}


          
          </div>
        </div>
      
      
       </Sidebar>
        );
}

export default ClaimsPage;
