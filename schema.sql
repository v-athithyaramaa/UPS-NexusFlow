-- Supabase Schema for UPS NexusFlow

CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_number VARCHAR NOT NULL,
    user_email VARCHAR,
    sender_name VARCHAR,
    sender_address VARCHAR,
    sender_city VARCHAR,
    sender_zip VARCHAR,
    recipient_name VARCHAR,
    recipient_address VARCHAR,
    recipient_city VARCHAR,
    recipient_zip VARCHAR,
    weight_kg NUMERIC,
    length_cm NUMERIC,
    width_cm NUMERIC,
    height_cm NUMERIC,
    service_tier VARCHAR,
    rate_amount NUMERIC,
    carbon_footprint_kg NUMERIC,
    status VARCHAR DEFAULT 'Order Placed',
    channel_origin VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on realtime for shipments
alter publication supabase_realtime add table public.shipments;
