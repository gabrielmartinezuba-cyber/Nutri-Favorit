'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type OrderStatus = 'pendiente' | 'en_preparacion' | 'entregado' | 'cancelado';

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  orderTotal: number,
  userId: string | null,
  currentPointsAwarded: boolean
) {
  const supabase = createAdminClient();

  // 1. Update the order status
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // 2. Award points if newly delivered, not already awarded, and user exists
  if (newStatus === 'entregado' && !currentPointsAwarded && userId) {
    const puntosGanados = Math.floor(orderTotal / 1000);

    if (puntosGanados > 0) {
      // Insert points history record
      await supabase.from('points_history').insert({
        user_id: userId,
        puntos: puntosGanados,
        motivo: `Pedido entregado #${orderId.slice(0, 8)}`,
      });

      // Increment user points safely
      await supabase.rpc('increment_points', {
        row_id: userId,
        amount: puntosGanados,
      });
    }

    // Mark order as points awarded to prevent duplicates
    await supabase
      .from('orders')
      .update({ points_awarded: true })
      .eq('id', orderId);
  }

  revalidatePath('/admin');
  return { success: true };
}
