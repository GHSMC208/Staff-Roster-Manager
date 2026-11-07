import { WardInfo, UserAccount, StaffMember } from '../types';

export const INITIAL_WARDS: WardInfo[] = [
  // Excellency Division
  { 
    id: 'ward-icu', 
    name: 'ICU (Intensive Care Unit)', 
    code: 'ICU', 
    category: 'Excellency', 
    description: 'Level 1 Adult Intensive Care Unit for multi-organ support', 
    headNurseId: 'usr-hn-icu', 
    headNurseName: 'David Miller', 
    supervisorId: 'usr-ns-icu1', 
    supervisorName: 'Rachel Adams', 
    supervisorEmail: 'rachel.ns.icu1@hospital.org',
    assignedNsIds: ['usr-ns-icu1', 'usr-ns-icu2']
  },
  { 
    id: 'ward-picu', 
    name: 'PICU (Pediatric Intensive Care Unit)', 
    code: 'PICU', 
    category: 'Excellency', 
    description: 'Specialized pediatric critical care and neonatal stabilization', 
    headNurseId: 'usr-hn-icu', 
    headNurseName: 'David Miller', 
    supervisorId: 'usr-ns-picu', 
    supervisorName: 'Faisal Al-Doseri', 
    supervisorEmail: 'faisal.ns.picu@hospital.org',
    assignedNsIds: ['usr-ns-picu']
  },
  { 
    id: 'ward-ccu', 
    name: 'Coronary Care Unit (CCU)', 
    code: 'CCU', 
    category: 'Excellency', 
    description: 'Acute cardiac intensive care and hemodynamic monitoring unit', 
    headNurseId: 'usr-hn-ccu', 
    headNurseName: 'Elena Rostova', 
    supervisorId: 'usr-ns-ccu1', 
    supervisorName: 'Tariq Mansoor', 
    supervisorEmail: 'tariq.ns.ccu@hospital.org',
    assignedNsIds: ['usr-ns-ccu1']
  },
  { 
    id: 'ward-cicu', 
    name: 'CICU (Cardiac Step-Down & Inpatient Unit)', 
    code: 'CICU', 
    category: 'Excellency', 
    description: 'Sub-acute cardiac telemetry care and post-intervention recovery', 
    headNurseId: 'usr-hn-ccu', 
    headNurseName: 'Elena Rostova', 
    supervisorId: 'usr-ns-cicu', 
    supervisorName: 'Layla Qasim', 
    supervisorEmail: 'layla.ns.cicu@hospital.org',
    assignedNsIds: ['usr-ns-cicu']
  },

  // Medical Division
  { 
    id: 'ward-er', 
    name: 'Emergency Room & Trauma (ER)', 
    code: 'ER', 
    category: 'Medical', 
    description: '24/7 Level 1 emergency triage, acute trauma, and resuscitation unit', 
    headNurseId: 'usr-hn-er', 
    headNurseName: 'Maria Garcia', 
    supervisorId: 'usr-ns-er1', 
    supervisorName: 'Jessica Taylor', 
    supervisorEmail: 'jessica.ns.er@hospital.org',
    assignedNsIds: ['usr-ns-er1']
  },
  { 
    id: 'ward-eou', 
    name: 'EOU (Emergency Observation & Triage Unit)', 
    code: 'EOU', 
    category: 'Medical', 
    description: 'Short-stay acute observation and rapid-diagnostic clinical unit', 
    headNurseId: 'usr-hn-er', 
    headNurseName: 'Maria Garcia', 
    supervisorId: 'usr-ns-eou', 
    supervisorName: 'Khalid Al-Ghamdi', 
    supervisorEmail: 'khalid.ns.eou@hospital.org',
    assignedNsIds: ['usr-ns-eou']
  },
  { 
    id: 'ward-general', 
    name: 'General Medical Ward (Internal Medicine)', 
    code: 'MED', 
    category: 'Medical', 
    description: 'Inpatient comprehensive internal medicine and geriatric care', 
    headNurseId: 'usr-hn-gen', 
    headNurseName: 'Alex Wong', 
    supervisorId: 'usr-ns-gen1', 
    supervisorName: 'Chloe Bennett', 
    supervisorEmail: 'chloe.ns.gen@hospital.org',
    assignedNsIds: ['usr-ns-gen1']
  },
  { 
    id: 'ward-pulm', 
    name: 'PULM (Respiratory & Pulmonology Unit)', 
    code: 'PULM', 
    category: 'Medical', 
    description: 'Advanced respiratory isolation and pulmonary disease care unit', 
    headNurseId: 'usr-hn-gen', 
    headNurseName: 'Alex Wong', 
    supervisorId: 'usr-ns-pulm', 
    supervisorName: 'Zainab Al-Husseini', 
    supervisorEmail: 'zainab.ns.pulm@hospital.org',
    assignedNsIds: ['usr-ns-pulm']
  },

  // Surgical Division
  { 
    id: 'ward-surgical', 
    name: 'Surgical & Post-Op Recovery Unit', 
    code: 'SURG', 
    category: 'Surgical', 
    description: 'General inpatient surgical care and post-operative recovery unit', 
    headNurseId: 'usr-hn-surg', 
    headNurseName: 'Michael Chang', 
    supervisorId: 'usr-ns-surg1', 
    supervisorName: 'Catherine Howard', 
    supervisorEmail: 'catherine.ns.surg@hospital.org',
    assignedNsIds: ['usr-ns-surg1']
  },
  { 
    id: 'ward-or', 
    name: 'OR & Day Surgery Unit (Operative Suites)', 
    code: 'OR', 
    category: 'Surgical', 
    description: 'Perioperative operating theatre suites and ambulatory surgery care', 
    headNurseId: 'usr-hn-surg', 
    headNurseName: 'Michael Chang', 
    supervisorId: 'usr-ns-or', 
    supervisorName: 'Daniel Kim', 
    supervisorEmail: 'daniel.ns.or@hospital.org',
    assignedNsIds: ['usr-ns-or']
  },
  { 
    id: 'ward-ortho', 
    name: 'ORTHO (Orthopedic & Trauma Surgery Unit)', 
    code: 'ORTHO', 
    category: 'Surgical', 
    description: 'Specialized musculoskeletal, joint arthroplasty, and spine surgery unit', 
    headNurseId: 'usr-hn-ortho', 
    headNurseName: 'Sarah Al-Mahmood', 
    supervisorId: 'usr-ns-ortho', 
    supervisorName: 'Maya Patel', 
    supervisorEmail: 'maya.ns.ortho@hospital.org',
    assignedNsIds: ['usr-ns-ortho']
  },
  { 
    id: 'ward-neuro', 
    name: 'NEURO (Neurosurgery & Spine Unit)', 
    code: 'NEURO', 
    category: 'Surgical', 
    description: 'Complex cranial and neurosurgical post-intervention care unit', 
    headNurseId: 'usr-hn-ortho', 
    headNurseName: 'Sarah Al-Mahmood', 
    supervisorId: 'usr-ns-neuro', 
    supervisorName: 'Sami Al-Haddad', 
    supervisorEmail: 'sami.ns.neuro@hospital.org',
    assignedNsIds: ['usr-ns-neuro']
  }
];

