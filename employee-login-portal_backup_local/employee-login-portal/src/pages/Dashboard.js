import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import image1 from '../assets/Xevytegrppic.jpg';
import image2 from '../assets/IMG_3104.JPG';
import image3 from '../assets/Media.jpeg';
import image4 from '../assets/IMG_6102 - Copy.JPG';
import image5 from '../assets/1C1A7036.JPG';
import image6 from '../assets/WhatsApp Image 2025-08-16 at 8.56.05 PM.jpeg';
import Sidebar from './Sidebar.js';
function Dashboard() {
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const navigate = useNavigate();
  const images = [
    { src: image1, name: 'City' },
    { src: image2, name: 'City' },
    { src: image3, name: 'City' },
    { src: image4, name: 'City' },
    { src: image5, name: 'City' },
    { src: image6, name: 'City' },
  ];

const filteredImages = images; // ✅ Show all images, ignore search input

  return (
  <Sidebar>
      <div className="main-content">
        <div className="image-grid">
          {filteredImages.map((img, idx) => (
            <img key={idx} src={img.src} alt={img.name} />
          ))}
        </div>
      </div>
      </Sidebar>
  );
}

export default Dashboard;
