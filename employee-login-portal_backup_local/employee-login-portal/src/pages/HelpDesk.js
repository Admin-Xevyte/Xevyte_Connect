import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
function Performance() {


  const navigate = useNavigate();



  return (
   <Sidebar>
    <div style={{
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  fontSize:"40px" // full viewport height
}}>
  <h2>Coming Soon.......</h2>
</div>
</Sidebar>
  );
}

export default Performance;
