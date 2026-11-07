import React, { useState, useMemo, useEffect } from 'react';
import { StaffMember, WardInfo, UserAccount, UserRole, WardCategory, ClinicalDivision, DEFAULT_DIVISIONS } from '../types';
import { 
  ShieldCheck, 
  Users, 
  Crown, 
  Sparkles, 
  Building2, 
  UserCheck, 
  Shield, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ChevronRight,
  Award,
  UserPlus,
  Filter,
  Stethoscope,
  Activity,
  Edit3,
  Save,
  Trash2,
  Heart,
  Baby,
  Thermometer,
  Layers,
  FolderPlus,
  Palette,
  X
} from 'lucide-react';

interface HierarchyChartProps {
  users?: UserAccount[];
  wards?: WardInfo[];
  staff?: StaffMember[];
  divisions?: ClinicalDivision[];
  onCreateDivision?: (newDiv: { name: string; description?: string; colorTheme?: string; icon?: string }) => void;
  onDeleteDivision?: (divisionId: string) => void;
  activeWardId?: string;
  onCreateUser?: (newUserData: Omit<UserAccount, 'id'>) => void;
  onUpdateUser?: (id: string, updates: Partial<UserAccount>) => void;
  onDeleteUser?: (id: string) => void;
  onAssignHeadNurseToSupervisors?: (supervisorIds: string[], headNurseId: string) => void;
  currentUserRole?: UserRole;
  currentUser?: UserAccount;
}

