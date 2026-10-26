import React, { useState } from 'react';
import { Device } from '../types';
import { hospitalStore } from '../services/hospitalStore';
import { IconDevice, IconRefresh, IconWifi } from '../icons';

interface DeviceHealthPageProps {
  devices: Device[];
}

export const DeviceHealthPage: React.FC<DeviceHealthPageProps> = ({ devices }) => {
  const [filterType, setFilterType] = useState('All');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filtered = devices.filter((d) => {
    if (filterType !== 'All' && d.type !== filterType) return false;
    return true;
  });

  const handlePingHeartbeat = (id: string) => {
    const dev = devices.find((d) => d.id === id);
    if (dev) {
      dev.lastHeartbeat = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      dev.connection = 'Online';
      dev.status = 'Healthy';
      setStatusMessage(`Heartbeat ping acknowledged from hardware device ${id}.`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleToggleOffline = (id: string) => {
    const res = hospitalStore.toggleDeviceOffline(id);
    setStatusMessage(`Hardware station ${id} connection state toggled to ${res}.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>DEVICE HEALTH & HARDWARE TELEMETRY</h2>
          <p className="page-subtitle">
            Diagnostics for bed-zone RFID readers, sanitizer dispensers, and hospital IoT gateways
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="demo-toast-banner info">
          <span className="toast-label">HARDWARE DIAGNOSTIC:</span>
          <span className="toast-text">{statusMessage}</span>
        </div>
      )}

      <div className="filters-bar">
        <div className="filter-item">
          <label>Filter Device Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Hardware ({devices.length})</option>
            <option value="RFID Reader">RFID Readers</option>
            <option value="Sanitizer Dispenser">Sanitizer Dispensers</option>
          </select>
        </div>
      </div>

      <div className="dashboard-panel full-width">
        <div className="table-responsive">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Device Type</th>
                <th>Ward Location</th>
                <th>Assigned Bed</th>
                <th>Last Heartbeat</th>
                <th>Connection State</th>
                <th>Firmware</th>
                <th>Health Status</th>
                <th>Hardware Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dev) => (
                <tr key={dev.id}>
                  <td className="bold-cell">
                    <IconDevice size={14} className="inline-icon" />
                    {dev.id}
                  </td>
                  <td>{dev.type}</td>
                  <td>{dev.ward}</td>
                  <td>
                    <span className="bed-tag">{dev.bedId}</span>
                  </td>
                  <td className="mono-code">{dev.lastHeartbeat}</td>
                  <td>
                    <span
                      className={`connection-pill pill-${dev.connection.toLowerCase()}`}
                    >
                      <span className="dot"></span>
                      {dev.connection.toUpperCase()}
                    </span>
                  </td>
                  <td className="mono-code">{dev.firmware}</td>
                  <td>
                    <span
                      className={`health-badge badge-${
                        dev.status === 'Healthy' ? 'green' : 'red'
                      }`}
                    >
                      {dev.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        onClick={() => handlePingHeartbeat(dev.id)}
                        className="btn-table-action"
                        title="Simulate hardware heartbeat ping"
                      >
                        Ping Heartbeat
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleOffline(dev.id)}
                        className={`btn-table-action ${
                          dev.connection === 'Online' ? 'btn-warn' : 'btn-activate'
                        }`}
                      >
                        {dev.connection === 'Online' ? 'Simulate Offline' : 'Restore Online'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
