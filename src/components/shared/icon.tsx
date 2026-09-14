import { cn } from '@/lib/utils';
export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={cn('icon', className)} aria-hidden="true">
      <use href={`${import.meta.env.BASE_URL}assets/icons.svg#${name}`} />
    </svg>
  );
}
