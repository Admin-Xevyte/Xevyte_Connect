import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
 import Sidebar from './Sidebar.js';
const EmployeeGoals = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const loggedInEmployeeId = localStorage.getItem("employeeId");

  // ---- Selected Employee (from navigation or localStorage) ----
  const initialSelectedEmployeeId =
    location.state?.employeeId || localStorage.getItem("selectedEmployeeId") || "";
  const initialSelectedEmployeeName =
    location.state?.employeeName || localStorage.getItem("selectedEmployeeName") || "User";
 
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialSelectedEmployeeId);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialSelectedEmployeeName);
 
  const reviewerId = location.state?.reviewerId;

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  // ====== EMPLOYEE GOALS STATE ======
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(false);
  const [goalInputs, setGoalInputs] = useState({});
 



  // ====== EMPLOYEE GOALS FETCH ======
  const getCurrentQuarter = () => {
    const m = new Date().getMonth() + 1;
    return m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
  };
  const currentQuarter = getCurrentQuarter();
 
  const fetchGoals = () => {
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
          throw new Error('Non-JSON response from server');
        }
        return res.json();
      })
      .then((data) => {
        const filtered = data.filter((g) => {
          const status = g.status?.toLowerCase() || '';
          return g.quarter === currentQuarter && status !== 'reviewed';
        });
 
        setGoals(filtered);
        const inputsInit = {};
        filtered.forEach(g => {
          inputsInit[g.goalId] = {
            managerComments: '',
            managerRating: '',
          };
        });
        setGoalInputs(inputsInit);
        setReviewed(filtered.length === 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
        setLoading(false);
      });
  };
 
  useEffect(() => {
    if (selectedEmployeeId) fetchGoals();
    else {
      setError('Employee ID missing in navigation state.');
      setLoading(false);
    }
  }, [selectedEmployeeId]);
 
  // **VALIDATION AND CHANGE HANDLER FOR MANAGER RATING**
  const handleManagerRatingChange = (e, goalId) => {
    const value = e.target.value;
    // Allow only empty string or a single digit from 1 to 5
    if (value === "" || /^[1-5]$/.test(value)) {
      setGoalInputs((prev) => ({
        ...prev,
        [goalId]: { ...prev[goalId], managerRating: value },
      }));
    }
  };
 
  const handleInputChange = (e, goalId, field) => {
    setGoalInputs((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: e.target.value },
    }));
  };
 
  const handleSubmitFeedback = async () => {
    try {
      const feedbackArray = filteredGoals
        .map(goal => ({
          goalId: goal.goalId,
          achievedTarget: goalInputs[goal.goalId]?.achievedTarget?.trim() || '',
          managerComments: goalInputs[goal.goalId]?.managerComments?.trim() || '',
          managerRating: goalInputs[goal.goalId]?.managerRating
            ? parseInt(goalInputs[goal.goalId].managerRating.trim())
            : null
        }));
 
      if (feedbackArray.length === 0) {
        alert('No goals to submit feedback for.');
        return;
      }
     
      // **MANDATORY FIELD VALIDATION**
      for (const feedback of feedbackArray) {
        // if (!feedback.achievedTarget) {
        //   alert(`Achieved Target for Goal ID ${feedback.goalId} is mandatory.`);
        //   return;
        // }
        if (!feedback.managerComments) {
          alert(`Manager Comments for Goal ID ${feedback.goalId} are mandatory.`);
          return;
        }
        if (!feedback.managerRating) {
          alert(`Manager Rating for Goal ID ${feedback.goalId} is mandatory.`);
          return;
        }
      }
 
      const feedbackResponse = await fetch('http://3.7.139.212:8080/api/goals/manager-feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackArray),
      });
      if (!feedbackResponse.ok) throw new Error(await feedbackResponse.text());
 
      const reviewedGoalIds = feedbackArray.map(goal => goal.goalId);
      const reviewResponse = await fetch('http://3.7.139.212:8080/api/goals/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds: reviewedGoalIds, status: 'reviewed' }),
      });
      if (!reviewResponse.ok) throw new Error(await reviewResponse.text());
 
      const remainingGoals = goals.filter(g => !reviewedGoalIds.includes(g.goalId));
      setGoals(remainingGoals);
      alert('Feedback submitted and goals marked as reviewed!');
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    }
  };
 
  // ===== FILTERING LOGIC (UPDATED) =====
