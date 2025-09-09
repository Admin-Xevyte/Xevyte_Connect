import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import './Dashboard.css'; // Assuming the same CSS file is used

function ProjectPage() {
    const { customerId, sowId } = useParams();
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

    // Project Form State
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        projectStartDate: "",
        projectEndDate: "",
        totalEffort: "",
        totalCost: "",
        manager: "",
        reviewer: "",
        hr: "",
        finance:"",
        admin:"",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // --- Search Filter Logic ---
// --- Search Filter Logic ---
const filteredProjects = useMemo(() => {
    if (!searchTerm) {
        return projects;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return projects.filter(project => {
        // Updated: Add 'P' prefix to the projectId string
        const projectIdString = `P${project.projectId}`.toLowerCase();
        const startDateString = new Date(project.projectStartDate).toLocaleDateString("en-GB");
        const endDateString = new Date(project.projectEndDate).toLocaleDateString("en-GB");
        const totalEffortString = project.totalEffort.toString();
        const totalCostString = project.totalCost.toString();
        const managerString = project.manager.toString();
        const reviewerString = project.reviewer.toString();
        const hrString = project.hr.toString();

        return (
            projectIdString.includes(lowercasedSearchTerm) ||
            startDateString.toLowerCase().includes(lowercasedSearchTerm) ||
            endDateString.toLowerCase().includes(lowercasedSearchTerm) ||
            totalEffortString.toLowerCase().includes(lowercasedSearchTerm) ||
            totalCostString.toLowerCase().includes(lowercasedSearchTerm) ||
            managerString.toLowerCase().includes(lowercasedSearchTerm) ||
            reviewerString.toLowerCase().includes(lowercasedSearchTerm) ||
            hrString.toLowerCase().includes(lowercasedSearchTerm)
        );
    });
}, [projects, searchTerm]);

    // Fetch Projects on component mount
    useEffect(() => {
        fetchProjects(sowId);
    }, [sowId]);

    // Profile and dropdown logic (copied from SowPage for consistency)
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

    const fetchProjects = async (id) => {
        try {
            const res = await axios.get(`/api/projects/sow/${id}`);
            setProjects(res.data);
        } catch (err) {
            console.error("Error fetching projects:", err);
        }
    };

    const resetForm = () => {
        setFormData({
            projectStartDate: "",
            projectEndDate: "",
            totalEffort: "",
            totalCost: "",
            manager: "",
            reviewer: "",
            hr: "",
            finance:"",
            admin:"",
        });
        setError("");
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateDates = () => {
        if (!formData.projectStartDate || !formData.projectEndDate) {
            setError("Both start and end dates are required.");
            return false;
        }
        const startDate = new Date(formData.projectStartDate);
        const endDate = new Date(formData.projectEndDate);

        if (endDate <= startDate) {
            setError("End date must be after start date.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateDates()) {
            return;
        }

        setLoading(true);

        try {
            const payload = {
                sowId: Number(sowId),
                projectStartDate: formData.projectStartDate,
                projectEndDate: formData.projectEndDate,
                totalEffort: Number(formData.totalEffort),
                totalCost: Number(formData.totalCost),
                manager: formData.manager,
                reviewer: formData.reviewer,
                hr: formData.hr,
                finance:formData.finance,
                admin:formData.admin,
            };

            await axios.post(`/api/projects`, payload);

            await fetchProjects(sowId);
            setSuccessMessage("Project added successfully!");
            setTimeout(() => setSuccessMessage(""), 2000);

            resetForm();
            setShowForm(false);
        } catch (err) {
            console.error("Error adding project:", err);
            setError("Failed to add project. Please try again.");
        } finally {
            setLoading(false);
        }
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

    const handleCancelForm = () => {
        resetForm();
        setShowForm(false);
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

    return (
        <div className="dashboard-container">
            {/* Sidebar (same as SowPage) */}
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
                                              <Link to="/dashboard" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)'}}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255, 255, 255, 0.7)'}}>
                                                  Home
                                                 
                                                </span>
                                              </Link>
                                            </h3>
                                            <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Claims</Link></h3>
                                            <h3><Link to="/home1" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Time Sheet</Link></h3>
                                            <h3><Link to="/home2" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Employee Handbook</Link></h3>
                                            <h3><Link to="/home3" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Employee Directory</Link></h3>
                                            <h3><Link to="/home4" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Exit Management</Link></h3>
                                            <h3><Link to="/home5" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Holiday Calendar</Link></h3>
                                            <h3><Link to="/home6" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Helpdesk</Link></h3>
                                            <h3><Link to="/home7" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Leaves</Link></h3>
                                          
                                            <h3><Link to="/home9" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Pay slips</Link></h3>
                                            <h3><Link to="/home10" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Performance</Link></h3>
                                            <h3><Link to="/home11" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Training</Link></h3>
                                            <h3><Link to="/home12" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Travel</Link></h3>
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
                {/* Header (same as SowPage) */}
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
                                        style={{ display: 'block', width: '100%', padding: '10px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        style={{ display: 'block', width: '100%', padding: '10px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
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

                {/* Project Content */}
                <div style={{ padding: "20px" }}>
                    {/* Top Bar: Back to SOWs + Add New Project */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px"
                    }}>
                 <Link to={`/customers/${customerId}/sows`}>
    <button
        style={{
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            color: "#333",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer"
        }}
    >
        ⬅ Back to SOWs
    </button>
</Link>
                        <button
                            onClick={() => setShowForm(true)}
                            style={{
                                padding: "10px 16px",
                                backgroundColor: "#28a745",
                                color: "white",
                                fontWeight: "bold",
                                fontSize: "14px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                        >
                            Add New Project
                        </button>
                    </div>

               {/* Modal Form */}
{showForm && (
  <>
    {/* Backdrop */}
    <div
      onClick={handleCancelForm}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 1000,
      }}
    ></div>

    {/* Modal Content */}
    <div
      style={{
        position: "fixed",
        top: "10%", // more space from top
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "white",
        padding: "25px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        zIndex: 1001,
        width: "400px", // slightly wider
        maxHeight: "80vh", // prevent overflow
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: 0 }}>Add New Project</h3>
        <button
          onClick={() => setShowForm(false)}
          style={{
            background: "none",
            border: "none",
            fontSize: "22px",
            cursor: "pointer",
            lineHeight: "1",
            color: "black",
          }}
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Row 1: Start Date and End Date */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{
                fontWeight: "bold",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Project Start Date:
            </label>
            <input
              type="date"
              name="projectStartDate"
              value={formData.projectStartDate}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                fontWeight: "bold",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Project End Date:
            </label>
            <input
              type="date"
              name="projectEndDate"
              value={formData.projectEndDate}
              onChange={handleInputChange}
              required
              min={formData.projectStartDate}
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>
        </div>

        {/* Row 2: Total Effort and Total Cost */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{
                fontWeight: "bold",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Total Effort (PD):
            </label>
            <input
              type="number"
              name="totalEffort"
              value={formData.totalEffort}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                fontWeight: "bold",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Total Cost:
            </label>
            <input
              type="number"
              name="totalCost"
              value={formData.totalCost}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>
        </div>

        {/* Manager */}
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Manager:
          </label>
          <input
            type="text"
            name="manager"
            value={formData.manager}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              boxSizing: "border-box",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Reviewer */}
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Reviewer:
          </label>
          <input
            type="text"
            name="reviewer"
            value={formData.reviewer}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              boxSizing: "border-box",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* HR */}
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Hr:
          </label>
          <input
            type="text"
            name="hr"
            value={formData.hr}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              boxSizing: "border-box",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
       
          <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Finance:
          </label>
          <input
            type="text"
          name="finance" 
            value={formData.finance}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              boxSizing: "border-box",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

          <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Admin:
          </label>
          <input
            type="text"
     name="admin"
value={formData.admin}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              boxSizing: "border-box",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

 
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "10px 20px",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            {loading ? "Saving..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={handleCancelForm}
            style={{
                     backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "10px 20px",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </>
)}

              <h3>Projects for SOW ID: {`SOW${sowId}`}</h3>

                    <div
                        className="project-table-container"
                        style={{
                            maxHeight: "calc(100vh - 250px)",
                            overflowY: "auto",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                        }}
                    >
                        <table
                            border="1"
                            cellPadding="10"
                            style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Project ID</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Project Start Date</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Project End Date</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Total Effort (PD)</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Total Cost</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Manager</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Reviewer</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Hr</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Finance</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Admin</th>
                                    <th  style={{ backgroundColor: "#2c3e50", color: "white" }}>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredProjects.length > 0 ? (
                                    filteredProjects.map((project) => (
                                        <tr key={project.projectId}>
                                         <td>{`P${project.projectId}`}</td>

                                            <td>{new Date(project.projectStartDate).toLocaleDateString("en-GB")}</td>
                                            <td>{new Date(project.projectEndDate).toLocaleDateString("en-GB")}</td>
                                            <td>{project.totalEffort}</td>
                                            <td>{project.totalCost}</td>
                                            <td>{project.manager}</td>
                                            <td>{project.reviewer}</td>
                                            <td>{project.hr}</td>
                                              <td>{project.finance}</td>
                                                <td>{project.admin}</td>
<td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
  <Link to={`/customers/${customerId}/sows/${sowId}/projects/${project.projectId}/allocations`}>
    <button style={{
      padding: '5px 10px',
      fontSize: '0.875rem',
      cursor: 'pointer',
      backgroundColor: "#3498db",
      margin: '0 auto',
    }}>
      View Allocations
    </button>
  </Link>
</td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: "center" }}>
                                            No projects found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectPage;