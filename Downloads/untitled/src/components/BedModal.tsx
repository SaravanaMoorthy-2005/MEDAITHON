import React, { useState } from 'react';
import { BedZone, WardType } from '../types';

interface BedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bedData: Omit<BedZone, 'currentStaff' | 'visitStatus' | 'hygieneStatus' | 'lastAccess' | 'lastHygieneEvent'>) => void;
}

export const BedModal: React.FC<BedModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [bedId, setBedId] = useState('');
  const [ward, setWard] = useState<WardType>('General Ward');
  const [zoneId, setZoneId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [sanitizerDeviceId, setSanitizerDeviceId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBedId = bedId.trim().toUpperCase();
    onSave({
      id: finalBedId,
      ward,
      zoneId: zoneId || `ZONE-${finalBedId}`,
      deviceId: deviceId || `DEV-${finalBedId}`,
      sanitizerDeviceId: sanitizerDeviceId || `SAN-${finalBedId}`,
      status: 'Enabled',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header">
          <h3>ADD PATIENT BED ZONE</h3>
          <button type="button" onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Bed Identifier (e.g. GW-105 or ICU-05):</label>
            <input
              type="text"
              value={bedId}
              onChange={(e) => {
                setBedId(e.target.value);
                if (!zoneId) setZoneId(`ZONE-${e.target.value.toUpperCase()}`);
                if (!deviceId) setDeviceId(`DEV-${e.target.value.toUpperCase()}`);
                if (!sanitizerDeviceId) setSanitizerDeviceId(`SAN-${e.target.value.toUpperCase()}`);
              }}
              className="form-control"
              placeholder="e.g. GW-105"
              required
            />
          </div>

          <div className="form-group">
            <label>Hospital Ward:</label>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value as WardType)}
              className="form-control"
            >
              <option value="General Ward">General Ward</option>
              <option value="ICU">ICU</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fixed Zone ID:</label>
            <input
              type="text"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>RFID Station Device ID:</label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group half">
              <label>Dispenser Device ID:</label>
              <input
                type="text"
                value={sanitizerDeviceId}
                onChange={(e) => setSanitizerDeviceId(e.target.value)}
                className="form-control"
                required
              />
            </div>
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
              className="btn btn-primary"
            >
              ADD BED TO MONITORING
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
