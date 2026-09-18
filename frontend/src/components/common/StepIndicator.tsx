import React from 'react';
import { Check, Lock } from 'lucide-react';

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
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Clinical Workflow
          </span>
          <span style={{ color: 'var(--border-medium)' }}>•</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          <span>Sequential Gate: {Math.min(maxCompletedStep + 1, steps.length)} of {steps.length} unlocked</span>
        </div>
      </div>

      {/* Progress track showing Completed, Current, and Locked states */}
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
          const isCompleted = idx < currentStep || (idx <= maxCompletedStep && !isCurrent);
          const isLocked = idx > maxCompletedStep;
          const isClickable = isCompleted;

          let bg = 'var(--bg-subtle)';
          let color = 'var(--text-faint)';
          let border = '1px solid var(--border-default)';

          if (isCurrent) {
            bg = 'var(--accent-primary)';
            color = 'var(--text-on-accent)';
            border = '1px solid var(--accent-primary)';
          } else if (isCompleted) {
            bg = 'var(--tier1-bg)';
            color = 'var(--tier1-text)';
            border = '1px solid var(--tier1-border)';
          } else if (isLocked) {
            bg = 'var(--bg-page)';
            color = 'var(--text-faint)';
            border = '1px dashed var(--border-default)';
          }

          return (
            <button
              key={name}
              type="button"
              disabled={isLocked || isCurrent}
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
                cursor: isClickable ? 'pointer' : isLocked ? 'not-allowed' : 'default',
                whiteSpace: 'nowrap',
                opacity: isLocked ? 0.6 : 1,
                transition: 'all 150ms ease',
              }}
              title={
                isCurrent
                  ? `Current Step: ${idx + 1}. ${name}`
                  : isCompleted
                  ? `Completed: Click to navigate back to ${name}`
                  : `Locked: Step ${idx + 1} (${name}) requires completion of previous stages`
              }
            >
              {isCurrent ? (
                <span style={{ fontWeight: 700 }}>{idx + 1}.</span>
              ) : isCompleted ? (
                <Check size={12} strokeWidth={2.5} />
              ) : (
                <Lock size={10} style={{ opacity: 0.7 }} />
              )}
              <span>{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
