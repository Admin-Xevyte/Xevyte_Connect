import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
 import Sidebar from './Sidebar.js';
// Move the ClickableCard component outside the main component
const ClickableCard = () => {
  const navigate = useNavigate();
 
  return (
    // Your ClickableCard JSX here
    // It's not clear from your original code what this component should render
    // but its definition needs to be at the top level.
    <div>
      {/* ... */}
    </div>
  );
};
 
const SummaryCard = ({ title, count, color, text, onClick }) => (
  <div
    onClick={onClick}
    style={{
      flex: '1 1 150px',
      backgroundColor: color,
      borderRadius: '8px',
      padding: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center',
      cursor: onClick ? 'pointer' : 'default',
    }}
  >
    <h4>{title}</h4>
    <p
      style={{
        fontSize: '2rem',
        margin: '0.5rem 0',
        color: text,
        fontWeight: 'bold',
      }}
    >
      {count}
    </p>
    <p>{title.includes('Goals') ? 'Goals' : 'Items'}</p>
  </div>
);
 
const EmployeeGoals = () => {
  const navigate = useNavigate();
  const location = useLocation();
   const employeeId = localStorage.getItem("employeeId");
  // ✅ Logged-in employee (from localStorage)
  const loggedInEmployeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || 'User');

  // ✅ Selected employee (from navigation or localStorage)
  const initialSelectedEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId') || '';
  const initialSelectedEmployeeName = location.state?.employeeName || localStorage.getItem('selectedEmployeeName') || '';
 
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialSelectedEmployeeId);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialSelectedEmployeeName);
 
  const reviewerId = location.state?.reviewerId;
  const [expandedGoals, setExpandedGoals] = useState({});
  const [comments, setComments] = useState({});
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(false);
 
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState("");

  const getCurrentQuarter = () => {
    const m = new Date().getMonth() + 1;
    return m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
  };
  const currentQuarter = getCurrentQuarter();
 
  const fetchGoals = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`http://3.7.139.212:8080/api/goals/employee/${selectedEmployeeId}`)
      .then(async (res) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Fetch failed: ${res.status} ${res.statusText} – ${msg}`);
        }
        if (!ct.includes('application/json')) {
          throw new Error('Non‑JSON response from server');
        }
        return res.json();
      })
      .then((data) => {
        const filtered = data.filter((g) => g.quarter === currentQuarter);
        setGoals(filtered);
        if (filtered.every((g) => g.status.toLowerCase() === 'reviewed')) {
          setReviewed(true);
        } else {
          setReviewed(false);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
        setLoading(false);
      });
  }, [selectedEmployeeId, currentQuarter]);
 
 
useEffect(() => {
  if (selectedEmployeeId) {
    // Corrected fetch URL
    fetch(`http://3.7.139.212:8080/api/goals/${selectedEmployeeId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Employee fetch response:", data);
       
        // Correctly access the name property from the returned object
        const name = data?.name;
       
        if (name) {
          setSelectedEmployeeName(name);
          localStorage.setItem('selectedEmployeeName', name);
        } else {
          console.error('Employee name not found in API response:', data);
          setSelectedEmployeeName('Unknown Employee');
        }
      })
      .catch(err => {
        console.error('Failed to fetch employee name:', err);
        setError('Failed to load employee details.');
        setSelectedEmployeeName('Unknown Employee');
      });
  } else {
    console.warn('No selectedEmployeeId found');
  }
}, [selectedEmployeeId]);
 
 
 
  // Fetch goals on mount
  useEffect(() => {
    if (selectedEmployeeId) {
      fetchGoals();
    } else {
      setError('Employee ID missing in navigation state.');
      setLoading(false);
    }
  }, [selectedEmployeeId, fetchGoals]);
 
  const toggleComments = async (goalId) => {
    setExpandedGoals((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
 
    if (!comments[goalId]) {
      try {
        const res = await fetch(`http://3.7.139.212:8080/api/goals/${goalId}/comments`);
        if (!res.ok) throw new Error("Failed to fetch comments");
        const data = await res.json();
        setComments((prev) => ({ ...prev, [goalId]: data }));
      } catch (err) {
        console.error(err);
        setComments((prev) => ({ ...prev, [goalId]: [] }));
      }
    }
  };
 
  const handleReview = async () => {
    try {
      const goalIds = goals.map(goal => goal.goalId);
      const response = await fetch('http://3.7.139.212:8080/api/goals/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds, status: 'reviewed' }),
      });
 
      if (!response.ok) {
        throw new Error('Failed to review goals');
      }
 
      const data = await response.json();
      console.log('Goals reviewed:', data);
      // Re-fetch goals to update the UI
      fetchGoals();
    } catch (error) {
      console.error(error);
    }
  };
 
  const handleSubmitFeedback = () => {
    navigate('/submitfeedback', {
      state: {
        selectedEmployeeId,
        reviewerId,
        goals,
      },
    });
  };
 
 
  const validStatuses = ['submitted', 'rejected by reviewer'];
  const submitFeedbackCount = goals.filter((g) => g.status?.toLowerCase() === 'submitted').length;
  const inProgressCount = goals.filter((g) =>
    ['inprogress', 'in progress'].includes(g.status?.toLowerCase())
  ).length;
  const rejectedCount = goals.filter((g) => g.status?.toLowerCase() === 'rejected').length;
  const pendingCount = goals.filter((g) => g.status?.toLowerCase() === 'pending').length;
  const filteredGoals = goals.filter((g) => validStatuses.includes(g.status?.toLowerCase()));
 
  const thStyle = {
    textAlign: 'left',
    padding: '3px',
    borderBottom: '2px solid darkblue',
    color: 'white',
    backgroundColor: 'darkblue',
    fontSize:"15px"
  };
 
  const tdStyle = {
    padding: '8px',
  };
 
  const buttonStyle = {
    padding: '0.4rem 1rem',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };
 
  return (
     <Sidebar>
      <div className="main-content">
       <h2 style={{textAlign:"Center"}}>Goals for {selectedEmployeeName} ({selectedEmployeeId})</h2>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <main
            style={{
              padding: '1rem',
              overflowY: 'auto',
              flexGrow: 1,
              backgroundColor: '#f4f4f4',
            }}
          >
           <div
  style={{
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  }}
>
  {/* 1. The "New Goal" Card */}
  <div
    onClick={() => navigate('/myteam/newgoal')}
    style={{
      flex: '1 1 200px',
      backgroundColor: '#b4e7f5ff',
      border: '1px dashed #007bff',
      borderRadius: '8px',
      padding: '1rem',
      textAlign: 'center',
      minHeight: '150px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'box-shadow 0.2s ease-in-out',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <h3>🎯 Set a New Team Goal</h3>
    <p style={{ marginTop: '0.5rem', color: '#007bff', fontWeight: 'bold' }}>
      + Add Goal
    </p>
  </div>
 
  {/* 2. "In Progress Goals" Card */}
  <div
    style={{
      flex: '1 1 200px',
      minHeight: '150px',
      display: 'flex',
    }}
  >
    <SummaryCard
      title="In Progress Goals"
      count={inProgressCount}
      color="#fff3e0"
      text="#e2a55aff"
      onClick={() => navigate('/inprogressgoals')}
    />
  </div>
 
  {/* 3. "Pending Goals" Card */}
  <div
    style={{
      flex: '1 1 200px',
      minHeight: '150px',
      display: 'flex',
    }}
  >
    <SummaryCard
      title="Pending Goals"
      count={pendingCount}
      color="#fffde7"
      text="#fbc02d"
    />
  </div>
 
  {/* 4. "Rejected Goals" Card */}
  <div
    style={{
      flex: '1 1 200px',
      minHeight: '150px',
      display: 'flex',
    }}
  >
    <SummaryCard
      title="Rejected Goals"
      count={rejectedCount}
      color="#ffebee"
      text="#e53935"
      onClick={() => navigate('/rejectedgoals')}
    />
  </div>
</div>
 
 
            {loading ? (
              <p style={{ textAlign: 'center' }}>Loading goals...</p>
            ) : (
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '1rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
              >
                <h3  style={{ marginBottom: "16px" }}>Goals</h3>
                 <div
                      style={{
                        maxHeight: '300px', // Set a specific max height for vertical scrolling
                        overflowY: 'auto', // Enables vertical scroll
                        overflowX: 'auto', // Enables horizontal scroll
                        border: '1px solid #ddd',
                      }}
                    >
                  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0' }}>
                   
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: "10%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Title</th>
                        {/* <th style={thStyle}>Goal ID</th> */}
                        <th style={{...thStyle, textAlign:"Center"}}>Description</th>
                        {/* <th style={thStyle}>Quarter</th> */}
                        <th style={{ ...thStyle, width: "2%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Weightage</th>
                        <th style={{ ...thStyle, width: "2%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Target</th>
                        <th style={{ ...thStyle, width: "5%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Self Rating</th>
                        <th style={{ ...thStyle, width: "15%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Self Assessment</th>
                        {/* <th style={thStyle}>Additional Notes</th>
                        <th style={thStyle}>Comments By Employee</th> */}
                        <th style={{ ...thStyle, width: "2%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGoals.map((g) => (
                        <tr key={g.goalId} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{
                            maxWidth: '400px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            textAlign:"center"
                          }}>{g.goalTitle}</td>
                         
                          {/* <td style={tdStyle}>{g.goalId}</td> */}
                          <td style={{
                          maxWidth: '500px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          {g.goalDescription}
                        </td>
                          {/* <td style={tdStyle}>{g.quarter}</td> */}
                           <td style={{tdStyle, textAlign:"center"}}>{g.metric}</td>
                          <td style={{tdStyle, textAlign:"center"}}>{g.target}</td>
                         
                          <td style={{tdStyle, textAlign:"center"}}>{g.rating ?? '-'}</td>
                         <td style={{ ...tdStyle, width: '200px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {g.selfAssessment ?? '-'}
      </td>
                          {/* <td style={tdStyle}>{g.additionalNotes ?? '-'}</td> */}
                          {/* <td style={tdStyle}>
                            <button
                              onClick={() => toggleComments(g.goalId)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'black' }}
                              title="Toggle Comments"
                            >
                              {expandedGoals[g.goalId] ? '⬆️ Hide' : '⬇️ Show'}
                            </button>
 
                            {expandedGoals[g.goalId] && (
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
                                {comments[g.goalId]?.length ? (
                                  comments[g.goalId].map((c, index) => (
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
                                      <small style={{ color: '#777' }}>{new Date(c.commentedAt).toLocaleString()}</small>
                                    </div>
                                  ))
                                ) : (
                                  <p style={{ fontStyle: 'italic', color: '#666' }}>No comments.</p>
                                )}
                              </div>
                            )}
                          </td> */}
                        <td style={tdStyle}>
                          <em>{g.status}</em>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!reviewed && (
                  <div
                    style={{
                      marginTop: '1rem',
                      display: 'flex',
                      gap: '0.5rem',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button onClick={handleSubmitFeedback} style={buttonStyle}>
                      Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
</Sidebar>
  );
};
 
export default EmployeeGoals;
 
