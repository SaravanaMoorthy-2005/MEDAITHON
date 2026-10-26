// HYGIENIX Event Correlation & Processing Engine

import {
  initialStaff,
  initialBeds,
  initialDevices,
  initialVisits,
  initialAlerts,
} from '../data/initialData.js';

export class CorrelationEngine {
  constructor() {
    this.staffList = [...initialStaff];
    this.bedList = [...initialBeds];
    this.deviceList = [...initialDevices];
    this.visits = [...initialVisits];
    this.alerts = [...initialAlerts];
    this.accessEvents = [
      {
        id: 'ACC-001',
        staffId: 'STF002',
        staffName: 'Nurse Priya',
        rfidUid: 'RFID-1002',
        bedId: 'GW-101',
        ward: 'General Ward',
        deviceId: 'DEV-GW-01',
        timestamp: '10:15:00 AM',
        status: 'REGISTERED',
      },
    ];
    this.hygieneEvents = [
      {
        id: 'HYG-001',
        deviceId: 'SAN-GW-01',
        bedId: 'GW-101',
        ward: 'General Ward',
        eventType: 'DISPENSER_ACTIVATED',
        timestamp: '10:16:00 AM',
        correlationStatus: 'HYGIENE_RECORDED',
        associatedStaff: 'Nurse Priya',
      },
    ];
    this.overrides = [];
    this.duplicateCooldownSeconds = 15;
    this.lastScanByBadge = new Map(); // badgeUid -> { timestamp: ms, bedId: string }
  }

