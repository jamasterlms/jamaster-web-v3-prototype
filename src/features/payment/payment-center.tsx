import { initialPaymentIds } from './payment-selection-model';
import { useEffect, useRef, useState } from 'react';
import { PrototypeToolsSection, usePrototypeTools } from '@/features/prototype/prototype-tools';
import { BulkActionBar } from '@/components/shared/bulk-action-bar';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { PageHeading, IconButton } from '@/components/shared/primitives';
import { SearchField } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { normalize } from '@/lib/format';
import { usePaymentResource, usePaymentService } from './payment-provider';
import { PaymentNotice, PaymentStatusBadge, PaymentConfirm } from './payment-ui';
import {
  money,
  paymentDate,
  paymentTotals,
  selectedObligations,
  sourceLabels,
  mergeHistory,
  type Obligation,
  type PaymentSource,
  type PaymentLink,
} from './payment-model';
import { paymentError, type HistoryPage } from './payment-service';

import { PrototypePaymentControls } from './prototype-payment-controls';

export function PaymentCenter() {
  const service = usePaymentService(),
    navigate = useNavigate(),
    [params, setParams] = useSearchParams();
  const center = usePaymentResource('payment-center', async () => {
    const scope = await service.scope();
    const [access, obligations, active] = await Promise.all([
      scope.sourceType === 'STUDENT_INSTALLMENT'
        ? Promise.resolve({ blocked: false, action: 'NONE', panelPath: scope.panelPath })
        : service.access(),
      service.obligations(),
      service.active(),
    ]);
    return { scope, access, obligations, active };
  });
  const source = center.data?.scope.sourceType;
  const mode =
    params.get('tab') === 'history'
      ? 'history'
      : params.get('tab') === 'cards' && source !== 'STUDENT_INSTALLMENT'
        ? 'cards'
        : 'active';
  const [confirmReset, setConfirmReset] = useState(false);
  const prototypeTools = usePrototypeTools();
  const pageRoot = useRef<HTMLDivElement>(null);
  const [ids, setIds] = useState<string[]>(() => params.getAll('id')),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState('');
  const inFlight = useRef(false),
    selectionService = useRef(service),
    selectionApplied = useRef(false),
    items = center.data?.obligations.items || [];
  const selected = selectedObligations(items, ids),
    totals = paymentTotals(selected);
  const availableIds = items.map((item) => item.sourceId).join('|');
  useEffect(() => {
    if (selectionService.current === service) return;
    selectionService.current = service;
    selectionApplied.current = false;
    setIds([]);
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        next.delete('id');
        next.delete('selection');
        return next;
      },
      { replace: true },
    );
  }, [service, setParams]);
  useEffect(() => {
    if (center.data)
      setIds((old) =>
        old.filter((id) => center.data!.obligations.items.some((item) => item.sourceId === id)),
      );
  }, [availableIds, center.data]);
  const select = (next: string[]) => {
    selectionApplied.current = true;
    setIds(next);
    setParams(
      (old) => {
        const p = new URLSearchParams(old);
        p.delete('id');
        p.set('selection', next.length ? 'custom' : 'none');
        next.forEach((id) => p.append('id', id));
        return p;
      },
      { replace: true },
    );
  };
  useEffect(() => {
    setIds(params.getAll('id'));
  }, [params]);
  useEffect(() => {
    if (
      selectionApplied.current ||
      !center.data ||
      center.loading ||
      center.error ||
      center.data.active?.status === 'PROCESSING' ||
      source === 'STUDENT_INSTALLMENT'
    )
      return;
    select(initialPaymentIds(params, center.data.obligations.items));
  }, [center.data, center.loading, center.error, source, availableIds, params]);
  const begin = async () => {
    if (
      inFlight.current ||
      !selected.length ||
      totals.length !== 1 ||
      !center.data ||
      center.error ||
      center.loading ||
      center.data.active?.status === 'PROCESSING' ||
      source === 'STUDENT_INSTALLMENT'
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setActionError('');
    try {
      const link = await service.create(selected.map((item) => item.sourceId));
      void navigate('/payment/' + encodeURIComponent(link.token));
    } catch (error) {
      setActionError(paymentError(error));
      center.refresh();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="payment-page" ref={pageRoot} tabIndex={-1}>
      <PageHeading
        title="Ödemeler"
        description="Ödemelerinizi, kayıtlı kartlarınızı ve geçmiş işlemlerinizi tek yerden yönetin."
      >
        <div className="payment-heading-actions">
          {(!service.configured || (center.data && !center.data.access.blocked)) && (
            <Button variant="outline" asChild>
              <Link to={center.data?.scope.panelPath || '/admin/dashboard'}>
                <Icon name="arrow-left" />
                Panele dön
              </Link>
            </Button>
          )}
          <IconButton
            icon="refresh-cw"
            label="Ödeme bilgilerini yenile"
            disabled={center.loading || busy}
            onClick={center.refresh}
          />
        </div>
      </PageHeading>
      <PrototypePaymentControls selectContext />
      {service.prototype && (
        <>
          <PrototypeToolsSection title="Ödeme verileri">
            <Button
              variant="ghost"
              onClick={() => {
                prototypeTools.close();
                setConfirmReset(true);
              }}
            >
              Ödeme denemesini başa al
            </Button>
          </PrototypeToolsSection>
          <PaymentConfirm
            title="Ödeme denemesi sıfırlansın mı?"
            description="Deneme işlemleri, kaydettiğiniz adresler ve deneme kartları başlangıç durumuna dönecek."
            open={confirmReset}
            busy={false}
            onClose={() => setConfirmReset(false)}
            onConfirm={() => {
              service.prototype!.reset();
              setIds([]);
              setParams({}, { replace: true });
              setConfirmReset(false);
              setActionError('');
              center.refresh();
            }}
          />
        </>
      )}
      <div className="payment-context">
        <Icon name="building2" />
        {source ? sourceLabels[source] : 'Ödeme merkezi'}
        <span>Adres · Ödeme yöntemi · Kontrol</span>
      </div>
      {center.data?.access.blocked && (
        <PaymentNotice title="Çalışma alanınızın ödemesi bekleniyor">
          Erişimi yeniden açmak için bekleyen ödemeleri tamamlayın. Ödeme sonucu doğrulandığında
          erişim durumu güncellenir.
        </PaymentNotice>
      )}
      <div className="payment-stats">
        <Card className="payment-stat payment-stat-accent">
          <span>
            <Icon name="wallet" />
            Bekleyen toplam
          </span>
          <strong>
            {center.data
              ? paymentTotals(items)
                  .map((t) => money(t.amount, t.currency))
                  .join(' + ') || money(0, center.data.obligations.currency)
              : '—'}
          </strong>
          <small>
            {center.data ? `${items.length} ödeme kalemi` : 'Doğrulanmış tutar bekleniyor'}
          </small>
        </Card>
        <Card className="payment-stat">
          <span>
            <Icon name="calendar-days" />
            En yakın son ödeme
          </span>
          <strong>
            {items.length
              ? paymentDate(
                  [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0].dueDate,
                )
              : '—'}
          </strong>
          <small>
            {center.data
              ? items.length
                ? 'Ödeme takviminiz'
                : 'Bekleyen ödeme bulunmuyor'
              : 'Ödeme takvimi bekleniyor'}
          </small>
        </Card>
        <Card className="payment-stat">
          <span>
            <Icon name="shield-check" />
            Aktif işlem
          </span>
          <strong>
            {center.data?.active ? (
              <PaymentStatusBadge status={center.data.active.status} />
            ) : center.data ? (
              'İşlem yok'
            ) : (
              '—'
            )}
          </strong>
          <small>
            {center.data?.active
              ? 'Kaldığınız yerden devam edin'
              : 'İşlemleriniz burada takip edilir'}
          </small>
        </Card>
      </div>
      {center.error && (
        <PaymentNotice retry={center.refresh} loading={center.loading}>
          {center.error}
        </PaymentNotice>
      )}
      {!center.error && center.loading && !center.data && (
        <p role="status" className="payment-inline-status">
          Ödeme bilgileriniz kontrol ediliyor.
        </p>
      )}
      <Tabs
        value={mode}
        onValueChange={(tab) =>
          setParams((old) => {
            const p = new URLSearchParams(old);
            p.set('tab', tab);
            return p;
          })
        }
      >
        <TabsList className="payment-tabs" aria-label="Ödeme görünümleri">
          <TabsTrigger value="active">Güncel ödemeler</TabsTrigger>
          {source !== 'STUDENT_INSTALLMENT' && (
            <TabsTrigger value="cards">Kayıtlı kartlar</TabsTrigger>
          )}
          <TabsTrigger value="history">Ödeme geçmişi</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <PaymentOverview
            items={items}
            active={center.data?.active || null}
            ids={selected.map((item) => item.sourceId)}
            onSelect={select}
            disabled={
              busy ||
              center.loading ||
              !!center.error ||
              !center.data ||
              center.data.active?.status === 'PROCESSING' ||
              source === 'STUDENT_INSTALLMENT'
            }
            unavailable={!!center.error || !center.data}
          />
          {source === 'STUDENT_INSTALLMENT' && (
            <PaymentNotice title="Çevrim içi ödeme kullanılamıyor">
              Öğrenci taksitlerinin çevrim içi ödemesi henüz desteklenmiyor. Ödeme seçenekleri için
              kurumunuzla iletişime geçin.
            </PaymentNotice>
          )}
          {actionError && (
            <p className="field-error" role="alert">
              {actionError}
            </p>
          )}
          <BulkActionBar
            count={selected.length}
            onClear={() => {
              select([]);
              const checkbox = Array.from(
                pageRoot.current?.querySelectorAll<HTMLButtonElement>(
                  '[role="checkbox"]:not(:disabled)',
                ) || [],
              ).find((element) => element.getClientRects().length > 0);
              (checkbox || pageRoot.current)?.focus({ preventScroll: true });
            }}
            busy={busy}
            label="Seçili ödemeler"
            summary={
              <>
                <strong>{totals.map((t) => money(t.amount, t.currency)).join(' + ') || '—'}</strong>
                {totals.length > 1 && (
                  <p role="alert">Aynı para birimindeki kalemleri birlikte seçin.</p>
                )}
              </>
            }
          >
            <Button
              disabled={
                !selected.length ||
                totals.length !== 1 ||
                busy ||
                center.loading ||
                !!center.error ||
                !center.data ||
                center.data.active?.status === 'PROCESSING' ||
                source === 'STUDENT_INSTALLMENT'
              }
              onClick={() => void begin()}
            >
              {busy ? 'İşlem hazırlanıyor' : 'Ödemeye devam et'}
              <Icon name="arrow-right" />
            </Button>
          </BulkActionBar>
        </TabsContent>
        <TabsContent value="cards">
          {source ? (
            <SavedPaymentCards source={source} />
          ) : (
            <PaymentEmpty
              icon="credit-card"
              title="Kayıtlı kartlar"
              description="Ödeme hesabınız doğrulandığında kayıtlı kartlarınız burada görünür."
            />
          )}
        </TabsContent>
        <TabsContent value="history">
          {source ? (
            <PaymentHistory />
          ) : (
            <PaymentEmpty
              icon="receipt-text"
              title="Ödeme geçmişi"
              description="Doğrulanmış geçmiş işlemleriniz burada listelenir."
            />
          )}
        </TabsContent>
      </Tabs>
      <p className="payment-footnote">
        <Icon name="shield-check" />
        Ödeme sonucu doğrulanmadan hiçbir işlem tamamlandı olarak gösterilmez.
      </p>
    </div>
  );
}
export function PaymentEmpty({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="payment-empty">
      <span>
        <Icon name={icon} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
    </Card>
  );
}
export function PaymentOverview({
  items,
  active,
  ids,
  onSelect,
  disabled,
  unavailable,
}: {
  items: Obligation[];
  active: PaymentLink | null;
  ids: string[];
  onSelect: (ids: string[]) => void;
  disabled: boolean;
  unavailable: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const query = params.get('search') || '',
    status = params.get('status') || 'all';
  const filter = (key: string, value: string) =>
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        if (!value || (key === 'status' && value === 'all')) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  const rows = items.filter(
    (item) =>
      normalize(item.title + ' ' + item.description).includes(normalize(query)) &&
      (status === 'all' || item.status === status),
  );
  const toggle = (id: string, checked: boolean) =>
    onSelect(checked ? [...new Set([...ids, id])] : ids.filter((value) => value !== id));
  const check = (item: Obligation) => (
    <Checkbox
      checked={ids.includes(item.sourceId)}
      disabled={disabled}
      aria-label={`${item.title} ödemesini seç`}
      onCheckedChange={(value) => toggle(item.sourceId, !!value)}
    />
  );
  return (
    <div className="payment-overview">
      {active && (
        <Card className="payment-active">
          <span className="payment-active-icon">
            <Icon name="wallet" />
          </span>
          <div>
            <h2>
              {active.status === 'PROCESSING'
                ? 'Ödemenizin sonucu bekleniyor'
                : 'Devam eden ödemeniz var'}
            </h2>
            <p>
              {active.items.length} kalem · {money(active.totalAmount, active.currency)}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={'/payment/' + encodeURIComponent(active.token)}>
              {active.status === 'PROCESSING' ? 'Durumu kontrol et' : 'Devam et'}
              <Icon name="arrow-up-right" />
            </Link>
          </Button>
        </Card>
      )}
      <div className="module-toolbar payment-filters">
        <SearchField
          value={query}
          onChange={(value) => filter('search', value)}
          placeholder="Açıklama veya ödeme kalemi ara"
        />
        <Select value={status} onValueChange={(value) => filter('status', value)}>
          <SelectTrigger aria-label="Ödeme durumu">
            <SelectValue placeholder="Ödeme durumu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm durumlar</SelectItem>
            {[...new Set(items.map((item) => item.status))].map((value) => (
              <SelectItem key={value} value={value}>
                <PaymentStatusBadge status={value} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(query || status !== 'all') && (
          <Button
            variant="ghost"
            onClick={() =>
              setParams(
                (old) => {
                  const next = new URLSearchParams(old);
                  next.delete('search');
                  next.delete('status');
                  return next;
                },
                { replace: true },
              )
            }
          >
            Filtreleri temizle
          </Button>
        )}
      </div>
      {items.length ? (
        <DataTable
          name="payment-obligations"
          data={rows}
          getRowId={(item) => item.sourceId}
          filterKey={query + ':' + status}
          columns={[
            {
              id: 'choose',
              enableSorting: false,
              header: () => (
                <Checkbox
                  aria-label="Filtrelenmiş ödemelerin tümünü seç"
                  disabled={disabled || !rows.length}
                  checked={
                    rows.length > 0 &&
                    (rows.every((item) => ids.includes(item.sourceId))
                      ? true
                      : rows.some((item) => ids.includes(item.sourceId))
                        ? 'indeterminate'
                        : false)
                  }
                  onCheckedChange={(value) =>
                    onSelect(
                      value
                        ? [...new Set([...ids, ...rows.map((item) => item.sourceId)])]
                        : ids.filter((id) => !rows.some((item) => item.sourceId === id)),
                    )
                  }
                />
              ),
              cell: ({ row }) => check(row.original),
            },
            {
              accessorKey: 'title',
              header: 'Ödeme kalemi',
              cell: ({ row }) => (
                <div className="payment-description">
                  <strong>{row.original.title}</strong>
                  <small>{row.original.description}</small>
                </div>
              ),
            },
            {
              accessorKey: 'dueDate',
              header: 'Son ödeme',
              cell: ({ row }) => paymentDate(row.original.dueDate),
            },
            {
              accessorKey: 'amount',
              header: 'Tutar',
              cell: ({ row }) => (
                <strong>{money(row.original.amount, row.original.currency)}</strong>
              ),
            },
            {
              accessorKey: 'status',
              header: 'Durum',
              cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
            },
          ]}
          mobileCard={(item) => (
            <div className="payment-mobile-obligation">
              <div>
                {check(item)}
                <strong>{item.title}</strong>
                <PaymentStatusBadge status={item.status} />
              </div>
              <p>{item.description}</p>
              <footer>
                <small>{paymentDate(item.dueDate)}</small>
                <b>{money(item.amount, item.currency)}</b>
              </footer>
            </div>
          )}
        />
      ) : (
        <PaymentEmpty
          icon="receipt-text"
          title={unavailable ? 'Ödeme kalemleri bekleniyor' : 'Bekleyen ödeme bulunmuyor'}
          description={
            unavailable
              ? 'Hesabınıza ait ödemeler doğrulandığında tutarları inceleyip ödemek istediklerinizi seçebilirsiniz.'
              : 'Güncel ödemeleriniz tamamlanmış. Geçmiş işlemlerinizi ödeme geçmişinden inceleyebilirsiniz.'
          }
        />
      )}
    </div>
  );
}
function SavedPaymentCards({ source }: { source: PaymentSource }) {
  const service = usePaymentService(),
    resource = usePaymentResource('cards:' + source, () => service.cards(source));
  const [removing, setRemoving] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const inFlight = useRef(false);
  const mutate = async (action: () => Promise<unknown>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      setRemoving(null);
      resource.refresh();
    } catch (e) {
      setError(paymentError(e));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="payment-card-section">
      <p className="payment-section-intro">
        Kayıtlı kartlarınızı yönetin. Yeni kartınızı ödeme sırasında kaydedebilirsiniz.
      </p>
      {resource.error && (
        <PaymentNotice retry={resource.refresh} loading={resource.loading}>
          {resource.error}
        </PaymentNotice>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="payment-saved-cards">
        {resource.data?.map((card) => (
          <Card key={card.id} className="payment-saved-card">
            <div>
              <Icon name="credit-card" />
              {card.isDefault && <PaymentStatusBadge status="Varsayılan" />}
              {!card.isActive && <PaymentStatusBadge status="Pasif" />}
            </div>
            <h2>{card.cardAlias || 'Kayıtlı kart'}</h2>
            <p className="payment-card-number">•••• •••• •••• {card.lastFourDigits}</p>
            <footer>
              <span>{card.cardAssociation || 'Banka kartı'}</span>
              <div>
                <IconButton
                  icon="star"
                  label={`${card.cardAlias || 'Kart'} varsayılan yap`}
                  disabled={
                    busy || resource.loading || !!resource.error || card.isDefault || !card.isActive
                  }
                  onClick={() => void mutate(() => service.setDefault(source, card.id))}
                />
                <IconButton
                  icon="trash2"
                  label={`${card.cardAlias || 'Kart'} sil`}
                  disabled={busy || resource.loading || !!resource.error}
                  onClick={() => setRemoving(card.id)}
                />
              </div>
            </footer>
          </Card>
        ))}
      </div>
      {!resource.data?.length && (
        <PaymentEmpty
          icon="credit-card"
          title={
            resource.loading
              ? 'Kartlar kontrol ediliyor'
              : resource.error
                ? 'Kartlar alınamadı'
                : 'Kayıtlı kartınız bulunmuyor'
          }
          description="Ödeme adımında yeni kart bilgilerinizi girebilir, sonraki işlemler için kaydetmeyi seçebilirsiniz."
        />
      )}
      <PaymentConfirm
        open={!!removing}
        busy={busy}
        title="Kayıtlı kart silinsin mi?"
        description="Kart sonraki ödemeler için kullanılamaz. Geçmiş ödemeleriniz etkilenmez."
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) void mutate(() => service.removeCard(source, removing));
        }}
      />
    </div>
  );
}
function PaymentHistory() {
  const service = usePaymentService();
  const [page, setPage] = useState(1),
    [accumulated, setAccumulated] = useState<Obligation[]>([]);
  const resource = usePaymentResource<HistoryPage>('payment-history:' + page, () =>
    service.history(page),
  );
  useEffect(() => {
    if (resource.data) setAccumulated((old) => mergeHistory(old, resource.data!.items));
  }, [resource.data]);
  const items = mergeHistory(accumulated, resource.data?.items || []);
  return (
    <div className="payment-history">
      <p className="payment-section-intro">Geçmiş ödeme kalemleri ve doğrulanmış durumları.</p>
      {resource.error && (
        <PaymentNotice retry={resource.refresh} loading={resource.loading}>
          {resource.error}
        </PaymentNotice>
      )}
      <DataTable
        name="payment-history"
        data={items}
        getRowId={(row) => row.sourceId}
        columns={[
          {
            accessorKey: 'title',
            header: 'Açıklama',
            cell: ({ row }) => (
              <div className="payment-description">
                <strong>{row.original.title}</strong>
                <small>{row.original.description}</small>
              </div>
            ),
          },
          {
            accessorKey: 'dueDate',
            header: 'Son ödeme tarihi',
            cell: ({ row }) => paymentDate(row.original.dueDate),
          },
          {
            accessorKey: 'amount',
            header: 'Tutar',
            cell: ({ row }) => money(row.original.amount, row.original.currency),
          },
          {
            accessorKey: 'status',
            header: 'Durum',
            cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
          },
        ]}
        unavailable={
          !items.length
            ? resource.loading
              ? 'Geçmiş işlemler kontrol ediliyor.'
              : resource.error
                ? 'Geçmiş işlemler alınamadı.'
                : undefined
            : undefined
        }
        mobileCard={(item) => (
          <div className="payment-mobile-obligation">
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <footer>
              <span>{paymentDate(item.dueDate)}</span>
              <b>{money(item.amount, item.currency)}</b>
            </footer>
            <PaymentStatusBadge status={item.status} />
          </div>
        )}
      />
      {resource.data && page < resource.data.totalPages && (
        <Button
          variant="outline"
          disabled={resource.loading || !!resource.error}
          onClick={() => setPage((value) => value + 1)}
        >
          Daha fazla yükle
        </Button>
      )}
    </div>
  );
}
