import React, { useState, useRef, useEffect } from "react";
import { Tile, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, Button, ProgressBar, ExpandableSearch, Pagination, OverflowMenu, OverflowMenuItem, Select, SelectItem } from "@carbon/react";
import { Checkmark, Close, Time, Document, Filter, Download } from "@carbon/icons-react";
import { Tag } from "@carbon/react";
import "./Dashboard.css";
import Nav_insurance from "./nav_insurance";
import { getUserData, getAuthToken } from "../utils/auth";

const claimStatusStages = [
  "Initiated", "Documents Received", "OCR & Data Extraction", "Eligibility Check",
  "Fraud Analysis", "Medical Necessity & Cost Validation", "Claim Under Review",
  "Approved / Rejected", "Payment Processing", "Completed"
];

const tableHeaders = [
  { key: "claimId", header: "Claim ID" },
  { key: "patientName", header: "Patient Name" },
  { key: "submissionDate", header: "Submission Date" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Status" },
  { key: "progress", header: "Progress" },
  { key: "actions", header: "Actions" },
];

const getStatusTag = (status) => {
  let type = "gray";
  let text = status;
  switch (status) {
    case "Approved": type = "green"; break;
    case "Rejected": type = "red"; break;
    case "Pending": type = "yellow"; break;
    case "In Progress": type = "blue"; break;
    default: type = "gray";
  }
  return (
    <Tag className="dashboard-status-tag" size="md" type={type} title={status}>
      {text}
    </Tag>
  );
};

const iconMap = {
  "Total Claims Submitted": <Document size={32} className="dashboard-card-icon" />,
  "Approved Claims": <Checkmark size={32} className="dashboard-card-icon" />,
  "Rejected Claims": <Close size={32} className="dashboard-card-icon" />,
  "Claims In Progress": <Time size={32} className="dashboard-card-icon" />,
};

function exportToCSV(rows, headers) {
  const csvRows = [];
  // Add headers
  csvRows.push(headers.map(h => `"${h.header}"`).join(","));
  // Add data rows
  rows.forEach(row => {
    csvRows.push(headers.map(h => `"${row[h.key] || ""}"`).join(","));
  });
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "claims.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}

function downloadClaimReport(row) {
  const content = Object.entries(row)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `claim_${row.claimId}_report.txt`;
  a.click();
  window.URL.revokeObjectURL(url);
}

const Dashboard = () => {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [statusFilter, setStatusFilter] = useState("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const filterRef = useRef(null);
  const dropdownRef = useRef(null);

  const [claimsSummary, setClaimsSummary] = useState([
    { title: "Total Claims Submitted", value: 0 },
    { title: "Approved Claims", value: 0 },
    { title: "Rejected Claims", value: 0 },
    { title: "Claims In Progress", value: 0 },
  ]);
  const [tableRows, setTableRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    const token = getAuthToken();
    const userData = getUserData();
    const insuranceId = userData?.insurance_id;
    const insuranceName = userData?.insurance_name || userData?.insuranceProvider || insuranceId;
    
    if (!insuranceName) {
      console.error('No insurance name found in user data');
      return;
    }
    
    console.log('User data:', userData);
    console.log('Using insurance name:', insuranceName);
    
    fetch(`${API_BASE_URL}/insurance-details?insurance_name=${encodeURIComponent(insuranceName)}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const claims = data.claims || [];
        setTableRows(claims);
        
        // Calculate summary statistics from claims data
        const total = claims.length;
        const approved = claims.filter(claim => claim.status === 'Approved').length;
        const rejected = claims.filter(claim => claim.status === 'Rejected').length;
        const inProgress = claims.filter(claim => 
          claim.status === 'Pending' || 
          claim.status === 'In Progress' ||
          claim.status === 'Initiated' ||
          claim.status === 'Documents Received' ||
          claim.status === 'OCR & Data Extraction' ||
          claim.status === 'Eligibility Check' ||
          claim.status === 'Fraud Analysis' ||
          claim.status === 'Medical Necessity & Cost Validation' ||
          claim.status === 'Claim Under Review' ||
          claim.status === 'Payment Processing'
        ).length;
        
        setClaimsSummary([
          { title: "Total Claims Submitted", value: total },
          { title: "Approved Claims", value: approved },
          { title: "Rejected Claims", value: rejected },
          { title: "Claims In Progress", value: inProgress },
        ]);
      })
      .catch((error) => {
        console.error('Error fetching insurance details:', error);
        // Set default data if API fails
        setClaimsSummary([
          { title: "Total Claims Submitted", value: 0 },
          { title: "Approved Claims", value: 0 },
          { title: "Rejected Claims", value: 0 },
          { title: "Claims In Progress", value: 0 },
        ]);
        setTableRows([]);
      });
  }, []);

  useEffect(() => {
    if (!showStatusFilter) return;
    function handleClickOutside(event) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowStatusFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStatusFilter]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRows = tableRows
    .filter(row =>
      (!statusFilter || row.status === statusFilter) &&
      (
        (row.claimId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (row.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (row.submissionDate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (row.amount || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (row.status || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <Nav_insurance />
      <div className="dashboard-main">
        <h2 className="dashboard-heading">Dashboard</h2>
        <div className="dashboard-main-bg">
          <div className="dashboard-cards-row">
            {claimsSummary.map((card) => (
              <div className="dashboard-card-wrapper" key={card.title}>
                <Tile className="dashboard-card no-radius">
                  <div className="dashboard-card-content">
                    <div className="dashboard-card-title">{card.title}</div>
                    <div className="dashboard-card-value">{card.value}</div>
                  </div>
                  <div className="dashboard-card-icon-top">{iconMap[card.title]}</div>
                </Tile>
              </div>
            ))}
          </div>
          <div className="dashboard-table-block">
            <Tile className="dashboard-table-tile no-radius" style={{ marginTop: 24 }}>
              <div className="dashboard-table-controls-inside">
                <div className="dashboard-table-controls-right">
                  <span>
                    <ExpandableSearch size="lg" labelText="Search" closeButtonLabelText="Clear search input" id="search-expandable-1" value={searchQuery} onChange={handleSearchChange} />
                  </span>
                  <Filter
                    size={20}
                    style={{ color: '#161616', cursor: 'pointer', marginRight: 19 }}
                    onClick={() => setShowStatusFilter((prev) => !prev)}
                    ref={filterRef}
                  />
                  {showStatusFilter && (
                    <div
                      ref={dropdownRef}
                      style={{ position: 'absolute', zIndex: 20, top: 36, right: 120, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 6, padding: 8 }}
                    >
                      <Select
                        id="status-filter"
                        labelText=""
                        hideLabel
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setShowStatusFilter(false); }}
                        size="sm"
                        style={{ width: 140 }}
                      >
                        <SelectItem value="" text="All Statuses" />
                        <SelectItem value="Approved" text="Approved" />
                        <SelectItem value="Rejected" text="Rejected" />
                        <SelectItem value="Pending" text="Pending" />
                        <SelectItem value="In Progress" text="In Progress" />
                      </Select>
                    </div>
                  )}
                  <Button
                    kind="primary"
                    size="sm"
                    className="dashboard-export-btn dashboard-export-btn-blue"
                    onClick={() => exportToCSV(tableRows, tableHeaders)}
                  >
                    <span className="dashboard-export-btn-icon"><Download size={20} /></span>
                    <span>Export</span>
                  </Button>
                </div>
              </div>
              <Table aria-label="sample table">
                <TableHead>
                  <TableRow>
                    {tableHeaders.map((header) => (
                      <TableHeader key={header.key}>{header.header}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedRows.map((row) => (
                    <TableRow key={row.claimId}>
                      <TableCell>{row.claimId}</TableCell>
                      <TableCell>{row.patientName}</TableCell>
                      <TableCell>{row.submissionDate}</TableCell>
                      <TableCell>{row.amount ? row.amount.replace(/\$/g, '') : ''}</TableCell>
                      <TableCell>{getStatusTag(row.status)}</TableCell>
                      <TableCell>
                        <div style={{ minWidth: 90, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ProgressBar size="sm" value={(row.currentStage / 10) * 100} hideLabel />
                          <span style={{ fontSize: 12, color: '#888' }}>{row.currentStage}/10</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <OverflowMenu size="sm" flipped>
                          <OverflowMenuItem itemText="View Details" />
                          <OverflowMenuItem itemText="Download Report" onClick={() => downloadClaimReport(row)} />
                        </OverflowMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} style={{ textAlign: 'center', background: '#fff', padding: 0 }}>
                      <Pagination
                        style={{ margin: 0 }}
                        backwardText="Previous page"
                        forwardText="Next page"
                        itemsPerPageText="Items per page:"
                        page={page}
                        pageNumberText="Page Number"
                        pageSize={5}
                        pageSizes={[5, 10, 15, 30, 40, 50]}
                        size="md"
                        totalItems={tableRows.length}
                        onChange={({ page }) => setPage(page)}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Tile>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard; 