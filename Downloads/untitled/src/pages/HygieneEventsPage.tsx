import React, { useState } from 'react';
import { HygieneEvent } from '../types';
import { IconHygiene, IconClock } from '../icons';

interface HygieneEventsPageProps {
  events: HygieneEvent[];
}

export const HygieneEventsPage: React.FC<HygieneEventsPageProps> = ({ events }) => {
  const [filterCorrelation, setFilterCorrelation] = useState<string>('All');

  const filtered = events.filter((e) => {
    if (filterCorrelation !== 'All' && e.correlationStatus !== filterCorrelation) return false;
    return true;
  });

  const renderCorrelationBadge = (status: HygieneEvent['correlationStatus']) => {
    switch (status) {
      case 'HYGIENE_RECORDED':
        return <span className="status-badge badge-green">HYGIENE_RECORDED</span>;
      case 'EVENT_AMBIGUOUS':
        return <span className="status-badge badge-yellow">EVENT_AMBIGUOUS</span>;
      case 'UNASSOCIATED_EVENT':
        return <span className="status-badge badge-gray">UNASSOCIATED_EVENT</span>;
      default:
        return <span className="status-badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>SANITIZER & DISPENSER EVENTS LOG</h2>
          <p className="page-subtitle">
            Dispenser sensor activations and visit correlation engine records
          </p>
        </div>
      </div>

      <div className="hospital-callout callout-info">
        <strong>SAFETY AUDIT RULE:</strong> "Hygiene event detected" indicates sanitizer dispenser activation correlated with an active bed visit. It does not scientifically prove clinical hand contact or compliance.
      </div>

      <div className="filters-bar">
        <div className="filter-item">
          <label>Filter Correlation Status:</label>
          <select
            value={filterCorrelation}
            onChange={(e) => setFilterCorrelation(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Events ({events.length})</option>
            <option value="HYGIENE_RECORDED">HYGIENE_RECORDED</option>
            <option value="EVENT_AMBIGUOUS">EVENT_AMBIGUOUS</option>
            <option value="UNASSOCIATED_EVENT">UNASSOCIATED_EVENT</option>
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
                <th>Dispenser Hardware</th>
                <th>Bed Zone</th>
                <th>Ward</th>
                <th>Sensor Event</th>
                <th>Correlation Status</th>
                <th>Associated Staff</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    No sanitizer events logged. Tap "SIMULATE SANITIZER" to trigger events.
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
                    <td>
                      <span className="device-code">{evt.deviceId}</span>
                    </td>
                    <td className="bold-cell">{evt.bedId}</td>
                    <td>{evt.ward}</td>
                    <td>
                      <span className="event-type-badge">
                        <IconHygiene size={13} className="inline-icon" />
                        {evt.eventType}
                      </span>
                    </td>
                    <td>{renderCorrelationBadge(evt.correlationStatus)}</td>
                    <td className="bold-cell">
                      {evt.associatedStaff || <span className="text-muted">Unassociated</span>}
                    </td>
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