export const INITIAL_USERS: UserAccount[] = [
  // 1. Tier 1: GCNS (General Chief Nursing Services) - Apex Hospital Command
  { 
    id: 'usr-admin', 
    name: 'Dr. Sarah Jenkins', 
    email: 'admin@hospital.org', 
    role: 'admin', 
    nurseDesignation: 'GCNS',
    wardId: 'ALL', 
    jobTitle: 'General Chief Nursing Services (GCNS)', 
    licenseNumber: 'MED-2022-001', 
    licenseExpiry: '2028-12-31', 
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250' 
  },

  // 2. Tier 2: Executive Division Directorate (CNS & DCNS)
  {
    id: 'usr-cns-excellency',
    name: 'Dr. Eleanor Vance',
    email: 'eleanor.cns.excellency@hospital.org',
    role: 'cns',
    nurseDesignation: 'CNS',
    category: 'Excellency',
    wardId: 'ALL',
    jobTitle: 'Chief Nursing Services (CNS - Excellency Division)',
    licenseNumber: 'NUR-CNS-7001',
    licenseExpiry: '2028-06-30',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-dcns-excellency',
    name: 'Dr. Marcus Brody',
    email: 'marcus.dcns.excellency@hospital.org',
    role: 'dcns',
    nurseDesignation: 'DCNS',
    category: 'Excellency',
    wardId: 'ALL',
    cnsId: 'usr-cns-excellency',
    cnsName: 'Dr. Eleanor Vance',
    jobTitle: 'Deputy Chief Nursing Services (DCNS - Excellency Division)',
    licenseNumber: 'NUR-DCNS-7005',
    licenseExpiry: '2028-08-31',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-cns-medical',
    name: 'Dr. Robert Hayes',
    email: 'robert.cns.medical@hospital.org',
    role: 'cns',
    nurseDesignation: 'CNS',
    category: 'Medical',
    wardId: 'ALL',
    jobTitle: 'Chief Nursing Services (CNS - Medical Division)',
    licenseNumber: 'NUR-CNS-7002',
    licenseExpiry: '2028-09-30',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-dcns-medical',
    name: 'Dr. Julian Drake',
    email: 'julian.dcns.medical@hospital.org',
    role: 'dcns',
    nurseDesignation: 'DCNS',
    category: 'Medical',
    wardId: 'ALL',
    cnsId: 'usr-cns-medical',
    cnsName: 'Dr. Robert Hayes',
    jobTitle: 'Deputy Chief Nursing Services (DCNS - Medical Division)',
    licenseNumber: 'NUR-DCNS-7004',
    licenseExpiry: '2028-10-31',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-cns-surgical',
    name: 'Dr. Victoria Sterling',
    email: 'victoria.cns.surgical@hospital.org',
    role: 'cns',
    nurseDesignation: 'CNS',
    category: 'Surgical',
    wardId: 'ALL',
    jobTitle: 'Chief Nursing Services (CNS - Surgical Division)',
    licenseNumber: 'NUR-CNS-7003',
    licenseExpiry: '2028-11-30',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1594824813566-832f91a511ef?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-dcns-surgical',
    name: 'Dr. Evelyn Thorne',
    email: 'evelyn.dcns.surgical@hospital.org',
    role: 'dcns',
    nurseDesignation: 'DCNS',
    category: 'Surgical',
    wardId: 'ALL',
    cnsId: 'usr-cns-surgical',
    cnsName: 'Dr. Victoria Sterling',
    jobTitle: 'Deputy Chief Nursing Services (DCNS - Surgical Division)',
    licenseNumber: 'NUR-DCNS-7006',
    licenseExpiry: '2028-12-15',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=250'
  },
  
  // 3. Tier 3: Head Nurses (HN) (Each oversees at least 2 nominated wards/units)
  { 
    id: 'usr-hn-icu', 
    name: 'David Miller', 
    email: 'david.hn.icu@hospital.org', 
    role: 'head_nurse', 
    nurseDesignation: 'HN',
    category: 'Excellency',
    cnsId: 'usr-cns-excellency',
    cnsName: 'Dr. Eleanor Vance',
    wardId: 'ward-icu', 
    assignedWardIds: ['ward-icu', 'ward-picu'],
    jobTitle: 'Head Nurse (Critical Care: ICU & PICU)', 
    licenseNumber: 'NUR-HN-8012', 
    licenseExpiry: '2027-08-31', 
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-hn-ccu', 
    name: 'Elena Rostova', 
    email: 'elena.hn.ccu@hospital.org', 
    role: 'head_nurse', 
    nurseDesignation: 'HN',
    category: 'Excellency',
    cnsId: 'usr-cns-excellency',
    cnsName: 'Dr. Eleanor Vance',
    wardId: 'ward-ccu', 
    assignedWardIds: ['ward-ccu', 'ward-cicu'],
    jobTitle: 'Head Nurse (Cardiovascular: CCU & CICU)', 
    licenseNumber: 'NUR-HN-8015', 
    licenseExpiry: '2027-12-15', 
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-hn-er', 
    name: 'Maria Garcia', 
    email: 'maria.hn.er@hospital.org', 
    role: 'head_nurse', 
    nurseDesignation: 'HN',
    category: 'Medical',
    cnsId: 'usr-cns-medical',
    cnsName: 'Dr. Robert Hayes',
    wardId: 'ward-er', 
    assignedWardIds: ['ward-er', 'ward-eou'],
    jobTitle: 'Head Nurse (Emergency Services: ER & EOU)', 
    licenseNumber: 'NUR-HN-8013', 
    licenseExpiry: '2027-09-30', 
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1594824813566-832f91a511ef?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-hn-gen', 
    name: 'Alex Wong', 
    email: 'alex.hn.gen@hospital.org', 
    role: 'head_nurse', 
    nurseDesignation: 'HN',
    category: 'Medical',
    cnsId: 'usr-cns-medical',
    cnsName: 'Dr. Robert Hayes',
    wardId: 'ward-general', 
    assignedWardIds: ['ward-general', 'ward-pulm'],
    jobTitle: 'Head Nurse (Internal Medicine: MED & PULM)', 
    licenseNumber: 'NUR-HN-8014', 
    licenseExpiry: '2027-10-31', 
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-hn-surg', 
    name: 'Michael Chang', 
    email: 'michael.hn.surg@hospital.org', 
    role: 'head_nurse', 
    nurseDesignation: 'HN',
    category: 'Surgical',
    cnsId: 'usr-cns-surgical',
    cnsName: 'Dr. Victoria Sterling',
    wardId: 'ward-surgical', 
    assignedWardIds: ['ward-surgical', 'ward-or'],
    jobTitle: 'Head Nurse (Surgical & Operative: SURG & OR)', 
    licenseNumber: 'NUR-HN-8016', 
    licenseExpiry: '2028-03-31', 
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-hn-ortho', 
    name: 'Sarah Al-Mahmood', 
    email: 'sarah.hn.ortho@hospital.org', 
    role: 'head_nurse', 
    nurseDesignation: 'HN',
    category: 'Surgical',
    cnsId: 'usr-cns-surgical',
    cnsName: 'Dr. Victoria Sterling',
    wardId: 'ward-ortho', 
    assignedWardIds: ['ward-ortho', 'ward-neuro'],
    jobTitle: 'Head Nurse (Specialized Surgery: ORTHO & NEURO)', 
    licenseNumber: 'NUR-HN-8018', 
    licenseExpiry: '2028-04-30', 
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250' 
  },

  // 4. Tier 4: Nurse Supervisors (NS) (Assigned to each nominated ward unit)
  // --- Excellency: ICU & PICU (under HN David Miller) ---
  {
    id: 'usr-ns-icu1',
    name: 'Rachel Adams',
    email: 'rachel.ns.icu1@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-icu',
    headNurseId: 'usr-hn-icu',
    headNurseName: 'David Miller',
    jobTitle: 'Nurse Supervisor (NS - ICU Team Alpha)',
    licenseNumber: 'NUR-NS-9101',
    licenseExpiry: '2027-04-15',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-ns-icu2',
    name: 'Marcus Bell',
    email: 'marcus.ns.icu2@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-icu',
    headNurseId: 'usr-hn-icu',
    headNurseName: 'David Miller',
    jobTitle: 'Nurse Supervisor (NS - ICU Team Bravo)',
    licenseNumber: 'NUR-NS-9102',
    licenseExpiry: '2027-05-20',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-ns-picu',
    name: 'Faisal Al-Doseri',
    email: 'faisal.ns.picu@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-picu',
    headNurseId: 'usr-hn-icu',
    headNurseName: 'David Miller',
    jobTitle: 'Nurse Supervisor (NS - PICU Clinical Lead)',
    licenseNumber: 'NUR-NS-9107',
    licenseExpiry: '2027-08-15',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250'
  },

  // --- Excellency: CCU & CICU (under HN Elena Rostova) ---
  {
    id: 'usr-ns-ccu1',
    name: 'Tariq Mansoor',
    email: 'tariq.ns.ccu@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-ccu',
    headNurseId: 'usr-hn-ccu',
    headNurseName: 'Elena Rostova',
    jobTitle: 'Nurse Supervisor (NS - CCU Lead)',
    licenseNumber: 'NUR-NS-9105',
    licenseExpiry: '2028-02-28',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-ns-cicu',
    name: 'Layla Qasim',
    email: 'layla.ns.cicu@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-cicu',
    headNurseId: 'usr-hn-ccu',
    headNurseName: 'Elena Rostova',
    jobTitle: 'Nurse Supervisor (NS - CICU Sub-Acute Lead)',
    licenseNumber: 'NUR-NS-9108',
    licenseExpiry: '2028-01-20',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
  },

  // --- Medical: ER & EOU (under HN Maria Garcia) ---
  {
    id: 'usr-ns-er1',
    name: 'Jessica Taylor',
    email: 'jessica.ns.er@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-er',
    headNurseId: 'usr-hn-er',
    headNurseName: 'Maria Garcia',
    jobTitle: 'Nurse Supervisor (NS - ER Acute Care)',
    licenseNumber: 'NUR-NS-9103',
    licenseExpiry: '2027-06-30',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1594824813566-832f91a511ef?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-ns-eou',
    name: 'Khalid Al-Ghamdi',
    email: 'khalid.ns.eou@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-eou',
    headNurseId: 'usr-hn-er',
    headNurseName: 'Maria Garcia',
    jobTitle: 'Nurse Supervisor (NS - Observation & Triage Lead)',
    licenseNumber: 'NUR-NS-9109',
    licenseExpiry: '2027-09-14',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250'
  },

  // --- Medical: MED & PULM (under HN Alex Wong) ---
  {
    id: 'usr-ns-gen1',
    name: 'Chloe Bennett',
    email: 'chloe.ns.gen@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-general',
    headNurseId: 'usr-hn-gen',
    headNurseName: 'Alex Wong',
    jobTitle: 'Nurse Supervisor (NS - MedSurg Clinical Lead)',
    licenseNumber: 'NUR-NS-9104',
    licenseExpiry: '2027-11-15',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-ns-pulm',
    name: 'Zainab Al-Husseini',
    email: 'zainab.ns.pulm@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-pulm',
    headNurseId: 'usr-hn-gen',
    headNurseName: 'Alex Wong',
    jobTitle: 'Nurse Supervisor (NS - Pulmonology Lead)',
    licenseNumber: 'NUR-NS-9110',
    licenseExpiry: '2027-12-10',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=250'
  },

  // --- Surgical: SURG & OR (under HN Michael Chang) ---
  {
    id: 'usr-ns-surg1',
    name: 'Catherine Howard',
    email: 'catherine.ns.surg@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-surgical',
    headNurseId: 'usr-hn-surg',
    headNurseName: 'Michael Chang',
    jobTitle: 'Nurse Supervisor (NS - Post-Op Recovery Lead)',
    licenseNumber: 'NUR-NS-9106',
    licenseExpiry: '2027-11-20',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-ns-or',
    name: 'Daniel Kim',
    email: 'daniel.ns.or@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-or',
    headNurseId: 'usr-hn-surg',
    headNurseName: 'Michael Chang',
    jobTitle: 'Nurse Supervisor (NS - Perioperative Surgical Lead)',
    licenseNumber: 'NUR-NS-9111',
    licenseExpiry: '2028-02-18',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250'
  },

  // --- Surgical: ORTHO & NEURO (under HN Sarah Al-Mahmood) ---
  {
    id: 'usr-ns-ortho',
    name: 'Maya Patel',
    email: 'maya.ns.ortho@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-ortho',
    headNurseId: 'usr-hn-ortho',
    headNurseName: 'Sarah Al-Mahmood',
    jobTitle: 'Nurse Supervisor (NS - Orthopedic Clinical Lead)',
    licenseNumber: 'NUR-NS-9112',
    licenseExpiry: '2028-05-12',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1594824813566-832f91a511ef?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'usr-ns-neuro',
    name: 'Sami Al-Haddad',
    email: 'sami.ns.neuro@hospital.org',
    role: 'nurse_supervisor',
    nurseDesignation: 'NS',
    wardId: 'ward-neuro',
    headNurseId: 'usr-hn-ortho',
    headNurseName: 'Sarah Al-Mahmood',
    jobTitle: 'Nurse Supervisor (NS - Neurosurgery Clinical Lead)',
    licenseNumber: 'NUR-NS-9113',
    licenseExpiry: '2028-07-24',
    isAuthorizedDutyApprover: true,
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250'
  },

  // 5. Front-Line Staff Nurse & MSA User Accounts (for fast 1-click login and duty cards)
  { 
    id: 'usr-staff-s001', 
    name: 'Israa Jameel Ahmed', 
    email: 'ialhadi@hospitals.gov.bh', 
    role: 'staff', 
    nurseDesignation: 'SN',
    wardId: 'ward-icu', 
    staffMemberId: '001008340', 
    jobTitle: 'Staff Nurse (SN - ICU)', 
    licenseNumber: '11323672', 
    licenseExpiry: '2026-09-30', 
    photoUrl: 'https://images.unsplash.com/photo-1594824813566-832f91a511ef?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-staff-s002', 
    name: 'S. Mohammed Fadhel', 
    email: 'sm.fadhel@hospitals.gov.bh', 
    role: 'staff', 
    nurseDesignation: 'SN',
    wardId: 'ward-icu', 
    staffMemberId: '020801007', 
    jobTitle: 'Senior Staff Nurse (SN - ICU)', 
    licenseNumber: '11322900', 
    licenseExpiry: '2026-08-20', 
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-staff-ha1', 
    name: 'Ramesh Kumar', 
    email: 'ramesh.k@hospitals.gov.bh', 
    role: 'staff', 
    nurseDesignation: 'MSA',
    wardId: 'ward-icu', 
    staffMemberId: '900801001', 
    jobTitle: 'Medical Service Aid (MSA - ICU)', 
    photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-staff-picu1', 
    name: 'Amal Ebrahim', 
    email: 'amal.e@hospitals.gov.bh', 
    role: 'staff', 
    nurseDesignation: 'SN',
    wardId: 'ward-picu', 
    staffMemberId: '002008301', 
    jobTitle: 'Staff Nurse (SN - PICU)', 
    licenseNumber: '11324101', 
    licenseExpiry: '2027-02-15', 
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-staff-ccu1', 
    name: 'Batool Hassan', 
    email: 'batool.h@hospitals.gov.bh', 
    role: 'staff', 
    nurseDesignation: 'SN',
    wardId: 'ward-ccu', 
    staffMemberId: '003008401', 
    jobTitle: 'Staff Nurse (SN - CCU)', 
    licenseNumber: '11324201', 
    licenseExpiry: '2027-03-20', 
    photoUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-staff-er1', 
    name: 'Salman Yousif', 
    email: 'salman.y@hospitals.gov.bh', 
    role: 'staff', 
    nurseDesignation: 'SN',
    wardId: 'ward-er', 
    staffMemberId: '004008501', 
    jobTitle: 'Trauma Staff Nurse (SN - ER)', 
    licenseNumber: '11324301', 
    licenseExpiry: '2027-05-18', 
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'usr-staff-surg1', 
    name: 'Nadeem Akhtar', 
    email: 'nadeem.a@hospitals.gov.bh', 
    role: 'staff', 
    nurseDesignation: 'SN',
    wardId: 'ward-surgical', 
    staffMemberId: '005008601', 
    jobTitle: 'Surgical Staff Nurse (SN - SURG)', 
    licenseNumber: '11324401', 
    licenseExpiry: '2027-06-25', 
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250' 
  }
];

