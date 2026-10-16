import React from 'react';

/** Official seal — same file the library_rfid kiosk uses. */
export const SCHOOL_LOGO = '/images/uploads/SCHOOL_LOGO.png';

interface CollegeSealProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  /** Text colour for showText — light on dark brand surfaces, dark on white. */
  tone?: 'light' | 'dark';
}

export const CollegeSeal: React.FC<CollegeSealProps> = ({
  size = 'md',
  showText = false,
  tone = 'dark'
}) => {
  const sizeMap = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
    '2xl': 'w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44'
  };

  return (
    <div className="flex items-center gap-3">
      <img
        src={SCHOOL_LOGO}
        alt="St. Nicolas College of Business and Technology"
        draggable={false}
        className={`${sizeMap[size]} shrink-0 object-contain drop-shadow-xl select-none`}
      />

      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight text-sm leading-tight ${tone === 'light' ? 'text-white' : 'text-slate-900'}`}>
            ST. NICOLAS COLLEGE
          </span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${tone === 'light' ? 'text-emerald-200' : 'text-snc-green'}`}>
            Business & Technology • Est. 2004
          </span>
        </div>
      )}
    </div>
  );
};
