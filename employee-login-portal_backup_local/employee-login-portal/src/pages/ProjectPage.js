import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

function SowsAndProjects() {
  const [sows, setSows] = useState([]);
  const [selectedSowId, setSelectedSowId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  
  const selectedSow = sows.find((sow) => sow.sowId.toString() === selectedSowId?.toString());

const sowStartDate = selectedSow?.sowStartDate
  ? new Date(selectedSow.sowStartDate).toISOString().split("T")[0]
  : null;

const sowEndDate = selectedSow?.sowEndDate
  ? new Date(selectedSow.sowEndDate).toISOString().split("T")[0]
  : null;

  const [projectFormData, setProjectFormData] = useState({
    projectName: "",
    projectStartDate: "",
    projectEndDate: "",
    totalEffort: "",
    totalCost: "",
    manager: "",
    reviewer: "",
    hr: "",
    finance: "",
    admin: "",
  });
const resetForm = () => {
  setProjectFormData({
    projectName: '',
    projectStartDate: '',
    projectEndDate: '',
    totalEffort: '',
    totalCost: '',
    manager: '',
    reviewer: '',
    hr: '',
    finance: '',
    admin: '',
  });
};


const handleCloseModal = () => {
  resetForm();
  setShowProjectForm(false);
};

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
  const [isContractOpen, setIsContractOpen] = useState(false);
const allowedUsers = ["H100646", "H100186", "H100118", "EMP111"];
const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};
  // Fetch all SOWs on component mount
  useEffect(() => {
    fetch("http://3.7.139.212:8080/api/sows")
      .then((res) => res.json())
      .then((data) => setSows(data))
      .catch((err) => console.error("Error fetching SOWs:", err));
  }, []);

  // Fetch projects when a SOW is selected
  useEffect(() => {
    if (!selectedSowId) {
      setProjects([]);
      return;
    }
    fetch(`http://3.7.139.212:8080/api/projects/sow/${selectedSowId}`)
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.error("Error fetching projects:", err));
  }, [selectedSowId]);

  // Fetch updated profile info on mount (optional but recommended)
  useEffect(() => {
    if (employeeId) {
      fetch(`http://3.7.139.212:8080/profile/${employeeId}`)
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

  // Close profile dropdown when clicking outside
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

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProjectFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit new project
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSowId) {
      alert("Please select a SOW first.");
      return;
    }

    const newProject = {
      ...projectFormData,
      sowId: selectedSowId,
    };

    fetch("http://3.7.139.212:8080/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create project");
        return res.json();
      })
      .then((createdProject) => {
        setProjects((prev) => [...prev, createdProject]);
        setShowProjectForm(false);
        setProjectFormData({
          projectName: "",
          projectStartDate: "",
          projectEndDate: "",
          totalEffort: "",
          totalCost: "",
          manager: "",
          reviewer: "",
          hr: "",
          finance: "",
          admin: "",
        });
      })
      .catch((err) => alert(err.message));
  };

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
      const res = await fetch(`http://3.7.139.212:8080/profile/update/${employeeId}`, {
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
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) return ""; // handle invalid date
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};


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
                  <Link to="/dashboard" className="side" style={{ textDecoration: 'none',  color:'#00b4c6'}}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px',  color:'#00b4c6'}}>
                      Home
                     
                    </span>
                  </Link>
                </h3>
                <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Claims</Link></h3>
                <h3><Link to="/home1" className="side" style={{ textDecoration: 'none', color:'#00b4c6' }}>Time Sheet</Link></h3>
                <h3><Link to="/home2" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Employee Handbook</Link></h3>
                <h3><Link to="/home3" className="side" style={{ textDecoration: 'none', color:'#00b4c6' }}>Employee Directory</Link></h3>
                <h3><Link to="/home4" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Exit Management</Link></h3>
                <h3><Link to="/home5" className="side" style={{ textDecoration: 'none', color:'#00b4c6' }}>Holiday Calendar</Link></h3>
                <h3><Link to="/home6" className="side" style={{ textDecoration: 'none',color:'#00b4c6' }}>Helpdesk</Link></h3>
                <h3><Link to="/home7" className="side" style={{ textDecoration: 'none',color:'#00b4c6' }}>Leaves</Link></h3>
              
                <h3><Link to="/home9" className="side" style={{ textDecoration: 'none',  color:'#00b4c6'}}>Pay slips</Link></h3>
                <h3><Link to="/home10" className="side" style={{ textDecoration: 'none', color:'#00b4c6'}}>Performance</Link></h3>
                <h3><Link to="/home11" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Training</Link></h3>
                <h3><Link to="/home12" className="side" style={{ textDecoration: 'none', color:'#00b4c6' }}>Travel</Link></h3>
          {allowedUsers.includes(employeeId) && (
                 <>
                   <h3 onClick={toggleContractMenu} style={{ cursor: 'pointer' }}>
                     <span className="side" style={{ color:'white' }}>
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
                         color:'rgba(255, 255, 255, 0.7)',
                             fontSize: '14px',
                             display: 'block',
                             padding: '4px 0',
                           }}
                           onMouseOver={(e) => (e.target.style.color = '#fff')}
                           onMouseOut={(e) => (e.target.style.color = 'rgba(255, 255, 255, 0.7)')}
                         >
                           Customers
                         </Link>
                       </li>
                       <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                         <Link
                           to="/sows"
                           style={{
                             textDecoration: 'none',
                               color:'rgba(255, 255, 255, 0.7)',
                             fontSize: '14px',
                             display: 'block',
                             padding: '4px 0',
                           }}
                           onMouseOver={(e) => (e.target.style.color = '#fff')}
                           onMouseOut={(e) => (e.target.style.color = 'rgba(255, 255, 255, 0.7)')}
                         >
                           SOWs
                         </Link>
                       </li>
                       <li style={{ marginBottom: '4px' ,marginLeft:'60px'}}>
                         <Link
                           to="/projects"
                           style={{
                             textDecoration: 'none',
                            color:'white',
                             fontSize: '14px',
                             display: 'block',
                             padding: '4px 0',
                           }}
                           onMouseOver={(e) => (e.target.style.color = '#fff')}
                           onMouseOut={(e) => (e.target.style.color = 'white')}
                         >
                           Projects
                         </Link>
                       </li>
                       <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                         <Link
                           to="/allocation"
                           style={{
                             textDecoration: 'none',
                          color:'rgba(255, 255, 255, 0.7)',
                             fontSize: '14px',
                             display: 'block',
                             padding: '4px 0',
                           }}
                           onMouseOver={(e) => (e.target.style.color = '#fff')}
                           onMouseOut={(e) => (e.target.style.color = 'rgba(255, 255, 255, 0.7)')}
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

              {/* Success message */}
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

              {/* Hidden file input */}
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

        {/* Content from SowsAndProjects */}
        <div style={{ padding: "20px", backgroundColor: "#f7f8fa" }}>

    <h2>
  <span style={{ fontWeight: 'bold' }}>SOW:</span>{' '}
  {selectedSowId && (
    <span style={{ fontWeight: 'normal', fontSize: '0.9em'}}>
      {sows.find((sow) => sow.sowId.toString() === selectedSowId.toString())?.sowName} (SOW{selectedSowId})
    </span>
  )}
