import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Inbox size={32} color="var(--text-faint)" />,
  action,
}) => {
  return (
    <div
      style={{
        padding: '36px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-medium)',
      }}
    >
      <div style={{ marginBottom: '10px' }}>{icon}</div>
      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
        {title}
      </h4>
      {description && (
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: action ? '16px' : '0' }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
