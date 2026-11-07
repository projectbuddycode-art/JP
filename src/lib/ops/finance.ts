export function tripProfitability(input: {
  bookings: Array<{
    confirmed_amount?: number | null;
    amount_paid?: number | null;
    amount_received?: number | null;
    refunded_amount?: number | null;
    booking_status?: string;
  }>;
  payments: Array<{ amount?: number | null }>;
  supplierCosts: Array<{ agreed_cost?: number | null; advance_paid?: number | null }>;
  expenses: Array<{ amount?: number | null }>;
}) {
  const active = input.bookings.filter((item) => item.booking_status !== "cancelled");
  const bookingValue = active.reduce((sum, item) => sum + Number(item.confirmed_amount ?? 0), 0);
  const collectedFromBookings = active.reduce(
    (sum, item) => sum + Number(item.amount_received ?? item.amount_paid ?? 0),
    0,
  );
  const collectedPayments = input.payments.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const collected = collectedPayments || collectedFromBookings;
  const refunds = active.reduce((sum, item) => sum + Number(item.refunded_amount ?? 0), 0);
  const netCollected = collected - refunds;
  const estimatedSupplier = input.supplierCosts.reduce((sum, item) => sum + Number(item.agreed_cost ?? 0), 0);
  const supplierPaid = input.supplierCosts.reduce((sum, item) => sum + Number(item.advance_paid ?? 0), 0);
  const expenses = input.expenses.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const actualCosts = expenses + supplierPaid;
  const estimatedProfit = bookingValue - estimatedSupplier - expenses;
  const actualProfit = netCollected - actualCosts;
  return {
    bookingValue,
    collected: netCollected,
    outstanding: Math.max(0, bookingValue - netCollected),
    refunds,
    estimatedSupplier,
    supplierPaid,
    supplierOutstanding: Math.max(0, estimatedSupplier - supplierPaid),
    expenses,
    actualCosts,
    estimatedProfit,
    actualProfit,
    margin: bookingValue ? actualProfit / bookingValue : 0,
  };
}
