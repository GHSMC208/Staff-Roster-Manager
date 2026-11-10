
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TabType, 
  StaffMember, 
  RosterConfig, 
  Assignment, 
  ShiftType,
  ThemeType,
  WardInfo,
  WardCategory,
  ClinicalDivision,
  DEFAULT_DIVISIONS,
  UserAccount,
  UserRole,
  DutyExchangeRequest,
  AppNotification,
  WardTransferRequest
} from './types';
import { ICONS, MONTHS, YEARS, THEME_SHIFT_STYLES } from './constants';
import { Building2, Crown, Shield, ShieldCheck, UserCheck, Lock, LogOut, ArrowRightLeft, Sparkles, User, Filter, Stethoscope, Activity, Table2, PhoneCall, KeyRound } from 'lucide-react';
import StaffManager from './components/StaffManager';
import RulesManager from './components/RulesManager';
import Generator from './components/Generator';
import CalendarView from './components/CalendarView';
import OnCallPrintView from './components/OnCallPrintView';
import StaffPortal from './components/StaffPortal';
import { WardAdminManager } from './components/WardAdminManager';
import { HierarchyChart } from './components/HierarchyChart';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { PasswordAuthModal } from './components/PasswordAuthModal';
import { NotificationCenter } from './components/NotificationCenter';
import { 
  createExchangeRequestHelper, 
  handlePeerResponseHelper, 
  handleWsResponseHelper 
} from './lib/exchangeService';
import {
  createWardTransferRequestHelper,
  handleTargetWsTransferResponseHelper,
  handleAdminTransferResponseHelper
} from './lib/wardTransferService';
import {
  INITIAL_WARDS,
  INITIAL_USERS,
  INITIAL_STAFF
} from './lib/initialHospitalData';

const INITIAL_CONFIG: RosterConfig = {
  year: 2025,
  month: 'December',
  nextMonthDeployDate: '2025-12-25',
  isNextMonthDeployed: false,
  wardName: 'ICU',
  wardId: 'ward-icu',
  minMorning: 7,
  minEvening: 6,
  minNight: 6,
  minMorningWeekend: 7,
  minEveningWeekend: 6,
  minNightWeekend: 6,
  minMorningHoliday: 5,
  minEveningHoliday: 5,
  minNightHoliday: 5,
  holidays: ['2025-12-25', '2025-12-31'],
  minSenior: 2,
  maxMale: 2,
  maxCaringHoursPerShift: 2,
  maxConsecutiveEvening: 2,
  maxConsecutiveNight: 2,
  maxConsecutiveDuty: 5,
  offAfterNight: 2,
  maxOffPerMonth: 10,
  haMinMorning: 2,
  haMinEvening: 2,
  haMinNight: 2,
  haMinMorningWeekend: 2,
  haMinEveningWeekend: 2,
  haMinNightWeekend: 2,
  haMinMorningHoliday: 1,
  haMinEveningHoliday: 1,
  haMinNightHoliday: 1,
  haMinSenior: 1,
  haMaxMale: 1,
  haMaxCaringHoursPerShift: 2,
  haMaxConsecutiveDuty: 5,
  haOffAfterNight: 2,
  haMaxOffPerMonth: 10,
};

