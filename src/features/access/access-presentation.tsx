import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Users,
  Wallet,
  Check,
  CirclePlay,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { accessRoleLabels, type AccessRole } from './access-state-model';
import { helpLink } from '@/features/help/help-model';
const roleContent = {
  student: {
    title: 'Öğrenme yolculuğunuz',
    caption: 'Derslerinize ve gelişiminize tek yerden ulaşın.',
    icon: GraduationCap,
    links: [
      {
        title: 'Derslerim',
        text: 'Grubunuz, programınız ve ders içerikleri',
        icon: BookOpen,
        to: '/student/courses',
      },
      {
        title: 'Aktivitelerim',
        text: 'Çalışmalarınızı inceleyin ve teslim edin',
        icon: CalendarDays,
        to: '/student/activities',
      },
      {
        title: 'Notlarım',
        text: 'Değerlendirmeleri ve geri bildirimleri görün',
        icon: Check,
        to: '/student/grades',
      },
    ],
  },
  teacher: {
    title: 'Dersinize odaklanın',
    caption: 'Program, öğrenciler ve çalışmalar bir arada.',
    icon: BookOpen,
    links: [
      {
        title: 'Derslerim',
        text: 'Size atanan gruplar ve ders programı',
        icon: CalendarDays,
        to: '/teacher/courses',
      },
      {
        title: 'Aktiviteler',
        text: 'Çalışma paylaşın, teslimleri değerlendirin',
        icon: BookOpen,
        to: '/teacher/activities',
      },
      {
        title: 'Not özeti',
        text: 'Öğrencilerinizin gelişimini takip edin',
        icon: GraduationCap,
        to: '/teacher/grade-overview',
      },
    ],
  },
  user: {
    title: 'Kurumunuzun çalışma alanı',
    caption: 'Eğitim ve operasyonları aynı yerden yönetin.',
    icon: Users,
    links: [
      {
        title: 'Öğrenciler',
        text: 'Kayıtlar, eğitimler ve iletişim bilgileri',
        icon: Users,
        to: '/admin/students',
      },
      {
        title: 'Takvim',
        text: 'Dersler ve görüşmeler için ortak program',
        icon: CalendarDays,
        to: '/admin/calendar',
      },
      {
        title: 'Finans',
        text: 'Satışları ve tahsilatları takip edin',
        icon: Wallet,
        to: '/admin/sales',
      },
    ],
  },
};
export function AccessCompanion({
  role,
  recovery = false,
}: {
  role: AccessRole;
  recovery?: boolean;
}) {
  const info = roleContent[role],
    Mark = info.icon;
  return (
    <aside className="access-companion">
      <Card className="access-role-card">
        <div className="access-role-card-top">
          <span>{accessRoleLabels[role]} alanı</span>
          <Mark size={24} strokeWidth={1.5} />
        </div>
        <h2>{recovery ? 'Kaldığınız yerden devam edin' : info.title}</h2>
        <p>
          {recovery
            ? 'Hesabınıza yeniden eriştiğinizde dersleriniz ve çalışma alanınız burada olacak.'
            : info.caption}
        </p>
        <div className="access-role-motif" aria-hidden="true">
          {Array.from({ length: 42 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </Card>
      <div className="access-destination-list">
        {info.links.map((item) => (
          <Button asChild variant="ghost" className="access-destination" key={item.to}>
            <Link to={item.to}>
              <span className="access-destination-icon">
                <item.icon size={20} strokeWidth={1.6} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
          </Button>
        ))}
      </div>
      <Button asChild variant="ghost" className="access-guide-link">
        <Link to={helpLink(role === 'user' ? 'staff' : role)}>
          <CirclePlay size={19} />
          İlk kez mi kullanıyorsunuz? Rehberi açın
          <ArrowUpRight size={16} />
        </Link>
      </Button>
    </aside>
  );
}
