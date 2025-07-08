"use client";
import React, { useState, useEffect } from "react";
import {
  Grid,
  Column,
  Tile,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tag,
  DismissibleTag,
  SelectableTag,
  Button,
  Modal,
} from "@carbon/react";
import { User, Wallet, Document, Edit, Checkmark, Warning, Information } from "@carbon/icons-react";
import "./Patient.css";
import { getUserData, getAuthToken } from "../utils/auth";

// Sample data
// const patientData = {
//   id: "PT-2024-001",
//   name: "Sarah Johnson",
//   dateOfBirth: "1985-03-15",
//   gender: "Female",
//   phone: "+1 (555) 123-4567",
//   email: "sarah.johnson@email.com",
//   address: "123 Main Street, New York, NY 10001",
//   emergencyContact: "John Johnson - +1 (555) 987-6543",
// };

// TODO: This data will come from login response
// const loginData = {
//   name: "John Doe",
//   activePolicyName: "HealthFirst Insurance, DentalCare Plus",
//   totalCoverage: "$52,500",
//   monthlyPremium: "$535"
// };

// Sample data structure - will be replaced by API
const policyHeaders = [
  { key: "provider", header: "Insurance Provider" },
  { key: "type", header: "Policy Type" },
  { key: "policyNumber", header: "Policy Number" },
  { key: "status", header: "Status" },
  { key: "premium", header: "Premium" },
  { key: "coverage", header: "Coverage Limit" },
  { key: "deductible", header: "Deductible" },
];

