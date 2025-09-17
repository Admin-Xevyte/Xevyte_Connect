import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Managergoals.css';
import Sidebar from './Sidebar.js';
function ManagerGoals() {
  const [subordinates, setSubordinates] = useState([]);
  const [filteredSubordinates, setFilteredSubordinates] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
 
  const [searchTerm, setSearchTerm] = useState('');
 
  const [freezeSuccessMessage, setFreezeSuccessMessage] = useState("");
  
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false); // New state for modal
  const [freezeDates, setFreezeDates] = useState({
    startDate: '',
    endDate: ''
  });

  const modalRef = useRef(null);
  const navigate = useNavigate();
  const employeeId = localStorage.getItem('employeeId');




 


useEffect(() => {
  if (!employeeId) {
    setErrorMessage('User ID not found. Please log in.');
    setSubordinates([]);
    return;
  }
  
  // No role check anymore, always fetch subordinates for this employeeId as managerId
  fetch(`http://3.7.139.212:8080/api/goals/manager/${employeeId}/employees`)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      setSubordinates(data);
      setErrorMessage('');
    })
    .catch((error) => {
      console.error('Error fetching subordinates:', error);
      setErrorMessage('Failed to fetch subordinates.');
      setSubordinates([]);
    });
}, [employeeId]);

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
    localStorage.setItem("selectedEmployeeId", empId);
    navigate("/mngreq", { state: { employeeId: empId } });
  };

  const handleFreezeAllTimesheets = () => {
    setFreezeSuccessMessage(""); // Clear any previous messages
    if (filteredSubordinates.length === 0) {
      setFreezeSuccessMessage("No employees to freeze timesheets for.");
      setTimeout(() => setFreezeSuccessMessage(""), 4000);
      return;
    }
    // Open the modal to get dates from the user
    setIsFreezeModalOpen(true);
  };

  const confirmFreeze = async () => {
    if (!freezeDates.startDate || !freezeDates.endDate) {
      setFreezeSuccessMessage("Please select both a start and end date.");
      return;
    }
    if (freezeDates.startDate > freezeDates.endDate) {
      setFreezeSuccessMessage("Start date cannot be after end date.");
      return;
    }
    setIsFreezeModalOpen(false);
    setFreezeSuccessMessage("Freezing timesheets... Please wait.");
    
    let allSuccess = true;
    for (const emp of filteredSubordinates) {
      try {
        const payload = {
          managerId: employeeId,
          employeeId: emp.employeeId,
          startDate: freezeDates.startDate,
          endDate: freezeDates.endDate
        };

        const res = await fetch('http://3.7.139.212:8080/daily-entry/freeze', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to freeze timesheets for ${emp.name}: ${text}`);
        }
      } catch (error) {
        console.error(error.message);
        allSuccess = false;
        setFreezeSuccessMessage(`❌ ${error.message}`);
        break;
      }
    }

    if (allSuccess) {
      setFreezeSuccessMessage("✅ All subordinate timesheets have been frozen successfully.");
    }
    setTimeout(() => setFreezeSuccessMessage(""), 4000);
  };

  return (
      <Sidebar>
    <div className="dashboard-container">
    

      <div className="main-content">
        {freezeSuccessMessage && (
          <div style={{ color: freezeSuccessMessage.startsWith('❌') ? 'red' : 'green', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
            {freezeSuccessMessage}
          </div>
        )}

       <div className="emp-container">
  {errorMessage ? (
    <>
      <h2 className="emp-title">Error</h2>
      <p className="emp-error">{errorMessage}</p>
    </>
  ) : subordinates.length === 0 ? (
    <p className="emp-empty">No subordinates found.</p>
  ) : (
    <>
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
   
      {/* Freeze button */}
      {filteredSubordinates.length > 0 && (
        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <button
            onClick={handleFreezeAllTimesheets}
            style={{
              padding: '10px 15px',
              background: 'green',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Freeze All ' Timesheets '
          </button>
        </div>
      )}
         <h2 className="emp-title"> My Team </h2>
      {/* Subordinates table */}
      {filteredSubordinates.length === 0 ? (
        <p className="emp-empty">No subordinates found matching your search.</p>
      ) : (
        <div className="table-wrapper">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubordinates.map((emp) => (
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )}
</div>

      </div>

      {/* Freeze Timesheet Modal */}
      {isFreezeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div ref={modalRef} style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: '0', marginBottom: '20px' }}>Select Date Range to Freeze</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="startDate">Start Date:</label>
                <input
                  type="date"
                  id="startDate"
                  value={freezeDates.startDate}
                  onChange={(e) => setFreezeDates({ ...freezeDates, startDate: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="endDate">End Date:</label>
                <input
                  type="date"
                  id="endDate"
                  value={freezeDates.endDate}
                  onChange={(e) => setFreezeDates({ ...freezeDates, endDate: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            </div>
            {freezeSuccessMessage && (
              <p style={{ color: freezeSuccessMessage.startsWith('❌') ? 'red' : 'green', marginTop: '15px' }}>
                {freezeSuccessMessage}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setIsFreezeModalOpen(false)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmFreeze}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Confirm Freeze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Sidebar>
  );
}

export default ManagerGoals;
