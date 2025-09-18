import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Managergoals.css';
import Sidebar from './Sidebar.js';
function HrGoals() {
  // ===== Performance (Sidebar + Topbar) State =====
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // ===== HrGoals State =====
  const [employees, setEmployees] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isHR, setIsHR] = useState(false);
  const role = localStorage.getItem('role');


useEffect(() => {
  if (!employeeId) {
    setErrorMessage('User ID not found. Please log in.');
    setIsHR(false);
    return;
  }

  setIsHR(true);

  fetch(`http://3.7.139.212:8080/api/goals/hr/${employeeId}/employees`)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      setEmployees(data);
      setErrorMessage('');
    })
    .catch((error) => {
      console.error('Error fetching employees:', error);
      setErrorMessage('Failed to fetch employees.');
      setEmployees([]);
    });
}, [employeeId]);


  const handleEmployeeClick = (empId) => {
    localStorage.setItem('selectedEmployeeId', empId);
    navigate('/finalhrgoals', { state: { employeeId: empId } });
  };
  
  // New filtering logic
  const filteredEmployees = employees.filter(emp => {
    if (searchTerm === '') {
      return true; // No filter applied if search term is empty
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
    <div style={{ display: 'flex' }}>
      <div className="main-content" style={{ flex: 1 }}>
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
        {/* HrGoals Content */}
        <div className="emp-container" style={{ padding: '20px' }}>
          {!isHR ? (
            <>
           
              <p className="emp-error">{errorMessage}</p>
            </>
          ) : (
            <>
              <h2 className="emp-title">My Team</h2>
              {errorMessage && <p className="emp-error">{errorMessage}</p>}
             
             {employees.length > 0 && (
  <div
    className="table-wrapper"
    style={{
      maxHeight: 'calc(100vh - 300px)', // 👈 limit height
      overflowY: 'auto',                // 👈 vertical scroll
      overflowX: 'auto',                // 👈 optional: scroll horizontally if needed
      border: '1px solid #ccc',
    }}
  >
    <table className="emp-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead style={{ position: 'sticky', top: 0, background: '#f9f9f9', zIndex: 1 }}>
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
                  style={{
                    color: 'blue',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit',
                  }}
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
            <td colSpan="3" style={{ textAlign: 'center' }}>
              No employees found matching your search.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}

            </>
          )}
        </div>
      </div>
    </div>
    </Sidebar>
  );
}

export default HrGoals;
