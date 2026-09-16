"use client";

import { useState, useEffect, useCallback } from 'react';
import OmnichannelSwitcher from '@/components/OmnichannelSwitcher';
import BookingStepper from '@/components/BookingStepper';
import WhatsAppCopilot from '@/components/WhatsAppCopilot';
import MobileScanner from '@/components/MobileScanner';
import Dashboard from '@/components/Dashboard';
import { Draft } from '@/types';

// Use a debounce function to prevent spamming the draft API
function useDebounce(callback: Function, delay: number) {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  return useCallback((...args: any[]) => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => {
      callback(...args);
    }, delay));
  }, [callback, timer, delay]);
}

export default function Home() {
  const [currentView, setCurrentView] = useState('WEB_PORTAL');
  const [activeTab, setActiveTab] = useState('BOOKING'); // BOOKING or DASHBOARD
  
  const [draft, setDraft] = useState<Draft>({
    sessionToken: '',
    channelOrigin: 'WEB_PORTAL',
    step: 1,
    sender: { name: '', address: '', city: '', zip: '', email: '' },
    recipient: { name: '', address: '', city: '', zip: '' },
    parcel: { weightKg: 0, lengthCm: 0, widthCm: 0, heightCm: 0 },
    selectedTier: null,
    updatedAt: new Date().toISOString()
  });
  
  const [isOffline, setIsOffline] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initial load: either fetch existing token from URL, or local storage, or create new
  useEffect(() => {
    const initDraft = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('session');
      
      try {
        if (token) {
          const res = await fetch(`/api/draft?token=${token}`);
          if (res.ok) {
            const data = await res.json();
            if (data.draft) {
              setDraft(data.draft);
              setIsOffline(false);
              setIsInitializing(false);
              return;
            }
          }
        }
        
        // Attempt to create new draft online
        const res = await fetch('/api/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft)
        });
        
        if (res.ok) {
          const data = await res.json();
          setDraft(data.draft);
          setIsOffline(false);
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('session', data.sessionToken);
          window.history.pushState({}, '', newUrl.toString());
        } else {
          throw new Error("Server returned error");
        }
      } catch (error) {
        console.warn("Offline or network error, falling back to local storage:", error instanceof Error ? error.message : String(error));
        setIsOffline(true);
        const localDraft = localStorage.getItem('nexus_draft_offline');
        if (localDraft) {
          setDraft(JSON.parse(localDraft));
        }
      }
      setIsInitializing(false);
    };
    
    initDraft();
  }, []);

  const saveDraftToRedis = async (newDraft: Draft) => {
    try {
      const res = await fetch('/api/draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDraft)
      });
      if (!res.ok) throw new Error("500 Server Error - Offline");
      setIsOffline(false);
      localStorage.removeItem('nexus_draft_offline');
    } catch (e) {
      console.warn("Auto-save failed (offline mode activated). Saving locally:", e instanceof Error ? e.message : String(e));
      setIsOffline(true);
      localStorage.setItem('nexus_draft_offline', JSON.stringify(newDraft));
    }
  };

  const debouncedSave = useDebounce(saveDraftToRedis, 500);

  const updateDraft = (updates: Partial<Draft>) => {
    const newDraft = { ...draft, ...updates, updatedAt: new Date().toISOString() };
    setDraft(newDraft);
    debouncedSave(newDraft);
  };

  const bookShipment = async () => {
    try {
      const res = await fetch('/api/shipment/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          draft, 
          idempotencyKey: `${draft.sessionToken}-${Date.now()}` 
        })
      });
      
      if (res.ok) {
        alert("Shipment Booked successfully!");
        setActiveTab('DASHBOARD');
      } else {
        alert("Failed to book shipment.");
      }
    } catch (e) {
      console.error(e);
      alert("Error booking shipment.");
    }
  };

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] text-[#351C15]">Initializing NexusFlow...</div>;

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
      <OmnichannelSwitcher 
        currentView={currentView} 
        onViewChange={(v) => {
          setCurrentView(v);
          updateDraft({ channelOrigin: v as any });
        }} 
        sessionToken={draft.sessionToken} 
      />
      
      {isOffline && (
        <div className="bg-red-500 text-white text-center py-2 px-4 text-sm font-semibold">
          You are offline. Changes are being saved locally and will sync when you reconnect.
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex space-x-6">
          <button 
            className={`font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'BOOKING' ? 'border-[#FFB500] text-[#351C15]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('BOOKING')}
          >
            Create Shipment
          </button>
          <button 
            className={`font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'DASHBOARD' ? 'border-[#FFB500] text-[#351C15]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('DASHBOARD')}
          >
            Manage Shipments
          </button>
        </div>

        <div className="flex-1 p-6 relative overflow-y-auto">
          {activeTab === 'DASHBOARD' ? (
            <Dashboard />
          ) : (
            <>
              {currentView === 'WEB_PORTAL' && (
                <BookingStepper draft={draft} updateDraft={updateDraft} bookShipment={bookShipment} />
              )}
              
              {currentView === 'WHATSAPP' && (
                <div className="h-[80vh] flex items-center justify-center">
                  <WhatsAppCopilot draft={draft} updateDraft={updateDraft} />
                </div>
              )}
              
              {currentView === 'MOBILE_PWA' && (
                <div className="py-4">
                  <MobileScanner draft={draft} updateDraft={updateDraft} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