  formatTime(date = new Date()) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  // MODULE 1 & 10: RFID Scan
  processRfidScan({ deviceId, rfidUid, timestamp }) {
    const nowTimeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : this.formatTime();
    const nowMs = Date.now();

    // 1. Validate device
    const device = this.deviceList.find((d) => d.id === deviceId);
    if (!device) {
      return {
        success: false,
        status: 'INVALID_DEVICE',
        message: 'Unrecognized scanner hardware device ID.',
      };
    }

    // Identify bed / zone
    const bed = this.bedList.find((b) => b.id === device.bedId);
    if (!bed) {
      return {
        success: false,
        status: 'INVALID_DEVICE',
        message: 'No bed assigned to this hardware scanner.',
      };
    }

    // 2. Identify Staff by RFID
    const staff = this.staffList.find((s) => s.rfidUid === rfidUid);
    if (!staff) {
      // Record unknown badge event & alert
      const accessId = 'ACC-' + Math.floor(1000 + Math.random() * 9000);
      this.accessEvents.unshift({
        id: accessId,
        staffId: 'UNKNOWN',
        staffName: 'Unknown Badge Holder',
        rfidUid,
        bedId: bed.id,
        ward: bed.ward,
        deviceId,
        timestamp: nowTimeStr,
        status: 'UNKNOWN_BADGE',
      });

      const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
      this.alerts.unshift({
        id: alertId,
        type: 'WARNING',
        severity: 'WARNING',
        category: 'SECURITY',
        title: 'Unknown RFID Badge Detected',
        staffName: `Unregistered RFID (${rfidUid})`,
        bedId: bed.id,
        timestamp: nowTimeStr,
        message: `Badge ${rfidUid} tapped at Bed ${bed.id} (${bed.ward}). No staff profile matched.`,
        actionRequired: 'Security / Nurse Station Review',
      });

      return {
        success: false,
        status: 'UNKNOWN_BADGE',
        rfidUid,
        bedId: bed.id,
        ward: bed.ward,
        timestamp: nowTimeStr,
      };
    }

    // 3. Check staff status
    if (staff.status !== 'Active') {
      const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
      this.alerts.unshift({
        id: alertId,
        type: 'CRITICAL',
        severity: 'CRITICAL',
        category: 'SECURITY',
        title: 'Revoked/Inactive Badge Access Attempt',
        staffName: staff.name,
        bedId: bed.id,
        timestamp: nowTimeStr,
        message: `Revoked badge ${rfidUid} belonging to ${staff.name} attempted zone access.`,
        actionRequired: 'Investigate access credential immediately',
      });

      return {
        success: false,
        status: 'REVOKED_BADGE',
        staffId: staff.id,
        staffName: staff.name,
        bedId: bed.id,
        ward: bed.ward,
      };
    }

    // 4. Duplicate scan cooldown check
    const lastScan = this.lastScanByBadge.get(rfidUid);
    if (
      lastScan &&
      lastScan.bedId === bed.id &&
      nowMs - lastScan.timestamp < this.duplicateCooldownSeconds * 1000
    ) {
      return {
        success: true,
        status: 'DUPLICATE_SCAN',
        staffId: staff.id,
        staffName: staff.name,
        bedId: bed.id,
        message: `Scan within ${this.duplicateCooldownSeconds}s cooldown ignored.`,
      };
    }
    this.lastScanByBadge.set(rfidUid, { timestamp: nowMs, bedId: bed.id });

    // 5. MISSED HYGIENE DETECTION (Cross-bed transition check)
    // Check if this staff member has an ACTIVE visit at a DIFFERENT bed without hygiene recorded
    const previousUnwashedVisit = this.visits.find(
      (v) =>
        v.staffId === staff.id &&
        v.bedId !== bed.id &&
        v.status === 'Active' &&
        v.hygieneStatus === 'PENDING'
    );

    if (previousUnwashedVisit) {
      // Mark previous visit as missed
      previousUnwashedVisit.status = 'Completed';
      previousUnwashedVisit.hygieneStatus = 'RED';

      // Update previous bed status
      const prevBed = this.bedList.find((b) => b.id === previousUnwashedVisit.bedId);
      if (prevBed && prevBed.currentStaff === staff.name) {
        prevBed.hygieneStatus = 'RED';
        prevBed.visitStatus = 'Inactive';
        prevBed.currentStaff = null;
      }

      // Generate CRITICAL alert: Possible Missed Hygiene
      const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
      this.alerts.unshift({
        id: alertId,
        type: 'CRITICAL',
        severity: 'CRITICAL',
        category: 'POSSIBLE_MISSED_HYGIENE',
        title: 'Possible Missed Hygiene',
        staffName: staff.name,
        bedId: previousUnwashedVisit.bedId,
        timestamp: nowTimeStr,
        message: `Healthcare worker transitioned from Bed ${previousUnwashedVisit.bedId} to Bed ${bed.id} without hygiene event detected.`,
        actionRequired: 'Review Required',
        metadata: {
          previousBed: previousUnwashedVisit.bedId,
          nextBed: bed.id,
          staffId: staff.id,
        },
      });
    }

    // 6. Create access event
    const accessId = 'ACC-' + Math.floor(1000 + Math.random() * 9000);
    this.accessEvents.unshift({
      id: accessId,
      staffId: staff.id,
      staffName: staff.name,
      rfidUid,
      bedId: bed.id,
      ward: bed.ward,
      deviceId,
      timestamp: nowTimeStr,
      status: 'REGISTERED',
    });

    // 7. Create/Update Visit
    const visitId = 'VST-' + Math.floor(1000 + Math.random() * 9000);
    const newVisit = {
      id: visitId,
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role,
      bedId: bed.id,
      ward: bed.ward,
      visitStart: nowTimeStr,
      status: 'Active',
      hygieneStatus: 'PENDING',
      hygieneEventTime: null,
    };
    this.visits.unshift(newVisit);

    // 8. Update Bed state
    bed.currentStaff = staff.name;
    bed.visitStatus = 'Active';
    bed.hygieneStatus = 'PENDING';
    bed.lastAccess = nowTimeStr;

    // Update Device heartbeat
    device.lastHeartbeat = nowTimeStr;
    device.connection = 'Online';
    device.status = 'Healthy';

    return {
      success: true,
      status: 'REGISTERED',
      staffId: staff.id,
      staffName: staff.name,
      bedId: bed.id,
      ward: bed.ward,
      visitId: newVisit.id,
      message: 'Bed-zone access recorded. Hygiene pending.',
    };
  }

