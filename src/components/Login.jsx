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
    setError("");
    
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';
      let response, data;

      // Try all login endpoints to determine user type
      const loginEndpoints = [
        { endpoint: '/hospital-login', role: 'hospital' },
        { endpoint: '/patient-login', role: 'patient' },
        { endpoint: '/insurance-login', role: 'insurance' }
      ];

      let successfulLogin = null;

      for (const loginEndpoint of loginEndpoints) {
        try {
          console.log(`Trying ${loginEndpoint.endpoint} with username: ${username}`);
          response = await fetch(`${API_BASE_URL}${loginEndpoint.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          console.log(`Response status: ${response.status}`);
          
          if (response.ok) {
            data = await response.json();
            console.log(`Response data:`, data);
            if (data.success) {
              successfulLogin = { data, role: loginEndpoint.role };
              break;
            }
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
          <Button type="submit" kind="primary" style={{ width: "100%" }}>
            Login
          </Button>
        </form>
      </Tile>
    </div>
  );
} 