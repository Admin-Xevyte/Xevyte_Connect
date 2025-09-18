import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Newgoal.css';
 import Sidebar from './Sidebar.js';
const NewGoals = () => {
  const location = useLocation();
  const navigate = useNavigate();
const tbodyRef = useRef(null);
 
  // ✅ Logged-in employee (from localStorage)
  const loggedInEmployeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || 'User');

  // ✅ Selected employee (from navigation or localStorage)
  const initialSelectedEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId') || '';
  const initialSelectedEmployeeName = location.state?.employeeName || localStorage.getItem('selectedEmployeeName') || '';
 
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialSelectedEmployeeId);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialSelectedEmployeeName);
  const employeeId = localStorage.getItem("employeeId");

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const [goals, setGoals] = useState([]);


  const getCurrentQuarter = () => {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  };
 
  // ✅ Goals setup for selected employee
  useEffect(() => {
    if (selectedEmployeeId) {
      localStorage.setItem('selectedEmployeeId', selectedEmployeeId);
      localStorage.setItem('selectedEmployeeName', selectedEmployeeName);
 
      const quarter = location.state?.quarter || getCurrentQuarter();
 
      setGoals([
        {
          goalId: '',
          employeeId: selectedEmployeeId,
          employeeName: selectedEmployeeName,
          quarter,
          goalTitle: location.state?.goalTitle || '',
          goalDescription: location.state?.goalDescription || '',
          target: location.state?.target || '',
          metric: location.state?.metric || '',
          acknowledgedBy: '',
          acknowledgedAt: '',
          startDate: location.state?.startDate || '',
          endDate: location.state?.endDate || '',
          targetDate: location.state?.targetDate || '',
          previousGoalId: location.state?.previousGoalId || null,
        },
      ]);
    }
  }, [selectedEmployeeId, selectedEmployeeName, location.state]);
 
const handleChange = (index, field, value) => {
  const trimmedValue = value.slice(0, 255); // limit to 255 chars
  const updatedGoals = [...goals];
  updatedGoals[index][field] = trimmedValue;
  setGoals(updatedGoals);
};
 
