import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
function FinalHrGoalsWithLayout() {
 
  const employeeIdFromStorage = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));

  
  const [searchTerm, setSearchTerm] = useState('');

  const [filterTerms, setFilterTerms] = useState({
    quarter: '',
    status: '',
    goalTitle: '',
    goalDescription: '',
    metric: '', 
    target: '',
    rating: '', 
    selfAssessment: '',
    additionalNotes: '',
    achievedTarget: '', 
    managerComments: '',
    managerRating: '', 
    reviewerComments: '',
    employeeComments: '',
  });

  const navigate = useNavigate();

  // ====== FinalHrGoals workflow state/logic ======
  const location = useLocation();
  const initialEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [allGoals, setAllGoals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [comments, setComments] = useState({});

  // Sorting states
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const thStyle = { padding: '8px', textAlign: 'left' };
  const tdStyle = { padding: '8px', borderBottom: '1px solid #ddd', fontSize: '14px' };
  
  useEffect(() => {
    if (!employeeId) {
      setError('No employee ID selected.');
      setLoading(false);
      return;
    }
    fetchAllGoals();
  }, [employeeId]);

  const fetchAllGoals = async () => {
    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found. Please log in.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
        rawToken = rawToken.slice(1, -1);
      }
      const token = `Bearer ${rawToken}`;

      const response = await fetch(`http://3.7.139.212:8080/api/goals/employee/${employeeId}`, {
        method: 'GET',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Failed to fetch goals: ${message}`);
      }
      const data = await response.json();
      setAllGoals(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = async (goalId) => {
    setExpandedGoals(prev => ({ ...prev, [goalId]: !prev[goalId] }));
    if (comments[goalId]) return;
    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
        rawToken = rawToken.slice(1, -1);
      }
      const token = `Bearer ${rawToken}`;
      const response = await fetch(`http://3.7.139.212:8080/api/goals/${goalId}/comments`, {
        headers: { Authorization: token, 'Content-Type': 'application/json' }
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

  const handleFilterChange = (key, value) => {
    setFilterTerms(prev => ({ ...prev, [key]: value.toLowerCase() }));
  };

const filterAndSortGoals = () => {
  let filtered = [...allGoals];

  const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();

  // ✅ Global search across all fields and comments
  if (lowerCaseSearchTerm) {
    filtered = filtered.filter(goal => {
      // Convert all goal values to lowercase strings
      const goalValues = Object.values(goal)
        .filter(val => val !== null && val !== undefined)
        .map(val => String(val).toLowerCase());

      // Match with comments (if available)
      const hasMatchingComment = comments[goal.goalId]?.some(comment =>
        comment.commentText?.toLowerCase().includes(lowerCaseSearchTerm)
      );

      return (
        goalValues.some(val => val.includes(lowerCaseSearchTerm)) || hasMatchingComment
      );
    });
  }

  // ✅ Column filters
  Object.keys(filterTerms).forEach(key => {
    const filterValue = filterTerms[key]?.trim().toLowerCase();
    if (filterValue) {
      filtered = filtered.filter(goal => {
        if (key === 'employeeComments') {
          const hasMatchingComment = comments[goal.goalId]?.some(comment =>
            comment.commentText?.toLowerCase().includes(filterValue)
          );
          return hasMatchingComment;
        }

        let goalValue = goal[key];

        if (goalValue === undefined || goalValue === null) return false;
        goalValue = String(goalValue).toLowerCase();

        const exactMatchKeys = ['status', 'rating', 'managerRating', 'quarter'];
        if (exactMatchKeys.includes(key)) {
          return goalValue === filterValue;
        }

        return goalValue.includes(filterValue);
      });
    }
  });

  // ✅ Sorting
  if (sortConfig.key !== null) {
    filtered.sort((a, b) => {
      const aValue = String(a[sortConfig.key] ?? '').toLowerCase();
      const bValue = String(b[sortConfig.key] ?? '').toLowerCase();

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  } else {
    // Default: sort by goalId ascending
    filtered.sort((a, b) => {
      return Number(a.goalId) - Number(b.goalId);
    });
  }

  return filtered;
};

  const filteredAndSortedGoals = filterAndSortGoals();

  // ====== Render ======
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
        <div className="approved-goals-container">
          <h2>Goals for Employee ID: {employeeId}</h2>
          {loading && <p>Loading goals...</p>}
          {error && <p className="error">{error}</p>}
        {!loading && allGoals.length === 0 && (
  <p style={{ color: 'gray', fontWeight: 'bold' }}>No assigned goals for this employee.</p>
)}

{!loading && allGoals.length > 0 && filteredAndSortedGoals.length === 0 && (
  <p style={{ color: 'gray', fontWeight: 'bold' }}>No goals match your search criteria.</p>
)}

          {!loading && filteredAndSortedGoals.length > 0 && (
            <>
            <div
              style={{
                  maxHeight: 'calc(100vh - 300px)', 
                overflowY: 'auto',
                overflowX: 'hidden', 
                display: 'block',
                width: '100%',
              }}
            >
              <table
                style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  tableLayout: 'fixed',
                  wordWrap: 'break-word',
                  marginTop: 0,
                  border: '1px solid #ddd',
                }}
              >
                <thead
                  style={{
                    backgroundColor: ' #00b4c6',
                    color: 'white',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    lineheight:1.2
                   
                  }}
                >
                  <tr>
                    {/* <th style={{ ...thStyle, minWidth: '100px', backgroundColor: 'black' }}>
                      Quarter
                      <select value={filterTerms.quarter} onChange={(e) => handleFilterChange('quarter', e.target.value)} style={{ width: '100%', padding: '5px' }}>
                        <option value="">All</option>
                        <option value="q1">Q1</option>
                        <option value="q2">Q2</option>
                        <option value="q3">Q3</option>
                        <option value="q4">Q4</option>
                      </select>
                    </th>
                    <th style={{ ...thStyle, minWidth: '100px', cursor: 'pointer', backgroundColor: 'black' }} onClick={() => handleSort('goalId')}>
                      Goal ID {sortConfig.key === 'goalId' ? (sortConfig.direction === 'asc' ? '⬆️' : '⬇️') : '↕️'}
                      <input type="text" placeholder="Search..." value={filterTerms.goalId} onChange={(e) => handleFilterChange('goalId', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th> */}
                    <th style={{ ...thStyle, minWidth: '150px', backgroundColor:  'darkblue' , lineHeight: '2.0'  }}>
                       Title
                      <input type="text" placeholder="Search..." value={filterTerms.goalTitle} onChange={(e) => handleFilterChange('goalTitle', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th>
                    <th style={{ ...thStyle, minWidth: '200px', backgroundColor: 'darkblue' , lineHeight: '2.0' }}>
                     Description
                      <input type="text" placeholder="Search..." value={filterTerms.goalDescription} onChange={(e) => handleFilterChange('goalDescription', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th>
                    <th style={{ ...thStyle, minWidth: '100px', backgroundColor: 'darkblue' , lineHeight: '2.0'}}>
                      Weightage
                      <input type="text" placeholder="Search..." value={filterTerms.metric} onChange={(e) => handleFilterChange('metric', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th>
                    <th style={{ ...thStyle, minWidth: '100px', backgroundColor:'darkblue' , lineHeight: '2.0' }}>
                      Target
                      <input type="text" placeholder="Search..." value={filterTerms.target} onChange={(e) => handleFilterChange('target', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th>
                    <th style={{ ...thStyle, minWidth: '120px', backgroundColor: 'darkblue', color: 'white' }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <span style={{ fontWeight: 'bold' }}>Self Rating</span>
    <select
      value={filterTerms.rating}
      onChange={(e) => handleFilterChange('rating', e.target.value)}
      style={{
        width: '100%',
        padding: '4px',
        boxSizing: 'border-box',
      }}
    >
      <option value="">All</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
    </select>
  </div>
</th>


                    <th style={{ ...thStyle, minWidth: '200px', backgroundColor:'darkblue'  }}>
                     Self Assessment
                      <input type="text" placeholder="Search..." value={filterTerms.selfAssessment} onChange={(e) => handleFilterChange('selfAssessment', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th>
                    {/* <th style={{ ...thStyle, minWidth: '200px' , backgroundColor: 'black'}}>
                      EMP Additional Notes
                      <input type="text" placeholder="Search..." value={filterTerms.additionalNotes} onChange={(e) => handleFilterChange('additionalNotes', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th> */}
                    {/* <th style={{ ...thStyle, minWidth: '200px' , backgroundColor: 'black'}}>
                      MNG Achieved Target
                      <input type="text" placeholder="Search..." value={filterTerms.achievedTarget} onChange={(e) => handleFilterChange('achievedTarget', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th> */}
                    
                    <th style={{ ...thStyle, minWidth: '200px' , backgroundColor: 'darkblue' }}>
                      MNG Comments
                      <input type="text" placeholder="Search..." value={filterTerms.managerComments} onChange={(e) => handleFilterChange('managerComments', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th>
                  
                    <th style={{ ...thStyle, minWidth: '120px' , backgroundColor: 'darkblue' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      MNG Rating
                      <select value={filterTerms.managerRating} onChange={(e) => handleFilterChange('managerRating', e.target.value)} style={{ width: '100%', padding: '4px' }}>
                        <option value="">All</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </select>
                      </div>
                    </th>
                    {/* <th style={{ ...thStyle, minWidth: '200px', backgroundColor: 'black' }}>
                      Comments By Employee
                      <input type="text" placeholder="Search..." value={filterTerms.employeeComments} onChange={(e) => handleFilterChange('employeeComments', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th> */}
                    <th style={{ ...thStyle, minWidth: '200px', backgroundColor:'darkblue' }}>
                      Reviewer Comments
                      <input type="text" placeholder="Search..." value={filterTerms.reviewerComments} onChange={(e) => handleFilterChange('reviewerComments', e.target.value)} style={{ width: '100%', padding: '5px' }} />
                    </th>
                    <th style={{ ...thStyle, minWidth: '150px', backgroundColor: 'darkblue' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      Status
                      <select value={filterTerms.status} onChange={(e) => handleFilterChange('status', e.target.value)} style={{ width: '100%', padding: '4px' }}>
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="pending_admin_approval">Submited</option>
                        <option value="approved">Approved</option>
                        <option value="downloaded">Rejected</option>
                      </select>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedGoals.map(goal => (
                    <tr key={goal.goalId}>
                      {/* <td style={tdStyle}>{goal.quarter}</td>
                      <td style={tdStyle}>{goal.goalId}</td> */}
                      <td style={tdStyle}>{goal.goalTitle}</td>
                      <td style={tdStyle}>{goal.goalDescription}</td>
                      <td style={tdStyle}>{goal.metric}</td>
                      <td style={tdStyle}>{goal.target}</td>
                      <td style={tdStyle}>{goal.rating}</td>
                      <td style={tdStyle}>{goal.selfAssessment}</td>
                      {/* <td style={tdStyle}>{goal.additionalNotes}</td>
                      <td style={tdStyle}>{goal.achievedTarget}</td> */}
                      <td style={tdStyle}>{goal.managerComments}</td>
                      <td style={tdStyle}>{goal.managerRating}</td>
                      {/* <td style={tdStyle}>
                        <button onClick={() => toggleComments(goal.goalId)} style={{ background: 'none', border: 'none', cursor: 'pointer',color:'black' }}>
                          {expandedGoals[goal.goalId] ? '⬆️ Hide' : '⬇️ Show'}
                        </button>
                        {expandedGoals[goal.goalId] && (
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                            {comments[goal.goalId]?.length ? comments[goal.goalId].map((c, i) => (
                              <div key={i} style={{ padding: '0.3rem 0', borderBottom: '1px solid #eee' }}>
                                <strong>{i + 1}.</strong> {c.commentText}
                                <br />
                                <small style={{ color: '#777' }}>{new Date(c.commentedAt).toLocaleString()}</small>
                              </div>
                            )) : <p style={{ fontStyle: 'italic', color: '#666' }}>No comments.</p>}
                          </div>
                        )}
                      </td> */}
                      <td style={tdStyle}>{goal.reviewerComments ?? '-'}</td>
                      <td style={tdStyle}>{goal.status ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
    </Sidebar>
  );
}

export default FinalHrGoalsWithLayout;
