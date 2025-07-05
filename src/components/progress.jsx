// use client
import React, { useState, useEffect } from "react";
import {
  Tile,
  Button,
  TextInput,
  Select,
  SelectItem,
  Tag,
  ProgressBar,
  Grid,
  Column,
} from "@carbon/react";
import { CheckmarkFilled, Time, Document, View, WarningAltFilled, Money, ThumbsUp, ChevronRight } from "@carbon/icons-react";
import "./progress.css";
import { useNavigate } from "react-router-dom";
import { ProgressIndicator, ProgressStep } from '@carbon/react';

const stages = [
  {
    id: 1,
    name: "Initiated",
    icon: <Document size={20} />, // Carbon icon
    color: "#0f62fe",
    description: "Claim has been submitted and logged into the system",
  },
  {
    id: 2,
    name: "Documents Received",
    icon: <Document size={20} />, // Carbon icon
    color: "#0043ce",
    description: "All required documents have been received and verified",
  },
  {
    id: 3,
    name: "OCR & Data Extraction",
    icon: <View size={20} />, // Carbon icon
    color: "#8a3ffc",
    description: "Optical character recognition and data extraction in progress",
  },
  {
    id: 4,
    name: "Eligibility Check",
    icon: <WarningAltFilled size={20} />, // Carbon icon
    color: "#6929c4",
    description: "Verifying patient eligibility and coverage details",
  },
  {
    id: 5,
    name: "Fraud Analysis",
    icon: <WarningAltFilled size={20} />, // Carbon icon
    color: "#ff832b",
    description: "Analyzing claim for potential fraudulent activity",
  },
  {
    id: 6,
    name: "Medical Necessity & Cost Validation",
    icon: <Money size={20} />, // Carbon icon
    color: "#f1c21b",
    description: "Validating medical necessity and cost appropriateness",
  },
  {
    id: 7,
    name: "Claim Under Review",
    icon: <Time size={20} />, // Carbon icon
    color: "#ffb000",
    description: "Comprehensive review by medical professionals",
  },
  {
    id: 8,
    name: "Approved / Rejected",
    icon: <ThumbsUp size={20} />, // Carbon icon
    color: "#24a148",
    description: "Final decision has been made on the claim",
  },
  {
    id: 9,
    name: "Payment Processing",
    icon: <Money size={20} />, // Carbon icon
    color: "#08bdba",
    description: "Processing payment to healthcare provider",
  },
  {
    id: 10,
    name: "Completed",
    icon: <CheckmarkFilled size={20} />, // Carbon icon
    color: "#198038",
    description: "Claim processing has been completed successfully",
  },
];

function getStageStatus(stageId, currentStage) {
  if (stageId < currentStage) return "completed";
  if (stageId === currentStage) return "current";
  return "pending";
}

export default function Progress() {
  const [claims, setClaims] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/claim-details")
      .then(res => res.json())
      .then(data => {
        setClaims(data.claims);
        setSelectedPatient(data.claims[0] || null);
      });
  }, []);

  const filteredPatients = claims.filter(
    (patient) =>
      patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery("");
    setShowDropdown(false);
  };

  if (!selectedPatient) return null;

  return (
    <div className="progress-main">
      {/* Header Section */}
      <div className="progress-header">
        <h2 className="progress-title">Claim Processing Tracker</h2>
        <p className="progress-desc">
          Monitor and track the progress of insurance claims through our comprehensive workflow system.
        </p>
      </div>

      {/* Search and Patient Details Section Combined */}
      <Tile className="progress-tile progress-tile-noradius">
        <div className="progress-search-row" style={{ position: 'relative' }}>
          <TextInput
            id="search"
            labelText="Search by patient name or claim ID"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="progress-search-input"
            autoComplete="off"
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && searchQuery && filteredPatients.length > 0 && (
            <div className="progress-search-dropdown">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="progress-search-dropdown-item"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <span>{patient.patientName}</span>
                  <span style={{ color: '#888', marginLeft: 8, fontSize: 13 }}>{patient.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Tile>

      {/* Main Card Layout */}
      <Tile className="progress-main-card">
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {/* Left: Custom Vertical Stepper */}
          <div style={{ flex: 1, minWidth: 220, maxWidth: 320 }}>
            <div className="progress-section-card">
              <div className="progress-stepper vertical">
                {stages.map((stage, index) => {
                  const status = getStageStatus(stage.id, selectedPatient.currentStage);
                  return (
                    <div key={stage.id} className="progress-stepper-item-vertical">
                      <div className="progress-stepper-circle-label-row">
                        <div className={`progress-stepper-circle ${status}`}>
                          {status === "completed" ? (
                            <CheckmarkFilled size={16} />
                          ) : (
                            <span className="progress-stepper-number">{stage.id}</span>
                          )}
                        </div>
                        <div className={`progress-stepper-label ${status}`}>{stage.name}</div>
                      </div>
                      {index < stages.length - 1 && (
                        <div className={`progress-stepper-line-vertical ${getStageStatus(stage.id + 1, selectedPatient.currentStage)}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Right: Two stacked cards */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top Card: Progress Bar */}
            <div className="progress-section-card">
              <div className="progress-tracker-header">
                <h3 className="progress-tracker-title">Claim Processing Progress</h3>
                <p className="progress-tracker-desc">Track the current stage and progress of the selected claim</p>
              </div>
              <div className="progress-bar-row">
                <span className="progress-bar-label">Overall Progress</span>
                <span className="progress-bar-label">
                  {Math.round((selectedPatient.currentStage / stages.length) * 100)}%
                </span>
              </div>
              <ProgressBar
                value={(selectedPatient.currentStage / stages.length) * 100}
                size="big"
                className="progress-bar"
              />
            </div>
            {/* Bottom Card: Patient Details and Current Stage */}
            <div className="progress-section-card">
              <div className="progress-patient-info-row">
                <div>
                  <div className="progress-patient-label">Patient Name</div>
                  <div className="progress-patient-value">{selectedPatient.patientName}</div>
                </div>
                <div>
                  <div className="progress-patient-label">Claim ID</div>
                  <div className="progress-patient-value">{selectedPatient.id}</div>
                </div>
                <div>
                  <div className="progress-patient-label">Current Status</div>
                  <div className="progress-patient-value">{selectedPatient.status}</div>
                </div>
                <div>
                  <div className="progress-patient-label">Progress</div>
                  <div className="progress-patient-value">
                    Stage {selectedPatient.currentStage} of {stages.length}
                  </div>
                </div>
              </div>
              <div className="progress-current-stage-box">
                <h4 className="progress-current-stage-title">
                  Current Stage: {stages[selectedPatient.currentStage - 1]?.name}
                </h4>
                <p className="progress-current-stage-desc">{stages[selectedPatient.currentStage - 1]?.description}</p>
                <div className="progress-current-stage-row">
                  <Tag type="blue">
                    Stage {selectedPatient.currentStage} of {stages.length}
                  </Tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tile>
    </div>
  );
} 