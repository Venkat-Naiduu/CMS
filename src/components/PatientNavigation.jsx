import React, { useEffect, useState } from "react";
import { Header, HeaderGlobalBar, HeaderGlobalAction } from "@carbon/react";
import { UserAvatar, Logout, Notification } from "@carbon/icons-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./TopNavigation.css";
import logo from "../logo.png";
import { useAuth } from "../App";

const navItems = [
  { name: "Dashboard", href: "/patient" },
  { name: "New Claim", href: "/claims_patient" },
];

const iconStyle = { color: '#161616' };

const iconButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  borderRadius: 4,
  padding: 4,
  transition: 'background 0.15s',
};

const PatientNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Debug logging


  useEffect(() => {
    // API call to fetch notifications for the patient
    fetch('/api/notifications?role=patient')
      .then(res => res.json())
      .then(data => {
        // For now, do nothing with data
      })
      .catch(err => {
        // Handle error if needed
      });
  }, []);

  return (
    <Header aria-label="Patient Portal" className="topnav-header">
      <div className="topnav-content">
        <div className="topnav-title-logo">
          <span className="topnav-claims-heading">Claims Management</span>
          <div className="topnav-logo-by">
            <span className="topnav-by-text">by</span>
            <img src={logo} alt="Logo" className="topnav-logo" />
          </div>
        </div>
        <div className="topnav-nav-bg">
          <nav className="topnav-nav">
            <span className="topnav-bar topnav-bar-full" />
            <ul>
              {navItems.map((item, idx) => (
                <React.Fragment key={item.name}>
                  <li>
                    <button
                      onClick={() => {
                        navigate(item.href, { replace: true });
                      }}
                      className={`nav-button ${location.pathname === item.href ? "topnav-link-selected" : ""}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        textDecoration: 'none'
                      }}
                    >
                      {item.name}
                    </button>
                  </li>
                  <span className="topnav-bar topnav-bar-full" />
                </React.Fragment>
              ))}
            </ul>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', gap: '1.5rem', position: 'relative' }}>

          
          <button
            className="patientnav-action-btn"
            aria-label="Notifications"
            onClick={() => setShowNotifications(v => !v)}
          >
            <Notification size={20} />
          </button>
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 32,
                right: 0,
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                borderRadius: 4,
                minWidth: 220,
                zIndex: 1000,
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.95rem', color: '#888' }}>No notifications are there</span>
            </div>
          )}

          <button
            className="patientnav-action-btn"
            aria-label="Logout"
            onClick={() => { logout(); navigate("/login"); }}
          >
            <Logout size={20} />
          </button>
        </div>
      </div>
    </Header>
  );
};

export default PatientNavigation; 