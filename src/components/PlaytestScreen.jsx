import React from 'react';
import PropTypes from 'prop-types';

const PlaytestScreen = () => {
  // We use the base URL without query params to ensure iframes render the normal app
  const appUrl = window.location.origin + window.location.pathname;

  return (
    <div className="w-full h-screen bg-slate-900 overflow-hidden flex flex-col">
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-white font-bold tracking-widest uppercase text-sm">
          Girify Admin Playtest
        </h1>
        <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Live Sync (Simulated)
          </span>
          <button
            onClick={() => (window.location.href = appUrl)}
            className="hover:text-white transition-colors"
          >
            Exit Admin
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex gap-8 items-center bg-slate-950">
        {/* Mobile View */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="text-slate-400 text-xs font-mono text-center">
            Mobile (iPhone 12 - 390px)
          </div>
          <div
            className="border-[12px] border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden bg-black"
            style={{ width: '330px', height: '660px' }}
          >
            {/* Standard width is 375-390. Let's strictly use 390 */}
            <iframe
              src={appUrl}
              title="Mobile View"
              className="w-full h-full bg-white border-0 block"
            />
          </div>
        </div>

        {/* Tablet View */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="text-slate-400 text-xs font-mono text-center">
            Tablet (iPad Mini - 768px)
          </div>
          <div
            className="border-[12px] border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden bg-black"
            style={{
              width: '768px',
              height: '1024px',
              transform: 'scale(0.65)',
              transformOrigin: 'top center',
            }}
          >
            {/* Scaled down to fit vertically */}
            <iframe
              src={appUrl}
              title="Tablet View"
              className="w-full h-full bg-white border-0 block"
            />
          </div>
        </div>

        {/* Desktop View */}
        <div className="flex flex-col gap-2 shrink-0 h-full">
          <div className="text-slate-400 text-xs font-mono text-center">Desktop (Full)</div>
          <div className="border-[12px] border-slate-800 rounded-[1rem] shadow-2xl overflow-hidden bg-black flex-1 w-[1024px]">
            <iframe
              src={appUrl}
              title="Desktop View"
              className="w-full h-full bg-white border-0 block"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// PlaytestScreen has no props
PlaytestScreen.propTypes = {};

export default PlaytestScreen;
