import React from 'react';

interface SectionProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  style,
}) => {
  return (
    <section className={`clinical-card ${className}`.trim()} style={style}>
      {(title || action) && (
        <div className="clinical-card-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && (
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
