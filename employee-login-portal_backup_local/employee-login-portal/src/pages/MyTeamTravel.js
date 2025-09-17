import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
function MyTeam3() {
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
const [isManager, setIsManager] = useState(false);
const [isAdmin, setIsAdmin] = useState(false);

  const [roleView, setRoleView] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});

 const [canViewTasks, setCanViewTasks] = useState(false);

  useEffect(() => {
  if (employeeId) {
    fetch(`http://3.7.139.212:8080/access/assigned-ids/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        setIsManager(data.manager);
        setIsAdmin(data.admin);
      })
      .catch(err => {
        console.error("Error fetching assigned roles:", err);
      });
  }
}, [employeeId]);




 
  // --- MyTeam3 Component Logic Starts Here ---
  const fetchManagerRequests = async () => {
    try {
      const res = await fetch(`http://3.7.139.212:8080/api/travel/manager/pending/${employeeId}`);
      const data = await res.json();
      setPendingRequests(data);
    } catch (err) {
      console.error("Error fetching manager pending requests", err);
    }
  };

  const fetchAdminRequests = async () => {
    try {
      const res = await fetch(`http://3.7.139.212:8080/api/travel/admin/assigned-requests/${employeeId}`);
      const data = await res.json();
      setPendingRequests(data);
    } catch (err) {
      console.error("Error fetching admin assigned requests", err);
    }
  };

  const fetchPendingRequests = () => {
    if (roleView === "Manager") fetchManagerRequests();
    else if (roleView === "Admin") fetchAdminRequests();
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [roleView]);

  const handleApprove = async (id) => {
    try {
      const params = new URLSearchParams({ managerId: employeeId });
      const res = await fetch(`http://3.7.139.212:8080/api/travel/approve/${id}?${params}`, {
        method: "PUT",
      });
      if (res.ok) {
        alert("Request approved!");
        fetchPendingRequests();
      } else {
        alert("Failed to approve request. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving request.");
    }
  };

  const handleReject = async (id) => {
    let remarks = prompt("Enter rejection reason (minimum 10 characters):");
    if (remarks === null) return;
    remarks = remarks.trim();
    if (remarks.length < 10) {
      alert("Rejected reason must be at least 10 characters.");
      return;
    }

    try {
      const params = new URLSearchParams({
        managerId: employeeId,
        rejectedReason: remarks,
      });

      const res = await fetch(`http://3.7.139.212:8080/api/travel/reject/${id}?${params}`, {
        method: "PUT",
      });

      if (res.ok) {
        alert("Request rejected!");
        fetchPendingRequests();
      } else {
        alert("Failed to reject request. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting request.");
    }
  };

  const handleFileChange = (requestId, event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles((prev) => ({
      ...prev,
      [requestId]: files,
    }));
  };

  const handleRemoveFile = (requestId, index) => {
    setSelectedFiles((prev) => {
      const updatedFiles = [...(prev[requestId] || [])];
      updatedFiles.splice(index, 1);
      return {
        ...prev,
        [requestId]: updatedFiles,
      };
    });
  };

  const handleUpload = async (requestId) => {
    const files = selectedFiles[requestId];
    const MAX_SIZE = 5 * 1024 * 1024;
    let totalSize = 0;

    if (!files || files.length === 0) {
      alert("Kindly attach the booking details to complete your submission.");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const invalidFiles = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(file.name);
      }
      totalSize += file.size;
    }

    if (invalidFiles.length > 0) {
      alert(`Invalid files:\n${invalidFiles.join("\n")}\nOnly PDF, JPG, and PNG allowed.`);
      return;
    }

    if (totalSize > MAX_SIZE) {
      alert("Total file size exceeds 5MB limit.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch(`http://3.7.139.212:8080/api/travel/admin/upload-pdfs/${requestId}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Booking details uploaded successfully.");
        setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
        setSelectedFiles((prev) => {
          const copy = { ...prev };
          delete copy[requestId];
          return copy;
        });
      } else {
        const error = await res.text();
        alert("Upload failed: " + error);
      }
    } catch (err) {
      alert("Error uploading files: " + err.message);
    }
  };

  const splitIntoRows = (text, maxLength) => {
    if (!text) return [];
    const lines = [];
    for (let i = 0; i < text.length; i += maxLength) {
      lines.push(text.slice(i, i + maxLength));
    }
    return lines;
  };
  // --- MyTeam3 Component Logic Ends Here ---

  return (
       <Sidebar>
   

      <div className="main-content">
    

      <button
    onClick={() => navigate(-1)}
    style={{
        padding: "8px 16px", // Slightly reduced padding
         backgroundColor: "#f0f0f0",
       color: "#333",
       fontSize: "16px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      cursor: "pointer",
      margin: "20px 0 20px 0", // Top and bottom margins only
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        transition: "background-color 0.3s ease",
        width: "fit-content", // Make width only as big as content
        display: "block", // Ensure it respects margin auto if needed
    }}
>
    ⬅ Back
</button>
         <div style={{ padding: "20px" }}>
      <h2>View Pending Requests</h2>

      {!roleView && (
        <div style={{ display: "flex", gap: "20px" }}>
          {isManager && (
            <div
              onClick={() => setRoleView("Manager")}
              style={{
                border: "1px solid #ccc",
                padding: "20px",
                cursor: "pointer",
                borderRadius: "8px",
                backgroundColor: "#f2f2f2",
              }}
            >
              View as Manager
            </div>
          )}

          {isAdmin && (
            <div
              onClick={() => setRoleView("Admin")}
              style={{
                border: "1px solid #ccc",
                padding: "20px",
                cursor: "pointer",
                borderRadius: "8px",
                backgroundColor: "#f2f2f2",
              }}
            >
              View as Admin
            </div>
          )}
        </div>
      )}

      {roleView && (
        <div
          style={{
            height: "calc(100vh - 200px)",
            overflowY: "auto",
            border: "1px solid #ccc",
            marginTop: "20px",
          }}
        >
          <h3>Pending Travel Requests ({roleView})</h3>

          {pendingRequests.length === 0 ? (
            <p style={{ padding: "10px" }}>No pending requests found.</p>
          ) : (
            <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1, color: "black" }}>
                <tr>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Employee ID</th>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Employee Name</th>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Category</th>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Mode</th>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Depart</th>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Return</th>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>From</th>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>To</th>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Accommodation</th>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Advance</th>
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Purpose</th>
                  {roleView === "Admin" && (
                    <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Upload Ticket*</th>
                  )}
                  <th style={{ backgroundColor: "#f0f0f0", color: "black" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.employeeId}</td>
                    <td>{req.employeeName}</td>
                    <td>{req.category}</td>
                    <td>{req.modeOfTravel}</td>
                    <td>{new Date(req.departureDate).toLocaleDateString("en-GB").replace(/\//g, "-")}</td>
                    <td>{req.returnDate ? new Date(req.returnDate).toLocaleDateString("en-GB").replace(/\//g, "-") : ""}</td>
                    <td>{req.fromLocation}</td>
                    <td>{req.toLocation}</td>
                    <td>{req.accommodationRequired}</td>
                    <td>{req.advanceRequired}</td>
                    <td style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {splitIntoRows(req.remarks, 50).map((row, idx) => (
                        <div key={idx}>{row}</div>
                      ))}
                    </td>

                    {roleView === "Admin" && (
                      <td>
                        <label htmlFor={`file-upload-${req.id}`} style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          backgroundColor: "#6e7073ff",
                          color: "white",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.9em",
                        }}>
                          Choose File
                        </label>
                        <input
                          id={`file-upload-${req.id}`}
                          type="file"
                          accept="application/pdf,image/jpeg,image/png"
                          multiple
                          style={{ display: "none" }}
                          onChange={(e) => handleFileChange(req.id, e)}
                        />
                        <div style={{ marginTop: "5px", fontSize: "0.9em", color: "#333" }}>
                          {selectedFiles[req.id] && selectedFiles[req.id].length > 0
                            ? selectedFiles[req.id].map((file, index) => {
                                const truncated = file.name.length > 10 ? file.name.slice(0, 10) + "..." : file.name;
                                return (
                                  <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>{truncated}</div>
                                    <span onClick={() => handleRemoveFile(req.id, index)} style={{ color: "red", cursor: "pointer" }}>
                                      &times;
                                    </span>
                                  </div>
                                );
                              })
                            : "No file selected"}
                        </div>
                      </td>
                    )}

                    <td>
                      {roleView === "Manager" ? (
                        <>
                          <button onClick={() => handleApprove(req.id)} style={{
                            backgroundColor: "green",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            cursor: "pointer",
                            borderRadius: "4px",
                            marginBottom: "8px",
                          }}>
                            Approve
                          </button>
                          <br />
                          <button onClick={() => handleReject(req.id)} style={{
                            backgroundColor: "red",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            cursor: "pointer",
                            borderRadius: "4px",
                            width: "75px",
                          }}>
                            Reject
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleUpload(req.id)} style={{
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          cursor: "pointer",
                          borderRadius: "4px",
                        }}>
                          Confirm
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
      </div>
</Sidebar>
  );
}

export default MyTeam3;
