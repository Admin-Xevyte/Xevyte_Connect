import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import './Dashboard.css'; // Ensure this CSS file is available

function SowPage() {
    const { customerId } = useParams();
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
    
    const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
      const [isContractOpen, setIsContractOpen] = useState(false);
     const [canViewTasks, setCanViewTasks] = useState(false);
    const toggleContractMenu = () => {
      setIsContractOpen(!isContractOpen);
    };
const [customers, setCustomers] = React.useState([]);
const [selectedCustomerId, setSelectedCustomerId] = React.useState(customerId || "");
React.useEffect(() => {
  fetch("/api/customers")
    .then(res => res.json())
    .then(data => {
      setCustomers(data);
      if (!selectedCustomerId && data.length > 0) {
        setSelectedCustomerId(data[0].id);
      }
    })
    .catch(err => console.error("Failed to fetch customers", err));
}, []);
    // SOW Form State
    const [sows, setSows] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        sowStartDate: "",
        sowEndDate: "",
        totalEffort: "",
        totalCost: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // --- Search Filter Logic ---
    // Use useMemo to filter the SOWs based on the search term
    const filteredSows = useMemo(() => {
        if (!searchTerm) {
            return sows;
        }
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return sows.filter(sow => {
            // Corrected line: Check against the formatted string "SOW" + sow.sowId
            const sowIdString = `sow${sow.sowId}`; 
            
            const sowStartDateString = new Date(sow.sowStartDate).toLocaleDateString("en-GB");
            const sowEndDateString = new Date(sow.sowEndDate).toLocaleDateString("en-GB");
            const totalEffortString = sow.totalEffort.toString();
            const totalCostString = sow.totalCost.toString();

            // Check if any of the SOW fields or associated project fields contain the search term
            const matchesSowFields = (
                sowIdString.toLowerCase().includes(lowercasedSearchTerm) ||
                sowStartDateString.toLowerCase().includes(lowercasedSearchTerm) ||
                sowEndDateString.toLowerCase().includes(lowercasedSearchTerm) ||
                totalEffortString.toLowerCase().includes(lowercasedSearchTerm) ||
                totalCostString.toLowerCase().includes(lowercasedSearchTerm)
            );

            const matchesProject = sow.projects && sow.projects.some(project =>
                project.projectId.toString().toLowerCase().includes(lowercasedSearchTerm) ||
                project.projectName.toLowerCase().includes(lowercasedSearchTerm)
            );

            return matchesSowFields || matchesProject;
        });
    }, [sows, searchTerm]);
    // -------------------------

    // Fetch SOWs and Customer info on component mount
    useEffect(() => {
        fetchSows(customerId);
        fetchCustomer(customerId);
    }, [customerId]);

    // Fetch updated profile info on mount (optional but recommended)
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

    const fetchSows = async (id) => {
        try {
            const res = await axios.get(`/api/sows/customer/${id}`);
            const sowsWithProjects = await Promise.all(
                res.data.map(async (sow) => {
                    const projectsRes = await axios.get(`/api/projects/sow/${sow.sowId}`);
                    return { ...sow, projects: projectsRes.data };
                })
            );
            setSows(sowsWithProjects);
        } catch (err) {
            console.error("Error fetching SOWs or projects:", err);
        }
    };

    const fetchCustomer = async (id) => {
        try {
            const res = await axios.get(`/api/customers/${id}`);
            setCustomer(res.data);
        } catch (err) {
            console.error("Error fetching customer:", err);
        }
    };

    const resetForm = () => {
        setFormData({
            sowStartDate: "",
            sowEndDate: "",
            totalEffort: "",
            totalCost: "",
        });
        setError("");
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateDates = () => {
        if (!formData.sowStartDate || !formData.sowEndDate) {
            setError("Both start and end dates are required.");
            return false;
        }
        const startDate = new Date(formData.sowStartDate);
        const endDate = new Date(formData.sowEndDate);

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
                customerId,
                sowStartDate: formData.sowStartDate,
                sowEndDate: formData.sowEndDate,
                totalEffort: Number(formData.totalEffort),
                totalCost: Number(formData.totalCost),
            };

            await axios.post(`/api/sows`, payload);

            await fetchSows(customerId);
            setSuccessMessage("SOW added successfully!");
            setTimeout(() => setSuccessMessage(""), 2000);

            resetForm();
            setShowForm(false);
        } catch (err) {
            console.error("Error adding SOW:", err);
            setError("Failed to add SOW. Please try again.");
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
                  <Link to="/home0" className="side" style={{ textDecoration: 'none',color: '#00b4c6' }}>
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
                  <Link to="/home9" className="side" style={{ textDecoration: 'none', color: 'white' }}>
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
                  <Link to="/home12" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
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
                                        boxSizing: 'border-box',
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

                {/* SOW Content */}
                <div style={{ padding: "20px" }}>
                    {customer ? (
                        <div style={{ marginBottom: "15px" }}>
                            <h2>
                                Customer: {customer.customerName || customer.name} (ID: {customerId})
                            </h2>
                            {customer.email && <p>Email: {customer.email}</p>}
                        </div>
                    ) : null}
                    {/* Top Bar: Back + Add New SOW */}
                 <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
}}>
  <Link to="/customers">
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
      ⬅ Back to Customers
    </button>
  </Link>

  {/* Wrap select and button together aligned right */}
  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      Select Customer:
      <select
        value={selectedCustomerId}
        onChange={(e) => setSelectedCustomerId(e.target.value)}
        style={{
          padding: "8px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        {customers.map((cust) => (
          <option key={cust.id} value={cust.id}>
            {cust.customerName || cust.name}
          </option>
        ))}
      </select>
    </label>

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
      Add New SOW
    </button>
  </div>
