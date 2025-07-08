import React from "react";
import { Header, HeaderGlobalBar, HeaderGlobalAction } from "@carbon/react";
import { UserAvatar, Logout, Notification } from "@carbon/icons-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./TopNavigation.css";
import logo from "../logo.png";
import { useAuth } from "../App";

const navItems = [
  { name: "Dashboard", href: "/" },
  { name: "New Claim", href: "/claims" },
  // { name: "Analytics", href: "/analytics" },
];

const iconStyle = { color: '#161616' };

const TopNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);

  // Fetch notifications from MirageJS API on mount
  React.useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        setNotifications(data.notifications);
      });
  }, []);

  // Remove notification by id
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Header aria-label="Claims Management" className="topnav-header">
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
                    {item.href.startsWith("/") ? (
                      <Link
                        to={item.href}
                        className={location.pathname === item.href ? "topnav-link-selected" : ""}
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <a href={item.href}>{item.name}</a>
                    )}
                  </li>
                  <span className="topnav-bar topnav-bar-full" />
                </React.Fragment>
              ))}
            </ul>
          </nav>
        </div>
        <HeaderGlobalBar className="topnav-actions">
          <HeaderGlobalAction aria-label="Notifications" onClick={() => setShowNotifications(v => !v)}>
            <Notification size={20} />
            {notifications.some(n => !n.read) && <span style={{position:'absolute',top:8,right:8,width:8,height:8,borderRadius:'50%',background:'#da1e28'}} />}
          </HeaderGlobalAction>
          {showNotifications && (
            <div style={{position:'absolute',top:48,right:60,zIndex:1000,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.12)',borderRadius:4,minWidth:260}}>
              <div style={{padding:8,fontWeight:600,borderBottom:'1px solid #eee'}}>Notifications</div>
              {notifications.length === 0 ? (
                <div style={{padding:12}}>No notifications</div>
              ) : notifications.map(n => (
                <div key={n.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:12,borderBottom:'1px solid #f4f4f4',color:n.read?'#888':'#161616'}}>
                  <span>{n.message}</span>
                  <button onClick={() => removeNotification(n.id)} style={{background:'none',border:'none',color:'#da1e28',fontWeight:700,fontSize:16,cursor:'pointer',marginLeft:8}} aria-label="Dismiss notification">×</button>
                </div>
              ))}
            </div>
          )}
          {/* User Icon - now static */}
          <HeaderGlobalAction aria-label="User Profile" style={{ cursor: 'default' }}>
            <UserAvatar />
          </HeaderGlobalAction>
          <HeaderGlobalAction aria-label="Logout" onClick={() => { logout(); navigate("/login"); }}>
            <Logout size={20} style={iconStyle} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </div>
    </Header>
  );
};

export default TopNavigation; 