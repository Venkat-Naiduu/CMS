import React, { useState, createContext, useContext } from "react";
import TopNavigation from "./components/TopNavigation";
import PatientNavigation from "./components/PatientNavigation";
import Dashboard from "./components/Dashboard";
import Claims from "./components/Claims";
import Progress from "./components/progress";
import Patient from "./components/Patient";
import ClaimsPatient from "./components/claims_patient";
import Login from "./components/Login";
import Analytics from "./components/analytics";
import InsuranceDashboard from "./components/dashboard_insurance";
import TestLogin from "./components/TestLogin";

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { Grid, Row, Column } from "@carbon/react";

// Auth context
const AuthContext = createContext();
export function useAuth() {
  return useContext(AuthContext);
}

function AppRoutes() {
  const location = useLocation();
  const { authenticated, role } = useAuth();

  if (!authenticated) {
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated: show correct nav and routes
  return (
    <>
      {role === "hospital" && <TopNavigation />}
      {role === "patient" && <PatientNavigation />}
      <Routes>
        {role === "hospital" && <Route path="/" element={<Dashboard />} />}
        {role === "patient" && <Route path="/patient" element={<Patient />} />}
        {role === "insurance" && <Route path="/insurance" element={<InsuranceDashboard />} />}
        {role === "insurance" && <Route path="*" element={<Navigate to="/insurance" replace />} />}
        <Route path="/test-login" element={<TestLogin />} />
        <Route path="/claims" element={<Claims />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/claims_patient" element={<ClaimsPatient />} />
        <Route path="/login" element={<Navigate to={role === "hospital" ? "/" : role === "patient" ? "/patient" : "/insurance"} replace />} />
        <Route path="*" element={<Navigate to={role === "hospital" ? "/" : role === "patient" ? "/patient" : "/insurance"} replace />} />
      </Routes>
    </>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState(null);

  const login = (userRole) => {
    setAuthenticated(true);
    setRole(userRole);
  };
  const logout = () => {
    setAuthenticated(false);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ authenticated, login, logout, role }}>
      <Router>
        <AppRoutes />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
