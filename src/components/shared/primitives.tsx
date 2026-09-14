import { PageHelpButton } from '@/features/help/tutorial-dialog';
import { AvatarImage, AvatarFallback, Avatar as ShadcnAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Student } from '@/types';
import type { ComponentProps, ReactNode } from 'react';
import { Icon } from './icon';
export function IconButton({
  icon,
  label,
  className,
  ...props
}: ComponentProps<typeof Button> & { icon: string; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      className={cn('icon-button', className)}
      {...props}
    >
      <Icon name={icon} />
    </Button>
  );
}
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="page-heading-title">
          <h1>{title}</h1>
          <PageHelpButton title={title} />
        </div>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Avatar({
  name,
  color,
  src,
  className,
}: {
  name: string;
  color?: string;
  src?: string;
  className?: string;
}) {
  return (
    <ShadcnAvatar className={cn('avatar', className)} style={{ background: color }}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="bg-transparent">{initials(name)}</AvatarFallback>
    </ShadcnAvatar>
  );
}
export function Person({ student }: { student: Student }) {
  return (
    <div className="person-cell">
      <Avatar
        name={student.name}
        src={String(student.profile?.image || '')}
        color={student.color}
      />
      <div>
        <div className="person-name">{student.name}</div>
        <div className="person-sub">{student.course}</div>
      </div>
    </div>
  );
}
export function StatusBadge({ children }: { children: string }) {
  const positive = /^(Aktif|Ödendi|Tamamlandı|Yayında|Çözüldü|Yanıtlandı|Onaylandı|Katıldı)$/.test(
    children,
  );
  const risk = /Gecikmiş|İptal|Risk|İade|Reddedildi|Katılmadı/.test(children);
  return (
    <Badge
      variant="secondary"
      className={cn('badge', positive ? 'green' : risk ? 'pink' : 'amber')}
    >
      {positive && <Icon name="check" className="small" />}
      {children}
    </Badge>
  );
}
export function SectionCard({
  title,
  children,
  action,
  actionLabel,
  headerEnd,
  className,
}: {
  title: string;
  children: ReactNode;
  action?: () => void;
  actionLabel?: string;
  headerEnd?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('card section-card', className)}>
      <div className="section-bar">
        <h2>{title}</h2>
        <div className="section-bar-actions">
          {headerEnd}
          {action && (
            <IconButton
              icon="arrow-up-right"
              label={actionLabel || `${title} detayları`}
              className="white compact"
              onClick={action}
            />
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}
export function EmptyState({ text = 'Aramanıza uygun kayıt bulunamadı.' }: { text?: string }) {
  return (
    <div className="empty-state">
      <Icon name="search" />
      <p>{text}</p>
    </div>
  );
}
