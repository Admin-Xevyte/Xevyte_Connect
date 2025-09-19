import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClaimsPage.css';
import Sidebar from './Sidebar.js';
import ClaimsChart from './ClaimsChart'; // This is already present

function DesignSummary() {
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
      fetch(`http://localhost:8082/claims/assigned-ids/${employeeId}`)
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
      fetch(`http://localhost:8082/claims/summary/${employeeId}`)
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
    <div style={{ marginTop: "40px" }}>
      <h2 className="title">Your Claim Updates</h2>
      {/* <div
        className="quick-actions-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
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
            display: "contents",
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
              background: "#f3ecff",
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
              background: "#e4f8e9",
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
              background: "#f5f5f5",
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
            <div className="icon" style={{ cursor: 'default' }}>₹</div>
            <div>
              <h3>Paid Amount</h3>
              <p>₹{Math.floor(summary.paidAmount)}</p>
            </div>
          </div>
        </div>
      </div> */}
      
      {/* New section for the chart */}
      <div style={{ 
        width: '100%', 
        margin: 'auto', 
        padding: '20px', 
         height: 'calc(100vh - 300px)'
      }}>
  
        <ClaimsChart 
          approved={summary.approved} 
          rejected={summary.rejected} 
          totalClaims={summary.totalClaims} // Add this line
        paidAmount={summary.paidAmount}  
        />
      </div>
    </div>
  );
}

export default DesignSummary;
