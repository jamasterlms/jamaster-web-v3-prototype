import { educationProjection } from '@/features/insights/leaf-projection';
import { readReportData } from '@/features/insights/report-data';
import { localDate } from '@/lib/validation';
import { SmartSuggestions } from '@/components/layout/smart-suggestions';
import { useMemberships } from '@/features/education/use-memberships';
import { useWorkspace } from '@/app/workspace-provider';
import type { WorkspaceState } from '@/app/workspace-reducer';
import { Icon } from '@/components/shared/icon';
import { IconButton } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { attendanceStats } from '@/features/calendar/attendance-model';
import { financeRecords, saleBalance } from '@/features/finance/finance-model';
import { navigate } from '@/hooks/use-route';
import { eventDay } from '@/lib/calendar';
import { money, normalize } from '@/lib/format';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
export function replyFor(text: string, state: WorkspaceState, groupLabel?: (id: number) => string) {
  const query = normalize(text),
    student = state.students.find((s) => query.includes(normalize(s.name).split(' ')[0]));
  const sessions = (state.attendanceSessions || []).filter((s) => s.branch === state.branch);
  const finance = financeRecords(state);
  const balanceFor = (id: number) =>
    finance.sales
      .filter((s) => s.studentId === id)
      .reduce((n, s) => n + saleBalance(s, finance.receipts), 0);
  if (student) {
    const rate = attendanceStats(sessions, student.id).rate;
    return `${student.name}, ${student.course} eğitiminde. Grubu: ${groupLabel ? groupLabel(student.id) : 'Grup bilgisi için öğrenci detayını açın'}. ${rate === null ? 'Kaydedilmiş yoklaması bulunmuyor.' : `Kaydedilen devam oranı %${rate}.`}\n\nKalan bakiye: ${money(balanceFor(student.id))}.`;
  }
  if (/tahsil|ödeme|taksit|finans/.test(query)) {
    const pending = state.students.filter((s) => balanceFor(s.id) > 0);
    if (!pending.length) return 'Ödeme bekleyen öğrenci kaydı bulunmuyor.';
    return `Ödeme bekleyen ${pending.length} öğrenci, toplam ${money(pending.reduce((n, s) => n + balanceFor(s.id), 0))}.\n\n${pending.map((s) => `${s.name} · ${money(balanceFor(s.id))}`).join('\n')}`;
  }
  if (/risk|takip|öğrenci|devam/.test(query)) {
    const today = localDate(),
      criterion = readReportData(state).criteria.attendanceLowBelow;
    if (criterion == null)
      return 'Devam riski ölçütü belirlenmedi. Devam riski raporundaki Rapor ölçütleri bölümünden yüzde eşiğini seçebilirsiniz.';
    const report = educationProjection(
      state,
      { memberships: [], history: [], unresolved: [] },
      'attendance-risk-students',
      {
        search: '',
        status: [],
        paymentType: [],
        startDate: today.slice(0, 7) + '-01',
        endDate: today,
        sort: 'attendanceRate',
        order: 'asc',
      },
      today,
    );
    return `Bu ay kaydedilen devam oranı %${criterion} altında olan ${report.rows.length} öğrenci:\n\n${report.rows.map((s) => `${s.studentName} · %${Number(s.attendanceRate).toFixed(1)} devam`).join('\n')}${report.unknown ? `\n\n${report.unknown} öğrencinin devamı bilinmiyor.` : ''}`;
  }
  if (/gündem|bugün|ders|özet|program/.test(query)) {
    const events = state.events.filter((e) => e.day === eventDay() && e.status !== 'cancelled');
    return `Bugün ${events.filter((e) => e.type === 'lesson').length} ders ve ${events.filter((e) => e.type === 'meeting').length} görüşme planlanmış.\n\n${events.map((e) => `${e.time} · ${e.title}`).join('\n')}`;
  }
  return 'Öğrenci adı, ders programı, devam durumu veya tahsilatlar üzerinden yardımcı olabilirim.\n\nHangi öğrenci ya da dönem için bilgi almak istersiniz?';
}
export function JamAIPanel() {
  const memberships = useMemberships();
  const { state, dispatch } = useWorkspace();
  const [text, setText] = useState('');
  const messages = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const send = (value: string) => {
    if (!value.trim()) return;
    dispatch({
      type: 'chat/add',
      messages: [
        { id: Date.now(), role: 'user', text: value.trim() },
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: replyFor(value, state, memberships.labelFor),
        },
      ],
    });
    setText('');
  };
  useEffect(() => {
    if (messages.current)
      messages.current.scrollTop = state.chat.length ? messages.current.scrollHeight : 0;
  }, [state.chat.length]);
  useLayoutEffect(() => {
    const input = composer.current;
    if (!input) return;
    input.style.height = 'auto';
    const maximum = parseFloat(getComputedStyle(document.documentElement).fontSize) * 7;
    input.style.height = `${Math.min(input.scrollHeight, maximum)}px`;
  }, [text]);
  return (
    <div className="jamai-main">
      <div ref={messages} className="jamai-messages">
        {!state.chat.length && (
          <>
            <div className="jamai-intro">
              <div className="jamai-symbol">
                <Icon name="sparkles" />
              </div>
              <h3>Merhaba, Furkan.</h3>
              <p>
                Şubenizin gündemine birlikte bakalım.
                <br />
                Bugün nereden başlamak istersiniz?
              </p>
            </div>
            <div className="jamai-suggestions">
              {[
                ['calendar-days', 'Bugünkü gündemimi özetle'],
                ['users', 'Takip etmem gereken öğrenciler kimler?'],
                ['wallet', 'Bekleyen tahsilatları göster'],
              ].map(([icon, text]) => (
                <button className="jamai-suggestion" key={text} onClick={() => send(text)}>
                  <Icon name={icon} />
                  {text}
                </button>
              ))}
            </div>
          </>
        )}
        <SmartSuggestions />
        <div role="log" aria-label="JamAI sohbeti" aria-live="polite">
          {state.chat.map((message) => (
            <div key={message.id} className={`chat-message ${message.role}`}>
              <span className="chat-author">{message.role === 'user' ? 'Siz' : 'JamAI'}</span>
              <p className="whitespace-pre-line">{message.text}</p>
            </div>
          ))}
        </div>
      </div>
      {!!state.chat.length && (
        <Button variant="ghost" size="sm" onClick={() => navigate('admin/reports/meetings')}>
          Görüşmeleri aç
          <Icon name="arrow-up-right" />
        </Button>
      )}
      <form
        className="jamai-compose"
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
      >
        <Textarea
          ref={composer}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="JamAI’a sor…"
          aria-label="JamAI mesajı"
          rows={1}
          maxLength={600}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send(text);
            }
          }}
        />
        <IconButton
          icon="arrow-right"
          label="Mesajı gönder"
          type="submit"
          className="dark"
          disabled={!text.trim()}
        />
      </form>
      <div className="jamai-context">
        <Icon name="building2" />
        <span>{state.branch} şubesi</span>
        <IconButton
          icon="refresh-cw"
          label="Sohbeti temizle"
          className="ml-auto"
          onClick={() => dispatch({ type: 'chat/clear' })}
        />
      </div>
    </div>
  );
}