const validStatuses = ['submitted', 'rejected by reviewer'];
  const filteredGoals = useMemo(() => {
    const statusFiltered = goals.filter((g) =>
      validStatuses.includes(g.status?.toLowerCase())
    );
 
    if (!searchTerm.trim()) {
      return statusFiltered;
    }
 
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
 
    return statusFiltered.filter((goal) => {
      const searchableText = [
        goal.quarter,
        goal.goalId,
        goal.goalTitle,
        goal.goalDescription,
        goal.metric, // weightage
        goal.target,
        goal.rating,
        goal.selfAssessment,
        goal.additionalNotes,
        // goalInputs[goal.goalId]?.achievedTarget,
        goalInputs[goal.goalId]?.managerComments,
        goalInputs[goal.goalId]?.managerRating,
      ]
        .map((item) => (item ? String(item).toLowerCase() : ''))
        .join(' ');
 
      return searchableText.includes(lowerCaseSearchTerm);
    });
  }, [goals, searchTerm, goalInputs]);
 
  const thStyle = {  textAlign: 'left',
    padding: '3px',
    borderBottom: '2px solid darkblue',
    color: 'white',
    backgroundColor: 'darkblue',
    fontSize:"15px"};
  const tdStyle = { padding: '8px' };
  const buttonStyle = { padding: '0.4rem 1rem', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' };
 
  return (
   <Sidebar>
      <div className="main-content">
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
 
        {/* ===== EmployeeGoals content below divider ===== */}
        <main style={{ padding: '1rem', flexGrow: 1, backgroundColor: '#f4f4f4' }}>
          {loading ? (
            <p style={{ textAlign: 'center' }}>Loading goals...</p>
          ) : (
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              <h3  style={{ marginBottom: "16px" }}>Goals</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0' }}>
                  <thead>
                    <tr>
                      {/* <th style={thStyle}>Quarter</th>
                      <th style={thStyle}>Goal ID</th> */}
                      <th style={{ ...thStyle, width: "10%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Title</th>
                      <th style={{thStyle, backgroundColor: "darkblue", textAlign:"center"}}>Description</th>
                      <th style={{ ...thStyle, width: "6%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Weightage</th>
                      <th style={{ ...thStyle, width: "5%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Target</th>
                      <th style={{ ...thStyle, width: "7%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Self Rating</th>
                      <th style={{ ...thStyle, width: "10%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Self Assessment</th>
                      {/* <th style={thStyle}> EMP Additional Notes</th> */}
                      {/* <th style={thStyle}>MNG Achieved Target <span style={{ color: 'red' }}>*</span></th> */}
                      <th style={{ ...thStyle, width: "8%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>MNG <span style={{ color: 'red' }}>*</span> Comments</th>
                      <th style={{ ...thStyle, width: "7%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>MNG  <span style={{ color: 'red' }}>*</span> Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGoals.length > 0 ? (
                      filteredGoals.map((g) => (
                        <tr key={g.goalId} style={{ borderBottom: '1px solid #ddd' }}>
                          {/* <td style={tdStyle}>{g.quarter}</td>
                          <td style={tdStyle}>{g.goalId}</td> */}
                          <td style={{tdStyle, maxWidth: '400px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word', textAlign:"center"}}>{g.goalTitle}</td>
                          <td style={{tdStyle,   maxWidth: '500px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word', textAlign:"center"}}>{g.goalDescription}</td>
                          <td style={{tdStyle, textAlign:"center"}}>{g.metric}</td>
                          <td style={{tdStyle,  maxWidth: '400px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',textAlign:"center"}}>{g.target}</td>
                          <td style={{tdStyle, textAlign:"center"}}>{g.rating ?? '-'}</td>
                          <td style={{tdStyle,  maxWidth: '500px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word', textAlign:"center"}}>{g.selfAssessment}</td>
                          {/* <td style={tdStyle}>{g.additionalNotes}</td> */}
                          {/* <td style={tdStyle}>
                            <textarea
                              value={goalInputs[g.goalId]?.achievedTarget || ''}
                              onChange={(e) => handleInputChange(e, g.goalId, 'achievedTarget')}
                              style={{ width: '100%' }}
                              rows={3}
                              placeholder="Achieved Target"
                              required
                            />
                          </td> */}
                          <td style={tdStyle}>
                            <textarea
                              value={goalInputs[g.goalId]?.managerComments || ''}
                              onChange={(e) => handleInputChange(e, g.goalId, 'managerComments')}
                              style={{ width: '100%' ,fontSize:"10px"}}
                              rows={3}
                              placeholder="Manager Comments"
                              required
                            />
                          </td>
                          <td style={{tdStyle, textAlign:"center"}}>
                            <input
                              type="text"
                              maxLength="1"
                              value={goalInputs[g.goalId]?.managerRating || ''}
                              onChange={(e) => handleManagerRatingChange(e, g.goalId)}
                              style={{ width: '50px',fontSize:"8px" }}
                              placeholder="Rating (1-5)"
                              required
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>
                          {searchTerm.trim() ? 'No goals found matching your search.' : 'All goals have been reviewed.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {!reviewed && filteredGoals.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={handleSubmitFeedback} style={buttonStyle}>Submit Feedback</button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
</Sidebar>
  );
};
 
export default EmployeeGoals;