</div>



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
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    backgroundColor: "white",
                                    padding: "20px 30px",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                                    zIndex: 1001,
                                    width: "500px",
                                    boxSizing: "border-box",
                                    fontFamily: "Arial, sans-serif",
                                }}
                            >
                                {/* Header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                    <h2 style={{ margin: 0, fontWeight: "600", fontSize: "18px" }}>Add New SOW</h2>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        aria-label="Close form"
                                        style={{
                                            background: "none",
                                            border: "none",
                                            fontSize: "22px",
                                            cursor: "pointer",
                                            lineHeight: "1",
                                            color: "#333",
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit}>
                                    {/* SOW Start Date */}
                                    <div style={{ marginBottom: "15px" }}>
                                        <label style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>
                                            SOW Start Date <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="sowStartDate"
                                            value={formData.sowStartDate}
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                boxSizing: "border-box",
                                                borderRadius: "4px",
                                                border: "1px solid #ccc",
                                                fontSize: "14px",
                                            }}
                                        />
                                    </div>

                                    {/* SOW End Date */}
                                    <div style={{ marginBottom: "15px" }}>
                                        <label style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>
                                            SOW End Date <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="sowEndDate"
                                            value={formData.sowEndDate}
                                            onChange={handleInputChange}
                                            required
                                            min={formData.sowStartDate}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                boxSizing: "border-box",
                                                borderRadius: "4px",
                                                border: "1px solid #ccc",
                                                fontSize: "14px",
                                            }}
                                        />
                                    </div>

                                    {/* Total Effort and Total Cost (side by side) */}
                                    <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>
                                                Total Effort (PD) <span style={{ color: "red" }}>*</span>
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
                                                    padding: "10px",
                                                    boxSizing: "border-box",
                                                    borderRadius: "4px",
                                                    border: "1px solid #ccc",
                                                    fontSize: "14px",
                                                }}
                                            />
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>
                                                Total Cost <span style={{ color: "red" }}>*</span>
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
                                                    padding: "10px",
                                                    boxSizing: "border-box",
                                                    borderRadius: "4px",
                                                    border: "1px solid #ccc",
                                                    fontSize: "14px",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>{error}</div>
                                    )}

                                    {/* Buttons (side by side full width) */}
                                    <div style={{ display: "flex", gap: "15px" }}>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            style={{
                                                flex: 1,
                                                backgroundColor: "#007bff",
                                                color: "white",
                                                border: "none",
                                                padding: "12px 0",
                                                cursor: loading ? "not-allowed" : "pointer",
                                                borderRadius: "4px",
                                                fontWeight: "600",
                                                fontSize: "16px",
                                            }}
                                        >
                                            {loading ? "Saving..." : "Submit"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancelForm}
                                            style={{
                                                flex: 1,
                                                backgroundColor: "#6c757d",
                                                color: "white",
                                                border: "none",
                                                padding: "12px 0",
                                                cursor: "pointer",
                                                borderRadius: "4px",
                                                fontWeight: "600",
                                                fontSize: "16px",
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}

                    <h3>SOWs for Customer ID: {`CID${customerId}`}</h3>

                    <div
                        className="sow-table-container"
                        style={{
                            maxHeight: "calc(100vh - 250px)",
                            overflowY: "auto",
                            // optional for horizontal scroll
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
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>SOW ID</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>
                                        SOW Start Date
                                    </th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>
                                        SOW End Date
                                    </th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>
                                        Total Effort (PD)
                                    </th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>
                                        Total Cost
                                    </th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>
                                        Projects
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredSows.length > 0 ? (
                                    filteredSows.map((sow) => (
                                        <tr key={sow.sowId}>
                                            <td>{`SOW${sow.sowId}`}</td>

                                            <td>{new Date(sow.sowStartDate).toLocaleDateString("en-GB")}</td>
                                            <td>{new Date(sow.sowEndDate).toLocaleDateString("en-GB")}</td>
                                            <td>{sow.totalEffort}</td>
                                            <td>{sow.totalCost}</td>
                                            <td>
                                                <Link to={`/projects/${customerId}/${sow.sowId}`}>

                                                    <button
                                                        style={{
                                                            padding: "6px 12px",
                                                            backgroundColor: "#3498db",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        Projects
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center" }}>
                                            No SOWs found
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

export default SowPage;
