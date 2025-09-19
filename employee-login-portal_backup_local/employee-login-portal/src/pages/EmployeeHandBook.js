import React from 'react';
import Sidebar from './Sidebar.js';
import './Dashboard.css';

function Performance() {
  // Correct path to PDF in the public folder
  const handbookUrl = process.env.PUBLIC_URL + '/XevyteHandbook-2025.pdf';

  return (
    <Sidebar>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '20px',
          gap: '20px', // space between buttons
          padding: '20px',
          textAlign: 'center'
        }}
      >
        {/* <h2>Employee Handbook</h2> */}

        {/* View PDF in a new tab */}
        <a
          href={handbookUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '5px',
            textDecoration: 'none',
            fontWeight: 'bold',
            transition: 'background-color 0.3s',
            marginTop:"20px"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#45a049')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4CAF50')}
        >
          View Handbook
        </a>

        {/* Download PDF */}
        <a
          href={handbookUrl}
          download
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            borderRadius: '5px',
            textDecoration: 'none',
            fontWeight: 'bold',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0b7dda')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2196F3')}
        >
          Download Handbook
        </a>
      </div>
    </Sidebar>
  );
}

export default Performance;