</h2>

<div style={{ 
  marginBottom: "15px", 
  display: "flex", 
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "10px",
  maxWidth: 600,  // limit the container width to avoid full width stretch
  marginLeft: "auto",  // push it to the right side
  marginRight: 20 // small right margin if you want
}}>
  {/* Label */}
  <label 
    htmlFor="sow-select" 
    style={{ 
      fontWeight: "bold", 
      lineHeight: 1,
      whiteSpace: "nowrap"
    }}
  >
    Select SOW:
  </label>

  {/* Dropdown */}
  <select
    id="sow-select"
    value={selectedSowId || ""}
    onChange={(e) => setSelectedSowId(e.target.value)}
    style={{ 
      padding: "8px 10px", 
      fontSize: 16, 
      width: 220,  // fix the width here
      maxWidth: "100%", // responsive fallback
      boxSizing: "border-box"
    }}
  >
        <option value="">-- Select a sow --</option>
    {sows.map((sow) => (
      <option key={sow.sowId} value={sow.sowId}>
        {sow.sowName}
      </option>
    ))}
  </select>

  {/* Add New Project Button */}
  <button
    onClick={() => {
      if (!selectedSowId) {
        alert("Please select a SOW before adding a project.");
        return;
      }
      setShowProjectForm(true);
    }}
    style={{
      backgroundColor: "#28a745",
      color: "white",
      border: "none",
      padding: "10px 20px",
      fontSize: 16,
      cursor: "pointer",
      borderRadius: 3,
      height: 40,
    }}
  >
    Add New Project
  </button>
</div>





          {/* Projects Table */}
          <div style={{ marginTop: 20 }}>
            <h3>Projects</h3>
            {projects.length === 0 ? (
              <p>No projects found for this SOW.</p>
            ) : (
              <div
  style={{
    maxHeight: "calc(100vh - 300px)",
    overflowY: "scroll",
    border: "1px solid #ccc",
    borderRadius: 4,
    backgroundColor: "white",
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE and Edge
  }}
>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      backgroundColor: "white",
      marginTop: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}
  >
    <thead>
      <tr>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Project ID</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Project Name</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Start Date</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>End Date</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Total Effort (PD)</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Total Cost</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Manager</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Reviewer</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>HR</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Finance</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Admin</th>
      </tr>
    </thead>

    <tbody>
      {projects
        .slice()
        .sort((a, b) => b.projectId - a.projectId) // 👈 newest projects first
        .map((project) => (
          <tr key={project.projectId}>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {`P${project.projectId}`}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd" }}>{project.projectName}</td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {formatDate(project.projectStartDate)}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {formatDate(project.projectEndDate)}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {project.totalEffort}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {project.totalCost}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {project.manager}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {project.reviewer}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {project.hr}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {project.finance}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {project.admin}
            </td>
          </tr>
        ))}
    </tbody>
  </table>
</div>
            )}
          </div>

          {/* Add New Project Modal/Form */}
          {showProjectForm && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.3)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
              onClick={() => setShowProjectForm(false)}
            >

            
