import {
  Staff,
  BedZone,
  Device,
  Visit,
  AccessEvent,
  HygieneEvent,
  Alert,
  EmergencyOverride,
  DashboardMetrics,
  WardType,
} from '../types';
import {
  defaultStaffList,
  defaultBedList,
  defaultDeviceList,
  defaultVisits,
  defaultAlerts,
} from '../data/initialData';

type Listener = () => void;

class HospitalStore {
  private staff: Staff[] = [...defaultStaffList];
  private beds: BedZone[] = [...defaultBedList];
  private devices: Device[] = [...defaultDeviceList];
  private visits: Visit[] = [...defaultVisits];
  private alerts: Alert[] = [...defaultAlerts];
  private accessEvents: AccessEvent[] = [
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
  private hygieneEvents: HygieneEvent[] = [
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
  private overrides: EmergencyOverride[] = [];
  private listeners: Set<Listener> = new Set();

  public selectedWard: 'All' | WardType = 'General Ward';
  public duplicateCooldownSec: number = 15;
  private lastScanByBadge = new Map<string, { timestamp: number; bedId: string }>();

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    try {
      const state = {
        staff: this.staff,
        beds: this.beds,
        devices: this.devices,
        visits: this.visits,
        alerts: this.alerts,
        accessEvents: this.accessEvents,
        hygieneEvents: this.hygieneEvents,
        overrides: this.overrides,
      };
      sessionStorage.setItem('hygienix_state', JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  private loadFromStorage() {
    try {
      const raw = sessionStorage.getItem('hygienix_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.staff) this.staff = parsed.staff;
        if (parsed.beds) this.beds = parsed.beds;
        if (parsed.devices) this.devices = parsed.devices;
        if (parsed.visits) this.visits = parsed.visits;
        if (parsed.alerts) this.alerts = parsed.alerts;
        if (parsed.accessEvents) this.accessEvents = parsed.accessEvents;
        if (parsed.hygieneEvents) this.hygieneEvents = parsed.hygieneEvents;
        if (parsed.overrides) this.overrides = parsed.overrides;
      }
    } catch {
      // fallback to initial
    }
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((l) => l());
  }

  private formatTime(date = new Date()): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  // Getters
  public getStaff(): Staff[] {
    return [...this.staff];
  }

  public getBeds(): BedZone[] {
    return [...this.beds];
  }

  public getDevices(): Device[] {
    return [...this.devices];
  }

  public getVisits(): Visit[] {
    return [...this.visits];
  }

  public getAlerts(): Alert[] {
    return [...this.alerts];
  }

  public getAccessEvents(): AccessEvent[] {
    return [...this.accessEvents];
  }

  public getHygieneEvents(): HygieneEvent[] {
    return [...this.hygieneEvents];
  }

  public getOverrides(): EmergencyOverride[] {
    return [...this.overrides];
  }

  public getMetrics(): DashboardMetrics {
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
    const deviceFaults = this.devices.filter(
      (d) => d.connection === 'Offline' || d.status !== 'Healthy'
    ).length;

    return {
      totalVisits,
      hygieneEvents,
      possibleMissedEvents,
      ambiguousEvents,
      unknownBadges,
      deviceFaults,
    };
  }

  // Staff Operations
  public addStaff(staffMember: Omit<Staff, 'id'>) {
    const newStaff: Staff = {
      ...staffMember,
      id: 'STF' + String(this.staff.length + 1).padStart(3, '0'),
    };
    this.staff.push(newStaff);
    this.notify();
    return newStaff;
  }

  public updateStaff(id: string, updates: Partial<Staff>) {
    const member = this.staff.find((s) => s.id === id);
    if (member) {
      Object.assign(member, updates);
      this.notify();
    }
  }

  public toggleStaffStatus(id: string) {
    const member = this.staff.find((s) => s.id === id);
    if (member) {
      member.status = member.status === 'Active' ? 'Inactive' : 'Active';
      this.notify();
    }
  }

  // Bed Operations
  public addBed(bedData: Omit<BedZone, 'currentStaff' | 'visitStatus' | 'hygieneStatus' | 'lastAccess' | 'lastHygieneEvent'>) {
    const newBed: BedZone = {
      ...bedData,
      currentStaff: null,
      visitStatus: 'Inactive',
      hygieneStatus: 'GRAY',
      lastAccess: '--',
      lastHygieneEvent: '--',
    };
    this.beds.push(newBed);
    this.notify();
  }

  public toggleBedEnabled(id: string) {
    const bed = this.beds.find((b) => b.id === id);
    if (bed) {
      bed.status = bed.status === 'Enabled' ? 'Disabled' : 'Enabled';
      this.notify();
    }
  }

  // RFID Event Execution
  public handleRfidScan(deviceId: string, rfidUid: string): { success: boolean; status: string; message: string; data?: any } {
    const nowTimeStr = this.formatTime();
    const nowMs = Date.now();

    // 1. Hardware device lookup
    const device = this.devices.find((d) => d.id === deviceId);
    if (!device) {
      return { success: false, status: 'INVALID_DEVICE', message: 'Hardware scanner device ID unrecognized' };
    }

    const bed = this.beds.find((b) => b.id === device.bedId);
    if (!bed) {
      return { success: false, status: 'INVALID_DEVICE', message: 'No bed assigned to scanner device' };
    }

    // 2. Staff lookup
    const staff = this.staff.find((s) => s.rfidUid === rfidUid);
    if (!staff) {
      this.accessEvents.unshift({
        id: 'ACC-' + Math.floor(1000 + Math.random() * 9000),
        staffId: 'UNKNOWN',
        staffName: 'Unknown Badge Holder',
        rfidUid,
        bedId: bed.id,
        ward: bed.ward,
        deviceId,
        timestamp: nowTimeStr,
        status: 'UNKNOWN_BADGE',
      });

      this.alerts.unshift({
        id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
        type: 'WARNING',
        severity: 'WARNING',
        category: 'SECURITY',
        title: 'Unknown Badge Detected',
        staffName: `Unregistered RFID (${rfidUid})`,
        bedId: bed.id,
        timestamp: nowTimeStr,
        message: `Badge ${rfidUid} tapped at Bed ${bed.id} (${bed.ward}). No healthcare worker profile matched.`,
        actionRequired: 'Security & Nursing Unit Review',
      });

      this.notify();
      return {
        success: false,
        status: 'UNKNOWN_BADGE',
        message: `Unregistered RFID badge (${rfidUid}) tapped at Bed ${bed.id}.`,
      };
    }

    // 3. Staff status check
    if (staff.status !== 'Active') {
      this.alerts.unshift({
        id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
        type: 'CRITICAL',
        severity: 'CRITICAL',
        category: 'SECURITY',
        title: 'Revoked/Inactive Badge Access Attempt',
        staffName: staff.name,
        bedId: bed.id,
        timestamp: nowTimeStr,
        message: `Deactivated badge ${rfidUid} belonging to ${staff.name} attempted zone access.`,
        actionRequired: 'Investigate access credential immediately',
      });

      this.notify();
      return {
        success: false,
        status: 'REVOKED_BADGE',
        message: `Revoked badge for ${staff.name} rejected.`,
      };
    }

    // 4. Duplicate scan cooldown check
    const lastScan = this.lastScanByBadge.get(rfidUid);
    if (
      lastScan &&
      lastScan.bedId === bed.id &&
      nowMs - lastScan.timestamp < this.duplicateCooldownSec * 1000
    ) {
      return {
        success: true,
        status: 'DUPLICATE_SCAN',
        message: `Scan within ${this.duplicateCooldownSec}s cooldown ignored.`,
        data: { staffId: staff.id, staffName: staff.name, bedId: bed.id },
      };
    }
    this.lastScanByBadge.set(rfidUid, { timestamp: nowMs, bedId: bed.id });

    // 5. MISSED HYGIENE DETECTION:
    // If this staff has an active visit at another bed without hygiene event detected:
    const prevUnwashedVisit = this.visits.find(
      (v) =>
        v.staffId === staff.id &&
        v.bedId !== bed.id &&
        v.status === 'Active' &&
        v.hygieneStatus === 'PENDING'
    );

    if (prevUnwashedVisit) {
      prevUnwashedVisit.status = 'Completed';
      prevUnwashedVisit.hygieneStatus = 'RED';

      const prevBed = this.beds.find((b) => b.id === prevUnwashedVisit.bedId);
      if (prevBed && prevBed.currentStaff === staff.name) {
        prevBed.hygieneStatus = 'RED';
        prevBed.visitStatus = 'Inactive';
        prevBed.currentStaff = null;
      }

      this.alerts.unshift({
        id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
        type: 'CRITICAL',
        severity: 'CRITICAL',
        category: 'POSSIBLE_MISSED_HYGIENE',
        title: 'Possible Missed Hygiene',
        staffName: staff.name,
        bedId: prevUnwashedVisit.bedId,
        timestamp: nowTimeStr,
        message: `${staff.name} transitioned from Bed ${prevUnwashedVisit.bedId} to Bed ${bed.id} without hygiene event detected.`,
        actionRequired: 'Review Required',
        metadata: {
          previousBed: prevUnwashedVisit.bedId,
          nextBed: bed.id,
          staffId: staff.id,
        },
      });
    }

    // 6. Record Access Event
    this.accessEvents.unshift({
      id: 'ACC-' + Math.floor(1000 + Math.random() * 9000),
      staffId: staff.id,
      staffName: staff.name,
      rfidUid,
      bedId: bed.id,
      ward: bed.ward,
      deviceId,
      timestamp: nowTimeStr,
      status: 'REGISTERED',
    });

    // 7. Create new Visit
    const newVisit: Visit = {
      id: 'VST-' + Math.floor(1000 + Math.random() * 9000),
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

    // Update Device status
    device.lastHeartbeat = nowTimeStr;
    device.connection = 'Online';
    device.status = 'Healthy';

    this.notify();
    return {
      success: true,
      status: 'REGISTERED',
      message: `Bed-zone access recorded for ${staff.name} at Bed ${bed.id}. Hygiene pending.`,
      data: { staffId: staff.id, staffName: staff.name, bedId: bed.id, ward: bed.ward },
    };
  }

  // Sanitizer Dispenser Event Execution
  public handleSanitizerEvent(bedId: string, deviceId?: string): { success: boolean; status: string; message: string; data?: any } {
    const nowTimeStr = this.formatTime();
    let bed = this.beds.find((b) => b.id === bedId);
    if (!bed && deviceId) {
      const dev = this.devices.find((d) => d.id === deviceId);
      if (dev) bed = this.beds.find((b) => b.id === dev.bedId);
    }

    if (!bed) {
      return { success: false, status: 'INVALID_DEVICE', message: 'Could not find bed zone for sanitizer' };
    }

    const activeVisits = this.visits.filter((v) => v.bedId === bed!.id && v.status === 'Active');

    let correlationStatus: 'HYGIENE_RECORDED' | 'EVENT_AMBIGUOUS' | 'UNASSOCIATED_EVENT' = 'UNASSOCIATED_EVENT';
    let associatedStaff: string | null = null;
    let message = '';

    if (activeVisits.length === 1) {
      const visit = activeVisits[0];
      correlationStatus = 'HYGIENE_RECORDED';
      associatedStaff = visit.staffName;

      visit.hygieneStatus = 'GREEN';
      visit.hygieneEventTime = nowTimeStr;

      bed.hygieneStatus = 'GREEN';
      bed.lastHygieneEvent = nowTimeStr;
      message = `Hygiene event detected for ${visit.staffName} at Bed ${bed.id}.`;
    } else if (activeVisits.length > 1) {
      correlationStatus = 'EVENT_AMBIGUOUS';
      associatedStaff = activeVisits.map((v) => v.staffName).join(' & ');

      activeVisits.forEach((v) => {
        v.hygieneStatus = 'YELLOW';
        v.hygieneEventTime = nowTimeStr;
      });

      bed.hygieneStatus = 'YELLOW';
      bed.lastHygieneEvent = nowTimeStr;

      this.alerts.unshift({
        id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
        type: 'WARNING',
        severity: 'WARNING',
        category: 'EVENT_AMBIGUOUS',
        title: 'Ambiguous Hygiene Event',
        staffName: associatedStaff,
        bedId: bed.id,
        timestamp: nowTimeStr,
        message: `Multiple active healthcare workers (${associatedStaff}) around Bed ${bed.id}. Sanitizer event cannot be uniquely attributed.`,
        actionRequired: 'Review Required',
      });
      message = `Event ambiguous: multiple active workers (${associatedStaff}) at Bed ${bed.id}.`;
    } else {
      correlationStatus = 'UNASSOCIATED_EVENT';
      bed.lastHygieneEvent = nowTimeStr;

      this.alerts.unshift({
        id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
        type: 'INFO',
        severity: 'INFO',
        category: 'UNASSOCIATED_EVENT',
        title: 'Unassociated Sanitizer Event',
        staffName: 'No Active Visit',
        bedId: bed.id,
        timestamp: nowTimeStr,
        message: `Dispenser activated at Bed ${bed.id} with no active badge tap recorded.`,
        actionRequired: 'Informational',
      });
      message = `Dispenser activated at Bed ${bed.id} without active visit.`;
    }

    this.hygieneEvents.unshift({
      id: 'HYG-' + Math.floor(1000 + Math.random() * 9000),
      deviceId: deviceId || bed.sanitizerDeviceId,
      bedId: bed.id,
      ward: bed.ward,
      eventType: 'DISPENSER_ACTIVATED',
      timestamp: nowTimeStr,
      correlationStatus,
      associatedStaff,
    });

    this.notify();
    return {
      success: true,
      status: correlationStatus,
      message,
      data: { bedId: bed.id, ward: bed.ward, associatedStaff, activeStaffCount: activeVisits.length },
    };
  }

  // Emergency Override Execution
  public handleEmergencyOverride(bedId: string, reason: string, authorizedUser: string) {
    const nowTimeStr = this.formatTime();
    const bed = this.beds.find((b) => b.id === bedId) || this.beds[0];

    const overrideRecord: EmergencyOverride = {
      id: 'OVR-' + Math.floor(1000 + Math.random() * 9000),
      staffId: 'EMERGENCY_CREW',
      staffName: 'Emergency Response Team',
      bedId: bed.id,
      ward: bed.ward,
      timestamp: nowTimeStr,
      reason: reason || 'Stat code emergency patient intervention',
      authorizedUser: authorizedUser || 'Dr. Arun Kumar (Attending)',
    };

    this.overrides.unshift(overrideRecord);

    bed.currentStaff = 'Emergency Response Team';
    bed.visitStatus = 'Active';
    bed.lastAccess = nowTimeStr;

    this.alerts.unshift({
      id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
      type: 'INFO',
      severity: 'INFO',
      category: 'EMERGENCY_OVERRIDE',
      title: 'Emergency Override Activated',
      staffName: 'Emergency Team',
      bedId: bed.id,
      timestamp: nowTimeStr,
      message: `Emergency access recorded for Bed ${bed.id} (${bed.ward}). Reason: ${overrideRecord.reason}`,
      actionRequired: 'Post-event log entry',
    });

    this.notify();
    return overrideRecord;
  }

  // Device Offline Toggle
  public toggleDeviceOffline(deviceId: string) {
    const dev = this.devices.find((d) => d.id === deviceId);
    if (dev) {
      dev.connection = dev.connection === 'Online' ? 'Offline' : 'Online';
      dev.status = dev.connection === 'Online' ? 'Healthy' : 'Fault';

      if (dev.connection === 'Offline') {
        this.alerts.unshift({
          id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
          type: 'WARNING',
          severity: 'WARNING',
          category: 'DEVICE_OFFLINE',
          title: 'Device Communication Lost',
          staffName: 'IoT Network Gateway',
          bedId: dev.bedId,
          timestamp: this.formatTime(),
          message: `Station ${dev.id} (${dev.type}) at Bed ${dev.bedId} offline. Heartbeat timed out.`,
          actionRequired: 'Check device power and network gateway',
        });
      }
      this.notify();
      return dev.connection;
    }
    return 'Online';
  }

  // Pre-configured Test Scenario 1: Nurse A approaches Bed 101, then activates Sanitizer -> GREEN
  public runScenario1_NurseA_Wash() {
    this.handleRfidScan('DEV-GW-01', 'RFID-1002');
  }

  public runScenario1_Sanitizer_Bed101() {
    this.handleSanitizerEvent('GW-101');
  }

  // Pre-configured Test Scenario 2: Nurse A moves to Bed 102 without washing -> then moves to Bed 103 -> RED alert
  public runScenario2_NurseA_Bed102_NoWash() {
    this.handleRfidScan('DEV-GW-02', 'RFID-1002');
  }

  public runScenario2_NurseA_NextBed_TriggersMissed() {
    this.handleRfidScan('DEV-GW-03', 'RFID-1002');
  }

  // Pre-configured Test Scenario 3: Two staff active at same bed -> Sanitizer -> AMBIGUOUS (YELLOW)
  public runScenario3_TwoStaff_Ambiguous() {
    // Dr Arun Kumar at Bed 101
    this.handleRfidScan('DEV-GW-01', 'RFID-1001');
    // Nurse Priya at Bed 101
    this.handleRfidScan('DEV-GW-01', 'RFID-1002');
    // Now trigger sanitizer at Bed 101
    this.handleSanitizerEvent('GW-101');
  }

  // Pre-configured Test Scenario 4: Unknown RFID tap
  public runScenario4_UnknownBadge() {
    this.handleRfidScan('DEV-GW-01', 'RFID-9999-UNREG');
  }

  // Reset demo state
  public resetDemoData() {
    sessionStorage.removeItem('hygienix_state');
    this.staff = [...defaultStaffList];
    this.beds = [...defaultBedList];
    this.devices = [...defaultDeviceList];
    this.visits = [...defaultVisits];
    this.alerts = [...defaultAlerts];
    this.lastScanByBadge.clear();
    this.notify();
  }
}

export const hospitalStore = new HospitalStore();
