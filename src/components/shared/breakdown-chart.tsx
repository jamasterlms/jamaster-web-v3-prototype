import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
export function BreakdownChart({
  title,
  items,
  unit = 'kayıt',
}: {
  title: string;
  items: { label: string; value: number; max?: number }[];
  unit?: string;
}) {
  const scale = Math.max(1, ...items.map((i) => i.max ?? i.value));
  return (
    <Card className="breakdown-chart">
      <h3>{title}</h3>
      {items.length ? (
        items.slice(0, 6).map((item, i) => (
          <div className="breakdown-row" key={`${item.label}:${i}`}>
            <div>
              <span>{item.label}</span>
              <strong>
                {Number(item.value.toFixed(1)).toLocaleString('tr-TR')}
                {item.max !== undefined ? ` / ${item.max}` : ''} <small>{unit}</small>
              </strong>
            </div>
            <Progress
              value={Math.min(100, (100 * item.value) / (item.max || scale))}
              aria-label={`${item.label}: ${item.value} ${unit}`}
            />
          </div>
        ))
      ) : (
        <p className="field-hint">Bu seçim için kayıt bulunmuyor.</p>
      )}
    </Card>
  );
}
