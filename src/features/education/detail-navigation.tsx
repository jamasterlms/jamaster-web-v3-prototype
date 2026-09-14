import { PageNavigation } from '@/components/navigation/page-navigation';

export function GroupDetailNavigation({ id }: { id: string }) {
  const root = `/admin/groups/${encodeURIComponent(id)}`;
  return (
    <PageNavigation
      items={[
        { to: root, label: 'Grup bilgileri' },
        { to: `${root}/teacher`, label: 'Öğretmenler' },
        { to: `${root}/schedule`, label: 'Ders programı', includeDescendants: true },
        { to: `${root}/polling`, label: 'Yoklamalar' },
        { to: `${root}/notes`, label: 'Notlar' },
      ]}
    />
  );
}
export function TeacherDetailNavigation({ id }: { id: string }) {
  const root = `/admin/teachers/${encodeURIComponent(id)}`;
  return (
    <PageNavigation
      items={[
        { to: root, label: 'Genel bilgiler' },
        { to: `${root}/students`, label: 'Öğrenciler' },
        { to: `${root}/groups`, label: 'Gruplar' },
        { to: `${root}/activities`, label: 'Aktiviteler' },
        { to: `${root}/payments`, label: 'Ödemeler' },
        { to: `${root}/history`, label: 'Geçmiş' },
      ]}
    />
  );
}
