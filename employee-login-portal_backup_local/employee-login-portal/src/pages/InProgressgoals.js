import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
function EmployeeGoalDetails() {
  // ===== Sidebar / Topbar state & logic (from Performance) =====
  const employeeIdFromStorage = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();



  const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};


  // ===== Original EmployeeGoalDetails state & logic =====
  const location = useLocation();
  const thStyle = { padding: '8px',backgroundColor:"darkblue" , textAlign:"center"};
  const tdStyle = { padding: '8px', textAlign:"center" };

  const initialEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [comments, setComments] = useState({});

  const toggleComments = async (goalId) => {
    setExpandedGoals(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));

    if (comments[goalId]) return;

    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found');

      if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
        rawToken = rawToken.slice(1, -1);
      }

      const token = `Bearer ${rawToken}`;
      const response = await fetch(`http://3.7.139.212:8080/api/goals/${goalId}/comments`, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch comments: ${response.status} - ${text}`);
      }

      const data = await response.json();
      setComments(prev => ({ ...prev, [goalId]: data }));
    } catch (error) {
      console.error(error.message);
      setComments(prev => ({ ...prev, [goalId]: [] }));
    }
  };

  useEffect(() => {
    if (location.state?.employeeId && location.state.employeeId !== employeeId) {
      setEmployeeId(location.state.employeeId);
    }
  }, [location.state?.employeeId, employeeId]);

  useEffect(() => {
    if (employeeId) {
      localStorage.setItem('selectedEmployeeId', employeeId);
    }
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) {
      setError('Selected employee ID not found.');
      setLoading(false);
      return;
    }

    const fetchEmployeeGoals = async () => {
      try {
        let rawToken = localStorage.getItem('token');

        if (!rawToken) {
          throw new Error('No token found in localStorage. Please login.');
        }

        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          rawToken = rawToken.slice(1, -1);
        }

        const token = `Bearer ${rawToken}`;
        const response = await fetch(`http://3.7.139.212:8080/api/goals/employee/${employeeId}`, {
          method: 'GET',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error fetching goals: ${response.status} - ${text}`);
        }

        const data = await response.json();
        setGoals(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeGoals();
  }, [employeeId]);

  const pendingGoals = goals.filter(goal => goal.status?.toLowerCase() === 'in progress');

  // New: Filter goals based on the search term
  const filteredGoals = pendingGoals.filter(goal => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      (goal.goalId && String(goal.goalId).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalTitle && goal.goalTitle.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalDescription && goal.goalDescription.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.status && goal.status.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.startDate && goal.startDate.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.endDate && goal.endDate.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.targetDate && goal.targetDate.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.quarter && goal.quarter.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.metric && String(goal.metric).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.target && String(goal.target).toLowerCase().includes(lowerCaseSearchTerm)) ||
      // Check for comments if they exist
      (comments[goal.goalId]?.some(comment => comment.commentText.toLowerCase().includes(lowerCaseSearchTerm)))
    );
  });

  return (
      <Sidebar>
      <div className="main-content" style={{ flex: 1 }}>
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

        {/* Original EmployeeGoalDetails workflow */}
        <div style={{ padding: '20px' }}>
          <div
            className="header"
            style={{
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p  style={{ marginBottom: "-26px" , marginLeft:"-20px", marginTop:"-30px"}}>
              Goals for Employee ID:{' '}
              <span >{employeeId}</span>
            </p>
           
          </div>

          {loading && <p>Loading goals...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          {!loading && !error && filteredGoals.length === 0 && (
            <p>No pending goals found for this employee matching your search criteria.</p>
          )}

          {!loading && !error && filteredGoals.length > 0 && (
            <div
              style={{
                // maxHeight: 'calc(100vh-50vh)', 
                maxHeight: '50vh',// fixed table height
                overflowY: 'auto',
                border: '1px solid #ddd',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  boxShadow: '0 0 15px rgba(0,0,0,0.1)',
                }}
              >
                <thead
                  style={{
                    backgroundColor: '#007BFF',
                    color: 'black',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <tr>
                    {/* <th style={thStyle}>Quarter</th>
                    <th style={thStyle}>Goal ID</th> */}
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Weightage</th>
                    <th style={thStyle}>Target</th>
                    {/* <th style={thStyle}>Status</th> */}
                   <th style={{ ...thStyle, width: "15%" }}>Start Date</th>
<th style={{ ...thStyle, width: "15%" }}>End Date</th>
                    {/* <th style={thStyle}>Comments By Employee</th> */}
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.map((goal) => (
                    <tr
                      key={goal.goalId}
                      style={{
                        borderBottom: '1px solid #ddd',
                        textAlign: 'center',
                      }}
                    >
                      {/* <td style={tdStyle}>{goal.quarter}</td>
                      <td style={tdStyle}>{goal.goalId}</td> */}
                      <td style={{tdStyle, maxWidth: '400px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'}}>{goal.goalTitle}</td>
                      <td style={{tdStyle, maxWidth: '500px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'}}>{goal.goalDescription}</td>
                      <td style={tdStyle}>{goal.metric}</td>
                      <td style={tdStyle}>{goal.target}</td>
                      {/* <td
                        style={{
                          ...tdStyle,
                          color: '#FF8C00',
                          fontWeight: 'bold',
                        }}
                      >
                        {goal.status}
                      </td> */}
                     <td style={{ ...tdStyle, width: "15%" }}>{formatDate(goal.startDate)}</td>
<td style={{ ...tdStyle, width: "15%" }}>{formatDate(goal.endDate)}</td>
                      {/* <td style={tdStyle}>
                        <button
                          onClick={() => toggleComments(goal.goalId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color:"black",
                            cursor: 'pointer',
                            fontSize: '1rem',
                          }}
                        >
                          {expandedGoals[goal.goalId] ? '⬆️ Hide' : '⬇️ Show'}
                        </button>
                        {expandedGoals[goal.goalId] && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              backgroundColor: '#f9f9f9',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              maxHeight: '150px',
                              overflowY: 'auto',
                            }}
                          >
                            {comments[goal.goalId]?.length ? (
                              comments[goal.goalId].map((c, index) => (
                                <div
                                  key={index}
                                  style={{
                                    padding: '0.3rem 0',
                                    borderBottom: '1px solid #eee',
                                    fontSize: '0.9rem',
                                    color: '#333',
                                  }}
                                >
                                  <strong>{index + 1}.</strong> {c.commentText}
                                  <br />
                                  <small style={{ color: '#777' }}>
                                    {new Date(c.commentedAt).toLocaleString()}
                                  </small>
                                </div>
                              ))
                            ) : (
                              <p
                                style={{
                                  fontStyle: 'italic',
                                  color: '#666',
                                }}
                              >
                                No comments.
                              </p>
                            )}
                          </div>
                        )}
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
   </Sidebar>
  );
}

export default EmployeeGoalDetails;
