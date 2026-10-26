import React, { useState } from 'react';
import { hospitalStore } from '../services/hospitalStore';

export const SettingsPage: React.FC = () => {
  const [cooldown, setCooldown] = useState<number>(hospitalStore.duplicateCooldownSec);
  const [hygieneTimeout, setHygieneTimeout] = useState<number>(60);
  const [enableSound, setEnableSound] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    hospitalStore.duplicateCooldownSec = cooldown;
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>SYSTEM CONFIGURATION & HARDWARE PARAMETERS</h2>
          <p className="page-subtitle">
            Correlation thresholds, duplicate scan cooldowns, and ESP32 hardware configurations
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="demo-toast-banner success">
          <span className="toast-label">SETTINGS SAVED:</span>
          <span className="toast-text">System parameters updated successfully.</span>
        </div>
      )}

      <div className="dashboard-two-col">
        {/* CORRELATION SETTINGS */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>EVENT CORRELATION ENGINE THRESHOLDS</h3>
            <span className="panel-sub">Configure timing windows for RFID visits and dispensers</span>
          </div>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label>Duplicate Scan Cooldown Window (Seconds):</label>
              <input
                type="number"
                min="3"
                max="120"
                value={cooldown}
                onChange={(e) => setCooldown(Number(e.target.value))}
                className="form-control"
              />
              <span className="form-hint">
                Prevents flutter/repeated scans of the same badge at the same bed from creating multiple visits.
              </span>
            </div>

            <div className="form-group">
              <label>Expected Hygiene Observation Window (Seconds):</label>
              <input
                type="number"
                min="10"
                max="300"
                value={hygieneTimeout}
                onChange={(e) => setHygieneTimeout(Number(e.target.value))}
                className="form-control"
              />
              <span className="form-hint">
                Expected time window between bed-zone access and hand-hygiene dispenser event.
              </span>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={enableSound}
                  onChange={(e) => setEnableSound(e.target.checked)}
                />
                Audible chime for Critical Missed Hygiene alerts
              </label>
            </div>

            <button type="submit" className="btn btn-primary">
              SAVE ENGINE CONFIGURATION
            </button>
          </form>
        </div>

        {/* ESP32 HARDWARE SETUP */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>ESP32 + RC522 HARDWARE INTEGRATION</h3>
            <span className="panel-sub">Pinout for physical station deployment</span>
          </div>

          <div className="hardware-info-box">
            <div className="code-block">
              <strong>SPI Pin Mapping:</strong>
              <br />SDA / SS   → GPIO 5
              <br />SCK        → GPIO 18
              <br />MOSI       → GPIO 23
              <br />MISO       → GPIO 19
              <br />RST        → GPIO 22
              <br />VCC        → 3.3V (Do not use 5V)
              <br />GND        → GND
            </div>

            <div className="api-endpoints-box">
              <strong>API Endpoints:</strong>
              <ul>
                <li><code>POST /api/rfid/scan</code> - RFID scan event</li>
                <li><code>POST /api/hygiene/event</code> - Dispenser trigger</li>
                <li><code>POST /api/device/heartbeat</code> - Heartbeat telemetry</li>
                <li><code>GET /api/health</code> - Health probe</li>
              </ul>
            </div>

            <div className="hospital-callout callout-info">
              The full Arduino C++ firmware is provided in <code>esp32_rfid.ino</code> in the project root.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
