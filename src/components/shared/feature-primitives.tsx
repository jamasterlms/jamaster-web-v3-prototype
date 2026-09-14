import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import { Icon } from './icon';
export function Metrics({
  items,
}: {
  items: { label: string; value: string | number; detail?: string; highlight?: boolean }[];
}) {
  return (
    <div className="feature-metrics">
      {items.map((item) => (
        <Card className={`mini-stat ${item.highlight ? 'highlight' : ''}`} key={item.label}>
          <span>{item.label}</span>
          <b data-sensitive={String(item.value).includes('₺') ? true : undefined}>{item.value}</b>
          {item.detail && <small>{item.detail}</small>}
        </Card>
      ))}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = 'Ara…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="input-wrap">
      <Icon name="search" />
      <Input
        ref={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="search-clear"
          aria-label="Aramayı temizle"
          onClick={() => {
            onChange('');
            input.current?.focus();
          }}
        >
          <Icon name="x" />
        </Button>
      )}
    </div>
  );
}
export function ProgressMeter({ value, label }: { value: number; label: string }) {
  return (
    <Progress
      value={Math.max(0, Math.min(100, value))}
      aria-label={label}
      className="capacity-meter"
    />
  );
}
