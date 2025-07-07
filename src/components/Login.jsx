import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextInput, Button, Tile } from "@carbon/react";
import { useAuth } from "../App";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted!"); // Debug log
    setError("");
    
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    console.log("Attempting login with:", { username, password }); // Debug log

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
          console.log(`Trying ${fullUrl} with username: ${username}`);
          
          response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password }),
          });

          console.log(`Response status: ${response.status}`);
          console.log(`Response headers:`, response.headers);
          
          if (response.ok) {
            data = await response.json();
            console.log(`Response data:`, data);
            if (data.success) {
              successfulLogin = { data, role: loginEndpoint.role };
              break;
            }
          } else {
            console.log(`Failed response:`, response.status, response.statusText);
            const errorText = await response.text();
            console.log(`Error response body:`, errorText);
          }
        } catch (error) {
          console.error(`Error with ${loginEndpoint.endpoint}:`, error);
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
      console.error('Login error:', error);
      setError(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f4f4" }}>
      <Tile style={{ padding: 32, minWidth: 340, maxWidth: 400 }}>
        <h2 style={{ marginBottom: 24 }}>Login</h2>
        <form onSubmit={handleSubmit}>
          <TextInput
            id="username"
            labelText="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ marginBottom: 16 }}
          />
          <TextInput
            id="password"
            labelText="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: 24 }}
          />
          {error && <div style={{ color: "#da1e28", marginBottom: 16 }}>{error}</div>}
          <Button 
            type="submit" 
            kind="primary" 
            style={{ width: "100%" }}
            onClick={() => console.log("Button clicked!")} // Debug log
          >
            Login
          </Button>
        </form>
      </Tile>
    </div>
  );
} 