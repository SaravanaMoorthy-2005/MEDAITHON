import React, { useState, useMemo } from 'react';
import {
  BedZone,
  Visit,
  Alert,
  Staff,
  DashboardMetrics,
  WardType,
  HygieneComplianceStatus,
} from '../types';
import {
  IconCheckCircle,
  IconAlert,
  IconClock,
  IconBed,
  IconStaff,
} from '../icons';

interface DashboardPageProps {
  beds: BedZone[];
  visits: Visit[];
  alerts: Alert[];
  staffList: Staff[];
  metrics: DashboardMetrics;
  selectedWard: 'All' | WardType;
  onSelectWard: (ward: 'All' | WardType) => void;
  onReviewAlert: (alert: Alert) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  beds,
  visits,
  alerts,
  staffList,
  metrics,
  selectedWard,
  onSelectWard,
  onReviewAlert,
}) => {
  // Dashboard Filters (Section 23)
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'Today' | 'Yesterday' | 'Custom'>('Today');
  const [staffFilter, setStaffFilter] = useState<string>('All');
  const [bedFilter, setBedFilter] = useState<string>('All');

  // Filtered Active Visits
  const activeVisits = useMemo(() => {
    return visits.filter((v) => {
      if (v.status !== 'Active') return false;
      if (selectedWard !== 'All' && v.ward !== selectedWard) return false;
      if (staffFilter !== 'All' && v.staffName !== staffFilter) return false;
      if (bedFilter !== 'All' && v.bedId !== bedFilter) return false;
      return true;
    });
  }, [visits, selectedWard, staffFilter, bedFilter]);

  // Filtered Bed Table
  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      if (selectedWard !== 'All' && b.ward !== selectedWard) return false;
      if (bedFilter !== 'All' && b.id !== bedFilter) return false;
      if (staffFilter !== 'All' && b.currentStaff !== staffFilter) return false;
      if (statusFilter === 'Active' && b.visitStatus !== 'Active') return false;
      if (statusFilter === 'Completed' && b.visitStatus === 'Active') return false;
      if (statusFilter === 'Missing' && b.hygieneStatus !== 'RED') return false;
      if (statusFilter === 'Ambiguous' && b.hygieneStatus !== 'YELLOW') return false;
      return true;
    });
  }, [beds, selectedWard, bedFilter, staffFilter, statusFilter]);

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.slice(0, 8);
  }, [alerts]);

  const renderHygieneBadge = (status: HygieneComplianceStatus) => {
    switch (status) {
      case 'GREEN':
        return <span className="status-badge badge-green">Hygiene Detected</span>;
      case 'YELLOW':
        return <span className="status-badge badge-yellow">Event Ambiguous / Review Required</span>;
      case 'RED':
        return <span className="status-badge badge-red">Possible Missed Hygiene</span>;
      case 'PENDING':
        return <span className="status-badge badge-pending">Hygiene Pending</span>;
      case 'GRAY':
      default:
        return <span className="status-badge badge-gray">No Active Visit</span>;
    }
  };

  return (
    <div className="page-container dashboard-page">
      {/* FILTER BAR (Section 23) */}
      <div className="filters-bar">
        <div className="filter-item">
          <label>Ward:</label>
          <select
            value={selectedWard}
            onChange={(e) => onSelectWard(e.target.value as any)}
            className="filter-select"
          >
            <option value="All">All Wards</option>
            <option value="General Ward">General Ward</option>
            <option value="ICU">ICU</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Visit Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Visits Only</option>
            <option value="Completed">Inactive Only</option>
            <option value="Missing">Possible Missed Only</option>
            <option value="Ambiguous">Ambiguous Only</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Date:</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="Today">Today (Active Logs)</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Custom">Custom Interval</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Staff:</label>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Bed Zone:</label>
          <select
            value={bedFilter}
            onChange={(e) => setBedFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Beds</option>
            {beds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} ({b.ward})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION B: TODAY'S EVENTS SUMMARY CARDS */}
      <section className="dashboard-summary-cards">
        <div className="metric-card">
          <div className="metric-title">TOTAL BED-ZONE VISITS</div>
          <div className="metric-value">{metrics.totalVisits}</div>
          <div className="metric-foot">Logged via RFID Badges</div>
        </div>

        <div className="metric-card metric-green">
          <div className="metric-title">HYGIENE EVENTS DETECTED</div>
          <div className="metric-value">{metrics.hygieneEvents}</div>
          <div className="metric-foot">Correlated Dispenser Events</div>
        </div>

        <div className="metric-card metric-red">
          <div className="metric-title">POSSIBLE MISSED EVENTS</div>
          <div className="metric-value">{metrics.possibleMissedEvents}</div>
          <div className="metric-foot">Transition Without Detected Event</div>
        </div>

        <div className="metric-card metric-yellow">
          <div className="metric-title">AMBIGUOUS EVENTS</div>
          <div className="metric-value">{metrics.ambiguousEvents}</div>
          <div className="metric-foot">Multi-worker Zone Overlaps</div>
        </div>

        <div className="metric-card metric-fault">
          <div className="metric-title">DEVICE FAULTS / OFFLINE</div>
          <div className="metric-value">{metrics.deviceFaults}</div>
          <div className="metric-foot">Station Communication Alert</div>
        </div>
      </section>

      {/* SECTION A: ACTIVE VISITS & SECTION D: ALERTS */}
      <div className="dashboard-two-col">
        {/* SECTION A: ACTIVE VISITS */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>ACTIVE VISITS ({activeVisits.length})</h3>
            <span className="panel-sub">Healthcare workers currently inside monitored bed zones</span>
          </div>

          <div className="table-responsive">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Bed</th>
                  <th>Ward</th>
                  <th>Visit Start</th>
                  <th>Hygiene Status</th>
                </tr>
              </thead>
              <tbody>
                {activeVisits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      No active visits recorded at this moment. Tap "SIMULATE RFID SCAN" to begin a visit.
                    </td>
                  </tr>
                ) : (
                  activeVisits.map((v) => (
                    <tr key={v.id}>
                      <td className="bold-cell">
                        <IconStaff size={14} className="inline-icon" />
                        {v.staffName} <span className="role-tag">({v.role})</span>
                      </td>
                      <td>
                        <span className="bed-tag">{v.bedId}</span>
                      </td>
                      <td>{v.ward}</td>
                      <td>
                        <IconClock size={13} className="inline-icon" />
                        {v.visitStart}
                      </td>
                      <td>{renderHygieneBadge(v.hygieneStatus)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION D: ALERTS */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>RECENT OPERATIONAL ALERTS</h3>
            <span className="panel-sub">Exceptions requiring clinical or operational review</span>
          </div>

          <div className="alerts-list">
            {filteredAlerts.length === 0 ? (
              <div className="empty-alerts">No active warnings or critical exceptions.</div>
            ) : (
              filteredAlerts.map((a) => (
                <div key={a.id} className={`alert-card alert-severity-${a.severity.toLowerCase()}`}>
                  <div className="alert-top">
                    <span className={`alert-badge severity-${a.severity.toLowerCase()}`}>
                      {a.severity}
                    </span>
                    <span className="alert-title">{a.title}</span>
                    <span className="alert-time">{a.timestamp}</span>
                  </div>
                  <div className="alert-body">
                    <div className="alert-msg">{a.message}</div>
                    <div className="alert-meta">
                      <span><strong>Staff:</strong> {a.staffName}</span>
                      <span><strong>Bed:</strong> {a.bedId}</span>
                    </div>
                  </div>
                  <div className="alert-action-row">
                    <span className="action-hint">Action: {a.actionRequired}</span>
                    <button
                      type="button"
                      onClick={() => onReviewAlert(a)}
                      className="btn-review"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION C: BED STATUS OPERATIONAL TABLE */}
      <div className="dashboard-panel full-width">
        <div className="panel-header">
          <h3>BED ZONE OPERATIONAL STATUS</h3>
          <span className="panel-sub">Real-time status of all patient beds and assigned IoT scanners</span>
        </div>

        <div className="table-responsive">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Bed</th>
                <th>Ward</th>
                <th>Assigned Hardware</th>
                <th>Current Staff</th>
                <th>Visit Status</th>
                <th>Hygiene Status</th>
                <th>Last Event</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeds.map((b) => (
                <tr key={b.id}>
                  <td className="bold-cell">
                    <IconBed size={15} className="inline-icon" />
                    {b.id}
                  </td>
                  <td>{b.ward}</td>
                  <td>
                    <span className="mono-code">{b.deviceId}</span> / <span className="mono-code">{b.sanitizerDeviceId}</span>
                  </td>
                  <td>
                    {b.currentStaff ? (
                      <span className="staff-active-chip">{b.currentStaff}</span>
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </td>
                  <td>
                    <span className={`visit-status-pill ${b.visitStatus === 'Active' ? 'active' : 'inactive'}`}>
                      {b.visitStatus}
                    </span>
                  </td>
                  <td>{renderHygieneBadge(b.hygieneStatus)}</td>
                  <td className="text-muted">{b.lastHygieneEvent || b.lastAccess || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 24: SIMPLE ANALYTICS VISUAL BREAKDOWN */}
      <div className="dashboard-panel full-width">
        <div className="panel-header">
          <h3>RECORDED EVENTS VS POSSIBLE MISSED EVENTS (TODAY'S SHIFT)</h3>
          <span className="panel-sub">Calculated directly from registered hardware events</span>
        </div>

        <div className="analytics-bar-wrapper">
          <div className="analytics-labels">
            <span>Detected Hygiene Events: <strong>{metrics.hygieneEvents}</strong></span>
            <span>Possible Missed Hygiene: <strong>{metrics.possibleMissedEvents}</strong></span>
            <span>Ambiguous Overlaps: <strong>{metrics.ambiguousEvents}</strong></span>
          </div>

          <div className="analytics-bar">
            {metrics.totalVisits > 0 ? (
              <>
                <div
                  className="bar-segment bar-green"
                  style={{
                    width: `${Math.max(
                      5,
                      Math.round((metrics.hygieneEvents / (metrics.totalVisits || 1)) * 100)
                    )}%`,
                  }}
                  title={`Hygiene Events Detected: ${metrics.hygieneEvents}`}
                />
                <div
                  className="bar-segment bar-red"
                  style={{
                    width: `${Math.max(
                      2,
                      Math.round((metrics.possibleMissedEvents / (metrics.totalVisits || 1)) * 100)
                    )}%`,
                  }}
                  title={`Possible Missed: ${metrics.possibleMissedEvents}`}
                />
                <div
                  className="bar-segment bar-yellow"
                  style={{
                    width: `${Math.max(
                      2,
                      Math.round((metrics.ambiguousEvents / (metrics.totalVisits || 1)) * 100)
                    )}%`,
                  }}
                  title={`Ambiguous: ${metrics.ambiguousEvents}`}
                />
              </>
            ) : (
              <div className="bar-segment bar-gray" style={{ width: '100%' }} />
            )}
          </div>

          <div className="analytics-note">
            * Note: System displays recorded hardware dispenser events and unverified transitions. The system never claims that RFID or dispenser activations scientifically prove hands were washed.
          </div>
        </div>
      </div>
    </div>
  );
};
