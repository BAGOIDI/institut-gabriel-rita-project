import React from 'react';

const Tooltip = ({ text, children }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-800 text-white text-[10px] rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none shadow-lg">
        {text}
      </div>
    </div>
  );
};

export default Tooltip;