const App: React.FC = () => {
  const [wards, setWards] = useState<WardInfo[]>(INITIAL_WARDS);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [divisions, setDivisions] = useState<ClinicalDivision[]>(() => {
    const saved = localStorage.getItem('hospital_clinical_divisions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse hospital_clinical_divisions', e);
      }
    }
    return DEFAULT_DIVISIONS;
  });
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null); // Initial Login Page at Startup
  const [activeWardId, setActiveWardId] = useState<string>('');
  const [wardCategoryFilter, setWardCategoryFilter] = useState<'all' | WardCategory>('all');
  
  const [activeTab, setActiveTab] = useState<TabType>('Staff');
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [config, setConfig] = useState<RosterConfig>(INITIAL_CONFIG);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [theme, setTheme] = useState<ThemeType>('Professional');
  const [loggedInStaffId, setLoggedInStaffId] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  // Duty Exchange & Notification State
  const [exchangeRequests, setExchangeRequests] = useState<DutyExchangeRequest[]>([]);
  const [wardTransferRequests, setWardTransferRequests] = useState<WardTransferRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Sync active ward name with current ward ID
  const currentWard = useMemo(() => {
    if (!activeWardId) {
      return wards[0] || { id: '', name: 'General Clinical Overview', code: 'GEN', category: 'Medical', description: 'All Wards' };
    }
    return wards.find(w => w.id === activeWardId) || wards[0];
  }, [wards, activeWardId]);

  useEffect(() => {
    if (currentWard) {
      setConfig(prev => ({
        ...prev,
        wardName: currentWard.code || currentWard.name,
        wardId: currentWard.id
      }));
    }
  }, [currentWard]);

  // Filter wards accessible to the current user (CNS / DCNS sees their division wards, HN sees only their assigned ward)
  const visibleWardsForUser = useMemo(() => {
    if (!currentUser) return wards;
    if (currentUser.role === 'cns' || currentUser.role === 'dcns' || currentUser.nurseDesignation === 'CNS' || currentUser.nurseDesignation === 'DCNS') {
      const cnsCat = (currentUser.category || 'Medical').toLowerCase();
      return wards.filter(w => (w.category || 'Medical').toLowerCase() === cnsCat);
    }
    if (currentUser.role === 'head_nurse' || currentUser.role === 'ward_supervisor' || currentUser.nurseDesignation === 'HN') {
      if (currentUser.wardId && currentUser.wardId !== 'ALL') {
        const matchingWards = wards.filter(w => w.id === currentUser.wardId || w.supervisorId === currentUser.id || w.supervisorEmail === currentUser.email);
        return matchingWards.length > 0 ? matchingWards : wards.filter(w => w.id === currentUser.wardId);
      }
    }
    return wards;
  }, [wards, currentUser]);

  // For CNS/DCNS/HN, filter allStaff to staff belonging to their permitted wards
  const visibleStaffForUser = useMemo(() => {
    if (!currentUser) return staff;
    if (currentUser.role === 'cns' || currentUser.role === 'dcns' || currentUser.nurseDesignation === 'CNS' || currentUser.nurseDesignation === 'DCNS') {
      const divisionWardIds = new Set(visibleWardsForUser.map(w => w.id));
      const cnsCat = (currentUser.category || 'Medical').toLowerCase();
      return staff.filter(s => (s.wardId && divisionWardIds.has(s.wardId)) || (s.category && s.category.toLowerCase() === cnsCat));
    }
    if (currentUser.role === 'head_nurse' || currentUser.role === 'ward_supervisor' || currentUser.nurseDesignation === 'HN') {
      if (currentUser.wardId && currentUser.wardId !== 'ALL') {
        const permittedWardIds = new Set(visibleWardsForUser.map(w => w.id));
        return staff.filter(s => !s.wardId || permittedWardIds.has(s.wardId));
      }
    }
    return staff;
  }, [staff, visibleWardsForUser, currentUser]);

  // Filter staff by active ward
  const activeWardStaff = useMemo(() => {
    if (!activeWardId) return staff;
    return staff.filter(s => !s.wardId || s.wardId === activeWardId);
  }, [staff, activeWardId]);

  // Ensure that if a CNS, DCNS, or HN is logged in, activeWardId belongs to their permitted wards
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'cns' || currentUser.role === 'dcns' || currentUser.nurseDesignation === 'CNS' || currentUser.nurseDesignation === 'DCNS') {
        const cnsCat = currentUser.category || 'Medical';
        const cnsWards = wards.filter(w => (w.category || 'Medical') === cnsCat);
        const isCurrentWardInDivision = cnsWards.some(w => w.id === activeWardId);
        if (!isCurrentWardInDivision && cnsWards.length > 0) {
          setActiveWardId(cnsWards[0].id);
        }
      } else if (currentUser.role === 'head_nurse' || currentUser.role === 'ward_supervisor' || currentUser.nurseDesignation === 'HN') {
        if (currentUser.wardId && currentUser.wardId !== 'ALL') {
          if (activeWardId !== currentUser.wardId) {
            setActiveWardId(currentUser.wardId);
          }
        }
      }
    }
  }, [currentUser, wards, activeWardId]);

  // Handle Login User from Modal / Auth
  const handleLoginUser = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'cns' || user.role === 'dcns' || user.nurseDesignation === 'CNS' || user.nurseDesignation === 'DCNS') {
      const cnsCat = user.category || 'Medical';
      const cnsWards = wards.filter(w => (w.category || 'Medical') === cnsCat);
      if (user.wardId && user.wardId !== 'ALL') {
        setActiveWardId(user.wardId);
      } else if (cnsWards.length > 0) {
        setActiveWardId(cnsWards[0].id);
      }
      setActiveTab('Wards');
    } else if (user.role === 'admin' || user.role === 'head_nurse' || user.role === 'ward_supervisor' || user.nurseDesignation === 'HN') {
      if (user.wardId && user.wardId !== 'ALL') {
        setActiveWardId(user.wardId);
      }
      setActiveTab('Wards');
    } else if (user.role === 'nurse_supervisor' || user.nurseDesignation === 'NS') {
      if (user.wardId && user.wardId !== 'ALL') {
        setActiveWardId(user.wardId);
      }
      setActiveTab('Calendar');
    } else {
      // Regular staff user (SN / MSA)
      if (user.staffMemberId) {
        setLoggedInStaffId(user.staffMemberId);
      }
      if (user.wardId && user.wardId !== 'ALL') {
        setActiveWardId(user.wardId);
      }
      setActiveTab('StaffPortal');
    }
  };

  const handleLoginStaffByEmail = (email: string): boolean => {
    const clean = email.trim().toLowerCase();
    const matchedStaff = staff.find(s => s.email && s.email.trim().toLowerCase() === clean);
    
    if (matchedStaff) {
      const matchedUser = users.find(u => u.email.trim().toLowerCase() === clean);
      const staffUser: UserAccount = matchedUser || {
        id: `usr-${matchedStaff.id}`,
        name: matchedStaff.name,
        email: clean,
        role: 'staff',
        wardId: matchedStaff.wardId || activeWardId,
        staffMemberId: matchedStaff.id,
        jobTitle: matchedStaff.jobTitle || (matchedStaff.isHa ? 'Medical Service Aid' : 'Staff Nurse'),
        licenseNumber: matchedStaff.licenseNumber,
        licenseExpiry: matchedStaff.licenseExpiry,
        licenseCardUrl: matchedStaff.licenseCardUrl
      };

      setCurrentUser(staffUser);
      setLoggedInStaffId(matchedStaff.id);
      if (matchedStaff.wardId) {
        setActiveWardId(matchedStaff.wardId);
      }
      setActiveTab('StaffPortal');
      return true;
    }
    return false;
  };

  const handleLoginStaffById = (staffId: string): boolean => {
    const cleanId = staffId.trim();
    const matchedStaff = staff.find(s => s.id.toLowerCase() === cleanId.toLowerCase());
    
    if (matchedStaff) {
      const matchedUser = users.find(u => 
        (u.staffMemberId && u.staffMemberId.toLowerCase() === cleanId.toLowerCase()) || 
        (matchedStaff.email && u.email.trim().toLowerCase() === matchedStaff.email.trim().toLowerCase())
      );
      const cleanEmail = matchedStaff.email || `${matchedStaff.id.toLowerCase()}@hospital.org`;
      const staffUser: UserAccount = matchedUser || {
        id: `usr-${matchedStaff.id}`,
        name: matchedStaff.name,
        email: cleanEmail,
        role: 'staff',
        wardId: matchedStaff.wardId || activeWardId,
        staffMemberId: matchedStaff.id,
        jobTitle: matchedStaff.jobTitle || (matchedStaff.isHa ? 'Medical Service Aid' : 'Staff Nurse'),
        licenseNumber: matchedStaff.licenseNumber,
        licenseExpiry: matchedStaff.licenseExpiry,
        licenseCardUrl: matchedStaff.licenseCardUrl
      };

      setCurrentUser(staffUser);
      setLoggedInStaffId(matchedStaff.id);
      if (matchedStaff.wardId) {
        setActiveWardId(matchedStaff.wardId);
      }
      setActiveTab('StaffPortal');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoggedInStaffId(null);
  };

  // Check if current user is CNS or DCNS
  const isCurrentUserCnsOrDcns = !!currentUser && (
    currentUser.role === 'cns' || 
    currentUser.role === 'dcns' || 
    currentUser.nurseDesignation === 'CNS' || 
    currentUser.nurseDesignation === 'DCNS'
  );
  const currentUserDiv = (currentUser?.category || 'Medical').toLowerCase();

  // Check if current user is Nurse Supervisor (NS) - Sole authority to edit duty rota
  const isCurrentUserNurseSupervisor = !!currentUser && (
    currentUser.role === 'nurse_supervisor' || 
    currentUser.nurseDesignation === 'NS' ||
    (currentUser.jobTitle && currentUser.jobTitle.toLowerCase().includes('nurse supervisor'))
  );

  // Ward CRUD handlers
  const handleCreateWard = (newWardData: Omit<WardInfo, 'id'>) => {
    let finalWardData = newWardData;
    if (isCurrentUserCnsOrDcns) {
      finalWardData = { ...newWardData, category: currentUser?.category || 'Medical' };
    }
    const newId = `ward-${Date.now()}`;
    const newWard: WardInfo = { ...finalWardData, id: newId };
    setWards(prev => [...prev, newWard]);
    setActiveWardId(newId);
  };

  const handleUpdateWard = (id: string, updates: Partial<WardInfo>) => {
    let finalUpdates = updates;
    if (isCurrentUserCnsOrDcns) {
      const targetWard = wards.find(w => w.id === id);
      const targetCat = (targetWard?.category || 'Medical').toLowerCase();
      if (targetCat !== currentUserDiv) {
        alert(`Division Security: CNS and DCNS are not allowed to change ward information from other divisions (${targetWard?.category || 'External'}).`);
        return;
      }
      if (finalUpdates.category && finalUpdates.category.toLowerCase() !== currentUserDiv) {
        finalUpdates = { ...finalUpdates, category: currentUser?.category || 'Medical' };
      }
    }
    setWards(prev => prev.map(w => w.id === id ? { ...w, ...finalUpdates } : w));
  };

  const handleDeleteWard = (id: string) => {
    if (isCurrentUserCnsOrDcns) {
      const targetWard = wards.find(w => w.id === id);
      const targetCat = (targetWard?.category || 'Medical').toLowerCase();
      if (targetCat !== currentUserDiv) {
        alert('Division Security: CNS and DCNS are not allowed to delete wards from other divisions.');
        return;
      }
    }
    setWards(prev => prev.filter(w => w.id !== id));
    if (activeWardId === id) {
      const remaining = wards.filter(w => w.id !== id);
      if (remaining.length > 0) setActiveWardId(remaining[0].id);
    }
  };

  // User CRUD handlers
  const handleCreateUser = (newUserData: Omit<UserAccount, 'id'>) => {
    let finalUserData = newUserData;
    if (isCurrentUserCnsOrDcns) {
      if (newUserData.role === 'admin' || newUserData.nurseDesignation === 'GCNS') {
        alert('Division Security: CNS and DCNS cannot create Top Admin / GCNS accounts.');
        return;
      }
      finalUserData = { ...newUserData, category: currentUser?.category || 'Medical' };
    }
    const newId = `usr-${Date.now()}`;
    const newUser: UserAccount = { ...finalUserData, id: newId };
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (id: string, updates: Partial<UserAccount>) => {
    let finalUpdates = updates;
    if (isCurrentUserCnsOrDcns) {
      const targetUser = users.find(u => u.id === id);
      if (targetUser) {
        const targetWard = targetUser.wardId ? wards.find(w => w.id === targetUser.wardId) : undefined;
        const targetCat = (targetUser.category || targetWard?.category || 'Medical').toLowerCase();
        if (targetCat !== currentUserDiv && targetUser.id !== currentUser?.id) {
          alert('Division Security: CNS and DCNS are not allowed to change user information from other divisions.');
          return;
        }
        if (finalUpdates.wardId) {
          const newWard = wards.find(w => w.id === finalUpdates.wardId);
          if (newWard && (newWard.category || 'Medical').toLowerCase() !== currentUserDiv) {
            alert('Division Security: Cannot assign personnel to a ward in an external division.');
            return;
          }
        }
        if (finalUpdates.category && finalUpdates.category.toLowerCase() !== currentUserDiv && targetUser.role !== 'admin') {
          finalUpdates = { ...finalUpdates, category: currentUser?.category || 'Medical' };
        }
      }
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...finalUpdates } : u));
    setCurrentUser(prev => prev && prev.id === id ? { ...prev, ...finalUpdates } : prev);
  };

  const handleAssignHeadNurseToSupervisors = (supervisorIds: string[], headNurseId: string) => {
    if (isCurrentUserCnsOrDcns) {
      const targetHn = users.find(u => u.id === headNurseId);
      const hnCat = (targetHn?.category || (targetHn?.wardId ? wards.find(w => w.id === targetHn.wardId)?.category : undefined) || 'Medical').toLowerCase();
      if (hnCat !== currentUserDiv) {
        alert('Division Security: You cannot assign supervisors to a Head Nurse from an external division.');
        return;
      }
    }
    const targetHn = users.find(u => u.id === headNurseId);
    setUsers(prev => prev.map(u => {
      if (supervisorIds.includes(u.id)) {
        return {
          ...u,
          headNurseId: headNurseId || undefined,
          headNurseName: targetHn?.name || undefined
        };
      }
      return u;
    }));
  };

  const handleDeleteUser = (id: string) => {
    if (isCurrentUserCnsOrDcns) {
      const targetUser = users.find(u => u.id === id);
      if (targetUser) {
        const targetWard = targetUser.wardId ? wards.find(w => w.id === targetUser.wardId) : undefined;
        const targetCat = (targetUser.category || targetWard?.category || 'Medical').toLowerCase();
        if (targetCat !== currentUserDiv) {
          alert('Division Security: CNS and DCNS are not allowed to delete personnel from other divisions.');
          return;
        }
      }
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Division CRUD handlers (GCNS authority)
  const handleCreateDivision = (newDiv: { name: string; description?: string; colorTheme?: string; icon?: string }) => {
    if (isCurrentUserCnsOrDcns) {
      alert('Division Security: Clinical divisions can only be created by GCNS (General Chief Nursing Services).');
      return;
    }
    const cleanName = newDiv.name.trim();
    if (!cleanName) return;
    setDivisions(prev => {
      if (prev.some(d => d.name.toLowerCase() === cleanName.toLowerCase())) {
        alert(`A clinical division named "${cleanName}" already exists.`);
        return prev;
      }
      const created: ClinicalDivision = {
        id: `div-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: cleanName,
        description: newDiv.description?.trim() || `${cleanName} Clinical Directorate`,
        colorTheme: newDiv.colorTheme || 'emerald',
        icon: newDiv.icon || 'Activity',
        createdAt: new Date().toISOString()
      };
      const next = [...prev, created];
      try {
        localStorage.setItem('hospital_clinical_divisions', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to persist divisions to localStorage', e);
      }
      return next;
    });
  };

  const handleDeleteDivision = (divNameOrId: string) => {
    if (isCurrentUserCnsOrDcns) {
      alert('Division Security: Clinical divisions can only be deleted by GCNS (General Chief Nursing Services).');
      return;
    }
    if (['Excellency', 'Medical', 'Surgical'].includes(divNameOrId)) {
      alert('The core foundational divisions (Excellency, Medical, Surgical) cannot be removed.');
      return;
    }
    setDivisions(prev => {
      const next = prev.filter(d => d.id !== divNameOrId && d.name !== divNameOrId);
      try {
        localStorage.setItem('hospital_clinical_divisions', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to persist divisions to localStorage', e);
      }
      return next;
    });
  };

  // Staff CRUD
  const handleAddStaff = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setStaff(prev => {
      const nextIdNum = prev.length > 0 ? Math.max(...prev.map(s => parseInt(s.id.replace(/\D/g, '') || '0'))) + 1 : 1;
      const nextId = `S${nextIdNum.toString().padStart(3, '0')}`;
      return [...prev, { id: nextId, name: '', email: '', jobTitle: 'Staff Nurse', isSenior: false, isMale: false, hasCaringHours: false, maxMorning: 15, maxEvening: 10, maxNight: 8, maxOff: 10, phone: '', licenseNumber: `RN-2025-${nextIdNum.toString().padStart(4, '0')}`, licenseExpiry: '2028-12-31', joinDate: todayStr, wardId: activeWardId }];
    });
  };

  const handleAddCounterPartStaff = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setStaff(prev => {
      const nextIdNum = prev.length > 0 ? Math.max(...prev.map(s => parseInt(s.id.replace(/\D/g, '') || '0'))) + 1 : 1;
      const nextId = `S${nextIdNum.toString().padStart(3, '0')}`;
      const firstNonCounterPart = prev.find(s => !s.isCounterPart);
      return [...prev, { 
        id: nextId, 
        name: 'Counterpart Staff', 
        email: '',
        jobTitle: 'Counterpart Nurse',
        isSenior: false, 
        isMale: false, 
        hasCaringHours: false,
        maxMorning: 0, 
        maxEvening: 0, 
        maxNight: 0, 
        maxOff: 0,
        phone: '',
        licenseNumber: `CP-2025-${nextIdNum.toString().padStart(4, '0')}`,
        licenseExpiry: '2028-12-31',
        joinDate: todayStr,
        isCounterPart: true,
        counterPartOf: firstNonCounterPart ? firstNonCounterPart.id : '',
        wardId: activeWardId
      }];
    });
  };

  const handleAddHaStaff = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setStaff(prev => {
      const nextIdNum = prev.length > 0 ? Math.max(...prev.map(s => parseInt(s.id.replace(/\D/g, '') || '0'))) + 1 : 1;
      const nextId = `S${nextIdNum.toString().padStart(3, '0')}`;
      return [...prev, { id: nextId, name: '(MSA) ', email: '', jobTitle: 'Medical Service Aid', isHa: true, isSenior: false, isMale: false, hasCaringHours: false, maxMorning: 15, maxEvening: 10, maxNight: 8, maxOff: 10, phone: '', licenseNumber: `MSA-2025-${nextIdNum.toString().padStart(4, '0')}`, licenseExpiry: '2028-12-31', joinDate: todayStr, wardId: activeWardId }];
    });
  };

  const handleAddWsStaff = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setStaff(prev => {
      const nextIdNum = prev.length > 0 ? Math.max(...prev.map(s => parseInt(s.id.replace(/\D/g, '') || '0'))) + 1 : 1;
      const nextId = `S${nextIdNum.toString().padStart(3, '0')}`;
      return [...prev, { id: nextId, name: '(WS) Ward Supervisor', email: '', jobTitle: 'Ward Supervisor', isSenior: false, isMale: false, hasCaringHours: false, maxMorning: 15, maxEvening: 10, maxNight: 8, maxOff: 10, phone: '', licenseNumber: `WS-2025-${nextIdNum.toString().padStart(4, '0')}`, licenseExpiry: '2028-12-31', joinDate: todayStr, isWardSupervisor: true, wardId: activeWardId }];
    });
  };

  const resolvedAssignments = useMemo(() => {
    const counterpartStaff = activeWardStaff.filter(s => s.isCounterPart && s.counterPartOf);
    if (counterpartStaff.length === 0) return assignments;

    const mirroredAssignments: Assignment[] = [];
    counterpartStaff.forEach(s => {
      const targetAssignments = assignments.filter(a => a.staffId === s.counterPartOf);
      targetAssignments.forEach(ta => {
        const isInPeriod = (!s.counterPartStart || ta.date >= s.counterPartStart) &&
                           (!s.counterPartEnd || ta.date <= s.counterPartEnd);
        if (isInPeriod) {
          mirroredAssignments.push({
            staffId: s.id,
            date: ta.date,
            shift: ta.shift,
            wardId: activeWardId
          });
        }
      });
    });

    return [...assignments, ...mirroredAssignments];
  }, [assignments, activeWardStaff, activeWardId]);

  const updateStaff = (id: string, updates: Partial<StaffMember>) => {
    let finalUpdates = updates;
    if (isCurrentUserCnsOrDcns) {
      const targetStaff = staff.find(s => s.id === id);
      if (targetStaff) {
        const targetWard = targetStaff.wardId ? wards.find(w => w.id === targetStaff.wardId) : undefined;
        const targetCat = (targetStaff.category || targetWard?.category || 'Medical').toLowerCase();
        if (targetCat !== currentUserDiv) {
          alert('Division Security: CNS and DCNS are not allowed to change staff information from other divisions.');
          return;
        }
        if (finalUpdates.wardId) {
          const newWard = wards.find(w => w.id === finalUpdates.wardId);
          if (newWard && (newWard.category || 'Medical').toLowerCase() !== currentUserDiv) {
            alert('Division Security: Cannot transfer staff to an external division ward.');
            return;
          }
        }
        if (finalUpdates.category && finalUpdates.category.toLowerCase() !== currentUserDiv) {
          finalUpdates = { ...finalUpdates, category: currentUser?.category || 'Medical' };
        }
      }
    }

    if (finalUpdates.id !== undefined && finalUpdates.id !== id) {
      const cleanNewId = finalUpdates.id.trim();
      if (!cleanNewId) {
        alert("ID cannot be empty.");
        return;
      }
      if (staff.some(s => s.id === cleanNewId)) {
        alert(`ID "${cleanNewId}" is already taken by another staff member.`);
        return;
      }
      
      setStaff(prev => prev.map(s => {
        const isTarget = s.id === id;
        const sUpdates = isTarget ? { ...finalUpdates, id: cleanNewId } : {};
        let newObj = { ...s, ...sUpdates };
        if (s.counterPartOf === id) {
          newObj.counterPartOf = cleanNewId;
        }
        return newObj;
      }));
      
      setAssignments(prev => prev.map(a => a.staffId === id ? { ...a, staffId: cleanNewId } : a));
      return;
    }

    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...finalUpdates } : s));
  };

  const removeMultipleStaff = (ids: string[]) => {
    if (isCurrentUserCnsOrDcns) {
      const forbidden = ids.some(id => {
        const s = staff.find(st => st.id === id);
        const sWard = s?.wardId ? wards.find(w => w.id === s.wardId) : undefined;
        const sCat = (s?.category || sWard?.category || 'Medical').toLowerCase();
        return sCat !== currentUserDiv;
      });
      if (forbidden) {
        alert('Division Security: CNS and DCNS are not allowed to delete staff members from external divisions.');
        return;
      }
    }
    setStaff(prev => prev.filter(s => !ids.includes(s.id)));
    setAssignments(prev => prev.filter(a => !ids.includes(a.staffId)));
  };

  const updateAssignment = (staffId: string, date: string, shift: ShiftType, isSystemBypass: boolean = false) => {
    if (!isSystemBypass && !isCurrentUserNurseSupervisor) {
      alert('Authority Restriction: Only Nurse Supervisors (NS) have the authority to edit the duty rota.');
      return;
    }
    setAssignments(prev => {
      const filtered = prev.filter(a => !(a.staffId === staffId && a.date === date));
      if (shift === ShiftType.None) return filtered;
      return [...filtered, { staffId, date, shift, wardId: activeWardId }];
    });
  };

  // Duty Exchange Multi-Step Workflow Handlers
  const handleCreateExchangeRequest = (params: {
    requestor: StaffMember;
    target: StaffMember;
    type: 'swap' | 'transfer';
    requestorDate: string;
    requestorShift: ShiftType;
    targetDate?: string;
    targetShift?: ShiftType;
    reason?: string;
  }) => {
    const supervisorEmail = currentWard.supervisorEmail || 'supervisor@hospital.org';
    const result = createExchangeRequestHelper({
      ...params,
      wardId: activeWardId,
      wardSupervisorEmail: supervisorEmail
    });

    setExchangeRequests(prev => [result.request, ...prev]);
    setNotifications(prev => [...result.notifications, ...prev]);
  };

  const handlePeerRespondExchange = (requestId: string, accept: boolean, note?: string) => {
    const req = exchangeRequests.find(r => r.id === requestId);
    if (!req) return;

    const supervisorEmail = currentWard.supervisorEmail || 'supervisor@hospital.org';
    const authorizedStaffInWard = staff.filter(s => s.wardId === req.wardId && s.isAuthorizedDutyApprover);
    const result = handlePeerResponseHelper(req, accept, note || '', supervisorEmail, authorizedStaffInWard);

    setExchangeRequests(prev => prev.map(r => r.id === requestId ? result.updatedRequest : r));
    setNotifications(prev => [...result.notifications, ...prev]);
  };

  const handleWsRespondExchange = (requestId: string, approve: boolean, note?: string) => {
    const req = exchangeRequests.find(r => r.id === requestId);
    if (!req) return;

    const loggedInStaff = staff.find(s => s.id === loggedInStaffId);
    let wsName = currentUser.name || 'Ward Supervisor';
    if (loggedInStaff && loggedInStaff.isAuthorizedDutyApprover && currentUser.role === 'staff') {
      wsName = `${loggedInStaff.name} (Authorised Staff)`;
    }

    const result = handleWsResponseHelper(req, approve, note || '', wsName);

    setExchangeRequests(prev => prev.map(r => r.id === requestId ? result.updatedRequest : r));
    setNotifications(prev => [...result.notifications, ...prev]);

    if (approve && result.assignmentsToUpdate.length > 0) {
      result.assignmentsToUpdate.forEach(upd => {
        updateAssignment(upd.staffId, upd.date, upd.shift, true);
      });
    }
  };

  // Ward Transfer Request Handlers
  const handleInitiateWardTransfer = (
    staffMember: StaffMember,
    targetWardId: string,
    reason: string
  ) => {
    const sourceWard = wards.find(w => w.id === (staffMember.wardId || activeWardId)) || currentWard;
    const targetWard = wards.find(w => w.id === targetWardId);
    if (!targetWard) {
      alert('Target ward not found.');
      return;
    }

    const sourceWsUser = users.find(u => u.wardId === sourceWard.id && u.role === 'ward_supervisor');
    const targetWsUser = users.find(u => u.wardId === targetWard.id && u.role === 'ward_supervisor');

    const result = createWardTransferRequestHelper({
      staffMember,
      sourceWard,
      sourceWsUser,
      targetWard,
      targetWsUser,
      reason
    });

    setWardTransferRequests(prev => [result.request, ...prev]);
    setNotifications(prev => [...result.notifications, ...prev]);
    alert(`Ward transfer request for ${staffMember.name} (${staffMember.id}) sent to Target Ward Supervisor (${targetWard.supervisorName || targetWard.name}).`);
  };

  const handleTargetWsRespondTransfer = (
    requestId: string,
    accept: boolean,
    note?: string
  ) => {
    const req = wardTransferRequests.find(r => r.id === requestId);
    if (!req) return;

    const targetWsName = currentUser.name || 'Target Ward Supervisor';
    const adminEmail = 'admin@hospital.org';

    const result = handleTargetWsTransferResponseHelper(
      req,
      accept,
      note || '',
      targetWsName,
      adminEmail
    );

    setWardTransferRequests(prev => prev.map(r => r.id === requestId ? result.updatedRequest : r));
    setNotifications(prev => [...result.notifications, ...prev]);

    if (accept) {
      alert(`Transfer request ACCEPTED! Forwarded to GCNS (${adminEmail}) for final approval.`);
    } else {
      alert(`Transfer request REJECTED.`);
    }
  };

  const handleAdminRespondTransfer = (
    requestId: string,
    approve: boolean,
    note?: string
  ) => {
    const req = wardTransferRequests.find(r => r.id === requestId);
    if (!req) return;

    const adminName = currentUser.name || 'GCNS (General Chief Nursing Services)';
    const result = handleAdminTransferResponseHelper(req, approve, note || '', adminName);

    setWardTransferRequests(prev => prev.map(r => r.id === requestId ? result.updatedRequest : r));
    setNotifications(prev => [...result.notifications, ...prev]);

    if (approve && result.shouldTransfer) {
      // Automatically update staff wardId
      setStaff(prev => prev.map(s => {
        if (s.id === result.staffId) {
          return { ...s, wardId: result.targetWardId };
        }
        return s;
      }));

      // Automatically update user wardId if applicable
      setUsers(prev => prev.map(u => {
        if (u.staffMemberId === result.staffId || (req.staffEmail && u.email.toLowerCase() === req.staffEmail.toLowerCase())) {
          return { ...u, wardId: result.targetWardId };
        }
        return u;
      }));

      alert(`🎉 Staff member ${req.staffName} (${req.staffId}) has been officially APPROVED & automatically transferred to ${req.targetWardName}!`);
    } else if (!approve) {
      alert(`Transfer request rejected by GCNS.`);
    }
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const updateAssignmentsBatch = (updates: Assignment[], isSystemBypass: boolean = false) => {
    if (!isSystemBypass && !isCurrentUserNurseSupervisor) {
      alert('Authority Restriction: Only Nurse Supervisors (NS) have the authority to edit the duty rota.');
      return;
    }
    setAssignments(prev => {
      const newAssignmentsMap = new Map();
      prev.forEach(a => newAssignmentsMap.set(`${a.staffId}|${a.date}`, a.shift));
      
      updates.forEach(u => {
        if (u.shift === ShiftType.None) {
          newAssignmentsMap.delete(`${u.staffId}|${u.date}`);
        } else {
          newAssignmentsMap.set(`${u.staffId}|${u.date}`, u.shift);
        }
      });
      
      const result: Assignment[] = [];
      newAssignmentsMap.forEach((shift, key) => {
        const [staffId, date] = key.split('|');
        result.push({ staffId, date, shift, wardId: activeWardId });
      });
      return result;
    });
  };

  const handleResetPrevMonthLast5Days = () => {
    if (!isCurrentUserNurseSupervisor) {
      alert('Authority Restriction: Only Nurse Supervisors (NS) have the authority to edit the duty rota.');
      return;
    }
    const monthIdx = MONTHS.indexOf(config.month) >= 0 ? MONTHS.indexOf(config.month) : 0;
    const prevMonthDates = new Set([-4, -3, -2, -1, 0].map(offset => {
      const d = new Date(config.year, monthIdx, offset);
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${day}`;
    }));
    const activeStaffIds = new Set(activeWardStaff.map(s => s.id));
    
    setAssignments(prev => prev.filter(a => {
      if (prevMonthDates.has(a.date)) {
        if (activeStaffIds.has(a.staffId) || !a.wardId || a.wardId === activeWardId) {
          return false;
        }
      }
      return true;
    }));
  };

  const handleResetCurrentMonth = () => {
    if (!isCurrentUserNurseSupervisor) {
      alert('Authority Restriction: Only Nurse Supervisors (NS) have the authority to edit the duty rota.');
      return;
    }
    const monthIdx = MONTHS.indexOf(config.month) >= 0 ? MONTHS.indexOf(config.month) : 0;
    const totalDays = new Date(config.year, monthIdx + 1, 0).getDate();
    const currentMonthDates = new Set(Array.from({ length: totalDays }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      const m = (monthIdx + 1).toString().padStart(2, '0');
      return `${config.year}-${m}-${day}`;
    }));
    const activeStaffIds = new Set(activeWardStaff.map(s => s.id));

    setAssignments(prev => prev.filter(a => {
      if (currentMonthDates.has(a.date)) {
        if (activeStaffIds.has(a.staffId) || !a.wardId || a.wardId === activeWardId) {
          return false;
        }
      }
      return true;
    }));
  };

  const handleExportStaff = () => {
    const headers = ['id', 'name', 'email', 'jobTitle', 'joinDate', 'isSenior', 'isMale', 'hasCaringHours', 'maxMorning', 'maxEvening', 'maxNight', 'maxOff', 'phone', 'isWardSupervisor'];
    const rows = activeWardStaff.map(s => [
      s.id, 
      s.name.replace(/,/g, ''), 
      (s.email || '').replace(/,/g, ''),
      (s.jobTitle || '').replace(/,/g, ''),
      (s.joinDate || '').replace(/,/g, ''),
      s.isSenior ? 'true' : 'false', 
      s.isMale ? 'true' : 'false', 
      s.hasCaringHours ? 'true' : 'false',
      s.maxMorning, 
      s.maxEvening, 
      s.maxNight,
      s.maxOff ?? 10,
      (s.phone || '').replace(/,/g, ''),
      s.isWardSupervisor ? 'true' : 'false'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `staff_list_${currentWard.code}.csv`);
    link.click();
  };

  const handleImportStaff = (csvData: string) => {
    const lines = csvData.split(/\r?\n/);
    if (lines.length < 2) return;
    const headerLine = lines[0].toLowerCase();
    const headerCols = headerLine.split(',').map(c => c.trim());
    const hasEmailCol = headerCols.includes('email');

    const importedStaff: StaffMember[] = [];
    const parseBool = (val: string) => {
      const s = (val || '').trim().toLowerCase();
      return s === 'true' || s === '1' || s === 'yes';
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length < 7) continue;

      let id = '', name = '', email = '', jobTitle = '', joinDate = '', isSenior = 'false', isMale = 'false', hasCaringHours = 'false';
      let maxMorning = '0', maxEvening = '0', maxNight = '0', maxOff = '10', phone = '', isWardSupervisor = 'false';

      if (hasEmailCol) {
        const idIdx = headerCols.indexOf('id');
        const nameIdx = headerCols.indexOf('name');
        const emailIdx = headerCols.indexOf('email');
        const jobTitleIdx = headerCols.indexOf('jobtitle');
        const joinDateIdx = headerCols.indexOf('joindate') !== -1 ? headerCols.indexOf('joindate') : headerCols.indexOf('dateofjoining');
        const seniorIdx = headerCols.indexOf('issenior');
        const maleIdx = headerCols.indexOf('ismale');
        const caringIdx = headerCols.indexOf('hascaringhours');
        const morningIdx = headerCols.indexOf('maxmorning');
        const eveningIdx = headerCols.indexOf('maxevening');
        const nightIdx = headerCols.indexOf('maxnight');
        const offIdx = headerCols.indexOf('maxoff');
        const phoneIdx = headerCols.indexOf('phone');
        const wsIdx = headerCols.indexOf('iswardsupervisor');

        id = parts[idIdx] || '';
        name = parts[nameIdx] || '';
        email = parts[emailIdx] || '';
        jobTitle = jobTitleIdx !== -1 ? (parts[jobTitleIdx] || '') : '';
        joinDate = joinDateIdx !== -1 ? (parts[joinDateIdx] || '') : '';
        isSenior = parts[seniorIdx] || 'false';
        isMale = parts[maleIdx] || 'false';
        hasCaringHours = parts[caringIdx] || 'false';
        maxMorning = parts[morningIdx] || '0';
        maxEvening = parts[eveningIdx] || '0';
        maxNight = parts[nightIdx] || '0';
        maxOff = parts[offIdx] || '10';
        phone = parts[phoneIdx] || '';
        isWardSupervisor = parts[wsIdx] || 'false';
      } else {
        if (parts.length >= 14) {
          [id, name, email, jobTitle, joinDate, isSenior, isMale, hasCaringHours, maxMorning, maxEvening, maxNight, maxOff, phone, isWardSupervisor] = parts;
        } else if (parts.length >= 13) {
          [id, name, email, jobTitle, isSenior, isMale, hasCaringHours, maxMorning, maxEvening, maxNight, maxOff, phone, isWardSupervisor] = parts;
        } else if (parts.length >= 12) {
          [id, name, email, isSenior, isMale, hasCaringHours, maxMorning, maxEvening, maxNight, maxOff, phone, isWardSupervisor] = parts;
        } else {
          [id, name, isSenior, isMale, maxMorning, maxEvening, maxNight, phone, isWardSupervisor] = parts;
        }
      }

      importedStaff.push({
        id: id.trim(),
        name: name.trim(),
        email: email.trim(),
        jobTitle: jobTitle.trim() || undefined,
        joinDate: joinDate.trim() || undefined,
        isSenior: parseBool(isSenior),
        isMale: parseBool(isMale),
        hasCaringHours: parseBool(hasCaringHours),
        maxMorning: parseInt(maxMorning) || 0,
        maxEvening: parseInt(maxEvening) || 0,
        maxNight: parseInt(maxNight) || 0,
        maxOff: parseInt(maxOff) || 10,
        phone: phone ? phone.trim() : '',
        isWardSupervisor: parseBool(isWardSupervisor),
        wardId: activeWardId
      });
    }
    if (importedStaff.length > 0) {
      setStaff(prev => [...prev.filter(s => s.wardId !== activeWardId), ...importedStaff]);
      alert(`Successfully imported ${importedStaff.length} staff members for ${currentWard.name}.`);
    }
  };

  const handleExportAssignments = () => {
    const monthIdx = MONTHS.indexOf(config.month);
    const daysInMonth = new Date(config.year, monthIdx + 1, 0).getDate();
    const headers = ['ID', 'Name', ...Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString())];
    const rows = activeWardStaff.map(member => {
      const row = [member.id, member.name.replace(/,/g, '')];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const assignment = resolvedAssignments.find(a => a.staffId === member.id && a.date === dateStr);
        row.push(assignment ? assignment.shift : ShiftType.None);
      }
      return row;
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `duty_roster_${currentWard.code}_${config.month}_${config.year}.csv`);
    link.click();
  };

  const handleImportAssignments = (csvData: string) => {
    if (!isCurrentUserNurseSupervisor) {
      alert('Authority Restriction: Only Nurse Supervisors (NS) have the authority to edit the duty rota.');
      return;
    }
    const lines = csvData.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return;
    const header = lines[0].split(',');
    const imported: Assignment[] = [];
    const monthIdx = MONTHS.indexOf(config.month);
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const staffId = parts[0].trim();
      if (!staffId) continue;
      for (let colIdx = 2; colIdx < header.length; colIdx++) {
        const dayNum = parseInt(header[colIdx]);
        if (isNaN(dayNum)) continue;
        const shift = parts[colIdx]?.trim() as ShiftType;
        if (shift && shift !== ShiftType.None) {
          const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
          imported.push({ staffId, date: dateStr, shift, wardId: activeWardId });
        }
      }
    }
    if (imported.length > 0) {
      setAssignments(prev => {
        const otherAssignments = prev.filter(a => a.wardId !== activeWardId);
        return [...otherAssignments, ...imported];
      });
      alert(`Successfully imported ${imported.length} shift assignments for ${currentWard.name}.`);
    }
  };

  const handleGenerateRoster = (newAssignments: Assignment[]) => {
    if (!isCurrentUserNurseSupervisor) {
      alert('Authority Restriction: Only Nurse Supervisors (NS) have the authority to edit or generate the duty rota.');
      return;
    }
    setAssignments(newAssignments);
  };

  // If not logged in, display the initial Log-In Page for the 3 types of users
  if (!currentUser) {
    return (
      <LoginPage
        users={users}
        wards={wards}
        staff={staff}
        divisions={divisions}
        onLoginUser={handleLoginUser}
        onLoginStaffByEmail={handleLoginStaffByEmail}
        onLoginStaffById={handleLoginStaffById}
      />
    );
  }

  // Permission Checks
  const canManageWard = 
    currentUser.role === 'admin' || 
    currentUser.role === 'cns' ||
    currentUser.role === 'dcns' ||
    currentUser.nurseDesignation === 'CNS' ||
    currentUser.nurseDesignation === 'DCNS' ||
    currentUser.role === 'ward_supervisor' || 
    currentUser.role === 'head_nurse' || 
    currentUser.role === 'nurse_supervisor' ||
    currentUser.nurseDesignation === 'HN' ||
    currentUser.nurseDesignation === 'NS';

  const renderTabContent = () => {
    if (activeTab === 'Wards') {
      return (
        <WardAdminManager
          wards={visibleWardsForUser}
          users={users}
          staff={visibleStaffForUser}
          divisions={divisions}
          onCreateDivision={handleCreateDivision}
          onDeleteDivision={handleDeleteDivision}
          activeWardId={activeWardId}
          onSelectWard={setActiveWardId}
          onCreateWard={handleCreateWard}
          onUpdateWard={handleUpdateWard}
          onDeleteWard={handleDeleteWard}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onUpdateStaff={updateStaff}
          onAssignHeadNurseToSupervisors={handleAssignHeadNurseToSupervisors}
          currentUserRole={currentUser.role}
          currentUser={currentUser}
          onNavigateToCalendar={() => setActiveTab('Calendar')}
          onNavigateToHierarchy={() => setActiveTab('Hierarchy')}
        />
      );
    }

    // Top Admin, DCNS, CNS, & Head Nurse Privilege Restriction Notice for Rota editing/generation tabs (Table Grid & On-Call are viewable)
    if ((currentUser.role === 'admin' || currentUser.role === 'cns' || currentUser.role === 'dcns' || currentUser.nurseDesignation === 'CNS' || currentUser.nurseDesignation === 'DCNS' || currentUser.role === 'head_nurse' || currentUser.role === 'ward_supervisor' || currentUser.nurseDesignation === 'HN') && ['Manual', 'Generate', 'Rules', 'Staff'].includes(activeTab)) {
      const isCns = currentUser.role === 'cns' || currentUser.role === 'dcns' || currentUser.nurseDesignation === 'CNS' || currentUser.nurseDesignation === 'DCNS';
      const isHn = currentUser.role === 'head_nurse' || currentUser.role === 'ward_supervisor' || currentUser.nurseDesignation === 'HN';
      return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-indigo-200 shadow-xl text-center space-y-4">
          <div className={`w-16 h-16 ${isHn ? 'bg-amber-100 text-amber-700' : isCns ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'} rounded-full flex items-center justify-center mx-auto`}>
            {isHn ? <Crown size={32} /> : isCns ? <Sparkles size={32} /> : <Crown size={32} />}
          </div>
          <div className={`inline-block px-3 py-1 ${isHn ? 'bg-amber-50 border-amber-200 text-amber-700' : isCns ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'} border rounded-full text-[10px] font-black uppercase tracking-wider`}>
            {isHn ? 'Head Nurse Leadership Boundary' : isCns ? 'Division Executive Privilege Boundary' : 'Top Admin Privilege Boundary'}
          </div>
          <h3 className="text-xl font-black text-slate-900">Governance & Executive Oversight</h3>
          <p className="text-xs text-slate-600 leading-relaxed text-left bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <span className="block font-black text-slate-900 mb-1">Executive Authorized Scope:</span>
            <span>• <strong>1. Appoint & Supervise Nurse Supervisors (NS)</strong></span><br />
            <span>• <strong>2. Oversee Clinical Divisions, Wards & Units</strong></span><br />
            <span>• <strong>3. Audit Ward Manpower & Organizational Hierarchy Tree</strong></span><br />
            <span>• <strong>4. Review Staff Roster Transfers & Duty Exchanges</strong></span>
          </p>
          <p className="text-xs text-slate-500 italic">
            Direct frontline shift assignments, roster generation, and calendar operations are delegated to appointed Nurse Supervisors (NS).
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveTab('Wards')}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <Building2 size={16} />
              Open Governance Hub
            </button>
            <button
              onClick={() => setActiveTab('Hierarchy')}
              className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-slate-900 flex items-center gap-1.5"
            >
              <Sparkles size={16} />
              View Hierarchy Tree
            </button>
          </div>
        </div>
      );
    }

    // Restricted View Notice for Staff Users attempting to manage
    if (!canManageWard && ['Staff', 'Rules', 'Manual', 'Generate'].includes(activeTab)) {
      return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900">Ward Supervisor Privilege Required</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are currently signed in as a <strong>Staff User ({currentUser.name})</strong>. Editing personnel, shift constraints, or generating AI rosters requires <strong>Ward Supervisor</strong> or <strong>GCNS (General Chief Nursing Services)</strong> authorization.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setActiveTab('StaffPortal')}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-indigo-700"
            >
              Go to My Personal Duty Card
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'Staff':
        return (
          <StaffManager 
            staff={activeWardStaff} 
            wards={wards}
            users={users}
            onAdd={handleAddStaff} 
            onAddHa={handleAddHaStaff}
            onAddWs={handleAddWsStaff}
            onAddCounterPart={handleAddCounterPartStaff}
            config={config}
            onUpdate={updateStaff} 
            onRemoveMultiple={removeMultipleStaff}
            onExport={handleExportStaff}
            onImport={handleImportStaff}
            onInitiateWardTransfer={handleInitiateWardTransfer}
            theme={theme}
            currentUserRole={currentUser.role}
          />
        );
      case 'Rules':
        return (
          <RulesManager 
            config={config} 
            onUpdate={setConfig} 
            staff={activeWardStaff} 
            assignments={resolvedAssignments} 
          />
        );
      case 'Calendar':
      case 'Manual':
        return (
          <CalendarView 
            staff={activeWardStaff} 
            allStaff={visibleStaffForUser}
            wards={visibleWardsForUser}
            currentWardId={activeWardId}
            onSelectWard={setActiveWardId}
            config={config} 
            assignments={resolvedAssignments} 
            onUpdateAssignment={updateAssignment}
            onUpdateBatch={updateAssignmentsBatch}
            onResetPreviousMonthLast5Days={handleResetPrevMonthLast5Days}
            onResetCurrentMonth={handleResetCurrentMonth}
            onExportCSV={handleExportAssignments}
            onImportCSV={handleImportAssignments}
            theme={theme}
            onUpdateConfig={setConfig}
            isTopAdmin={currentUser.role === 'admin' || currentUser.role === 'cns' || currentUser.nurseDesignation === 'CNS'}
            currentUserRole={currentUser.role}
            currentUser={currentUser}
          />
        );
      case 'Generate':
        return (
          <Generator 
            staff={activeWardStaff} 
            config={config} 
            assignments={assignments} 
            onGenerate={handleGenerateRoster}
            onComplete={() => setActiveTab('Calendar')}
            onUpdateConfig={setConfig}
            currentUserRole={currentUser.role}
          />
        );
      case 'OnCall':
        return (
          <OnCallPrintView
            staff={activeWardStaff}
            allStaff={visibleStaffForUser}
            wards={visibleWardsForUser}
            currentWardId={activeWardId}
            config={config}
            assignments={resolvedAssignments}
            onBack={() => setActiveTab('Calendar')}
            appTheme={theme}
            showBackButton={false}
          />
        );
      case 'StaffPortal':
        return (
          <StaffPortal
            staff={staff}
            config={config}
            assignments={resolvedAssignments}
            onUpdateAssignment={updateAssignment}
            appTheme={theme}
            loggedInStaffId={loggedInStaffId}
            onLogin={setLoggedInStaffId}
            onLogout={() => setLoggedInStaffId(null)}
            onSwitchTab={setActiveTab}
            currentUser={currentUser}
            exchangeRequests={exchangeRequests}
            notifications={notifications}
            onRequestExchange={handleCreateExchangeRequest}
            onPeerRespondExchange={handlePeerRespondExchange}
            onWsRespondExchange={handleWsRespondExchange}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearNotifications={handleClearNotifications}
            onUpdateConfig={setConfig}
            onUpdateStaff={updateStaff}
          />
        );
      case 'Hierarchy':
        return (
          <HierarchyChart
            users={users}
            wards={wards}
            staff={staff}
            divisions={divisions}
            onCreateDivision={handleCreateDivision}
            onDeleteDivision={handleDeleteDivision}
            activeWardId={activeWardId}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onAssignHeadNurseToSupervisors={handleAssignHeadNurseToSupervisors}
            currentUserRole={currentUser.role}
            currentUser={currentUser}
          />
        );
      default:
        return null;
    }
  };

  const themeClasses = {
    Professional: "bg-gray-50 text-gray-900",
    Colorful: "bg-emerald-50 text-gray-900",
    Attractive: "bg-indigo-50/30 text-indigo-950",
    Day: "bg-yellow-50 text-amber-900",
    Night: "bg-[#0b0e14] text-slate-200"
  };

  const containerClasses = {
    Professional: "bg-white rounded-xl shadow-lg border border-gray-100 p-2 sm:p-6",
    Colorful: "bg-white rounded-2xl shadow-xl border-2 border-emerald-100 p-2 sm:p-6",
    Attractive: "bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white p-2 sm:p-8",
    Day: "bg-white rounded-3xl shadow-xl border-4 border-amber-100 p-2 sm:p-6",
    Night: "bg-[#161b22] rounded-xl shadow-2xl border border-slate-700/50 p-2 sm:p-6"
  };

  return (
    <div className={`w-full min-h-screen max-w-[100vw] mx-auto px-2 sm:px-4 py-8 overflow-x-hidden transition-all duration-500 print:bg-white print:text-black print:p-0 print:m-0 print:min-h-0 ${themeClasses[theme]}`}>
      {/* Header */}
      <header className="flex flex-col items-center mb-8 no-print gap-4">
        <div className="text-center">
          <h1 className={`text-4xl font-black mb-1 tracking-tight transition-all duration-500 ${
            theme === 'Attractive' ? 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600' : 
            theme === 'Night' ? 'text-white' : 
            theme === 'Day' ? 'text-amber-600' : ''
          }`}>
            AI Staff Roster Manager
          </h1>
          <p className={`${theme === 'Night' ? 'text-slate-500' : 'text-gray-500'} font-medium`}>
            Multi-Ward Medical Duty Scheduling & Privilege Control Center
          </p>
        </div>

        {/* User Role & Ward Context Header Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-700">
          {/* User Badge */}
          <div className="flex items-center gap-2">
            {currentUser.role === 'admin' ? (
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Crown size={14} />
                1. GCNS (General Chief Nursing Services)
              </span>
            ) : currentUser.role === 'cns' || currentUser.role === 'dcns' || currentUser.nurseDesignation === 'CNS' || currentUser.nurseDesignation === 'DCNS' ? (
              <span className={`px-3 py-1 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                currentUser.category === 'Excellency'
                  ? 'bg-purple-600 shadow-purple-900/30'
                  : currentUser.category === 'Surgical'
                  ? 'bg-rose-600 shadow-rose-900/30'
                  : 'bg-sky-600 shadow-sky-900/30'
              }`}>
                {currentUser.role === 'dcns' || currentUser.nurseDesignation === 'DCNS' ? (
                  <Shield size={14} className="text-indigo-200" />
                ) : (
                  <Crown size={14} className="text-amber-200" />
                )}
                {currentUser.role === 'dcns' || currentUser.nurseDesignation === 'DCNS' ? '2. DCNS (Deputy Chief Nursing Services)' : '2. CNS (Chief Nursing Services)'} • {currentUser.category || 'Division'}
              </span>
            ) : currentUser.role === 'head_nurse' || currentUser.role === 'ward_supervisor' || currentUser.nurseDesignation === 'HN' ? (
              <span className={`px-3 py-1 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                currentUser.category === 'Excellency'
                  ? 'bg-purple-600 shadow-purple-900/30'
                  : currentUser.category === 'Surgical'
                  ? 'bg-rose-600 shadow-rose-900/30'
                  : 'bg-amber-600 shadow-amber-900/30'
              }`}>
                <Crown size={14} />
                Head Nurse (HN) • {currentUser.category ? `${currentUser.category} Division` : 'Ward In-Charge'}
              </span>
            ) : currentUser.role === 'nurse_supervisor' || currentUser.nurseDesignation === 'NS' ? (
              <span className="px-3 py-1 bg-cyan-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Activity size={14} />
                4. Nurse Supervisor (NS) • Team Leader
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <UserCheck size={14} />
                5. {currentUser.nurseDesignation === 'MSA' || currentUser.nurseDesignation === 'HA' ? 'Medical Service Aid (MSA)' : 'Staff Nurse (SN)'}
              </span>
            )}

            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <span>{currentUser.name}</span>
              <span className="text-[10px] font-mono text-slate-400 font-normal">({currentUser.email})</span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Change Password Button */}
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-black transition flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider cursor-pointer"
            title="Change password via OTP"
          >
            <KeyRound size={14} />
            Password
          </button>

          {/* Log Out Button */}
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-black transition flex items-center gap-1.5 border border-rose-200 dark:border-rose-800 uppercase tracking-wider"
            title="Log out and return to the main login portal"
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>

        {/* Theme Selector */}
        <div className={`flex p-1 rounded-full items-center gap-1 border transition-colors duration-500 ${
          theme === 'Night' ? 'bg-slate-800 border-slate-700' : 'bg-gray-200/50 border-gray-200'
        }`}>
          <div className="px-3 py-1 text-[10px] font-black uppercase text-gray-400">Theme:</div>
          {(['Professional', 'Colorful', 'Attractive', 'Day', 'Night'] as ThemeType[]).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                theme === t 
                  ? (theme === 'Night' ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm') 
                  : (theme === 'Night' ? 'text-slate-500 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700')
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Main Layout Order: Application & Email Notification Center appears first, with the Navigation Buttons directly below it */}
      {(() => {
        const renderNav = () => {
          // Role-specific navigation tabs with Hierarchy Tree accessible to ALL accounts
          let visibleTabs: { id: TabType; icon: React.ReactNode; label: string }[] = [];

          if (currentUser.role === 'admin' || currentUser.role === 'cns' || currentUser.role === 'dcns' || currentUser.nurseDesignation === 'CNS' || currentUser.nurseDesignation === 'DCNS' || currentUser.role === 'head_nurse' || currentUser.role === 'ward_supervisor' || currentUser.nurseDesignation === 'HN') {
            // Tier 1, 2, & 3: GCNS, DCNS / CNS, and Head Nurse (HN)
            visibleTabs = [
              { id: 'Calendar', icon: <Table2 size={18} />, label: 'Roster Schedule' },
              { id: 'Wards', icon: <Building2 size={18} />, label: currentUser.role === 'admin' ? 'Hospital Governance' : currentUser.role === 'cns' || currentUser.role === 'dcns' || currentUser.nurseDesignation === 'CNS' || currentUser.nurseDesignation === 'DCNS' ? 'Division Governance' : 'Ward Governance' },
              { id: 'Hierarchy', icon: <Sparkles size={18} />, label: 'Hierarchy Tree' }
            ];
          } else if (currentUser.role === 'nurse_supervisor' || currentUser.nurseDesignation === 'NS') {
            // Tier 4: Nurse Supervisor (NS) / Supervisor (WS) - Clinical Roster Suite
            visibleTabs = [
              { id: 'Calendar', icon: <Table2 size={18} />, label: 'Roster Schedule' },
              { id: 'Generate', icon: <Sparkles size={18} />, label: 'AI Generator' },
              { id: 'Staff', icon: <ICONS.Users size={18} />, label: 'Staff Directory' },
              { id: 'Rules', icon: <ICONS.Settings size={18} />, label: 'Shift Rules' },
              { id: 'Hierarchy', icon: <Sparkles size={18} />, label: 'Hierarchy Tree' }
            ];
          } else {
            // Tier 5: Staff Nurse (SN) / Medical Service Aid (MSA)
            visibleTabs = [
              { id: 'StaffPortal', icon: <UserCheck size={18} />, label: 'My Duty Card & Swaps' },
              { id: 'Calendar', icon: <Table2 size={18} />, label: 'Ward Duty Roster' },
              { id: 'Hierarchy', icon: <Sparkles size={18} />, label: 'Hierarchy Tree' }
            ];
          }

          if (visibleTabs.length === 0) return null;

          return (
            <nav className="flex justify-center mb-8 no-print">
              <div className="p-2 bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-800/90 shadow-2xl flex flex-wrap sm:flex-nowrap gap-2 w-full xl:w-5/6 mx-auto transition-all duration-500">
                {visibleTabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  // Attractive, high-contrast color identities matching the requested button aesthetics
                  let activeClass = 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-400/40';
                  let inactiveClass = 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border-slate-700/60';
                  let iconColor = isActive ? 'text-white' : 'text-slate-400';

                  if (tab.id === 'StaffPortal') {
                    activeClass = 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-300/40';
                    inactiveClass = 'bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-200 hover:text-white border-indigo-800/60 shadow-xs';
                    iconColor = isActive ? 'text-white' : 'text-indigo-400';
                  } else if (tab.id === 'Hierarchy') {
                    activeClass = 'bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/30 border-cyan-300/40';
                    inactiveClass = 'bg-sky-950/70 hover:bg-sky-900/90 text-sky-200 hover:text-white border-sky-800/60 shadow-xs';
                    iconColor = isActive ? 'text-cyan-300' : 'text-cyan-400';
                  } else if (tab.id === 'Calendar') {
                    activeClass = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-600/30 border-blue-300/40';
                    inactiveClass = 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border-slate-700/60 shadow-xs';
                    iconColor = isActive ? 'text-white' : 'text-blue-400';
                  } else if (tab.id === 'Wards') {
                    activeClass = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30 border-blue-300/40';
                    inactiveClass = 'bg-blue-950/70 hover:bg-blue-900/90 text-blue-200 hover:text-white border-blue-800/60 shadow-xs';
                    iconColor = isActive ? 'text-white' : 'text-blue-400';
                  } else if (tab.id === 'Staff') {
                    activeClass = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border-emerald-300/40';
                    inactiveClass = 'bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-200 hover:text-white border-emerald-800/60 shadow-xs';
                    iconColor = isActive ? 'text-white' : 'text-emerald-400';
                  } else if (tab.id === 'Rules') {
                    activeClass = 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30 border-amber-300/40';
                    inactiveClass = 'bg-amber-950/70 hover:bg-amber-900/90 text-amber-200 hover:text-white border-amber-800/60 shadow-xs';
                    iconColor = isActive ? 'text-white' : 'text-amber-400';
                  } else if (tab.id === 'Manual') {
                    activeClass = 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30 border-purple-300/40';
                    inactiveClass = 'bg-purple-950/70 hover:bg-purple-900/90 text-purple-200 hover:text-white border-purple-800/60 shadow-xs';
                    iconColor = isActive ? 'text-white' : 'text-purple-400';
                  } else if (tab.id === 'Generate') {
                    activeClass = 'bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 border-cyan-300/40';
                    inactiveClass = 'bg-teal-950/70 hover:bg-teal-900/90 text-teal-200 hover:text-white border-teal-800/60 shadow-xs';
                    iconColor = isActive ? 'text-white' : 'text-teal-400';
                  } else if (tab.id === 'OnCall') {
                    activeClass = 'bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-600/30 border-emerald-300/40';
                    inactiveClass = 'bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-200 hover:text-white border-emerald-800/60 shadow-xs';
                    iconColor = isActive ? 'text-white' : 'text-emerald-400';
                  }

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-2xl transition-all duration-200 text-xs sm:text-sm font-black uppercase tracking-wider border active:scale-98 ${
                        isActive ? activeClass : inactiveClass
                      }`}
                    >
                      <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''} ${iconColor}`}>
                        {tab.icon}
                      </span>
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          );
        };

        const renderNotifs = () => (
          <NotificationCenter
            currentUser={currentUser}
            currentStaff={staff.find(s => s.id === loggedInStaffId)}
            currentWard={currentWard}
            exchangeRequests={exchangeRequests}
            wardTransferRequests={wardTransferRequests}
            notifications={notifications}
            onPeerRespond={handlePeerRespondExchange}
            onWsRespond={handleWsRespondExchange}
            onTargetWsRespondTransfer={handleTargetWsRespondTransfer}
            onAdminRespondTransfer={handleAdminRespondTransfer}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearNotifications={handleClearNotifications}
          />
        );

        return (
          <>
            <div className="no-print">
              {renderNotifs()}
            </div>
            {renderNav()}
          </>
        );
      })()}

      {/* Main Container */}
      <main className={`min-h-[600px] w-full mx-auto transition-all duration-700 ${containerClasses[theme]} print:bg-transparent print:shadow-none print:border-none print:p-0 print:min-h-0`}>
        {renderTabContent()}
      </main>

      {/* Login / Role Switching Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        users={users}
        wards={wards}
        staff={staff}
        onLoginUser={handleLoginUser}
        onLoginStaffByEmail={handleLoginStaffByEmail}
        onLoginStaffById={handleLoginStaffById}
        currentUser={currentUser}
      />

      {/* Change Password Modal for logged-in user */}
      {currentUser && (
        <PasswordAuthModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          targetUser={{
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            nurseDesignation: currentUser.nurseDesignation,
            jobTitle: currentUser.jobTitle,
            photoUrl: currentUser.photoUrl,
            wardName: currentWard?.name,
            staffMemberId: currentUser.staffMemberId,
            userAccount: currentUser
          }}
          initialMode="otp_reset"
          onSuccessLogin={() => setIsChangePasswordOpen(false)}
        />
      )}
    </div>
  );
};

export default App;

