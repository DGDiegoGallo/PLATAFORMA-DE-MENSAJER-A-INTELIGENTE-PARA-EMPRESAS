import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface PasswordFieldProps {
  label: string;
  name: string;
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
}

/**
 * Password input with visibility toggle using Bootstrap input-group utility.
 */
const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  name,
  id = `password-${name}`,
  placeholder,
  value,
  onChange,
  required = false,
  minLength,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label fw-medium">
        {label}
      </label>
      <div className="input-group">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
};

export default PasswordField;
