import React, { useState } from 'react';

interface ToggleSwitchProps {
  label: string;
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
  description?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  initialValue = false,
  onChange,
  description
}) => {
  const [isEnabled, setIsEnabled] = useState(initialValue);

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <span className="text-base font-medium capitalize text-gray-800 dark:text-white font-inter">
          {label}
        </span>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-inter">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        className={`switch-btn relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isEnabled 
            ? 'bg-primary' 
            : 'bg-gray-200 dark:bg-slate-600'
        }`}
        role="switch"
        aria-checked={isEnabled}
        onClick={handleToggle}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isEnabled ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};