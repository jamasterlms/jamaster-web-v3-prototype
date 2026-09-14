import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { EmptyState, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useOperations } from '@/features/operations/operations-provider';
import { useLevelCatalog } from './level-catalog';
import { learningSeedRows } from './learning-catalog';
import {
  learningKinds,
  linkLearningLevels,
  readLearningCatalog,
  saveLearningRecord,
} from './learning-model';
import {
  levelUsageReason,
  readLevelCatalog,
  removeCatalogLevel,
  removeCatalogSubLevel,
  validateLevelCatalog,
  type CatalogLevel,
  type CatalogSubLevel,
  type LevelIssue,
  type ObservedLevel,
} from './level-model';

export { useLevelCatalog } from './level-catalog';

export function LevelSettings() {
  const { state, dispatch } = useWorkspace(),
    { operations, save } = useOperations();
  const configured = useLevelCatalog();
  const observed: ObservedLevel[] = [
    ...operations.groups.map((group) => ({ level: group.level, subLevel: group.subLevel })),
    ...state.students.map((student) => ({
      level: String(student.profile?.level || ''),
      subLevel: String(student.profile?.subLevel || ''),
    })),
  ];
  // Actual saved group values can join the first migration. Once configured, the global catalog wins.
  const levels = state.settings.levelCatalog
    ? configured
    : readLevelCatalog(undefined, [
        ...configured.flatMap((level) => [
          { level: level.name },
          ...level.subLevels.map((sub) => ({ level: level.name, subLevel: sub.title })),
        ]),
        ...observed,
      ]);
  const learning = linkLearningLevels(
    readLearningCatalog(state.moduleRows, learningSeedRows),
    levels,
  );
  const [draft, setDraft] = useState<CatalogLevel[] | null>(null),
    [issue, setIssue] = useState<LevelIssue | null>(null),
    [review, setReview] = useState(false);
  const [removing, setRemoving] = useState<{ levelId: string; subLevelId?: string } | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const currentLevel = draft?.find((level) => level.id === removing?.levelId);
  const currentSub = currentLevel?.subLevels.find((sub) => sub.id === removing?.subLevelId);
  const sourceLevel =
    currentLevel && (levels.find((level) => level.id === currentLevel.id) || currentLevel);
  const sourceSub =
    currentSub && (sourceLevel?.subLevels.find((sub) => sub.id === currentSub.id) || currentSub);
  const reason = sourceLevel
    ? !removing?.subLevelId && draft?.length === 1
      ? 'En az bir seviye kalmalıdır.'
      : learning.units.some(
            (unit) =>
              unit.levelId === sourceLevel.id && (!sourceSub || unit.subLevelId === sourceSub.id),
          )
        ? 'Müfredat birimleri bu kayda bağlı. Silmek yerine pasife alabilirsiniz.'
        : levelUsageReason(sourceLevel, sourceSub, observed)
    : null;
  const patchLevel = (id: string, patch: Partial<CatalogLevel>) =>
    setDraft(
      (previous) =>
        previous?.map((level) => (level.id === id ? { ...level, ...patch } : level)) || null,
    );
  const patchSub = (levelId: string, subId: string, patch: Partial<CatalogSubLevel>) =>
    setDraft(
      (previous) =>
        previous?.map((level) =>
          level.id === levelId
            ? {
                ...level,
                subLevels: level.subLevels.map((sub) =>
                  sub.id === subId ? { ...sub, ...patch } : sub,
                ),
              }
            : level,
        ) || null,
    );
  const field = (
    level: CatalogLevel,
    sub: CatalogSubLevel | undefined,
    name: 'name' | 'title' | 'order',
    label: string,
  ) => {
    const id = `level-${sub?.id || level.id}-${name}`;
    const invalid =
      issue?.levelId === level.id && issue.subLevelId === sub?.id && issue.field === name;
    const value = name === 'order' ? (sub || level).order : sub ? sub.title : level.name;
    return (
      <div className="form-field">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          required
          type={name === 'order' ? 'number' : 'text'}
          min={name === 'order' ? 0 : undefined}
          step={name === 'order' ? 1 : undefined}
          value={typeof value === 'number' && !Number.isFinite(value) ? '' : value}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(event) => {
            const next =
              name === 'order'
                ? event.target.value === ''
                  ? NaN
                  : Number(event.target.value)
                : event.target.value;
            if (sub) patchSub(level.id, sub.id, { [name]: next });
            else patchLevel(level.id, { [name]: next });
          }}
        />
        {invalid && (
          <p id={`${id}-error`} className="field-error">
            {issue.message}
          </p>
        )}
      </div>
    );
  };
  const commit = () => {
    if (!draft) return;
    const normalized = draft.map((level) => ({
      ...level,
      name: level.name.trim(),
      deletedAt: level.deletedAt ?? null,
      subLevels: level.subLevels.map((sub) => ({
        ...sub,
        title: sub.title.trim(),
        deletedAt: sub.deletedAt ?? null,
      })),
    }));
    const error = validateLevelCatalog(normalized);
    setIssue(error);
    if (error) {
      setReview(false);
      requestAnimationFrame(() =>
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    if (!review) {
      setDraft(normalized);
      setReview(true);
      return;
    }
    // Persist observed legacy references by stable ID before a global rename changes its label.
    let rows = state.moduleRows;
    for (const unit of learning.units) rows = saveLearningRecord(rows, learningSeedRows, unit);
    if (learning.units.length)
      for (const key of learningKinds) dispatch({ type: 'module/rows', key, rows: rows[key] });
    dispatch({
      type: 'settings/save',
      values: { levelCatalog: JSON.stringify({ levels: normalized }) },
    });
    for (const previous of levels) {
      const next = normalized.find((level) => level.id === previous.id);
      if (!next) continue;
      const renameSub = (title?: string) => {
        const old = previous.subLevels.find((sub) => sub.title === title);
        return (old && next.subLevels.find((sub) => sub.id === old.id)?.title) || title || '';
      };
      for (const group of operations.groups.filter((group) => group.level === previous.name)) {
        if (group.level !== next.name || group.subLevel !== renameSub(group.subLevel))
          save({
            type: 'save',
            collection: 'groups',
            record: { ...group, level: next.name, subLevel: renameSub(group.subLevel) },
          });
      }
      for (const student of state.students.filter(
        (student) => student.profile?.level === previous.name,
      )) {
        const subLevel = renameSub(String(student.profile?.subLevel || ''));
        if (previous.name !== next.name || subLevel !== student.profile?.subLevel)
          dispatch({
            type: 'student/save',
            student: { ...student, profile: { ...student.profile, level: next.name, subLevel } },
          });
      }
    }
    setDraft(null);
    setReview(false);
    toast.success('Seviye ve alt seviye ayarları kaydedildi.');
  };
  return (
    <div className="settings-section">
      <div className="form-section-heading">
        <div>
          <h2>Seviye ve alt seviyeler</h2>
          <p className="muted">Tüm eğitimler için ortak seviye kataloğu.</p>
        </div>
        <Button
          onClick={() => {
            setDraft(structuredClone(levels));
            setIssue(null);
            setReview(false);
          }}
        >
          Seviyeleri düzenle
        </Button>
      </div>
      {!levels.length ? (
        <EmptyState text="Henüz seviye tanımlanmadı." />
      ) : (
        <div className="dialog-form">
          {levels.map((level) => (
            <div className="form-section" key={level.id}>
              <div className="flex items-center justify-between">
                <h3>
                  {level.order}. {level.name}
                </h3>
                <StatusBadge>{level.isActive && !level.deletedAt ? 'Aktif' : 'Pasif'}</StatusBadge>
              </div>
              <p>
                {level.subLevels
                  .map(
                    (sub) =>
                      `${sub.order}. ${sub.title}${!sub.isActive || sub.deletedAt ? ' (Pasif)' : ''}`,
                  )
                  .join(' · ') || 'Alt seviye tanımlanmadı.'}
              </p>
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
      >
        <DialogContent preventOutsideClose className="jam-modal dialog-wide">
          <DialogHeader>
            <DialogTitle>
              {review ? 'Seviye ayarlarını gözden geçir' : 'Seviye ayarları'}
            </DialogTitle>
            <DialogDescription>
              Seviye ve alt seviyeleri ayrı kaydedin. Aktiflik değişikliği geçmiş kayıtları korur.
            </DialogDescription>
          </DialogHeader>
          <form
            className="dialog-form"
            noValidate
            ref={form}
            onSubmit={(event) => {
              event.preventDefault();
              commit();
            }}
          >
            <div className="dialog-form-body">
              {issue && (
                <div className="form-error-summary" role="alert">
                  {issue.message}
                </div>
              )}
              {review ? (
                <div>
                  {draft?.map((level) => (
                    <div className="form-section" key={level.id}>
                      <h3>
                        {level.order}. {level.name} · {level.isActive ? 'Aktif' : 'Pasif'}
                      </h3>
                      <p>
                        {level.subLevels
                          .map(
                            (sub) =>
                              `${sub.order}. ${sub.title} · ${sub.isActive ? 'Aktif' : 'Pasif'}`,
                          )
                          .join(', ') || 'Alt seviye yok'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {draft?.map((level) => (
                    <fieldset className="form-section" key={level.id} data-form-section="required">
                      <legend>{level.name || 'Yeni seviye'}</legend>
                      <div className="form-grid">
                        {field(level, undefined, 'name', 'Seviye adı *')}
                        {field(level, undefined, 'order', 'Sıra *')}
                      </div>
                      <div className="field-checkbox">
                        <Switch
                          id={`active-${level.id}`}
                          checked={level.isActive}
                          onCheckedChange={(isActive) => patchLevel(level.id, { isActive })}
                        />
                        <Label htmlFor={`active-${level.id}`}>Seviye aktif</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={draft.length === 1}
                          onClick={() => setRemoving({ levelId: level.id })}
                        >
                          Seviyeyi sil
                        </Button>
                      </div>
                      {level.subLevels.map((sub) => (
                        <div className="form-section form-section-optional" key={sub.id}>
                          <div className="form-grid">
                            {field(level, sub, 'title', 'Alt seviye başlığı *')}
                            {field(level, sub, 'order', 'Sıra *')}
                          </div>
                          <div className="field-checkbox">
                            <Switch
                              id={`active-${sub.id}`}
                              checked={sub.isActive}
                              onCheckedChange={(isActive) =>
                                patchSub(level.id, sub.id, { isActive })
                              }
                            />
                            <Label htmlFor={`active-${sub.id}`}>Alt seviye aktif</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setRemoving({ levelId: level.id, subLevelId: sub.id })}
                            >
                              Alt seviyeyi sil
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          patchLevel(level.id, {
                            subLevels: [
                              ...level.subLevels,
                              {
                                id: crypto.randomUUID(),
                                title: '',
                                order: level.subLevels.length + 1,
                                levelId: level.id,
                                isActive: true,
                                deletedAt: null,
                              },
                            ],
                          })
                        }
                      >
                        Alt seviye ekle
                      </Button>
                    </fieldset>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setDraft((previous) => [
                        ...(previous || []),
                        {
                          id: crypto.randomUUID(),
                          name: '',
                          order: (previous?.length || 0) + 1,
                          isActive: true,
                          subLevels: [],
                          deletedAt: null,
                        },
                      ])
                    }
                  >
                    Seviye ekle
                  </Button>
                </>
              )}
            </div>
            <DialogFooter className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                Vazgeç
              </Button>
              {review && (
                <Button type="button" variant="outline" onClick={() => setReview(false)}>
                  Düzenle
                </Button>
              )}
              <Button type="submit">{review ? 'Kaydet' : 'Önizle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <DialogContent preventOutsideClose className="jam-modal">
          <DialogHeader>
            <DialogTitle>
              {currentSub?.title || currentLevel?.name || 'Kayıt'} silinsin mi?
            </DialogTitle>
            <DialogDescription>
              {reason || 'Bu değişiklik, seviye ayarlarını kaydettiğinizde uygulanır.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Vazgeç
            </Button>
            {reason && currentLevel && (
              <Button
                onClick={() => {
                  if (currentSub) patchSub(currentLevel.id, currentSub.id, { isActive: false });
                  else patchLevel(currentLevel.id, { isActive: false });
                  setRemoving(null);
                }}
              >
                Pasife al
              </Button>
            )}
            <Button
              variant="destructive"
              disabled={!!reason}
              onClick={() => {
                if (draft && removing && !reason) {
                  setDraft(
                    removing.subLevelId
                      ? removeCatalogSubLevel(draft, removing.levelId, removing.subLevelId)
                      : removeCatalogLevel(draft, removing.levelId),
                  );
                  setRemoving(null);
                }
              }}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
