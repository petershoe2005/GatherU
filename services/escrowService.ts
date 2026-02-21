import { supabase } from '../lib/supabase';
import { EscrowTransaction } from '../types';

export const createEscrowTransaction = async (data: {
  item_id: string;
  buyer_id: string;
  seller_id: string;
  payment_intent_id: string;
  deposit_amount: number;
  full_price: number;
  deposit_percentage: number;
}): Promise<EscrowTransaction | null> => {
  const { data: row, error } = await supabase
    .from('escrow_transactions')
    .insert({
      ...data,
      status: 'held',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating escrow transaction:', error);
    return null;
  }

  return row as EscrowTransaction;
};

export const fetchEscrowForItem = async (itemId: string): Promise<EscrowTransaction | null> => {
  const { data, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as EscrowTransaction | null;
};

export const updateEscrowStatus = async (
  id: string,
  status: 'held' | 'released' | 'refunded' | 'forfeited'
): Promise<boolean> => {
  const { error } = await supabase
    .from('escrow_transactions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
};

export const releaseEscrow = async (itemId: string): Promise<boolean> => {
  const escrow = await fetchEscrowForItem(itemId);
  if (!escrow || escrow.status !== 'held') return false;
  return updateEscrowStatus(escrow.id, 'released');
};
