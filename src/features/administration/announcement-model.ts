export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  status: string;
  groupId?: string;
  authorId?: string;
  updatedAt?: string;
  publishedAt?: string;
};
export const announcements: Announcement[] = [
  {
    id: 'n1',
    title: 'Güz dönemi ders programı',
    body: 'Güz dönemi derslerimiz 7 Eylül Pazartesi başlıyor. Güncel ders programınızı Takvim bölümünden takip edebilirsiniz. Tüm öğrencilerimize başarılı bir dönem diliyoruz.',
    audience: 'Tüm öğrenciler',
    status: 'Yayında',
  },
  {
    id: 'n2',
    title: 'Konuşma kulübü kayıtları açıldı',
    body: 'B1 ve üzeri öğrencilerimiz için konuşma kulübü her cuma 17:00’de Derslik 03’te. Katılmak için eğitim danışmanınızla görüşebilirsiniz.',
    audience: 'B1 ve üzeri',
    status: 'Yayında',
  },
];

export function prepareAnnouncement(
  record: Announcement,
  status: 'Taslak' | 'Yayında',
  now: string,
): Announcement {
  const title = record.title.trim(),
    body = record.body.trim(),
    audience = record.audience.trim();
  if (!title && !body) throw new Error('Başlık veya duyuru metni girin.');
  if (status === 'Yayında' && (!title || !body || !audience))
    throw new Error('Yayımlamak için başlık, hedef kitle ve metin zorunludur.');
  return {
    ...record,
    title,
    body,
    audience,
    status,
    updatedAt: now,
    publishedAt: status === 'Yayında' ? record.publishedAt || now : undefined,
  };
}
export function visibleAnnouncements(
  records: Announcement[],
  groups: { id: string; name: string; level: string }[],
  role: 'student' | 'teacher',
) {
  return records.filter((record) => {
    if (record.status !== 'Yayında') return false;
    if (record.groupId) return groups.some((group) => group.id === record.groupId);
    if (record.audience === 'Tüm öğrenciler') return true;
    if (role === 'teacher' && ['Öğretmenler', 'Tüm ekip'].includes(record.audience)) return true;
    if (record.audience === 'B1 ve üzeri')
      return groups.some((group) => /^[BC][12]$/.test(group.level));
    return false;
  });
}

/** Resolve old group labels against the full directory, never a persona's subset. */
export function normalizeAnnouncementTargets(
  records: Announcement[],
  allGroups: { id: string; name: string }[],
): Announcement[] {
  const segments = ['Tüm öğrenciler', 'Öğretmenler', 'Tüm ekip', 'B1 ve üzeri'];
  return records.map((record) => {
    if (record.groupId || segments.includes(record.audience)) return record;
    const matches = allGroups.filter((group) => group.name === record.audience);
    return {
      ...record,
      groupId: matches.length === 1 ? matches[0].id : `missing:${record.audience}`,
    };
  });
}
