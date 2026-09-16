"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Draft } from '@/types';

interface Props {
  draft: Draft;
  updateDraft: (updates: Partial<Draft>) => void;
}

export default function WhatsAppCopilot({ draft, updateDraft }: Props) {
  const [messages, setMessages] = useState<{role: 'bot'|'user', text: string}[]>([
    { role: 'bot', text: 'Hi! I am the UPS WhatsApp Copilot. Where are you shipping to?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setIsTyping(true);

    // Call AI to extract details from chat
    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      const resData = await res.json();
      
      let botReply = "Got it! ";
      const updates: Partial<Draft> = {};
      let hasUpdate = false;
      let parcelUpdates: any = { ...draft.parcel };
      let parcelChanged = false;
      
      if (resData.success && resData.data) {
        const { sender, recipient, parcel } = resData.data;

        if (recipient?.city) {
          botReply += `Destination: ${recipient.city}. `;
          updates.recipient = { ...draft.recipient, city: recipient.city };
          hasUpdate = true;
        }
        if (sender?.city) {
          botReply += `Origin: ${sender.city}. `;
          updates.sender = { ...draft.sender, city: sender.city };
          hasUpdate = true;
        }
        if (parcel?.weightKg && parcel.weightKg !== 1) { // 1 is our new fallback default
          botReply += `Weight: ${parcel.weightKg}kg. `;
          parcelUpdates.weightKg = parcel.weightKg;
          parcelChanged = true;
        }
        if (parcel?.lengthCm && parcel.lengthCm !== 1) {
          botReply += `Dimensions: ${parcel.lengthCm}x${parcel.widthCm}x${parcel.heightCm}cm. `;
          parcelUpdates.lengthCm = parcel.lengthCm;
          parcelUpdates.widthCm = parcel.widthCm;
          parcelUpdates.heightCm = parcel.heightCm;
          parcelChanged = true;
        }

        if (parcelChanged) {
          updates.parcel = parcelUpdates;
          hasUpdate = true;
        }
      }

      if (hasUpdate) {
        updateDraft(updates);
        botReply += "I've updated the draft. Anything else?";
      } else {
        botReply = "I couldn't quite extract details. Could you specify destination city, package weight, or dimensions (LxWxH)?";
      }

      setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I ran into an error processing that.' }]);
    }
    
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#e5ddd5] max-w-md w-full mx-auto border-x border-gray-300 shadow-xl relative">
      <div className="bg-[#075e54] text-white p-4 flex items-center shadow-md z-10">
        <div className="bg-white rounded-full p-1 mr-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1024px-WhatsApp.svg.png" className="w-8 h-8 object-contain" alt="WA" />
        </div>
        <div>
          <h3 className="font-semibold">UPS Nexus AI</h3>
          <p className="text-xs text-white/70">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 shadow-sm text-sm ${msg.role === 'user' ? 'bg-[#dcf8c6] text-black rounded-tr-none' : 'bg-white text-black rounded-tl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-3 rounded-tl-none shadow-sm text-gray-500 text-xs flex gap-1">
              <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-[#f0f0f0] p-3 flex items-center gap-2">
        <input 
          className="flex-1 bg-white rounded-full py-2 px-4 outline-none text-sm"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          className="bg-[#00a884] text-white p-2 rounded-full hover:bg-[#008f6f] transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
