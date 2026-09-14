import { useState } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { Activity, Submission } from './activity-model';
import { gradeIssue } from './submission-model';
import { downloadSubmissionFile } from './submission-file-store';
export function ActivityGradingDialog({
  activity,
  submission,
  onClose,
}: {
  activity: Activity;
  submission: Submission | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!submission}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="jam-modal dialog-wide">
        <DialogHeader>
          <DialogTitle>Teslimi değerlendir</DialogTitle>
          <DialogDescription>
            {submission?.studentName} · {activity.title}
          </DialogDescription>
        </DialogHeader>
        {submission && (
          <GradingForm
            key={submission.id}
            activity={activity}
            submission={submission}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
function GradingForm({
  activity,
  submission,
  onClose,
}: {
  activity: Activity;
  submission: Submission;
  onClose: () => void;
}) {
  const { dispatch } = useWorkspace();
  const [grade, setGrade] = useState(submission.grade?.toString() || ''),
    [letter, setLetter] = useState(submission.letterGrade || ''),
    [feedback, setFeedback] = useState(submission.feedback || ''),
    [privateFeedback, setPrivateFeedback] = useState(submission.privateFeedback || ''),
    [error, setError] = useState('');
  const save = (returned: boolean) => {
    const value = grade.trim() ? Number(grade) : undefined;
    const issue = gradeIssue(activity, value, letter, feedback, returned);
    if (issue) {
      setError(issue);
      return;
    }
    dispatch({
      type: 'submission/grade',
      id: submission.id,
      grade: value,
      letter,
      feedback,
      privateFeedback,
      returned,
    });
    toast.success(returned ? 'Düzeltme talebi kaydedildi.' : 'Değerlendirme kaydedildi.');
    onClose();
  };
  return (
    <form
      className="dialog-form"
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
      noValidate
    >
      <div className="dialog-form-body">
        <section className="checkout-review-block">
          <h3>Öğrencinin teslimi</h3>
          <p className="whitespace-pre-wrap break-words">{submission.text || 'Metin eklenmedi.'}</p>
          {submission.files?.length ? (
            <ul className="portal-file-list">
              {submission.files.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  <span>{file.name}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await downloadSubmissionFile(file);
                      } catch (cause) {
                        toast.error(cause instanceof Error ? cause.message : 'Dosya açılamadı.');
                      }
                    }}
                  >
                    İndir
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
        <fieldset className="form-section" data-form-section="required">
          <legend>
            Değerlendirme <span>Zorunlu</span>
          </legend>
          <div className="form-field">
            <Label htmlFor="submission-grade">Not *</Label>
            {activity.gradingMethod === 'PASS_FAIL' ? (
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="submission-grade">
                  <SelectValue placeholder="Sonuç seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Geçti</SelectItem>
                  <SelectItem value="0">Kaldı</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="submission-grade"
                type={activity.gradingMethod === 'LETTER' ? 'text' : 'number'}
                min={0}
                max={activity.maxPoints || 100}
                step="0.01"
                placeholder={
                  activity.gradingMethod === 'LETTER'
                    ? 'A, B+, C…'
                    : `0–${activity.maxPoints || 100}`
                }
                value={activity.gradingMethod === 'LETTER' ? letter : grade}
                onChange={(e) =>
                  activity.gradingMethod === 'LETTER'
                    ? setLetter(e.target.value)
                    : setGrade(e.target.value)
                }
                aria-invalid={!!error}
              />
            )}
          </div>
        </fieldset>
        <fieldset className="form-section" data-form-section="optional">
          <legend>
            Geri bildirim <span>İsteğe bağlı</span>
          </legend>
          <div className="form-field">
            <Label htmlFor="submission-feedback">Öğrenciye geri bildirim</Label>
            <Textarea
              id="submission-feedback"
              placeholder="Güçlü yönler ve geliştirilmesi gereken noktalar"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={5000}
            />
          </div>
          <div className="form-field">
            <Label htmlFor="submission-private">Öğretmen notu</Label>
            <Textarea
              id="submission-private"
              placeholder="Öğrenciye gösterilmeyen değerlendirme notu"
              value={privateFeedback}
              onChange={(e) => setPrivateFeedback(e.target.value)}
              maxLength={5000}
            />
          </div>
        </fieldset>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="button" variant="secondary" onClick={() => save(true)}>
          Düzeltme iste
        </Button>
        <Button type="submit">Notu kaydet</Button>
      </DialogFooter>
    </form>
  );
}
