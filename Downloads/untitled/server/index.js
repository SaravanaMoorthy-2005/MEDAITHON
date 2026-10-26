// HYGIENIX Hospital Hand-Hygiene Server
import express from 'express';
import cors from 'cors';
import { correlationEngine } from './services/correlationService.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HYGIENIX',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Dashboard aggregates
app.get('/api/dashboard', (req, res) => {
  const data = correlationEngine.getDashboardData();
  res.json(data);
});

// RFID Scan Access
app.post('/api/rfid/scan', (req, res) => {
  const { deviceId, rfidUid, timestamp } = req.body;
  if (!deviceId || !rfidUid) {
    return res.status(400).json({
      success: false,
      message: 'deviceId and rfidUid are required',
    });
  }
  const result = correlationEngine.processRfidScan({ deviceId, rfidUid, timestamp });
  res.json(result);
});

// Sanitizer / Dispenser Event
app.post('/api/hygiene/event', (req, res) => {
  const { deviceId, bedId, eventType, timestamp } = req.body;
  const result = correlationEngine.processHygieneEvent({
    deviceId,
    bedId,
    eventType: eventType || 'DISPENSER_ACTIVATED',
    timestamp,
  });
  res.json(result);
});

// Device Heartbeat
app.post('/api/device/heartbeat', (req, res) => {
  const { deviceId, timestamp } = req.body;
  if (!deviceId) {
    return res.status(400).json({ success: false, message: 'deviceId is required' });
  }
  const result = correlationEngine.processHeartbeat({ deviceId, timestamp });
  res.json(result);
});

// Emergency Override
app.post('/api/override', (req, res) => {
  const { staffId, bedId, reason, authorizedUser, timestamp } = req.body;
  const result = correlationEngine.processEmergencyOverride({
    staffId,
    bedId,
    reason,
    authorizedUser,
    timestamp,
  });
  res.json(result);
});

// Staff Management Endpoints
app.get('/api/staff', (req, res) => {
  res.json(correlationEngine.staffList);
});

app.post('/api/staff', (req, res) => {
  const { name, role, department, rfidUid, ward, status } = req.body;
  if (!name || !rfidUid) {
    return res.status(400).json({ message: 'Name and RFID UID are required' });
  }
  const newStaff = {
    id: 'STF00' + (correlationEngine.staffList.length + 1),
    name,
    role: role || 'Nurse',
    department: department || 'General Ward',
    rfidUid,
    ward: ward || 'General Ward',
    status: status || 'Active',
  };
  correlationEngine.staffList.push(newStaff);
  res.status(201).json(newStaff);
});

app.put('/api/staff/:id', (req, res) => {
  const staff = correlationEngine.staffList.find((s) => s.id === req.params.id);
  if (!staff) {
    return res.status(404).json({ message: 'Staff member not found' });
  }
  Object.assign(staff, req.body);
  res.json(staff);
});

// Beds & Zones Endpoints
app.get('/api/beds', (req, res) => {
  res.json(correlationEngine.bedList);
});

app.post('/api/beds', (req, res) => {
  const { id, ward, zoneId, deviceId, sanitizerDeviceId } = req.body;
  const newBed = {
    id: id || 'GW-' + Math.floor(100 + Math.random() * 900),
    ward: ward || 'General Ward',
    zoneId: zoneId || 'ZONE-' + id,
    deviceId: deviceId || 'DEV-' + id,
    sanitizerDeviceId: sanitizerDeviceId || 'SAN-' + id,
    status: 'Enabled',
    currentStaff: null,
    visitStatus: 'Inactive',
    hygieneStatus: 'GRAY',
    lastAccess: '--',
    lastHygieneEvent: '--',
  };
  correlationEngine.bedList.push(newBed);
  res.status(201).json(newBed);
});

app.put('/api/beds/:id', (req, res) => {
  const bed = correlationEngine.bedList.find((b) => b.id === req.params.id);
  if (!bed) {
    return res.status(404).json({ message: 'Bed not found' });
  }
  Object.assign(bed, req.body);
  res.json(bed);
});

// Devices Endpoints
app.get('/api/devices', (req, res) => {
  res.json(correlationEngine.deviceList);
});

// Access and Hygiene Logs
app.get('/api/access-events', (req, res) => {
  res.json(correlationEngine.accessEvents);
});

app.get('/api/hygiene-events', (req, res) => {
  res.json(correlationEngine.hygieneEvents);
});

app.get('/api/alerts', (req, res) => {
  res.json(correlationEngine.alerts);
});

// Start server if not imported
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[HYGIENIX Server] Hospital monitoring API running on port ${PORT}`);
  });
}

export default app;
