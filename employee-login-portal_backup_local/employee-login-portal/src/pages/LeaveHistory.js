
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
function LeaveHistory() {
    
    const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

    const employeeId = localStorage.getItem("employeeId");
    const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
    
    const [searchTerm, setSearchTerm] = useState('');
    
    const [successMessage, setSuccessMessage] = useState("");

    const navigate = useNavigate();

    // Leave history states
    const [leavesData, setLeavesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    // Filter and sort states
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
    const [filters, setFilters] = useState({
        leaveType: '',
        totalDays: '',
        reason: '',
        fileName: '',
        rejectionReason: '',
        status: '',
    });
   

  

    // Fetch leave history data
    useEffect(() => {
        if (!employeeId) {
            console.error("Employee ID not found. Redirecting to login.");
            navigate("/login");
            return;
        }

        const fetchLeaveHistory = async () => {
            setLoading(true);
            setApiError("");
            try {
                const res = await fetch(`http://3.7.139.212:8080/leaves/employee/${employeeId}`);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                if (Array.isArray(data)) {
                    setLeavesData(data);
                } else {
                    setApiError("Invalid data format from server.");
                }
            } catch (err) {
                console.error("Failed to fetch leave history:", err);
                setApiError("Failed to load leave history. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchLeaveHistory();
    }, [employeeId, navigate]);

    
 
    const getStatusColor = (status) => {
    switch (status) {
        case 'Approved':
            return 'transparent';
        case 'Pending':
            return 'transparent';
        case 'Rejected':
            return 'transparent';
        case 'Cancelled':
            return 'transparent'; // you can change color if needed (e.g., gray/red)
        default:
            return 'transparent';
    }
};

    const handleCancelLeave = async (leaveId) => {
        if (window.confirm("Are you sure you want to cancel this leave request?")) {
            try {
                const res = await fetch(`http://3.7.139.212:8080/leaves/cancel/${leaveId}`, {
                    method: 'PUT',
                });
                
                if (res.ok) {
                    // Update status locally instead of removing row
                    setLeavesData(prevLeaves =>
                        prevLeaves.map(leave =>
                            leave.id === leaveId ? { ...leave, status: "Cancelled" } : leave
                        )
                    );
                    setSuccessMessage("Leave request cancelled successfully!");
                    setTimeout(() => setSuccessMessage(""), 2000);
                } else {
                    const errorText = await res.text();
                    throw new Error(`HTTP error! status: ${res.status}, Message: ${errorText}`);
                }
            } catch (err) {
                console.error("Failed to cancel leave:", err);
                setApiError("Failed to cancel leave. Please try again.");
                setTimeout(() => setApiError(""), 3000);
            }
        }
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Refined function for filtering and sorting
    const sortedAndFilteredLeaves = () => {
        let leavesToProcess = [...leavesData];
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        // 1. Apply global search filter first
        if (lowercasedSearchTerm) {
            leavesToProcess = leavesToProcess.filter(leave =>
                Object.values(leave).some(value =>
                    value && value.toString().toLowerCase().includes(lowercasedSearchTerm)
                )
            );
        }

        // 2. Apply individual column filters on the globally filtered data
        const finalFilteredLeaves = leavesToProcess.filter(leave => {
            const leaveTypeMatch = filters.leaveType === '' || (leave.type && leave.type.toLowerCase() === filters.leaveType.toLowerCase());
            const totalDaysMatch = filters.totalDays === '' || (leave.totalDays && leave.totalDays.toString().includes(filters.totalDays));
            const reasonMatch = filters.reason === '' || (leave.reason && leave.reason.toLowerCase().includes(filters.reason.toLowerCase()));
            const fileNameMatch = filters.fileName === '' || (leave.fileName && leave.fileName.toLowerCase().includes(filters.fileName.toLowerCase()));
            const rejectionReasonMatch = filters.rejectionReason === '' || (leave.rejectionReason && leave.rejectionReason.toLowerCase().includes(filters.rejectionReason.toLowerCase()));
            const statusMatch = filters.status === '' || (leave.status && leave.status.toLowerCase() === filters.status.toLowerCase());
            
            return leaveTypeMatch && totalDaysMatch && reasonMatch && fileNameMatch && rejectionReasonMatch && statusMatch;
        });

        // 3. Apply sorting
        if (sortConfig.key !== null) {
            finalFilteredLeaves.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }
                
                if (sortConfig.key === 'totalDays') {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return finalFilteredLeaves;
    };

    const leavesToDisplay = sortedAndFilteredLeaves();

    const getSortIndicator = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
        }
        return '';
    };

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

                {/* Leave History Content */}
                <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                    <h2 style={{ marginBottom: '20px' }}>My Leave History </h2>
                    {loading ? (
                        <div style={{ textAlign: 'center' }}>Loading...</div>
                    ) : leavesData.length === 0 ? (
                        <div style={{ textAlign: 'center' }}>No leave history found.</div>
                    ) : (
                        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px', backgroundColor: '#fff', padding:'0', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                            <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', cursor: 'pointer', position: 'sticky', top: '0' }} onClick={() => handleSort('id')}>
                                            Leave_Id {getSortIndicator('id')}
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Leave Type
                                       <select
                                        name="leaveType"
                                        value={filters.leaveType}
                                        onChange={handleFilterChange}
                                      style={{ padding: '4px', textAlign: 'left', border: '1px solid #ddd', color: '#070202ff', cursor: 'pointer', position: 'sticky', top: '0' }}
                                    >
                                        <option value="">All</option>
                                        <option value="Sick Leave">Sick Leave</option>
                                        <option value="Casual Leave">Casual Leave</option>
                                        <option value="Maternity Leave">Maternity Leave</option>
                                        <option value="Paternity Leave">Paternity Leave</option>
                                         <option value="LOP">LOP</option>
                                        {/* Add more if needed */}
                                    </select>

                                        </th>
                                        <th style={{ padding: '15px', marginTop:'-9px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', cursor: 'pointer', position: 'sticky', top: '0' }} onClick={() => handleSort('startDate')}>
                                            Start Date {getSortIndicator('startDate')}
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', cursor: 'pointer', position: 'sticky', top: '0' }} onClick={() => handleSort('endDate')}>
                                            End Date {getSortIndicator('endDate')}
                                        </th>
                                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0', marginBottom: '10px' }}>
                                            Total days
                                            <input
                                                type="number"
                                                name="totalDays"
                                                placeholder="Search..."
                                                value={filters.totalDays}
                                                  min="1"
                                                onChange={handleFilterChange}
                                                style={{ marginLeft: '5px', fontSize: '14px', padding: '5px', width: '100px' }}
                                            />
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Reason
                                            <input type="text" name="reason" placeholder="Search..." value={filters.reason} onChange={handleFilterChange} style={{ marginLeft: '10px', fontSize: '14px', padding: '5px', width: '100px' }} />
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Uploaded File
                                            <input type="text" name="fileName" placeholder="Search..." value={filters.fileName} onChange={handleFilterChange} style={{ marginLeft: '10px', fontSize: '14px', padding: '5px', width: '100px' }} />
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Rejected Reason
                                            <input type="text" name="rejectionReason" placeholder="Search..." value={filters.rejectionReason} onChange={handleFilterChange} style={{ marginLeft: '10px', fontSize: '14px', padding: '5px', width: '100px' }} />
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Status
                                            <select name="status" value={filters.status} onChange={handleFilterChange} style={{ marginLeft: '10px', fontSize: '14px', padding: '5px' }}>
                                                <option value="">All</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                {/* <option value="Approved by HR">Approved by HR</option> */}
                                                <option value="Rejected">Rejected</option>
                                               <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                               <tbody>
                                {leavesToDisplay.map((leave) => (
                                    <tr key={leave.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>{leave.id}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.type}</td>
                                       <td style={{ padding: '12px', border: '1px solid #ddd' }}>{formatDate(leave.startDate)}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{formatDate(leave.endDate)}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>{leave.totalDays}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd',  wordWrap: 'break-word',
                                        wordBreak: 'break-all',
                                        whiteSpace: 'normal',  width: '25%'}}>{leave.reason}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
    {leave.fileName ? (
       <a
            href={`/download/${leave.id}`} download={leave.fileName}
            style={{ color: '#007bff', textDecoration: 'underline' }}
            title={leave.fileName} // This attribute displays the full name on hover
        >
            {leave.fileName.length > 10 ? 
                `${leave.fileName.substring(0, 10)}...` : 
                leave.fileName}
        </a> 
    ) : (
        <span>No File</span>
    )}
</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd',  wordWrap: 'break-word',
                                        wordBreak: 'break-all',
                                        whiteSpace: 'normal',  width: '25%'}}>{leave.rejectionReason}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                            <span style={{
                                                padding: '5px 10px',
                                                borderRadius: '15px',
                                                color: 'black',
                                                fontSize: '18px',
                                                backgroundColor: getStatusColor(leave.status),
                                            }}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {leave.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleCancelLeave(leave.id)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {leavesToDisplay.length === 0 && (
                                    <tr>
                                        <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>No leaves found matching the current filters.</td>
                                    </tr>
                                )}
                            </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
    </Sidebar>
    );
}
export default LeaveHistory;
