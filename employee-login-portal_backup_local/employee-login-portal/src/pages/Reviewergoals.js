import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
function ReviewerApprovedGoalsWithLayout() {
  // ===== PERFORMANCE (Sidebar + Topbar) STATE =====
  const employeeIdStored = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
 
  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // ===== REVIEWER APPROVED GOALS STATE =====
  const initialEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [allGoals, setAllGoals] = useState([]);
  const [approvedGoals, setApprovedGoals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [reviewerCommentsMap, setReviewerCommentsMap] = useState({});
  const [savingComments, setSavingComments] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [comments, setComments] = useState({});
  const thStyle = { padding: '8px' };
  const tdStyle = { padding: '8px' };


  // ===== REVIEWER APPROVED GOALS: Fetch Goals =====
  useEffect(() => {
    if (!employeeId) {
      setError('No employee ID provided.');
      setLoading(false);
      return;
    }
    fetchGoals();
  }, [employeeId]);

  const fetchGoals = async () => {
    setLoading(true);
    setError('');
    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found, please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;
      const response = await fetch(`http://3.7.139.212:8080/api/goals/employee/${employeeId}`, {
        headers: { Authorization: token, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to fetch goals: ${await response.text()}`);
      const data = await response.json();
      setAllGoals(data);
      const approved = data.filter(goal => goal.status?.toLowerCase() === 'reviewed');
      setApprovedGoals(approved);
      const initialCommentsMap = {};
      approved.forEach(goal => { initialCommentsMap[goal.goalId] = goal.reviewerComments || ''; });
      setReviewerCommentsMap(initialCommentsMap);
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
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;
      const response = await fetch(`http://3.7.139.212:8080/api/goals/${goalId}/comments`, {
        headers: { Authorization: token, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`Failed to fetch comments: ${await response.text()}`);
      const data = await response.json();
      setComments(prev => ({ ...prev, [goalId]: data }));
    } catch {
      setComments(prev => ({ ...prev, [goalId]: [] }));
    }
  };

  const saveReviewerComments = async () => {
    setSavingComments(true);
    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found, please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;
      for (const [goalId, reviewerComments] of Object.entries(reviewerCommentsMap)) {
        const response = await fetch(`http://3.7.139.212:8080/api/goals/${goalId}/reviewer-comments`, {
          method: 'PUT',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewerComments }),
        });
        if (!response.ok) throw new Error(`Failed to update goal ${goalId}`);
      }
    } finally {
      setSavingComments(false);
    }
  };

  const updateAllGoalsStatus = async (newStatus) => {
    if (batchUpdating) return;
    if (approvedGoals.length === 0) return alert('No goals available for update.');
    setBatchUpdating(true);
    try {
      await saveReviewerComments();
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found, please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;
      const goalIds = approvedGoals.map(goal => goal.goalId);
      const response = await fetch(`http://3.7.139.212:8080/api/goals/review`, {
        method: 'PATCH',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds, status: newStatus }),
      });
      if (!response.ok) throw new Error(`Failed to update goals status`);
      alert(`Updated ${goalIds.length} goals to "${newStatus}".`);
      setApprovedGoals([]);
    } catch (err) {
      alert(`Error during update: ${err.message}`);
    } finally {
      setBatchUpdating(false);
    }
  };

  const handleCommentChange = (goalId, value) => {
    setReviewerCommentsMap(prev => ({ ...prev, [goalId]: value }));
  };

  // Filter goals based on the search term
  const filteredGoals = approvedGoals.filter(goal => {
    if (!searchTerm) {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      goal.goalTitle?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.goalDescription?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.quarter?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.metric)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.target)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.status?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.rating)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.selfAssessment?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.additionalNotes?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.achievedTarget)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.managerComments?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.managerRating)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.reviewerComments?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.goalId)?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const cellStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
    verticalAlign: 'top',
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

        {/* ===== REVIEWER APPROVED GOALS CONTENT BELOW DIVIDER ===== */}
        <div style={{ padding: '20px' }}>
          <h2>Goals for Employee ID: <span style={{ padding: '2px 6px' }}>{employeeId}</span></h2>
          {loading && <p>Loading goals...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && !error && (
            <div
              style={{
                maxHeight: 'calc(100vh - 350px)',
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
                    backgroundColor: 'darkblue',
                    color: 'white',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <tr>
                    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Title</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Description</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white', width: '110px' }}>Weightage</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white', width: '80px' }}>Target</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white', width: '80px' }}>Self Rating</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Self Assessment</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>MNG Comments</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white', width: '80px' }}>MNG Rating</th>
                    <th style={{ backgroundColor: 'darkblue' }}>Reviewer Comments <span style={{ color: "red" }}>*</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.length > 0 ? (
                    filteredGoals.map((goal) => (
                      <tr key={goal.goalId}>
                        <td style={cellStyle}>{goal.goalTitle}</td>
                        <td style={cellStyle}>{goal.goalDescription}</td>
                        <td style={cellStyle}>{goal.metric}</td>
                        <td style={cellStyle}>{goal.target}</td>
                        <td style={cellStyle}>{goal.rating}</td>
                        <td style={cellStyle}>{goal.selfAssessment}</td>
                        <td style={cellStyle}>{goal.managerComments}</td>
                        <td style={cellStyle}>{goal.managerRating}</td>
                        <td style={cellStyle}>
                          <textarea
                            value={reviewerCommentsMap[goal.goalId] || ''}
                            onChange={(e) => handleCommentChange(goal.goalId, e.target.value)}
                            rows={3}
                            style={{
                              width: '100%',
                              resize: 'none',
                              overflowY: 'auto',
                              overflowX: 'hidden',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word',
                              lineHeight: '1.4',
                              fontFamily: 'inherit',
                            }}
                            maxLength={200}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', border: '1px solid #ddd', padding: '10px' }}>
                        No goals found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && approvedGoals.length > 0 && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => updateAllGoalsStatus('approved')}
                disabled={batchUpdating}
                style={{
                  backgroundColor: 'green',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  cursor: batchUpdating ? 'not-allowed' : 'pointer',
                  opacity: batchUpdating ? 0.6 : 1,
                  borderRadius: '4px',
                }}
              >
                Approve All Goals
              </button>
              <button
                onClick={() => updateAllGoalsStatus('rejected by reviewer')}
                disabled={batchUpdating}
                style={{
                  backgroundColor: "#dc3545",
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  cursor: batchUpdating ? 'not-allowed' : 'pointer',
                  opacity: batchUpdating ? 0.6 : 1,
                  borderRadius: '4px',
                }}
              >
                Reject All Goals
              </button>
            </div>
          )}
        </div>
      </div>
</Sidebar>
  );
}

export default ReviewerApprovedGoalsWithLayout;
