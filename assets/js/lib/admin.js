// Admin data access — direct supabase-js under is_admin() RLS (no server tier).
import { supabase } from './supabaseClient.js';

const PROGRESS = ['Antrean', 'Proses Sketsa', 'Digitalisasi', 'Revisi', 'Selesai'];
const PAYMENT = ['Belum Lunas', 'DP', 'Lunas'];

/** Validate amounts. Returns error code or null. Pure. */
export function validateAmounts(total, dp) {
  const t = Number(total || 0);
  const d = Number(dp || 0);
  if (Number.isNaN(t) || Number.isNaN(d)) return 'amount_invalid';
  if (t < 0 || d < 0) return 'amount_negative';
  if (d > t) return 'dp_exceeds_total';
  return null;
}

/** Current admin session + profile, or null if not an approved admin. */
export async function getAdminSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profile } = await supabase
    .from('admin_profiles').select('role, full_name').eq('id', session.user.id).single();
  if (!profile || !['admin', 'owner'].includes(profile.role)) return null;
  return { session, profile };
}

/** List orders (admin only — RLS enforces). */
export async function listOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(full_name, whatsapp_number)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Insert a manual order (admin). Upserts the customer first. */
export async function createManualOrder(draft) {
  const amtErr = validateAmounts(draft.total_amount, draft.dp_amount);
  if (amtErr) throw new Error(amtErr);
  if (draft.progress_status && !PROGRESS.includes(draft.progress_status)) throw new Error('invalid_progress');
  if (draft.payment_status && !PAYMENT.includes(draft.payment_status)) throw new Error('invalid_payment');

  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .upsert({ whatsapp_number: draft.whatsapp_number, full_name: draft.full_name || 'Tanpa Nama' },
            { onConflict: 'whatsapp_number' })
    .select('id').single();
  if (custErr) throw custErr;

  const { data: order, error: insErr } = await supabase
    .from('orders')
    .insert({
      customer_id: customer.id,
      brand_name: draft.brand_name,
      brand_description: draft.brief || draft.brand_description || '',
      total_amount: Number(draft.total_amount || 0),
      dp_amount: Number(draft.dp_amount || 0),
      progress_status: draft.progress_status || 'Antrean',
      payment_status: draft.payment_status || 'Belum Lunas',
    })
    .select('id').single();
  if (insErr) throw insErr;

  const orderNumber = `LKU-${new Date().getFullYear()}-${String(order.id).padStart(4, '0')}`;
  await supabase.from('orders').update({ order_number: orderNumber }).eq('id', order.id);
  return { id: order.id, orderNumber };
}

/** Update an order's editable fields (admin). */
export async function updateOrder(id, fields) {
  if (fields.progress_status && !PROGRESS.includes(fields.progress_status)) throw new Error('invalid_progress');
  if (fields.payment_status && !PAYMENT.includes(fields.payment_status)) throw new Error('invalid_payment');
  if (fields.total_amount !== undefined || fields.dp_amount !== undefined) {
    const amtErr = validateAmounts(fields.total_amount, fields.dp_amount);
    if (amtErr) throw new Error(amtErr);
  }
  const { error } = await supabase.from('orders').update(fields).eq('id', id);
  if (error) throw error;
  return true;
}

/** Delete an order (admin). */
export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export { PROGRESS, PAYMENT };
