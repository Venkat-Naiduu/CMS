import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

export default function TestLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Test form submitted!"); // Debug log
    setError("");
    
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    console.log("Test attempting login with:", { username, password }); // Debug log

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      
      let response, data;

      // Try all login endpoints to determine user type
      const loginEndpoints = [
        { endpoint: '/api/hospital-login', role: 'hospital' },
        { endpoint: '/api/patient-login', role: 'patient' },
        { endpoint: '/api/insurance-login', role: 'insurance' }
      ];

      let successfulLogin = null;

      for (const loginEndpoint of loginEndpoints) {
        try {
          const fullUrl = `${API_BASE_URL}${loginEndpoint.endpoint}`;
          console.log(`Test trying ${fullUrl} with username: ${username}`);
          
          response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password }),
          });

          console.log(`Test response status: ${response.status}`);
          console.log(`Test response headers:`, response.headers);
          
          if (response.ok) {
            data = await response.json();
            console.log(`Test response data:`, data);
            if (data.success) {
              successfulLogin = { data, role: loginEndpoint.role };
              break;
            }
          } else {
            console.log(`Test failed response:`, response.status, response.statusText);
            const errorText = await response.text();
            console.log(`Test error response body:`, errorText);
          }
        } catch (error) {
          console.error(`Test error with ${loginEndpoint.endpoint}:`, error);
          // Continue to next endpoint if this one fails
          continue;
        }
      }

      if (!successfulLogin) {
        setError("Invalid username or password");
        return;
      }

      // Store user data in localStorage
      localStorage.setItem('userData', JSON.stringify(successfulLogin.data.user));
      localStorage.setItem('authToken', successfulLogin.data.token);

      // Login based on role
      login(successfulLogin.data.user.role);
      
      // Navigate based on role - App.js will handle the routing automatically
      if (successfulLogin.role === "hospital") {
        navigate("/");
      } else if (successfulLogin.role === "patient") {
        navigate("/patient");
      } else if (successfulLogin.role === "insurance") {
        navigate("/insurance");
      } else {
        setError("Unknown role");
      }

    } catch (error) {
      console.error('Test login error:', error);
      setError(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f4f4" }}>
      <div style={{ padding: 32, minWidth: 340, maxWidth: 400, background: "white", borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginBottom: 24 }}>Test Login (Simple HTML)</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="username" style={{ display: "block", marginBottom: 8 }}>Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label htmlFor="password" style={{ display: "block", marginBottom: 8 }}>Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
          </div>
          {error && <div style={{ color: "#da1e28", marginBottom: 16 }}>{error}</div>}
          <button 
            type="submit" 
            style={{ 
              width: "100%", 
              padding: 12, 
              backgroundColor: "#0f62fe", 
              color: "white", 
              border: "none", 
              borderRadius: 4,
              cursor: "pointer"
            }}
            onClick={() => console.log("Test button clicked!")} // Debug log
          >
            Test Login
          </button>
        </form>
      </div>
    </div>
  );
} 