const addGoal = () => {
  setGoals(prevGoals => [
    ...prevGoals,
    {
      goalId: '',
      employeeId: selectedEmployeeId,
      employeeName: selectedEmployeeName,
      quarter: getCurrentQuarter(),
      goalTitle: '',
      goalDescription: '',
      target: '',
      metric: '',
      acknowledgedBy: '',
      acknowledgedAt: '',
    },
  ]);
 
  setTimeout(() => {
    if (tbodyRef.current) {
      tbodyRef.current.scrollTop = tbodyRef.current.scrollHeight;
    }
  }, 100);  // slight delay to let React update the DOM
};
 
 
  const removeGoal = (index) => {
    const updatedGoals = goals.filter((_, i) => i !== index);
    setGoals(updatedGoals);
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (!selectedEmployeeId) {
      alert('Selected Employee ID is missing. Cannot submit goals.');
      return;
    }
 
    try {
      const previousGoalId = goals[0]?.previousGoalId;
 
      // Submit all new goals
      for (const goal of goals) {
        goal.employeeId = selectedEmployeeId;
        const response = await fetch('http://3.7.139.212:8080/api/goals/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goal),
        });
 
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save goal: ${errorText}`);
        }
      }
 
      // Delete previous goal if reassign
      if (previousGoalId) {
        await fetch(`http://3.7.139.212:8080/api/goals/delete/${previousGoalId}`, { method: 'DELETE' });
      }
 
      alert('Goals submitted successfully!');
      navigate(-1);
 
    } catch (error) {
      alert('Error submitting goals: ' + error.message);
      console.error('Detailed error:', error);
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
        {/* ✅ Below divider - Selected employee workflow */}
        <div className="goal-container3">
          <h2>Set Quarterly Goals for {selectedEmployeeName || 'Employee'} ({selectedEmployeeId || 'N/A'})</h2>
          {/* <h2>Set Quarterly Goals</h2> */}
 
          <form onSubmit={handleSubmit}>
          <div
  ref={tbodyRef}  // Add ref here
  style={{
    maxHeight: "calc(100vh - 350px)", // Fixed height for scroll container
    overflowY: "auto",
    display: "block",      // Important to keep table header fixed width
  }}
  className="table-wrapper"
>
  <table className="goals-table1 goals-style" style={{ width: "100%", tableLayout: "fixed" }}>
              <thead>
  <tr>
    <th style={{ width: '300px', textAlign: 'center' }}>Title</th>
    <th style={{ textAlign: 'center' }}>Description</th>
    <th style={{ width: '100px', textAlign: 'center' }}>Weightage</th>
    <th style={{ width: '80px', textAlign: 'center' }}>Target</th>
  </tr>
</thead>
 
             <tbody>
 
                  {goals.map((goal, index) => (
                    <tr key={index}>
                     
<td>
  <textarea
    value={goal.goalTitle}
    onChange={(e) => handleChange(index, 'goalTitle', e.target.value)}
    maxLength={255}
    rows={4}
    wrap="soft"
    style={{
      width: "100%",
      height: "auto",
      resize: "none",
      padding: "8px 10px",
      fontSize: "14px",
      lineHeight: "1.5",
      boxSizing: "border-box",
      overflowY: "scroll",
      scrollbarWidth: "none",
      msOverflowStyle: "none"
    }}
    required
  />
</td>
 
 
<td>
  <textarea
    rows={4}
    value={goal.goalDescription}
    onChange={(e) => handleChange(index, 'goalDescription', e.target.value)}
    maxLength={255}
    wrap="soft" // or "hard" if you want actual line breaks inserted
    required
    style={{
      width: "100%",
      fontSize: "14px",
      lineHeight: "1.5",
      padding: "8px 10px",
      resize: "none",
      boxSizing: "border-box",
      fontFamily: "inherit"
    }}
  />
</td>
 
 
<td style={{ position: "relative" }}>
  <input
    type="text"
    value={goal.metric}
    onChange={(e) => {
      const val = e.target.value;
      if (val === '' || (/^\d{1,3}$/.test(val) && parseInt(val) <= 100)) {
        handleChange(index, 'metric', val);
      }
    }}
    required
    style={{
      width: "100%",
      height: "100px",       // match textarea height (approx 4 rows)
      boxSizing: "border-box",
      padding: "8px 10px",   // same padding as textarea
      fontSize: "14px",
      fontFamily: "inherit",
      resize: "none"         // to visually match textarea style
    }}
  />
  <span style={{
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#555"
  }}></span>
</td>
 
<td>
  <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
    <input
      type="text"
      maxLength={1}
      value={goal.target || ""}
      onChange={(e) => {
        const val = e.target.value;
        if (val === '' || /^[0-9]$/.test(val)) {
          handleChange(index, "target", val);
        }
      }}
      required
      style={{
        width: "100%",
        height: "100px",
        boxSizing: "border-box",
        padding: "8px 10px",
        fontSize: "14px",
        fontFamily: "inherit",
        marginBottom: "3px"
      }}
    />
 
    {goals.length > 1 && (
      <button
        type="button"
        onClick={() => removeGoal(index)}
        style={{
          background: "transparent",
          border: "none",
          color: "black",
          fontSize: "18px",
          cursor: "pointer",
          padding: 0,
          margin: 0,
          lineHeight: 1
        }}
      >
        &minus;
      </button>
    )}
  </div>
</td>
 
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
 
            <div className="goal-actions">
              <button type="button" onClick={addGoal} className="add-btn">+ Add Another Goal</button>
              <button type="submit" className="save-btn">Submit</button>
            </div>
          </form>
        </div>
      </div>
  </Sidebar>
  );
};
 
export default NewGoals;
 
 
 
