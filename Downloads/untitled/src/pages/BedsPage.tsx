import React, { useState } from 'react';
import { BedZone, WardType } from '../types';
import { BedModal } from '../components/BedModal';
import { hospitalStore } from '../services/hospitalStore';
import { IconBed } from '../icons';

interface BedsPageProps {
  beds: BedZone[];
}

export const BedsPage: React.FC<BedsPageProps> = ({ beds }) => {
  const [wardFilter, setWardFilter] = useState<'All' | WardType>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredBeds = beds.filter((b) => {
    if (wardFilter !== 'All' && b.ward !== wardFilter) return false;
    return true;
  });

  const handleToggleBed = (id: string) => {
    hospitalStore.toggleBedEnabled(id);
  };

  const handleSaveBed = (bedData: any) => {
    hospitalStore.addBed(bedData);
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>BEDS & PATIENT ZONES</h2>
          <p className="page-subtitle">
            Fixed physical bed-zone mapping to IoT RFID scanners and sanitizer dispensers
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          + ADD NEW BED ZONE
        </button>
      </div>

      <div className="hospital-callout callout-info">
        <strong>FIXED HARDWARE MAPPING:</strong> In clinical environments, bed identification relies on deterministic, fixed reader installations (DEV-*), not probabilistic RSSI or GPS ranging.
      </div>

      <div className="filters-bar">
        <div className="filter-item">
          <label>Filter by Ward:</label>
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="All">All Hospital Wards</option>
            <option value="General Ward">General Ward</option>
            <option value="ICU">ICU</option>
          </select>
        </div>
      </div>

      <div className="dashboard-panel full-width">
        <div className="table-responsive">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Bed ID</th>
                <th>Ward</th>
                <th>Zone Identifier</th>
                <th>RFID Scanner Station</th>
                <th>Sanitizer Dispenser</th>
                <th>Monitoring Status</th>
                <th>Current Staff</th>
                <th>Last Access</th>
                <th>Last Hygiene Event</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeds.map((bed) => (
                <tr key={bed.id}>
                  <td className="bold-cell">
                    <IconBed size={15} className="inline-icon" />
                    {bed.id}
                  </td>
                  <td>{bed.ward}</td>
                  <td>
                    <span className="mono-code">{bed.zoneId}</span>
                  </td>
                  <td>
                    <span className="device-code">{bed.deviceId}</span>
                  </td>
                  <td>
                    <span className="device-code">{bed.sanitizerDeviceId}</span>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        bed.status === 'Enabled' ? 'pill-active' : 'pill-inactive'
                      }`}
                    >
                      {bed.status}
                    </span>
                  </td>
                  <td>
                    {bed.currentStaff ? (
                      <span className="staff-active-chip">{bed.currentStaff}</span>
                    ) : (
                      <span className="text-muted">Empty</span>
                    )}
                  </td>
                  <td className="text-muted">{bed.lastAccess || '--'}</td>
                  <td className="text-muted">{bed.lastHygieneEvent || '--'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleBed(bed.id)}
                      className={`btn-table-action ${
                        bed.status === 'Enabled' ? 'btn-warn' : 'btn-activate'
                      }`}
                    >
                      {bed.status === 'Enabled' ? 'Disable Bed' : 'Enable Bed'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBed}
      />
    </div>
  );
};
