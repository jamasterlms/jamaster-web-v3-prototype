import { eventDate, startOfWeek } from '../../lib/calendar.ts';
import { localDate } from '../../lib/validation.ts';
export function registrationSeries(
  students: { date: string }[],
  period: string,
  today = new Date(),
) {
  const year = today.getFullYear(),
    month = today.getMonth();
  const ranges =
    period === 'Yıl'
      ? Array.from({ length: 6 }, (_, i) => [
          new Date(year, i * 2, 1),
          new Date(year, i * 2 + 2, 0),
        ])
      : period === 'Ay'
        ? Array.from({ length: 7 }, (_, i) => [
            new Date(year, month, i * 4 + 1),
            new Date(year, month, i === 6 ? new Date(year, month + 1, 0).getDate() : i * 4 + 4),
          ])
        : Array.from({ length: 7 }, (_, i) => [
            eventDate(startOfWeek(today) + i),
            eventDate(startOfWeek(today) + i),
          ]);
  return ranges.map(([start, end]) => ({
    label:
      period === 'Yıl'
        ? `${start.toLocaleDateString('tr-TR', { month: 'short' })}–${end.toLocaleDateString('tr-TR', { month: 'short' })}`
        : period === 'Ay'
          ? `${start.getDate()}–${end.getDate()}`
          : start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    fullLabel: `${start.toLocaleDateString('tr-TR')} – ${end.toLocaleDateString('tr-TR')}`,
    count: students.filter(
      (student) => student.date >= localDate(start) && student.date <= localDate(end),
    ).length,
  }));
}
