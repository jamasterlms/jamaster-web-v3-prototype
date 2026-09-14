import { sourceRedirect } from '../src/app/navigation/source-redirects';
import { checkPaymentUI } from './check-payment-ui';
import { CalendarGrid } from '../src/features/calendar/calendar-grid';
import type { CalendarEvent } from '../src/types';
import { DisplayProvider } from '../src/app/display-provider';
import { MemoryRouter } from 'react-router-dom';
import { NavigationProvider } from '../src/app/navigation/navigation-provider';
// Static rendering checks component composition without driving a browser.
import assert from 'node:assert/strict';
import { renderToString } from 'react-dom/server';
import { Suspense } from 'react';
import { PageRouter as RouteView } from '../src/app/page-router';
import { App as Application } from '../src/app/app';
import { WorkspaceProvider, useWorkspace } from '../src/app/workspace-provider';
import { MeetingDialog } from '../src/features/meetings/meeting-dialog';
import { JamAIPanel, replyFor } from '../src/features/jamai/jamai-panel';
import { OperationsProvider } from '../src/features/operations/operations-provider';
import { allPages } from '../src/data/navigation';
import { pageLoaders, type PageComponents } from '../src/app/page-loaders';
import { pageNameForPath, preloadPage } from '../src/app/navigation/page-preloading';
// Load actual route implementations for synchronous SSR inspection; production uses lazy chunks.
const testPages = Object.fromEntries(
  await Promise.all(
    Object.entries(pageLoaders).map(async ([name, load]) => [name, (await load()).default]),
  ),
) as PageComponents;
function canonicalPath(route: string) {
  let path = route.startsWith('/') ? route : '/' + route;
  for (let i = 0; i < 4; i++) {
    const [pathname, search] = path.split('?');
    const next = sourceRedirect(pathname, search ? '?' + search : '');
    if (!next) break;
    path = next;
  }
  return path;
}
const PageRouter = ({ route }: { route: string }) => (
  <RouteView route={canonicalPath(route)} pages={testPages} />
);
const App = () => <Application pages={testPages} />;
const wrap = (children: React.ReactNode, path = '/admin/dashboard') => (
  <MemoryRouter initialEntries={[canonicalPath(path)]}>
    <NavigationProvider>
      <OperationsProvider>
        <WorkspaceProvider>
          <DisplayProvider>{children}</DisplayProvider>
        </WorkspaceProvider>
      </OperationsProvider>
    </NavigationProvider>
  </MemoryRouter>
);
import { RegistrationFields } from '../src/features/students/registration-fields';
import { RegistrationReview } from '../src/features/students/registration-review';
import { StudentForm } from '../src/features/students/student-dialogs';
import { GroupFields } from '../src/features/education/group-fields';
import { TeacherFields } from '../src/features/education/teacher-fields';
import { ExpenseFields } from '../src/features/finance/expense-fields';
import { PricingFields } from '../src/features/finance/pricing-fields';
import { groupDraft } from '../src/features/education/group-model';
import { expenseDraft } from '../src/features/finance/expense-model';
import { initialOperations } from '../src/features/operations/model';
import { emptyRegistration, registrationSchema } from '../src/features/students/registration-model';
function checkMarkup(html: string, context: string) {
  const ids = [...html.matchAll(/\bid="([^" ]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size, `Duplicate element ids: ${context}`);
  for (const match of html.matchAll(/\bfor="([^" ]+)"/g))
    assert.ok(ids.includes(match[1]), `Unbound label ${match[1]}: ${context}`);
}
checkPaymentUI(wrap, checkMarkup);
const overnight: CalendarEvent = {
  id: 99,
  day: 9,
  time: '23:30',
  duration: 90,
  type: 'lesson',
  title: 'Gece dersi',
  teacher: 'Selin Demir',
  room: 'Derslik 02',
  color: 'green',
  students: 2,
};
const calendarMarkup = renderToString(
  <CalendarGrid
    events={[overnight]}
    days={[9]}
    today={9}
    onDay={() => {}}
    onEvent={() => {}}
    onRange={() => {}}
  />,
);
assert.ok(
  calendarMarkup.includes('schedule-resize') && calendarMarkup.includes('draggable="true"'),
);
assert.ok(
  !/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*<button\b/.test(calendarMarkup),
  'Calendar actions must not nest interactive buttons',
);
for (const [path, expected] of [
  ['/payment', 'Güncel ödemeler'],
  ['/student/activities/activity-speaking', 'Çalışmayı teslim et'],
  ['/teacher/activities/activity-speaking/submissions', 'Teslimler'],
  ['/teacher/activities/activity-speaking', 'Değerlendirme'],
  ['/teacher/announcements', 'Yeni duyuru'],
  ['/user/account', 'Şifre'],
  ['/login', 'Personel'],
  ['/reset-password', 'Yenileme bağlantısı eksik'],
  ['/reset-password?token=prototype', 'Yeni şifre tekrar'],
  ['/polling?q=prototype', 'Kod adımına geç'],
] as const) {
  const html = renderToString(wrap(<PageRouter route={path} />, path));
  checkMarkup(html, path);
  assert.ok(
    html.includes(expected),
    `${path}: expected ${expected}; got ${html.replace(/<[^>]+>/g, ' ').slice(-1200)}`,
  );
}
let count = 0;
for (const page of allPages) {
  const html = renderToString(wrap(<PageRouter route={page.id} />, '/' + page.id));
  assert.ok(!html.includes('Sayfa bulunamadı'), page.id);
  assert.ok(html.length > 200, page.id);
  checkMarkup(html, page.id);
  assert.ok(!/href="#(?:admin|super|panel|takvim)/.test(html), page.id);
  assert.ok(!/NaN/.test(html), page.id);
  count++;
}
for (const path of ['admin/students/past', 'admin/students/1088', 'admin/students/register']) {
  const html = renderToString(wrap(<PageRouter route={path} />, '/' + path));
  assert.ok(!html.includes('Sayfa bulunamadı'), path);
  if (path.endsWith('/past')) {
    assert.match(
      html,
      /aria-current="page"[^>]*href="\/admin\/students\/past"|href="\/admin\/students\/past"[^>]*aria-current="page"/,
    );
    assert.ok(html.includes('Geçmiş öğrenciler'));
  }
  if (path.endsWith('/1088')) assert.ok(html.includes('Görüşme geçmişi'));
}
const shell = renderToString(wrap(<App />));
for (const path of [
  '/login?role=student',
  '/student/dashboard',
  '/teacher/dashboard',
  '/payment',
]) {
  const html = renderToString(wrap(<App />, path));
  const header = html.match(/<header class="standalone-header">([\s\S]*?)<\/header>/)?.[1] || '';
  assert.ok(header.includes('Yardım merkezi'), `${path}: real help remains available`);
  assert.ok(
    !/Panele dön|Girişe dön|Hesap değiştir/.test(header),
    `${path}: prototype navigation must not appear in the product header`,
  );
  assert.ok(
    !html.includes('portal-persona') && !html.includes('prototype-payment-controls'),
    `${path}: persona and payment scenario controls belong to the dock`,
  );
}
for (const [path, expected] of [
  ['/admin/groups?teacher=unassigned', 'Gruplar'],
  ['/admin/calendar?teacher=t1', 'Takvim'],
  ['/admin/groups/g1/polling?eventId=1&date=2026-09-09', 'Ders oturumu'],
  ['/admin/students/1088/history?tab=polling', 'Yoklama geçmişi'],
  ['/admin/groups/g1?edit=1', 'Grup öğrencileri'],
  ['/admin/teachers/t1?edit=1', 'Ders programı'],
  ['/admin/payments/installments?status=Gecikmi%C5%9F', 'Taksitler'],
  ['/admin/calendar/pollings', 'Yoklama merkezi'],
  ['/admin/groups/g1/polling?tab=past', 'Kaydedilen katılım'],
  ['/admin/groups/g1/schedule', 'B1 · Hafta içi'],
  ['/admin/groups/g1/teacher', 'Sınıf Öğretmeni'],
  ['/admin/groups/g1/notes', 'Yeni not'],
  ['/admin/groups/g1/notes?search=not&sortOrder=title:asc', 'Not başlığı veya içerik ara'],
  ['/admin/groups/g1/schedule/create', 'Programı önizle'],
  ['/admin/groups/g1/schedule?date=2026-12-21', 'Aralık'],
  ['/admin/students/1088/groups', 'Grup işlem geçmişi'],
  ['/admin/teachers/t1/history?tab=schedule', 'Selin Demir'],
  ['/admin/teachers/t1/history?tab=audit', 'İşlem veya kullanıcı ara'],
] as const) {
  const html = renderToString(wrap(<App />, path));
  assert.ok(!html.includes('Sayfa bulunamadı'), path);
  assert.ok(!html.includes('Kayıt bulunamadı'), path);
  assert.ok(html.includes(expected), `${path}: expected ${expected}`);
}
for (const [path, expected] of [
  ['/admin/groups/form?id=missing', 'Düzenlenecek grup bulunamadı'],
  ['/admin/teachers/form?teacherId=missing', 'Düzenlenecek öğretmen bulunamadı'],
  ['/admin/groups/missing/notes', 'Grup bulunamadı'],
  ['/admin/groups/missing/schedule/create', 'Grup bulunamadı'],
  ['/admin/groups/g1/schedule/create?saleId=missing', 'Bağlı satış veya öğrenci bulunamadı'],
  [
    '/admin/groups/g1/polling?date=2026-09-09&eventId=99999',
    'İstenen ders oturumu bu tarihte bulunamadı',
  ],
  ['/admin/groups/g1/polling?date=2026-02-31', 'Geçerli bir ders tarihi seçin'],
] as const) {
  const html = renderToString(wrap(<PageRouter route={path} />, path));
  checkMarkup(html, path);
  assert.ok(html.includes(expected), path);
}
assert.ok(shell.includes('sidebar-container'));
assert.ok(shell.includes('Hızlı arama'));
assert.ok(shell.includes('JamAI'));
assert.ok(!shell.includes('Akıllı öneriler'), 'Suggestions must not appear in the daily feed');
const jamai = renderToString(wrap(<JamAIPanel />));
assert.ok(jamai.includes('Akıllı öneriler') && jamai.includes('Kısa yollar'));
function MeetingCheck() {
  const { state } = useWorkspace();
  const student = { ...state.students[0], payment: 'Bekliyor', amount: 1234 };
  const balance = replyFor('Tahsilatları göster', {
    ...state,
    sales: undefined,
    receipts: undefined,
    students: [student],
  });
  assert.ok(balance.includes('1 öğrenci') && balance.includes('1.234'));
  assert.equal(
    replyFor('Tahsilatları göster', {
      ...state,
      sales: undefined,
      receipts: undefined,
      students: [{ ...student, payment: 'Ödendi' }],
    }),
    'Ödeme bekleyen öğrenci kaydı bulunmuyor.',
  );
  return <MeetingDialog student={student} />;
}
const meeting = renderToString(wrap(<MeetingCheck />));
assert.equal((meeting.match(/role="tabpanel"/g) || []).length, 2);
assert.match(meeting, /id="meeting-dialog-select-1"/);
assert.match(meeting, /aria-describedby="meeting-note-count"/);
assert.ok(meeting.includes('Henüz görüşme kaydı bulunmuyor.'));
console.log(
  `${count} navigation targets, application shell and meeting composition rendered successfully; JamAI balances verified.`,
);

const registration = registrationSchema.parse({
  ...emptyRegistration,
  name: 'Deniz Kaya',
  email: 'deniz@example.com',
  phone: '05321234567',
  company: 'Kurum',
  address: 'Merkez Mahallesi',
  identityNumber: 'A1234567',
  studentType: 'CORPORATE',
  meetingType: 'PHONE',
  courseType: 'GROUP',
  dayPreference: 'CUSTOM',
  customDays: 'Salı',
  timePreference: 'CUSTOM',
  customTime: '18:30',
  meetingResult: 'NEGATIVE',
  negativeReason: 'Zaman uygun değil',
});
for (const section of [0, 1, 2]) {
  const fields = renderToString(
    wrap(
      <RegistrationFields
        section={section}
        draft={registration}
        patch={() => {}}
        errors={section === 0 ? { phone: 'Telefonu kontrol edin.' } : {}}
        validateField={() => {}}
      />,
    ),
  );
  checkMarkup(fields, `registration section ${section}`);
  const optionalStart = fields.indexOf('data-form-section="optional"');
  assert.ok(fields.indexOf('data-form-section="required"') < optionalStart);
  assert.ok(
    !/\brequired=""/.test(fields.slice(optionalStart)),
    `Required input inside optional registration section ${section}`,
  );
  if (section === 0) {
    assert.match(fields, /aria-invalid="true"/);
    assert.ok(fields.includes('register-phone-error'));
    assert.match(fields, /autocomplete="tel"/i);
  }
  if (section === 1) {
    assert.ok(fields.includes('register-customDays'));
    assert.ok(fields.includes('register-customTime'));
  }
  if (section === 2) {
    assert.ok(fields.includes('register-negativeReason'));
    assert.ok(fields.includes('aria-pressed="true"'));
  }
}
const review = renderToString(<RegistrationReview draft={registration} onEdit={() => {}} />);
for (const value of [
  'Merkez Mahallesi',
  'A1234567',
  'Kurum',
  '18:30',
  'Zaman uygun değil',
  'Telefon teyidi',
  'Hesap durumu',
])
  assert.ok(review.includes(value), `Missing preview value ${value}`);
assert.equal((review.match(/bölümünü düzenle/g) || []).length, 3);
const editor = renderToString(wrap(<StudentForm />));
checkMarkup(editor, 'student editor');
assert.equal((editor.match(/role="tabpanel"/g) || []).length, 1);
console.log(
  'All registration sections, inline errors, full preview and student editor labels verified.',
);

const group = groupDraft(initialOperations.groups[0]);
const teacher = { ...initialOperations.teachers[0], salary: undefined };
const expense = expenseDraft(initialOperations.expenses[0]);
const forms = [
  [
    'group',
    <GroupFields value={group} onChange={() => {}} teachers={initialOperations.teachers} />,
  ],
  ['teacher', <TeacherFields value={teacher} onChange={() => {}} />],
  ['expense', <ExpenseFields value={expense} onChange={() => {}} />],
] as const;
for (const [name, component] of forms) {
  const html = renderToString(wrap(<form>{component}</form>));
  checkMarkup(html, name);
  const start = html.indexOf('data-form-section="optional"');
  assert.ok(start > html.indexOf('data-form-section="required"'), name);
  assert.ok(
    !/\brequired=""/.test(html.slice(start)),
    `${name}: optional fields unexpectedly required`,
  );
}
const teacherWithoutSalary = renderToString(<TeacherFields value={teacher} onChange={() => {}} />);
assert.ok(!teacherWithoutSalary.includes('id="salary-amount"'));
const teacherWithSalary = renderToString(
  <TeacherFields
    value={{ ...teacher, salary: { amount: 100, paymentDay: 31, salaryType: 'MONTHLY' } }}
    onChange={() => {}}
  />,
);
checkMarkup(teacherWithSalary, 'teacher with salary');
assert.ok(teacherWithSalary.includes('id="salary-amount"'));
const recurrence = renderToString(
  <ExpenseFields value={{ ...expense, transactionMode: 'RECURRING' }} onChange={() => {}} />,
);
checkMarkup(recurrence, 'recurring expense');
assert.ok(recurrence.includes('id="expense-start"') && !recurrence.includes('id="expense-date"'));
for (const occupation of ['', 'STUDENT', 'EMPLOYEE', 'UNEMPLOYED'] as const) {
  const html = renderToString(
    wrap(
      <RegistrationFields
        section={1}
        draft={{ ...registration, occupation }}
        patch={() => {}}
        errors={{}}
        validateField={() => {}}
      />,
    ),
  );
  assert.equal(html.includes('id="register-institution"'), occupation === 'STUDENT');
  assert.equal(html.includes('id="register-company"'), occupation === 'EMPLOYEE');
}
for (const hasCampaign of [false, true]) {
  const value = { ...initialOperations.plans[0], hasCampaign };
  const required = renderToString(
    wrap(<PricingFields value={value} onChange={() => {}} section="required" />),
  );
  const optional = renderToString(
    wrap(<PricingFields value={value} onChange={() => {}} section="optional" />),
  );
  checkMarkup(required + optional, 'pricing sections');
  assert.ok(required.includes('pricing-contract') && !optional.includes('pricing-contract'));
  assert.equal(optional.includes('id="campaign-price"'), hasCampaign);
}
console.log(
  'Required/optional form hierarchy, conditional salary/campaign/recurrence fields and occupation selectors verified.',
);

// Empty collections must render without reseeding students or inventing requests.
const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const emptyState = {
  students: [],
  events: [],
  meetings: [],
  attendance: {},
  attendanceSessions: [],
  moduleRows: {},
  branch: 'New York',
  privacy: false,
  chat: [],
  settings: {},
  sales: [],
  receipts: [],
};
const memoryStorage = {
  getItem(key: string) {
    return key === 'jamaster-workspace-v3'
      ? JSON.stringify(emptyState)
      : key === 'jamaster-operations-v3'
        ? JSON.stringify({
            groups: [],
            teachers: [],
            expenses: [],
            plans: [],
            messages: [],
            automations: [],
          })
        : null;
  },
  setItem() {},
  removeItem() {},
};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage });
try {
  for (const page of allPages) {
    const html = renderToString(wrap(<PageRouter route={page.id} />, '/' + page.id));
    checkMarkup(html, `empty:${page.id}`);
    assert.ok(!/NaN|undefined öğrenci/.test(html), `empty:${page.id}`);
  }
  const emptyDashboard = renderToString(wrap(<PageRouter route="admin/dashboard" />));
  assert.ok(emptyDashboard.includes('Henüz kaydedilmiş yoklama bulunmuyor.'));
  const contracts = renderToString(
    wrap(<PageRouter route="admin/contracts" />, '/admin/contracts'),
  );
  assert.ok(!contracts.includes('SÖZ-2026-104'));
  const requests = renderToString(
    wrap(<PageRouter route="admin/verification-requests" />, '/admin/verification-requests'),
  );
  assert.ok(requests.includes('Listelenecek kayıt bulunamadı.'));
} finally {
  if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
  else delete (globalThis as { localStorage?: unknown }).localStorage;
}
for (const subpage of ['payments', 'polling-history', 'history']) {
  const path = `admin/students/1088/${subpage}`;
  const html = renderToString(wrap(<PageRouter route={path} />, '/' + path));
  assert.ok(!html.includes('Sayfa bulunamadı'), path);
  assert.ok(
    html.includes(
      subpage === 'payments'
        ? 'Eğitimler'
        : subpage === 'polling-history'
          ? 'Yoklama geçmişi'
          : 'Görüşme türü, sonuç veya not ara',
    ),
    path,
  );
  checkMarkup(html, path);
}
console.log(
  `${count} routes also rendered with empty collections; student payment, polling and meeting subroutes verified.`,
);

