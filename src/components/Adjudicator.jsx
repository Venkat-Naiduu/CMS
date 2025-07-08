import React, { useState, useEffect } from "react";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell, Button, Modal, Tag, InlineLoading, Pagination } from "@carbon/react";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

function getAuthToken() {
  return localStorage.getItem('authToken');
}

function getUserData() {
  try {
    return JSON.parse(localStorage.getItem('userData'));
  } catch {
    return null;
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

function getRiskTagType(riskScore) {
  if (typeof riskScore !== 'number') return 'gray';
  if (riskScore >= 70) return 'red';
  if (riskScore >= 30) return 'yellow';
  return 'green';
}

const Adjudicator = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const userData = getUserData();
      const insuranceName = userData?.insurance_name;
      const response = await fetch(`${API_BASE_URL}/analytics?insurance_name=${encodeURIComponent(insuranceName)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch claims');
      const data = await response.json();
      // Only show claims with status 'In Progress'
      const mappedClaims = (data.claims || [])
        .filter(claim => claim.status === "In Progress")
        .map(claim => ({
          claim_id: claim.claim_id,
          name: claim.name || '',
          submitted_on: formatDate(claim.submittedAt),
          risk_score: typeof claim.risk_score === 'number' ? claim.risk_score : null,
        }));
      setClaims(mappedClaims);
    } catch (err) {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleReview = (claim) => {
    setSelectedClaim(claim);
    setNotes("");
    setAction("");
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedClaim(null);
    setNotes("");
    setAction("");
  };

  const handleSetRFI = () => {
    setAction("RFI");
  };

  const handleSubmit = async () => {
    if (!selectedClaim || !action) return;
    setSubmitting(true);
    try {
      const token = getAuthToken();
      const payload = { claim_id: selectedClaim.claim_id, action };
      if (notes) payload.notes = notes;
      await fetch(`${API_BASE_URL}/adjudicator-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      handleClose();
      // Remove the claim from the table after action
      setClaims(prevClaims => prevClaims.filter(c => c.claim_id !== selectedClaim.claim_id));
    } catch (err) {
      alert("Failed to submit adjudication.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 32, paddingTop: 120 }}>
      <h2>Adjudicator Work Queue</h2>
      {loading ? (
        <InlineLoading description="Loading claims..." />
      ) : (
        <>
          <Table aria-label="Adjudicator Work Queue">
            <TableHead>
              <TableRow>
                <TableHeader>Claim ID</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader>Submitted On</TableHeader>
                <TableHeader>Risk</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.claim_id}>
                  <TableCell>{claim.claim_id}</TableCell>
                  <TableCell>{claim.name}</TableCell>
                  <TableCell>{claim.submitted_on}</TableCell>
                  <TableCell>
                    <Tag type={getRiskTagType(claim.risk_score)}>{claim.risk_score !== null ? claim.risk_score : '-'}</Tag>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" kind="primary" onClick={() => handleReview(claim)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination at the bottom */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <Pagination
              page={1}
              pageSize={5}
              pageSizes={[5, 10, 15, 30, 40, 50]}
              totalItems={claims.length}
              onChange={() => {}}
              size="sm"
            />
          </div>
        </>
      )}
      {/* Move Modal to bottom to avoid overlap with navbar */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100 }}>
        {showModal && (
          <Modal
            open={showModal}
            modalHeading={`Review Claim ${selectedClaim?.claim_id}`}
            primaryButtonText="Submit"
            secondaryButtonText="Cancel"
            onRequestClose={handleClose}
            onRequestSubmit={handleSubmit}
            passiveModal={false}
            preventCloseOnClickOutside={true}
            primaryButtonDisabled={submitting || !action}
            secondaryButtonDisabled={submitting}
          >
            <div style={{ marginBottom: 16 }}>
              <strong>Claim ID:</strong> {selectedClaim?.claim_id}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Adjudicator Notes:</label>
              <textarea
                style={{ width: '100%', minHeight: 80, marginTop: 4 }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
              <Button
                size="sm"
                kind={action === "Rejected" ? "danger" : "secondary"}
                onClick={() => setAction("Rejected")}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                Rejected
              </Button>
              <Button
                size="sm"
                kind={action === "Approved" ? "primary" : "secondary"}
                onClick={() => setAction("Approved")}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                Approved
              </Button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Button
                size="sm"
                kind={action === "RFI" ? "primary" : "tertiary"}
                onClick={handleSetRFI}
                disabled={submitting}
                style={{ width: '100%' }}
              >
                Ask for More Information (RFI)
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Adjudicator; 