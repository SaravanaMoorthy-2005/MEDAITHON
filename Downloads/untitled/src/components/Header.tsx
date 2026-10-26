import React, { useState, useEffect } from 'react';
import { WardType } from '../types';
import { IconShield, IconWifi } from '../icons';

interface HeaderProps {
  selectedWard: 'All' | WardType;
  onSelectWard: (ward: 'All' | WardType) => void;
  onOpenEmergency: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedWard,
  onSelectWard,
  onOpenEmergency,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header-container">
      <div className="header-brand">
        <div className="brand-logo">
          <IconShield size={22} className="brand-icon" />
        </div>
        <div className="brand-text">
          <div className="brand-title">
            <span className="brand-main">HYGIENIX</span>
            <span className="brand-badge">HOSPITAL OPS</span>
          </div>
          <div className="brand-sub">Smart Hand-Hygiene Monitoring & Technique Verification</div>
        </div>
      </div>

      <div className="header-right">
        {/* Ward Selector */}
        <div className="ward-selector-group">
          <label className="ward-label">Ward:</label>
          <div className="ward-buttons">
            {(['All', 'General Ward', 'ICU'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onSelectWard(w)}
                className={`ward-btn ${selectedWard === w ? 'active' : ''}`}
              >
                {w === 'All' ? 'ALL WARDS' : w.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Hospital Details */}
        <div className="header-meta">
          <div className="meta-hospital">City Central Hospital</div>
          <div className="meta-status">
            <span className="status-indicator-dot online"></span>
            <span>SYSTEM OPERATIONAL</span>
          </div>
        </div>

        {/* Current Time */}
        <div className="header-clock">
          <span className="clock-label">TIME</span>
          <span className="clock-value">{timeStr || '10:25:00 AM'}</span>
        </div>

        {/* Emergency Override Button */}
        <button
          type="button"
          onClick={onOpenEmergency}
          className="emergency-btn"
          title="Log authorized emergency access without blocking staff"
        >
          EMERGENCY OVERRIDE
        </button>
      </div>
    </header>
  );
};
