import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

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
const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
  const [isContractOpen, setIsContractOpen] = useState(false);
 const [canViewTasks, setCanViewTasks] = useState(false);
const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};
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

  useEffect(() => {
    if (employeeId) {
      fetch(`/profile/${employeeId}`)
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
  }, [employeeId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleProfileMenu = () => setProfileOpen(!profileOpen);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const handleEditProfile = () => {
    setProfileOpen(false);
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("name", employeeName);
    formData.append("profilePic", file);

    try {
      const res = await fetch(`/profile/update/${employeeId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (data.profilePic) {
        setProfilePic(data.profilePic);
        localStorage.setItem("employeeProfilePic", data.profilePic);
        setSuccessMessage("Profile picture updated successfully!");
        setTimeout(() => {
          setSuccessMessage("");
          setProfileOpen(false);
        }, 2000);
      } else {
        alert("Failed to update profile picture: no profilePic returned.");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Error uploading profile picture. See console for details.");
    }
  };

  // --- MyTeam3 Component Logic Starts Here ---
  const fetchManagerRequests = async () => {
    try {
      const res = await fetch(`/api/travel/manager/pending/${employeeId}`);
      const data = await res.json();
      setPendingRequests(data);
    } catch (err) {
      console.error("Error fetching manager pending requests", err);
    }
  };

  const fetchAdminRequests = async () => {
    try {
      const res = await fetch(`/api/travel/admin/assigned-requests/${employeeId}`);
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
      const res = await fetch(`/api/travel/approve/${id}?${params}`, {
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

      const res = await fetch(`/api/travel/reject/${id}?${params}`, {
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
      const res = await fetch(`/api/travel/admin/upload-pdfs/${requestId}`, {
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
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img
              src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")}
              alt="office"
              className="office-vng"
            />
            <img
              src={require("../assets/gg_move-left.png")}
              alt="collapse"
              className="toggle-btn"
              onClick={toggleSidebar}
              style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }}
            />
          <h3>
            <Link
              to="/dashboard"
              className="side"
              style={{
                textDecoration: 'none',
                color:'#00b4c6',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                Home
              </span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home0" className="side" style={{ textDecoration: 'none', color: '#00b4c6'}}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Claims</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home1" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Time Sheet</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home2" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Employee Handbook</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home3" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Employee Directory</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home4" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Exit Management</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home5" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Holiday Calendar</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home6" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Helpdesk</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home7" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Leaves</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home9" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Pay slips</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home10" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Performance</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home11" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Training</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home12" className="side" style={{ textDecoration: 'none',  color: 'white'  }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Travel</span>
            </Link>
          </h3>
          {allowedUsers.includes(employeeId) && (
                                                <>
                                                  <h3 onClick={toggleContractMenu} style={{ cursor: 'pointer' }}>
                                                    <span className="side" style={{  color:'#00b4c6' }}>
                                                      Contract Management {isContractOpen ? '▾' : '▸'}
                                                    </span>
                                                  </h3>
                                              
                                                  {isContractOpen && (
                                                    <ul style={{ listStyle: 'disc', paddingLeft: '16px', marginTop: '4px' ,}}>
                                                      <li style={{ marginBottom: '4px' ,marginLeft:'60px'}}>
                                                        <Link
                                                          to="/customers"
                                                          style={{
                                                            textDecoration: 'none',
                                                           color:'#00b4c6',
                                                            fontSize: '14px',
                                                            display: 'block',
                                                            padding: '4px 0',
                                                          }}
                                                          onMouseOver={(e) => (e.target.style.color = '#fff')}
                                                          onMouseOut={(e) => (e.target.style.color = '#00b4c6')}
                                                        >
                                                          Customers
                                                        </Link>
                                                      </li>
                                                      <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                                                        <Link
                                                          to="/sows"
                                                          style={{
                                                            textDecoration: 'none',
                                                           color:'#00b4c6',
                                                            fontSize: '14px',
                                                            display: 'block',
                                                            padding: '4px 0',
                                                          }}
                                                          onMouseOver={(e) => (e.target.style.color = '#fff')}
                                                          onMouseOut={(e) => (e.target.style.color = '#00b4c6')}
                                                        >
                                                          SOWs
                                                        </Link>
                                                      </li>
                                                      <li style={{ marginBottom: '4px' ,marginLeft:'60px'}}>
                                                        <Link
                                                          to="/projects"
                                                          style={{
                                                            textDecoration: 'none',
                                                           color:'#00b4c6',
                                                            fontSize: '14px',
                                                            display: 'block',
                                                            padding: '4px 0',
                                                          }}
                                                          onMouseOver={(e) => (e.target.style.color = '#fff')}
                                                          onMouseOut={(e) => (e.target.style.color = '#00b4c6')}
                                                        >
                                                          Projects
                                                        </Link>
                                                      </li>
                                                      <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                                                        <Link
                                                          to="/allocation"
                                                          style={{
                                                            textDecoration: 'none',
                                                           color:'#00b4c6',
                                                            fontSize: '14px',
                                                            display: 'block',
                                                            padding: '4px 0',
                                                          }}
                                                          onMouseOver={(e) => (e.target.style.color = '#fff')}
                                                          onMouseOut={(e) => (e.target.style.color = '#00b4c6')}
                                                        >
                                                          Allocation
                                                        </Link>
                                                      </li>
                                                    </ul>
                                                  )}
                                                </>
                                              )}
                  
                  </>
        ) : (
          <div className="collapsed-wrapper">
            <img
              src={require("../assets/Group.png")}
              alt="expand"
              className="collapsed-toggle"
              onClick={toggleSidebar}
            />
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({employeeId})</h2>

          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <img
              src={require('../assets/Vector.png')}
              alt="Notifications"
              className="icon"
              style={{ cursor: 'pointer' }}
            />

            {/* Profile picture with dropdown */}
            <div className="profile-wrapper" style={{ position: 'relative' }}>
              <img
                src={profilePic}
                alt="Profile"
                className="profile-pic"
                onClick={toggleProfileMenu}
                style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              {profileOpen && (
                <div
                  ref={profileDropdownRef}
                  className="profile-dropdown"
                  style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    borderRadius: '4px',
                    zIndex: 1000,
                    width: '150px',
                  }}
                >
                  <button
                    onClick={handleEditProfile}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}

              {successMessage && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '5px',
                  backgroundColor: '#4BB543',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  zIndex: 1100,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {successMessage}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>

        <hr className="divider-line" />
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
    </div>
  );
}

export default MyTeam3;
