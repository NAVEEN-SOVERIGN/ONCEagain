import React from 'react';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  ClipboardList,
  Cpu,
  Radio,
  FileText,
  Settings,
} from 'lucide-react';
import { ScreeningDisclaimer } from '../common/ScreeningDisclaimer';

export type NavItem =
  | 'dashboard'
  | 'patients'
  | 'new-screening'
  | 'screenings'
  | 'sensors'
  | 'physio-pods'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const links: { id: NavItem; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'new-screening', label: 'New Screening', icon: PlusCircle },
    { id: 'screenings', label: 'Screening Sessions', icon: ClipboardList },
    { id: 'sensors', label: 'Sensor Live UI', icon: Cpu },
    { id: 'physio-pods', label: 'Physio Pods (6x)', icon: Radio },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings & Offline', icon: Settings },
  ];

  return (
    <aside
      className="sidebar"
      style={{
        width: '240px',
        borderRight: '1px solid var(--border-default)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 10px',
        gap: '4px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '0 8px 12px 8px',
          borderBottom: '1px solid var(--border-default)',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Clinical Navigation
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          NER Early Screening Protocol
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentTab === link.id;

          return (
            <button
              key={link.id}
              type="button"
              onClick={() => onSelectTab(link.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-body)',
                background: isActive ? 'var(--bg-subtle)' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 150ms ease, color 150ms ease',
                width: '100%',
              }}
            >
              <Icon
                size={16}
                color={isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <ScreeningDisclaimer compact={false} includeReviewRequirement={true} />
      </div>
    </aside>
  );
};
