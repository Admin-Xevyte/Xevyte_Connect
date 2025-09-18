import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
function Rejectedgoals() {
  // ===== Sidebar + Topbar (from Performance) =====
  const employeeIdLocal = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();




  // ===== Original Rejectedgoals Logic =====
  const location = useLocation();
  const initialEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reassignedGoalId = location.state?.reassignedGoalId;

  useEffect(() => {
    if (reassignedGoalId) {
      setGoals(prevGoals => prevGoals.filter(goal => goal.goalId !== reassignedGoalId));
      const newState = { ...location.state };
      delete newState.reassignedGoalId;
      navigate(location.pathname, { replace: true, state: newState });
    }
  }, [reassignedGoalId, location.state, navigate, location.pathname]);

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
        if (!rawToken) throw new Error('No token found in localStorage. Please login.');
        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          rawToken = rawToken.slice(1, -1);
        }
        const token = `Bearer ${rawToken}`;
        const response = await fetch(`http://3.7.139.212:8080/api/goals/employee/${employeeId}`, {
          method: 'GET',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error fetching goals: ${response.status} - ${text}`);
        }
        const data = await response.json();
        const filteredData = reassignedGoalId
          ? data.filter(goal => goal.goalId !== reassignedGoalId)
          : data;
        setGoals(filteredData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeGoals();
  }, [employeeId, reassignedGoalId]);

  const rejectedGoals = goals.filter(goal => goal.status?.toLowerCase() === 'rejected');

  // ✨ NEW: Filter the goals based on the search term
  const filteredGoals = rejectedGoals.filter(goal => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      (goal.quarter && goal.quarter.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalId && String(goal.goalId).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalTitle && goal.goalTitle.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalDescription && goal.goalDescription.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.metric && goal.metric.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.target && String(goal.target).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.rejectionReason && goal.rejectionReason.toLowerCase().includes(lowerCaseSearchTerm))
    );
  });

  const handleReassignClick = (goal) => {
    setGoals(prevGoals => prevGoals.filter(g => g.goalId !== goal.goalId));
    setTimeout(() => {
      navigate('/myteam/newgoal', {
        state: {
          employeeId,
          goalTitle: goal.goalTitle,
          goalDescription: goal.goalDescription,
          startDate: goal.startDate,
          endDate: goal.endDate,
          targetDate: goal.targetDate,
          quarter: goal.quarter,
          target: goal.target,
          metric: goal.metric,
          previousGoalId: goal.goalId,
          reassignedGoalId: goal.goalId,
        },
      });
    }, 50);
  };

  // 🆕 NEW: Function to handle goal deletion
  const handleDeleteClick = async (goalId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this goal? This action cannot be undone.");
    if (!isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`http://3.7.139.212:8080/api/goals/delete/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete goal: ${errorText}`);
      }

      // Update the UI by filtering out the deleted goal
      setGoals(prevGoals => prevGoals.filter(goal => goal.goalId !== goalId));
      alert('Goal deleted successfully!');
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Error deleting goal: ' + error.message);
    }
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
        {/* ===== Original Rejectedgoals UI under divider ===== */}
        <div className="employee-goal-container">
                   <h2>
            Rejected Goals From Employee ID:{" "}
            <span style={{}}>{employeeId}</span>
          </h2>

          {loading && <p>Loading goals...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !error && filteredGoals.length === 0 && (
            <p>No rejected goals found for this employee.</p>
          )}

          {!loading && !error && filteredGoals.length > 0 && (
            <div
              style={{
              maxHeight: "calc(100vh - 300px)",// fixed table height
                overflowY: "auto",
                border: "1px solid #ddd",
              }}
            >
             <table className="goal-table" style={{ width: "100%", borderCollapse: "collapse" }}>
  <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
    <tr>
      <th style={{ backgroundColor: "darkblue", color: "white", width: "25%", textAlign: "center" }}>Title</th>
      <th style={{ backgroundColor: "darkblue", color: "white", width: "25%", textAlign: "center" }}>Description</th>
      <th style={{ backgroundColor: "darkblue", color: "white", width: "5%", textAlign: "center" }}>Weightage</th>
      <th style={{ backgroundColor: "darkblue", color: "white", width: "5%", textAlign: "center" }}>Target</th>
      <th style={{ backgroundColor: "darkblue", color: "white", width: "25%", textAlign: "center" }}>Rejection Reason</th>
      <th style={{ backgroundColor: "darkblue", color: "white", width: "15%", textAlign: "center" }}>Actions</th>
    </tr>
  </thead>

  <tbody>
    {filteredGoals.map((goal) => (
      <tr key={goal.goalId}>
        <td style={{ wordWrap: "break-word", whiteSpace: "normal", maxWidth: "300px" }}>
          {goal.goalTitle}
        </td>
        <td style={{ wordWrap: "break-word", whiteSpace: "normal", maxWidth: "300px" }}>
          {goal.goalDescription}
        </td>
        <td style={{ textAlign: "center" }}>{goal.metric}</td>
        <td style={{ textAlign: "center" }}>{goal.target}</td>
        <td style={{ wordWrap: "break-word", whiteSpace: "normal", maxWidth: "300px" }}>
          {goal.rejectionReason || "N/A"}
        </td>
        <td style={{ textAlign: "center" }}>
          <button
            className="reassign-button"
            onClick={() => handleReassignClick(goal)}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "5px 5px",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Reassign
          </button>
          <button
            className="delete-button"
            onClick={() => handleDeleteClick(goal.goalId)}
            style={{
             margin:"10px 0px 20px 0px",
  
              backgroundColor: "red",
              color: "white",
              border: "none",
              padding: "5px 12px",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Delete
          </button>
        </td>
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

export default Rejectedgoals;
