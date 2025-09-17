import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';


import './Dashboard.css';
import './AttendancePage.css';
import Sidebar from './Sidebar.js';
function Holiday() {
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    const url = `http://3.7.139.212:8080/api/holidays/${year}/${month + 1}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch holidays");
        return r.json();
      })
      .then((data) => {
        const ds = data.map((h) => h.holidayDate);
        setHolidays(ds);
      })
      .catch((e) => {
        console.error(e);
        setHolidays([]);
      });
  }, [year, month]);

 
  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const fmt = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const headerStyle = { fontWeight: "bold", textAlign: "center", padding: "10px" };
  const cellStyle = {
    width: "100px",
    height: "50px",
    padding: "6px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    textAlign: "center",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box"
  };

  return (
      <Sidebar>
      <div className="main-content">
        <div style={{ padding: 20, fontFamily: "Arial" }}>
          <h2 style={{ textAlign: "center" }}>
            <button
              onClick={handlePrev}
              style={{
                padding: "6px 12px",
                marginRight: 10,
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: 5,
                background: "rgba(245, 240, 240, 1)",
                color: "black",
              }}
            >
              ⬅️ Prev
            </button> Holidays In {" "}
            {new Date(year, month).toLocaleString("default", { month: "long" })} {year}<button
              onClick={handleNext}
              style={{
                padding: "6px 12px",
                marginLeft: 10,
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: 5,
                background: "rgba(245, 240, 240, 1)",
                color: "black",
              }}
            >
              Next ➡️
            </button>
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 10,
              margin: "0 auto",
              maxWidth: 800,
            }}
          >

            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} style={headerStyle}>
                {d}
              </div>
            ))}

            {Array((firstDay.getDay() + 6) % 7)
              .fill(null)
              .map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
            {days.map((date, i) => {
              const iso = fmt(date);
              const dow = date.getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isHoliday = holidays.includes(iso);
          
              let bg = "#e8f7ff"; // default workday
              let titleText = `${iso}`;
              
              if (isWeekend) {
                bg = "#ffcccc";
                titleText += " (Weekend)";
              } else if (isHoliday) {
                bg = "#fff7b3";
                titleText += " (Holiday)";
              } 

              return (
                <div
                  key={iso}
                  
                  title={titleText}
                  style={{
                    ...cellStyle,
                    backgroundColor: bg,
                  }}
                >
                  <div>{date.getDate()}</div>
                </div>
              );
            })}
          </div>
          <div style={{ maxWidth: 900, margin: "20px auto", display: "flex", justifyContent: "center", gap: "30px", fontSize: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#ffcccc", borderRadius: 4, border: "1px solid #d9534f" }}></div>
              <span>Weekends</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#fff7b3", borderRadius: 4, border: "1px solid #d4af37" }}></div>
              <span>Holidays</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#e8f7ff", borderRadius: 4, border: "1px solid #5bc0de" }}></div>
              <span>Workdays</span>
            </div>
          </div>
        </div>
      </div>
  </Sidebar>
  );
}

export default Holiday;
