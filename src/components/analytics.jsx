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
  HIGH_RISK: <Tag type="red">High Risk</Tag>
};

const statusToGroup = {
  CLEAN: 'Clean',
  LOW_RISK: 'Low Risk',
  MEDIUM_RISK: 'Medium Risk',
  HIGH_RISK: 'High Risk'
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
  
  // API data state
  const [claimsData, setClaimsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
        const token = getAuthToken();
        const userData = getUserData();
        const insuranceId = userData?.insurance_id;
        
        if (!insuranceId) {
          console.error('No insurance ID found in user data');
          setError('No insurance ID found');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/analytics?insurance_id=${encodeURIComponent(insuranceId)}&page=${currentPage}&pageSize=${pageSize}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setClaimsData(data.claims || []);
        setTotalItems(data.total || 0);
        setError(null);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to load analytics data');
        setClaimsData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [currentPage, pageSize]);

  // Download claim report function
  const downloadClaimReport = async (claimId) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
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

  // Pie chart data for risk distribution (one row per claim)
  const riskDistributionData = claimsData.map(claim => ({
    group: statusToGroup[claim.status],
    claim_id: claim.claim_id,
    value: 1
  }));
  const riskDistributionOptions = {
    title: "Risk Distribution",
    resizable: true,
    height: "300px",
    width: "100%",
    color: { scale: ["#b7e4c7", "#ffe5b4", "#ffd6e0", "#bcdff1"] },
    pie: {
      labels: {
        main: {
          enabled: true,
          formatter: (d) => `${d.claim_id} (${d.group})`
        },
        value: { enabled: false }
      }
    },
    toolbar: {
      enabled: false
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
  const caseTypesData = Object.entries(caseTypesCount).map(([type, count]) => ({ group: type, value: count }));
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
  const severityCount = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  claimsData.forEach(claim => {
    claim.flags?.forEach(flag => {
      severityCount[flag.severity]++;
    });
  });
  const severityDistributionData = [
    { group: 'Low Severity', value: severityCount.LOW },
    { group: 'Medium Severity', value: severityCount.MEDIUM },
    { group: 'High Severity', value: severityCount.HIGH }
  ].filter(item => item.value > 0);
  const severityDistributionOptions = {
    title: "Severity Distribution",
    resizable: true,
    height: "300px",
    width: "100%",
    color: { scale: ["#a6e3b6", "#fde49a", "#fad9d6"] },
    toolbar: {
      enabled: false
    }
  };

  // Table headers
  const headers = [
    { key: 'claim_id', header: 'Claim ID' },
    { key: 'risk_group', header: 'Risk Group' },
    { key: 'risk_score', header: 'Risk Score' },
    { key: 'flags', header: 'Fraud Flags' },
    { key: 'action', header: 'Action' },
  ];

  // Calculate summary statistics
  const totalClaims = claimsData.length;
  const cleanClaims = claimsData.filter(claim => claim.status === 'CLEAN').length;
  const lowRiskClaims = claimsData.filter(claim => claim.status === 'LOW_RISK').length;
  const mediumRiskClaims = claimsData.filter(claim => claim.status === 'MEDIUM_RISK').length;
  const highRiskClaims = claimsData.filter(claim => claim.status === 'HIGH_RISK').length;

  // Build a mapping from case type to claim IDs
  const caseTypesToClaims = {};
  claimsData.forEach(claim => {
    claim.flags?.forEach(flag => {
      const caseType = flag.case_type.split(':')[0];
      if (!caseTypesToClaims[caseType]) caseTypesToClaims[caseType] = [];
      if (!caseTypesToClaims[caseType].includes(claim.claim_id)) {
        caseTypesToClaims[caseType].push(claim.claim_id);
      }
    });
  });

  // Build a list of { claim_id, severity } rows for the table
  const claimSeverityRows = [];
  claimsData.forEach(claim => {
    claim.flags?.forEach(flag => {
      claimSeverityRows.push({ claim_id: claim.claim_id, severity: flag.severity });
    });
  });

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
            <Tile className="summary-tile"> <div>Total Claims</div> <div className="tile-value">{totalClaims}</div> </Tile>
          </div>
          <div className="dashboard-col">
            <Tile className="summary-tile"> <div>Clean Claims</div> <div className="tile-value">{cleanClaims}</div> </Tile>
          </div>
          <div className="dashboard-col">
            <Tile className="summary-tile"> <div>Risky Claims</div> <div className="tile-value">{mediumRiskClaims + highRiskClaims}</div> </Tile>
          </div>
          <div className="dashboard-col">
            <Tile className="summary-tile"> <div>High Risk Claims</div> <div className="tile-value">{highRiskClaims}</div> </Tile>
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
              <PieChart data={riskDistributionData} options={riskDistributionOptions} />
              <Modal
                open={showRiskTable}
                modalHeading="Claims by Risk Group"
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
                      {claimsData.map((claim) => (
                        <TableRow key={claim.claim_id}>
                          <TableCell>{claim.claim_id}</TableCell>
                          <TableCell>{statusToGroup[claim.status]}</TableCell>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
                <Menu
                  style={{ cursor: 'pointer' }}
                  size={24}
                  aria-label="Show as table"
                  title="Show as table"
                  onClick={() => setShowFraudCasesTable(true)}
                />
              </div>
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
          <div className="dashboard-chart-col">
            <Tile>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
                <Menu
                  style={{ cursor: 'pointer' }}
                  size={24}
                  aria-label="Show as table"
                  title="Show as table"
                  onClick={() => setShowSeverityTable(true)}
                />
              </div>
              <PieChart data={severityDistributionData} options={severityDistributionOptions} />
              <Modal
                open={showSeverityTable}
                modalHeading="Severity Distribution by Claim"
                primaryButtonText="Close"
                onRequestClose={() => setShowSeverityTable(false)}
                onRequestSubmit={() => setShowSeverityTable(false)}
                passiveModal
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Claim ID</TableHeader>
                        <TableHeader>Severity</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {claimSeverityRows.map((row, idx) => (
                        <TableRow key={row.claim_id + '-' + row.severity + '-' + idx}>
                          <TableCell>{row.claim_id}</TableCell>
                          <TableCell>{row.severity.charAt(0) + row.severity.slice(1).toLowerCase()}</TableCell>
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
        <div className="dashboard-row dashboard-table">
          <Tile>
            <h3>Recent Claims Analysis</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading analytics data...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#da1e28' }}>
                <p>{error}</p>
              </div>
            ) : (
              <>
                <TableContainer className="compact-table">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Claim ID</TableHeader>
                        <TableHeader>Risk Group</TableHeader>
                        <TableHeader>Risk Score</TableHeader>
                        <TableHeader style={{ width: 80, textAlign: 'center' }}>Fraud Flags</TableHeader>
                        <TableHeader>Action</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {claimsData.length === 0 ? (
                        <TableRow><TableCell colSpan={5}>No claims found.</TableCell></TableRow>
                      ) : (
                        claimsData.map((claim) => (
                          <TableRow key={claim.claim_id}>
                            <TableCell>{claim.claim_id}</TableCell>
                            <TableCell>{statusToGroup[claim.status]}</TableCell>
                            <TableCell><span style={getRiskScoreColor(claim.risk_score)}>{claim.risk_score}</span></TableCell>
                            <TableCell style={{ width: 80, textAlign: 'center' }}>{claim.flags ? claim.flags.length : 0}</TableCell>
                            <TableCell>
                              <OverflowMenu
                                renderIcon={OverflowMenuVertical}
                                size="sm"
                                flipped
                              >
                                <OverflowMenuItem
                                  itemText="See Flags"
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
                              </OverflowMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination */}
                {totalItems > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <Pagination
                      backwardText="Previous page"
                      forwardText="Next page"
                      itemsPerPageText="Items per page:"
                      page={currentPage}
                      pageNumberText="Page Number"
                      pageSize={pageSize}
                      pageSizes={[5, 10, 20, 50]}
                      size="md"
                      totalItems={totalItems}
                      onChange={({ page, pageSize: newPageSize }) => {
                        setCurrentPage(page);
                        setPageSize(newPageSize);
                      }}
                    />
                  </div>
                )}
              </>
            )}
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
                  {selectedFlags.map((flag, idx) => (
                    <li key={idx}>{flag.case_type} <span style={{ fontSize: 12, color: '#888' }}>({flag.severity})</span></li>
                  ))}
                </ul>
              ) : (
                <span style={{ color: '#888' }}>No fraud flags for this claim.</span>
              )}
            </Modal>
          </Tile>
        </div>
      </div>
    </>
  );
};

export default Analytics; 