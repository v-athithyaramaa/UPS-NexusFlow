"use client";

import { useState, useEffect } from 'react';
import { Monitor, Smartphone, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface SwitcherProps {
  currentView: string;
  onViewChange: (view: string) => void;
  sessionToken: string;
}

export default function OmnichannelSwitcher({ currentView, onViewChange, sessionToken }: SwitcherProps) {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="bg-[#351C15] text-white p-4 flex flex-col md:flex-row items-center justify-between shadow-md z-50 relative">
      <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4 mb-4 md:mb-0 w-full md:w-auto">
        <h1 className="text-xl font-bold text-[#FFB500]">UPS NexusFlow</h1>
        <div className="flex flex-wrap justify-center gap-2 bg-white/10 rounded-lg p-1 w-full md:w-auto">
          <button
            onClick={() => onViewChange('WEB_PORTAL')}
            className={`px-3 py-1.5 rounded flex items-center space-x-2 text-sm transition-colors ${currentView === 'WEB_PORTAL' ? 'bg-[#FFB500] text-[#351C15] font-semibold' : 'hover:bg-white/20'}`}
          >
            <Monitor size={16} />
            <span>Desktop Portal</span>
          </button>
          <button
            onClick={() => onViewChange('WHATSAPP')}
            className={`px-3 py-1.5 rounded flex items-center space-x-2 text-sm transition-colors ${currentView === 'WHATSAPP' ? 'bg-[#FFB500] text-[#351C15] font-semibold' : 'hover:bg-white/20'}`}
          >
            <Smartphone size={16} />
            <span>WhatsApp Copilot</span>
          </button>
          <button
            onClick={() => onViewChange('MOBILE_PWA')}
            className={`px-3 py-1.5 rounded flex items-center space-x-2 text-sm transition-colors ${currentView === 'MOBILE_PWA' ? 'bg-[#FFB500] text-[#351C15] font-semibold' : 'hover:bg-white/20'}`}
          >
            <QrCode size={16} />
            <span>Mobile Scanner</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
        <div className="text-sm bg-black/30 px-3 py-1.5 rounded-md border border-white/10">
          Session Code: <span className="font-mono font-bold text-[#FFB500]">{sessionToken}</span>
        </div>
        <button 
          onClick={() => setShowQR(!showQR)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          title="Show Sync QR Code"
        >
          <QrCode size={20} />
        </button>

        {showQR && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-4 mt-2 w-[90vw] max-w-sm bg-white p-4 rounded-lg shadow-xl text-[#351C15] z-50 border border-gray-200">
            <h3 className="text-sm font-bold mb-2 text-center">Scan to Sync Session</h3>
            <div className="bg-white p-2 rounded-md">
              <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/?session=${sessionToken}`} size={128} />
            </div>
            <p className="text-xs text-center mt-2 text-gray-600 font-mono">{sessionToken}</p>
          </div>
        )}
      </div>
    </div>
  );
}
