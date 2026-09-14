import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Icon } from '@/components/shared/icon';
import { money, paymentDate, statusLabels, type Obligation } from './payment-model';
import { Badge } from '@/components/ui/badge';
export function PaymentNotice({
  title = 'Bilgiler alınamadı',
  children,
  retry,
  loading = false,
}: {
  title?: string;
  children: ReactNode;
  retry?: () => void;
  loading?: boolean;
}) {
  return (
    <Card className="payment-notice" role="status">
      <Icon name="circle-alert" />
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
      {retry && (
        <Button variant="outline" onClick={retry} disabled={loading}>
          <Icon name="refresh-cw" />
          {loading ? 'Kontrol ediliyor' : 'Tekrar dene'}
        </Button>
      )}
    </Card>
  );
}
export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={`payment-status payment-status-${status.toLowerCase()}`}>
      {statusLabels[status] || status}
    </Badge>
  );
}
export function PaymentItems({ items }: { items: Obligation[] }) {
  return (
    <ul className="payment-line-items">
      {items.map((item) => (
        <li key={item.sourceId}>
          <div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <small>Son ödeme · {paymentDate(item.dueDate)}</small>
          </div>
          <b>{money(item.amount, item.currency)}</b>
        </li>
      ))}
    </ul>
  );
}
export function PaymentConfirm({
  title,
  description,
  open,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose();
      }}
    >
      <DialogContent preventOutsideClose>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? 'İşleniyor' : 'Onayla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