  // MODULE 2 & 3: Sanitizer / Dispenser Event & Correlation
  processHygieneEvent({ deviceId, bedId, eventType = 'DISPENSER_ACTIVATED', timestamp }) {
    const nowTimeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : this.formatTime();

    // Find target bed
    let targetBed = null;
    if (bedId) {
      targetBed = this.bedList.find((b) => b.id === bedId);
    } else if (deviceId) {
      const dev = this.deviceList.find((d) => d.id === deviceId);
      if (dev && dev.bedId) {
        targetBed = this.bedList.find((b) => b.id === dev.bedId);
      }
    }

    if (!targetBed) {
      return {
        success: false,
        status: 'INVALID_DEVICE',
        message: 'Could not associate dispenser with valid bed zone.',
      };
    }

    // Find all active visits for this bed
    const activeVisits = this.visits.filter(
      (v) => v.bedId === targetBed.id && v.status === 'Active'
    );

    let correlationStatus = 'UNASSOCIATED_EVENT';
    let associatedStaff = null;

    if (activeVisits.length === 1) {
      // EXACTLY ONE active visit -> Associate and mark GREEN
      const visit = activeVisits[0];
      correlationStatus = 'HYGIENE_RECORDED';
      associatedStaff = visit.staffName;

      visit.hygieneStatus = 'GREEN';
      visit.hygieneEventTime = nowTimeStr;

      targetBed.hygieneStatus = 'GREEN';
      targetBed.lastHygieneEvent = nowTimeStr;
    } else if (activeVisits.length > 1) {
      // MULTIPLE active visits -> Mark AMBIGUOUS (YELLOW)
      correlationStatus = 'EVENT_AMBIGUOUS';
      associatedStaff = activeVisits.map((v) => v.staffName).join(' & ');

      activeVisits.forEach((v) => {
        v.hygieneStatus = 'YELLOW';
        v.hygieneEventTime = nowTimeStr;
      });

      targetBed.hygieneStatus = 'YELLOW';
      targetBed.lastHygieneEvent = nowTimeStr;

      // Add alert
      const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
      this.alerts.unshift({
        id: alertId,
        type: 'WARNING',
        severity: 'WARNING',
        category: 'EVENT_AMBIGUOUS',
        title: 'Ambiguous Hygiene Event',
        staffName: associatedStaff,
        bedId: targetBed.id,
        timestamp: nowTimeStr,
        message: `Multiple active healthcare workers (${associatedStaff}) around Bed ${targetBed.id}. Dispenser activated but cannot definitively attribute.`,
        actionRequired: 'Review Required',
      });
    } else {
      // ZERO active visits -> Unassociated dispenser activation
      correlationStatus = 'UNASSOCIATED_EVENT';
      targetBed.lastHygieneEvent = nowTimeStr;

      const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
      this.alerts.unshift({
        id: alertId,
        type: 'INFO',
        severity: 'INFO',
        category: 'UNASSOCIATED_EVENT',
        title: 'Unassociated Sanitizer Event',
        staffName: 'No Active Visit',
        bedId: targetBed.id,
        timestamp: nowTimeStr,
        message: `Dispenser activated at Bed ${targetBed.id} without an active staff badge tap recorded.`,
        actionRequired: 'Informational',
      });
    }

    // Log hygiene event
    const hygEventId = 'HYG-' + Math.floor(1000 + Math.random() * 9000);
    this.hygieneEvents.unshift({
      id: hygEventId,
      deviceId: deviceId || targetBed.sanitizerDeviceId,
      bedId: targetBed.id,
      ward: targetBed.ward,
      eventType,
      timestamp: nowTimeStr,
      correlationStatus,
      associatedStaff,
    });

    return {
      success: true,
      status: correlationStatus,
      bedId: targetBed.id,
      ward: targetBed.ward,
      associatedStaff,
      timestamp: nowTimeStr,
      activeStaffCount: activeVisits.length,
    };
  }

