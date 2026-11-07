
export enum ShiftType {
  Morning = '1',
  Evening = '2',
  Night = '3',
  Off = 'W',
  Leave = 'L',
  OtherLeave = 'O',
  PublicHoliday = 'H',
  CompensationLeave = 'P',
  MorningSpecial = '1S',
  MorningOnCall = 'O1',
  EveningOnCall = 'O2',
  NightOnCall = 'O3',
  RequestedMorning = 'R1',
  RequestedEvening = 'R2',
  RequestedNight = 'R3',
  RequestedOff = 'RW',
  None = '-'
}

export type UserRole = 'admin' | 'cns' | 'dcns' | 'head_nurse' | 'ward_supervisor' | 'nurse_supervisor' | 'staff';

export type AccountType = 'admin' | 'cns' | 'dcns' | 'head_nurse' | 'nurse_supervisor' | 'staff';

export type NurseDesignation = 'GCNS' | 'CNS' | 'DCNS' | 'HN' | 'NS' | 'SN' | 'MSA' | 'HA';

export type WardCategory = 'Excellency' | 'Medical' | 'Surgical' | (string & {});

export interface ClinicalDivision {
  id: string;
  name: string;
  description?: string;
  colorTheme?: 'purple' | 'sky' | 'rose' | 'emerald' | 'amber' | 'indigo' | 'teal' | 'cyan' | 'fuchsia' | string;
  icon?: 'Sparkles' | 'Stethoscope' | 'Activity' | 'Heart' | 'Shield' | 'Baby' | 'Cross' | 'Thermometer' | 'Building2' | string;
  createdAt?: string;
  isCustom?: boolean;
}

export const DEFAULT_DIVISIONS: ClinicalDivision[] = [
  {
    id: 'Excellency',
    name: 'Excellency',
    description: 'High-acuity critical care, ICU, PICU, CCU, and specialized inpatient centers',
    colorTheme: 'purple',
    icon: 'Sparkles'
  },
  {
    id: 'Medical',
    name: 'Medical',
    description: 'Emergency, acute adult medicine, cardiology, neurology, and internal medical wards',
    colorTheme: 'sky',
    icon: 'Stethoscope'
  },
  {
    id: 'Surgical',
    name: 'Surgical',
    description: 'Operating theatres, post-operative surgical suites, orthopedics, and trauma care',
    colorTheme: 'rose',
    icon: 'Activity'
  }
];

