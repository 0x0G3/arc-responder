export type UserRole = 'DISPATCHER' | 'HOSPITAL_MANAGER' | 'ADMIN';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  assignedHospitalId?: string;
}
