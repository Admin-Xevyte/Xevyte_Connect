import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
 
import * as XLSX from "xlsx-js-style";
 
import './Dashboard.css';
import './Mytimesheet.css';
 
// Download icon component
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
    </svg>
);
 
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zM12.5 5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm-9 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm.5 3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm5 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm.5 3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm-5 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM3.5 14a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM8 14a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM12.5 14a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM4 1.5A1.5 1.5 0 0 1 5.5 0h5A1.5 1.5 0 0 1 12 1.5v.194a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V1.5zM1.5 3h13v2.5a.5.5 0 0 1-1 0V4H2v1.5a.5.5 0 0 1-1 0V3zM1.5 6h13v8a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 1.5 14V6z"/>
    </svg>
);
 
const HRTimesheetsTable = ({ hrId, passedEmployeeId, searchTerm }) => {
    const [allTimesheets, setAllTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};
 
    const [filters, setFilters] = useState({
        date: 'desc',
        employeeId: '',
        client: '',
        project: '',
        loginTime: '',
        logoutTime: '',
        totalHours: '',
        remarks: ''
    });


 
    // Fetch ALL timesheet data once on mount
    useEffect(() => {
        const fetchAllTimesheets = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch all entries for the HR
                const response = await axios.get(`/daily-entry/hr/${hrId}`);
                setAllTimesheets(response.data);
            } catch (err) {
                console.error("Error fetching HR timesheets:", err);
                setError(err.response?.data?.message || "Failed to fetch timesheet data.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllTimesheets();
    }, [hrId]);
 
    const handleFilterChange = (column, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [column]: value
        }));
    };
 
 const filteredEntries = useMemo(() => {
    let currentEntries = [...allTimesheets];
 
    // 1. Filter by selected month and year
    currentEntries = currentEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === selectedYear && entryDate.getMonth() === selectedMonth;
    });
 
    // 2. Filter by passed employee ID, if any
    if (passedEmployeeId) {
        currentEntries = currentEntries.filter(entry => String(entry.employeeId) === String(passedEmployeeId));
    }
 
    // 3. Apply global search term with a null-safe approach
    if (searchTerm) {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        currentEntries = currentEntries.filter(entry => {
            // Get all values from the entry object
            const values = Object.values(entry);
           
            // Check if any of the values (after converting to string and handling null) includes the search term
            return values.some(value => {
                // Safely convert value to a string, treating null/undefined as an empty string
                const stringValue = (value ?? '').toString().toLowerCase();
               
                // Check if the string value includes the search term
                return stringValue.includes(lowercasedSearchTerm);
            });
        });
    }
 
    // 4. Apply column-specific filters
    if (filters.employeeId) {
        currentEntries = currentEntries.filter(entry =>
            String(entry.employeeId).toLowerCase().includes(filters.employeeId.toLowerCase())
        );
    }
    if (filters.client) {
        currentEntries = currentEntries.filter(entry =>
            (entry.client ?? '').toLowerCase().includes(filters.client.toLowerCase())
        );
    }
    if (filters.project) {
        currentEntries = currentEntries.filter(entry =>
            (entry.project ?? '').toLowerCase().includes(filters.project.toLowerCase())
        );
    }
    if (filters.remarks) {
        currentEntries = currentEntries.filter(entry =>
            (entry.remarks ?? '').toLowerCase().includes(filters.remarks.toLowerCase())
        );
    }
    if (filters.loginTime) {
        currentEntries = currentEntries.filter(entry =>
            (entry.loginTime ?? '').includes(filters.loginTime)
        );
    }
    if (filters.logoutTime) {
        currentEntries = currentEntries.filter(entry =>
            (entry.logoutTime ?? '').includes(filters.logoutTime)
        );
    }
    if (filters.totalHours) {
        currentEntries = currentEntries.filter(entry => {
            const total = parseFloat(entry.totalHours);
            if (filters.totalHours === 'lessThan8') {
                return total < 8;
            }
            if (filters.totalHours === 'greaterThan8') {
                return total >= 8;
            }
            return true;
        });
    }
 
    // 5. Sort by date
    currentEntries.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return filters.date === 'asc' ? dateA - dateB : dateB - dateA;
    });
 
    return currentEntries;
}, [allTimesheets, filters, searchTerm, selectedMonth, selectedYear, passedEmployeeId]);
 