for (const [path, content] of [
  ['admin/groups/g1', 'Grup öğrencileri'],
  ['admin/teachers/t1', 'Ders programı'],
  ['admin/staff/staff-1', 'Personel bilgileri'],
] as const) {
  const html = renderToString(wrap(<PageRouter route={path} />, '/' + path));
  checkMarkup(html, path);
  assert.ok(html.includes(content), path);
  assert.ok(!html.includes('Kayıt bulunamadı'), path);
}
const settingsProfile = renderToString(wrap(<PageRouter route="user/account" />, '/user/account'));
assert.ok(settingsProfile.includes('profilePhone') && settingsProfile.includes('type="file"'));
assert.ok(
  !settingsProfile.includes('Ayarlar bölümleri') ||
    !settingsProfile.includes('href="/admin/settings'),
);
for (const [tab, expected] of [
  ['general', 'Kurum ve işlem tercihleri'],
  ['level', 'Seviyeleri düzenle'],
  ['iyzico', 'iyzico ödeme bağlantısı'],
  ['mutlucell', 'Mutlucell SMS'],
  ['whatsapp', 'WhatsApp Business'],
  ['email', 'E-posta / SMTP'],
] as const) {
  const html = renderToString(
    wrap(<PageRouter route="super/settings" />, `/super/settings?tab=${tab}`),
  );
  assert.ok(html.includes(expected), `super/settings?tab=${tab}`);
  assert.ok(!html.includes('href="/admin/settings'), 'super settings must stay in the super scope');
  checkMarkup(html, `super/settings?tab=${tab}`);
}
assert.ok(!shell.includes('Sekme aralığı'));
const uploaded = { ...registration, image: 'data:image/png;base64,aGVsbG8=' };
const imageReview = renderToString(<RegistrationReview draft={uploaded} />);
assert.ok(imageReview.includes('review-profile-photo'));
assert.ok(!imageReview.includes('<dd>data:image'));
console.log(
  'Group, teacher, staff detail pages, profile inputs, removed density control and image preview verified.',
);

