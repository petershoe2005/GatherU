-- Add show_nearby column to items table
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS show_nearby boolean DEFAULT false;
