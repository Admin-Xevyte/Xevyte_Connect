import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Managergoals.css';
import Sidebar from './Sidebar.js';
function ManagerGoals() {
  const [subordinates, setSubordinates] = useState([]);
  const [filteredSubordinates, setFilteredSubordinates] = useState([]); // New state for filtered list
  const [errorMessage, setErrorMessage] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const employeeId = localStorage.getItem('employeeId'); // Logged-in user's ID
  

useEffect(() => {
  if (!employeeId) {
    setErrorMessage('User ID not found. Please log in.');
    setIsManager(false);
    return;
  }

  // Try to fetch subordinates for this employeeId as manager
  fetch(`http://3.7.139.212:8080/api/goals/manager/${employeeId}/employees`)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      if (data.length > 0) {
        setSubordinates(data);
        setErrorMessage('');
        setIsManager(true); // Set true only if subordinates exist
      } else {
        setErrorMessage('No subordinates assigned to you.');
        setIsManager(false);
      }
    })
    .catch((error) => {
      console.error('Error fetching subordinates:', error);
      setErrorMessage('Failed to fetch subordinates.');
      setIsManager(false);
      setSubordinates([]);
    });
}, [employeeId]);

  // NEW: Filtering logic
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    if (subordinates.length > 0) {
      const tempFiltered = subordinates.filter(sub => {
        const id = sub.employeeId ? String(sub.employeeId).toLowerCase() : '';
        const name = sub.name ? sub.name.toLowerCase() : '';
        const email = sub.email ? sub.email.toLowerCase() : '';

        return (
          id.includes(lowercasedSearchTerm) ||
          name.includes(lowercasedSearchTerm) ||
          email.includes(lowercasedSearchTerm)
        );
      });
      setFilteredSubordinates(tempFiltered);
    } else {
      setFilteredSubordinates([]);
    }
  }, [searchTerm, subordinates]);

  const handleEmployeeClick = (empId) => {
    localStorage.setItem('selectedEmployeeId', empId);
    navigate('/employeegoal', { state: { employeeId: empId } });
  };

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
        {/* Original ManagerGoals Content */}
    {/* Original ManagerGoals Content */}
{!isManager ? (
  <div className="emp-container">
    <p className="emp-error">{errorMessage}</p>
  </div>
) : (
  <div className="emp-container">
  <h2 className="emp-title">My Team</h2>
  {errorMessage && <p className="emp-error">{errorMessage}</p>}

  <div
    className="table-wrapper"
    style={{
      maxHeight: 'calc(100vh - 300px)',
      overflowY: 'auto',
      overflowX: 'auto',
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
        {filteredSubordinates.length === 0 ? (
          <tr>
            <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
              No employee details found for your search criteria.
            </td>
          </tr>
        ) : (
          filteredSubordinates.map((emp) => (
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
        )}
      </tbody>
    </table>
  </div>
</div>

)}

      </div>
  </Sidebar>
  );
}

export default ManagerGoals;
