import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/primitives';
import {
  activityStatuses,
  submissionGradeLabel,
  type Activity,
  type Submission,
} from '@/features/activities/activity-model';
import { submissionIssue, submissionStatuses } from '@/features/activities/submission-model';
import { fullDateTR } from '@/lib/format';
import {
  removeSubmissionFiles,
  storeSubmissionFiles,
} from '@/features/activities/submission-file-store';

export function StudentSubmission({
  activity,
  studentId,
  submission,
}: {
  activity: Activity;
  studentId: number;
  submission?: Submission;
}) {
  const workspace = useWorkspace();
  const { dispatch } = workspace;
  const latestState = useRef(workspace.state);
  latestState.current = workspace.state;
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState('');
  const editable = !['CLOSED', 'ARCHIVED'].includes(activity.status);
  const requiresText = activity.requireText ?? true;
  const requiresFile = activity.requireFile ?? false;
  return (
    <Card className="portal-section">
      <StatusBadge>{activityStatuses[activity.status]}</StatusBadge>
      <h2>{activity.title}</h2>
      <p className="whitespace-pre-wrap break-words">{activity.description}</p>
      {activity.instructions && (
        <p className="whitespace-pre-wrap break-words">{activity.instructions}</p>
      )}
      <p>
        Son teslim: {activity.dueDate ? fullDateTR(activity.dueDate) : 'Süre sınırı yok'} ·{' '}
        {activity.allowLateSubmission ? 'Geç teslim açık' : 'Geç teslim kapalı'}
      </p>
      {submission && (
        <section className="checkout-review-block">
          <StatusBadge>{submissionStatuses[submission.status]}</StatusBadge>
          <p>Not: {submissionGradeLabel(submission, activity.maxPoints)}</p>
          {submission.feedback && <p>{submission.feedback}</p>}
          {submission.text && <p className="whitespace-pre-wrap break-words">{submission.text}</p>}
          {submission.files?.length ? (
            <ul>
              {submission.files.map((file, index) => (
                <li key={`${file.name}-${index}`}>{file.name}</li>
              ))}
            </ul>
          ) : null}
        </section>
      )}
      {editable ? (
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (inFlight.current) return;
            const issue = submissionIssue(activity, text, submission, Date.now(), files);
            if (issue) return setError(issue);
            inFlight.current = true;
            setSubmitting(true);
            const submissionId = submission?.id || crypto.randomUUID();
            let storedFiles: NonNullable<Submission['files']> = [];
            try {
              storedFiles = files.length ? await storeSubmissionFiles(submissionId, files) : [];
              const current = latestState.current;
              if (!mounted.current || current.branch !== workspace.state.branch)
                throw new Error('Çalışma alanı değişti. Dosyalar gönderilmedi.');
              const currentActivity = current.activities?.find((item) => item.id === activity.id);
              const currentSubmission = current.activitySubmissions?.find(
                (item) => item.activityId === activity.id && item.studentId === studentId,
              );
              const activeMember = current.groupMemberships?.memberships.some(
                (member) =>
                  member.studentId === studentId &&
                  member.groupId === currentActivity?.groupId &&
                  member.status === 'active',
              );
              const currentIssue = currentActivity
                ? submissionIssue(currentActivity, text, currentSubmission, Date.now(), files)
                : 'Aktivite artık bulunmuyor.';
              if (!currentActivity || !activeMember || currentIssue)
                throw new Error(
                  currentIssue || 'Grup üyeliğiniz değişti. Teslimi yeniden kontrol edin.',
                );
              if (
                currentActivity.updatedAt !== activity.updatedAt ||
                (currentSubmission?.submittedAt ?? null) !== (submission?.submittedAt ?? null)
              )
                throw new Error(
                  'Aktivite veya teslim başka bir işlemle değişti. Yeniden kontrol edin.',
                );

              const saveToken = crypto.randomUUID();
              flushSync(() =>
                dispatch({
                  type: 'submission/save',
                  expectedBranch: workspace.state.branch,
                  expectedActivityUpdatedAt: currentActivity.updatedAt,
                  expectedPreviousSubmittedAt: currentSubmission?.submittedAt ?? null,
                  submission: {
                    id: submissionId,
                    activityId: activity.id,
                    studentId,
                    studentName: '',
                    text: text.trim() || undefined,
                    files: storedFiles,
                    submittedAt: new Date().toISOString(),
                    status: 'SUBMITTED',
                    attemptNumber:
                      (currentSubmission?.attemptNumber ?? (currentSubmission ? 1 : 0)) + 1,
                    saveToken,
                  },
                }),
              );
              const confirmed = latestState.current.activitySubmissions?.find(
                (item) => item.activityId === activity.id && item.studentId === studentId,
              );
              if (confirmed?.saveToken !== saveToken)
                throw new Error('Teslim kaydı doğrulanamadı. Lütfen yeniden deneyin.');
              if (submission?.files?.length)
                void removeSubmissionFiles(submission.files).catch(() => undefined);
              toast.success(
                submission ? 'Yeni tesliminiz kaydedildi.' : 'Çalışmanız teslim edildi.',
              );
              setText('');
              setFiles([]);
              setFileInputKey((value) => value + 1);
              setError('');
            } catch (cause) {
              if (storedFiles.length)
                await removeSubmissionFiles(storedFiles).catch(() => undefined);
              setError(
                cause instanceof Error ? cause.message : 'Dosyalar yerel alana kaydedilemedi.',
              );
            } finally {
              inFlight.current = false;
              setSubmitting(false);
            }
          }}
        >
          {requiresText && (
            <div className="form-field">
              <Label htmlFor="activity-answer">Çalışmanız *</Label>
              <Textarea
                id="activity-answer"
                placeholder="Çalışma metninizi buraya yazın"
                rows={8}
                value={text}
                maxLength={10000}
                disabled={submitting}
                onChange={(event) => setText(event.target.value)}
                aria-invalid={!!error}
              />
              <small>{text.length.toLocaleString('tr-TR')} / 10.000 karakter</small>
            </div>
          )}
          {requiresFile && (
            <div className="form-field">
              <Label htmlFor="activity-files">Dosyalar *</Label>
              <input
                key={fileInputKey}
                id="activity-files"
                className="file-input"
                type="file"
                multiple
                disabled={submitting}
                onChange={(event) => setFiles(Array.from(event.target.files || []))}
              />
              <small>Birden fazla belge seçebilirsiniz.</small>
              {files.length > 0 && (
                <ul className="portal-file-list">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`}>
                      <span>{file.name}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={submitting}
                        onClick={() =>
                          setFiles((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                      >
                        Kaldır
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting
              ? 'Kaydediliyor…'
              : submission
                ? 'Yeni teslim gönder'
                : 'Çalışmayı teslim et'}
          </Button>
        </form>
      ) : (
        <p className="empty-inline">Bu aktivite teslim almıyor.</p>
      )}
    </Card>
  );
}
