import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import './Dashboard.css'; // Assuming the same CSS file is used

function AllocationPage() {
    const { customerId, sowId, projectId } = useParams();
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

    // Allocation Form State
    const [allocations, setAllocations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: "",
        startDate: "",
        endDate: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // --- Search Filter Logic ---
    const filteredAllocations = useMemo(() => {
        if (!searchTerm) {
            return allocations;
        }
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return allocations.filter(allocation => {
            // Convert all relevant fields to lowercase strings for case-insensitive search
            const allocationIdString = `ALC${allocation.allocationId}`.toLowerCase();
            const employeeIdString = allocation.employeeId.toLowerCase();
            const startDateString = new Date(allocation.startDate).toLocaleDateString("en-GB").toLowerCase();
            const endDateString = new Date(allocation.endDate).toLocaleDateString("en-GB").toLowerCase();

            return (
                allocationIdString.includes(lowercasedSearchTerm) ||
                employeeIdString.includes(lowercasedSearchTerm) ||
                startDateString.includes(lowercasedSearchTerm) ||
                endDateString.includes(lowercasedSearchTerm)
            );
        });
    }, [allocations, searchTerm]);

    // Fetch Allocations on component mount
    useEffect(() => {
        if (projectId) {
            fetchAllocations(projectId);
        }
    }, [projectId]);

    // Profile and dropdown logic (copied from ProjectPage for consistency)
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

    const fetchAllocations = async (id) => {
        try {
            const res = await axios.get(`/api/allocations/project/${id}`);
            setAllocations(res.data);
        } catch (err) {
            console.error("Error fetching allocations:", err);
        }
    };

    const resetForm = () => {
        setFormData({
            employeeId: "",
            startDate: "",
            endDate: "",
        });
        setError("");
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateDates = () => {
        if (!formData.startDate || !formData.endDate) {
            setError("Both start and end dates are required.");
            return false;
        }
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

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
                projectId: Number(projectId),
                employeeId: formData.employeeId,
                startDate: formData.startDate,
                endDate: formData.endDate,
            };

            await axios.post(`/api/allocations`, payload);

            await fetchAllocations(projectId);
            setSuccessMessage("Allocation added successfully!");
            setTimeout(() => setSuccessMessage(""), 2000);

            resetForm();
            setShowForm(false);
        } catch (err) {
            console.error("Error adding allocation:", err);
            setError("Failed to add allocation. Please try again.");
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
            {/* Sidebar (same as ProjectPage) */}
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
                                      <Link to="/dashboard" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
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
                {/* Header (same as ProjectPage) */}
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

                {/* Allocation Content */}
                <div style={{ padding: "20px" }}>
                    {/* Top Bar: Back to Projects + Add New Allocation */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px"
                    }}>
                        {/* Correctly navigate back to the Projects page using the existing route params */}
                        <Link to={`/projects/${customerId}/${sowId}`}>
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
                                ⬅ Back to Projects
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
                            Add New Allocation
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
                                    top: "10%",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    backgroundColor: "white",
                                    padding: "25px",
                                    borderRadius: "8px",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                                    zIndex: 1001,
                                    width: "400px",
                                    maxHeight: "80vh",
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
                                    <h3 style={{ margin: 0 }}>Add New Allocation</h3>
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
                                    {/* Employee ID */}
                                    <div style={{ marginBottom: "15px" }}>
                                        <label
                                            style={{
                                                fontWeight: "bold",
                                                display: "block",
                                                marginBottom: "6px",
                                            }}
                                        >
                                            Employee ID:
                                        </label>
                                        <input
                                            type="text"
                                            name="employeeId"
                                            value={formData.employeeId}
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                boxSizing: "border-box",
                                                borderRadius: "4px",
                                                border: "1px solid #ccc",
                                            }}
                                            placeholder="e.g., E101"
                                        />
                                    </div>

                                    {/* Start Date */}
                                    <div style={{ marginBottom: "15px" }}>
                                        <label
                                            style={{
                                                fontWeight: "bold",
                                                display: "block",
                                                marginBottom: "6px",
                                            }}
                                        >
                                            Start Date:
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
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

                                    {/* End Date */}
                                    <div style={{ marginBottom: "15px" }}>
                                        <label
                                            style={{
                                                fontWeight: "bold",
                                                display: "block",
                                                marginBottom: "6px",
                                            }}
                                        >
                                            End Date:
                                        </label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            required
                                            min={formData.startDate}
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

                    <h3>Allocations for Project ID: {`P${projectId}`}</h3>

                    <div
                        className="allocation-table-container"
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
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Allocation ID</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Employee ID</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>Start Date</th>
                                    <th style={{ backgroundColor: "#2c3e50", color: "white" }}>End Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAllocations.length > 0 ? (
                                    filteredAllocations.map((allocation) => (
                                        <tr key={allocation.allocationId}>
                                            <td>{`ALC${allocation.allocationId}`}</td>
                                            <td>{allocation.employeeId}</td>
                                            <td>{new Date(allocation.startDate).toLocaleDateString("en-GB")}</td>
                                            <td>{new Date(allocation.endDate).toLocaleDateString("en-GB")}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4">No allocations found.</td>
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

export default AllocationPage;