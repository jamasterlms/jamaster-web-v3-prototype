export type Certificate = { id: string; name: string; institution: string; year: string };
export type TeacherPersonal = {
  tcNo?: string;
  birthDate?: string;
  birthPlace?: string;
  gender?: string;
  educationStatus?: string;
  graduatedSchool?: string;
  department?: string;
  address?: string;
  alternativeEmail?: string;
  socialMedia?: string;
  certificates?: Certificate[];
};