  // MODULE 15: Emergency Override
  processEmergencyOverride({ staffId, bedId, reason, authorizedUser, timestamp }) {
    const nowTimeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : this.formatTime();
    const bed = this.bedList.find((b) => b.id === bedId) || this.bedList[0];
    const staff = this.staffList.find((s) => s.id === staffId);
    const staffName = staff ? staff.name : 'Emergency Responder';

    const overrideId = 'OVR-' + Math.floor(1000 + Math.random() * 9000);
    const overrideRecord = {
      id: overrideId,
      staffId: staff ? staff.id : 'EMERGENCY_CREW',
      staffName,
      bedId: bed.id,
      ward: bed.ward,
      timestamp: nowTimeStr,
      reason: reason || 'Stat emergency patient resuscitation protocol',
      authorizedUser: authorizedUser || 'Attending Physician',
    };
    this.overrides.unshift(overrideRecord);

    // Update bed access state without physically blocking
    bed.currentStaff = staffName;
    bed.visitStatus = 'Active';
    bed.lastAccess = nowTimeStr;

    // Create alert
    const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
    this.alerts.unshift({
      id: alertId,
      type: 'INFO',
      severity: 'INFO',
      category: 'EMERGENCY_OVERRIDE',
      title: 'Emergency Override Activated',
      staffName,
      bedId: bed.id,
      timestamp: nowTimeStr,
      message: `Emergency access recorded for Bed ${bed.id} (${bed.ward}). Reason: ${overrideRecord.reason}`,
      actionRequired: 'Post-event log entry',
    });

    return {
      success: true,
      status: 'EMERGENCY_OVERRIDE_RECORDED',
      overrideRecord,
    };
  }

  // Device Heartbeat
  processHeartbeat({ deviceId, timestamp }) {
    const nowTimeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : this.formatTime();
    const dev = this.deviceList.find((d) => d.id === deviceId);
    if (!dev) {
      return { success: false, status: 'DEVICE_NOT_FOUND' };
    }
    dev.lastHeartbeat = nowTimeStr;
    dev.connection = 'Online';
    dev.status = 'Healthy';
    return { success: true, status: 'HEARTBEAT_ACK', deviceId, timestamp: nowTimeStr };
  }

  // Device Offline Simulation
  toggleDeviceOffline(deviceId) {
    const dev = this.deviceList.find((d) => d.id === deviceId);
    if (dev) {
      dev.connection = dev.connection === 'Online' ? 'Offline' : 'Online';
      dev.status = dev.connection === 'Online' ? 'Healthy' : 'Fault';

      if (dev.connection === 'Offline') {
        const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
        this.alerts.unshift({
          id: alertId,
          type: 'WARNING',
          severity: 'WARNING',
          category: 'DEVICE_OFFLINE',
          title: 'Device Communication Lost',
          staffName: 'IoT Network Gateway',
          bedId: dev.bedId,
          timestamp: this.formatTime(),
          message: `Hardware station ${dev.id} (${dev.type}) at Bed ${dev.bedId} stopped sending heartbeats.`,
          actionRequired: 'Check device power and hospital Wi-Fi connection',
        });
      }
      return { success: true, connection: dev.connection };
    }
    return { success: false };
  }

  // MODULE 24: Metrics and Dashboard Data
  getDashboardData() {
    const activeVisits = this.visits.filter((v) => v.status === 'Active');
    const totalVisits = this.visits.length;
    const hygieneEvents = this.hygieneEvents.filter(
      (h) => h.correlationStatus === 'HYGIENE_RECORDED'
    ).length;
    const possibleMissedEvents = this.alerts.filter(
      (a) => a.category === 'POSSIBLE_MISSED_HYGIENE'
    ).length;
    const ambiguousEvents = this.alerts.filter(
      (a) => a.category === 'EVENT_AMBIGUOUS'
    ).length;
    const unknownBadges = this.alerts.filter(
      (a) => a.category === 'SECURITY' && a.title.includes('Unknown')
    ).length;
    const deviceFaults = this.deviceList.filter(
      (d) => d.connection === 'Offline' || d.status !== 'Healthy'
    ).length;

    return {
      activeVisits,
      metrics: {
        totalVisits,
        hygieneEvents,
        possibleMissedEvents,
        ambiguousEvents,
        unknownBadges,
        deviceFaults,
      },
      beds: this.bedList,
      alerts: this.alerts,
      systemStatus: 'Operational',
      lastUpdated: this.formatTime(),
    };
  }
}

export const correlationEngine = new CorrelationEngine();
