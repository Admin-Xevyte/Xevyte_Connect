import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import './Dashboard.css';

// The merged and refactored component
const ProjectAllocationsDashboard = () => {
  // State for the dashboard layout
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const allowedUsers = ["H100646", "H100186", "H100118", "EMP111"];
  const navigate = useNavigate();
  const [isContractOpen, setIsContractOpen] = useState(false);
const [validationErrors, setValidationErrors] = React.useState({});
const [allocationErrors, setAllocationErrors] = React.useState([]);

const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) return ""; // Return empty if date is invalid
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

  // State for the AllocationManager functionality
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [allocations, setAllocations] = useState([]);
  const selectedProject = projects.find(p => p.projectId === Number(selectedProjectId));
  const [formData, setFormData] = useState({
  employeeIds: "", // comma-separated input from user
  startDate: "",
  endDate: "",
});

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all projects on mount
  useEffect(() => {
    setLoadingProjects(true);
    axios
      .get("/api/projects")
      .then((res) => setProjects(res.data))
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoadingProjects(false));
  }, []);

  // Fetch allocations when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setAllocations([]);
      return;
    }
    setLoadingAllocations(true);
    axios
      .get(`/api/allocations/project/${selectedProjectId}`)
      .then((res) => setAllocations(res.data))
      .catch(() => setError("Failed to load allocations"))
      .finally(() => setLoadingAllocations(false));
  }, [selectedProjectId]);

  // Fetch updated profile info
  useEffect(() => {
    if (employeeId) {
      fetch(`http://localhost:8082/profile/${employeeId}`)
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

  // Event handlers
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
      const res = await fetch(`http://localhost:8082/profile/update/${employeeId}`, {
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

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setError(null);
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

const handleAddAllocation = (e) => {
  e.preventDefault();

  if (!selectedProjectId) {
    setError("Please select a Project before Allocating.");
    return;
  }

  const employeeIdList = formData.employeeIds
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id); // remove empty entries

  if (employeeIdList.length === 0) {
    setError("Please enter at least one valid Employee ID");
    return;
  }

  // Find duplicates: IDs that are already allocated in this project
  const alreadyAllocatedIds = employeeIdList.filter(id =>
    allocations.some(alloc => alloc.employeeId === id)
  );

  if (alreadyAllocatedIds.length > 0) {
    setError(
      `The following Employee IDs are already allocated to this project: ${alreadyAllocatedIds.join(", ")}`
    );
    return; // stop submitting
  }

  const payload = {
    projectId: Number(selectedProjectId),
    employeeIds: employeeIdList,
    startDate: formData.startDate,
    endDate: formData.endDate,
  };

  axios
    .post("/api/allocations/bulk", payload)
    .then((res) => {
      const { successfulAllocations, failedEmployeeIds } = res.data;

      if (failedEmployeeIds.length > 0) {
        setError(
          `Failed to allocate the following Employee IDs: ${failedEmployeeIds.join(", ")}`
        );
        setSuccessMessage(""); // clear success on failure
      } else {
        // All successful
        setAllocations((prev) => [...prev, ...successfulAllocations]);
        setFormData({ employeeIds: "", startDate: "", endDate: "" });
        setError(null);
        setSuccessMessage("Successfully allocated the employees to this project.");
        setIsModalOpen(false);

        // Optionally clear the success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    })
    .catch((err) => {
      console.error("Bulk allocation error:", err);
      setError("Something went wrong while allocating employees. Please try again.");
      setSuccessMessage("");
    });
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
                            onMouseOut={(e) => (e.target.style.color ='rgba(255, 255, 255, 0.7)')}
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
                             color:'rgba(255, 255, 255, 0.7)',
                              fontSize: '14px',
                              display: 'block',
                              padding: '4px 0',
                            }}
                            onMouseOver={(e) => (e.target.style.color = '#fff')}
                            onMouseOut={(e) => (e.target.style.color = 'rgba(255, 255, 255, 0.7)')}
                          >
                            Projects
                          </Link>
                        </li>
                        <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                          <Link
                            to="/allocation"
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

        {/* Project Allocations Content */}
        <div style={{ padding: '20px' }}>
  <h2>
  <span style={{ fontWeight: 'bold' }}>Project: </span>
  <span style={{ fontWeight: 'normal', fontSize: '0.9em' }}>
    {projects.find(p => p.projectId === Number(selectedProjectId))?.projectName} {selectedProjectId && `(P${selectedProjectId})`}
  </span>
</h2>



          {/* Allocation controls aligned to the right, full-width */}
     <div
  style={{
    display: "flex",
    justifyContent: "flex-end", // Align everything on the right side
    alignItems: "center",
    marginBottom: 20,
    gap: 10, // space between items
  }}
>
  <label
    htmlFor="project-select"
    style={{ fontWeight: "bold", margin: 0, whiteSpace: "nowrap" }}
  >
    Select Project:
  </label>

  <select
    id="project-select"
    value={selectedProjectId}
    onChange={handleProjectChange}
    style={{
  padding: "8px 10px", 
      fontSize: 16, 
      width: 220,  // fix the width here
      maxWidth: "100%", // responsive fallback
      boxSizing: "border-box"
    }}
  >
    <option value="">-- Select a project --</option>
    {loadingProjects ? (
      <option disabled>Loading projects...</option>
    ) : (
      projects.map((p) => (
        <option key={p.projectId} value={p.projectId}>
          {p.projectName}
        </option>
      ))
    )}
  </select>

 <button
  onClick={() => {
    if (!selectedProjectId) {
      alert("Please select a Project before allocating. ");
      return;
    }
    setIsModalOpen(true);
  }}
  style={{
    backgroundColor: "#28a745",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Add New Allocation
</button>

</div>
          {/* Allocations Table */}
       <div>
  <h3 style={{ marginTop: 0 }}>Allocations</h3>


  {loadingAllocations ? (
    <p>Loading allocations...</p>
  ) : allocations.length === 0 ? (
    <p>No allocations found for this project.</p>
  ) : (
    <div
    style={{
  maxHeight: "calc(100vh - 300px)",
  overflowY: "scroll",        // keep scrolling, use scroll for consistent behavior
  border: "1px solid #ccc",
  borderRadius: 4,
  scrollbarWidth: "none",      // Firefox
  msOverflowStyle: "none",     // IE and Edge
}}

    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "#2c3e50",
                color: "white",
                padding: "10px",
                textAlign: "left",
                zIndex: 1,
              }}
            >
              Employee ID
            </th>
            <th
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "#2c3e50",
                color: "white",
                padding: "10px",
                textAlign: "left",
                zIndex: 1,
              }}
            >
              Start Date
            </th>
            <th
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "#2c3e50",
                color: "white",
                padding: "10px",
                textAlign: "left",
                zIndex: 1,
              }}
            >
              End Date
            </th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((alloc, index) => (
            <tr
              key={alloc.allocationId || index}
              style={{
                backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
              }}
            >
              <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
                {alloc.employeeId}
              </td>
            <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
  {formatDate(alloc.startDate)}
</td>
<td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
  {formatDate(alloc.endDate)}
</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

        </div>

        {/* Modal for Add Allocation */}
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "white",
                padding: 20,
                borderRadius: 8,
                minWidth: 350,
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                <h3 style={{ margin: 0 }}>Add New Allocation</h3>
                <button
  onClick={() => {
    setFormData({
      employeeIds: "",
      startDate: "",
      endDate: "",
    });
    setError(""); // Optional
    setIsModalOpen(false);
  }}
  style={{
    border: "none",
    background: "transparent",
    fontSize: 20,
    color: "black",
    cursor: "pointer",
  }}
  aria-label="Close modal"
>
  &times;
</button>
              </div>
 <form
      onSubmit={handleAddAllocation}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <label style={{ fontWeight: "bold" }}>Employee ID:</label>
      <textarea
  name="employeeIds"
  value={formData.employeeIds}
  onChange={handleInputChange}
  placeholder="e.g., H100111, H100222, H100333"
  style={{
    maxWidth: 400,
    padding: 8,
    marginTop: 4,
    borderRadius: 4,
    border: "1px solid #ccc",
    resize: "vertical",
    maxHeight: 150,
    overflowY: "scroll",
    scrollbarWidth: "none",        // Firefox
    msOverflowStyle: "none",       // IE 10+
  }}
  rows={4}
/>


      {/* Error message */}
   

      <label style={{ fontWeight: "bold" }}>
        Start Date:
      <input
  type="date"
  name="startDate"
  value={formData.startDate}
  onChange={handleInputChange}
  min={selectedProject?.projectStartDate}  // 👈 set min
  max={selectedProject?.projectEndDate}    // 👈 set max
  required
  style={{
    width: "100%",
    padding: 8,
    marginTop: 4,
    borderRadius: 4,
    border: "1px solid #ccc",
  }}
/>
      </label>

      <label style={{ fontWeight: "bold" }}>
        End Date:
       <input
  type="date"
  name="endDate"
  value={formData.endDate}
  onChange={handleInputChange}
  min={selectedProject?.projectStartDate}
  max={selectedProject?.projectEndDate}
  required
  style={{
    width: "100%",
    padding: 8,
    marginTop: 4,
    borderRadius: 4,
    border: "1px solid #ccc",
  }}
/>
      </label>

 {error && (
  <div
    style={{
      color: "red",
      marginTop: 8,
      fontWeight: "bold",
      maxWidth: 400,
      wordBreak: "break-word",
      whiteSpace: "normal",
      maxHeight: 100,
      overflowY: "auto",
      border: "1px solid red",
      padding: 8,
      borderRadius: 4,
      backgroundColor: "#ffe6e6",

      /* === Hide scrollbar completely === */
      scrollbarWidth: "none",          // Firefox
      msOverflowStyle: "none",         // IE/Edge

      // Chrome, Safari, Edge (WebKit)
      WebkitOverflowScrolling: "touch", // Optional smooth scrolling
    }}
  >
    <div
      style={{
        overflow: "hidden",
      }}
    >
      {error}
    </div>
  </div>
)}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 10,
        }}
      >
        <button
          type="submit"
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "8px 16px",
            borderRadius: 5,
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Submit
        </button>
        <button
  type="button"
  onClick={() => {
    setFormData({
      employeeIds: "",
      startDate: "",
      endDate: "",
    });
    setError(""); // Optional: clear error messages
    setIsModalOpen(false); // Close the modal
  }}
  style={{
    backgroundColor: "#6c757d",
    color: "white",
    padding: "8px 16px",
    borderRadius: 5,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Cancel
</button>

      </div>
    </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectAllocationsDashboard;
