"use client";

import { useState, useRef } from 'react';
import { Camera, Upload, ScanLine } from 'lucide-react';
import { Draft } from '@/types';

interface Props {
  draft: Draft;
  updateDraft: (updates: Partial<Draft>) => void;
}

export default function MobileScanner({ draft, updateDraft }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      setScanning(true);

      try {
        const res = await fetch('/api/ai/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: base64.split(',')[1],
            prompt: "Extract the estimated dimensions (lengthCm, widthCm, heightCm) and weightKg of this parcel."
          })
        });
        const data = await res.json();
        
        updateDraft({
          parcel: {
            weightKg: data.weightKg || draft.parcel.weightKg,
            lengthCm: data.lengthCm || draft.parcel.lengthCm,
            widthCm: data.widthCm || draft.parcel.widthCm,
            heightCm: data.heightCm || draft.parcel.heightCm,
          }
        });
      } catch (e) {
        console.error(e);
      }
      setScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-md w-full mx-auto h-[800px] max-h-screen bg-black text-white relative rounded-[2.5rem] border-8 border-gray-800 overflow-hidden shadow-2xl flex flex-col">
      <div className="absolute top-0 w-full h-6 flex justify-center z-20">
        <div className="w-1/3 h-full bg-gray-800 rounded-b-2xl"></div>
      </div>
      
      <div className="flex-1 relative flex flex-col">
        {!image ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
            <Camera size={64} className="text-gray-500 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Scan Parcel</h2>
            <p className="text-gray-400 mb-8">Take a photo of your box and our AI will estimate its dimensions and weight automatically.</p>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#FFB500] text-[#351C15] w-full py-4 rounded-full font-bold text-lg flex items-center justify-center"
            >
              <Upload className="mr-2" /> Select Image
            </button>
          </div>
        ) : (
          <div className="flex-1 relative">
            <img src={image} className="w-full h-full object-cover opacity-60" alt="Scanned parcel" />
            
            {scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <ScanLine size={80} className="text-[#FFB500] animate-ping" />
                <div className="mt-4 bg-black/70 px-4 py-2 rounded-full font-mono text-sm border border-[#FFB500]/50 text-[#FFB500]">
                  Analyzing Dimensions...
                </div>
              </div>
            )}

            {!scanning && (
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-20">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl mb-4">
                  <h3 className="text-sm text-gray-300 font-medium mb-2 uppercase tracking-wider">Estimated Specs</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-400">Dimensions</div>
                      <div className="font-mono text-lg">{draft.parcel.lengthCm}x{draft.parcel.widthCm}x{draft.parcel.heightCm} cm</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Weight</div>
                      <div className="font-mono text-lg">{draft.parcel.weightKg} kg</div>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setImage(null)}
                  className="w-full border-2 border-white/30 py-3 rounded-full font-bold hover:bg-white/10 transition"
                >
                  Retake Photo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
