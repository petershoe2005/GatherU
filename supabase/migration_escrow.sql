-- ============================================
-- GatherU Escrow/Deposit Payment Migration
-- Run this in the Supabase SQL Editor
-- ============================================

-- Add deposit_percentage to items
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS deposit_percentage int DEFAULT 10;

-- Add stripe_account_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text;

-- Create escrow_transactions table
CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  payment_intent_id text NOT NULL,
  deposit_amount numeric(10,2) NOT NULL,
  full_price numeric(10,2) NOT NULL,
  deposit_percentage int NOT NULL DEFAULT 10,
  status text DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'forfeited')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own escrow transactions"
  ON public.escrow_transactions FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Authenticated users can create escrow transactions"
  ON public.escrow_transactions FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own escrow transactions"
  ON public.escrow_transactions FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
