-- Add latitude and longitude columns to items table for radius-based filtering
-- Run this in Supabase SQL Editor

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'latitude') THEN
    ALTER TABLE public.items ADD COLUMN latitude numeric(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'longitude') THEN
    ALTER TABLE public.items ADD COLUMN longitude numeric(10,7);
  END IF;
END $$;
