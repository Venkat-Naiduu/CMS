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
  Button,
} from "@carbon/react";
import { User, Wallet, Document, Edit } from "@carbon/icons-react";
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

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
        const token = getAuthToken();
        const patientId = userData?.patient_id;
        if (!patientId) return;
        const response = await fetch(`${API_BASE_URL}/patient-details?patient_id=${encodeURIComponent(patientId)}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setPolicies(data.policies || []);
        setClaims(data.claims || []);
      } catch (error) {
        console.error('Error fetching patient details:', error);
        setPolicies([]);
        setClaims([]);
      }
    };
    fetchPatientDetails();
  }, [userData?.patient_id]);

  const getStatusTag = (status) => {
    const statusMap = {
      Active: "green",
      Approved: "green",
      Processing: "blue",
      Pending: "cyan",
      Inactive: "red",
    };
    return <Tag type={statusMap[status] || "gray"}>{status}</Tag>;
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
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '0.25rem' }}>Patient Name</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{userData?.name || "-"}</p>
              </Tile>
              <Tile style={{ flex: 1, minWidth: 260, background: "#f4f4f4", minHeight: 120, borderRadius: 0, boxShadow: 'none' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '0.25rem' }}>Active Policy</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{userData?.activepolicy || "-"}</p>
              </Tile>
              <Tile style={{ flex: 1, minWidth: 260, background: "#f4f4f4", minHeight: 120, borderRadius: 0, boxShadow: 'none' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '0.25rem' }}>Total Coverage</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{userData?.totalcoverage || "-"}</p>
              </Tile>
              <Tile style={{ flex: 1, minWidth: 260, background: "#f4f4f4", minHeight: 120, borderRadius: 0, boxShadow: 'none' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '0.25rem' }}>Monthly Premium</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{userData?.monthlypremium || "-"}</p>
              </Tile>
            </div>
          </Tile>
        </Column>

        {/* Recent Insurance Claims Table Only */}
        <Column lg={16} md={8} sm={4}>
          <Tile style={{ background: '#fff', marginBottom: '2rem', padding: '2rem', borderRadius: 0 }}>
            <div style={{ background: '#f4f4f4', padding: '1.5rem', borderRadius: 0 }}>
              {/* Recent Insurance Claims */}
              <Tile style={{ boxShadow: 'none', background: 'transparent', padding: 0, marginBottom: '2.5rem' }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", marginTop: '2rem' }}
                >
                  <h2 className="section-title">Recent Insurance Claims</h2>
                  <Button kind="secondary" size="sm" renderIcon={Document}>
                    View All Claims
                  </Button>
                </div>
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
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map((row) => (
                            <TableRow {...getRowProps({ row })} key={row.id}>
                              {row.cells.map((cell) => (
                                <TableCell key={cell.id}>{cell.value}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </DataTable>
              </Tile>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
} 