// Pinned source inventory exercises dispatch itself, so a detail page cannot pass by rendering a list.
const sourceInventory = JSON.parse(
  (await import('node:fs')).readFileSync('docs/review/source-routes.json', 'utf8'),
) as {
  routes: {
    pattern: string;
    samplePath: string;
    redirect: string | null;
    expectedComponent: keyof PageComponents;
  }[];
  reportLeaves: string[];
};
assert.equal(sourceInventory.routes.length, 154);
const markers = Object.fromEntries(
  Object.keys(testPages).map((name) => [
    name,
    (props: Record<string, unknown>) => (
      <div data-page-component={name}>{JSON.stringify(props)}</div>
    ),
  ]),
) as unknown as PageComponents;
for (const entry of sourceInventory.routes) {
  assert.equal(
    pageNameForPath(entry.samplePath),
    entry.expectedComponent,
    `Preload: ${entry.pattern}`,
  );
  let path = entry.samplePath;
  if (entry.redirect) {
    const [pathname, search] = path.split('?');
    const actual = sourceRedirect(pathname, search ? '?' + search : '');
    assert.equal(actual, entry.redirect, entry.pattern);
    path = actual!;
  }
  const marker = renderToString(wrap(<RouteView route={path} pages={markers} />, path));
  assert.ok(
    marker.includes(`data-page-component="${entry.expectedComponent}"`),
    `${entry.pattern}: expected ${entry.expectedComponent}, got ${marker}`,
  );
  const html = renderToString(wrap(<PageRouter route={path} />, path));
  assert.ok(html.length > 100 && !html.includes('Sayfa bulunamadı'), entry.pattern);
  checkMarkup(html, entry.pattern);
  assert.ok(!html.includes('NaN'), entry.pattern);
}
for (const path of sourceInventory.reportLeaves) {
  const html = renderToString(wrap(<PageRouter route={path} />, path));
  assert.ok(!html.includes('Rapor bulunamadı'), path);
  checkMarkup(html, path);
}
console.log(
  '154 source route patterns and 42 report leaves resolve to their intended page families. Service-unavailable states are not counted as live integrations.',
);