const handleDownload = () => {
    // New conditional check for startDate and endDate
    if (!startDate || !endDate) {
        alert("Please select a start date and an end date to export timesheets.");
        return;
    }

    if (!filteredEntries || filteredEntries.length === 0) {
        alert("No entries to export for the selected date range.");
        return;
    }

    const dataToExport = filteredEntries
        .filter(entry => {
            const entryDate = new Date(entry.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            return (!start || entryDate >= start) && (!end || entryDate <= end);
        })
        .map(entry => ({
            "Employee ID": entry.employeeId,
            "Employee Name": entry.employeeName,// use state here
            "Date": entry.date,
            "Client": entry.client,
            "Project": entry.project,
            "Login Time": entry.loginTime,
            "Logout Time": entry.logoutTime,
            "Total Hours": entry.totalHours,
            "Remarks": entry.remarks || "",
            "Manager ID": entry.managerId,
            "Manager Name": entry.managerName || "",
            "HR ID": entry.hrId,
            "HR Name": entry.hrName || ""
        }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Style header row
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[cell_address]) continue;
        worksheet[cell_address].s = {
            font: { bold: true },
            alignment: { horizontal: "center" },
            fill: { fgColor: { rgb: "D9D9D9" } }
        };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HR Timesheets');

    // Use employeeName from state for filename
    const empId = filteredEntries[0]?.employeeId || "EMP";
    const fileName = `${empId}_timesheets.xlsx`;

    XLSX.writeFile(workbook, fileName);
    setIsModalOpen(false);
};
 
 
 
    const handleViewTimesheet = (e) => {
        e.preventDefault();
        setIsViewModalOpen(false);
    };
 
    if (loading) return <p>Loading timesheets...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
 
    return (
        <div className="p-4">
            <div className="timesheet-header">
                <h2>HR Timesheets</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setIsViewModalOpen(true)} className="export-btn">
                        View Timesheet
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="export-btn">
                        Export Timesheet <DownloadIcon />
                    </button>
                </div>
            </div>
 
            {/* View Timesheet Modal */}
            {isViewModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Select Month and Year</h3>
                            <button onClick={() => setIsViewModalOpen(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <label htmlFor="month-select">Month:</label>
                            <select
                                id="month-select"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                            <label htmlFor="year-select">Year:</label>
                            <input
                                type="number"
                                id="year-select"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                min="2000"
                                max={new Date().getFullYear() + 10}
                            />
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setIsViewModalOpen(false)} className="cancel-btn">Cancel</button>
                            <button onClick={handleViewTimesheet} className="download-btn">View</button>
                        </div>
                    </div>
                </div>
            )}
 
            {/* Export Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Download Timesheet</h3>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <label htmlFor="modal-start-date">Start Date:</label>
                            <input
                                type="date"
                                id="modal-start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <label htmlFor="modal-end-date">End Date:</label>
                            <input
                                type="date"
                                id="modal-end-date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancel</button>
                            <button onClick={handleDownload} className="download-btn">Download</button>
                        </div>
                    </div>
                </div>
            )}
 
            <div className="table-wrapper">
                <table className="timesheet-table" border="1" cellPadding="8">
                    <thead>
                        <tr>
                           <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                Employee ID
                                <input
                                    type="text"
                                    placeholder="Search ID"
                                    value={filters.employeeId}
                                    onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                Employee Name
                                <input
                                    type="text"
                                    placeholder="Search ID"
                                    value={filters.employeeId}
                                    onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                                />
                            </th>
                          <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
  Date (dd-mm-yyyy)
  <select
    value={filters.date}
    onChange={(e) => handleFilterChange('date', e.target.value)}
    style={{
      height: '25px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontSize: '14px',
      width: 'auto',
      minWidth: '80px',
      marginRight: 'auto',
      marginBottom: '16px',
      color: 'black'
    }}
  >
    <option value="asc">Asc</option>
    <option value="desc">Desc</option>
  </select>
</th>

                         
                            <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                Client
                                <input
                                    type="text"
                                    placeholder="Search Client"
                                    value={filters.client}
                                    onChange={(e) => handleFilterChange('client', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                Project
                                <input
                                    type="text"
                                    placeholder="Search Project"
                                    value={filters.project}
                                    onChange={(e) => handleFilterChange('project', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                Login Time
                                <input
                                    type="text"
                                    placeholder="Search Time"
                                    value={filters.loginTime}
                                    onChange={(e) => handleFilterChange('loginTime', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                Logout Time
                                <input
                                    type="text"
                                    placeholder="Search Time"
                                    value={filters.logoutTime}
                                    onChange={(e) => handleFilterChange('logoutTime', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                Total Hours
                                <select
                                    value={filters.totalHours}
                                    onChange={(e) => handleFilterChange('totalHours', e.target.value)}
                                    style={{
                                        height: '25px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '14px',
                                        minWidth: '100px',
                                        marginRight: 'auto',
                                        marginBottom: '16px',
                                        color: 'black'
                                    }}
                                >
                                    <option value="">All</option>
                                    <option value="lessThan8"> &lt; 8</option>
                                    <option value="greaterThan8"> &ge; 8</option>
                                </select>
                            </th>
                            <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                Remarks
                                <input
                                    type="text"
                                    placeholder="Search Remarks"
                                    value={filters.remarks}
                                    onChange={(e) => handleFilterChange('remarks', e.target.value)}
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.length > 0 ? (
                            filteredEntries.map((entry) => (
                                <tr key={entry.id}>
                                         <td>{entry.employeeId}</td>
                                         <td>{entry.employeeName}</td>
 
                                   <td>{formatDate(entry.date)}</td>
                           
                                    <td>{entry.client}</td>
                                    <td>{entry.project}</td>
                                    <td>{entry.loginTime}</td>
                                    <td>{entry.logoutTime}</td>
                                    <td>{entry.totalHours}</td>
                                    <td>{entry.remarks || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8">No timesheet entries found for the selected month.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
 
// The main Performance component remains unchanged. It just passes props to the table component.
function Performance() {
    const location = useLocation();
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
 
    const passedEmployeeId = location.state?.employeeId || localStorage.getItem("selectedEmployeeId");
    const hrId = localStorage.getItem("employeeId");
 
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
                                    <Link to="/dashboard" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)'}}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255, 255, 255, 0.7)'}}>
                                        Home
                                       
                                      </span>
                                    </Link>
                                  </h3>
                                  <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Claims</Link></h3>
                                  <h3><Link to="/home1" className="side" style={{ textDecoration: 'none', color: 'white' }}>Time Sheet</Link></h3>
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
 
            {/* Main content */}
            <div className="main-content">
                {/* Top header */}
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
 
                <HRTimesheetsTable
                    hrId={hrId}
                    passedEmployeeId={passedEmployeeId}
                    searchTerm={searchTerm}
                />
            </div>
        </div>
    );
}
 
export default Performance;
 