import React from 'react';
import { useApp } from '../../context/AppContext';
import { KioskLrnInput } from './KioskLrnInput';
import { KioskStudentDashboard } from './KioskStudentDashboard';
import { KioskTopBar } from './KioskTopBar';
import { KioskSlideshow, useSlideIndex } from './KioskSlideshow';
import { PrintSlipModal } from './PrintSlipModal';

const BUILDING_BG = '/images/uploads/snc-building-front.jpg';

export const KioskFrame: React.FC = () => {
  const { activeStudent } = useApp();
  const slide = useSlideIndex(!activeStudent);

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden text-white">
      {activeStudent ? (
        <>
          <div
            className="snc-hero-bg absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${BUILDING_BG})` }}
            aria-hidden
          />
          <div className="absolute inset-0 snc-hero-overlay" aria-hidden />
        </>
      ) : (
        <KioskSlideshow index={slide} />
      )}

      <KioskTopBar />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pb-6 sm:px-8">
        {activeStudent ? <KioskStudentDashboard /> : <KioskLrnInput />}
      </main>

      <PrintSlipModal />
    </div>
  );
};
