import { useCallback, useEffect, useState } from 'react';
import { Copy, Download, ExternalLink, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dateTR } from '@/lib/format';
import { eventDate } from '@/lib/calendar';
import type { CalendarEvent } from '@/types';

export function pollingPreviewPath(event: Pick<CalendarEvent, 'id' | 'pollId'>) {
  return '/polling?' + new URLSearchParams({ q: `preview-${event.id}` });
}
function PollingCode({
  event,
  onReady,
}: {
  event: CalendarEvent;
  onReady: (id: number, ready: boolean) => void;
}) {
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const path = pollingPreviewPath(event);
  const url =
    typeof window !== 'undefined' && ['http:', 'https:'].includes(window.location.protocol)
      ? window.location.origin + path
      : '';
  useEffect(() => {
    let cancelled = false;
    setImage('');
    setError('');
    onReady(event.id, false);
    if (!url) {
      setError('QR kodları için uygulamayı yayın bağlantısından açın.');
      return;
    }
    import('qrcode')
      .then((qr) => qr.toDataURL(url, { width: 400, margin: 4, errorCorrectionLevel: 'M' }))
      .then((data) => {
        if (!cancelled) {
          setImage(data);
          onReady(event.id, true);
        }
      })
      .catch(() => {
        if (!cancelled) setError('QR kodu oluşturulamadı.');
      });
    return () => {
      cancelled = true;
    };
  }, [url, event.id, attempt, onReady]);
  return (
    <section className="polling-qr-card">
      <h3>{event.title}</h3>
      <p>
        {dateTR(eventDate(event.day))} · {event.time} · {event.duration} dk
      </p>
      <p>{event.room || 'Derslik belirtilmedi'}</p>
      <div className="polling-qr-image">
        {image ? (
          <img src={image} width={400} height={400} alt={`${event.title} katılım QR kodu`} />
        ) : (
          <p role="status">{error || 'QR kodu hazırlanıyor.'}</p>
        )}
      </div>
      {error && (
        <Button variant="outline" onClick={() => setAttempt((v) => v + 1)}>
          Yeniden oluştur
        </Button>
      )}
      <Input
        className="qr-controls"
        aria-label={`${event.title} katılım bağlantısı`}
        readOnly
        value={url}
        placeholder="Katılım bağlantısı"
        onFocus={(e) => e.currentTarget.select()}
      />
      <div className="qr-controls flex flex-wrap justify-center gap-2">
        <Button
          disabled={!url}
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              toast.success('Bağlantı kopyalandı.');
            } catch {
              toast.error('Bağlantıyı yukarıdaki alandan seçip kopyalayabilirsiniz.');
            }
          }}
        >
          <Copy /> Bağlantıyı kopyala
        </Button>
        {image && (
          <Button variant="outline" size="sm" asChild>
            <a href={image} download={`yoklama-${event.id}.png`}>
              <Download /> QR indir
            </a>
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild>
          <a href={path} target="_blank" rel="noopener noreferrer">
            <ExternalLink /> Katılımı önizle
          </a>
        </Button>
      </div>
      <small>Önizleme — canlı yoklama kaydı oluşturmaz.</small>
    </section>
  );
}
export function AttendanceQrDialog({
  events,
  onClose,
}: {
  events: CalendarEvent[];
  onClose: () => void;
}) {
  const [ready, setReady] = useState<Record<number, boolean>>({});
  const onReady = useCallback(
    (id: number, value: boolean) =>
      setReady((old) => (old[id] === value ? old : { ...old, [id]: value })),
    [],
  );
  return (
    <Dialog
      open={events.length > 0}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="jam-modal attendance-qr-dialog">
        <DialogHeader>
          <DialogTitle>Yoklama QR kodları</DialogTitle>
          <DialogDescription>
            Telefon kamerasıyla tarayın veya katılım bağlantısını açın.
          </DialogDescription>
        </DialogHeader>
        <div className="dialog-body polling-qr-grid">
          {events.map((event) => (
            <PollingCode key={event.id} event={event} onReady={onReady} />
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
          <Button
            disabled={!events.length || events.some((event) => !ready[event.id])}
            onClick={() => window.print()}
          >
            <Printer /> {events.length > 1 ? `${events.length} kartı yazdır` : 'Yazdır'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
