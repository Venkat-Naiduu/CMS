import React, { useState, useEffect } from 'react';
import { Tile, Tag, Modal, Button, Pagination } from '@carbon/react';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell, TableContainer } from '@carbon/react';
import { PieChart } from '@carbon/charts-react';
import '@carbon/charts/styles.css';
import '@carbon/styles/css/styles.css';
import './analytics.css';
import { Menu, OverflowMenuVertical } from '@carbon/icons-react';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import Nav_insurance from "./nav_insurance";
import { getUserData, getAuthToken } from "../utils/auth";

const statusToTag = {
  CLEAN: <Tag type="green">Clean</Tag>,
  LOW_RISK: <Tag type="cool-gray">Low Risk</Tag>,
  MEDIUM_RISK: <Tag type="yellow">Medium Risk</Tag>,
  HIGH_RISK: <Tag type="red">High Risk</Tag>,
  RFI: <Tag type="blue">RFI</Tag>
};

const statusToGroup = {
  CLEAN: 'Clean',
  LOW_RISK: 'Low Risk',
  MEDIUM_RISK: 'Medium Risk',
  HIGH_RISK: 'High Risk',
  RFI: 'RFI'
};

const caseTypeDescriptions = {
  'CASE 1': 'Amount Outlier Check',
  'CASE 2': 'Rural Hospital, High-Tech Surgery',
  'CASE 3': 'Pre-existing Disease before Insurance',
  'CASE 4': 'Multiple Claims in Year',
  'CASE 5': 'Fake or Unknown Disease',
  'CASE 6': 'Overdose/Overbilling Detection',
  'CASE 7': 'Mismatched Diagnosis and Claimed Treatment'
};

const getRiskScoreColor = (score) => {
  if (score >= 80) return { color: '#fa4d56', fontWeight: 600 };
  if (score >= 60) return { color: '#f1c21b', fontWeight: 600 };
  if (score >= 40) return { color: '#ff832b', fontWeight: 600 };
  return { color: '#24a148', fontWeight: 600 };
};

