import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Managergoals.css';
import Sidebar from './Sidebar.js';
function ReviewerGoals() {
  // Performance component state
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  // ReviewerGoals original state
  const [employees, setEmployees] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const role = localStorage.getItem('role');







 useEffect(() => {
  if (!employeeId) {
    setErrorMessage('User ID not found. Please log in.');
    setIsAuthorized(false);
    return;
  }

  const url = `http://3.7.139.212:8080/api/goals/reviewer/${employeeId}/employees`;

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setEmployees(data);
        setErrorMessage('');
        setIsAuthorized(true); // ✅ show content
      } else {
        setEmployees([]);
        setErrorMessage('You are not assigned as a reviewer for any employees.');
        setIsAuthorized(false); // ❌ show access denied
      }
    })
    .catch((error) => {
      console.error('Error fetching employees:', error);
      setErrorMessage('Failed to fetch employees.');
      setEmployees([]);
      setIsAuthorized(false);
    });
}, [employeeId]);


  const handleEmployeeClick = (empId) => {
    localStorage.setItem('selectedEmployeeId', empId);
    navigate('/reviewergoals', { state: { employeeId: empId } });
  };
  
  // New filtering logic
  const filteredEmployees = employees.filter(emp => {
    if (searchTerm === '') {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      emp.employeeId?.toLowerCase().includes(lowerCaseSearchTerm) ||
      emp.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      emp.email?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });


  return (
     <Sidebar>
      <div className="main-content">
 <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            color: "#333",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            margin: "20px 0 20px 0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transition: "background-color 0.3s ease",
            width: "fit-content",
            display: "block",
          }}
        >
          ⬅ Back
        </button>
        {/* ReviewerGoals content */}
        <div className="emp-container">
          <h2 className="emp-title">My Team</h2>
          {errorMessage && <p className="emp-error">{errorMessage}</p>}
          
          {employees.length > 0 && (
            <div className="table-wrapper"
            style={{
      maxHeight: 'calc(100vh - 300px)', // 👈 limit height
      overflowY: 'auto',                // 👈 vertical scroll
      overflowX: 'auto',                // 👈 optional: scroll horizontally if needed
      border: '1px solid #ccc',
    }}
  >
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id || emp.employeeId}>
                        <td>
                          <button
                            type="button"
                            style={{ color: 'blue', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                            onClick={() => handleEmployeeClick(emp.employeeId)}
                          >
                            {emp.employeeId}
                          </button>
                        </td>
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
              No employee details found for your search criteria.
            </td>
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

export default ReviewerGoals;