// Helper to generate realistic staff rosters for each ward unit
function generateWardStaffRoster(
  wardId: string, 
  prefix: string, 
  startId: number, 
  staffNames: { name: string; isMale: boolean; isSenior: boolean; jobTitle: string; isHa?: boolean }[]
): StaffMember[] {
  return staffNames.map((s, idx) => {
    const idNum = startId + idx;
    const formattedId = s.isHa ? `9${prefix}${idNum.toString().padStart(4, '0')}` : `0${prefix}${idNum.toString().padStart(5, '0')}`;
    const emailPrefix = s.name.toLowerCase().replace(/[^a-z0-9]/g, '.');
    return {
      id: formattedId,
      name: s.isHa ? `(MSA) ${s.name}` : s.name,
      email: `${emailPrefix}@hospitals.gov.bh`,
      jobTitle: s.isHa ? 'Medical Service Aid' : s.jobTitle,
      isSenior: s.isSenior,
      isMale: s.isMale,
      hasCaringHours: !s.isHa && (idx % 4 === 0),
      isHa: s.isHa || false,
      maxMorning: s.isHa ? 15 : (s.isSenior ? 10 : 12),
      maxEvening: s.isHa ? 10 : 8,
      maxNight: s.isHa ? 8 : (s.isSenior ? 6 : 8),
      maxOff: 8,
      phone: `3${(9000000 + (startId * 10) + idx).toString().slice(0, 7)}`,
      licenseNumber: s.isHa ? '' : `11${(320000 + (startId * 10) + idx).toString()}`,
      licenseExpiry: s.isHa ? '' : '2027-10-15',
      joinDate: '2020-04-01',
      isAuthorizedDutyApprover: !s.isHa && s.isSenior,
      wardId
    };
  });
}

