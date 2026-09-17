import { registrationSeries } from './performance-model';
import { useWorkspace } from '@/app/workspace-provider';
import { SectionCard } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageState } from '@/hooks/use-page-state';
import { navigate } from '@/hooks/use-route';
export function Sparkline({ bars = false }: { bars?: boolean }) {
  return (
    <svg className="sparkline" viewBox="0 0 70 30" fill="none" aria-hidden="true">
      {bars ? (
        [5, 8, 6, 12, 18, 16, 22, 28, 21, 25, 20, 27].map((v, i) => (
          <rect
            key={i}
            x={i * 6}
            y={30 - v}
            width="3"
            height={v}
            rx="1"
            fill="#85718f"
            opacity={0.25 + i * 0.05}
          />
        ))
      ) : (
        <>
          <path
            d="M1 25L10 17L18 21L26 7L35 13L44 4L53 12L61 7L69 11"
            stroke="#e2d9e9"
            strokeWidth="1.5"
          />
          <circle cx="44" cy="4" r="2.6" fill="#85718f" />
        </>
      )}
    </svg>
  );
}
export function LineChart({
  values,
  color = '#b49cc7',
  labels,
}: {
  values: number[];
  color?: string;
  labels?: string[];
}) {
  const max = Math.max(1, ...values) * 1.15,
    points = values.map((v, i) => [
      14 + i * (282 / Math.max(1, values.length - 1)),
      102 - (v / max) * 86,
    ]),
    line = points.map((p) => p.join(',')).join(' ');
  return (
    <svg
      className="widget-chart"
      viewBox="0 0 310 135"
      role="img"
      aria-label={`Günlük değerler: ${values.join(', ')}`}
    >
      <path className="grid" d="M10 25H302M10 63H302M10 103H302" />
      <polygon points={`14,103 ${line} 296,103`} fill={color} fillOpacity=".11" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={color} strokeWidth="1.8" />
      ))}
      {values.map(
        (_, i) =>
          (i === values.length - 1 ||
            i % Math.max(1, Math.ceil((values.length - 1) / 6)) === 0) && (
            <text
              key={i}
              x={14 + i * (282 / Math.max(1, values.length - 1))}
              y="128"
              textAnchor={i === 0 ? 'start' : i === values.length - 1 ? 'end' : 'middle'}
            >
              {labels?.[i] || i + 1}
            </text>
          ),
      )}
    </svg>
  );
}
export function BarChart({
  values,
  color = '#a4c1b0',
  labels,
}: {
  values: number[];
  color?: string;
  labels?: string[];
}) {
  const max = Math.max(1, ...values);
  return (
    <svg
      className="widget-chart"
      viewBox="0 0 310 135"
      role="img"
      aria-label={`Günlük değerler: ${values.join(', ')}`}
    >
      <path className="grid" d="M10 25H302M10 65H302M10 103H302" />
      {values.map((v, i) => (
        <g key={i}>
          <rect
            x={18 + i * 42}
            y={103 - (v / max) * 82}
            width="20"
            height={(v / max) * 82}
            rx="5"
            fill={color}
            opacity={0.5 + i * 0.07}
          />
          <text x={28 + i * 42} y="128" textAnchor="middle">
            {labels?.[i] || ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}
          </text>
        </g>
      ))}
    </svg>
  );
}
export function PerformanceChart() {
  const [period, setPeriod] = usePageState('performance-period', 'Hafta');
  const { state } = useWorkspace();
  const series = registrationSeries(state.students, period);
  const counts = series.map((item) => item.count),
    labels = series.map((item) => item.label);
  return (
    <SectionCard
      title="Kayıt performansı"
      className="performance-card"
      headerEnd={
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            {['Hafta', 'Ay', 'Yıl'].map((p) => (
              <TabsTrigger key={p} value={p}>
                {p}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      }
    >
      <div className="chart-summary">
        <div>
          <span className="chart-value">{counts.reduce((a, b) => a + b, 0)}</span>{' '}
          <span className="muted">yeni kayıt</span>
        </div>
      </div>
      <div
        className="dot-chart"
        style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}
      >
        {counts.map((count, i) => {
          const height = Math.round((count / Math.max(1, ...counts)) * 18);
          return (
            <button key={i} className="dot-day" aria-label={`${labels[i]}: ${count} kayıt`}>
              <span className="dot-field">
                {Array.from({ length: 100 }, (_, j) => {
                  const row = Math.floor(j / 5),
                    active = row >= 20 - height;
                  return <i key={j} className={`dot ${active ? 'lilac-dot' : ''}`} />;
                })}
              </span>
              <span className="chart-day-label">{labels[i]}</span>
              <span className="chart-tooltip">
                <b>{series[i].fullLabel}</b>
                {count} yeni kayıt
              </span>
            </button>
          );
        })}
      </div>
      <div className="chart-legend">
        <span>
          <i className="legend-mark" style={{ background: 'var(--chart-lilac)' }} />
          Yeni öğrenci kayıtları
        </span>
      </div>
      <div className="chart-footer">
        <span>
          <b className="positive">{period}</b> görünümü · Kayıt tarihine göre
        </span>
        <Button size="sm" onClick={() => navigate('admin/education-reports')}>
          Raporu aç
        </Button>
      </div>
    </SectionCard>
  );
}
