import React, { useState, useRef, useEffect } from "react";
import { Tile, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, Button, ExpandableSearch, Pagination, OverflowMenu, OverflowMenuItem, Select, SelectItem, Modal, InlineNotification } from "@carbon/react";
import { Checkmark, Close, Time, Document, Filter, Download, TrashCan } from "@carbon/icons-react";
import { Tag } from "@carbon/react";
import "./Dashboard.css";
import { getUserData, getAuthToken } from "../utils/auth";

const claimStatusStages = [
  "Initiated", "Documents Received", "OCR & Data Extraction", "Eligibility Check",
  "Fraud Analysis", "Medical Necessity & Cost Validation", "Claim Under Review",
  "Approved / Rejected", "Payment Processing", "Completed"
];

const tableHeaders = [
  { key: "id", header: "Claim ID" },
  { key: "patientName", header: "Patient Name" },
  { key: "submissionDate", header: "Submission Date" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Status" },
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
    case "RFI": type = "blue"; break;
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
  a.download = `claim_${row.id}_report.txt`;
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

  // Modal and notification states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [claimToDelete, setClaimToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: 'success', title: '', message: '' });

  const userData = getUserData();
  const hospitalid = userData?.hospitalid;

  const [claimsSummary, setClaimsSummary] = useState([
    { title: "Total Claims Submitted", value: 0 },
    { title: "Approved Claims", value: 0 },
    { title: "Rejected Claims", value: 0 },
    { title: "Claims In Progress", value: 0 },
  ]);
  const [tableRows, setTableRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showRfiModal, setShowRfiModal] = useState(false);
  const [rfiClaimId, setRfiClaimId] = useState('');
  const [rfiResponse, setRfiResponse] = useState('');
  const [rfiFiles, setRfiFiles] = useState([]);
  const [rfiLoading, setRfiLoading] = useState(false);
  const [rfiNotes, setRfiNotes] = useState(''); // Add state for RFI notes

  const handleRemoveClaim = async (claimId) => {
    setClaimToDelete(claimId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!claimToDelete) return;

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/hospital-claim/${claimToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove the claim from the local state
      setTableRows(prevRows => prevRows.filter(row => row.id !== claimToDelete));
      
      // Recalculate summary counts
      const updatedClaims = tableRows.filter(row => row.id !== claimToDelete);
      const total = updatedClaims.length;
      const approved = updatedClaims.filter(claim => claim.status === "Approved").length;
      const rejected = updatedClaims.filter(claim => claim.status === "Rejected").length;
      const inProgress = updatedClaims.filter(claim => 
        claim.status === "Pending" || 
        claim.status === "In Progress" ||
        claim.status === "Initiated" ||
        claim.status === "Documents Received" ||
        claim.status === "OCR & Data Extraction" ||
        claim.status === "Eligibility Check" ||
        claim.status === "Fraud Analysis" ||
        claim.status === "Medical Necessity & Cost Validation" ||
        claim.status === "Claim Under Review" ||
        claim.status === "Payment Processing"
      ).length;
      
      setClaimsSummary([
        { title: "Total Claims Submitted", value: total },
        { title: "Approved Claims", value: approved },
        { title: "Rejected Claims", value: rejected },
        { title: "Claims In Progress", value: inProgress },
      ]);

      setNotification({
        show: true,
        type: 'success',
        title: 'Success',
        message: `Claim ${claimToDelete} has been removed successfully.`
      });

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification({ show: false, type: 'success', title: '', message: '' });
      }, 5000);

    } catch (error) {
      console.error('Error removing claim:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: `Failed to remove claim: ${error.message}`
      });

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification({ show: false, type: 'error', title: '', message: '' });
      }, 5000);
    } finally {
      setShowDeleteModal(false);
      setClaimToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setClaimToDelete(null);
  };

  useEffect(() => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    const token = getAuthToken();
    
    fetch(`${API_BASE_URL}/hospital-details?hospitalid=${encodeURIComponent(hospitalid)}`, {
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
        console.log('Hospital details response:', data); // Debug log
        console.log('Claims from response:', claims); // Debug log
        
        // Calculate counts from claims data
        const total = claims.length;
        const approved = claims.filter(claim => claim.status === "Approved").length;
        const rejected = claims.filter(claim => claim.status === "Rejected").length;
        const inProgress = claims.filter(claim => 
          claim.status === "Pending" || 
          claim.status === "In Progress" ||
          claim.status === "Initiated" ||
          claim.status === "Documents Received" ||
          claim.status === "OCR & Data Extraction" ||
          claim.status === "Eligibility Check" ||
          claim.status === "Fraud Analysis" ||
          claim.status === "Medical Necessity & Cost Validation" ||
          claim.status === "Claim Under Review" ||
          claim.status === "Payment Processing"
        ).length;
        
        setClaimsSummary([
          { title: "Total Claims Submitted", value: total },
          { title: "Approved Claims", value: approved },
          { title: "Rejected Claims", value: rejected },
          { title: "Claims In Progress", value: inProgress },
        ]);
        setTableRows(claims);
        
        // Store RFI notes in localStorage if found
        claims.forEach(claim => {
          if (claim.status === 'RFI' && claim.notes) {
            storeRfiNotes(claim.id, claim.notes);
          }
          if (claim.status === 'RFI' && claim.claim_details?.notes) {
            storeRfiNotes(claim.id, claim.claim_details.notes);
          }
        });
      })
      .catch((error) => {
        console.error('Error fetching hospital details:', error);
        // Set default data if API fails
        setClaimsSummary([
          { title: "Total Claims Submitted", value: 0 },
          { title: "Approved Claims", value: 0 },
          { title: "Rejected Claims", value: 0 },
          { title: "Claims In Progress", value: 0 },
        ]);
        setTableRows([]);
      });
  }, [hospitalid]);

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
        row.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.submissionDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.amount.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.status.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const handleRfiFileChange = (e) => {
    setRfiFiles(Array.from(e.target.files));
  };

  // Function to store RFI notes in localStorage
  const storeRfiNotes = (claimId, notes) => {
    try {
      const rfiNotes = JSON.parse(localStorage.getItem('rfiNotes') || '{}');
      rfiNotes[claimId] = notes;
      localStorage.setItem('rfiNotes', JSON.stringify(rfiNotes));
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

  const handleOpenRfiModal = (claimId) => {
    // Find the claim in the tableRows array to get the notes
    const claim = tableRows.find(c => c.id === claimId);
    console.log('Found claim:', claim); // Debug log
    console.log('All claims:', tableRows); // Debug log
    
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
      const res = await fetch(`${API_BASE_URL}/api/rfi-hospital`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to submit RFI response');
      handleCloseRfiModal();
      setNotification({ show: true, type: 'success', title: 'Success', message: 'RFI response submitted successfully!' });
      setTimeout(() => setNotification({ show: false, type: 'success', title: '', message: '' }), 5000);
    } catch (err) {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to submit RFI response.' });
      setTimeout(() => setNotification({ show: false, type: 'error', title: '', message: '' }), 5000);
    } finally {
      setRfiLoading(false);
    }
  };

  return (
    <div className="dashboard-main">
      <h2 className="dashboard-heading">Dashboard</h2>
      
      {/* Notification */}
      {notification.show && (
        <div style={{ marginBottom: '16px' }}>
          <InlineNotification
            kind={notification.type}
            title={notification.title}
            subtitle={notification.message}
            onClose={() => setNotification({ show: false, type: 'success', title: '', message: '' })}
          />
        </div>
      )}

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
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.patientName}</TableCell>
                    <TableCell>{row.submissionDate}</TableCell>
                    <TableCell>{row.amount ? row.amount.replace(/\$/g, '') : ''}</TableCell>
                    <TableCell>{getStatusTag(row.status)}</TableCell>
                    <TableCell>
                      <OverflowMenu size="sm" flipped>
                        {row.status === 'RFI' && (
                          <OverflowMenuItem
                            itemText="Respond to RFI"
                            onClick={() => handleOpenRfiModal(row.id)}
                          />
                        )}
                        <OverflowMenuItem itemText="Download Report" onClick={() => downloadClaimReport(row)} />
                        <OverflowMenuItem 
                          itemText="Remove" 
                          onClick={() => handleRemoveClaim(row.id)}
                          hasDivider
                          renderIcon={TrashCan}
                          style={{ color: '#da1e28' }}
                        />
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

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        modalHeading="Confirm Delete"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={false}
        onRequestClose={cancelDelete}
        onRequestSubmit={confirmDelete}
        danger
        size="sm"
      >
        <p>
          Are you sure you want to remove claim <strong>{claimToDelete}</strong>? 
          This action cannot be undone.
        </p>
      </Modal>

      {/* RFI Modal */}
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
};

export default Dashboard; 