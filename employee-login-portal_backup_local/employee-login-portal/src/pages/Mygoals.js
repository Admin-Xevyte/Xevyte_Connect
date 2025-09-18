import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Mygoals';
 import Sidebar from './Sidebar.js';
function Performance() {
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // State for goals functionality
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingGoalIds, setUpdatingGoalIds] = useState([]);
  const [rejectedGoalId, setRejectedGoalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [goalComments, setGoalComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [commentingGoalId, setCommentingGoalId] = useState(null);
  const commentCountersRef = useRef({});
 
  const [expandedCommentGoals, setExpandedCommentGoals] = useState([]);
 
  // Correct placement: Declare activeGoals and historyGoals before the useEffect that uses them.
  const historyGoals = goals.filter(goal => {
    const status = (goal.status || "").toLowerCase();
    return ["rejected", "submitted", "approved", "reviewed"].includes(status);
  });
 
  const activeGoals = goals.filter(goal => {
    const s = (goal.status || "").toLowerCase();
    return s === "pending" || s === "in progress";
  });
 
  // Place this directly inside your component function
const lowercasedSearchTerm = searchTerm.toLowerCase();
const filteredGoals = activeGoals.filter(goal => {
  return (
    (goal.goalTitle && goal.goalTitle.toLowerCase().includes(lowercasedSearchTerm)) ||
    (goal.goalDescription && goal.goalDescription.toLowerCase().includes(lowercasedSearchTerm)) ||
    (goal.quarter && goal.quarter.toLowerCase().includes(lowercasedSearchTerm)) ||
    (goal.metric && goal.metric.toLowerCase().includes(lowercasedSearchTerm)) ||
    (goal.target && String(goal.target).toLowerCase().includes(lowercasedSearchTerm)) ||
    (goal.goalId && String(goal.goalId).toLowerCase().includes(lowercasedSearchTerm))
  );
});

  // Goals related functions
  const normalizeGoal = (g) => {
    const goalId = g.goalId ?? g.id ?? g.goalID ?? g.goal_id;
    return { ...g, goalId };
  };
 
  const fetchGoals = () => {
    if (!employeeId) {
      setError("No employee logged in.");
      setLoading(false);
      return;
    }
 
    setLoading(true);
    fetch(`http://3.7.139.212:8080/api/goals/employee/${employeeId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch goals (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Data is not an array");
        console.log("Fetched goals:", data);
        const normalized = data.map(normalizeGoal);
        setGoals(normalized);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("fetchGoals error:", err);
        setError(err.message);
        setLoading(false);
      });
  };
 
  const toggleComments = (goalId) => {
    fetchComments(goalId);
    setExpandedCommentGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };
 
  const submitComment = async (goalId) => {
    if (!newComment.trim()) return;
 
    if (!commentCountersRef.current[goalId]) {
      commentCountersRef.current[goalId] = (goalComments[goalId]?.length || 0) + 1;
    } else {
      commentCountersRef.current[goalId] += 1;
    }
 
    const generatedCommenterId = `${commentCountersRef.current[goalId]}`;
 
    const payload = {
      commenterId: generatedCommenterId,
      commenterRole: "EMPLOYEE",
      commentText: newComment
    };
 
    try {
      const res = await fetch(`http://3.7.139.212:8080/api/goals/${goalId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
 
      if (!res.ok) throw new Error("Failed to post comment");
 
      setNewComment("");
      fetchComments(goalId);
      setCommentingGoalId(null);
    } catch (err) {
      console.error("submitComment error:", err);
    }
  };
 
  const fetchComments = (goalId) => {
    fetch(`http://3.7.139.212:8080/api/goals/${goalId}/comments`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch comments (${res.status})`);
        return res.json();
      })
      .then(data => {
        setGoalComments(prev => ({ ...prev, [goalId]: data }));
        commentCountersRef.current[goalId] = data.length;
      })
      .catch(err => {
        console.error("fetchComments error:", err);
      });
  };
 
  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);
 
  const updateGoalStatus = async (goalId, newStatus, feedback = "") => {
    if (updatingGoalIds.includes(goalId)) return false;
    setUpdatingGoalIds((prev) => [...prev, goalId]);
 
    try {
      let rawToken = localStorage.getItem("token");
      if (typeof rawToken === "string") {
        rawToken = rawToken.replace(/^"|"$/g, "");
      }
      const headers = { "Content-Type": "application/json" };
      if (rawToken) headers["Authorization"] = `Bearer ${rawToken}`;
 
      const payload = { status: newStatus };
      if (feedback && feedback.trim() !== "") payload.selfAssessment = feedback;
 
      console.log("Sending update:", goalId, payload);
 
      const response = await fetch(`http://3.7.139.212:8080/api/goals/${goalId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
 
      const text = await response.text();
      let updated;
      try {
        updated = text ? JSON.parse(text) : null;
      } catch (e) {
        updated = null;
      }
 
      if (!response.ok) {
        console.error("Update failed:", response.status, text);
        throw new Error(text || `Failed to update goal status (${response.status})`);
      }
 
      if (updated && (updated.goalId ?? updated.id)) {
        const updatedNormalized = normalizeGoal(updated);
        setGoals((prev) =>
          prev.map((g) => (String(g.goalId) === String(updatedNormalized.goalId) ? { ...g, ...updatedNormalized } : g))
        );
      } else {
        await fetchGoals();
      }
 
      return true;
    } catch (err) {
      console.error("updateGoalStatus error:", err);
      setError(err.message || String(err));
      return false;
    } finally {
      setUpdatingGoalIds((prev) => prev.filter((id) => id !== goalId));
    }
  };
 
  const handleAccept = async (goalId) => {
    if (updatingGoalIds.includes(goalId)) return;
 
    const prevGoals = goals;
    setGoals((prev) =>
      prev.map((g) =>
        String(g.goalId) === String(goalId)
          ? { ...g, status: "in progress" }
          : g
      )
    );
 
    const success = await updateGoalStatus(goalId, "in progress");
 
    if (!success) {
      setGoals(prevGoals);
      alert("Failed to accept goal — check console/server logs.");
    }
  };
 
  const handleReject = (goalId) => {
    setRejectedGoalId(goalId);
    setRejectionReason("");
  };
 
  const submitRejectionReason = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
 
    const goalId = rejectedGoalId;
    if (!goalId) return;
 
    const prevGoals = goals;
    setGoals((prev) => prev.map(g => (String(g.goalId) === String(goalId) ? { ...g, status: "rejected", selfAssessment: rejectionReason } : g)));
 
    const success = await updateGoalStatus(goalId, "rejected", rejectionReason.trim());
    if (success) {
      setRejectedGoalId(null);
      setRejectionReason("");
    } else {
      setGoals(prevGoals);
      alert("Failed to reject goal — check console/server logs.");
    }
  };
 
  // Styles from the second component
  const cardStyle = {
    backgroundColor: "#f9f9f9",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "30px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };
 
  const thStyle = {
    padding: "4px 6px", // smaller top-bottom padding
    fontSize: "13px", // smaller font
    lineHeight: "1.2", // tighter vertical spacing
    border: "1px solid #ddd",
    textAlign: "left",
    backgroundColor: "#f2f2f2",
    color: "black",
  };
 
  const tdStyle = {
    border: "1px solid #ddd",
    padding: "10px",
    verticalAlign: "top",
  };
 
  const buttonStyle = {
    padding: "8px 12px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    color: "white",
    backgroundColor: "#007bff",
  };
 
  const modalOverlayStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };
 
  const modalStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  };
 
  return (
      <Sidebar>
      <div className="main-content">
          <button
      onClick={() => navigate(-1)} // 3. Use the navigate function
      style={{
        padding: "8px 16px",
        backgroundColor: "#f0f0f0",
        color: "#333",
        fontSize: "16px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        cursor: "pointer",
         margin: "20px 0 10px 0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        transition: "background-color 0.3s ease",
        width: "fit-content",
        display: "block",
      }}
    >
      ⬅ Back
    </button>
 
        {/* Start of Merged Performance Content */}
        <div
          className="performce-content"
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            gap: "0", // space between tables
            padding: "10px"
          }}
        >
          {/* Active Goals Section */}
          <div
            style={{
              ...cardStyle,
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              maxHeight: "calc(100vh - 200px)"
            }}
          >
            <h3  style={{ marginBottom: "16px" }}>Active Goals</h3>
            {loading ? (
              <p>Loading...</p>
            ) : activeGoals.length === 0 ? (
              <p>No active goals to display.</p>
            ) : (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: "calc(100vh - 200px)", // ✅ height applied to scroll area
                  overflowY: "auto", // ✅ scroll inside
                  border: "1px solid #ddd",
                  borderRadius: "6px"
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    height: "calc(100vh-200px)",
                    margin: '0',
              minWidth: '100px'
                  }}
                >
                  <thead>
                      <tr
                        style={{
                          backgroundColor: "darkblue",
                          color: "white", // Change this to white or another light color for better contrast
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          marginTop:"20px"
                        }}
                      >
                        <th style={{ ...thStyle, width: "10%",backgroundColor: "darkblue", color: "white", textAlign:"Center"}}>Title</th>
                        <th style={{thStyle,backgroundColor: "darkblue", color: "white", textAlign:"Center"}}>Description</th>
                        <th style={{ ...thStyle, width: "%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Weightage</th>
                        <th style={{ ...thStyle, width: "2%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Target</th>
                        <th style={{ ...thStyle, width: "2%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                    {filteredGoals.map((goal) => {
                      const isUpdating = updatingGoalIds.includes(goal.goalId);
                      const isAccepted = (goal.status || "").toLowerCase() === "in progress";
 
                      return (
                        <tr
                          key={String(goal.goalId)}
                          style={{
                            fontSize: "14px", // compact text
                            padding: "6px 8px" // compact row height
                          }}
                        >
                          {/* <td style={tdStyle}>{goal.quarter}</td>
                          <td style={tdStyle}>{goal.goalId}</td> */}
                          <td style={{
                            maxWidth: '400px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            textAlign:"center"
                          }}>
                            {goal.goalTitle}
                          </td>
 
                         <td style={{
                          maxWidth: '500px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          {(goal.goalDescription.match(/.{1,55}/g) || []).join('\n')}
                        </td>
 
                          <td style={tdStyle}>{goal.metric}</td>
                          <td style={tdStyle}>{goal.target}</td>
 
 
                          {/* <td style={tdStyle}>
                            <button
                              onClick={() => {
                                fetchComments(goal.goalId);
                                setExpandedCommentGoals((prev) =>
                                  prev.includes(goal.goalId)
                                    ? prev.filter((id) => id !== goal.goalId)
                                    : [...prev, goal.goalId]
                                );
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                marginBottom: "5px",
                                color: "black"
                              }}
                            >
                              {expandedCommentGoals.includes(goal.goalId)
                                ? "⬆️ Hide Comments"
                                : "⬇️ Show Comments"}
                            </button>
                            {expandedCommentGoals.includes(goal.goalId) && (
                              <div
                                style={{
                                  maxHeight: "150px",
                                  overflowY: "auto",
                                  border: "1px solid #ccc",
                                  padding: "6px",
                                  marginBottom: "10px",
                                  borderRadius: "4px",
                                  background: "#fff"
                                }}
                              >
                                {(goalComments[goal.goalId] || []).length === 0 ? (
                                  <div style={{ fontStyle: "italic", color: "#888" }}>
                                    No previous comments.
                                  </div>
                                ) : (
                                  goalComments[goal.goalId].map((c, index) => (
                                    <div
                                      key={index}
                                      style={{
                                        padding: "6px 0",
                                        borderBottom: "1px solid #eee"
                                      }}
                                    >
                                      <strong>{index + 1}.</strong> {c.commentText}
                                      <div
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#666"
                                        }}
                                      >
                                        {new Date(c.commentedAt).toLocaleString()}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                fetchComments(goal.goalId);
                                setCommentingGoalId(
                                  commentingGoalId === goal.goalId ? null : goal.goalId
                                );
                              }}
                            >
                              {commentingGoalId === goal.goalId
                                ? "Cancel"
                                : "Add Comment"}
                            </button>
                            {commentingGoalId === goal.goalId && (
                              <div style={{ marginTop: "8px" }}>
                                <textarea
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Enter your comment..."
                                  rows={3}
                                  style={{ width: "100%" }}
                                />
                                <button
                                  type="button"
                                  style={{ marginTop: "5px" }}
                                  onClick={() => submitComment(goal.goalId)}
                                  disabled={!newComment.trim()}
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </td> */}
                          <td style={tdStyle}>
                            {isAccepted ? (
                              <button
                                style={{
                                  ...buttonStyle,
                                  backgroundColor: "#6c757d"
                                }}
                                disabled
                              >
                                🔒 Locked
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAccept(goal.goalId)}
                                  style={{
                                    ...buttonStyle,
                                    backgroundColor: "#28a745",
                                    marginRight: "8px"
                                  }}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? "Please wait..." : "Accept"}
                                </button>
                                <button
                                  onClick={() => handleReject(goal.goalId)}
                                  style={{
                                    ...buttonStyle,
                                    backgroundColor: "#dc3545",
                                    marginTop: "8px"
                                  }}
                                  disabled={isUpdating}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
 
          {rejectedGoalId && (
            <div style={modalOverlayStyle}>
              <div style={modalStyle}>
                <h3>Reject Goal ID: {rejectedGoalId}</h3>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                  rows={4}
                  style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button onClick={submitRejectionReason} style={buttonStyle}>Submit</button>
                  <button onClick={() => setRejectedGoalId(null)} style={{buttonStyle,  backgroundColor: "#dc3545"}}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
 
      </div>
 </Sidebar>
  );
}
 
export default Performance;
