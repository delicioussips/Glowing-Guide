import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const fetchOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ ...r.data, id: r.id, _rowid: r.id }));
};

export const insertOrder = async (order) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{ id: order.id, data: order }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateOrder = async (order) => {
  const { error } = await supabase
    .from('orders')
    .update({ data: order })
    .eq('id', order.id);
  if (error) throw error;
};

// ─── RECEIVING ────────────────────────────────────────────────────────────────
export const fetchReceiving = async () => {
  const { data, error } = await supabase
    .from('receiving')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ ...r.data, id: r.id }));
};

export const insertReceiving = async (record) => {
  const { error } = await supabase
    .from('receiving')
    .insert([{ id: record.id, data: record }]);
  if (error) throw error;
};

export const updateReceiving = async (record) => {
  const { error } = await supabase
    .from('receiving')
    .update({ data: record })
    .eq('id', record.id);
  if (error) throw error;
};

// ─── INVENTORY ADJUSTMENTS ───────────────────────────────────────────────────
export const fetchAdjustments = async () => {
  const { data, error } = await supabase
    .from('inv_adjustments')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(r => r.data);
};

export const insertAdjustment = async (adj) => {
  const { error } = await supabase
    .from('inv_adjustments')
    .insert([{ data: adj }]);
  if (error) throw error;
};

// ─── CUPPING ──────────────────────────────────────────────────────────────────
export const fetchCupping = async () => {
  const { data, error } = await supabase
    .from('cupping')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ ...r.data, id: r.id }));
};

export const insertCupping = async (record) => {
  const { error } = await supabase
    .from('cupping')
    .insert([{ id: record.id, data: record }]);
  if (error) throw error;
};

export const updateCupping = async (record) => {
  const { error } = await supabase
    .from('cupping')
    .update({ data: record })
    .eq('id', record.id);
  if (error) throw error;
};

// ─── REAL-TIME SUBSCRIPTIONS ─────────────────────────────────────────────────
// Call this once on app load — fires callback whenever any employee changes data
export const subscribeAll = (onOrdersChange, onReceivingChange, onAdjChange, onCuppingChange) => {
  const channel = supabase
    .channel('crm-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },       () => onOrdersChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'receiving' },     () => onReceivingChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_adjustments'},() => onAdjChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cupping' },       () => onCuppingChange())
    .subscribe();
  return () => supabase.removeChannel(channel); // call this to unsubscribe
};
