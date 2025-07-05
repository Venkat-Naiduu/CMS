import React from 'react';
import { getUserData, getAuthToken } from '../utils/auth';

const TestLogin = () => {
  const userData = getUserData();
  const token = getAuthToken();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Login Test Results</h2>
      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>User Data from Login Response:</h3>
        <pre>{JSON.stringify(userData, null, 2)}</pre>
      </div>
      
      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>Authentication Token:</h3>
        <p><strong>Token:</strong> {token ? `${token.substring(0, 50)}...` : 'No token found'}</p>
      </div>

      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px' }}>
        <h3>Expected Response Formats:</h3>
        
        <h4>Patient Login Response:</h4>
        <pre>
{`{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "name": "John Doe",
    "patient_id": "PT-2024-001",
    "activepolicy": "HealthFirst Insurance, DentalCare Plus",
    "totalcoverage": "$52,500",
    "monthlypremium": "$535",
    "role": "patient"
  }
}`}
        </pre>

        <h4>Hospital Login Response:</h4>
        <pre>
{`{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "hospitalid": "HOSP-2024-001",
    "role": "hospital"
  }
}`}
        </pre>

        <h4>Insurance Login Response:</h4>
        <pre>
{`{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "insurancecompanyid": "INS-2024-001",
    "role": "insurance"
  }
}`}
        </pre>
      </div>
    </div>
  );
};

export default TestLogin; 