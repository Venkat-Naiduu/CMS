# Patient & Hospital API Documentation

**Base URL:**

```
http://localhost:3001/api
```

**Authentication:**
All endpoints (except login) require a JWT token in the header:

```
Authorization: Bearer <jwt_token>
```

---

## 1. Patient Login

**POST** `/patient-login`

Authenticate a patient and receive a JWT token and user details.

**Request Body:**

```json
{
  "username": "patient_username",
  "password": "patient_password"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "patient_username",
    "name": "John Doe",
    "patient_id": "PT-2024-001",
    "activepolicy": "HealthFirst Insurance, DentalCare Plus",
    "totalcoverage": "$52,500",
    "monthlypremium": "$535",
    "role": "patient"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

---

## 2. Hospital Login

**POST** `/hospital-login`

Authenticate a hospital user and receive a JWT token and user details.

**Request Body:**

```json
{
  "username": "hospital_username",
  "password": "hospital_password"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "...",
  "user": {
    "username": "hospital_username",
    "hospitalid": "HOSP-2024-001",
    "role": "hospital"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

---

## 3. Insurance Login

**POST** `/insurance-login`

Authenticate an insurance company user and receive a JWT token and user details.

**Request Body:**

```json
{
  "username": "insurance_username",
  "password": "insurance_password"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "insurance_username",
    "insurance_id": "INS-2024-001",
    "insurance_name": "Aetna Health Insurance",
    "role": "insurance"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

---

## 4. Get Insurance Claims

**GET** `/insurance-details?insurance_id=...`

Get all claims for a specific insurance company (filtered by insurance provider).

**Query Parameter:**

- `insurance_id` (from login response)

**Success Response:**

```json
{
  "claims": [
    {
      "id": "CLM-2024-001",
      "patientName": "John Doe",
      "submissionDate": "2024-01-15",
      "amount": "$2,450.00",
      "status": "Approved",
      "progress": 100,
      "currentStage": "Completed",
      "insuranceProvider": "aetna"
    },
    {
      "id": "CLM-2024-002",
      "patientName": "Jane Smith",
      "submissionDate": "2024-01-20",
      "amount": "$1,800.00",
      "status": "In Progress",
      "progress": 60,
      "currentStage": "Medical Necessity & Cost Validation",
      "insuranceProvider": "aetna"
    }
  ]
}
```

- Only the `claims` array is used in the UI. Each claim object should have these fields:
  - `id`: Claim ID
  - `patientName`: Name of the patient
  - `submissionDate`: Date of claim submission
  - `amount`: Claim amount
  - `status`: Claim status
  - `progress`: Progress percentage (0-100)
  - `currentStage`: Current stage of the claim
  - `insuranceProvider`: Insurance provider name

**Error Response:**

```json
{
  "success": false,
  "message": "Insurance company not found"
}
```

---

## 5. Get Analytics Data

**GET** `/analytics?insurance_id=...&page=...&pageSize=...`

Get fraud detection analytics data for a specific insurance company with pagination.

**Query Parameters:**

- `insurance_id` (required): Insurance company ID from login response
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Number of items per page (default: 10)

**Success Response:**

```json
{
  "total": 25,
  "page": 1,
  "pageSize": 10,
  "claims": [
    {
      "claim_id": "CLM-2024-001",
      "status": "HIGH_RISK",
      "risk_score": 85,
      "flags": [
        {
          "case_type": "CASE 2: Rural Hospital, High-Tech Surgery",
          "severity": "HIGH"
        },
        {
          "case_type": "CASE 7: Mismatched Diagnosis and Claimed Treatment",
          "severity": "HIGH"
        }
      ],
      "insuranceProvider": "aetna"
    },
    {
      "claim_id": "CLM-2024-002",
      "status": "CLEAN",
      "risk_score": 0,
      "flags": [],
      "insuranceProvider": "aetna"
    },
    {
      "claim_id": "CLM-2024-003",
      "status": "MEDIUM_RISK",
      "risk_score": 45,
      "flags": [
        {
          "case_type": "CASE 1: Amount Outlier Check",
          "severity": "MEDIUM"
        }
      ],
      "insuranceProvider": "aetna"
    }
  ]
}
```

**Response Fields:**

- `total`: Total number of claims for the insurance company
- `page`: Current page number
- `pageSize`: Number of items per page
- `claims`: Array of claim objects with:
  - `claim_id`: Unique claim identifier
  - `status`: Risk status (CLEAN, LOW_RISK, MEDIUM_RISK, HIGH_RISK)
  - `risk_score`: Numeric risk score (0-100)
  - `flags`: Array of fraud flags with case_type and severity
  - `insuranceProvider`: Insurance provider name

**Error Response:**

```json
{
  "success": false,
  "message": "Insurance company not found"
}
```

---

## 6. Download Claim Report

**GET** `/download-report/{claimId}`

Download a detailed fraud detection report for a specific claim.

**URL Parameter:**

- `claimId`: The unique claim ID to download report for

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Success Response:**

```json
{
  "claim_id": "CLM-2024-001",
  "report_date": "2024-01-25T10:30:00Z",
  "risk_assessment": {
    "overall_risk_score": 85,
    "risk_level": "HIGH_RISK",
    "fraud_flags": [
      {
        "case_type": "CASE 2: Rural Hospital, High-Tech Surgery",
        "severity": "HIGH",
        "description": "High-tech surgery performed in rural hospital setting",
        "recommendation": "Requires additional verification"
      }
    ]
  },
  "claim_details": {
    "patient_name": "John Doe",
    "submission_date": "2024-01-15",
    "amount": "$2,450.00",
    "treatment": "Cardiac surgery",
    "diagnosis": "Coronary artery disease"
  },
  "analysis_summary": "This claim has been flagged for potential fraud due to multiple high-risk indicators."
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Claim not found or report unavailable"
}
```

---

## 7. Get Hospital Claims

**GET** `/hospital-details?hospitalid=...`

Get all claims for a specific hospital (for dashboard/table).

**Query Parameter:**

- `hospitalid` (from login response)

**Success Response:**

```json
{
  "claims": [
    {
      "id": "CSM101",
      "patientName": "Venkat",
      "submissionDate": "2024-01-15",
      "amount": "$2,450.00",
      "status": "Approved"
    }
    // ... more claims
  ]
}
```

- Only the `claims` array is used in the UI. Each claim object should have these fields:
  - `id`: Claim ID
  - `patientName`: Name of the patient
  - `submissionDate`: Date of claim submission
  - `amount`: Claim amount
  - `status`: Claim status

**Error Response:**

```json
{
  "success": false,
  "message": "Hospital not found"
}
```

---

## 8. Submit Hospital Claim

**POST** `/hospital-claim`

Submit a new insurance claim with patient details and supporting documents.

**Content-Type:** `multipart/form-data`

**Form Data:**

- `claimData` (string, JSON): Claim information (see below)
- `documents` (file[]): Supporting documents (PDF, JPG, PNG, TXT)

**Claim Data Structure:**

```json
{
  "patientName": "John Doe",
  "patientId": "PAT123456",
  "dateOfBirth": "1990-01-15",
  "phoneNumber": "1234567890",
  "policyNumber": "POL987654",
  "insuranceProvider": "aetna",
  "claimAmount": "2500",
  "treatmentDate": "2024-01-20",
  "treatmentProvided": "Cardiac surgery",
  "diagnosis": "Coronary artery disease requiring bypass surgery"
}
```

**Example JavaScript (React) FormData usage:**

```js
const payload = {
  patientName: form.patientName,
  patientId: form.patientId,
  dateOfBirth: form.dateOfBirth,
  phoneNumber: form.phoneNumber,
  policyNumber: form.policyNumber,
  insuranceProvider: form.insuranceProvider,
  claimAmount: form.claimAmount,
  treatmentDate: form.treatmentDate,
  treatmentProvided: form.treatmentProvided,
  diagnosis: form.diagnosis,
};
const formData = new FormData();
formData.append("claimData", JSON.stringify(payload));
uploadedFiles.forEach((file) => {
  formData.append("documents", file);
});
```

**Success Response:**

```json
{
  "success": true,
  "claimId": "CLM-2024-001",
  "message": "Claim submitted successfully",
  "submissionDate": "2024-01-25T10:30:00Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "patientName": "Patient name is required",
    "claimAmount": "Invalid claim amount"
  }
}
```

---

## 9. Delete Hospital Claim

**DELETE** `/hospital-claim/{claimId}`

Delete a specific hospital claim by claim ID.

**URL Parameter:**

- `claimId`: The unique claim ID to delete

**Success Response:**

```json
{
  "success": true,
  "message": "Claim deleted successfully"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Claim not found or could not be deleted"
}
```

---

## 10. Get Patient Claims

**GET** `/patient-details?patient_id=...`

Get all claims for a specific patient (for dashboard/table).

**Query Parameter:**

- `patient_id` (from login response)

**Success Response:**

```json
{
  "claims": [
    {
      "date": "2024-01-01",
      "provider": "Provider Name",
      "service": "Service Name",
      "amount": "$100",
      "status": "Approved",
      "claimNumber": "CLM-001"
    }
    // ... more claims
  ]
}
```

- Only the `claims` array is used in the UI. Each claim object should have these fields:
  - `date`: Date of claim
  - `provider`: Insurance provider
  - `service`: Service provided
  - `amount`: Claim amount
  - `status`: Claim status
  - `claimNumber`: Unique claim number

**Error Response:**

```json
{
  "success": false,
  "message": "Patient not found"
}
```

---

## 11. Submit Patient Claim

**POST** `/patient-claim`

Submit a new insurance claim for a patient with supporting documents.

**Content-Type:** `multipart/form-data`

**Form Data:**

- `claimData` (string, JSON): Claim information (see below)
- `documents` (file[]): Supporting documents (PDF, JPG, PNG, TXT)

**Claim Data Structure:**

```json
{
  "patientName": "John Doe",
  "patientId": "PT-2024-001",
  "dateOfBirth": "1990-01-15",
  "phoneNumber": "1234567890",
  "policyNumber": "POL987654",
  "insuranceProvider": "aetna",
  "claimAmount": "1200",
  "treatmentDate": "2024-01-20",
  "treatmentProvided": "Dental cleaning and checkup",
  "diagnosis": "Regular dental maintenance"
}
```

**Example JavaScript (React) FormData usage:**

```js
const payload = {
  patientName: form.patientName,
  patientId: form.patientId,
  dateOfBirth: form.dateOfBirth,
  phoneNumber: form.phoneNumber,
  policyNumber: form.policyNumber,
  insuranceProvider: form.insuranceProvider,
  claimAmount: form.claimAmount,
  treatmentDate: form.treatmentDate,
  treatmentProvided: form.treatmentProvided,
  diagnosis: form.diagnosis,
};
const formData = new FormData();
formData.append("claimData", JSON.stringify(payload));
uploadedFiles.forEach((file) => {
  formData.append("documents", file);
});
```

**Success Response:**

```json
{
  "success": true,
  "claimId": "CLM-2024-001",
  "message": "Claim submitted successfully",
  "submissionDate": "2024-01-25T10:30:00Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "patientName": "Patient name is required",
    "claimAmount": "Invalid claim amount"
  }
}
```