export const HierarchyChart: React.FC<HierarchyChartProps> = ({ 
  users = [], 
  wards = [], 
  staff = [], 
  divisions,
  onCreateDivision,
  onDeleteDivision,
  activeWardId,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onAssignHeadNurseToSupervisors,
  currentUserRole = 'admin',
  currentUser
}) => {
  // Determine if current user is GCNS, DCNS, CNS, or Head Nurse and get their category
  const isDcnsUser = currentUserRole === 'dcns' || currentUser?.nurseDesignation === 'DCNS';
  const isCnsUser = currentUserRole === 'cns' || currentUser?.nurseDesignation === 'CNS' || isDcnsUser;
  const isHeadNurseUser = currentUserRole === 'head_nurse' || currentUser?.nurseDesignation === 'HN';
  const isTopAdmin = currentUserRole === 'admin' || currentUser?.nurseDesignation === 'GCNS';
  const canManageHierarchy = isTopAdmin || isCnsUser || isHeadNurseUser;
  const canEditCns = isTopAdmin || isCnsUser;
  const canEditNsAssignment = isTopAdmin || isCnsUser || isHeadNurseUser;

  const userCategory: WardCategory = useMemo(() => {
    if (currentUser?.category) return currentUser.category;
    if (currentUser?.wardId && currentUser.wardId !== 'ALL') {
      const matchedWard = wards.find(w => w.id === currentUser.wardId);
      if (matchedWard?.category) return matchedWard.category;
    }
    return 'Medical';
  }, [currentUser, wards]);

  // All types of users can view all categories or filter by category
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | WardCategory>('all');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<{
    tier: string;
    title: string;
    description: string;
    privileges: string[];
    controlledBy?: string;
    user?: UserAccount;
  } | null>(null);

  const [assigningNsId, setAssigningNsId] = useState<string | null>(null);
  const [targetHnId, setTargetHnId] = useState<string>('');
  const [targetNsWardId, setTargetNsWardId] = useState<string>('');

  // CNS Management State (GCNS Authority: Add, Edit, Delete CNS)
  const [editingCns, setEditingCns] = useState<UserAccount | null>(null);
  const [editCnsName, setEditCnsName] = useState<string>('');
  const [editCnsEmail, setEditCnsEmail] = useState<string>('');
  const [editCnsCategory, setEditCnsCategory] = useState<WardCategory>('Medical');
  const [editCnsJobTitle, setEditCnsJobTitle] = useState<string>('');
  const [editCnsLicenseNumber, setEditCnsLicenseNumber] = useState<string>('');
  const [editCnsLicenseExpiry, setEditCnsLicenseExpiry] = useState<string>('');
  const [editCnsPhone, setEditCnsPhone] = useState<string>('');

  // Add CNS Modal State (GCNS)
  const [showAddCnsModal, setShowAddCnsModal] = useState<boolean>(false);
  const [newCnsName, setNewCnsName] = useState<string>('');
  const [newCnsEmail, setNewCnsEmail] = useState<string>('');
  const [newCnsCategory, setNewCnsCategory] = useState<WardCategory>('Medical');
  const [newCnsJobTitle, setNewCnsJobTitle] = useState<string>('Chief Nursing Services (Medical)');
  const [newCnsLicenseNumber, setNewCnsLicenseNumber] = useState<string>('');
  const [newCnsLicenseExpiry, setNewCnsLicenseExpiry] = useState<string>('2028-12-31');
  const [newCnsPhone, setNewCnsPhone] = useState<string>('');
  const [newCnsIsDutyApprover, setNewCnsIsDutyApprover] = useState<boolean>(true);

  // Delete CNS Confirmation State (GCNS)
  const [deletingCns, setDeletingCns] = useState<UserAccount | null>(null);

  // Add Division Modal State (GCNS)
  const [showAddDivisionModal, setShowAddDivisionModal] = useState<boolean>(false);
  const [newDivisionName, setNewDivisionName] = useState<string>('');
  const [newDivisionDesc, setNewDivisionDesc] = useState<string>('');
  const [newDivisionColor, setNewDivisionColor] = useState<string>('sky');
  const [newDivisionIcon, setNewDivisionIcon] = useState<string>('Stethoscope');
  const [newDivisionAppointCns, setNewDivisionAppointCns] = useState<boolean>(false);
  const [newDivCnsName, setNewDivCnsName] = useState<string>('');
  const [newDivCnsEmail, setNewDivCnsEmail] = useState<string>('');
  const [newDivCnsLicense, setNewDivCnsLicense] = useState<string>('');
  const [newDivCnsExpiry, setNewDivCnsExpiry] = useState<string>('2028-12-31');

  // Delete Division Confirmation State (GCNS)
  const [deletingDivision, setDeletingDivision] = useState<ClinicalDivision | null>(null);

  const handleOpenAddDivisionModal = () => {
    setNewDivisionName('');
    setNewDivisionDesc('');
    setNewDivisionColor('emerald');
    setNewDivisionIcon('Activity');
    setNewDivisionAppointCns(false);
    setNewDivCnsName('');
    setNewDivCnsEmail('');
    setNewDivCnsLicense(`CNS-LIC-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewDivCnsExpiry('2028-12-31');
    setShowAddDivisionModal(true);
  };

  const handleCreateDivisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivisionName.trim()) {
      alert('Please enter a clinical division name.');
      return;
    }

    const trimmedName = newDivisionName.trim();
    if (onCreateDivision) {
      onCreateDivision({
        name: trimmedName,
        description: newDivisionDesc.trim() || `${trimmedName} Clinical Services Directorate`,
        colorTheme: newDivisionColor,
        icon: newDivisionIcon
      });
    }

    // If user also checked "Appoint CNS immediately"
    if (newDivisionAppointCns && newDivCnsName.trim() && newDivCnsEmail.trim()) {
      if (onCreateUser) {
        onCreateUser({
          name: newDivCnsName.trim(),
          email: newDivCnsEmail.trim().toLowerCase(),
          role: 'cns',
          nurseDesignation: 'CNS',
          category: trimmedName,
          jobTitle: `Chief Nursing Services (${trimmedName})`,
          licenseNumber: newDivCnsLicense.trim() || `CNS-LIC-${Math.floor(1000 + Math.random() * 9000)}`,
          licenseExpiry: newDivCnsExpiry || '2028-12-31',
          isAuthorizedDutyApprover: true
        });
      }
    }

    setSelectedCategoryFilter('all');
    setShowAddDivisionModal(false);
  };

  const handleConfirmDeleteDivision = () => {
    if (!deletingDivision) return;
    if (onDeleteDivision) {
      onDeleteDivision(deletingDivision.id);
    }
    if (selectedCategoryFilter === deletingDivision.name) {
      setSelectedCategoryFilter('all');
    }
    setDeletingDivision(null);
  };

  const handleOpenAddCnsModal = (defaultCat: WardCategory = 'Medical') => {
    setNewCnsName('');
    setNewCnsEmail('');
    setNewCnsCategory(defaultCat);
    setNewCnsJobTitle(`Chief Nursing Services (${defaultCat})`);
    setNewCnsLicenseNumber(`CNS-LIC-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewCnsLicenseExpiry('2028-12-31');
    setNewCnsPhone('');
    setNewCnsIsDutyApprover(true);
    setShowAddCnsModal(true);
  };

  const handleCreateCnsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCnsName.trim() || !newCnsEmail.trim()) {
      alert('Please fill in Chief Nursing Services name and email.');
      return;
    }
    const cleanEmail = newCnsEmail.trim().toLowerCase();
    const existing = users.find(u => u.email.trim().toLowerCase() === cleanEmail);
    if (existing) {
      alert(`A user with email ${cleanEmail} already exists (${existing.name}).`);
      return;
    }

    if (onCreateUser) {
      onCreateUser({
        name: newCnsName.trim(),
        email: cleanEmail,
        role: 'cns',
        nurseDesignation: 'CNS',
        category: newCnsCategory,
        jobTitle: newCnsJobTitle.trim() || `Chief Nursing Services (${newCnsCategory})`,
        licenseNumber: newCnsLicenseNumber.trim() || `CNS-LIC-${Math.floor(1000 + Math.random() * 9000)}`,
        licenseExpiry: newCnsLicenseExpiry || '2028-12-31',
        phone: newCnsPhone.trim() || undefined,
        isAuthorizedDutyApprover: newCnsIsDutyApprover
      });
    }

    setShowAddCnsModal(false);
  };

  const handleConfirmDeleteCns = () => {
    if (!deletingCns) return;
    if (onDeleteUser) {
      onDeleteUser(deletingCns.id);
    }
    if (selectedNodeDetails && selectedNodeDetails.user?.id === deletingCns.id) {
      setSelectedNodeDetails(null);
    }
    if (editingCns?.id === deletingCns.id) {
      setEditingCns(null);
    }
    setDeletingCns(null);
  };

  const handleOpenEditCnsModal = (cns: UserAccount) => {
    setEditingCns(cns);
    setEditCnsName(cns.name);
    setEditCnsEmail(cns.email);
    setEditCnsCategory(cns.category || 'Medical');
    setEditCnsJobTitle(cns.jobTitle || `Chief Nursing Services (${cns.category || 'Medical'})`);
    setEditCnsLicenseNumber(cns.licenseNumber || '');
    setEditCnsLicenseExpiry(cns.licenseExpiry || '');
    setEditCnsPhone(cns.phone || '');
  };

  const handleSaveEditCns = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCns || !editCnsName.trim() || !editCnsEmail.trim()) {
      alert('Please fill in Chief Nursing Services name and email.');
      return;
    }

    if (onUpdateUser) {
      onUpdateUser(editingCns.id, {
        name: editCnsName.trim(),
        email: editCnsEmail.trim().toLowerCase(),
        category: editCnsCategory,
        jobTitle: editCnsJobTitle.trim() || `Chief Nursing Services (${editCnsCategory})`,
        licenseNumber: editCnsLicenseNumber.trim() || undefined,
        licenseExpiry: editCnsLicenseExpiry || undefined,
        phone: editCnsPhone.trim() || undefined
      });
    }

    if (selectedNodeDetails && selectedNodeDetails.user?.id === editingCns.id) {
      setSelectedNodeDetails(prev => prev ? {
        ...prev,
        title: `Chief Nursing Services - ${editCnsCategory} (${editCnsName.trim()})`,
        user: {
          ...prev.user!,
          name: editCnsName.trim(),
          email: editCnsEmail.trim().toLowerCase(),
          category: editCnsCategory,
          jobTitle: editCnsJobTitle.trim(),
          licenseNumber: editCnsLicenseNumber.trim() || undefined,
          licenseExpiry: editCnsLicenseExpiry || undefined,
          phone: editCnsPhone.trim() || undefined
        }
      } : null);
    }

    setEditingCns(null);
  };

  // DCNS Management States (GCNS Authority: Add, Edit, Delete DCNS under each CNS)
  const [showAddDcnsModal, setShowAddDcnsModal] = useState<boolean>(false);
  const [targetCnsForAddDcns, setTargetCnsForAddDcns] = useState<UserAccount | null>(null);
  const [newDcnsName, setNewDcnsName] = useState<string>('');
  const [newDcnsEmail, setNewDcnsEmail] = useState<string>('');
  const [newDcnsCategory, setNewDcnsCategory] = useState<WardCategory>('Medical');
  const [newDcnsJobTitle, setNewDcnsJobTitle] = useState<string>('');
  const [newDcnsLicenseNumber, setNewDcnsLicenseNumber] = useState<string>('');
  const [newDcnsLicenseExpiry, setNewDcnsLicenseExpiry] = useState<string>('');
  const [newDcnsPhone, setNewDcnsPhone] = useState<string>('');
  const [newDcnsIsDutyApprover, setNewDcnsIsDutyApprover] = useState<boolean>(true);

  // Edit DCNS State
  const [editingDcns, setEditingDcns] = useState<UserAccount | null>(null);
  const [editDcnsName, setEditDcnsName] = useState<string>('');
  const [editDcnsEmail, setEditDcnsEmail] = useState<string>('');
  const [editDcnsCategory, setEditDcnsCategory] = useState<WardCategory>('Medical');
  const [editDcnsCnsId, setEditDcnsCnsId] = useState<string>('');
  const [editDcnsJobTitle, setEditDcnsJobTitle] = useState<string>('');
  const [editDcnsLicenseNumber, setEditDcnsLicenseNumber] = useState<string>('');
  const [editDcnsLicenseExpiry, setEditDcnsLicenseExpiry] = useState<string>('');
  const [editDcnsPhone, setEditDcnsPhone] = useState<string>('');
  const [editDcnsIsDutyApprover, setEditDcnsIsDutyApprover] = useState<boolean>(true);

  // Delete DCNS Confirmation State
  const [deletingDcns, setDeletingDcns] = useState<UserAccount | null>(null);

  const handleOpenAddDcnsModal = (cns: UserAccount) => {
    setTargetCnsForAddDcns(cns);
    const cat = cns.category || 'Medical';
    setNewDcnsCategory(cat);
    setNewDcnsName('');
    setNewDcnsEmail('');
    setNewDcnsJobTitle(`Deputy Chief Nursing Services (DCNS - ${cat} Division)`);
    setNewDcnsLicenseNumber(`NUR-DCNS-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewDcnsLicenseExpiry('2028-12-31');
    setNewDcnsPhone('');
    setNewDcnsIsDutyApprover(true);
    setShowAddDcnsModal(true);
  };

  const handleCreateDcnsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDcnsName.trim() || !newDcnsEmail.trim()) {
      alert('Please fill in Deputy Chief Nursing Services name and email.');
      return;
    }

    if (!onCreateUser) {
      alert('User creation is not available.');
      return;
    }

    const assignedCns = targetCnsForAddDcns || allCnsUsers.find(c => c.category === newDcnsCategory) || allCnsUsers[0];

    onCreateUser({
      name: newDcnsName.trim(),
      email: newDcnsEmail.trim().toLowerCase(),
      role: 'dcns',
      nurseDesignation: 'DCNS',
      category: newDcnsCategory,
      cnsId: assignedCns?.id,
      cnsName: assignedCns?.name,
      wardId: 'ALL',
      jobTitle: newDcnsJobTitle.trim() || `Deputy Chief Nursing Services (DCNS - ${newDcnsCategory} Division)`,
      licenseNumber: newDcnsLicenseNumber.trim() || `NUR-DCNS-${Math.floor(1000 + Math.random() * 9000)}`,
      licenseExpiry: newDcnsLicenseExpiry || '2028-12-31',
      phone: newDcnsPhone.trim() || undefined,
      isAuthorizedDutyApprover: newDcnsIsDutyApprover
    });

    setShowAddDcnsModal(false);
    setTargetCnsForAddDcns(null);
  };

  const handleOpenEditDcnsModal = (dcns: UserAccount, parentCns?: UserAccount) => {
    setEditingDcns(dcns);
    setEditDcnsName(dcns.name);
    setEditDcnsEmail(dcns.email);
    setEditDcnsCategory(dcns.category || parentCns?.category || 'Medical');
    setEditDcnsCnsId(dcns.cnsId || parentCns?.id || '');
    setEditDcnsJobTitle(dcns.jobTitle || `Deputy Chief Nursing Services (DCNS - ${dcns.category || 'Division'})`);
    setEditDcnsLicenseNumber(dcns.licenseNumber || '');
    setEditDcnsLicenseExpiry(dcns.licenseExpiry || '');
    setEditDcnsPhone(dcns.phone || '');
    setEditDcnsIsDutyApprover(dcns.isAuthorizedDutyApprover !== false);
  };

  const handleSaveEditDcns = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDcns || !editDcnsName.trim() || !editDcnsEmail.trim()) {
      alert('Please fill in Deputy Chief Nursing Services name and email.');
      return;
    }

    const assignedCns = allCnsUsers.find(c => c.id === editDcnsCnsId) || allCnsUsers.find(c => c.category === editDcnsCategory);

    if (onUpdateUser) {
      onUpdateUser(editingDcns.id, {
        name: editDcnsName.trim(),
        email: editDcnsEmail.trim().toLowerCase(),
        category: editDcnsCategory,
        cnsId: assignedCns?.id,
        cnsName: assignedCns?.name,
        jobTitle: editDcnsJobTitle.trim() || `Deputy Chief Nursing Services (DCNS - ${editDcnsCategory} Division)`,
        licenseNumber: editDcnsLicenseNumber.trim() || undefined,
        licenseExpiry: editDcnsLicenseExpiry || undefined,
        phone: editDcnsPhone.trim() || undefined,
        isAuthorizedDutyApprover: editDcnsIsDutyApprover
      });
    }

    if (selectedNodeDetails && selectedNodeDetails.user?.id === editingDcns.id) {
      setSelectedNodeDetails(prev => prev ? {
        ...prev,
        title: `DCNS - Deputy Chief Nursing Services (${editDcnsName.trim()})`,
        user: {
          ...prev.user!,
          name: editDcnsName.trim(),
          email: editDcnsEmail.trim().toLowerCase(),
          category: editDcnsCategory,
          cnsId: assignedCns?.id,
          cnsName: assignedCns?.name,
          jobTitle: editDcnsJobTitle.trim() || `Deputy Chief Nursing Services (DCNS - ${editDcnsCategory} Division)`,
          licenseNumber: editDcnsLicenseNumber.trim() || undefined,
          licenseExpiry: editDcnsLicenseExpiry || undefined,
          phone: editDcnsPhone.trim() || undefined,
          isAuthorizedDutyApprover: editDcnsIsDutyApprover
        }
      } : null);
    }

    setEditingDcns(null);
  };

  const handleConfirmDeleteDcns = () => {
    if (!deletingDcns) return;
    if (onDeleteUser) {
      onDeleteUser(deletingDcns.id);
    }
    if (selectedNodeDetails && selectedNodeDetails.user?.id === deletingDcns.id) {
      setSelectedNodeDetails(null);
    }
    if (editingDcns?.id === deletingDcns.id) {
      setEditingDcns(null);
    }
    setDeletingDcns(null);
  };

  // Extract hierarchy levels from users & wards
  const adminUser = users.find(u => u.role === 'admin') || {
    id: 'usr-admin',
    name: 'Dr. Sarah Jenkins',
    email: 'admin@hospital.org',
    role: 'admin' as UserRole,
    jobTitle: 'General Chief Nursing Services (GCNS)'
  };

  // Clinical Divisions derived from props, defaults, and active wards/users
  const effectiveDivisions: ClinicalDivision[] = useMemo(() => {
    const list: ClinicalDivision[] = divisions && divisions.length > 0 ? [...divisions] : [...DEFAULT_DIVISIONS];
    const extraNames = new Set<string>();
    wards.forEach(w => {
      if (w.category) extraNames.add(w.category);
    });
    users.forEach(u => {
      if (u.category) extraNames.add(u.category);
    });
    extraNames.forEach(name => {
      if (!list.some(d => d.name.toLowerCase() === name.toLowerCase())) {
        list.push({
          id: `div-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name: name,
          description: `${name} Clinical Services Directorate`,
          colorTheme: name.toLowerCase().includes('surg') ? 'rose' : name.toLowerCase().includes('excel') ? 'purple' : 'sky',
          icon: name.toLowerCase().includes('surg') ? 'Activity' : name.toLowerCase().includes('excel') ? 'Sparkles' : 'Stethoscope',
          isCustom: false,
          createdAt: new Date().toISOString()
        });
      }
    });
    return list;
  }, [divisions, wards, users]);

  const divisionsToDisplay = useMemo(() => {
    if (selectedCategoryFilter === 'all') return effectiveDivisions;
    return effectiveDivisions.filter(d => d.name === selectedCategoryFilter);
  }, [effectiveDivisions, selectedCategoryFilter]);

  const getDivisionTheme = (colorTheme?: string) => {
    switch (colorTheme) {
      case 'purple':
        return {
          border: 'border-purple-500/50',
          bg: 'from-purple-950/20 via-slate-900/60 to-slate-950/80',
          badgeBg: 'bg-purple-900/90 text-purple-200 border-purple-500/50',
          accent: 'text-purple-400',
          cnsBorder: 'border-purple-400/80',
          cnsBg: 'from-[#1a1c4b] to-[#0d102e] hover:from-[#242767] hover:to-[#1a1c4b]',
          btnBg: 'bg-purple-600 hover:bg-purple-500'
        };
      case 'rose':
        return {
          border: 'border-rose-500/50',
          bg: 'from-rose-950/20 via-slate-900/60 to-slate-950/80',
          badgeBg: 'bg-rose-900/90 text-rose-200 border-rose-500/50',
          accent: 'text-rose-400',
          cnsBorder: 'border-rose-400/80',
          cnsBg: 'from-[#3a1523] to-[#200913] hover:from-[#4d1d30] hover:to-[#3a1523]',
          btnBg: 'bg-rose-600 hover:bg-rose-500'
        };
      case 'emerald':
        return {
          border: 'border-emerald-500/50',
          bg: 'from-emerald-950/20 via-slate-900/60 to-slate-950/80',
          badgeBg: 'bg-emerald-900/90 text-emerald-200 border-emerald-500/50',
          accent: 'text-emerald-400',
          cnsBorder: 'border-emerald-400/80',
          cnsBg: 'from-[#0d3422] to-[#061b11] hover:from-[#134931] hover:to-[#0d3422]',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500'
        };
      case 'amber':
        return {
          border: 'border-amber-500/50',
          bg: 'from-amber-950/20 via-slate-900/60 to-slate-950/80',
          badgeBg: 'bg-amber-900/90 text-amber-200 border-amber-500/50',
          accent: 'text-amber-400',
          cnsBorder: 'border-amber-400/80',
          cnsBg: 'from-[#38260b] to-[#1f1404] hover:from-[#4e360f] hover:to-[#38260b]',
          btnBg: 'bg-amber-600 hover:bg-amber-500'
        };
      case 'indigo':
        return {
          border: 'border-indigo-500/50',
          bg: 'from-indigo-950/20 via-slate-900/60 to-slate-950/80',
          badgeBg: 'bg-indigo-900/90 text-indigo-200 border-indigo-500/50',
          accent: 'text-indigo-400',
          cnsBorder: 'border-indigo-400/80',
          cnsBg: 'from-[#19194d] to-[#0c0c28] hover:from-[#23236b] hover:to-[#19194d]',
          btnBg: 'bg-indigo-600 hover:bg-indigo-500'
        };
      case 'cyan':
      case 'sky':
      default:
        return {
          border: 'border-sky-500/50',
          bg: 'from-sky-950/20 via-slate-900/60 to-slate-950/80',
          badgeBg: 'bg-sky-900/90 text-sky-200 border-sky-500/50',
          accent: 'text-sky-400',
          cnsBorder: 'border-sky-400/80',
          cnsBg: 'from-[#103a57] to-[#082234] hover:from-[#154b70] hover:to-[#103a57]',
          btnBg: 'bg-sky-600 hover:bg-sky-500'
        };
    }
  };

  const renderDivisionIcon = (iconName?: string, className: string = 'w-3 h-3') => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Heart':
        return <Heart className={className} />;
      case 'Baby':
        return <Baby className={className} />;
      case 'Thermometer':
        return <Thermometer className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'Building2':
        return <Building2 className={className} />;
      case 'Stethoscope':
      default:
        return <Stethoscope className={className} />;
    }
  };

  // Tier 2: Chief Nursing Services (CNS) - Visible to all users
  const allCnsUsers = useMemo(() => {
    return users.filter(u => u.role === 'cns' || u.nurseDesignation === 'CNS');
  }, [users]);

  // Tier 2: Deputy Chief Nursing Services (DCNS)
  const allDcnsUsers = useMemo(() => {
    return users.filter(u => u.role === 'dcns' || u.nurseDesignation === 'DCNS');
  }, [users]);

  const cnsUsers = useMemo(() => {
    return allCnsUsers.filter(cns => {
      if (selectedCategoryFilter === 'all') return true;
      return (cns.category || 'Medical') === selectedCategoryFilter;
    });
  }, [allCnsUsers, selectedCategoryFilter]);

  const allHeadNurses = useMemo(() => {
    return users.filter(u => u.role === 'head_nurse' || u.role === 'ward_supervisor' || u.nurseDesignation === 'HN');
  }, [users]);

  const headNurses = useMemo(() => {
    return allHeadNurses.filter(hn => {
      if (selectedCategoryFilter === 'all') return true;
      const hnCat = hn.category || (hn.wardId ? wards.find(w => w.id === hn.wardId)?.category : undefined) || 'Medical';
      return hnCat === selectedCategoryFilter;
    });
  }, [allHeadNurses, wards, selectedCategoryFilter]);

  // Head Nurses unassigned to any rendered CNS division
  const unassignedHns = useMemo(() => {
    return headNurses.filter(hn => {
      const hnCat = hn.category || (hn.wardId && wards.find(w => w.id === hn.wardId)?.category) || 'Medical';
      return !cnsUsers.some(c => (hn.cnsId && hn.cnsId === c.id) || c.category === hnCat);
    });
  }, [headNurses, wards, cnsUsers]);

  // Wards assignable for NS reassignment based on division privileges
  const assignableWardsForReassign = useMemo(() => {
    if (isTopAdmin) return wards;
    if (isCnsUser || isHeadNurseUser) {
      const divWards = wards.filter(w => (w.category || 'Medical') === userCategory);
      return divWards.length > 0 ? divWards : wards;
    }
    return wards;
  }, [wards, isTopAdmin, isCnsUser, isHeadNurseUser, userCategory]);

  // Head Nurses assignable for NS reassignment based on division privileges
  const assignableHnsForReassign = useMemo(() => {
    if (isTopAdmin) return allHeadNurses;
    if (isCnsUser || isHeadNurseUser) {
      const divHns = allHeadNurses.filter(h => {
        const cat = h.category || (h.wardId ? wards.find(w => w.id === h.wardId)?.category : undefined) || 'Medical';
        return cat === userCategory;
      });
      return divHns.length > 0 ? divHns : allHeadNurses;
    }
    return allHeadNurses;
  }, [allHeadNurses, wards, isTopAdmin, isCnsUser, isHeadNurseUser, userCategory]);

  const nurseSupervisors = users.filter(u => u.role === 'nurse_supervisor' || u.nurseDesignation === 'NS');

  const hnNurseSupervisors = useMemo(() => {
    return nurseSupervisors.filter(ns => {
      if (selectedCategoryFilter === 'all') return true;
      const nsWard = wards.find(w => w.id === ns.wardId);
      const cat = nsWard?.category || 'Medical';
      return cat === selectedCategoryFilter;
    });
  }, [nurseSupervisors, wards, selectedCategoryFilter]);

  // Handle reassigning HN and Ward to a supervisor directly in the hierarchy
  const handleReassignHnAndWard = (supervisorId: string, newHnId: string, newWardId?: string) => {
    const selectedHn = headNurses.find(h => h.id === newHnId);
    const resolvedWardId = newWardId || selectedHn?.wardId;
    
    if (onAssignHeadNurseToSupervisors) {
      onAssignHeadNurseToSupervisors([supervisorId], newHnId);
    }
    
    if (onUpdateUser) {
      onUpdateUser(supervisorId, {
        headNurseId: newHnId || undefined,
        headNurseName: selectedHn?.name || undefined,
        wardId: resolvedWardId || undefined
      });
    }
    setAssigningNsId(null);
  };

  const handleReassignHn = (supervisorId: string, newHnId: string) => {
    handleReassignHnAndWard(supervisorId, newHnId);
  };

  // Group nurse supervisors by assigned Head Nurse
  const nsByHnId: { [hnId: string]: UserAccount[] } = {};
  const unassignedNs: UserAccount[] = [];

  nurseSupervisors.forEach(ns => {
    if (ns.headNurseId && headNurses.some(hn => hn.id === ns.headNurseId)) {
      if (!nsByHnId[ns.headNurseId]) {
        nsByHnId[ns.headNurseId] = [];
      }
      nsByHnId[ns.headNurseId].push(ns);
    } else {
      // Check if ward matches an HN
      const matchedHnByWard = headNurses.find(hn => 
        hn.wardId === ns.wardId ||
        (hn.assignedWardIds && hn.assignedWardIds.includes(ns.wardId || '')) ||
        wards.some(w => w.id === ns.wardId && w.headNurseId === hn.id)
      );
      if (matchedHnByWard && !ns.headNurseId) {
        if (!nsByHnId[matchedHnByWard.id]) {
          nsByHnId[matchedHnByWard.id] = [];
        }
        nsByHnId[matchedHnByWard.id].push({
          ...ns,
          headNurseId: matchedHnByWard.id,
          headNurseName: matchedHnByWard.name
        });
      } else {
        unassignedNs.push(ns);
      }
    }
  });

  return (
    <div className="bg-slate-950 text-white p-6 rounded-3xl border border-sky-900/60 shadow-2xl space-y-6 overflow-hidden">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sky-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-widest">
            <Sparkles size={15} />
            Institutional Governance & Command Structure
          </div>
          <h3 className="text-xl font-black text-white mt-0.5">
            5-Tier Hospital Nursing Hierarchy Tree
          </h3>
          <p className="text-xs text-slate-300">
            GCNS (General Chief Nursing Services) directs Chief Nursing Services (CNS) across 3 clinical categories, who oversee designated Head Nurses (HN), directing Nurse Supervisors (NS) and frontline Staff Nurses (SN) &amp; Medical Service Aids (MSA).
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-cyan-950/80 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-500/40 rounded-full">
            GCNS Authority: Hospital-Wide &amp; CNS
          </span>
          <span className="px-3 py-1 bg-purple-950/80 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/40 rounded-full">
            CNS Authority: Covers Same Division HNs
          </span>
          <span className="px-3 py-1 bg-amber-950/80 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/40 rounded-full">
            HN Authority: Ward Unit &amp; NS
          </span>
        </div>
      </div>

      {/* Signed In User Position Banner */}
      {currentUser && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/80 to-slate-900 border border-sky-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-black shrink-0 shadow-md">
              <UserCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border text-cyan-300 bg-cyan-950/90 border-cyan-500/40">
                  Active Account: {currentUser.name}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  Role: <strong className="text-white">{currentUser.jobTitle || currentUser.role}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Institutional Visibility: You can explore the complete hospital command tree, inspect all 5 tiers, and view clinical staffing distributions across wards.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              Assigned Category: <strong className="text-cyan-300">{userCategory}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Ward Category Scope Controls - Available to All Users */}
      <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-sky-900/60 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase text-cyan-400 mr-1 flex items-center gap-1.5">
            <Filter size={14} className="text-cyan-400" />
            Filter Hierarchy:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedCategoryFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Divisions ({allCnsUsers.length} CNS • {allHeadNurses.length} HNs)
          </button>
          {effectiveDivisions.map((div) => {
            const isSel = selectedCategoryFilter === div.name;
            const divHns = allHeadNurses.filter(h => (h.category || (h.wardId && wards.find(w => w.id === h.wardId)?.category) || 'Medical').toLowerCase() === div.name.toLowerCase());
            const theme = getDivisionTheme(div.colorTheme);
            return (
              <button
                key={div.id || div.name}
                type="button"
                onClick={() => setSelectedCategoryFilter(div.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  isSel
                    ? `${theme.btnBg} text-white shadow-md ring-2 ring-white/40`
                    : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {renderDivisionIcon(div.icon, isSel ? 'text-white' : theme.accent)}
                <span>{div.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSel ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {divHns.length} HNs
                </span>
              </button>
            );
          })}
          {isTopAdmin && (
            <button
              type="button"
              onClick={handleOpenAddDivisionModal}
              className="px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 shadow-sm cursor-pointer"
              title="Add New Clinical Division"
            >
              <FolderPlus size={13} className="text-emerald-400" />
              <span>+ Add Division</span>
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-bold">
          <span>Displaying <span className="font-black text-purple-300">{divisionsToDisplay.length} Divisions</span> • <span className="font-black text-cyan-300">{headNurses.length} HN</span> branches</span>
        </div>
      </div>

      {/* Dynamic Visual Flowchart Tree */}
      <div className="w-full overflow-x-auto py-6 px-2">
        <div className="min-w-[1750px] flex flex-col items-center select-none space-y-6">
          
          {/* LEVEL 1: GCNS (GENERAL CHIEF NURSING SERVICES) */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => setSelectedNodeDetails({
                tier: 'Level 1 - Top Administration (GCNS)',
                title: `GCNS - General Chief Nursing Services (${adminUser.name})`,
                description: 'Apex hospital nursing administrative authority. Oversees Chief Nursing Services (CNS) executives, clinical ward structures, and audits global hospital operations.',
                privileges: [
                  'Appoint and oversee Chief Nursing Services (CNS) & Head Nurses (HN)',
                  'Inspect & audit privilege matrices and compliance standards',
                  'Create, modify, and archive Hospital Wards and Categories',
                  'Assign executive category divisions and clinical resources',
                  'Oversee global schedules and manpower directories',
                  'No direct clinical shift edits'
                ],
                controlledBy: 'Hospital Board / Directorate',
                user: adminUser
              })}
              className="w-60 py-3.5 px-4 bg-gradient-to-b from-[#0e5071] to-[#0a3d56] hover:from-[#13648d] hover:to-[#0e5071] border-2 border-cyan-400/80 text-white rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-sky-950/80 flex flex-col items-center justify-center text-center transition transform active:scale-95 cursor-pointer ring-4 ring-cyan-500/20"
            >
              <div className="flex items-center gap-1.5 text-cyan-300 text-[10px] uppercase tracking-widest font-black mb-0.5">
                <Crown size={13} className="text-amber-400" /> Apex Nursing Authority
              </div>
              <div className="text-base font-black tracking-tight">{adminUser.name}</div>
              <span className="text-[10px] text-cyan-200/90 font-bold mt-0.5">GCNS (General Chief Nursing Services)</span>
              <span className="text-[9px] bg-cyan-900/90 text-cyan-200 px-2 py-0.5 rounded-full mt-1 border border-cyan-700">
                Oversees {cnsUsers.length} CNS &amp; {headNurses.length} HNs
              </span>
            </div>

            {/* GCNS Executive Control: Appoint CNS & Add New Division */}
            {isTopAdmin && (
              <div className="mt-2.5 z-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddCnsModal()}
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-purple-950/80 uppercase tracking-wider border border-purple-400/60 active:scale-95 cursor-pointer"
                >
                  <UserPlus size={14} /> + Appoint CNS
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddDivisionModal}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/80 uppercase tracking-wider border border-emerald-400/60 active:scale-95 cursor-pointer"
                >
                  <FolderPlus size={14} /> + Add New Division
                </button>
              </div>
            )}
            
            {/* Vertical Trunk Line from GCNS down */}
            <div className="w-1.5 h-8 bg-[#0e5071]" />
          </div>

          {/* LEVEL 2 & 3: CLINICAL DIVISIONS (EACH CNS COVERS SAME DIVISION & HEAD NURSES) */}
          <div className="w-full flex flex-col items-center">
            {/* Horizontal Crossbar from GCNS spanning Division branches */}
            {divisionsToDisplay.length > 1 ? (
              <div className="w-[85%] h-1.5 bg-[#0e5071] rounded-full relative">
                {divisionsToDisplay.map((_, idx) => {
                  const leftPos = `${(idx / (divisionsToDisplay.length - 1)) * 100}%`;
                  return (
                    <div 
                      key={idx} 
                      className="absolute top-0 w-1.5 h-6 bg-[#0e5071] -translate-x-1/2"
                      style={{ left: leftPos }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="w-1.5 h-6 bg-[#0e5071]" />
            )}

            {/* Division Subtree Columns Container */}
            <div className={`w-full flex ${divisionsToDisplay.length === 1 ? 'justify-center' : 'justify-around'} gap-8 pt-5 items-start`}>
              {divisionsToDisplay.map((division) => {
                const cns = allCnsUsers.find(c => (c.category || 'Medical').toLowerCase() === division.name.toLowerCase());
                // Head Nurses in this division
                const catHeadNurses = headNurses.filter(h => 
                  (cns && h.cnsId && h.cnsId === cns.id) ||
                  (h.category || (h.wardId && wards.find(w => w.id === h.wardId)?.category) || 'Medical').toLowerCase() === division.name.toLowerCase()
                );
                const isCurrentCns = currentUser && cns && (cns.id === currentUser.id || cns.email === currentUser.email || cns.name === currentUser.name);
                
                // Wards in this division
                const catWards = wards.filter(w => (w.category || 'Medical').toLowerCase() === division.name.toLowerCase());
                const catStaff = staff.filter(s => catWards.some(w => w.id === s.wardId));
                
                // DCNS under this specific CNS
                const dcnsListForCns = allDcnsUsers.filter(d => 
                  (cns && d.cnsId && d.cnsId === cns.id) ||
                  (!d.cnsId && (d.category || 'Medical').toLowerCase() === division.name.toLowerCase())
                );

                // Division styling theme
                const divisionTheme = getDivisionTheme(division.colorTheme);

                return (
                  <div 
                    key={division.id || division.name} 
                    className={`flex flex-col items-center flex-1 min-w-[540px] max-w-[850px] p-4 sm:p-5 rounded-3xl bg-gradient-to-b ${divisionTheme.bg} border-2 ${divisionTheme.border} shadow-2xl relative`}
                  >
                    {/* Division Header Banner */}
                    <div className="flex items-center justify-between w-full mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-md flex items-center gap-1.5 ${divisionTheme.badgeBg}`}>
                          {renderDivisionIcon(division.icon, 'w-3 h-3')}
                          {division.name} Division Subtree
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                          {catHeadNurses.length} HNs • {catWards.length} Nominated Units
                        </span>
                      </div>
                      {division.isCustom && isTopAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeletingDivision(division)}
                          className="px-2 py-1 text-rose-300 hover:text-rose-100 bg-rose-950/70 hover:bg-rose-900/90 rounded-lg border border-rose-800/60 text-[10px] font-black transition flex items-center gap-1 cursor-pointer"
                          title={`Delete ${division.name} Division`}
                        >
                          <Trash2 size={11} />
                          <span>Delete Division</span>
                        </button>
                      )}
                    </div>

                    {/* LEVEL 2: CHIEF NURSING SERVICES (CNS) NODE */}
                    <div className="w-full max-w-[340px] flex flex-col items-center">
                      {cns ? (
                        <div
                          onClick={() => setSelectedNodeDetails({
                            tier: 'Level 2 - Chief Nursing Services (CNS)',
                            title: `Chief Nursing Services - ${division.name} Division (${cns.name})`,
                            description: `Executive leader of ${division.name} Division. Directly commands and covers Head Nurses (HN) across all wards in this clinical division.`,
                            privileges: [
                              `Division Scope: ${division.name} Division`,
                              `Directly covers ${catHeadNurses.length} Head Nurses in ${division.name} Division`,
                              `Oversees ${catWards.length} Nominated Clinical Units (${catStaff.length} Staff)`,
                              'Reviews division-wide staffing allocations and off-duty metrics',
                              'Directs clinical standards and supervisory assignments',
                              'Reports directly to GCNS'
                            ],
                            controlledBy: 'GCNS (General Chief Nursing Services)',
                            user: cns
                          })}
                          className={`w-full py-3.5 px-4 ${
                            isCurrentCns
                              ? 'bg-gradient-to-b from-purple-900 to-indigo-950 border-2 border-purple-400 ring-4 ring-purple-400/30 shadow-2xl shadow-purple-500/20'
                              : `bg-gradient-to-b ${divisionTheme.cnsBg} border-2 ${divisionTheme.cnsBorder} shadow-lg`
                          } text-white rounded-2xl font-black text-xs text-center flex flex-col items-center justify-center transition cursor-pointer group relative`}
                        >
                          {isCurrentCns && (
                            <div className="absolute -top-3 px-2 py-0.5 bg-purple-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow-md flex items-center gap-1 border border-purple-300">
                              <Sparkles size={10} /> Your Profile (CNS)
                            </div>
                          )}
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                              isCurrentCns
                                ? 'bg-purple-500 text-white border-purple-300'
                                : 'text-purple-300 bg-purple-950/80 border-purple-500/40'
                            }`}>
                              Level 2: CNS
                            </span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${divisionTheme.badgeBg}`}>
                              {division.name} Division
                            </span>
                          </div>
                          
                          <div className="text-sm font-extrabold text-white group-hover:text-purple-200 transition">
                            {cns.name}
                          </div>
                          <div className="text-[10px] text-purple-200/90 font-mono mt-0.5">
                            {cns.jobTitle || `Chief Nursing Services (${division.name})`}
                          </div>

                          <div className="w-full mt-2.5 pt-2 border-t border-purple-800/60 flex items-center justify-between text-[10px]">
                            <span className="text-purple-300 font-bold flex items-center gap-1">
                              <ShieldCheck size={12} /> Covers {division.name} ({catHeadNurses.length} HNs)
                            </span>
                            <span className="text-slate-300 font-semibold">
                              {catWards.length} Units
                            </span>
                          </div>

                          {canEditCns && (
                            <div className="w-full mt-2 flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditCnsModal(cns);
                                }}
                                className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 shadow uppercase tracking-wider"
                              >
                                <Edit3 size={11} /> Edit CNS
                              </button>
                              {isTopAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingCns(cns);
                                  }}
                                  className="py-1.5 px-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 shadow uppercase tracking-wider"
                                  title={`Delete CNS ${cns.name}`}
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full py-4 px-4 bg-slate-900/90 border-2 border-dashed border-slate-700 hover:border-purple-400/60 rounded-2xl text-center flex flex-col items-center justify-center transition group shadow-md">
                          <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-700/50 text-purple-300 flex items-center justify-center mb-2">
                            <UserPlus size={18} />
                          </div>
                          <div className="text-xs font-black text-white">Chief Position Vacant</div>
                          <div className="text-[10px] text-slate-400 mb-2.5">No CNS appointed yet for {division.name}</div>
                          {isTopAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenAddCnsModal(division.name as WardCategory)}
                              className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow"
                            >
                              <UserPlus size={12} /> Appoint CNS ({division.name})
                            </button>
                          )}
                        </div>
                      )}

                      {/* Deputy Chief Nursing Services (DCNS) under this CNS */}
                      <div className="w-full mt-2.5 space-y-2">
                        {dcnsListForCns.map(dcns => {
                          const isCurrentDcns = currentUser && (dcns.id === currentUser.id || dcns.email === currentUser.email);
                          return (
                            <div 
                              key={dcns.id}
                              onClick={() => setSelectedNodeDetails({
                                tier: 'Level 2 - Deputy Chief Nursing Services (DCNS)',
                                title: `DCNS - Deputy Chief Nursing Services (${dcns.name})`,
                                description: `Deputy Executive Leader of ${division.name} Division under Chief ${cns?.name || 'Chief'}. Directs division clinical governance, duty swap reviews, and supervisory coordination.`,
                                privileges: [
                                  `Division Category: ${division.name}`,
                                  `Assisting Chief: ${cns?.name || 'Division Chief'} (${division.name} Division)`,
                                  'Supports division-wide staffing allocations and off-duty metrics',
                                  'Assists in clinical standards and HN coordination under CNS direction',
                                  'Authorized Duty Approver: ' + (dcns.isAuthorizedDutyApprover ? 'Yes (Division Swaps & Requests)' : 'No')
                                ],
                                controlledBy: `Chief Nursing Services (${cns?.name || 'Chief'}) & GCNS`,
                                user: dcns
                              })}
                              className={`w-full p-2.5 ${
                                isCurrentDcns
                                  ? 'bg-gradient-to-b from-indigo-900 to-indigo-950 border-2 border-indigo-400 ring-2 ring-indigo-400/40 shadow-indigo-900/50'
                                  : 'bg-indigo-950/85 hover:bg-indigo-900/80 border border-indigo-400/50'
                              } rounded-2xl text-left cursor-pointer transition shadow-md group relative`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-indigo-800 text-indigo-200 rounded border border-indigo-500/40">
                                    Level 2: DCNS
                                  </span>
                                  <span className="text-[9px] text-indigo-300 font-bold">
                                    Deputy Chief
                                  </span>
                                </div>
                                {dcns.licenseNumber && (
                                  <span className="text-[8px] font-mono text-indigo-300/80">
                                    {dcns.licenseNumber}
                                  </span>
                                )}
                              </div>

                              <div className="text-xs font-black text-white group-hover:text-indigo-200 transition truncate">
                                {dcns.name}
                              </div>
                              <div className="text-[9px] text-indigo-200/80 font-mono truncate">
                                {dcns.email}
                              </div>
                              <div className="text-[9px] text-indigo-300/90 font-medium truncate mt-0.5">
                                {dcns.jobTitle || `Deputy Chief (${division.name})`}
                              </div>

                              {/* GCNS Edit and Delete Actions */}
                              {isTopAdmin && (
                                <div className="mt-2 pt-1.5 border-t border-indigo-900/60 flex items-center justify-between gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditDcnsModal(dcns, cns);
                                    }}
                                    className="flex-1 py-1 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black transition flex items-center justify-center gap-1 uppercase tracking-wider shadow"
                                    title="Edit DCNS profile"
                                  >
                                    <Edit3 size={10} /> Edit DCNS
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingDcns(dcns);
                                    }}
                                    className="py-1 px-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded-lg text-[9px] font-black transition flex items-center justify-center gap-1 uppercase tracking-wider shadow"
                                    title={`Delete DCNS ${dcns.name}`}
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* GCNS "+ Add Deputy Chief (DCNS)" Button under this CNS */}
                        {isTopAdmin && cns && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddDcnsModal(cns);
                            }}
                            className="w-full py-2 px-3 bg-indigo-950/40 hover:bg-indigo-900/60 border border-dashed border-indigo-400/60 hover:border-indigo-300 text-indigo-200 rounded-2xl text-[10px] font-black transition flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm group"
                            title={`Add Deputy Chief (DCNS) under ${cns.name}`}
                          >
                            <UserPlus size={12} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                            <span>+ Add Deputy Chief (DCNS)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Vertical Trunk Line from CNS down to Head Nurses of this Division */}
                    <div className="w-1.5 h-6 bg-[#0e5071]" />

                    {/* LEVEL 3: HEAD NURSES (HN) OF THIS SAME DIVISION */}
                    <div className="w-full flex flex-col items-center">
                      {/* Horizontal Crossbar spanning this Division's Head Nurses */}
                      {catHeadNurses.length > 1 ? (
                        <div className="w-[85%] h-1.5 bg-[#0e5071] rounded-full relative">
                          {catHeadNurses.map((_, idx) => {
                            const leftPos = `${(idx / (catHeadNurses.length - 1)) * 100}%`;
                            return (
                              <div 
                                key={idx} 
                                className="absolute top-0 w-1.5 h-5 bg-[#0e5071] -translate-x-1/2"
                                style={{ left: leftPos }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="w-1.5 h-5 bg-[#0e5071]" />
                      )}

                      {/* Head Nurse Nodes Container for this Division */}
                      {catHeadNurses.length > 0 ? (
                        <div className={`w-full flex ${catHeadNurses.length === 1 ? 'justify-center' : 'justify-around'} gap-4 pt-4 items-start`}>
                          {catHeadNurses.map((hn) => {
                            const assignedWards = wards.filter(w => 
                              w.headNurseId === hn.id || 
                              (hn.assignedWardIds && hn.assignedWardIds.includes(w.id)) || 
                              w.id === hn.wardId
                            );
                            const assignedSupervisors = nsByHnId[hn.id] || nurseSupervisors.filter(ns => 
                              ns.headNurseId === hn.id || assignedWards.some(w => w.id === ns.wardId)
                            );
                            const allHnStaff = staff.filter(s => assignedWards.some(w => w.id === s.wardId));
                            const hnCategory = hn.category || (assignedWards[0] ? assignedWards[0].category : cns.category);
                            const isCurrentHn = currentUser && (hn.id === currentUser.id || hn.email === currentUser.email || hn.name === currentUser.name);

                            return (
                              <div key={hn.id} className="flex flex-col items-center flex-1 min-w-[260px] max-w-[360px]">
                                {/* Head Nurse Card */}
                                <div
                                  onClick={() => setSelectedNodeDetails({
                                    tier: 'Level 3 - Ward Unit In-Charge',
                                    title: `Head Nurse (${hn.name})`,
                                    description: `Appointed under ${hnCategory} category division (Supervising Chief: ${cns.name}) to oversee ${assignedWards.length} nominated hospital wards/units. Sole authority for AI shift roster generation, duty swap approval, and commands assigned Nurse Supervisors across all units.`,
                                    privileges: [
                                      `Clinical Category: ${hnCategory}`,
                                      `Nominated Wards (${assignedWards.length}): ${assignedWards.map(w => `${w.name} (${w.code})`).join(', ') || 'Unassigned'}`,
                                      `Supervising Chief: ${cns.name} (${cns.category})`,
                                      'Sole authority for AI Shift Roster generation across assigned wards',
                                      'Directs & assigns clinical tasks to Nurse Supervisors (NS)',
                                      'Approves or rejects duty swap and leave requests',
                                      'Publishes and locks final monthly duty rosters',
                                      'Supervises clinical bed allocations and staff rosters'
                                    ],
                                    controlledBy: `Chief Nursing Services (${cns.name})`,
                                    user: hn
                                  })}
                                  className={`w-full py-3 px-3.5 ${
                                    isCurrentHn 
                                      ? 'bg-gradient-to-b from-[#1b6288] to-[#0c405c] border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-2xl shadow-amber-500/20' 
                                      : 'bg-gradient-to-b from-[#0e5071] to-[#09364d] hover:from-[#146b97] hover:to-[#0e5071] border-2 border-cyan-500/50 shadow-lg'
                                  } text-white rounded-2xl font-black text-xs text-center flex flex-col items-center justify-center transition cursor-pointer group relative`}
                                >
                                  {isCurrentHn && (
                                    <div className="absolute -top-3 px-2 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-full shadow-md flex items-center gap-1 border border-amber-300">
                                      <Crown size={10} /> Your Command Unit
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between w-full mb-1">
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                      isCurrentHn
                                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                                        : 'text-amber-300 bg-amber-950/80 border-amber-500/30'
                                    }`}>
                                      Level 3: HN
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                        hnCategory === 'Excellency' 
                                          ? 'bg-purple-900/90 text-purple-200 border border-purple-500/50'
                                          : hnCategory === 'Surgical'
                                          ? 'bg-rose-900/90 text-rose-200 border border-rose-500/50'
                                          : 'bg-sky-900/90 text-sky-200 border border-sky-500/50'
                                      }`}>
                                        {hnCategory}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="text-sm font-extrabold text-white group-hover:text-cyan-200 transition">
                                    {hn.name}
                                  </div>
                                  <div className="text-[10px] text-cyan-200/80 font-mono mt-0.5">
                                    {hn.jobTitle || `Head Nurse (${hnCategory})`}
                                  </div>
                                  <div className="text-[8px] font-bold text-cyan-300/90 flex items-center justify-center gap-1 mt-0.5">
                                    <ShieldCheck size={10} className="text-cyan-400" />
                                    Under CNS {cns.name}
                                  </div>

                                  <div className="w-full mt-2 pt-1.5 border-t border-cyan-800/60 flex flex-col gap-1 text-[10px]">
                                    <div className="flex items-center justify-between">
                                      <span className="text-amber-300 font-bold flex items-center gap-1">
                                        <Building2 size={11} /> {assignedWards.length} Nominated Units
                                      </span>
                                      <span className="text-slate-300 font-semibold">
                                        {allHnStaff.length} Total Staff
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 justify-center mt-0.5">
                                      {assignedWards.map(w => (
                                        <span key={w.id} className="px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-700/60 rounded text-[8px] font-black">
                                          {w.code}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Trunk down to Nominated Wards/Units */}
                                <div className="w-1.5 h-5 bg-[#0e5071]" />

                                {/* NOMINATED WARDS/UNITS UNDER THIS HEAD NURSE (AT LEAST 2) */}
                                <div className="w-full flex flex-col items-center">
                                  {assignedWards.length > 1 && (
                                    <div className="w-[85%] h-1.5 bg-[#0e5071] rounded-full relative">
                                      {assignedWards.map((_, wIdx) => {
                                        const leftPos = `${(wIdx / (assignedWards.length - 1)) * 100}%`;
                                        return (
                                          <div 
                                            key={wIdx} 
                                            className="absolute top-0 w-1.5 h-4 bg-[#0e5071] -translate-x-1/2"
                                            style={{ left: leftPos }}
                                          />
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div className={`w-full flex ${assignedWards.length > 1 ? 'justify-between gap-2.5' : 'justify-center'} pt-2`}>
                                    {assignedWards.map((ward) => {
                                      const wardSupervisors = nurseSupervisors.filter(ns => 
                                        ns.wardId === ward.id || 
                                        ward.supervisorId === ns.id || 
                                        (ward.assignedNsIds && ward.assignedNsIds.includes(ns.id)) ||
                                        (assignedWards.length === 1 && ns.headNurseId === hn.id)
                                      );
                                      const wardStaffList = staff.filter(s => s.wardId === ward.id);
                                      const wardStaffSn = wardStaffList.filter(s => !s.isHa);
                                      const wardStaffHa = wardStaffList.filter(s => s.isHa);

                                      return (
                                        <div key={ward.id} className="flex flex-col items-center flex-1 min-w-[120px] max-w-[170px]">
                                          {/* Ward / Unit Node Header */}
                                          <div
                                            onClick={() => setSelectedNodeDetails({
                                              tier: 'Nominated Ward / Unit',
                                              title: `${ward.name} (${ward.code})`,
                                              description: `Clinical unit nominated under Head Nurse ${hn.name} in ${ward.category} Division (Supervising Chief: ${cns.name}). Directly operated by designated Nurse Supervisor(s) with dedicated frontline nursing staff.`,
                                              privileges: [
                                                `Ward Name: ${ward.name}`,
                                                `Ward Code: ${ward.code}`,
                                                `Clinical Division: ${ward.category}`,
                                                `Supervising Head Nurse: ${hn.name}`,
                                                `Supervisors: ${wardSupervisors.map(s => s.name).join(', ') || 'Unassigned'}`,
                                                `Frontline Staff: ${wardStaffSn.length} SN, ${wardStaffHa.length} MSA (${wardStaffList.length} Total)`
                                              ],
                                              controlledBy: `Head Nurse: ${hn.name}`
                                            })}
                                            className="w-full p-2 bg-gradient-to-b from-[#11405e] to-[#0a2c42] border border-cyan-400/50 hover:border-cyan-300 text-white rounded-xl text-center shadow-md cursor-pointer transition"
                                          >
                                            <div className="flex items-center justify-between mb-0.5">
                                              <span className="text-[8px] font-black text-cyan-300 uppercase tracking-wider">Unit</span>
                                              <span className="text-[8px] font-black text-amber-300 bg-amber-950/90 px-1 py-0.2 rounded border border-amber-500/40">
                                                {ward.code}
                                              </span>
                                            </div>
                                            <div className="text-[11px] font-black truncate text-white" title={ward.name}>
                                              {ward.name.split('(')[0].trim()}
                                            </div>
                                            <div className="text-[8px] text-cyan-300/80 font-bold">
                                              {ward.category}
                                            </div>
                                          </div>

                                          {/* Trunk down to Nurse Supervisors of this Ward */}
                                          <div className="w-1 h-2.5 bg-[#0e5071]" />

                                          {/* LEVEL 4: NURSE SUPERVISORS FOR THIS SPECIFIC WARD */}
                                          {wardSupervisors.length > 0 ? (
                                            <div className="w-full space-y-2">
                                              {wardSupervisors.map(ns => {
                                                const isCurrentNs = currentUser && (ns.id === currentUser.id || ns.email === currentUser.email || ns.name === currentUser.name);

                                                return (
                                                  <div key={ns.id} className="flex flex-col items-center w-full">
                                                    <div
                                                      onClick={() => setSelectedNodeDetails({
                                                        tier: 'Level 4 - Team Clinical Supervisor',
                                                        title: `Nurse Supervisor (${ns.name})`,
                                                        description: `Clinical team supervisor assigned to ${ward.name} (${ward.code}) under Head Nurse ${hn.name}. Directs frontline nursing shifts, handovers, and patient bed allocations.`,
                                                        privileges: [
                                                          `Directly Assigned Ward: ${ward.name} (${ward.code})`,
                                                          `Supervising Head Nurse: ${hn.name}`,
                                                          `Directly commands frontline Staff Nurses (SN) and Medical Service Aids (MSA) in ${ward.code}`,
                                                          'Conducts daily shift handover and clinical bed assignments',
                                                          'Escalates shift swaps and leave preferences to Head Nurse'
                                                        ],
                                                        controlledBy: `Head Nurse: ${hn.name}`,
                                                        user: ns
                                                      })}
                                                      className={`w-full p-2 ${
                                                        isCurrentNs
                                                          ? 'bg-gradient-to-b from-cyan-800 to-sky-950 border-2 border-cyan-300 ring-2 ring-cyan-400/40'
                                                          : 'bg-[#0e5071] hover:bg-[#156993] border border-cyan-400/40'
                                                      } text-white rounded-xl text-center shadow-md cursor-pointer transition`}
                                                    >
                                                      <div className="flex items-center justify-between w-full mb-0.5">
                                                        <span className="text-[7px] font-black text-cyan-300 uppercase">Level 4: NS</span>
                                                        <span className="text-[7px] font-black text-amber-300 bg-amber-950/90 px-1 py-0.2 rounded border border-amber-500/40">
                                                          {ward.code}
                                                        </span>
                                                      </div>
                                                      <div className="text-[11px] font-black truncate w-full text-white">
                                                        {ns.name}
                                                      </div>
                                                      <div className="text-[8px] text-cyan-200/80 truncate w-full">
                                                        {ns.jobTitle || 'Clinical Supervisor'}
                                                      </div>

                                                      {/* Reassign Quick Button for authorized roles (GCNS, DCNS, CNS, HN) */}
                                                      {canEditNsAssignment && (
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAssigningNsId(assigningNsId === ns.id ? null : ns.id);
                                                            setTargetHnId(ns.headNurseId || hn.id);
                                                            setTargetNsWardId(ns.wardId || ward.id);
                                                          }}
                                                          className="mt-1 px-1.5 py-0.5 bg-cyan-900 hover:bg-cyan-800 text-cyan-200 text-[8px] font-bold rounded flex items-center justify-center gap-1 w-full transition"
                                                          title="Assign / Change Ward & Head Nurse (Division Privileges)"
                                                        >
                                                          <ArrowRightLeft size={9} /> Reassign Ward/HN
                                                        </button>
                                                      )}
                                                    </div>

                                                    {/* Inline Reassignment Dropdown Popover */}
                                                    {assigningNsId === ns.id && (
                                                      <div 
                                                        onClick={(e) => e.stopPropagation()} 
                                                        className="mt-2 p-2.5 bg-slate-900 border border-cyan-500 rounded-xl shadow-2xl text-left z-20 w-52 space-y-2 animate-in fade-in"
                                                      >
                                                        <div>
                                                          <div className="text-[9px] font-bold text-amber-300">Directly Assigned Ward/Unit:</div>
                                                          <select
                                                            value={targetNsWardId}
                                                            onChange={(e) => {
                                                              const newWId = e.target.value;
                                                              setTargetNsWardId(newWId);
                                                              const matchingWard = wards.find(w => w.id === newWId);
                                                              const matchingHn = headNurses.find(h => h.id === matchingWard?.headNurseId || h.wardId === newWId);
                                                              if (matchingHn) {
                                                                setTargetHnId(matchingHn.id);
                                                              }
                                                            }}
                                                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] text-white outline-none font-bold mt-0.5"
                                                          >
                                                            {assignableWardsForReassign.map(w => (
                                                              <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                                                            ))}
                                                          </select>
                                                        </div>

                                                        <div>
                                                          <div className="text-[9px] font-bold text-cyan-300">Assign Head Nurse (HN):</div>
                                                          <select
                                                            value={targetHnId}
                                                            onChange={(e) => setTargetHnId(e.target.value)}
                                                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] text-white outline-none font-bold mt-0.5"
                                                          >
                                                            {assignableHnsForReassign.map(h => (
                                                              <option key={h.id} value={h.id}>{h.name}</option>
                                                            ))}
                                                          </select>
                                                        </div>

                                                        <div className="flex gap-1 pt-1">
                                                          <button
                                                            onClick={() => handleReassignHnAndWard(ns.id, targetHnId, targetNsWardId)}
                                                            className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black uppercase"
                                                          >
                                                            Save
                                                          </button>
                                                          <button
                                                            onClick={() => setAssigningNsId(null)}
                                                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[10px]"
                                                          >
                                                            ✕
                                                          </button>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="w-full p-1.5 bg-slate-900/80 border border-dashed border-cyan-800/80 rounded-lg text-center">
                                              <div className="text-[8px] text-amber-300 font-bold flex items-center justify-center gap-0.5">
                                                <AlertCircle size={9} /> No NS
                                              </div>
                                              {canEditNsAssignment && (
                                                <button
                                                  onClick={() => {
                                                    const unassigned = unassignedNs[0] || nurseSupervisors[0];
                                                    if (unassigned) {
                                                      handleReassignHnAndWard(unassigned.id, hn.id, ward.id);
                                                    }
                                                  }}
                                                  className="mt-1 px-1.5 py-0.5 bg-cyan-800 hover:bg-cyan-700 text-white rounded text-[8px] font-bold"
                                                >
                                                  + Assign NS
                                                </button>
                                              )}
                                            </div>
                                          )}

                                          {/* Trunk down to Level 5 Frontline Staff of this Ward */}
                                          <div className="w-1 h-2.5 bg-[#0e5071]" />

                                          {/* LEVEL 5: FRONTLINE STAFF NODES (SN & MSA) */}
                                          <div className="w-full flex justify-between gap-1">
                                            <div 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedNodeDetails({
                                                  tier: 'Level 5 - Front-Line Staff Nurse (SN)',
                                                  title: `Staff Nurses (SN) • ${ward.name} (${ward.code})`,
                                                  description: `Frontline clinical nursing staff assigned to ${ward.name} under Head Nurse ${hn.name}. Directly responsible for bedside care, clinical monitoring, shift routines, and duty swaps.`,
                                                  privileges: [
                                                    `Unit / Ward: ${ward.name} (${ward.code})`,
                                                    `Supervising Head Nurse: ${hn.name}`,
                                                    `Total Staff Nurses: ${wardStaffSn.length} nurses`,
                                                    'Access personalized digital Duty Card & roster',
                                                    'Submit peer-to-peer duty swap and cover requests',
                                                    'Execute clinical shift routines (Morning, Evening, Night)'
                                                  ],
                                                  controlledBy: `Head Nurse: ${hn.name}`
                                                });
                                              }}
                                              className="flex-1 py-1 bg-[#0e5071] hover:bg-cyan-700 text-cyan-100 text-[9px] font-black rounded text-center cursor-pointer transition shadow-xs" 
                                              title={`Staff Nurses in ${ward.code}`}
                                            >
                                              SN ({wardStaffSn.length})
                                            </div>
                                            <div 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedNodeDetails({
                                                  tier: 'Level 5 - Front-Line Medical Service Aid (MSA)',
                                                  title: `Medical Service Aids (MSA) • ${ward.name} (${ward.code})`,
                                                  description: `Frontline patient care support staff assigned to ${ward.name} under Head Nurse ${hn.name}. Assists with patient mobilization, hygiene, vital signs support, and logistical care.`,
                                                  privileges: [
                                                    `Unit / Ward: ${ward.name} (${ward.code})`,
                                                    `Supervising Head Nurse: ${hn.name}`,
                                                    `Total Medical Service Aids: ${wardStaffHa.length} aids`,
                                                    'Access personalized digital Duty Card & schedule',
                                                    'Dedicated patient hygiene and comfort care tasks'
                                                  ],
                                                  controlledBy: `Head Nurse: ${hn.name}`
                                                });
                                              }}
                                              className="flex-1 py-1 bg-[#093d56] hover:bg-amber-800 text-amber-200 text-[9px] font-black rounded text-center cursor-pointer transition shadow-xs" 
                                              title={`Medical Service Aids in ${ward.code}`}
                                            >
                                              MSA ({wardStaffHa.length})
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="w-full py-4 px-3 bg-slate-900/60 border border-dashed border-slate-700 rounded-2xl text-center text-slate-400 text-xs mt-3">
                          No Head Nurses currently nominated under this division.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* UNASSIGNED HEAD NURSES (IF ANY) */}
            {unassignedHns.length > 0 && (
              <div className="mt-8 flex flex-col items-center max-w-lg w-full">
                <div className="w-full py-3 px-4 bg-amber-950/70 border-2 border-amber-500/80 rounded-2xl text-center space-y-1 shadow-lg">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider">
                    <AlertCircle size={14} /> Unassigned Head Nurses
                  </div>
                  <div className="text-sm font-black text-white">
                    {unassignedHns.length} Head Nurses Not Assigned to Any Division CNS
                  </div>
                  <p className="text-[10px] text-amber-200/80">
                    Assign these Head Nurses to an executive division category.
                  </p>
                </div>
              </div>
            )}

            {/* UNASSIGNED NURSE SUPERVISORS (IF ANY) */}
            {unassignedNs.length > 0 && (
              <div className="mt-8 flex flex-col items-center max-w-lg w-full">
                <div className="w-full py-3 px-4 bg-amber-950/70 border-2 border-amber-500/80 rounded-2xl text-center space-y-1 shadow-lg">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider">
                    <AlertCircle size={14} /> Unassigned Nurse Supervisors
                  </div>
                  <div className="text-sm font-black text-white">
                    {unassignedNs.length} NS Pending HN Assignment
                  </div>
                  <p className="text-[10px] text-amber-200/80">
                    Assign these clinical supervisors to a designated Head Nurse.
                  </p>
                </div>

                <div className="w-1.5 h-6 bg-amber-600/80" />

                <div className="w-full space-y-2 pt-1">
                  {unassignedNs.map(ns => (
                    <div key={ns.id} className="p-2 bg-slate-900 border border-amber-600/60 rounded-xl flex items-center justify-between text-xs">
                      <div className="text-left">
                        <div className="font-bold text-white text-[11px]">{ns.name}</div>
                        <div className="text-[9px] text-amber-300 font-mono">Unassigned HN</div>
                      </div>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleReassignHn(ns.id, e.target.value);
                          }
                        }}
                        defaultValue=""
                        className="px-2 py-1 bg-amber-950 text-amber-200 border border-amber-500 rounded text-[10px] font-bold outline-none cursor-pointer"
                      >
                        <option value="" disabled>Assign HN...</option>
                        {headNurses.map(h => (
                          <option key={h.id} value={h.id}>Assign to {h.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Detail Modal / Flyout when a node is clicked */}
      {selectedNodeDetails && (
        <div className="p-5 bg-sky-950/80 border border-cyan-500/50 rounded-3xl space-y-4 animate-in fade-in duration-200 shadow-2xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-700 text-white rounded-xl flex items-center justify-center font-black">
                <ShieldCheck size={22} className="text-cyan-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {selectedNodeDetails.tier}
                </span>
                <h4 className="text-base font-black text-white mt-0.5 flex items-center gap-2">
                  {selectedNodeDetails.title}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setSelectedNodeDetails(null)}
              className="text-slate-400 hover:text-white font-bold text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">{selectedNodeDetails.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-black tracking-wider text-amber-400 flex items-center gap-1.5">
                <Crown size={13} /> Institutional Governance
              </div>
              <div className="text-xs font-bold text-slate-100">{selectedNodeDetails.controlledBy}</div>
              {selectedNodeDetails.user?.licenseNumber && (
                <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  License: <span className="text-white font-bold">{selectedNodeDetails.user.licenseNumber}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="text-[10px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Shield size={13} /> Core Role Authorities
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                {selectedNodeDetails.privileges.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action to edit or delete CNS if node is CNS */}
          {!isHeadNurseUser && selectedNodeDetails.user && (selectedNodeDetails.user.role === 'cns' || selectedNodeDetails.user.nurseDesignation === 'CNS') && (
            <div className="pt-2 border-t border-cyan-800/60 flex items-center justify-between gap-2">
              {isTopAdmin ? (
                <button
                  type="button"
                  onClick={() => setDeletingCns(selectedNodeDetails.user!)}
                  className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow uppercase tracking-wider"
                >
                  <Trash2 size={14} /> Delete CNS
                </button>
              ) : <div />}
              <button
                onClick={() => handleOpenEditCnsModal(selectedNodeDetails.user!)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg uppercase tracking-wider"
              >
                <Edit3 size={14} /> Edit CNS Profile & Division
              </button>
            </div>
          )}

          {/* Action to edit or delete DCNS if node is DCNS */}
          {isTopAdmin && selectedNodeDetails.user && (selectedNodeDetails.user.role === 'dcns' || selectedNodeDetails.user.nurseDesignation === 'DCNS') && (
            <div className="pt-3 border-t border-cyan-800/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDeletingDcns(selectedNodeDetails.user!)}
                className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow uppercase tracking-wider"
              >
                <Trash2 size={14} /> Delete DCNS
              </button>
              <button
                type="button"
                onClick={() => {
                  const parentCns = allCnsUsers.find(c => c.id === selectedNodeDetails.user?.cnsId) || allCnsUsers.find(c => c.category === selectedNodeDetails.user?.category);
                  handleOpenEditDcnsModal(selectedNodeDetails.user!, parentCns);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg uppercase tracking-wider"
              >
                <Edit3 size={14} /> Edit DCNS Profile
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: EDIT CHIEF NURSING SERVICES (CNS) IN HIERARCHY */}
      {editingCns && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white space-y-5 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-900/90 border border-purple-400/40 text-purple-200 flex items-center justify-center font-black">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Edit Chief Nursing Services (CNS)
                  </h3>
                  <p className="text-xs text-purple-300 font-medium">Level 2 Clinical Division Executive Leadership</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingCns(null)}
                className="text-slate-400 hover:text-white font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditCns} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-purple-300 mb-1">Executive Full Name</label>
                <input 
                  type="text" 
                  value={editCnsName} 
                  onChange={(e) => setEditCnsName(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-purple-300 mb-1">Registered Executive Email</label>
                <input 
                  type="email" 
                  value={editCnsEmail} 
                  onChange={(e) => setEditCnsEmail(e.target.value)}
                  placeholder="e.g. cns.eleanor@hospital.org"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-purple-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-purple-300 mb-1">Executive Job Title</label>
                <input 
                  type="text" 
                  value={editCnsJobTitle} 
                  onChange={(e) => setEditCnsJobTitle(e.target.value)}
                  placeholder="e.g. Chief Nursing Services (Excellency)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-purple-300 mb-1.5">
                  Clinical Category Division
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCnsCategory('Excellency');
                      if (!editCnsJobTitle || editCnsJobTitle.includes('Chief Nursing Services')) {
                        setEditCnsJobTitle('Chief Nursing Services (Excellency)');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                      editCnsCategory === 'Excellency'
                        ? 'bg-purple-900/80 border-purple-400 ring-2 ring-purple-400/30 text-purple-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-black text-xs">
                      <Sparkles size={12} className="text-purple-400 shrink-0" />
                      <span>Excellency</span>
                    </div>
                    <span className="text-[10px] text-purple-300/70 leading-tight">Critical / Specialty</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditCnsCategory('Medical');
                      if (!editCnsJobTitle || editCnsJobTitle.includes('Chief Nursing Services')) {
                        setEditCnsJobTitle('Chief Nursing Services (Medical)');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                      editCnsCategory === 'Medical'
                        ? 'bg-sky-900/80 border-sky-400 ring-2 ring-sky-400/30 text-sky-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-black text-xs">
                      <Stethoscope size={12} className="text-sky-400 shrink-0" />
                      <span>Medical</span>
                    </div>
                    <span className="text-[10px] text-sky-300/70 leading-tight">Internal Medicine</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditCnsCategory('Surgical');
                      if (!editCnsJobTitle || editCnsJobTitle.includes('Chief Nursing Services')) {
                        setEditCnsJobTitle('Chief Nursing Services (Surgical)');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                      editCnsCategory === 'Surgical'
                        ? 'bg-rose-900/80 border-rose-400 ring-2 ring-rose-400/30 text-rose-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-black text-xs">
                      <Activity size={12} className="text-rose-400 shrink-0" />
                      <span>Surgical</span>
                    </div>
                    <span className="text-[10px] text-rose-300/70 leading-tight">Operating / Post-Op</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-purple-300 mb-1">Nursing License No.</label>
                  <input 
                    type="text" 
                    value={editCnsLicenseNumber} 
                    onChange={(e) => setEditCnsLicenseNumber(e.target.value)}
                    placeholder="e.g. CNS-LIC-901"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-purple-300 mb-1">License Expiry Date</label>
                  <input 
                    type="date" 
                    value={editCnsLicenseExpiry} 
                    onChange={(e) => setEditCnsLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-medium text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-purple-300 mb-1">Direct Phone / Hospital Ext.</label>
                <input 
                  type="text" 
                  value={editCnsPhone} 
                  onChange={(e) => setEditCnsPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-4401"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                {isTopAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingCns(editingCns);
                    }}
                    className="py-3 px-4 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded-xl text-xs font-black uppercase transition flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Delete CNS
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCns(null)}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase shadow-lg flex items-center gap-1.5 transition"
                  >
                    <Save size={14} /> Save CNS Profile
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEPUTY CHIEF NURSING SERVICES (DCNS) UNDER CNS */}
      {showAddDcnsModal && targetCnsForAddDcns && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white space-y-5 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-900/90 border border-indigo-400/50 text-indigo-200 flex items-center justify-center font-black shadow-md">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Appoint Deputy Chief (DCNS)
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium">
                    Under Chief: <span className="text-white font-bold">{targetCnsForAddDcns.name}</span> • {targetCnsForAddDcns.category} Division
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowAddDcnsModal(false);
                  setTargetCnsForAddDcns(null);
                }}
                className="text-slate-400 hover:text-white font-bold text-lg p-1 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDcnsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-indigo-300 mb-1">Deputy Chief Full Name *</label>
                <input 
                  type="text" 
                  value={newDcnsName} 
                  onChange={(e) => setNewDcnsName(e.target.value)}
                  placeholder="e.g. Dr. Julian Vance, RN, MSN"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-indigo-300 mb-1">Executive Email Address *</label>
                <input 
                  type="email" 
                  value={newDcnsEmail} 
                  onChange={(e) => setNewDcnsEmail(e.target.value)}
                  placeholder={`e.g. julian.dcns.${(targetCnsForAddDcns.category || 'medical').toLowerCase()}@hospital.org`}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-indigo-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-indigo-300 mb-1">Official Job Title</label>
                <input 
                  type="text" 
                  value={newDcnsJobTitle} 
                  onChange={(e) => setNewDcnsJobTitle(e.target.value)}
                  placeholder="e.g. Deputy Chief Nursing Services (DCNS)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-indigo-300 mb-1.5">Division Category & Supervising CNS</label>
                <div className="p-3 bg-slate-950 border border-indigo-900/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{targetCnsForAddDcns.name}</span>
                    <span className="text-[10px] text-indigo-300">({targetCnsForAddDcns.category} Division)</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-900 text-indigo-200 rounded border border-indigo-700">
                    {targetCnsForAddDcns.category}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-indigo-300 mb-1">Nursing License No.</label>
                  <input 
                    type="text" 
                    value={newDcnsLicenseNumber} 
                    onChange={(e) => setNewDcnsLicenseNumber(e.target.value)}
                    placeholder="e.g. NUR-DCNS-7005"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-indigo-300 mb-1">License Expiry Date</label>
                  <input 
                    type="date" 
                    value={newDcnsLicenseExpiry} 
                    onChange={(e) => setNewDcnsLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-medium text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-indigo-300 mb-1">Direct Phone / Hospital Ext.</label>
                <input 
                  type="text" 
                  value={newDcnsPhone} 
                  onChange={(e) => setNewDcnsPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-7005"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-950/90 border border-indigo-900/60 rounded-xl">
                <input
                  type="checkbox"
                  id="newDcnsDutyApprover"
                  checked={newDcnsIsDutyApprover}
                  onChange={(e) => setNewDcnsIsDutyApprover(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-1 cursor-pointer"
                />
                <label htmlFor="newDcnsDutyApprover" className="text-xs font-semibold text-slate-200 cursor-pointer">
                  Authorized Off-Duty & Swap Approver for {targetCnsForAddDcns.category} Division
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDcnsModal(false);
                    setTargetCnsForAddDcns(null);
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase shadow-lg flex items-center justify-center gap-1.5 transition"
                >
                  <UserPlus size={14} /> Appoint DCNS Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DEPUTY CHIEF NURSING SERVICES (DCNS) IN HIERARCHY */}
      {editingDcns && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white space-y-5 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-900/90 border border-indigo-400/50 text-indigo-200 flex items-center justify-center font-black shadow-md">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Edit Deputy Chief (DCNS)
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium">Level 2 Clinical Division Executive Leadership</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingDcns(null)}
                className="text-slate-400 hover:text-white font-bold text-lg p-1 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditDcns} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-indigo-300 mb-1">Deputy Chief Full Name *</label>
                <input 
                  type="text" 
                  value={editDcnsName} 
                  onChange={(e) => setEditDcnsName(e.target.value)}
                  placeholder="e.g. Dr. Julian Vance, RN, MSN"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-indigo-300 mb-1">Registered Executive Email *</label>
                <input 
                  type="email" 
                  value={editDcnsEmail} 
                  onChange={(e) => setEditDcnsEmail(e.target.value)}
                  placeholder="e.g. dcns.julian@hospital.org"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-indigo-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-indigo-300 mb-1">Official Job Title</label>
                <input 
                  type="text" 
                  value={editDcnsJobTitle} 
                  onChange={(e) => setEditDcnsJobTitle(e.target.value)}
                  placeholder="e.g. Deputy Chief Nursing Services (DCNS)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-indigo-300 mb-1.5">Assigned Chief Nursing Services (CNS)</label>
                <select
                  value={editDcnsCnsId}
                  onChange={(e) => {
                    const selectedCnsId = e.target.value;
                    setEditDcnsCnsId(selectedCnsId);
                    const matchedCns = allCnsUsers.find(c => c.id === selectedCnsId);
                    if (matchedCns?.category) {
                      setEditDcnsCategory(matchedCns.category);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {allCnsUsers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Chief of {c.category || 'Division'} Division
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-indigo-300 mb-1">Nursing License No.</label>
                  <input 
                    type="text" 
                    value={editDcnsLicenseNumber} 
                    onChange={(e) => setEditDcnsLicenseNumber(e.target.value)}
                    placeholder="e.g. NUR-DCNS-7004"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-indigo-300 mb-1">License Expiry Date</label>
                  <input 
                    type="date" 
                    value={editDcnsLicenseExpiry} 
                    onChange={(e) => setEditDcnsLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-medium text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-indigo-300 mb-1">Direct Phone / Hospital Ext.</label>
                <input 
                  type="text" 
                  value={editDcnsPhone} 
                  onChange={(e) => setEditDcnsPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-7004"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-950/90 border border-indigo-900/60 rounded-xl">
                <input
                  type="checkbox"
                  id="editDcnsDutyApprover"
                  checked={editDcnsIsDutyApprover}
                  onChange={(e) => setEditDcnsIsDutyApprover(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-1 cursor-pointer"
                />
                <label htmlFor="editDcnsDutyApprover" className="text-xs font-semibold text-slate-200 cursor-pointer">
                  Authorized Off-Duty & Swap Approver for Division
                </label>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingDcns(editingDcns);
                  }}
                  className="py-3 px-4 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded-xl text-xs font-black uppercase transition flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Delete DCNS
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDcns(null)}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase shadow-lg flex items-center gap-1.5 transition"
                  >
                    <Save size={14} /> Save DCNS Profile
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE DCNS CONFIRMATION DIALOG */}
      {deletingDcns && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-white space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-11 h-11 rounded-2xl bg-rose-950/80 border border-rose-600/50 flex items-center justify-center font-black shrink-0">
                <AlertCircle size={22} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Deputy Chief (DCNS)</h3>
                <p className="text-xs text-rose-300 font-medium">Irreversible executive removal</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              Are you sure you want to remove <span className="text-white font-bold">{deletingDcns.name}</span> as Deputy Chief Nursing Services from the <span className="text-indigo-300 font-bold">{deletingDcns.category} Division</span>?
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeletingDcns(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDcns}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/40"
              >
                <Trash2 size={14} /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CHIEF NURSING SERVICES (CNS) */}
      {showAddCnsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white space-y-5 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-900/90 border border-purple-400/50 text-purple-200 flex items-center justify-center font-black shadow-md">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Appoint Chief Nursing Services (CNS)
                  </h3>
                  <p className="text-xs text-purple-300 font-medium">Level 2 Clinical Division Executive Leadership</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddCnsModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg p-1 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCnsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-purple-300 mb-1">Executive Full Name *</label>
                <input 
                  type="text" 
                  value={newCnsName} 
                  onChange={(e) => setNewCnsName(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance, DNP, RN"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-purple-300 mb-1">Registered Executive Email *</label>
                <input 
                  type="email" 
                  value={newCnsEmail} 
                  onChange={(e) => setNewCnsEmail(e.target.value)}
                  placeholder="e.g. cns.eleanor@hospital.org"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-purple-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-purple-300 mb-1.5">
                  Clinical Division Category *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCnsCategory('Excellency');
                      if (!newCnsJobTitle || newCnsJobTitle.includes('Chief Nursing Services')) {
                        setNewCnsJobTitle('Chief Nursing Services (Excellency)');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                      newCnsCategory === 'Excellency'
                        ? 'bg-purple-900/80 border-purple-400 ring-2 ring-purple-400/30 text-purple-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-black text-xs">
                      <Sparkles size={12} className="text-purple-400 shrink-0" />
                      <span>Excellency</span>
                    </div>
                    <span className="text-[10px] text-purple-300/70 leading-tight">Critical / Specialty</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewCnsCategory('Medical');
                      if (!newCnsJobTitle || newCnsJobTitle.includes('Chief Nursing Services')) {
                        setNewCnsJobTitle('Chief Nursing Services (Medical)');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                      newCnsCategory === 'Medical'
                        ? 'bg-sky-900/80 border-sky-400 ring-2 ring-sky-400/30 text-sky-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-black text-xs">
                      <Stethoscope size={12} className="text-sky-400 shrink-0" />
                      <span>Medical</span>
                    </div>
                    <span className="text-[10px] text-sky-300/70 leading-tight">Internal Medicine</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewCnsCategory('Surgical');
                      if (!newCnsJobTitle || newCnsJobTitle.includes('Chief Nursing Services')) {
                        setNewCnsJobTitle('Chief Nursing Services (Surgical)');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                      newCnsCategory === 'Surgical'
                        ? 'bg-rose-900/80 border-rose-400 ring-2 ring-rose-400/30 text-rose-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-black text-xs">
                      <Activity size={12} className="text-rose-400 shrink-0" />
                      <span>Surgical</span>
                    </div>
                    <span className="text-[10px] text-rose-300/70 leading-tight">Operating / Post-Op</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-purple-300 mb-1">Official Executive Job Title</label>
                <input 
                  type="text" 
                  value={newCnsJobTitle} 
                  onChange={(e) => setNewCnsJobTitle(e.target.value)}
                  placeholder="e.g. Chief Nursing Services (Medical)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-purple-300 mb-1">Nursing License No.</label>
                  <input 
                    type="text" 
                    value={newCnsLicenseNumber} 
                    onChange={(e) => setNewCnsLicenseNumber(e.target.value)}
                    placeholder="e.g. CNS-LIC-901"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-purple-300 mb-1">License Expiry Date</label>
                  <input 
                    type="date" 
                    value={newCnsLicenseExpiry} 
                    onChange={(e) => setNewCnsLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-medium text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-purple-300 mb-1">Direct Phone / Hospital Ext.</label>
                <input 
                  type="text" 
                  value={newCnsPhone} 
                  onChange={(e) => setNewCnsPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-4401"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-950/90 border border-purple-900/60 rounded-xl">
                <input
                  type="checkbox"
                  id="newCnsDutyApprover"
                  checked={newCnsIsDutyApprover}
                  onChange={(e) => setNewCnsIsDutyApprover(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500 focus:ring-1 cursor-pointer"
                />
                <label htmlFor="newCnsDutyApprover" className="text-xs font-semibold text-slate-200 cursor-pointer">
                  Authorized Duty Swap & Leave Approver for {newCnsCategory} Division
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCnsModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase shadow-lg flex items-center justify-center gap-1.5 transition"
                >
                  <UserPlus size={14} /> Appoint CNS Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CNS CONFIRMATION DIALOG */}
      {deletingCns && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-white space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-11 h-11 rounded-2xl bg-rose-950/80 border border-rose-600/50 flex items-center justify-center font-black shrink-0">
                <AlertCircle size={22} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Chief Nursing Services (CNS)</h3>
                <p className="text-xs text-rose-300 font-medium">Irreversible executive removal</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <p>
                Are you sure you want to remove <span className="text-white font-bold">{deletingCns.name}</span> as Chief Nursing Services for the <span className="text-purple-300 font-bold">{deletingCns.category} Division</span>?
              </p>
              <div className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40 flex items-start gap-1.5">
                <AlertCircle size={14} className="shrink-0 text-amber-400 mt-0.5" />
                <span>Removing this CNS unassigns this executive from the {deletingCns.category} Division governance. Head Nurses and DCNS in this division will remain active and can be covered by a newly appointed CNS.</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeletingCns(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCns}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/40"
              >
                <Trash2 size={14} /> Confirm Delete CNS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLINICAL DIVISION (GCNS) */}
      {showAddDivisionModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl text-white space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 flex items-center justify-center">
                  <FolderPlus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Create New Clinical Division</h3>
                  <p className="text-xs text-emerald-300">Expand the institutional hospital hierarchy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDivisionModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDivisionSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Division Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Care, Pediatrics, Oncology, Emergency"
                  value={newDivisionName}
                  onChange={(e) => setNewDivisionName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Intensive Care, High Dependency, and Resuscitation services"
                  value={newDivisionDesc}
                  onChange={(e) => setNewDivisionDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Visual Color Theme
                  </label>
                  <select
                    value={newDivisionColor}
                    onChange={(e) => setNewDivisionColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="emerald">Emerald (Green)</option>
                    <option value="sky">Sky (Blue)</option>
                    <option value="purple">Purple (Royal)</option>
                    <option value="rose">Rose (Red/Pink)</option>
                    <option value="amber">Amber (Orange)</option>
                    <option value="teal">Teal (Cyan)</option>
                    <option value="indigo">Indigo (Deep Purple)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Division Icon
                  </label>
                  <select
                    value={newDivisionIcon}
                    onChange={(e) => setNewDivisionIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="Activity">Pulse / Activity</option>
                    <option value="Stethoscope">Stethoscope</option>
                    <option value="Heart">Heart / Cardiac</option>
                    <option value="Shield">Shield / Safety</option>
                    <option value="Sparkles">Sparkles / Excellence</option>
                    <option value="Building">Building / Facility</option>
                    <option value="Briefcase">Briefcase / Clinical</option>
                  </select>
                </div>
              </div>

              {/* Theme Preview */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Badge Preview:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-md flex items-center gap-1.5 ${getDivisionTheme(newDivisionColor).badgeBg}`}>
                  {renderDivisionIcon(newDivisionIcon, 'w-3 h-3')}
                  <span>{newDivisionName.trim() || 'Sample Division'}</span>
                </span>
              </div>

              {/* Optional: Appoint CNS Immediately */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={newDivisionAppointCns}
                    onChange={(e) => setNewDivisionAppointCns(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-400"
                  />
                  <span className="text-xs font-bold text-emerald-300">
                    Appoint Chief Nursing Services (CNS) immediately for this division
                  </span>
                </label>

                {newDivisionAppointCns && (
                  <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-2xl space-y-3 mt-2 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        CNS Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Eleanor Vance, RN, MSN"
                        value={newDivCnsName}
                        onChange={(e) => setNewDivCnsName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        CNS Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. eleanor.vance@hospital.org"
                        value={newDivCnsEmail}
                        onChange={(e) => setNewDivCnsEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">
                          License Number
                        </label>
                        <input
                          type="text"
                          value={newDivCnsLicense}
                          onChange={(e) => setNewDivCnsLicense(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">
                          License Expiry
                        </label>
                        <input
                          type="date"
                          value={newDivCnsExpiry}
                          onChange={(e) => setNewDivCnsExpiry(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDivisionModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/40 cursor-pointer"
                >
                  <FolderPlus size={14} /> Create Division
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE DIVISION CONFIRMATION (GCNS) */}
      {deletingDivision && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-white space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-11 h-11 rounded-2xl bg-rose-950/80 border border-rose-600/50 flex items-center justify-center font-black shrink-0">
                <AlertCircle size={22} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Clinical Division</h3>
                <p className="text-xs text-rose-300 font-medium">Remove division from hierarchy</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <p>
                Are you sure you want to remove the <span className="text-rose-300 font-bold">{deletingDivision.name} Division</span>?
              </p>
              <div className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40 flex items-start gap-1.5">
                <AlertCircle size={14} className="shrink-0 text-amber-400 mt-0.5" />
                <span>Existing wards and staff members assigned to this division will remain intact in the system.</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeletingDivision(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDivision}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/40 cursor-pointer"
              >
                <Trash2 size={14} /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
