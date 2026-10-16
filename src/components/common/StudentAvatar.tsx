import React from 'react';
import { initials } from '../../utils/format';

/** Initials avatar (no photo stored in the database). */
export const StudentAvatar: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
  <div
    className={`flex shrink-0 items-center justify-center rounded-full bg-snc-green font-bold text-white ${className}`}
    aria-hidden
  >
    {initials(name)}
  </div>
);