// Exercise production page resources, not the eager component overrides used above.
// A prepared route must render synchronously on its first visit and subsequent visits.
for (const page of allPages) {
  const path = canonicalPath(page.id);
  await preloadPage(path);
  for (let visit = 0; visit < 2; visit++) {
    const html = renderToString(
      wrap(
        <Suspense fallback={<span>UNEXPECTED_PAGE_WAIT</span>}>
          <RouteView route={path} />
        </Suspense>,
        path,
      ),
    );
    assert.ok(
      !html.includes('UNEXPECTED_PAGE_WAIT'),
      `${path}: prepared page suspended on visit ${visit + 1}`,
    );
    assert.ok(html.length > 200 && !html.includes('Sayfa bulunamadı'), path);
  }
}
console.log(
  `${allPages.length} prepared production routes rendered on both first and repeat visits without Suspense fallback; all 154 source routes preload the correct page family.`,
);

// Role-aware help is in the shared heading; media stays unloaded until opened.
for (const role of ['student', 'teacher', 'user']) {
  const path = `/help?role=${role}`;
  const html = renderToString(wrap(<PageRouter route="/help" />, path));
  checkMarkup(html, path);
  assert.ok(html.includes('Yardım merkezi'));
  assert.ok(html.includes('kullanım videosu'));
  assert.ok(!html.includes('<video'), 'Closed help must not mount video players');
  if (role !== 'user')
    assert.ok(
      !html.includes('Kurum lisansı'),
      'Role-specific help must not expose finance tutorials',
    );
  const access = renderToString(
    wrap(<PageRouter route="/access/suspended" />, `/access/suspended?role=${role}`),
  );
  checkMarkup(access, `suspended-${role}`);
  assert.equal(access.includes('href="/payment"'), role === 'user');
}
for (const path of [
  '/access/examples?role=teacher',
  '/access/forbidden?role=student',
  '/offline?role=teacher',
  '/reset-password?token=expired&role=teacher',
]) {
  const html = renderToString(wrap(<PageRouter route={path.split('?')[0]} />, path));
  checkMarkup(html, path);
  assert.ok(html.includes('kullanım videosu'));
}
console.log(
  'Role-aware help and access pages rendered; closed videos remain unmounted and billing recovery stays staff-only.',
);

