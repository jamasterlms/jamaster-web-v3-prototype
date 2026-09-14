import { Check, ArrowUpRight, ListChecks, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useWorkspace } from '@/app/workspace-provider';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const steps = [
  ['companyBank', 'Şirket ve banka ayarları', '/admin/settings/general'],
  ['contract', 'Sözleşme ayarı', '/admin/contracts'],
  ['education', 'Eğitim ve dönemler', '/admin/education'],
  ['pricing', 'Fiyatlandırma', '/admin/pricing'],
  ['teacher', 'Öğretmen ekleme', '/admin/teachers'],
  ['group', 'Grup oluşturma', '/admin/groups'],
  ['student', 'İlk öğrenci kaydı', '/admin/students'],
] as const;

export function SetupChecklist() {
  const { state } = useWorkspace();
  const [open, setOpen] = useState(false);
  // The source app obtains these booleans from branch/onboarding-status. Missing data is unknown.
  let status: Record<string, unknown> = {};
  try {
    status = JSON.parse(state.settings[`onboarding-status:${state.branch}`] || '{}') || {};
  } catch {
    /* No verified status yet. */
  }
  const known = steps.every(([key]) => typeof status[key] === 'boolean');
  const completed = steps.filter(([key]) => status[key] === true).length;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="setup-trigger"
          aria-label="Kurulum adımlarını aç"
          title="Kurulum"
        >
          <ListChecks size={17} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="setup-checklist" aria-label="Şube kurulumu">
        <div className="setup-heading">
          <div>
            <h2>Kurulum</h2>
            <p>{state.branch}</p>
          </div>
          <span>{known ? `${completed} / ${steps.length}` : `${steps.length} adım`}</span>
        </div>
        {known && <progress max={steps.length} value={completed} aria-label="Kurulum ilerlemesi" />}
        <nav aria-label="Kurulum adımları">
          {steps.map(([key, label, to]) => (
            <Button key={key} variant="ghost" asChild onClick={() => setOpen(false)}>
              <Link to={to}>
                <span className={status[key] === true ? 'setup-step complete' : 'setup-step'}>
                  {status[key] === true ? <Check size={15} /> : <Circle size={15} />}
                </span>
                <span>{label}</span>
                <ArrowUpRight size={14} />
              </Link>
            </Button>
          ))}
        </nav>
      </PopoverContent>
    </Popover>
  );
}
