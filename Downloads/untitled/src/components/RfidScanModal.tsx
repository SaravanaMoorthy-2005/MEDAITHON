import React, { useState } from 'react';
import { Staff, BedZone } from '../types';
import { hospitalStore } from '../services/hospitalStore';

interface RfidScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  beds: BedZone[];
}

export const RfidScanModal: React.FC<RfidScanModalProps> = ({
  isOpen,
  onClose,
  staffList,
  beds,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || 'STF002');
  const [selectedBedId, setSelectedBedId] = useState<string>(beds[0]?.id || 'GW-101');
  const [customUid, setCustomUid] = useState<string>('');
  const [isCustomBadge, setIsCustomBadge] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const bed = beds.find((b) => b.id === selectedBedId);
    if (!bed) return;

    let uidToScan = customUid;
    if (!isCustomBadge) {
      const staff = staffList.find((s) => s.id === selectedStaffId);
      uidToScan = staff?.rfidUid || 'RFID-1002';
    }

    const res = hospitalStore.handleRfidScan(bed.deviceId, uidToScan);
    setResultMsg({
      success: res.success,
      text: `[${res.status}] ${res.message}`,
    });

    setTimeout(() => {
      onClose();
      setResultMsg(null);
    }, 1200);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header">
          <h3>RFID HARDWARE SCAN EMULATOR</h3>
          <button type="button" onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>

        <form onSubmit={handleScan} className="modal-body">
          <p className="form-description">
            Simulates a physical RFID badge tap at a specific bed-zone hardware reader (RC522 / ESP32).
          </p>

          <div className="form-group">
            <label>Bed Zone Reader Location:</label>
            <select
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              className="form-control"
            >
              {beds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} - {b.ward} ({b.deviceId})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Badge Input Mode:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={!isCustomBadge}
                  onChange={() => setIsCustomBadge(false)}
                />
                Registered Staff Member
              </label>
              <label>
                <input
                  type="radio"
                  checked={isCustomBadge}
                  onChange={() => setIsCustomBadge(true)}
                />
                Custom / Unregistered RFID UID
              </label>
            </div>
          </div>

          {!isCustomBadge ? (
            <div className="form-group">
              <label>Select Staff Member:</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="form-control"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role} - {s.rfidUid}) [{s.status}]
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label>Custom RFID UID (Hex / String):</label>
              <input
                type="text"
                value={customUid}
                onChange={(e) => setCustomUid(e.target.value)}
                placeholder="e.g. RFID-9999 or 4A3B2C1D"
                className="form-control"
                required
              />
            </div>
          )}

          {resultMsg && (
            <div className={`scan-result-banner ${resultMsg.success ? 'success' : 'warning'}`}>
              {resultMsg.text}
            </div>
          )}

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
              SIMULATE TAP BADGE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