// New navigation entries and contextual recovery destinations are inspectable in the rendered UI.
const roleLogin = renderToString(
  wrap(<PageRouter route="/login" />, '/login?role=teacher&returnTo=%2Fteacher%2Factivities'),
);
assert.ok(roleLogin.includes('auth-workspace') && roleLogin.includes('access-companion'));
assert.ok(roleLogin.includes('returnTo=%2Fteacher%2Factivities'));
const statusPreview = renderToString(
  wrap(<PageRouter route="/access/offline" />, '/access/offline?role=teacher'),
);
assert.ok(statusPreview.includes('access-recovery-aside'));
assert.ok(!statusPreview.includes('Tekrar dene'), 'No false retry without a target page');
const guidePreview = renderToString(wrap(<PageRouter route="/help" />, '/help?role=student'));
assert.ok(guidePreview.includes('tutorial-card-visual') && guidePreview.includes('loading="lazy"'));
const calendarFiltered = renderToString(
  wrap(
    <PageRouter route="/admin/calendar" />,
    '/admin/calendar?view=Liste&room=Nonexistent&event=lesson&lessonType=PRIVATE',
  ),
);
assert.ok(calendarFiltered.includes('calendar-agenda'), 'Calendar restores list view from URL');
assert.ok(
  !calendarFiltered.includes('class="agenda-event'),
  'Room filter excludes nonmatching events',
);
console.log(
  'Access composition, recovery targets, guide thumbnails and calendar URL filters verified.',
);
