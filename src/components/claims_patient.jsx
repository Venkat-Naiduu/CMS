import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  TextInput,
  DatePicker,
  DatePickerInput,
  Select,
  SelectItem,
  FileUploader,
  FileUploaderItem,
  Form,
  FormGroup,
  Grid,
  Column,
  TextArea,
  Tile,
  FormItem,
  FileUploaderDropContainer,
  ToastNotification,
} from "@carbon/react";
import "./claims_patient.css";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../utils/auth";

const insuranceProviders = [
  { value: "", label: "Select provider" },
  { value: "aetna", label: "Aetna" },
  { value: "cigna", label: "Cigna" },
  // { value: "united", label: "United Healthcare" },
  // { value: "anthem", label: "Anthem" },
  // { value: "humana", label: "Humana" },
];

export default function ClaimsPatient() {
  const [showForm, setShowForm] = useState(true);
  const [form, setForm] = useState({
    patientName: "",
    patientId: "",
    dob: "",
    phone: "",
    policyNumber: "",
    provider: "",
    claimAmount: "",
    treatmentDate: "",
    diagnosis: "",
    treatment: "",
    hospitalName: "",
    hospitalLocation: "",
    procedureName: "",
    doctorNotes: "",
    patientMedicalHistory: "",
    itemizedBill: "",
    insuranceStartDate: "",
    files: [],
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const errorNotificationRef = useRef(null);
  
  // Get patient data from login response
  const userData = getUserData();
  const loggedInPatientName = userData?.username || userData?.name || "Unknown Patient";
  const loggedInPatientId = userData?.patient_id || "";

  useEffect(() => {
    if (showSuccess && notificationRef.current) {
      notificationRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showSuccess]);

  useEffect(() => {
    if (showError && errorNotificationRef.current) {
      errorNotificationRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showError]);

  // Pre-fill form with user data when component loads
  useEffect(() => {
    if (userData && (userData.username || userData.name || userData.patient_id)) {
      setForm(prev => ({
        ...prev,
        patientName: userData.username || userData.name || "",
        patientId: userData.patient_id || ""
      }));
    }
  }, [userData?.username, userData?.name, userData?.patient_id]);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (files) => {
    setForm((prev) => ({ ...prev, files }));
  };

  const handleDateChange = (date, name) => {
    setForm((prev) => ({ ...prev, [name]: date }));
  };

  const handleCancel = () => {
    setShowForm(true);
    // Reset form and uploaded files
    setForm({
      patientName: "",
      patientId: "",
      dob: "",
      phone: "",
      policyNumber: "",
      provider: "",
      claimAmount: "",
      treatmentDate: "",
      diagnosis: "",
      treatment: "",
      hospitalName: "",
      hospitalLocation: "",
      procedureName: "",
      doctorNotes: "",
      patientMedicalHistory: "",
      itemizedBill: "",
      insuranceStartDate: "",
      files: [],
    });
    setUploadedFiles([]); // Reset uploaded files
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset notifications
    setShowSuccess(false);
    setShowError(false);
    setErrorMessage("");
    
    // Validate patient name matches logged in user
    if (form.patientName.trim() !== loggedInPatientName) {
      setErrorMessage("You can only submit claims for your own account. Patient name must match your registered name.");
      setShowError(true);
      return;
    }

    // Validate patient ID matches logged in user
    if (form.patientId.trim() !== loggedInPatientId) {
      setErrorMessage("Patient ID must match your registered ID.");
      setShowError(true);
      return;
    }
    
    // Validate required fields
    const requiredFields = {
      patientName: "Patient Name",
      patientId: "Patient ID", 
      dob: "Date of Birth",
      phone: "Phone Number",
      policyNumber: "Policy Number",
      provider: "Insurance Provider",
      claimAmount: "Claim Amount",
      treatmentDate: "Treatment Date",
      treatment: "Treatment Provided",
      diagnosis: "Diagnosis",
      hospitalName: "Hospital Name",
      hospitalLocation: "Hospital Location",
      procedureName: "Procedure Name",
      doctorNotes: "Doctor Notes",
      patientMedicalHistory: "Patient Medical History",
      itemizedBill: "Itemized Bill",
      insuranceStartDate: "Insurance Start Date"
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!form[field] || form[field].toString().trim() === "") {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in all required fields: ${missingFields.join(", ")}`);
      setShowError(true);
      return;
    }

    // Validate file sizes (500KB limit)
    const maxFileSize = 500 * 1024; // 500KB in bytes
    const oversizedFiles = uploadedFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      setErrorMessage(`Files exceed 500KB limit: ${oversizedFiles.map(f => f.name).join(", ")}`);
      setShowError(true);
      return;
    }

    // Validate file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
    const invalidFiles = uploadedFiles.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setErrorMessage(`Invalid file types. Only PDF, JPG, PNG, and TXT files are allowed: ${invalidFiles.map(f => f.name).join(", ")}`);
      setShowError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare file information for payload
      const fileInfo = uploadedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }));

      const payload = {
        patientName: form.patientName,
        patientId: form.patientId,
        dateOfBirth: form.dob,
        phoneNumber: form.phone,
        policyNumber: form.policyNumber,
        insuranceProvider: form.provider,
        claimAmount: form.claimAmount,
        treatmentDate: form.treatmentDate,
        treatmentProvided: form.treatment,
        diagnosis: form.diagnosis,
        hospitalName: form.hospitalName,
        hospitalLocation: form.hospitalLocation,
        procedureName: form.procedureName,
        doctorNotes: form.doctorNotes,
        patientMedicalHistory: form.patientMedicalHistory,
        itemizedBill: form.itemizedBill,
        insuranceStartDate: form.insuranceStartDate,
        documents: fileInfo // Include file information in payload
      };
      
      // API call to submit patient claim with files
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const formData = new FormData();
      
      // Add claim data as JSON string (now includes file info)
      formData.append('claimData', JSON.stringify(payload));
      
      // Add actual files
      uploadedFiles.forEach((file) => {
        formData.append('documents', file);
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/patient-claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          if (errorData.errors) {
            const fieldErrors = Object.entries(errorData.errors)
              .map(([field, error]) => `${field}: ${error}`)
              .join(", ");
            errorMessage = `Validation errors: ${fieldErrors}`;
          }
        } catch (parseError) {
          // If we can't parse the error response, use status-based messages
          switch (response.status) {
            case 400:
              errorMessage = "Bad request. Please check your data.";
              break;
            case 401:
              errorMessage = "Unauthorized. Please log in again.";
              break;
            case 403:
              errorMessage = "Forbidden. You don't have permission to submit claims.";
              break;
            case 413:
              errorMessage = "File size too large. Please reduce file sizes.";
              break;
            case 415:
              errorMessage = "Invalid file type. Only PDF, JPG, and PNG files are allowed.";
              break;
            case 500:
              errorMessage = "Server error. Please try again later.";
              break;
            default:
              errorMessage = `Server error (${response.status}). Please try again.`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success) {
        setShowSuccess(true);
        handleCancel();
      } else {
        throw new Error(result.message || 'Failed to submit claim.');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setErrorMessage("Network error. Please check your internet connection and try again.");
      } else if (error.name === 'TypeError' && error.message.includes('JSON')) {
        setErrorMessage("Invalid response from server. Please try again.");
      } else {
        setErrorMessage(error.message || "An unexpected error occurred. Please try again.");
      }
      
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="claims-main">
      <div className="claims-actions-row" style={{ display: 'flex', gap: 16 }}>
        <Button size="lg" kind={showForm ? "primary" : "secondary"} onClick={() => setShowForm(true)}>
          New Claim
        </Button>
        {/* <Button size="lg" kind={!showForm ? "primary" : "secondary"} onClick={() => setShowForm(false)}>
          Track Progress
        </Button> */}
      </div>
      {showForm ? (
        <div style={{ position: "relative" }}>
          {showSuccess && (
            <div
              ref={notificationRef}
              style={{
                position: "fixed",
                top: 80,
                right: 16,
                zIndex: 1000,
                width: "fit-content",
                maxWidth: "400px"
              }}
            >
              <ToastNotification
                aria-label="closes notification"
                kind="success"
                onClose={() => setShowSuccess(false)}
                onCloseButtonClick={() => setShowSuccess(false)}
                role="status"
                statusIconDescription="notification"
                subtitle="Your claim was submitted successfully."
                title="Claim Submitted"
                timeout={5000}
              />
            </div>
          )}
          {showError && (
            <div
              ref={errorNotificationRef}
              style={{
                position: "fixed",
                top: 80,
                right: 16,
                zIndex: 1000,
                width: "fit-content",
                maxWidth: "400px"
              }}
            >
              <ToastNotification
                aria-label="closes notification"
                kind="error"
                onClose={() => setShowError(false)}
                onCloseButtonClick={() => setShowError(false)}
                role="status"
                statusIconDescription="notification"
                subtitle={errorMessage}
                timeout={5000}
                title="Error"
              />
            </div>
          )}
          <Tile className="claims-form-tile">
            <h2 className="claims-form-title">Fill out the form below to submit a new insurance claim on behalf of the patient</h2>
            <Form onSubmit={handleSubmit}>
              <Grid fullWidth className="claims-form-grid">
                {/* Patient Details */}
                <Column sm={4} md={8} lg={16}>
                  <div className="claims-section">
                    <div className="claims-section-title">Patient Details</div>
                    <FormGroup>
                      <Grid>
                        <Column sm={4} md={4} lg={8}>
                          <div style={{ width: 300 }}>
                            <TextInput
                              className="input-test-class"
                              id="patientName"
                              name="patientName"
                              invalidText="Error message goes here"
                              warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
                              labelText="Patient Name"
                              placeholder="Enter patient name"
                              value={form.patientName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </Column>
                        <Column sm={4} md={4} lg={8}>
                          <div style={{ width: 300 }}>
                            <TextInput
                              className="input-test-class"
                              id="patientId"
                              name="patientId"
                              invalidText="Error message goes here"
                              warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
                              labelText="Patient ID"
                              placeholder="Enter patient ID"
                              value={form.patientId}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </Column>
                        <Column sm={4} md={4} lg={8}>
                          <DatePicker
                            datePickerType="single"
                            value={form.dob}
                            onChange={(dates) => handleDateChange(dates[0], "dob")}
                          >
                            <DatePickerInput
                              id="dob"
                              name="dob"
                              labelText="Date of Birth"
                              placeholder="yyyy-mm-dd"
                              required
                            />
                          </DatePicker>
                        </Column>
                        <Column sm={4} md={4} lg={8}>
                          <div style={{ width: 300 }}>
                            <TextInput
                              className="input-test-class"
                              id="phone"
                              name="phone"
                              invalidText="Error message goes here"
                              warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
                              labelText="Phone Number"
                              placeholder="Enter phone number"
                              value={form.phone}
                              onChange={handleInputChange}
                            />
                          </div>
                        </Column>
                      </Grid>
                    </FormGroup>
                  </div>
                </Column>
                {/* Policy Details */}
                <Column sm={4} md={8} lg={16}>
                  <div className="claims-section">
                    <div className="claims-section-title">Policy Details</div>
                    <FormGroup>
                      <Grid>
                        <Column sm={4} md={4} lg={8}>
                          <div style={{ width: 300 }}>
                            <TextInput
                              className="input-test-class"
                              id="policyNumber"
                              name="policyNumber"
                              invalidText="Error message goes here"
                              warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
                              labelText="Policy Number"
                              placeholder="Enter policy number"
                              value={form.policyNumber}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </Column>
                        <Column sm={4} md={4} lg={8}>
                          <Select
                            id="provider"
                            name="provider"
                            labelText="Insurance Provider"
                            value={form.provider}
                            onChange={handleInputChange}
                            required
                          >
                            {insuranceProviders.map((p) => (
                              <SelectItem key={p.value} value={p.value} text={p.label} />
                            ))}
                          </Select>
                        </Column>
                        <Column sm={4} md={4} lg={8}>
                          <div style={{ width: 300 }}>
                            <TextInput
                              className="input-test-class"
                              id="claimAmount"
                              name="claimAmount"
                              invalidText="Error message goes here"
                              warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
                              labelText="Claim Amount"
                              placeholder="Enter claim amount"
                              value={form.claimAmount}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </Column>
                      </Grid>
                    </FormGroup>
                  </div>
                </Column>
                {/* Hospital Information */}
                <Column sm={4} md={8} lg={16}>
                  <div className="claims-section">
                    <div className="claims-section-title">Hospital Information</div>
                    <FormGroup>
                      <Grid>
                        <Column sm={4} md={4} lg={8}>
                          <div style={{ width: 300 }}>
                            <TextInput
                              className="input-test-class"
                              id="hospitalName"
                              name="hospitalName"
                              invalidText="Error message goes here"
                              warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
                              labelText="Hospital Name"
                              placeholder="Enter hospital name"
                              value={form.hospitalName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </Column>
                        <Column sm={4} md={4} lg={8}>
                          <div style={{ width: 300 }}>
                            <TextInput
                              className="input-test-class"
                              id="hospitalLocation"
                              name="hospitalLocation"
                              invalidText="Error message goes here"
                              warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
                              labelText="Hospital Location"
                              placeholder="Enter hospital location"
                              value={form.hospitalLocation}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </Column>
                        <Column sm={4} md={4} lg={8}>
                          <DatePicker
                            datePickerType="single"
                            value={form.insuranceStartDate}
                            onChange={(dates) => handleDateChange(dates[0], "insuranceStartDate")}
                          >
                            <DatePickerInput
                              id="insuranceStartDate"
                              name="insuranceStartDate"
                              labelText="Insurance Start Date"
                              placeholder="yyyy-mm-dd"
                              required
                            />
                          </DatePicker>
                        </Column>
                      </Grid>
                    </FormGroup>
                  </div>
                </Column>

                {/* Treatment Details */}
                <Column sm={4} md={8} lg={16}>
                  <div className="claims-section">
                    <div className="claims-section-title">Treatment Details</div>
                    <FormGroup>
                      <Grid>
                        <Column sm={4} md={4} lg={8}>
                          <DatePicker
                            datePickerType="single"
                            value={form.treatmentDate}
                            onChange={(dates) => handleDateChange(dates[0], "treatmentDate")}
                          >
                            <DatePickerInput
                              id="treatmentDate"
                              name="treatmentDate"
                              labelText="Treatment Date"
                              placeholder="yyyy-mm-dd"
                              required
                            />
                          </DatePicker>
                        </Column>
                        <Column sm={4} md={4} lg={8}>
                          <div style={{ width: 300 }}>
                            <TextInput
                              className="input-test-class"
                              id="treatment"
                              name="treatment"
                              invalidText="Error message goes here"
                              warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
                              labelText="Treatment Provided"
                              placeholder="Describe treatment provided"
                              value={form.treatment}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </Column>
                        <Column sm={4} md={4} lg={8}>
                          <div style={{ width: 300 }}>
                            <TextInput
                              className="input-test-class"
                              id="procedureName"
                              name="procedureName"
                              invalidText="Error message goes here"
                              warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
                              labelText="Procedure Name"
                              placeholder="Enter procedure name"
                              value={form.procedureName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </Column>
                        <Column sm={4} md={8} lg={16}>
                          <TextArea
                            id="diagnosis"
                            name="diagnosis"
                            labelText="Diagnosis"
                            placeholder="Enter diagnosis details"
                            value={form.diagnosis}
                            onChange={handleInputChange}
                            required
                          />
                        </Column>
                      </Grid>
                    </FormGroup>
                  </div>
                </Column>

                {/* Medical Details */}
                <Column sm={4} md={8} lg={16}>
                  <div className="claims-section">
                    <div className="claims-section-title">Medical Details</div>
                    <FormGroup>
                      <Grid>
                        <Column sm={4} md={8} lg={16}>
                          <TextArea
                            id="doctorNotes"
                            name="doctorNotes"
                            labelText="Doctor Notes"
                            placeholder="Enter doctor's notes and observations"
                            value={form.doctorNotes}
                            onChange={handleInputChange}
                            required
                          />
                        </Column>
                        <Column sm={4} md={8} lg={16}>
                          <TextArea
                            id="patientMedicalHistory"
                            name="patientMedicalHistory"
                            labelText="Patient Medical History"
                            placeholder="Enter relevant patient medical history"
                            value={form.patientMedicalHistory}
                            onChange={handleInputChange}
                            required
                          />
                        </Column>
                        <Column sm={4} md={8} lg={16}>
                          <TextArea
                            id="itemizedBill"
                            name="itemizedBill"
                            labelText="Itemized Bill"
                            placeholder="Enter itemized bill details"
                            value={form.itemizedBill}
                            onChange={handleInputChange}
                            required
                          />
                        </Column>
                      </Grid>
                    </FormGroup>
                  </div>
                </Column>
                {/* Upload Documents with Dotted Box */}
                <Column sm={4} md={8} lg={16}>
                  <div className="claims-section">
                    <div className="claims-section-title">Upload Documents</div>
                    <FormGroup>
                      <FormItem>
                        <p className="cds--file--label">Upload files</p>
                        <p className="cds--label-description">
                          Max file size is 500 KB. Supported file types are .pdf, .jpg, .png, and .txt.
                        </p>
                        <FileUploaderDropContainer
                          accept={['application/pdf', 'image/jpeg', 'image/png', 'text/plain']}
                          labelText="Drag and drop files here or click to upload"
                          multiple
                          name=""
                          onAddFiles={(event) => {
                            const files = event.target.files || event.dataTransfer?.files || [];
                            setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
                          }}
                          tabIndex={0}
                        />
                        <div className="cds--file-container cds--file-container--drop">
                          {uploadedFiles.map((file) => (
                            <FileUploaderItem
                              key={file.name}
                              name={file.name}
                              status="edit"
                              size="md"
                              onDelete={() => setUploadedFiles((prev) => prev.filter((f) => f.name !== file.name))}
                            />
                          ))}
                        </div>
                      </FormItem>
                    </FormGroup>
                  </div>
                </Column>
              </Grid>
              <div className="claims-form-actions">
                <Button kind="secondary" onClick={handleCancel} type="button" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  kind="primary" 
                  type="submit" 
                  style={{ marginLeft: 16 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Claim"}
                </Button>
              </div>
            </Form>
          </Tile>
        </div>
      ) : (
        <div>Progress tracking will be implemented here</div>
      )}
    </div>
  );
} 