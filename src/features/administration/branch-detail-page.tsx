import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '@/app/workspace-provider';
import { operationalData } from '@/data/institution';
import { identifyTeamRows } from '@/features/entities/entity-model';
import { branchDraft, branchToRow } from './branch-model';
import { BranchDialog } from './branch-dialog';
import { PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { money } from '@/lib/format';
export function BranchDetailPage({ id }: { id: string }) {
  const { state, dispatch } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const rows = identifyTeamRows(
    state.moduleRows.branches || operationalData.branches.rows,
    'branches',
  );
  const row = rows.find((r) => r[5] === id);
  if (!row)
    return (
      <>
        <PageHeading title="Şube bulunamadı" />
        <Button asChild>
          <Link to="/super/branches">Şubelere dön</Link>
        </Button>
      </>
    );
  const branch = branchDraft(row);
  return (
    <>
      <PageHeading title={branch.name} description={branch.address}>
        <Button onClick={() => setEditing(true)}>Şubeyi düzenle</Button>
      </PageHeading>
      <Card className="student-profile-card">
        <div className="detail-header">
          <StatusBadge>{row[4]}</StatusBadge>
        </div>
        <dl className="detail-grid">
          {[
            ['Adres', branch.address],
            ['Telefon', branch.phone],
            ['E-posta', branch.email],
            ['Web sitesi', branch.website],
            [
              'Aylık ödeme',
              branch.paymentCurrency === 'TRY'
                ? money(branch.monthlyPayment)
                : `${branch.monthlyPayment} ${branch.paymentCurrency}`,
            ],
            ['Ödeme günü', String(branch.paymentDay)],
            ['Para birimi', branch.settings.currency],
            ['Dil', branch.settings.language === 'tr' ? 'Türkçe' : 'English'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || 'Belirtilmedi'}</dd>
            </div>
          ))}
        </dl>
        <p className="whitespace-pre-wrap break-words">{branch.description}</p>
        <div className="form-actions">
          {branch.phone && (
            <Button variant="outline" asChild>
              <a href={`tel:${branch.phone}`}>Şubeyi ara</a>
            </Button>
          )}
          {branch.email && (
            <Button variant="outline" asChild>
              <a href={`mailto:${branch.email}`}>E-posta</a>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/super/branches">Şube listesi</Link>
          </Button>
        </div>
      </Card>
      {editing && (
        <BranchDialog
          row={row}
          onClose={() => setEditing(false)}
          onSave={(draft) => {
            dispatch({
              type: 'module/rows',
              key: 'branches',
              rows: rows.map((r) => (r[5] === id ? branchToRow(draft, r) : r)),
            });
            if (state.branch === branch.name && draft.name !== branch.name)
              dispatch({ type: 'branch/set', branch: draft.name });
            setEditing(false);
          }}
        />
      )}
    </>
  );
}
