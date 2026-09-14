import type { Activity } from './activity-model';
const createdAt = new Date().toISOString();
export const initialActivities: Activity[] = [
  {
    id: 'activity-speaking',
    title: 'Kendini tanıtma ve günlük rutin',
    type: 'ASSIGNMENT',
    groupId: 'g1',
    gradingMethod: 'POINTS',
    maxPoints: 100,
    description:
      'Kendinizi ve günlük rutininizi İngilizce 100–150 kelimeyle anlatın. Present Simple kullanımına dikkat edin.',
    instructions:
      'Metninizi teslim alanına yazın. Öğretmeniniz değerlendirdikten sonra notunuzu burada görebilirsiniz.',
    allowLateSubmission: true,
    status: 'PUBLISHED',
    createdAt,
    updatedAt: createdAt,
  },
];