// 1. ICU Staff (Ward: ward-icu)
const ICU_STAFF: StaffMember[] = [
  { id: '741006642', name: 'Ebtisam Yusuf Ali', email: 'esowayed@hospitals.gov.bh', jobTitle: 'Nursing Supervisor', isSenior: true, isMale: false, hasCaringHours: false, isWardSupervisor: true, maxMorning: 22, maxEvening: 0, maxNight: 0, maxOff: 8, phone: '37772982', licenseNumber: '11303629', licenseExpiry: '2027-08-01', licenseCardUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=80', joinDate: '2015-01-01', isAuthorizedDutyApprover: true, wardId: 'ward-icu' },
  { id: '640512763', name: 'Sreelatha Premraj', email: 'sprimraj@hospitals.gov.bh', jobTitle: 'Senior Clinical Specialist', isSenior: true, isMale: false, hasCaringHours: false, maxMorning: 8, maxEvening: 8, maxNight: 8, maxOff: 8, phone: '36312115', licenseNumber: '11312115', licenseExpiry: '2027-01-10', joinDate: '2016-03-15', isAuthorizedDutyApprover: false, wardId: 'ward-icu' },
  { id: '001008340', name: 'Israa Jameel Ahmed', email: 'ialhadi@hospitals.gov.bh', jobTitle: 'General Nursing Specialist', isSenior: false, isMale: false, hasCaringHours: false, maxMorning: 11, maxEvening: 5, maxNight: 7, maxOff: 8, phone: '34181228', licenseNumber: '11323672', licenseExpiry: '2026-09-30', licenseCardUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80', joinDate: '2020-07-01', isAuthorizedDutyApprover: false, wardId: 'ward-icu' },
  { id: '731122666', name: 'Mohammed Salim', email: 'mbhatti@hospitals.gov.bh', jobTitle: 'Critical Care Specialist', isSenior: true, isMale: true, hasCaringHours: false, maxMorning: 8, maxEvening: 8, maxNight: 8, maxOff: 8, phone: '36383567', licenseNumber: '11323567', licenseExpiry: '2027-05-15', joinDate: '2017-09-10', isAuthorizedDutyApprover: false, wardId: 'ward-icu' },
  { id: '010801006', name: 'Ali Hasan Abbas', email: 'a.abbas@hospitals.gov.bh', jobTitle: 'General Nursing Specialist', isSenior: false, isMale: true, hasCaringHours: false, maxMorning: 10, maxEvening: 8, maxNight: 8, maxOff: 8, phone: '36676899', licenseNumber: '11322614', licenseExpiry: '2026-08-13', joinDate: '2021-02-15', isAuthorizedDutyApprover: false, wardId: 'ward-icu' },
  { id: '020801007', name: 'S. Mohammed Fadhel', email: 'sm.fadhel@hospitals.gov.bh', jobTitle: 'Registered Nurse', isSenior: true, isMale: true, hasCaringHours: false, maxMorning: 9, maxEvening: 7, maxNight: 7, maxOff: 8, phone: '39482110', licenseNumber: '11322900', licenseExpiry: '2026-08-20', licenseCardUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80', joinDate: '2018-05-12', isAuthorizedDutyApprover: false, wardId: 'ward-icu' },
  { id: '030801008', name: 'Kefaya Abdul-Kareem', email: 'kefaya.ak@hospitals.gov.bh', jobTitle: 'Registered Nurse', isSenior: true, isMale: false, hasCaringHours: true, maxMorning: 10, maxEvening: 6, maxNight: 6, maxOff: 8, phone: '38291044', licenseNumber: '11311029', licenseExpiry: '2026-02-09', joinDate: '2019-11-20', isAuthorizedDutyApprover: true, wardId: 'ward-icu' },
  { id: '040801009', name: 'Fatima Al-Sayed', email: 'fatima.as@hospitals.gov.bh', jobTitle: 'Senior Staff Nurse', isSenior: true, isMale: false, hasCaringHours: false, maxMorning: 12, maxEvening: 8, maxNight: 6, maxOff: 8, phone: '39110022', licenseNumber: '11345091', licenseExpiry: '2027-11-15', joinDate: '2018-04-01', isAuthorizedDutyApprover: true, wardId: 'ward-icu' },
  { id: '050801010', name: 'Zainab Mansoor', email: 'zainab.m@hospitals.gov.bh', jobTitle: 'Staff Nurse', isSenior: false, isMale: false, hasCaringHours: true, maxMorning: 10, maxEvening: 8, maxNight: 8, maxOff: 8, phone: '39221133', licenseNumber: '11356022', licenseExpiry: '2028-04-10', joinDate: '2022-06-15', isAuthorizedDutyApprover: false, wardId: 'ward-icu' },
  { id: '060801011', name: 'Hussain Al-Majed', email: 'hussain.m@hospitals.gov.bh', jobTitle: 'Staff Nurse', isSenior: false, isMale: true, hasCaringHours: false, maxMorning: 12, maxEvening: 8, maxNight: 8, maxOff: 8, phone: '39332244', licenseNumber: '11367033', licenseExpiry: '2027-09-22', joinDate: '2021-08-10', isAuthorizedDutyApprover: false, wardId: 'ward-icu' },
  { id: '900801001', name: '(MSA) Ramesh Kumar', email: 'ramesh.k@hospitals.gov.bh', jobTitle: 'Medical Service Aid', isHa: true, isSenior: false, isMale: true, hasCaringHours: false, maxMorning: 15, maxEvening: 10, maxNight: 8, maxOff: 8, phone: '39778899', licenseNumber: '', licenseExpiry: '', joinDate: '2020-01-15', wardId: 'ward-icu' },
  { id: '900801002', name: '(MSA) Sunita Sharma', email: 'sunita.s@hospitals.gov.bh', jobTitle: 'Medical Service Aid', isHa: true, isSenior: false, isMale: false, hasCaringHours: false, maxMorning: 15, maxEvening: 10, maxNight: 8, maxOff: 8, phone: '39889900', licenseNumber: '', licenseExpiry: '', joinDate: '2021-04-20', wardId: 'ward-icu' }
];

// 2. PICU Staff (Ward: ward-picu, under HN David Miller)
const PICU_STAFF = generateWardStaffRoster('ward-picu', 'pi', 101, [
  { name: 'Amal Ebrahim', isMale: false, isSenior: true, jobTitle: 'Pediatric Intensive Care Nurse' },
  { name: 'Jawaher Al-Thawadi', isMale: false, isSenior: false, jobTitle: 'Pediatric Staff Nurse' },
  { name: 'Hussain Mirza', isMale: true, isSenior: false, jobTitle: 'Neonatal Critical Care Nurse' },
  { name: 'Layla Al-Khatib', isMale: false, isSenior: true, jobTitle: 'Senior Pediatric Specialist' },
  { name: 'Mona Al-Sabah', isMale: false, isSenior: false, jobTitle: 'Pediatric Registered Nurse' },
  { name: 'Nader Qassim', isMale: true, isSenior: false, jobTitle: 'Pediatric Care Specialist' },
  { name: 'Sadiq Al-Jamri', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Radha Menon', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

// 3. CCU Staff (Ward: ward-ccu, under HN Elena Rostova)
const CCU_STAFF = generateWardStaffRoster('ward-ccu', 'cc', 201, [
  { name: 'Batool Hassan', isMale: false, isSenior: true, jobTitle: 'Cardiac Intensive Care Nurse' },
  { name: 'Mahmood Al-Aradi', isMale: true, isSenior: true, jobTitle: 'Senior Cardiac Specialist' },
  { name: 'Rania Al-Binali', isMale: false, isSenior: false, jobTitle: 'Coronary Care Staff Nurse' },
  { name: 'Waleed Al-Obeidli', isMale: true, isSenior: false, jobTitle: 'Cardiac Monitoring Nurse' },
  { name: 'Zahra Al-Hujairi', isMale: false, isSenior: false, jobTitle: 'Registered Staff Nurse' },
  { name: 'Nawaf Al-Mutawa', isMale: true, isSenior: false, jobTitle: 'Coronary Specialist Nurse' },
  { name: 'Manoj Kumar', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Priya Pillai', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

// 4. CICU Staff (Ward: ward-cicu, under HN Elena Rostova)
const CICU_STAFF = generateWardStaffRoster('ward-cicu', 'ci', 301, [
  { name: 'Mariam Al-Moqla', isMale: false, isSenior: true, jobTitle: 'Cardiovascular Step-Down Nurse' },
  { name: 'Adnan Al-Shekar', isMale: true, isSenior: false, jobTitle: 'Cardiac Telemetry Nurse' },
  { name: 'Hawra Al-Qassab', isMale: false, isSenior: false, jobTitle: 'Sub-Acute Cardiac Nurse' },
  { name: 'Ibrahim Al-Alawi', isMale: true, isSenior: true, jobTitle: 'Senior Cardiovascular Nurse' },
  { name: 'Samira Al-Bahr', isMale: false, isSenior: false, jobTitle: 'Cardiac Rehab Nurse' },
  { name: 'Suresh Babu', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Anitha Devi', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

// 5. ER Staff (Ward: ward-er, under HN Maria Garcia)
const ER_STAFF = generateWardStaffRoster('ward-er', 'er', 401, [
  { name: 'Salman Yousif', isMale: true, isSenior: true, jobTitle: 'Emergency Trauma Specialist' },
  { name: 'Duaa Al-Nashaba', isMale: false, isSenior: false, jobTitle: 'Triage Staff Nurse' },
  { name: 'Yasser Al-Qudaihi', isMale: true, isSenior: false, jobTitle: 'Emergency Resuscitation Nurse' },
  { name: 'Noora Al-Khalifa', isMale: false, isSenior: true, jobTitle: 'Senior Emergency Specialist' },
  { name: 'Khaled Mansoor', isMale: true, isSenior: false, jobTitle: 'Acute Care Registered Nurse' },
  { name: 'Fadhel Al-Sharaf', isMale: true, isSenior: false, jobTitle: 'Trauma Care Staff Nurse' },
  { name: 'Deepak Nair', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Lakshmi Nair', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

// 6. EOU Staff (Ward: ward-eou, under HN Maria Garcia)
const EOU_STAFF = generateWardStaffRoster('ward-eou', 'eo', 501, [
  { name: 'Hanan Al-Khabbaz', isMale: false, isSenior: true, jobTitle: 'Emergency Observation Nurse' },
  { name: 'Bader Al-Haji', isMale: true, isSenior: false, jobTitle: 'Rapid Assessment Nurse' },
  { name: 'Kawthar Al-Asfoor', isMale: false, isSenior: false, jobTitle: 'Observation Unit Nurse' },
  { name: 'Hisham Al-Arrayedh', isMale: true, isSenior: false, jobTitle: 'Emergency Transition Nurse' },
  { name: 'Sanjay Patel', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Geetha Rani', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

// 7. General Medical Staff (Ward: ward-general, under HN Alex Wong)
const MED_STAFF = generateWardStaffRoster('ward-general', 'ge', 601, [
  { name: 'Ebrahim Al-Ghareeb', isMale: true, isSenior: true, jobTitle: 'General Medicine Senior Nurse' },
  { name: 'Fatima Bu-Ali', isMale: false, isSenior: false, jobTitle: 'Internal Medicine Staff Nurse' },
  { name: 'Mohsin Al-Tubli', isMale: true, isSenior: false, jobTitle: 'Inpatient Medical Specialist' },
  { name: 'Ruqaya Al-Satrawi', isMale: false, isSenior: true, jobTitle: 'Geriatric Care Specialist' },
  { name: 'Anwar Al-Haddad', isMale: true, isSenior: false, jobTitle: 'Staff Nurse (Internal Medicine)' },
  { name: 'Ashok Kumar', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Shanti Kumari', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

// 8. PULM Staff (Ward: ward-pulm, under HN Alex Wong)
const PULM_STAFF = generateWardStaffRoster('ward-pulm', 'pu', 701, [
  { name: 'Alya Al-Malki', isMale: false, isSenior: true, jobTitle: 'Pulmonary Care Specialist' },
  { name: 'Jaafar Al-Khatam', isMale: true, isSenior: false, jobTitle: 'Respiratory Care Staff Nurse' },
  { name: 'Nada Al-Zayani', isMale: false, isSenior: false, jobTitle: 'Pulmonary Isolation Nurse' },
  { name: 'Majed Al-Ghais', isMale: true, isSenior: false, jobTitle: 'Respiratory Therapy Nurse' },
  { name: 'Vinod Nair', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Bhanu Rekha', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

// 9. Surgical & Post-Op Staff (Ward: ward-surgical, under HN Michael Chang)
const SURG_STAFF = generateWardStaffRoster('ward-surgical', 'su', 801, [
  { name: 'Nadeem Akhtar', isMale: true, isSenior: true, jobTitle: 'Senior Post-Op Recovery Specialist' },
  { name: 'Zahra Al-Khabaz', isMale: false, isSenior: false, jobTitle: 'Surgical Inpatient Staff Nurse' },
  { name: 'Hasan Al-Jishi', isMale: true, isSenior: false, jobTitle: 'Post-Surgical Acute Nurse' },
  { name: 'Maysoon Al-Awadhi', isMale: false, isSenior: true, jobTitle: 'Surgical Wound Specialist' },
  { name: 'Adel Al-Zeera', isMale: true, isSenior: false, jobTitle: 'Post-Anesthesia Recovery Nurse' },
  { name: 'Vijay Anand', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Kavitha Nair', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

// 10. OR & Day Surgery Staff (Ward: ward-or, under HN Michael Chang)
const OR_STAFF = generateWardStaffRoster('ward-or', 'or', 901, [
  { name: 'Tareq Al-Jassim', isMale: true, isSenior: true, jobTitle: 'Senior Operating Room Scrub Nurse' },
  { name: 'Lulwa Al-Shirawi', isMale: false, isSenior: false, jobTitle: 'Perioperative Circulating Nurse' },
  { name: 'Waleed Al-Kuwari', isMale: true, isSenior: false, jobTitle: 'Day Surgery Anesthesia Nurse' },
  { name: 'Suhaila Al-Ghatam', isMale: false, isSenior: true, jobTitle: 'Surgical Suite Instrument Nurse' },
  { name: 'Rajesh Varma', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Meena Joseph', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

// 11. ORTHO Staff (Ward: ward-ortho, under HN Sarah Al-Mahmood)
const ORTHO_STAFF = generateWardStaffRoster('ward-ortho', 'ot', 1001, [
  { name: 'Jameel Al-Gassab', isMale: true, isSenior: true, jobTitle: 'Orthopedic & Arthroplasty Nurse' },
  { name: 'Wafa Al-Rowaiei', isMale: false, isSenior: false, jobTitle: 'Trauma Orthopedic Staff Nurse' },
  { name: 'Qasim Al-Khulaifi', isMale: true, isSenior: false, jobTitle: 'Spine & Musculoskeletal Nurse' },
  { name: 'Mariam Al-Moamen', isMale: false, isSenior: true, jobTitle: 'Senior Ortho Recovery Nurse' },
  { name: 'Santosh Kumar', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Sarita Sharma', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

// 12. NEURO Staff (Ward: ward-neuro, under HN Sarah Al-Mahmood)
const NEURO_STAFF = generateWardStaffRoster('ward-neuro', 'ne', 1101, [
  { name: 'Hameed Al-Mahoozi', isMale: true, isSenior: true, jobTitle: 'Neurosurgery Critical Care Nurse' },
  { name: 'Salma Al-Thawadi', isMale: false, isSenior: false, jobTitle: 'Neurological Assessment Nurse' },
  { name: 'Ali Al-Saffar', isMale: true, isSenior: false, jobTitle: 'Cranial & Spine Post-Op Nurse' },
  { name: 'Dina Al-Qassimi', isMale: false, isSenior: true, jobTitle: 'Senior Neurosurgical Specialist' },
  { name: 'Raju Pillai', isMale: true, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true },
  { name: 'Latha Menon', isMale: false, isSenior: false, jobTitle: 'Medical Service Aid', isHa: true }
]);

export const INITIAL_STAFF: StaffMember[] = [
  ...ICU_STAFF,
  ...PICU_STAFF,
  ...CCU_STAFF,
  ...CICU_STAFF,
  ...ER_STAFF,
  ...EOU_STAFF,
  ...MED_STAFF,
  ...PULM_STAFF,
  ...SURG_STAFF,
  ...OR_STAFF,
  ...ORTHO_STAFF,
  ...NEURO_STAFF
];
