import React, { useState } from 'react';
import { BedZone } from '../types';
import { hospitalStore } from '../services/hospitalStore';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  beds: BedZone[];
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  beds,
}) => {
  const [selectedBed, setSelectedBed] = useState<string>(beds[0]?.id || 'GW-101');
  const [reason, setReason] = useState<string>('Acute Cardiac Arrest / Code Blue Protocol');
  const [authorizedUser, setAuthorizedUser] = useState<string>('Dr. Arun Kumar (Attending Physician)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    hospitalStore.handleEmergencyOverride(selectedBed, reason, authorizedUser);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header emergency-header">
          <h3>EMERGENCY OVERRIDE</h3>
          <button type="button" onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="hospital-callout callout-warning">
            <strong>SAFETY PROTOCOL:</strong> The HYGIENIX system never physically blocks healthcare staff during critical patient care. All overrides are logged for clinical auditing.
          </div>

          <div className="form-group">
            <label>Target Bed / Zone:</label>
            <select
              value={selectedBed}
              onChange={(e) => setSelectedBed(e.target.value)}
              className="form-control"
            >
              {beds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} ({b.ward} - {b.zoneId})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Emergency Clinical Reason:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="form-control"
              placeholder="e.g. Stat intubation / Cardiac resuscitation"
              required
            />
          </div>

          <div className="form-group">
            <label>Authorizing Clinician / Badge:</label>
            <input
              type="text"
              value={authorizedUser}
              onChange={(e) => setAuthorizedUser(e.target.value)}
              className="form-control"
              placeholder="e.g. Dr. Name / ICU Charge Nurse"
              required
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-emergency-confirm"
            >
              AUTHORIZE EMERGENCY ACCESS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
