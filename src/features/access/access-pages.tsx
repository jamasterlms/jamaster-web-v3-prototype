import { PollingPage } from './polling-page';
import { AuthenticationPage } from './authentication-page';
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/app/workspace-provider';
import { operationalData } from '@/data/institution';
import { identifyTeamRows } from '@/features/entities/entity-model';
import { PageHeading, IconButton, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SearchField } from '@/components/shared/feature-primitives';
import { normalize } from '@/lib/format';
import { BillingPage } from '@/features/finance/billing-page';
import { PaymentCheckout } from '@/features/payment/payment-checkout';
import { paymentToken } from '@/features/payment/payment-routes';
export function AccessPage({ route }: { route: string }) {
  const [params] = useSearchParams();
  const slug = route.split('/')[0];
  if (slug === 'branch-selection') return <BranchSelectionPage />;
  if (route === 'payment') return <BillingPage route={route} />;
  if (slug === 'payment') return <PaymentCheckout key={route} token={paymentToken(route)} />;
  if (slug === 'polling') return <PollingPage pollId={params.get('q') || ''} />;
  if (slug === 'unsubscribe')
    return (
      <>
        <PageHeading title="Bildirim tercihiniz" />
        <Card className="service-notice">
          <h2>Tercihiniz doğrulanamadı</h2>
          <p>
            Bildirim hizmeti bağlantısı kurulamadı. Aboneliğinizin durumunda bir değişiklik
            yapılmadı.
          </p>
        </Card>
      </>
    );
  if (slug === 'redirect')
    return (
      <>
        <PageHeading
          title="Oturum doğrulanamıyor"
          description="Kimlik hizmeti bağlantısı kurulamadı."
        />
        <Button asChild>
          <Link to="/login">Giriş sayfasına dön</Link>
        </Button>
      </>
    );
  return <AuthenticationPage mode={slug} />;
}
function BranchSelectionPage() {
  const { state, dispatch } = useWorkspace(),
    navigate = useNavigate();
  const [query, setQuery] = useState('');
  const branches = identifyTeamRows(
    state.moduleRows.branches || operationalData.branches.rows,
    'branches',
  ).filter((r) => normalize(r[0] + r[1]).includes(normalize(query)));
  return (
    <>
      <PageHeading
        title="Çalışma alanınızı seçin"
        description="Devam etmek istediğiniz şubeyi seçin."
      />
      <div className="module-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Şube adı veya adres ara" />
      </div>
      <div className="portal-card-grid">
        {branches.map((r) => (
          <Card key={r[5]} className="branch-selection-card">
            <h2>{r[0]}</h2>
            <p>{r[1]}</p>
            <StatusBadge>{r[4]}</StatusBadge>
            <Button
              disabled={!['Aktif', 'Askıya alındı'].includes(r[4])}
              onClick={() => {
                dispatch({ type: 'branch/set', branch: r[0] });
                navigate(r[4] === 'Askıya alındı' ? '/payment' : '/admin/dashboard');
              }}
            >
              Şubeyi aç
            </Button>
          </Card>
        ))}
      </div>
      {!branches.length && <p className="empty-inline">Aramanızla eşleşen şube bulunmuyor.</p>}
    </>
  );
}
