import { Navigate, useLocation } from 'react-router-dom';
import { PaymentCenter } from '@/features/payment/payment-center';
import { legacyPaymentPath } from '@/features/payment/payment-routes';
import { BranchPayments } from '@/features/payment/branch-payments';
export function BillingPage({ route }: { route: string }) {
  const location = useLocation(),
    redirect = legacyPaymentPath('/' + route, location.search);
  if (route === 'super/branches/payments') return <BranchPayments />;
  return redirect ? <Navigate to={redirect} replace /> : <PaymentCenter />;
}