const claimsHeaders = [
  { key: "date", header: "Date" },
  { key: "provider", header: "Provider" },
  { key: "service", header: "Service" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Status" },
  { key: "claimNumber", header: "Claim Number" },
];

export default function PatientDashboard() {

  const userData = getUserData();
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [showRfiModal, setShowRfiModal] = useState(false);
  const [rfiClaimId, setRfiClaimId] = useState('');
  const [rfiResponse, setRfiResponse] = useState('');
  const [rfiFiles, setRfiFiles] = useState([]);
  const [rfiLoading, setRfiLoading] = useState(false);
  const [rfiNotes, setRfiNotes] = useState(''); // Add state for RFI notes

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const token = getAuthToken();
        const patientId = userData?.patient_id;
        if (!patientId) {
      
          return;
        }
        
        // Try to fetch patient claims using the available endpoint
            const response = await fetch(`${API_BASE_URL}/patient-details?patient_id=${encodeURIComponent(patientId)}`, {          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Patient details response:', data); // Debug log
          
          // Add unique IDs to claims to fix duplicate rendering issue
          const claimsWithIds = (data.claims || []).map((claim, index) => ({
            ...claim,
            id: `${claim.claimNumber}-${index}-${Date.now()}` // Create truly unique ID
          }));
          
          console.log('Processed claims:', claimsWithIds); // Debug log
          setClaims(claimsWithIds);
          
          // Store RFI notes in localStorage if found
          claimsWithIds.forEach(claim => {
            if (claim.status === 'RFI' && claim.notes) {
              storeRfiNotes(claim.claimNumber, claim.notes);
            }
            if (claim.status === 'RFI' && claim.claim_details?.notes) {
              storeRfiNotes(claim.claimNumber, claim.claim_details.notes);
            }
          });
        } else {
  
          setClaims([]);
        }
        
        // For now, set empty policies since we don't have that endpoint
        setPolicies([]);
        
      } catch (error) {
        console.error('Error fetching patient details:', error);
  
        setPolicies([]);
        setClaims([]);
      }
    };
    fetchPatientDetails();
  }, [userData?.patient_id]);

  const getStatusTag = (status) => {
    const statusConfig = {
      Active: { type: "green", icon: Checkmark, title: "Active status" },
      Approved: { type: "green", icon: Checkmark, title: "Approved status" },
      Processing: { type: "blue", icon: Information, title: "Processing status" },
      Pending: { type: "cyan", icon: Information, title: "Pending status" },
      Inactive: { type: "red", icon: Warning, title: "Inactive status" },
      Rejected: { type: "red", icon: Warning, title: "Rejected status" },
      UnderReview: { type: "purple", icon: Information, title: "Under review status" },
      Completed: { type: "green", icon: Checkmark, title: "Completed status" },
      Cancelled: { type: "cool-gray", icon: Warning, title: "Cancelled status" },
      Expired: { type: "warm-gray", icon: Warning, title: "Expired status" },
      RFI: { type: "blue", icon: Information, title: "Request for Information" },
    };

    const config = statusConfig[status] || { type: "gray", icon: Information, title: `${status} status` };
    const IconComponent = config.icon;

    return (
      <Tag
        type={config.type}
        size="md"
        title={config.title}
        renderIcon={IconComponent}
        className="status-tag"
      >
        {status}
      </Tag>
    );
  };

  // Enhanced tag for policy status with more detailed styling
  const getPolicyStatusTag = (status) => {
    const statusConfig = {
      Active: { type: "green", icon: Checkmark, title: "Active policy" },
      Inactive: { type: "red", icon: Warning, title: "Inactive policy" },
      Pending: { type: "cyan", icon: Information, title: "Pending policy" },
      Expired: { type: "warm-gray", icon: Warning, title: "Expired policy" },
      Suspended: { type: "cool-gray", icon: Warning, title: "Suspended policy" },
    };

    const config = statusConfig[status] || { type: "gray", icon: Information, title: `${status} policy status` };
    const IconComponent = config.icon;

    return (
      <Tag
        type={config.type}
        size="md"
        title={config.title}
        renderIcon={IconComponent}
        className="policy-status-tag"
      >
        {status}
      </Tag>
    );
  };

  const handleRfiFileChange = (e) => {
    setRfiFiles(Array.from(e.target.files));
  };

  // Function to store RFI notes in localStorage
  const storeRfiNotes = (claimId, notes) => {
    try {
      const rfiNotes = JSON.parse(localStorage.getItem('rfiNotes') || '{}');
      rfiNotes[claimId] = notes;
      localStorage.setItem('rfiNotes', JSON.stringify(rfiNotes));
      console.log(`Stored RFI notes for claim ${claimId}:`, notes);
    } catch (error) {
      console.error('Error storing RFI notes:', error);
    }
  };

  // Function to get RFI notes from localStorage
  const getRfiNotes = (claimId) => {
    try {
      const rfiNotes = JSON.parse(localStorage.getItem('rfiNotes') || '{}');
      return rfiNotes[claimId] || null;
    } catch (error) {
      console.error('Error getting RFI notes:', error);
      return null;
    }
  };

  // Global function to store RFI notes (can be called from console for testing)
  useEffect(() => {
    window.storeRfiNotesForTesting = (claimId, notes) => {
      storeRfiNotes(claimId, notes);
    };
    window.getRfiNotesForTesting = (claimId) => {
      return getRfiNotes(claimId);
    };
  }, []);

  const handleOpenRfiModal = (claimId) => {
    // Find the claim in the claims array to get the notes
    const claim = claims.find(c => c.claimNumber === claimId);
    console.log('Found claim:', claim); // Debug log
    console.log('All claims:', claims); // Debug log
    
    // Try multiple possible locations for notes
    let notes = claim?.notes || 
                claim?.claim_details?.notes || 
                claim?.adjudicator_notes ||
                claim?.rfi_notes ||
                getRfiNotes(claimId) || // Check localStorage
                null;
    
    console.log('Extracted notes from local data:', notes); // Debug log
    
    // If no notes found, show a default message
    if (!notes) {
      notes = 'Please provide the requested information to proceed with your claim.';
    }
    
    console.log('Final notes to display:', notes); // Debug log
    
    setRfiClaimId(claimId);
    setRfiResponse('');
    setRfiFiles([]);
    setRfiNotes(notes);
    setShowRfiModal(true);
  };

  const handleCloseRfiModal = () => {
    setShowRfiModal(false);
    setRfiClaimId('');
    setRfiResponse('');
    setRfiFiles([]);
    setRfiNotes(''); // Clear notes when closing
  };

  const handleSubmitRfi = async () => {
    setRfiLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('claim_id', rfiClaimId);
      formData.append('response', rfiResponse);
      rfiFiles.forEach((file) => formData.append('documents', file));
      const res = await fetch(`${API_BASE_URL}/api/rfi-patient`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to submit RFI response');
      handleCloseRfiModal();
      alert('RFI response submitted successfully!');
    } catch (err) {
      alert('Failed to submit RFI response.');
    } finally {
      setRfiLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f4f4", padding: "2rem", paddingTop: "64px" }}>
      <Grid>
        {/* Header */}
        <Column lg={16} md={8} sm={4}>
          <div className="dashboard-header">
            <h1 className="dashboard-title">Patient Dashboard</h1>
            <p className="dashboard-subtitle">Comprehensive insurance and policy management</p>
          </div>
        </Column>

        {/* Summary Cards */}
        <Column lg={16} md={8} sm={4}>
          <Tile style={{ padding: "2rem", background: "#fff", marginBottom: "2rem", borderRadius: 0 }}>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Tile style={{ flex: 1, minWidth: 260, background: "#f4f4f4", minHeight: 120, borderRadius: 0, boxShadow: 'none' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem', color: '#161616' }}>Active Policy</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#525252' }}>{userData?.activepolicy || "-"}</p>
              </Tile>
              <Tile style={{ flex: 1, minWidth: 260, background: "#f4f4f4", minHeight: 120, borderRadius: 0, boxShadow: 'none' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem', color: '#161616' }}>Total Coverage</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#525252' }}>{userData?.totalcoverage || "-"}</p>
              </Tile>
              <Tile style={{ flex: 1, minWidth: 260, background: "#f4f4f4", minHeight: 120, borderRadius: 0, boxShadow: 'none' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem', color: '#161616' }}>Monthly Premium</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#525252' }}>{userData?.monthlypremium || "-"}</p>
              </Tile>
            </div>
          </Tile>
        </Column>



        {/* Recent Insurance Claims Table Only */}
        <Column lg={16} md={8} sm={4}>
          <Tile style={{ background: '#fff', marginBottom: '2rem', padding: '2.5rem', borderRadius: 0 }}>
            <div style={{ background: '#f4f4f4', padding: '2rem', borderRadius: 0 }}>
              {/* Recent Insurance Claims */}
              <Tile style={{ boxShadow: 'none', background: 'transparent', padding: 0, marginBottom: '2.5rem' }}>
                <div
                  style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", marginBottom: "1.5rem", marginTop: '2rem' }}
                >
                  <h2 className="section-title" style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Recent Insurance Claims</h2>
                </div>
                                {claims.length > 0 ? (
                  <DataTable rows={claims} headers={claimsHeaders}>
                      {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                        <TableContainer>
                          <Table {...getTableProps()}>
                            <TableHead>
                              <TableRow>
                                {headers.map((header) => (
                                  <TableHeader {...getHeaderProps({ header })} key={header.key}>
                                    {header.header}
                                  </TableHeader>
                                ))}
                                <TableHeader>Action</TableHeader>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rows.map((row) => (
                                <TableRow {...getRowProps({ row })} key={row.id}>
                                  {row.cells.map((cell) => (
                                    <TableCell key={cell.id}>
                                      {cell.info.header === 'status' ? getStatusTag(cell.value) : cell.value}
                                    </TableCell>
                                  ))}
                                  <TableCell>
                                    {row.cells.find(cell => cell.info.header === 'status')?.value === 'RFI' ? (
                                      <Button size="sm" kind="primary" onClick={() => handleOpenRfiModal(row.cells.find(cell => cell.info.header === 'claimNumber')?.value)}>
                                        Respond to RFI
                                      </Button>
                                    ) : null}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                                              )}
                      </DataTable>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    <p>No claims found. Submit your first claim to see it here.</p>
                  </div>
                )}
              </Tile>
            </div>
          </Tile>
        </Column>
      </Grid>
      <Modal
        open={showRfiModal}
        modalHeading={`Respond to RFI for Claim ${rfiClaimId}`}
        primaryButtonText="Submit"
        secondaryButtonText="Cancel"
        onRequestClose={handleCloseRfiModal}
        onRequestSubmit={handleSubmitRfi}
        passiveModal={false}
        preventCloseOnClickOutside={true}
        primaryButtonDisabled={rfiLoading}
        secondaryButtonDisabled={rfiLoading}
      >
        <div style={{ marginBottom: 16 }}>
          <strong>Claim ID:</strong> {rfiClaimId}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label><strong>Information Requested:</strong></label>
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#f4f4f4', 
            borderRadius: '4px', 
            marginTop: 4,
            minHeight: '60px',
            whiteSpace: 'pre-wrap'
          }}>
            {rfiNotes}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Your Response:</label>
          <textarea
            style={{ width: '100%', minHeight: 80, marginTop: 4 }}
            value={rfiResponse}
            onChange={e => setRfiResponse(e.target.value)}
            disabled={rfiLoading}
            placeholder="Please provide the requested information..."
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Upload Documents:</label>
          <input
            type="file"
            multiple
            onChange={handleRfiFileChange}
            disabled={rfiLoading}
            style={{ display: 'block', marginTop: 4 }}
          />
        </div>
      </Modal>
    </div>
  );
} 