export interface WardInfo {
  id: string;
  name: string;
  code: string;
  category?: WardCategory;
  description?: string;
  supervisorId?: string;
  supervisorName?: string;
  supervisorEmail?: string;
  headNurseId?: string;
  headNurseName?: string;
  assignedNsIds?: string[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  nurseDesignation?: NurseDesignation;
  category?: WardCategory;
  wardId?: string; // Ward ID or 'ALL' for main admin/CNS
  assignedWardIds?: string[]; // Multiple nominated wards/units for Head Nurse
  staffMemberId?: string;
  reportsToId?: string;
  cnsId?: string;
  cnsName?: string;
  headNurseId?: string;
  headNurseName?: string;
  supervisorId?: string;
  supervisorName?: string;
  assignedSupervisorIds?: string[];
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseCardUrl?: string;
  joinDate?: string;
  isAuthorizedDutyApprover?: boolean;
  photoUrl?: string;
  jobTitle?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  category?: WardCategory;
  email?: string;
  jobTitle?: string;
  isSenior: boolean;
  isMale: boolean;
  maxMorning: number;
  maxEvening: number;
  maxNight: number;
  maxOff: number;
  hasCaringHours?: boolean;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseCardUrl?: string;
  joinDate?: string;
  isAuthorizedDutyApprover?: boolean;
  isCounterPart?: boolean;
  counterPartOf?: string;
  counterPartStart?: string;
  counterPartEnd?: string;
  isWardSupervisor?: boolean;
  wardId?: string;
  role?: UserRole;
  nurseDesignation?: NurseDesignation;
  cnsId?: string;
  cnsName?: string;
  headNurseId?: string;
  headNurseName?: string;
  supervisorId?: string;
  supervisorName?: string;
  isHa?: boolean;
  photoUrl?: string;
}

export interface RosterConfig {
  year: number;
  month: string;
  nextMonthDeployDate?: string; // YYYY-MM-DD specified deploy/release date
  isNextMonthDeployed?: boolean; // explicit deploy flag by Ward Supervisor
  wardName?: string;
  wardId?: string;
  minMorning: number;
  minEvening: number;
  minNight: number;
  minMorningWeekend: number;
  minEveningWeekend: number;
  minNightWeekend: number;
  minMorningHoliday?: number;
  minEveningHoliday?: number;
  minNightHoliday?: number;
  holidays?: string[]; // Date strings like "YYYY-MM-DD"
  minSenior: number;
  maxMale: number;
  maxCaringHoursPerShift?: number;
  maxConsecutiveEvening: number;
  maxConsecutiveNight: number;
  maxConsecutiveDuty: number;
  offAfterNight: number;
  maxOffPerMonth?: number;
  haMinMorning?: number;
  haMinEvening?: number;
  haMinNight?: number;
  haMinMorningWeekend?: number;
  haMinEveningWeekend?: number;
  haMinNightWeekend?: number;
  haMinMorningHoliday?: number;
  haMinEveningHoliday?: number;
  haMinNightHoliday?: number;
  haMinSenior?: number;
  haMaxMale?: number;
  haMaxCaringHoursPerShift?: number;
  haMaxConsecutiveDuty?: number;
  haOffAfterNight?: number;
  haMaxOffPerMonth?: number;
}

export interface Assignment {
  staffId: string;
  date: string; // ISO string or simple YYYY-MM-DD
  shift: ShiftType;
  wardId?: string;
}

export type ExchangeStatus = 
  | 'pending_peer'       // Waiting for target staff member B to accept or refuse
  | 'pending_ws'         // Peer accepted, now waiting for Ward Supervisor (WS) review
  | 'approved'           // WS approved -> Duty updated automatically
  | 'refused_by_peer'    // Target peer staff refused
  | 'refused_by_ws';     // WS refused

export interface DutyExchangeRequest {
  id: string;
  wardId: string;
  requestorStaffId: string;
  requestorStaffName: string;
  requestorStaffEmail: string;
  targetStaffId: string;
  targetStaffName: string;
  targetStaffEmail: string;
  type: 'swap' | 'transfer';
  
  // Requestor's shift details
  requestorDate: string; // e.g. "2025-12-15"
  requestorShift: ShiftType;

  // Target's shift details (if swap)
  targetDate?: string;
  targetShift?: ShiftType;

  reason?: string;
  status: ExchangeStatus;
  
  // Timestamps and notes
  createdAt: string;
  peerActionAt?: string;
  peerNote?: string;
  wsActionAt?: string;
  wsNote?: string;
  wsApproverName?: string;
}

export type WardTransferStatus = 
  | 'pending_target_ws'   // Step 1: Source WS created request, pending Target WS acceptance
  | 'pending_admin'        // Step 2: Target WS accepted, pending Main Admin approval
  | 'approved'             // Step 3: Main Admin approved -> automatically transferred
  | 'rejected_by_target_ws'// Target WS rejected
  | 'rejected_by_admin';   // Main Admin rejected

export interface WardTransferRequest {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail?: string;
  isHa?: boolean;
  isSenior?: boolean;
  
  sourceWardId: string;
  sourceWardName: string;
  sourceWsName?: string;
  sourceWsEmail?: string;

  targetWardId: string;
  targetWardName: string;
  targetWsName?: string;
  targetWsEmail?: string;

  reason?: string;
  status: WardTransferStatus;

  createdAt: string;
  targetWsActionAt?: string;
  targetWsNote?: string;
  adminActionAt?: string;
  adminNote?: string;
  adminApproverName?: string;
}

export interface AppNotification {
  id: string;
  recipientEmail: string;
  recipientStaffId?: string;
  recipientRole?: UserRole;
  title: string;
  message: string;
  type: 'exchange_peer_request' | 'exchange_ws_request' | 'exchange_result' | 'ward_transfer_target_ws' | 'ward_transfer_admin' | 'ward_transfer_result' | 'general';
  requestId?: string;
  isRead: boolean;
  createdAt: string;
}

export type TabType = 'Wards' | 'Staff' | 'Rules' | 'Manual' | 'Generate' | 'Calendar' | 'StaffPortal' | 'Hierarchy' | 'OnCall';
export type ThemeType = 'Professional' | 'Colorful' | 'Attractive' | 'Day' | 'Night';

