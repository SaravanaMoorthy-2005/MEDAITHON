import React from 'react';
import {
  IconDashboard,
  IconStaff,
  IconBed,
  IconAccess,
  IconHygiene,
  IconAlert,
  IconCamera,
  IconDevice,
  IconSettings,
} from '../icons';

export type NavigationTab =
  | 'dashboard'
  | 'staff'
  | 'beds'
  | 'access'
  | 'hygiene'
  | 'alerts'
  | 'technique'
  | 'devices'
  | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  alertCount: number;
}

interface MenuItem {
  id: NavigationTab;
  label: string;
  icon: React.FC<{ className?: string; size?: number }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  alertCount,
}) => {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
    { id: 'staff', label: 'Staff', icon: IconStaff },
    { id: 'beds', label: 'Beds & Zones', icon: IconBed },
    { id: 'access', label: 'Access Events', icon: IconAccess },
    { id: 'hygiene', label: 'Hygiene Events', icon: IconHygiene },
    { id: 'alerts', label: 'Alerts', icon: IconAlert, badge: alertCount },
    { id: 'technique', label: 'Technique Station', icon: IconCamera },
    { id: 'devices', label: 'Device Health', icon: IconDevice },
    { id: 'settings', label: 'Settings', icon: IconSettings },
  ];

  return (
    <aside className="sidebar-container">
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">
                <Icon size={17} />
              </span>
              <span className="sidebar-label">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="sidebar-badge">{item.badge}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-pill">
          <span className="dot"></span>
          <span>IoT Gateway: Online</span>
        </div>
        <div className="sidebar-disclaimer">
          Hackathon MVP Prototype.<br />
          Not clinically validated.
        </div>
      </div>
    </aside>
  );
};
