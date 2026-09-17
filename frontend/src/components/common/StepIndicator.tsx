import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  maxCompletedStep: number;
  onStepClick: (stepIndex: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  maxCompletedStep,
  onStepClick,
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Clinical Workflow
          </span>
          <span style={{ color: 'var(--border-medium)' }}>•</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Stage {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </span>
        </div>
        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          Sequential screening protocol
        </span>
      </div>

      {/* Progress track */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {steps.map((name, idx) => {
          const isCurrent = idx === currentStep;
          const isDone = idx < currentStep || idx <= maxCompletedStep;
          const isClickable = idx <= maxCompletedStep && idx !== currentStep;

          let bg = 'var(--bg-subtle)';
          let color = 'var(--text-secondary)';
          let border = '1px solid var(--border-default)';

          if (isCurrent) {
            bg = 'var(--accent-primary)';
            color = 'var(--text-on-accent)';
            border = '1px solid var(--accent-primary)';
          } else if (isDone) {
            bg = 'var(--accent-primary-subtle)';
            color = 'var(--accent-primary)';
            border = '1px solid #ccfbf1';
          }

          return (
            <button
              key={name}
              type="button"
              disabled={!isClickable}
              onClick={() => {
                if (isClickable) onStepClick(idx);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: bg,
                color,
                border,
                fontSize: '11.5px',
                fontWeight: isCurrent ? 600 : 500,
                cursor: isClickable ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                opacity: !isDone && !isCurrent ? 0.6 : 1,
                transition: 'background-color 150ms ease',
              }}
              title={
                isCurrent
                  ? `Active Step: ${name}`
                  : isClickable
                  ? `Return to ${name}`
                  : `Step ${idx + 1} (${name}) requires completion of previous stages`
              }
            >
              {isDone && !isCurrent ? (
                <Check size={12} strokeWidth={2.5} />
              ) : (
                <span>{idx + 1}.</span>
              )}
              <span>{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
