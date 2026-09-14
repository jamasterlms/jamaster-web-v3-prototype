import { CurriculumPage } from './curriculum-page';
import { EducationPage } from './education-page';
import { EducationPeriodsPage } from './education-periods-page';
import { ProgramTermsPage } from './program-terms-page';

export function LearningPage({ route }: { route: string }) {
  if (route.split(/[?#]/)[0].endsWith('/period')) return <EducationPeriodsPage />;
  if (route.includes('/program-terms')) return <ProgramTermsPage />;
  if (route.includes('/curriculum-units')) return <CurriculumPage />;
  return <EducationPage />;
}
