import React from 'react';

interface InputFieldProps {
  label: string;
  name: string;
  id?: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
}

/**
 * Generic text input rendered with Bootstrap styling.
 * Keeps markup concise and reusable across forms.
 */
const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  id = `input-${name}`,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  minLength,
}) => (
  <div className="mb-3">
    <label htmlFor={id} className="form-label fw-medium">
      {label}
    </label>
    <input
      id={id}
      name={name}
      type={type}
      className="form-control"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      minLength={minLength}
    />
  </div>
);

export default InputField;
