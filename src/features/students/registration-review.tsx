import { Button } from '@/components/ui/button';
import {
  labelFor,
  meetingResults,
  meetingTypes,
  scheduledResults,
} from '@/features/meetings/meeting-options';
import { displayPhone } from '@/lib/validation';
import { negativeReasonLabel } from '@/features/meetings/meeting-options';
import {
  dayPeriods,
  genders,
  bloodTypes,
  maritalStatuses,
  studentTypes,
  timePeriods,
  type RegistrationDraft,
} from './registration-model';
export function registrationReviewSections(d: RegistrationDraft) {
  return [
    {
      title: 'Kişisel bilgiler',
      rows: [
        ['Ad soyad', d.name],
        ['Öğrenci tipi', labelFor(studentTypes, d.studentType)],
        ['E-posta', d.email],
        ['Telefon', displayPhone(d.phone)],
        ['İkinci telefon', displayPhone(d.secondPhone)],
        ['Telefon teyidi', d.checkPhone ? 'Öğrenciyle teyit edildi' : 'Henüz teyit edilmedi'],
        ['Kimlik / pasaport', d.identityNumber],
        ['Doğum tarihi', d.birthDate ? d.birthDate.split('-').reverse().join('.') : ''],
        ['Doğum yeri', d.birthPlace],
        ['Cinsiyet', labelFor(genders, d.gender)],
        ['Kan grubu', labelFor(bloodTypes, d.bloodType)],
        ['Medeni durum', labelFor(maritalStatuses, d.maritalStatus)],
        ['Meslek / uzmanlık', d.personalOccupation],
        ['Adres', d.address],
        ['Profil fotoğrafı', d.image ? 'Eklendi' : ''],
      ],
    },
    {
      title: 'Eğitim bilgileri',
      rows: [
        ['Eğitim', d.course],
        [
          'Ders tipi',
          d.courseType === 'GROUP'
            ? 'Grup dersi'
            : d.courseType === 'INDIVIDUAL'
              ? 'Bireysel ders'
              : '',
        ],
        ['Seviye', [d.level, d.subLevel].filter(Boolean).join(' · ')],
        [
          'Gün tercihi',
          d.dayPreference === 'CUSTOM' ? d.customDays : labelFor(dayPeriods, d.dayPreference),
        ],
        [
          'Saat tercihi',
          d.timePreference === 'CUSTOM' ? d.customTime : labelFor(timePeriods, d.timePreference),
        ],
        [
          'Meslek',
          labelFor(
            [
              ['STUDENT', 'Öğrenci'],
              ['EMPLOYEE', 'Çalışan'],
              ['UNEMPLOYED', 'Çalışmıyor'],
            ],
            d.occupation,
          ),
        ],
        ['Kaynak', d.source],
        ['Okul / kurum', d.institution],
        ['Şirket', d.company],
        ['Danışman', d.advisor],
        ['Hesap durumu', d.status === 'ACTIVE' ? 'Aktif' : 'Pasif'],
      ],
    },
    {
      title: 'İlk görüşme',
      rows: [
        ['Görüşme tipi', labelFor(meetingTypes, d.meetingType)],
        ['Sonuç', labelFor(meetingResults, d.meetingResult)],
        ['Skor', `${d.meetingScore} / 5`],
        [
          'Planlanan zaman',
          scheduledResults.has(d.meetingResult) ? d.meetingDate.replace('T', ' ') : 'Planlanmadı',
        ],
        [
          'Olumsuzluk nedeni',
          d.meetingResult === 'NEGATIVE'
            ? negativeReasonLabel(d.negativeReason) || 'Belirtilmedi'
            : '—',
        ],
        ['Görüşme notu', d.meetingNote],
      ],
    },
  ];
}
export function RegistrationReview({
  draft,
  onEdit,
  includeMeeting = true,
}: {
  draft: RegistrationDraft;
  onEdit?: (step: number) => void;
  includeMeeting?: boolean;
}) {
  return (
    <div className="registration-review">
      {registrationReviewSections(draft)
        .slice(0, includeMeeting ? 3 : 2)
        .map((section, index) => (
          <section className="review-section" key={section.title}>
            <header>
              <h2>{section.title}</h2>
              {onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(index)}
                  aria-label={`${section.title} bölümünü düzenle`}
                >
                  Düzenle
                </Button>
              )}
            </header>
            {index === 0 && draft.image && (
              <img
                className="review-profile-photo"
                src={draft.image}
                alt={`${draft.name} profil fotoğrafı`}
              />
            )}
            <dl className="detail-grid">
              {section.rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || 'Belirtilmedi'}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
    </div>
  );
}
