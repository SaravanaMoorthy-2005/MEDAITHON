export type WardType = 'General Ward' | 'ICU';
export type StaffRole = 'Doctor' | 'Nurse' | 'Technician' | 'Other';
export type StaffStatus = 'Active' | 'Inactive';
export type HygieneComplianceStatus = 'GRAY' | 'GREEN' | 'YELLOW' | 'RED' | 'PENDING';
export type DeviceConnectionStatus = 'Online' | 'Offline' | 'Warning' | 'Fault';

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  department: string;
  rfidUid: string;
  ward: WardType;
  status: StaffStatus;
}

export interface BedZone {
  id: string;
  ward: WardType;
  zoneId: string;
  deviceId: string;
  sanitizerDeviceId: string;
  status: 'Enabled' | 'Disabled';
  currentStaff: string | null;
  visitStatus: 'Active' | 'Inactive';
  hygieneStatus: HygieneComplianceStatus;
  lastAccess: string;
  lastHygieneEvent: string;
}

export interface Device {
  id: string;
  type: 'RFID Reader' | 'Sanitizer Dispenser' | 'Hub Gateway';
  ward: WardType;
  bedId: string;
  lastHeartbeat: string;
  connection: DeviceConnectionStatus;
  firmware: string;
  status: 'Healthy' | 'Fault' | 'Warning';
}

export interface Visit {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  bedId: string;
  ward: WardType;
  visitStart: string;
  status: 'Active' | 'Completed';
  hygieneStatus: HygieneComplianceStatus;
  hygieneEventTime: string | null;
}

export interface AccessEvent {
  id: string;
  staffId: string;
  staffName: string;
  rfidUid: string;
  bedId: string;
  ward: WardType;
  deviceId: string;
  timestamp: string;
  status: 'REGISTERED' | 'UNKNOWN_BADGE' | 'REVOKED_BADGE' | 'INVALID_DEVICE';
}

export interface HygieneEvent {
  id: string;
  deviceId: string;
  bedId: string;
  ward: WardType;
  eventType: string;
  timestamp: string;
  correlationStatus: 'HYGIENE_RECORDED' | 'EVENT_AMBIGUOUS' | 'UNASSOCIATED_EVENT';
  associatedStaff: string | null;
}

export interface Alert {
  id: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: string;
  title: string;
  staffName: string;
  bedId: string;
  timestamp: string;
  message: string;
  actionRequired: string;
  metadata?: {
    previousBed?: string;
    nextBed?: string;
    staffId?: string;
  };
}

export interface EmergencyOverride {
  id: string;
  staffId: string;
  staffName: string;
  bedId: string;
  ward: WardType;
  timestamp: string;
  reason: string;
  authorizedUser: string;
}

export interface TechniqueStep {
  id: number;
  name: string;
  guidanceText: string;
  durationSec: number;
  status: 'Pending' | 'Detected' | 'Needs Repeat';
}

export interface DashboardMetrics {
  totalVisits: number;
  hygieneEvents: number;
  possibleMissedEvents: number;
  ambiguousEvents: number;
  unknownBadges: number;
  deviceFaults: number;
}
