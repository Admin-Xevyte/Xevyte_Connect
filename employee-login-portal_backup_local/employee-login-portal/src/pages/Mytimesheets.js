import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './Dashboard.css';
import './Mytimesheet.css';
import Sidebar from './Sidebar.js';
// Import the download icon (e.g., from a library or as an SVG/image file)
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
    </svg>
);



const EmployeeTimesheets = ({ employeeId, searchTerm }) => {
    const [allEntries, setAllEntries] = useState([]); // Store all fetched entries
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [currentView, setCurrentView] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
    
  const navigate = useNavigate();
  
   const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
};

    // State for column filters
    const [filters, setFilters] = useState({
        date: 'asc',
        client: '',
        project: '',
        loginTime: '',
        logoutTime: '',
        totalHours: '',
        remarks: ''
    });

    useEffect(() => {
        if (!employeeId) return;

        const fetchAllEntries = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.get(
                    `http://3.7.139.212:8080/daily-entry/employee/${employeeId}`
                );

                setAllEntries(response.data); // Store all entries
            } catch (err) {
                setError(
                    err.response?.data || 'Failed to fetch timesheet entries.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAllEntries();
    }, [employeeId]);

    // Filter and sort entries based on all filters and search term
  const filteredEntries = useMemo(() => {
    let currentEntries = [...allEntries];

    // Apply month and year filter first
    currentEntries = currentEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === currentView.month && entryDate.getFullYear() === currentView.year;
    });

    // Apply global search term
if (searchTerm) {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    currentEntries = currentEntries.filter(entry =>
        Object.values(entry).some(value =>
            // Convert the value to a string first, then check if it's not null/undefined, and if it includes the search term.
            String(value || '').toLowerCase().includes(lowercasedSearchTerm)
        )
    );
}

    // Apply column-specific filters
    if (filters.client) {
        currentEntries = currentEntries.filter(entry =>
            // Safely access the property and use logical OR for a fallback
            (entry.client || '').toLowerCase().includes(filters.client.toLowerCase())
        );
    }
    if (filters.project) {
        currentEntries = currentEntries.filter(entry =>
            // Safely access the property and use logical OR for a fallback
            (entry.project || '').toLowerCase().includes(filters.project.toLowerCase())
        );
    }
    if (filters.remarks) {
        currentEntries = currentEntries.filter(entry =>
            // Your existing and correct check
            (entry.remarks || '').toLowerCase().includes(filters.remarks.toLowerCase())
        );
    }
    if (filters.loginTime) {
        currentEntries = currentEntries.filter(entry =>
            // Safely access the property and use logical OR for a fallback
            (entry.loginTime || '').includes(filters.loginTime)
        );
    }
    if (filters.logoutTime) {
        currentEntries = currentEntries.filter(entry =>
            // Safely access the property and use logical OR for a fallback
            (entry.logoutTime || '').includes(filters.logoutTime)
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

    // Sort by date
    currentEntries.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return filters.date === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return currentEntries;
}, [allEntries, filters, searchTerm, currentView]);

    const handleFilterChange = (column, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [column]: value
        }));
    };

   const handleDownload = () => {
    // Check if start and end dates are provided. This is the new mandatory check.
    if (!startDate || !endDate) {
        alert('Please select a start and end date to download the timesheet.');
        return; // Stop the function if dates are missing
    }

    // Filter all available entries based on the selected date range
    const dataToExport = allEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        // The check must include the full day for the end date
        const adjustedEndDate = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);

        return entryDate >= start && entryDate < adjustedEndDate;
    }).map(({ id, ...rest }) => rest); // Exclude the 'id' field

    // Optionally, check if any data was found for the selected range
    if (dataToExport.length === 0) {
        alert('No entries found for the selected date range. Please try different dates.');
        return;
    }

    // Create and download the Excel file
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheets');
    XLSX.writeFile(workbook, `timesheet_entries_${startDate}_to_${endDate}.xlsx`);

    // Close the modal after download
    setIsModalOpen(false);
};

    const handleViewTimesheet = () => {
        // Update the view state and close the modal.
        // The `useMemo` hook will handle the filtering of the fetched data.
        setCurrentView({ month: selectedMonth, year: selectedYear });
        setIsViewModalOpen(false);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (!employeeId) {
        return <p>Please log in to view your timesheets.</p>;
    }

    if (loading) return <p>Loading timesheets...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        
        <div className="timesheet-container">
           <div className="timesheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  
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
  <h2>Timesheet for {monthNames[currentView.month]} {currentView.year}</h2>
            <div className="table-wrapper">
                <table className="timesheet-table">
                    <thead>
                        <tr>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Date
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
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Client
                                <input
                                    type="text"
                                    placeholder="Search Client"
                                    value={filters.client}
                                    onChange={(e) => handleFilterChange('client', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Project
                                <input
                                    type="text"
                                    placeholder="Search Project"
                                    value={filters.project}
                                    onChange={(e) => handleFilterChange('project', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Login Time
                                <input
                                    type="text"
                                    placeholder="Search Time"
                                    value={filters.loginTime}
                                    onChange={(e) => handleFilterChange('loginTime', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Logout Time
                                <input
                                    type="text"
                                    placeholder="Search Time"
                                    value={filters.logoutTime}
                                    onChange={(e) => handleFilterChange('logoutTime', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
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
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
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
                                    {/* <td>{entry.date}</td> */}
                                    <td>{formatDate(entry.date)}</td>
                                    <td>{entry.client}</td>
                                    <td>{entry.project}</td>
                                    <td>{entry.loginTime}</td>
                                    <td>{entry.logoutTime}</td>
                                    <td>{entry.totalHours} Hrs</td>
                                    <td>{entry.remarks || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">No timesheet entries found for {monthNames[currentView.month]} {currentView.year}.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

function Performance() {
    const employeeId = localStorage.getItem("employeeId");
    const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
    const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
   
    const navigate = useNavigate();

 const [canViewTasks, setCanViewTasks] = useState(false);





    return (
   <Sidebar>
        
            <div className="main-content">
                <EmployeeTimesheets employeeId={employeeId} searchTerm={searchTerm} />
            </div>
     </Sidebar>
    );
}

export default Performance;
