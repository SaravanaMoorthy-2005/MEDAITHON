import React, { useState } from 'react';
import { Alert } from '../types';
import { IconAlert, IconClock } from '../icons';

interface AlertsPageProps {
  alerts: Alert[];
  onReviewAlert: (alert: Alert) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ alerts, onReviewAlert }) => {
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>SYSTEM ALERTS & CLINICAL REVIEWS</h2>
          <p className="page-subtitle">
            Critical exceptions, possible missed hygiene alerts, and hardware diagnostics
          </p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-item">
          <label>Filter Severity:</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Severities ({alerts.length})</option>
            <option value="CRITICAL">CRITICAL Only</option>
            <option value="WARNING">WARNING Only</option>
            <option value="INFO">INFO Only</option>
          </select>
        </div>
      </div>

      <div className="dashboard-panel full-width">
        <div className="table-responsive">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Time</th>
                <th>Category</th>
                <th>Alert Title</th>
                <th>Staff Involved</th>
                <th>Bed Zone</th>
                <th>Description</th>
                <th>Action Required</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-cell">
                    No alerts found for the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((alert) => (
                  <tr key={alert.id} className={`alert-row-${alert.severity.toLowerCase()}`}>
                    <td>
                      <span className={`alert-badge severity-${alert.severity.toLowerCase()}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="mono-code">
                      <IconClock size={13} className="inline-icon" />
                      {alert.timestamp}
                    </td>
                    <td>{alert.category}</td>
                    <td className="bold-cell">{alert.title}</td>
                    <td>{alert.staffName}</td>
                    <td>
                      <span className="bed-tag">{alert.bedId}</span>
                    </td>
                    <td>{alert.message}</td>
                    <td>
                      <span className="action-hint">{alert.actionRequired}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedAlert(alert)}
                        className="btn-table-action"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Alert Modal */}
      {selectedAlert && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>ALERT AUDIT RECORD: {selectedAlert.id}</h3>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className={`hospital-callout callout-${selectedAlert.severity === 'CRITICAL' ? 'danger' : 'warning'}`}>
                <strong>{selectedAlert.severity} ALERT:</strong> {selectedAlert.title}
              </div>

              <div className="audit-detail-grid">
                <div><strong>Timestamp:</strong> {selectedAlert.timestamp}</div>
                <div><strong>Category:</strong> {selectedAlert.category}</div>
                <div><strong>Healthcare Worker:</strong> {selectedAlert.staffName}</div>
                <div><strong>Bed Zone:</strong> {selectedAlert.bedId}</div>
              </div>

              <div className="audit-message-box">
                <label>Event Description:</label>
                <p>{selectedAlert.message}</p>
              </div>

              <div className="audit-action-box">
                <label>Recommended Clinical Action:</label>
                <p>{selectedAlert.actionRequired}</p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReviewAlert(selectedAlert);
                    setSelectedAlert(null);
                  }}
                  className="btn btn-primary"
                >
                  Acknowledge & Mark Reviewed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
