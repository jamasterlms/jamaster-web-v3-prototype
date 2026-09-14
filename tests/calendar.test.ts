import test from 'node:test';
import assert from 'node:assert/strict';
import {
  eventDate,
  eventDay,
  startOfWeek,
  layoutEvents,
  splitCalendarEvents,
} from '../src/lib/calendar.ts';
import { splitInstallments } from '../src/lib/payments.ts';
import { validateMeeting, newMeetingDraft } from '../src/features/meetings/meeting-model.ts';
const event = (id: number, time: string, duration: number) => ({
  id,
  time,
  duration,
  day: 7,
  title: 'Ders',
  teacher: 'Öğretmen',
  room: '1',
  type: 'lesson',
  color: 'green',
});
test('Calendar serials preserve dates across month/year and Monday week boundaries', () => {
  for (const date of [new Date(2026, 8, 7), new Date(2027, 0, 1), new Date(2028, 1, 29)]) {
    assert.equal(eventDate(eventDay(date)).getFullYear(), date.getFullYear());
    assert.equal(eventDate(eventDay(date)).getMonth(), date.getMonth());
    assert.equal(eventDate(eventDay(date)).getDate(), date.getDate());
    assert.equal(eventDate(startOfWeek(date)).getDay(), 1);
  }
});
test('Simultaneous events get separate columns, adjacent events reuse space', () => {
  const result = layoutEvents([
    event(1, '09:00', 90),
    event(2, '09:30', 60),
    event(3, '10:30', 60),
  ]);
  assert.equal(result[0].columns, 2);
  assert.notEqual(result[0].column, result[1].column);
  assert.equal(result[2].columns, 1);
  assert.equal(result[2].column, 0);
});
test('Midnight events remain visible on both dates with their original identity', () => {
  const segments = splitCalendarEvents([event(9, '23:30', 90)]);
  assert.deepEqual(
    segments.map(({ id, day, time, duration }) => ({ id, day, time, duration })),
    [
      { id: 9, day: 7, time: '23:30', duration: 30 },
      { id: 9, day: 8, time: '00:00', duration: 60 },
    ],
  );
});
test('Installments add up in integer cents and reject corrupt counts', () => {
  const parts = splitInstallments(100, 3);
  assert.deepEqual(parts, [33.34, 33.33, 33.33]);
  assert.equal(
    parts.reduce((n, amount) => n + Math.round(amount * 100), 0),
    10000,
  );
  for (const count of [0, -1, 1.5, Infinity, 121])
    assert.deepEqual(splitInstallments(100, count), []);
});
test('Meeting rejects invalid result, fractional score, rollover dates and unknown negative reason', () => {
  const draft = { ...newMeetingDraft(1), result: 'COMPLETED' };
  for (const patch of [
    { score: NaN },
    { score: 1.5 },
    { result: 'UNKNOWN' },
    { result: 'CALLBACK', date: '2026-02-30T09:00' },
    { result: 'NEGATIVE', reason: 'UNKNOWN' },
  ])
    assert.ok(validateMeeting({ ...draft, ...patch }));
});
test('Negative meeting reason is optional and all source scores remain available', () => {
  for (const score of [1, 2, 3, 4, 5])
    assert.equal(
      validateMeeting({ ...newMeetingDraft(1), result: 'NEGATIVE', reason: '', score }),
      null,
    );
});

import { registrationSeries } from '../src/features/dashboard/performance-model.ts';
test('Registration chart includes whole year and last day of short/long months', () => {
  const students = [
    { date: '2026-01-01' },
    { date: '2026-12-31' },
    { date: '2026-02-28' },
    { date: '2025-02-28' },
  ];
  assert.equal(
    registrationSeries(students, 'Yıl', new Date(2026, 1, 8)).reduce(
      (n, item) => n + item.count,
      0,
    ),
    3,
  );
  assert.equal(
    registrationSeries(students, 'Ay', new Date(2026, 1, 8)).reduce((n, item) => n + item.count, 0),
    1,
  );
});

import { priceQuote } from '../src/lib/payments.ts';
import { validatePricePlan } from '../src/features/operations/model.ts';
test('Pricing validates campaign dates and applies campaign/method discounts to the displayed total', () => {
  const plan = {
    id: 'p',
    name: 'Paket',
    course: 'İngilizce',
    price: 1000,
    lessons: 10,
    installments: 3,
    active: true,
    periodId: 'fall',
    contract: 'standard',
    hasCampaign: true,
    campaignTitle: 'Güz',
    campaignStartDate: '2026-09-01',
    campaignEndDate: '2026-09-30',
    campaignPrice: 800,
    paymentDiscounts: [
      {
        paymentTypeId: 1,
        paymentType: 'CASH',
        discount: { type: 'percentage' as const, value: 10 },
      },
    ],
  };
  assert.equal(validatePricePlan(plan), null);
  assert.ok(validatePricePlan({ ...plan, campaignEndDate: '2026-08-01' }));
  assert.equal(priceQuote(plan, '2026-09-08', 'Nakit', 10).amount, 648);
  assert.equal(priceQuote(plan, '2026-10-01', 'Havale / EFT').amount, 1000);
  assert.deepEqual(splitInstallments(0, 1), [0]);
});
