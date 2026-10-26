import React, { useState } from 'react';
import { hospitalStore } from '../services/hospitalStore';
import { IconRefresh, IconEmergency } from '../icons';

interface DemoControlsProps {
  onOpenScanModal: () => void;
  onOpenEmergencyModal: () => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  onOpenScanModal,
  onOpenEmergencyModal,
}) => {
  const [feedback, setFeedback] = useState<{ type: 'info' | 'success' | 'warn' | 'error'; text: string } | null>({
    type: 'info',
    text: 'Demo Mode Ready: Click simulation buttons to test the 5 required hospital hygiene scenarios.',
  });

  const showToast = (type: 'info' | 'success' | 'warn' | 'error', text: string) => {
    setFeedback({ type, text });
  };

  // Scenario 1: Nurse A approaches Bed 101 -> Active Visit
  const handleScenario1_Rfid = () => {
    const res = hospitalStore.handleRfidScan('DEV-GW-01', 'RFID-1002');
    showToast('info', `Scenario 1: Nurse Priya tapped RFID at Bed GW-101. Visit Active (Hygiene Pending).`);
  };

  // Scenario 1 part 2: Simulate sanitizer -> GREEN
  const handleScenario1_Sanitizer = () => {
    const res = hospitalStore.handleSanitizerEvent('GW-101');
    if (res.status === 'HYGIENE_RECORDED') {
      showToast('success', `Scenario 1 Complete: Sanitizer activated at Bed GW-101! Status updated to GREEN (Hygiene Event Detected).`);
    } else {
      showToast('warn', `Sanitizer Event Result: ${res.status}. ${res.message}`);
    }
  };

  // Scenario 2: Nurse A moves to Bed 102 without washing, then moves to Bed 103 -> RED Alert
  const [scenario2Step, setScenario2Step] = useState<number>(0);
  const handleScenario2_Missed = () => {
    if (scenario2Step === 0) {
      hospitalStore.handleRfidScan('DEV-GW-02', 'RFID-1002');
      setScenario2Step(1);
      showToast('warn', `Scenario 2 (Step 1/2): Nurse Priya tapped Bed GW-102. (Do NOT sanitize; click button again to transition to next bed).`);
    } else {
      hospitalStore.handleRfidScan('DEV-GW-03', 'RFID-1002');
      setScenario2Step(0);
      showToast('error', `Scenario 2 Complete: Nurse Priya moved to Bed GW-103 without washing at GW-102! Triggered RED Alert: Possible Missed Hygiene.`);
    }
  };

  // Scenario 3: Two staff active at same bed -> Sanitizer -> AMBIGUOUS (YELLOW)
  const handleScenario3_Ambiguous = () => {
    hospitalStore.runScenario3_TwoStaff_Ambiguous();
    showToast('warn', `Scenario 3 Complete: Dr. Arun Kumar and Nurse Priya both active at GW-101. Sanitizer triggered -> AMBIGUOUS (YELLOW Alert).`);
  };

  // Scenario 4: Unknown RFID
  const handleScenario4_Unknown = () => {
    hospitalStore.runScenario4_UnknownBadge();
    showToast('warn', `Scenario 4 Complete: Unregistered badge RFID-9999 tapped. Triggered UNKNOWN BADGE Alert.`);
  };

  // Scenario 5: Device Offline
  const handleDeviceOffline = () => {
    const newStatus = hospitalStore.toggleDeviceOffline('DEV-GW-03');
    showToast(newStatus === 'Offline' ? 'warn' : 'success', `Device Health: Station DEV-GW-03 is now ${newStatus}.`);
  };

  const handleReset = () => {
    hospitalStore.resetDemoData();
    showToast('info', 'Demo dataset restored to initial state.');
  };

  return (
    <div className="demo-bar-container">
      <div className="demo-bar-header">
        <div className="demo-tag">HACKATHON DEMO CONTROLS</div>
        <div className="demo-desc">
          Trigger real-time RFID & dispenser hardware events into the correlation engine:
        </div>
      </div>

      <div className="demo-buttons-row">
        <button
          type="button"
          onClick={handleScenario1_Rfid}
          className="demo-btn demo-btn-primary"
          title="Nurse Priya scans RFID at Bed GW-101"
        >
          SIMULATE RFID SCAN
        </button>

        <button
          type="button"
          onClick={handleScenario1_Sanitizer}
          className="demo-btn demo-btn-success"
          title="Sanitizer dispenser activates at Bed GW-101 (Green)"
        >
          SIMULATE SANITIZER
        </button>

        <button
          type="button"
          onClick={handleScenario2_Missed}
          className="demo-btn demo-btn-danger"
          title="Simulates moving beds without hygiene (Red Alert)"
        >
          {scenario2Step === 0 ? 'SIMULATE MISSED HYGIENE' : 'TRIGGER NEXT BED (TRIP MISSED)'}
        </button>

        <button
          type="button"
          onClick={handleScenario3_Ambiguous}
          className="demo-btn demo-btn-warning"
          title="2 staff at same bed + sanitizer -> Ambiguous Yellow"
        >
          SIMULATE AMBIGUOUS EVENT
        </button>

        <button
          type="button"
          onClick={handleScenario4_Unknown}
          className="demo-btn demo-btn-secondary"
          title="Tap unregistered badge"
        >
          SIMULATE UNKNOWN RFID
        </button>

        <button
          type="button"
          onClick={handleDeviceOffline}
          className="demo-btn demo-btn-secondary"
          title="Toggle DEV-GW-03 online/offline"
        >
          SIMULATE DEVICE OFFLINE
        </button>

        <button
          type="button"
          onClick={onOpenEmergencyModal}
          className="demo-btn demo-btn-emergency"
          title="Emergency bypass access"
        >
          SIMULATE EMERGENCY
        </button>

        <button
          type="button"
          onClick={onOpenScanModal}
          className="demo-btn demo-btn-custom"
          title="Open interactive custom RFID badge scanner pad"
        >
          CUSTOM BADGE SCAN...
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="demo-btn-reset"
          title="Reset to clean demo data"
        >
          <IconRefresh size={14} />
          Reset Demo
        </button>
      </div>

      {feedback && (
        <div className={`demo-toast-banner ${feedback.type}`}>
          <span className="toast-label">EVENT ENGINE:</span>
          <span className="toast-text">{feedback.text}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setFeedback(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
