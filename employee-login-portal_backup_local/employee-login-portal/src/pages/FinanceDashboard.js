import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import './FinanceDashboard.css';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';

function FinanceDashboard() {
  const [claims, setClaims] = useState([]);
  const [originalClaims, setOriginalClaims] = useState([]);
  const [employeeId, setEmployeeId] = useState(null);
  const [role, setRole] = useState(null);
  const [employeeName, setEmployeeName] = useState(null);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require("../assets/SKKKK.JPG.jpg"));
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const storedId = localStorage.getItem("employeeId");
    const storedName = localStorage.getItem("employeeName");
    const storedRole = localStorage.getItem("role");

    setEmployeeId(storedId);
    setRole(storedRole);
    setEmployeeName(storedName);

    if (storedId) {
      fetchClaims(storedId);
      fetch(`http://3.7.139.212:8080/profile/${storedId}`)
        .then(res => res.json())
        .then(data => {
          if (data.profilePic) {
            setProfilePic(data.profilePic);
            localStorage.setItem("employeeProfilePic", data.profilePic);
          }
          if (data.name) {
            setEmployeeName(data.name);
            localStorage.setItem("employeeName", data.name);
          }
        })
        .catch(err => console.error("Failed to fetch profile info:", err));
    }
  }, []);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = originalClaims.filter(claim => {
        const matchesClaimId = String(claim.id).toLowerCase().includes(lowerCaseSearchTerm);
        const matchesEmployeeId = String(claim.employeeId).toLowerCase().includes(lowerCaseSearchTerm);
        const matchesEmployeeName = claim.name && claim.name.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesCategory = claim.category && claim.category.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesBusinessPurpose = claim.businessPurpose && claim.businessPurpose.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesAdditionalNotes = claim.additionalNotes && claim.additionalNotes.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesAmount = String(claim.amount).toLowerCase().includes(lowerCaseSearchTerm);
        const matchesDescription = claim.expenseDescription && claim.expenseDescription.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesExpenseDate = claim.expenseDate && claim.expenseDate.includes(searchTerm);
        const matchesSubmittedDate = new Date(claim.submittedDate).toLocaleString().toLowerCase().includes(lowerCaseSearchTerm);

        return (
          matchesClaimId ||
          matchesEmployeeId ||
          matchesEmployeeName ||
          matchesCategory ||
          matchesBusinessPurpose ||
          matchesAdditionalNotes ||
          matchesAmount ||
          matchesDescription ||
          matchesExpenseDate ||
          matchesSubmittedDate
        );
      });
      setClaims(filtered);
    } else {
      setClaims(originalClaims);
    }
  }, [searchTerm, originalClaims]);

  const fetchClaims = (financeId) => {
    setLoading(true);
    axios
      .get(`http://3.7.139.212:8080/claims/finance/${financeId}`)
      .then((response) => {
        const claims = response.data;
        const sortedClaims = claims.sort((a, b) => b.id - a.id);
        setClaims(sortedClaims);
        setOriginalClaims(sortedClaims);
        console.log("Fetched and sorted assigned claims:", sortedClaims);
      })
      .catch((err) => {
        console.error("Error fetching claims:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleApprove = async (claimId) => {
    try {
      await axios.post(`http://3.7.139.212:8080/claims/approve/${claimId}?role=Finance`);
      
      setClaims(prevClaims => prevClaims.filter(claim => claim.id !== claimId));
      setOriginalClaims(prevClaims => prevClaims.filter(claim => claim.id !== claimId));

      setSuccessMessage(`Claim ${claimId} approved successfully.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error approving claim:", error);
    }
  };

  const handleRejectClick = (claimId) => {
    setSelectedClaimId(claimId);
    setShowReasonBox(true);
  };

  const handleRejectSubmit = async () => {
    if (rejectionReason.trim().length < 10) {
      alert("Rejection reason must be at least 10 characters long.");
      return;
    }

    try {
      await axios.post(
        `http://3.7.139.212:8080/claims/reject/${selectedClaimId}?role=Finance&reason=${encodeURIComponent(rejectionReason)}`
      );

      setClaims(prevClaims => prevClaims.filter(claim => claim.id !== selectedClaimId));
      setOriginalClaims(prevClaims => prevClaims.filter(claim => claim.id !== selectedClaimId));

      setRejectionReason("");
      setShowReasonBox(false);
      
      setSuccessMessage(`Claim ${selectedClaimId} rejected successfully.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error rejecting claim:", error);
    }
  };

  const handleDownloadReceipt = (id, receiptName) => {
    axios
      .get(`http://3.7.139.212:8080/claims/receipt/${id}`, { responseType: "blob" })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", receiptName || "receipt");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error("Download error:", err));
  };

  return (
    <div className="manager-dashboard">
      {loading ? null : !employeeId ? (
        <p>Please login or provide an employee ID.</p>
      ) : originalClaims.length === 0 ? (
        <p>You do not have any assigned claims at the moment.</p>
      ) : claims.length === 0 ? (
        <p>No claims found matching your search criteria.</p>
      ) : (
        <div
          className="table-wrapper"
          style={{
            maxHeight: "calc(100vh - 300px)",
            overflowY: "auto",
          
          }}
        >
          <table className="status-table">
            <thead>
              <tr>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Claim ID</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Employee ID</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Employee Name</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Category</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Amount</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Description</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Expense Date</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Receipt</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Submitted Date</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Actions</th>
              </tr>
            </thead>
           <tbody style={{  backgroundColor:'#f7f9fa',}}>
              {claims.map(claim => (
                <tr key={claim.id}>
                  <td>{claim.id}</td>
                  <td>{claim.employeeId}</td>
                  <td>{claim.name}</td>
                  <td>{claim.category}</td>
                  <td>{claim.amount}</td>
                  <td>{claim.expenseDescription}</td>
                  <td>{new Date(claim.expenseDate).toLocaleDateString('en-GB').replaceAll('/', '-')}</td>
                  <td>
                    {claim.receiptName ? (
                      <button
                        onClick={() => handleDownloadReceipt(claim.id, claim.receiptName)}
                        style={{
                          cursor: "pointer",
                          color: "blue",
                          textDecoration: "underline",
                          backgroundColor: "transparent",
                          border: "none",
                          padding: 0,
                        }}
                      >
                        <span title={claim.receiptName}>
                          {claim.receiptName.length > 10
                            ? `${claim.receiptName.substring(0, 10)}...`
                            : claim.receiptName}
                        </span>
                      </button>
                    ) : (
                      "No Receipt"
                    )}
                  </td>
                  <td>{formatDate(claim.submittedDate)}</td>
                               <td>
  <div
    className="action-buttons"
    style={{ display: "flex", gap: "8px" }}
  >
    <button
      type="button"
      className="approve-btn"
      onClick={(e) => {
        e.preventDefault();
        handleApprove(claim.id);
      }}
      style={{
        width: "90px",       // 👈 fixed width
        padding: "6px 0",    // uniform padding
        textAlign: "center",
      }}
    >
      Approve
    </button>
    <button
      type="button"
      className="reject-btn"
      onClick={(e) => {
        e.preventDefault();
        handleRejectClick(claim.id);
      }}
      style={{
        width: "90px",       // 👈 same width
        padding: "6px 0",
        textAlign: "center",
      }}
    >
      Reject
    </button>
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showReasonBox && (
        <div className="reason-popup">
          <h4>Enter Rejection Reason</h4>
          <textarea
            rows="4"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection"
          />
          <p style={{ fontSize: "0.9em", color: "gray" }}>Minimum 10 characters required</p>
          <button onClick={handleRejectSubmit} style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: 'pointer'
          }}>Submit</button>
          <button
            onClick={() => setShowReasonBox(false)}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default FinanceDashboard;
