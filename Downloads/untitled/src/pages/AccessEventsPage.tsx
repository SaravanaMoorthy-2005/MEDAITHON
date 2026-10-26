import React, { useState } from 'react';
import { AccessEvent } from '../types';
import { IconAccess, IconClock } from '../icons';

interface AccessEventsPageProps {
  events: AccessEvent[];
}

export const AccessEventsPage: React.FC<AccessEventsPageProps> = ({ events }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const filtered = events.filter((e) => {
    if (filterStatus !== 'All' && e.status !== filterStatus) return false;
    return true;
  });

  const renderStatusBadge = (status: AccessEvent['status']) => {
    switch (status) {
      case 'REGISTERED':
        return <span className="status-badge badge-green">REGISTERED</span>;
      case 'UNKNOWN_BADGE':
        return <span className="status-badge badge-yellow">UNKNOWN BADGE</span>;
      case 'REVOKED_BADGE':
        return <span className="status-badge badge-red">REVOKED BADGE</span>;
      case 'INVALID_DEVICE':
        return <span className="status-badge badge-red">INVALID DEVICE</span>;
      default:
        return <span className="status-badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>STAFF RFID ACCESS EVENTS LOG</h2>
          <p className="page-subtitle">
            Telemetry stream of badge taps detected by bed-zone RFID hardware stations
          </p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-item">
          <label>Filter by Access Result:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Events ({events.length})</option>
            <option value="REGISTERED">REGISTERED Only</option>
            <option value="UNKNOWN_BADGE">UNKNOWN BADGE Only</option>
            <option value="REVOKED_BADGE">REVOKED BADGE Only</option>
          </select>
        </div>
      </div>

      <div className="dashboard-panel full-width">
        <div className="table-responsive">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Time</th>
                <th>Staff Name</th>
                <th>Staff ID</th>
                <th>RFID UID</th>
                <th>Bed Zone</th>
                <th>Ward</th>
                <th>Station Device ID</th>
                <th>Access Result</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-cell">
                    No access events logged. Use "SIMULATE RFID SCAN" to trigger incoming events.
                  </td>
                </tr>
              ) : (
                filtered.map((evt) => (
                  <tr key={evt.id}>
                    <td className="mono-code">{evt.id}</td>
                    <td>
                      <IconClock size={13} className="inline-icon" />
                      {evt.timestamp}
                    </td>
                    <td className="bold-cell">{evt.staffName}</td>
                    <td className="mono-code">{evt.staffId}</td>
                    <td>
                      <span className="rfid-tag">{evt.rfidUid}</span>
                    </td>
                    <td className="bold-cell">{evt.bedId}</td>
                    <td>{evt.ward}</td>
                    <td>
                      <span className="device-code">{evt.deviceId}</span>
                    </td>
                    <td>{renderStatusBadge(evt.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