const Analytics = () => {
  const [showRiskTable, setShowRiskTable] = useState(false);
  const [showFraudCasesTable, setShowFraudCasesTable] = useState(false);
  const [showSeverityTable, setShowSeverityTable] = useState(false);
  const [showFlagsModal, setShowFlagsModal] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [showRfiModal, setShowRfiModal] = useState(false);
  const [rfiClaimId, setRfiClaimId] = useState('');
  const [rfiResponse, setRfiResponse] = useState('');
  const [rfiFiles, setRfiFiles] = useState([]);
  const [rfiLoading, setRfiLoading] = useState(false);
  const [rfiNotes, setRfiNotes] = useState(''); // Add state for RFI notes
  
  // API data state
  const [claimsData, setClaimsData] = useState([]);
  const [severityDistribution, setSeverityDistribution] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Total items state
  const [totalItems, setTotalItems] = useState(0);

  const ROWS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const paginatedClaims = claimsData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const token = getAuthToken();
        const userData = getUserData();
        const insuranceId = userData?.insurance_id;
        const insuranceName = userData?.insurance_name || userData?.insuranceProvider || insuranceId;
        
        if (!insuranceName) {
          console.error('No insurance name found in user data');
          setError('No insurance name found');
          setLoading(false);
          return;
        }
        
        console.log('User data:', userData);
        console.log('Using insurance name:', insuranceName);
        
        const response = await fetch(`${API_BASE_URL}/analytics?insurance_name=${encodeURIComponent(insuranceName)}`, {
        
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setClaimsData(data.claims || []);
          setSeverityDistribution(data.severity_distribution || {});
          setTotalItems(data.claims ? data.claims.length : 0);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to fetch analytics data');
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to load analytics data');
        setClaimsData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);

  // Download claim report function
  const downloadClaimReport = async (claimId) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/download-report/${claimId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reportData = await response.json();
      
      // Create formatted report content
      const reportContent = `
FRAUD DETECTION REPORT
======================

Claim ID: ${reportData.claim_id}
Report Date: ${new Date(reportData.report_date).toLocaleDateString()}

RISK ASSESSMENT
--------------
Overall Risk Score: ${reportData.risk_assessment.overall_risk_score}
Risk Level: ${reportData.risk_assessment.risk_level}

CLAIM DETAILS
-------------
Patient Name: ${reportData.claim_details.patient_name}
Submission Date: ${reportData.claim_details.submission_date}
Amount: ${reportData.claim_details.amount}
Treatment: ${reportData.claim_details.treatment}
Diagnosis: ${reportData.claim_details.diagnosis}

FRAUD FLAGS
-----------
${reportData.risk_assessment.fraud_flags.map(flag => `
Case Type: ${flag.case_type}
Severity: ${flag.severity}
Description: ${flag.description}
Recommendation: ${flag.recommendation}
`).join('\n')}

ANALYSIS SUMMARY
----------------
${reportData.analysis_summary}
      `.trim();
      
      // Create and download file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraud_report_${claimId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  // Helper to get risk group from risk_score
  function getRiskGroup(risk_score) {
    if (typeof risk_score !== 'number') return 'Unknown';
    if (risk_score >= 70) return 'High Risk';
    if (risk_score >= 35) return 'Medium Risk';
    if (risk_score >= 5) return 'Low Risk';
    return 'Clean';
  }

  // Risk distribution data for pie chart and table, based on risk_score
  const riskDistributionData = claimsData
    .map(claim => ({
      group: getRiskGroup(claim.risk_score),
      claim_id: claim.claim_id,
      value: 1,
      risk_score: claim.risk_score
    }))
    .sort((a, b) => b.risk_score - a.risk_score);

  // Create a color mapping based on risk groups
  const riskColorMap = {
    'Clean': '#ffe5b4',      // Very light orange
    'Low Risk': '#f1c21b',  // Yellow
    'Medium Risk': '#ff832b', // Orange
    'High Risk': '#fa4d56'   // Red-Orange
  };

  // Group and count claims by risk group for pie chart
  const riskGroupCounts = claimsData.reduce((acc, claim) => {
    const group = getRiskGroup(claim.risk_score);
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});
  const riskPieData = Object.entries(riskGroupCounts).map(([group, count]) => ({
    group,
    value: count
  }));
  const riskPieTotal = claimsData.length;

  const riskDistributionOptions = {
    title: "Risk Distribution",
    resizable: true,
    height: "300px",
    width: "100%",
    color: { 
      scale: [riskColorMap['Clean'], riskColorMap['Low Risk'], riskColorMap['Medium Risk'], riskColorMap['High Risk']]
    },
    pie: {
      labels: {
        main: {
          enabled: true,
          formatter: (d) => {
            const percent = riskPieTotal ? ((d.value / riskPieTotal) * 100).toFixed(0) : 0;
            return `${d.group} (${percent}%)`;
          }
        },
        value: { enabled: false }
      }
    },
    toolbar: {
      enabled: false
    },
    legend: {
      enabled: true,
      position: "bottom"
    },
    data: {
      loading: false
    }
  };

  // Fraud case types data (percentages)
  const caseTypesCount = {};
  claimsData.forEach(claim => {
    claim.flags?.forEach(flag => {
      const caseType = flag.case_type.split(':')[0];
      caseTypesCount[caseType] = (caseTypesCount[caseType] || 0) + 1;
    });
  });
  const caseTypesData = Object.entries(caseTypesCount).map(([type, count]) => ({ 
    group: caseTypeDescriptions[type] || type, 
    value: count 
  }));
  const caseTypesOptions = {
    title: "Fraud Case Types",
    resizable: true,
    height: "300px",
    width: "100%",
    color: { scale: ["#8B5CF6", "#06B6D4", "#84CC16", "#F472B6", "#6366F1", "#14B8A6", "#F97316"] },
    toolbar: {
      enabled: false
    }
  };

  // Severity distribution data (percentages)
  const severityDistributionData = [
    { group: 'Low Severity', value: severityDistribution.LOW || 0 },
    { group: 'Medium Severity', value: severityDistribution.MEDIUM || 0 },
    { group: 'High Severity', value: severityDistribution.HIGH || 0 }
  ].filter(item => item.value > 0);
  const severityDistributionOptions = {
    title: "Severity Distribution",
    resizable: true,
    height: "300px",
    width: "100%",
    color: { scale: ["#87ceeb", "#4682b4", "#1e3a8a"] },
    toolbar: {
      enabled: false
    }
  };

  // Calculate summary statistics
  const totalClaims = claimsData.length;
  const cleanClaims = claimsData.filter(claim => getRiskGroup(claim.risk_score) === 'Clean').length;
  const lowRiskClaims = claimsData.filter(claim => getRiskGroup(claim.risk_score) === 'Low Risk').length;
  const mediumRiskClaims = claimsData.filter(claim => getRiskGroup(claim.risk_score) === 'Medium Risk').length;
  const highRiskClaims = claimsData.filter(claim => getRiskGroup(claim.risk_score) === 'High Risk').length;

  // Build a mapping from case type to claim IDs
  const caseTypesToClaims = {};
  claimsData.forEach(claim => {
    claim.flags?.forEach(flag => {
      const caseType = flag.case_type.split(':')[0];
      const caseTypeDesc = caseTypeDescriptions[caseType] || caseType;
      if (!caseTypesToClaims[caseTypeDesc]) caseTypesToClaims[caseTypeDesc] = [];
      if (!caseTypesToClaims[caseTypeDesc].includes(claim.claim_id)) {
        caseTypesToClaims[caseTypeDesc].push(claim.claim_id);
      }
    });
  });

  // Build a list of { claim_id, severity } rows for the table
  const claimSeverityRows = [];
  claimsData.forEach(claim => {
    if (claim.severity) {
      claimSeverityRows.push({ claim_id: claim.claim_id, severity: claim.severity });
    }
  });

  const handleRfiFileChange = (e) => {
    setRfiFiles(Array.from(e.target.files));
  };

  const handleOpenRfiModal = (claimId) => {
    // Find the claim in the claimsData array to get the notes
    const claim = claimsData.find(c => c.claim_id === claimId);
    const notes = claim?.notes || 'No additional information provided.';
    
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
      const res = await fetch(`${API_BASE_URL}/rfi-submit-dashboard`, {
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
    <>
      <Nav_insurance />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Fraud Detection Dashboard</h1>
          <p>Insurance claim fraud analysis and risk assessment</p>
        </div>
        {/* Summary Tiles */}
        <div className="dashboard-row dashboard-tiles">
          <div className="dashboard-col">
            <Tile className="summary-tile" style={{ background: '#f4f4f4', minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Total Claims</div>
              <div className="tile-value" style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#161616' }}>{totalClaims}</div>
            </Tile>
          </div>
          <div className="dashboard-col">
            <Tile className="summary-tile" style={{ background: '#f4f4f4', minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Clean Claims</div>
              <div className="tile-value" style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#24a148' }}>{cleanClaims}</div>
            </Tile>
          </div>
          <div className="dashboard-col">
            <Tile className="summary-tile" style={{ background: '#f4f4f4', minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Low Risk Claims</div>
              <div className="tile-value" style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#f1c21b' }}>{lowRiskClaims}</div>
            </Tile>
          </div>
          <div className="dashboard-col">
            <Tile className="summary-tile" style={{ background: '#f4f4f4', minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Medium Risk Claims</div>
              <div className="tile-value" style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#ff832b' }}>{mediumRiskClaims}</div>
            </Tile>
          </div>
          <div className="dashboard-col">
            <Tile className="summary-tile" style={{ background: '#f4f4f4', minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>High Risk Claims</div>
              <div className="tile-value" style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#fa4d56' }}>{highRiskClaims}</div>
            </Tile>
          </div>
        </div>
        {/* Charts Section */}
        <div className="dashboard-row dashboard-charts">
          <div className="dashboard-chart-col">
            <Tile>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
                <Menu
                  style={{ cursor: 'pointer' }}
                  size={24}
                  aria-label="Show as table"
                  title="Show as table"
                  onClick={() => setShowRiskTable(true)}
                />
              </div>
              <PieChart data={riskPieData} options={riskDistributionOptions} />
              <Modal
                open={showRiskTable}
                modalHeading="Risk Distribution Table"
                primaryButtonText="Close"
                onRequestClose={() => setShowRiskTable(false)}
                onRequestSubmit={() => setShowRiskTable(false)}
                passiveModal
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Claim ID</TableHeader>
                        <TableHeader>Risk Group</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {riskDistributionData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.claim_id}</TableCell>
                          <TableCell>{row.group}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Modal>
            </Tile>
          </div>
          <div className="dashboard-chart-col">
            <Tile>
              <PieChart data={caseTypesData} options={caseTypesOptions} />
              <Modal
                open={showFraudCasesTable}
                modalHeading="Fraud Case Types by Claim"
                primaryButtonText="Close"
                onRequestClose={() => setShowFraudCasesTable(false)}
                onRequestSubmit={() => setShowFraudCasesTable(false)}
                passiveModal
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Case Type</TableHeader>
                        <TableHeader>Claim IDs</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(caseTypesToClaims).map(([caseType, claimIds]) => (
                        <TableRow key={caseType}>
                          <TableCell>{caseType}</TableCell>
                          <TableCell>{claimIds.join(', ')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Modal>
            </Tile>
          </div>
        </div>
        {/* Recent Claims Table */}
        <div className="dashboard-row dashboard-table-row">
          <Tile className="dashboard-table-tile" style={{ width: '100%' }}>
            <TableContainer style={{ width: '100%' }}>
              <Table aria-label="Recent Claims" style={{ width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableHeader>Claim ID</TableHeader>
                    <TableHeader>Patient Name</TableHeader>
                    <TableHeader>Risk Group</TableHeader>
                    <TableHeader>Risk Score</TableHeader>
                    <TableHeader>Flags</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedClaims.map((claim) => (
                    <TableRow key={claim.claim_id}>
                      <TableCell>{claim.claim_id}</TableCell>
                      <TableCell>{claim.patientName || claim.name}</TableCell>
                      <TableCell>{getRiskGroup(claim.risk_score)}</TableCell>
                      <TableCell>
                        <span style={{
                          fontWeight: 700,
                          color:
                            getRiskGroup(claim.risk_score) === 'High Risk' ? '#fa4d56' :
                            getRiskGroup(claim.risk_score) === 'Medium Risk' ? '#f1c21b' :
                            getRiskGroup(claim.risk_score) === 'Low Risk' ? '#ff832b' :
                            '#24a148'
                        }}>
                          {typeof claim.risk_score === 'number' ? claim.risk_score : '-'}
                        </span>
                      </TableCell>
                      <TableCell>{claim.flags ? claim.flags.length : 0}</TableCell>
                      <TableCell>
                        <OverflowMenu renderIcon={OverflowMenuVertical} size="sm" flipped>
                          <OverflowMenuItem
                            itemText="View Flags"
                            onClick={() => {
                              setSelectedFlags(claim.flags);
                              setSelectedClaimId(claim.claim_id);
                              setShowFlagsModal(true);
                            }}
                          />
                          <OverflowMenuItem
                            itemText="Download Report"
                            onClick={() => downloadClaimReport(claim.claim_id)}
                          />
                          {claim.status === 'RFI' && (
                            <OverflowMenuItem
                              itemText="Respond to RFI"
                              onClick={() => handleOpenRfiModal(claim.claim_id)}
                            />
                          )}
                        </OverflowMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
                <Pagination
                  page={currentPage}
                  pageSize={ROWS_PER_PAGE}
                  pageSizes={[ROWS_PER_PAGE]}
                  totalItems={claimsData.length}
                  onChange={({ page }) => setCurrentPage(page)}
                  size="sm"
                  style={{ marginTop: 16 }}
                />
            <Modal
              open={showFlagsModal}
              modalHeading={`Fraud Flags for Claim ${selectedClaimId}`}
              primaryButtonText="Close"
              onRequestClose={() => setShowFlagsModal(false)}
              onRequestSubmit={() => setShowFlagsModal(false)}
              passiveModal
            >
              {selectedFlags && selectedFlags.length > 0 ? (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {selectedFlags.map((flag, idx) => {
                    const caseType = flag.case_type.split(':')[0];
                    const caseTypeDesc = caseTypeDescriptions[caseType] || flag.case_type;
                    return (
                      <li key={idx}>{caseTypeDesc} <span style={{ fontSize: 12, color: '#888' }}>({flag.severity})</span></li>
                    );
                  })}
                </ul>
              ) : (
                <span style={{ color: '#888' }}>No fraud flags for this claim.</span>
              )}
            </Modal>
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
          </Tile>
        </div>
      </div>
    </>
  );
};

export default Analytics; 