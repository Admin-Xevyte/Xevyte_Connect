import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.js';
import './Dashboard.css';
import './AttendancePage.css';

function Holiday() {
  const [allHolidays, setAllHolidays] = useState([]);

  useEffect(() => {
    // This hook fetches all holidays for the list view
    const allHolidaysData = [
      { date: '01-01-2025', day: 'WED', name: 'NEW YEAR' },
      { date: '14-01-2025', day: 'TUE', name: 'SANKRANTHI' },
      { date: '26-02-2025', day: 'WED', name: 'MAHA SHIVARATHRI (Optional)' },
      { date: '31-03-2025', day: 'MON', name: 'RAMAZAN (Optional)' },
      { date: '18-04-2025', day: 'FRI', name: 'GOOD FRIDAY (Optional)' },
      { date: '01-05-2025', day: 'THU', name: 'MAY DAY/LABOUR DAY*' },
      { date: '15-08-2025', day: 'FRI', name: 'INDEPENDENCE DAY*' },
      { date: '27-08-2025', day: 'WED', name: 'GANESHA CHATURDASHI' },
      { date: '09-09-2025', day: 'FRI', name: 'ID-MILAD' },
      { date: '02-10-2025', day: 'THU', name: 'GANDHI JAYANTHI*/ VIJAYADASHMI' },
      { date: '21-10-2025', day: 'TUE', name: 'DEEPAVALI AMAVASE' },
      { date: '25-12-2025', day: 'THU', name: 'CHRISTMAS' },
    ];
    setAllHolidays(allHolidaysData);
  }, []);

  const tableStyle = {
    maxWidth: "600px",
    width: "100%",
    margin: "0 auto",
    borderCollapse: "collapse",
  };

  const tableHeaderCellStyle = {
    padding: "6px 20px",
    borderBottom: "2px solid #ddd",
    textAlign: "center", // Keep centered for Date and Day
    backgroundColor: "darkblue",
    fontSize: '14px',
    color: 'white',
  };

  const tableBodyCellStyle = {
    padding: "6px 20px",
    borderBottom: "1px solid #eee",
    textAlign: "center", // Keep centered for Date and Day
    fontSize: '13px',
  };

  // New styles for the Holiday column
  const holidayHeaderStyle = {
    ...tableHeaderCellStyle,
    textAlign: "left", // Override to left-align
  };

  const holidayBodyStyle = {
    ...tableBodyCellStyle,
    textAlign: "left", // Override to left-align
    color: '#4b5563', // A darker color for better readability
  };

  const optionalHolidayStyle = {
    color: '#007bff', // Your preferred color for optional holidays
  };

  return (
    <Sidebar>
      <div className="main-content">
        <div style={{ padding: 5, fontFamily: "Arial" }}>
          <h2 style={{ textAlign: "center", marginBottom: '10px', fontSize: '18px' }}>
            Company Holidays 2025 (India)
          </h2>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderCellStyle}>Date</th>
                <th style={tableHeaderCellStyle}>Day</th>
                <th style={holidayHeaderStyle}>Holiday</th>
              </tr>
            </thead>
            <tbody>
              {allHolidays.map((holiday, index) => (
                <tr key={index}>
                  <td style={tableBodyCellStyle}>{holiday.date}</td>
                  <td style={tableBodyCellStyle}>{holiday.day}</td>
                  <td style={{ ...holidayBodyStyle, ...(holiday.name.includes('(Optional)') && optionalHolidayStyle) }}>
                    {holiday.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '5px', fontSize: '15px', textAlign: 'center', color: 'black', fontWeight: 'bold', marginTop:"20px" }}>
            Please note Shivaratri/ Ramazan/ Good Friday are optional leaves. You can avail of any one leave among the three.
          </p>
        </div>
      </div>
    </Sidebar>
  );
}

export default Holiday;