<form
  onClick={(e) => e.stopPropagation()}
  onSubmit={handleSubmit}
  style={{
    backgroundColor: "white",
    padding: "15px 20px",
    borderRadius: 8,
    maxWidth: 550,
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
    margin: "auto",
    position: "relative", // Important for positioning the close button inside form
  }}
>
  {/* Close button */}
  <button
  type="button"
  onClick={() => {
    resetForm();              // Clear form data
    setShowProjectForm(false); // Close form
  }}
  style={{
    position: "absolute",
    top: 12,
    right: 12,
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
    fontWeight: "bold",
    color: "#333",
    padding: 0,
    lineHeight: 1,
  }}
  aria-label="Close form"
>
  ×
</button>

  <h3 style={{ marginBottom: 15 }}>Add New Project</h3>



  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px" }}>
    <label style={{ flex: "1 1 40%", minWidth: 400 }}>
      Project Name *
      <input
        required
        name="projectName"
        value={projectFormData.projectName}
        onChange={handleInputChange}
        type="text"
        style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
      />
    </label>

    <label style={{ flex: "1 1 40%", minWidth: 200 }}>
  Start Date *
  <input
    required
    name="projectStartDate"
    value={projectFormData.projectStartDate}
    onChange={handleInputChange}
    type="date"
    min={sowStartDate}
    max={sowEndDate}
    style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
  />
</label>


    <label style={{ flex: "1 1 40%", minWidth: 200 }}>
  End Date *
  <input
    required
    name="projectEndDate"
    value={projectFormData.projectEndDate}
    onChange={handleInputChange}
    type="date"
    min={sowStartDate}
    max={sowEndDate}
    style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
  />
</label>

     <label style={{ flex: "1 1 40%", minWidth: 200 }}>
      Total Cost *
      <input
        required
        name="totalCost"
        value={projectFormData.totalCost}
        onChange={handleInputChange}
        type="number"
        min={0}
        step="0.01"
        style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
      />
    </label>

    <label style={{ flex: "1 1 40%", minWidth: 200 }}>
      Total Effort *
      <input
        required
        name="totalEffort"
        value={projectFormData.totalEffort}
        onChange={handleInputChange}
        type="number"
        min={0}
        style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
      />
    </label>

   

<label style={{ flex: "1 1 40%", minWidth: 200 }}>
  Manager ID *
  <input
    required
    name="manager"
    value={projectFormData.manager}
    onChange={handleInputChange}
    type="text"
    style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
  />
</label>

<label style={{ flex: "1 1 40%", minWidth: 200 }}>
  Reviewer ID *
  <input
    required
    name="reviewer"
    value={projectFormData.reviewer}
    onChange={handleInputChange}
    type="text"
    style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
  />
</label>

<label style={{ flex: "1 1 40%", minWidth: 200 }}>
  HR ID *
  <input
    required
    name="hr"
    value={projectFormData.hr}
    onChange={handleInputChange}
    type="text"
    style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
  />
</label>

<label style={{ flex: "1 1 40%", minWidth: 200 }}>
  Finance ID *
  <input
    required
    name="finance"
    value={projectFormData.finance}
    onChange={handleInputChange}
    type="text"
    style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
  />
</label>

<label style={{ flex: "1 1 40%", minWidth: 200 }}>
  Admin ID *
  <input
    required
    name="admin"
    value={projectFormData.admin}
    onChange={handleInputChange}
    type="text"
    style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
  />
</label>

  </div>

  <div style={{ textAlign: "right", marginTop: 15 }}>
    <button
      type="submit"
      style={{
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        padding: "6px 14px",
        marginRight: 10,
        borderRadius: 4,
        cursor: "pointer",
        fontSize: "0.9rem",
      }}
    >
      Submit
    </button>
    <button
type="button"
  onClick={() => {
    resetForm();              // Clear form data
    setShowProjectForm(false); // Close form
  }}
      style={{
        backgroundColor: "#6c757d",
        color: "white",
        border: "none",
        padding: "6px 14px",
        borderRadius: 4,
        cursor: "pointer",
        fontSize: "0.9rem",
      }}
    >
      Cancel
    </button>
  </div>
</form>

         </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SowsAndProjects;
