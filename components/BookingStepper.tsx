"use client";

import { useState, useEffect } from 'react';
import { Draft } from '@/types';
import { Truck, MapPin, Package, CheckCircle, Upload } from 'lucide-react';

interface Props {
  draft: Draft;
  updateDraft: (updates: Partial<Draft>) => void;
  bookShipment: () => void;
}

export default function BookingStepper({ draft, updateDraft, bookShipment }: Props) {
  const [rates, setRates] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleNext = () => updateDraft({ step: draft.step + 1 });
  const handlePrev = () => updateDraft({ step: Math.max(1, draft.step - 1) });

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const res = await fetch('/api/rates/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weightKg: draft.parcel.weightKg,
          lengthCm: draft.parcel.lengthCm,
          widthCm: draft.parcel.widthCm,
          heightCm: draft.parcel.heightCm,
          senderZip: draft.sender.zip,
          recipientZip: draft.recipient.zip
        })
      });
      const data = await res.json();
      setRates(data.tiers || []);
      if (draft.step === 2) handleNext();
    } catch (e) {
      console.error(e);
    }
    setLoadingRates(false);
  };

  const handleAiExtract = async () => {
    if (!prompt.trim()) {
      alert("Please enter a package description to extract details from (e.g., '5kg box 30x20x15cm').");
      return;
    }

    setExtracting(true);
    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });
      const resData = await res.json();
      
      if (resData.success) {
        const { sender, recipient, parcel } = resData.data;
        updateDraft({
          sender: { 
            ...draft.sender, 
            city: sender?.city || draft.sender.city,
            name: sender?.name || draft.sender.name,
            zip: sender?.zip || draft.sender.zip,
            address: sender?.address || draft.sender.address
          },
          recipient: { 
            ...draft.recipient, 
            city: recipient?.city || draft.recipient.city,
            name: recipient?.name || draft.recipient.name,
            zip: recipient?.zip || draft.recipient.zip,
            address: recipient?.address || draft.recipient.address
          },
          parcel: {
            weightKg: parcel?.weightKg || draft.parcel.weightKg,
            lengthCm: parcel?.lengthCm || draft.parcel.lengthCm,
            widthCm: parcel?.widthCm || draft.parcel.widthCm,
            heightCm: parcel?.heightCm || draft.parcel.heightCm,
          }
        });
        setPrompt('');
      } else {
        alert("Extraction failed: " + resData.error);
      }
    } catch (e) {
      console.error(e);
    }
    setExtracting(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-6">
      <div className="flex border-b border-gray-200">
        {[
          { step: 1, label: 'Origin & Dest', icon: MapPin },
          { step: 2, label: 'Package', icon: Package },
          { step: 3, label: 'Rates', icon: Truck },
          { step: 4, label: 'Review', icon: CheckCircle }
        ].map((s) => (
          <div key={s.step} className={`flex-1 p-4 text-center border-b-2 flex flex-col items-center justify-center gap-1 ${draft.step === s.step ? 'border-[#FFB500] text-[#351C15] font-bold bg-amber-50' : draft.step > s.step ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'}`}>
            <s.icon size={20} />
            <span className="text-xs uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="p-8">
        {draft.step <= 2 && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-8">
            <h4 className="font-semibold text-amber-800 mb-2 flex items-center"><Package className="mr-2" size={18} /> AI Magic Fill</h4>
            <div className="flex gap-2">
              <input 
                className="flex-1 p-2 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 outline-none" 
                placeholder="Paste an email or text (e.g. '5kg box 30x20x15cm going from NYC to LA')" 
                value={prompt} 
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiExtract()}
              />
              <button onClick={handleAiExtract} disabled={extracting} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap">
                {extracting ? 'Extracting...' : '✨ Magic Extract'}
              </button>
            </div>
            <p className="text-xs text-amber-700 mt-2">Skip manual entry! Paste a description and AI will fill out both Origin & Destination and Package details.</p>
          </div>
        )}

        {draft.step === 1 && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-[#351C15] flex items-center"><MapPin className="mr-2" size={18} /> Sender Details</h3>
              <div className="space-y-3">
                <input className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FFB500] outline-none" placeholder="Name" value={draft.sender.name} onChange={e => updateDraft({ sender: { ...draft.sender, name: e.target.value } })} />
                <input className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FFB500] outline-none" placeholder="Address" value={draft.sender.address} onChange={e => updateDraft({ sender: { ...draft.sender, address: e.target.value } })} />
                <div className="flex gap-2">
                  <input className="w-2/3 p-2 border rounded focus:ring-2 focus:ring-[#FFB500] outline-none" placeholder="City" value={draft.sender.city} onChange={e => updateDraft({ sender: { ...draft.sender, city: e.target.value } })} />
                  <input className="w-1/3 p-2 border rounded focus:ring-2 focus:ring-[#FFB500] outline-none" placeholder="ZIP" value={draft.sender.zip} onChange={e => updateDraft({ sender: { ...draft.sender, zip: e.target.value } })} />
                </div>
                <input className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FFB500] outline-none" placeholder="Email" value={draft.sender.email} onChange={e => updateDraft({ sender: { ...draft.sender, email: e.target.value } })} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-[#351C15] flex items-center"><MapPin className="mr-2" size={18} /> Recipient Details</h3>
              <div className="space-y-3">
                <input className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FFB500] outline-none" placeholder="Name" value={draft.recipient.name} onChange={e => updateDraft({ recipient: { ...draft.recipient, name: e.target.value } })} />
                <input className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FFB500] outline-none" placeholder="Address" value={draft.recipient.address} onChange={e => updateDraft({ recipient: { ...draft.recipient, address: e.target.value } })} />
                <div className="flex gap-2">
                  <input className="w-2/3 p-2 border rounded focus:ring-2 focus:ring-[#FFB500] outline-none" placeholder="City" value={draft.recipient.city} onChange={e => updateDraft({ recipient: { ...draft.recipient, city: e.target.value } })} />
                  <input className="w-1/3 p-2 border rounded focus:ring-2 focus:ring-[#FFB500] outline-none" placeholder="ZIP" value={draft.recipient.zip} onChange={e => updateDraft({ recipient: { ...draft.recipient, zip: e.target.value } })} />
                </div>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button onClick={handleNext} className="bg-[#351C15] text-white px-6 py-2 rounded font-medium hover:bg-[#4a2b22] transition">Next: Package Details</button>
            </div>
          </div>
        )}

        {draft.step === 2 && (
          <div className="space-y-6">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
                <input type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FFB500]" value={draft.parcel.weightKg || ''} onChange={e => updateDraft({ parcel: { ...draft.parcel, weightKg: parseFloat(e.target.value) } })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Length (cm)</label>
                <input type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FFB500]" value={draft.parcel.lengthCm || ''} onChange={e => updateDraft({ parcel: { ...draft.parcel, lengthCm: parseFloat(e.target.value) } })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Width (cm)</label>
                <input type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FFB500]" value={draft.parcel.widthCm || ''} onChange={e => updateDraft({ parcel: { ...draft.parcel, widthCm: parseFloat(e.target.value) } })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Height (cm)</label>
                <input type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FFB500]" value={draft.parcel.heightCm || ''} onChange={e => updateDraft({ parcel: { ...draft.parcel, heightCm: parseFloat(e.target.value) } })} />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={handlePrev} className="px-6 py-2 border border-gray-300 rounded font-medium text-gray-600 hover:bg-gray-50 transition">Back</button>
              <button onClick={fetchRates} disabled={loadingRates} className="bg-[#351C15] text-white px-6 py-2 rounded font-medium hover:bg-[#4a2b22] transition disabled:opacity-70">
                {loadingRates ? 'Calculating...' : 'Get Rates'}
              </button>
            </div>
          </div>
        )}

        {draft.step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4 text-[#351C15]">Select UPS Service</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {rates.map(tier => (
                <div 
                  key={tier.id} 
                  onClick={() => updateDraft({ selectedTier: tier })}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${draft.selectedTier?.id === tier.id ? 'border-[#FFB500] bg-amber-50 shadow-md' : 'border-gray-200 hover:border-amber-300 hover:shadow-sm'}`}
                >
                  {tier.tag && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold mb-2 inline-block">{tier.tag}</span>}
                  <h4 className="font-bold text-[#351C15] text-lg">{tier.name}</h4>
                  <div className="text-2xl font-black text-[#FFB500] my-2">${tier.cost.toFixed(2)}</div>
                  <div className="text-sm text-gray-600 mb-1 flex items-center"><Truck size={14} className="mr-1" /> {tier.speed}</div>
                  <div className="text-xs text-emerald-600 mt-2 flex items-center bg-emerald-50 w-fit px-2 py-1 rounded">
                    🌱 {tier.carbonKg}kg CO₂
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={handlePrev} className="px-6 py-2 border border-gray-300 rounded font-medium text-gray-600 hover:bg-gray-50 transition">Back</button>
              <button 
                onClick={handleNext} 
                disabled={!draft.selectedTier}
                className="bg-[#351C15] text-white px-6 py-2 rounded font-medium hover:bg-[#4a2b22] transition disabled:opacity-50"
              >
                Review Shipment
              </button>
            </div>
          </div>
        )}

        {draft.step === 4 && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 grid md:grid-cols-2 gap-6 relative">
              <div className="absolute top-4 right-4 opacity-10">
                <Package size={100} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">From</h4>
                <div className="font-medium">{draft.sender.name}</div>
                <div className="text-sm text-gray-600">{draft.sender.address}, {draft.sender.city} {draft.sender.zip}</div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To</h4>
                <div className="font-medium">{draft.recipient.name}</div>
                <div className="text-sm text-gray-600">{draft.recipient.address}, {draft.recipient.city} {draft.recipient.zip}</div>
              </div>
              <div className="border-t border-gray-200 pt-4 md:col-span-2 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Service</h4>
                  <div className="font-bold text-[#351C15] flex items-center"><Truck className="mr-2 text-[#FFB500]" size={18} /> {draft.selectedTier?.name}</div>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total</h4>
                  <div className="font-black text-2xl text-[#351C15]">${draft.selectedTier?.cost?.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={handlePrev} className="px-6 py-2 border border-gray-300 rounded font-medium text-gray-600 hover:bg-gray-50 transition">Back</button>
              <button 
                onClick={bookShipment}
                className="bg-[#FFB500] text-[#351C15] px-8 py-3 rounded-lg font-bold text-lg shadow-lg hover:bg-amber-400 hover:scale-105 transition-all flex items-center"
              >
                <CheckCircle className="mr-2" /> Book & Generate Label
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
