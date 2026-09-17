import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  options?: SelectOption[];
  error?: string;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  options,
  error,
  required,
  id,
  children,
  className = '',
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`form-select ${error ? 'error' : ''} ${className}`.trim()}
        style={error ? { borderColor: '#dc2626' } : undefined}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error ? (
        <span style={{ fontSize: '12px', color: '#b91c1c' }}>{error}</span>
      ) : helperText ? (
        <span className="form-helper">{helperText}</span>
      ) : null}
    </div>
  );
};
