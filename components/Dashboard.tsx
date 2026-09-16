"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Truck, Calendar, MapPin } from 'lucide-react';

export default function Dashboard() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipments',
        },
        (payload) => {
          setShipments((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error("Error fetching shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading shipments...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-[#351C15] mb-6 flex items-center">
        <Package className="mr-2 text-[#FFB500]" /> Recent Shipments
      </h2>
      
      {shipments.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
          No shipments booked yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {shipments.map((shipment) => (
            <div key={shipment.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between md:items-center hover:shadow-md transition">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-bold text-lg text-[#351C15]">{shipment.tracking_number}</span>
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                    {shipment.status}
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                    {shipment.channel_origin}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center text-sm text-gray-600 gap-y-2 gap-x-4 sm:gap-x-6">
                  <div className="flex items-center"><MapPin size={14} className="mr-1" /> {shipment.sender_city} → {shipment.recipient_city}</div>
                  <div className="flex items-center"><Calendar size={14} className="mr-1" /> {new Date(shipment.created_at).toLocaleDateString()}</div>
                  <div className="flex items-center"><Truck size={14} className="mr-1" /> {shipment.service_tier}</div>
                </div>
              </div>
              
              <div className="text-right border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <div className="text-sm text-gray-500 uppercase tracking-wide">Total</div>
                <div className="text-xl font-bold text-[#351C15]">${shipment.rate_amount?.toFixed(2)}</div>
                <div className="text-xs text-emerald-600 mt-1 flex justify-end items-center">
                  🌱 {shipment.carbon_footprint_kg}kg CO₂
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
