import React, { useState, useMemo } from 'react';
import { WardInfo, WardCategory, UserAccount, StaffMember, UserRole, ClinicalDivision, DEFAULT_DIVISIONS } from '../types';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  UserPlus, 
  Crown, 
  Hospital, 
  Search,
  ArrowRightLeft, 
  Mail, 
  KeyRound, 
  Lock, 
  Phone, 
  Eye, 
  Copy, 
  Check, 
  Grid, 
  List, 
  Filter, 
  X, 
  Sparkles, 
  UserCheck, 
  Briefcase, 
  Calendar, 
  Award, 
  Info, 
  ChevronRight, 
  Sliders, 
  CheckSquare, 
  XCircle, 
  FileText, 
  Clock, 
  Shield,
  Layers,
  CheckCheck,
  AlertCircle,
  Save,
  Stethoscope,
  Activity,
  CreditCard,
  Printer,
  FolderPlus
} from 'lucide-react';
import { HierarchyChart } from './HierarchyChart';
import { StaffLicenseCardModal } from './StaffLicenseCardModal';
import { ManpowerSummaryPrintModal } from './ManpowerSummaryPrintModal';

interface WardAdminManagerProps {
  wards: WardInfo[];
  users: UserAccount[];
  staff: StaffMember[];
  divisions?: ClinicalDivision[];
  onCreateDivision?: (division: Omit<ClinicalDivision, 'id' | 'createdAt'>) => void;
  onDeleteDivision?: (id: string) => void;
  activeWardId: string;
  onSelectWard: (wardId: string) => void;
  onCreateWard: (ward: Omit<WardInfo, 'id'>) => void;
  onUpdateWard: (id: string, updates: Partial<WardInfo>) => void;
  onDeleteWard: (id: string) => void;
  onCreateUser: (user: Omit<UserAccount, 'id'>) => void;
  onUpdateUser: (id: string, updates: Partial<UserAccount>) => void;
  onDeleteUser: (id: string) => void;
  onUpdateStaff?: (id: string, updates: Partial<StaffMember>) => void;
  onAssignHeadNurseToSupervisors?: (supervisorIds: string[], headNurseId: string) => void;
  currentUserRole: UserRole;
  currentUser?: UserAccount;
  onNavigateToCalendar?: () => void;
}

export const WardAdminManager: React.FC<WardAdminManagerProps> = ({
  wards,
  users,
  staff,
  divisions,
  onCreateDivision,
  onDeleteDivision,
  activeWardId,
  onSelectWard,
  onCreateWard,
  onUpdateWard,
  onDeleteWard,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateStaff,
  onAssignHeadNurseToSupervisors,
  currentUserRole,
  currentUser,
  onNavigateToCalendar
}) => {
  // Determine if logged-in user is a GCNS, DCNS, CNS, or Head Nurse account
  const isDcnsLoggedIn = currentUserRole === 'dcns' || currentUser?.role === 'dcns' || currentUser?.nurseDesignation === 'DCNS';
  const isCnsLoggedIn = currentUserRole === 'cns' || currentUser?.role === 'cns' || currentUser?.nurseDesignation === 'CNS' || isDcnsLoggedIn;
  const isHnLoggedIn = currentUserRole === 'head_nurse' || currentUserRole === 'ward_supervisor' || currentUser?.role === 'head_nurse' || currentUser?.role === 'ward_supervisor' || currentUser?.nurseDesignation === 'HN';
  const isTopAdmin = currentUserRole === 'admin' || currentUser?.role === 'admin' || currentUser?.nurseDesignation === 'GCNS';
  const canManageGovernance = isTopAdmin || isCnsLoggedIn || isHnLoggedIn;
  const canEditNsAssignment = isTopAdmin || isCnsLoggedIn || isHnLoggedIn;

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
          isCustom: false
        });
      }
    });
    return list;
  }, [divisions, wards, users]);

  // Division theme helper
  const getDivisionTheme = (themeName?: string) => {
    switch (themeName?.toLowerCase()) {
      case 'emerald':
        return {
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          activePill: 'bg-emerald-700 text-white ring-2 ring-emerald-300',
          inactivePill: 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100',
          iconColor: 'text-emerald-600',
          avatarBg: 'bg-emerald-600 ring-2 ring-emerald-400/30',
          buttonBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50 text-emerald-900',
        };
      case 'purple':
      case 'royal':
      case 'excellency':
        return {
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
          activePill: 'bg-purple-700 text-white ring-2 ring-purple-300',
          inactivePill: 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100',
          iconColor: 'text-purple-600',
          avatarBg: 'bg-purple-600 ring-2 ring-purple-400/30',
          buttonBorder: 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50 text-purple-900',
        };
      case 'rose':
      case 'surgical':
        return {
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
          activePill: 'bg-rose-700 text-white ring-2 ring-rose-300',
          inactivePill: 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100',
          iconColor: 'text-rose-600',
          avatarBg: 'bg-rose-600 ring-2 ring-rose-400/30',
          buttonBorder: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50 text-rose-900',
        };
      case 'amber':
      case 'orange':
        return {
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          activePill: 'bg-amber-700 text-white ring-2 ring-amber-300',
          inactivePill: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
          iconColor: 'text-amber-600',
          avatarBg: 'bg-amber-600 ring-2 ring-amber-400/30',
          buttonBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50 text-amber-900',
        };
      case 'teal':
      case 'cyan':
        return {
          badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
          activePill: 'bg-teal-700 text-white ring-2 ring-teal-300',
          inactivePill: 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100',
          iconColor: 'text-teal-600',
          avatarBg: 'bg-teal-600 ring-2 ring-teal-400/30',
          buttonBorder: 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50 text-teal-900',
        };
      case 'indigo':
        return {
          badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          activePill: 'bg-indigo-700 text-white ring-2 ring-indigo-300',
          inactivePill: 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100',
          iconColor: 'text-indigo-600',
          avatarBg: 'bg-indigo-600 ring-2 ring-indigo-400/30',
          buttonBorder: 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50 text-indigo-900',
        };
      case 'sky':
      case 'medical':
      default:
        return {
          badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
          activePill: 'bg-sky-700 text-white ring-2 ring-sky-300',
          inactivePill: 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100',
          iconColor: 'text-sky-600',
          avatarBg: 'bg-sky-600 ring-2 ring-sky-400/30',
          buttonBorder: 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50 text-sky-900',
        };
    }
  };

  // Division icon helper
  const renderDivisionIcon = (iconName?: string, className: string = 'w-3.5 h-3.5') => {
    switch (iconName?.toLowerCase()) {
      case 'activity':
      case 'pulse':
        return <Activity className={className} />;
      case 'sparkles':
      case 'excellence':
        return <Sparkles className={className} />;
      case 'heart':
        return <Activity className={className} />;
      case 'shield':
        return <ShieldCheck className={className} />;
      case 'building':
        return <Building2 className={className} />;
      case 'briefcase':
        return <Briefcase className={className} />;
      case 'stethoscope':
      default:
        return <Stethoscope className={className} />;
    }
  };

  const [activeTab, setActiveTab] = useState<'wards' | 'supervisors' | 'ns_assignment' | 'manpower' | 'hierarchy'>(() => isHnLoggedIn ? 'wards' : 'supervisors');
  
  // New Ward Form State
  const [showNewWardModal, setShowNewWardModal] = useState(false);
  const [newWardName, setNewWardName] = useState('');
  const [newWardCode, setNewWardCode] = useState('');
  const [newWardCategory, setNewWardCategory] = useState<WardCategory>('Medical');
  const [newWardDesc, setNewWardDesc] = useState('');
  const [newWardSupervisorId, setNewWardSupervisorId] = useState('');
  const [wardCategoryFilter, setWardCategoryFilter] = useState<'all' | WardCategory>('all');
  const [nsWardCategoryFilter, setNsWardCategoryFilter] = useState<'all' | WardCategory>('all');
  const [manpowerCategoryFilter, setManpowerCategoryFilter] = useState<'all' | WardCategory>('all');

  // New Head Nurse (HN) Form State & Privilege Inspector State
  const [showNewWsModal, setShowNewWsModal] = useState(false);
  const [selectedHnForPrivileges, setSelectedHnForPrivileges] = useState<UserAccount | null>(null);
  const [newWsName, setNewWsName] = useState('');
  const [newWsEmail, setNewWsEmail] = useState('');
  const [newWsCategory, setNewWsCategory] = useState<WardCategory>('Medical');
  const [newWsLicenseNumber, setNewWsLicenseNumber] = useState('');
  const [newWsLicenseExpiry, setNewWsLicenseExpiry] = useState('');
  const [newWsWardId, setNewWsWardId] = useState(activeWardId);
  const [hnCategoryFilter, setHnCategoryFilter] = useState<'all' | WardCategory>('all');

  // New Nurse Supervisor (NS) Form State
  const [showNewNsModal, setShowNewNsModal] = useState(false);
  const [newNsName, setNewNsName] = useState('');
  const [newNsEmail, setNewNsEmail] = useState('');
  const [newNsWardId, setNewNsWardId] = useState(activeWardId);
  const [newNsHeadNurseId, setNewNsHeadNurseId] = useState('');
  const [newNsJobTitle, setNewNsJobTitle] = useState('Nurse Supervisor (NS)');
  const [newNsLicenseNumber, setNewNsLicenseNumber] = useState('');
  const [newNsLicenseExpiry, setNewNsLicenseExpiry] = useState('');

  // Nurse Supervisor Assignment Modal for Specific HN
  const [hnModalForNsAssignment, setHnModalForNsAssignment] = useState<UserAccount | null>(null);
  const [selectedNsIdsInHnModal, setSelectedNsIdsInHnModal] = useState<string[]>([]);
  const [hnModalSearch, setHnModalSearch] = useState<string>('');

  // Nurse Supervisor Direct Ward Assignment Modal
  const [wardModalForNsAssignment, setWardModalForNsAssignment] = useState<WardInfo | null>(null);
  const [selectedNsIdsInWardModal, setSelectedNsIdsInWardModal] = useState<string[]>([]);

  // Bulk Selection & Assignment State in NS Assignment Tab
  const [selectedNsIds, setSelectedNsIds] = useState<string[]>([]);
  const [bulkTargetWardId, setBulkTargetWardId] = useState<string>('');
  const [bulkTargetHnId, setBulkTargetHnId] = useState<string>('');
  const [nsFilterWardId, setNsFilterWardId] = useState<string>('all');
  const [nsFilterHnId, setNsFilterHnId] = useState<string>('all');
  const [nsViewMode, setNsViewMode] = useState<'ward' | 'bento' | 'table'>('ward');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Manpower Details & Filter State
  const [manpowerFilterWardId, setManpowerFilterWardId] = useState<string>('all');
  const [manpowerRankFilter, setManpowerRankFilter] = useState<'all' | 'senior' | 'junior' | 'ha' | 'ws'>('all');
  const [manpowerViewMode, setManpowerViewMode] = useState<'table' | 'grid'>('table');
  const [selectedStaffDetails, setSelectedStaffDetails] = useState<StaffMember | null>(null);
  const [licenseCardModalStaff, setLicenseCardModalStaff] = useState<StaffMember | null>(null);
  const [showManpowerPrintModal, setShowManpowerPrintModal] = useState<boolean>(false);

  // Edit Ward Modal State
  const [editingWard, setEditingWard] = useState<WardInfo | null>(null);
  const [editWardName, setEditWardName] = useState<string>('');
  const [editWardCode, setEditWardCode] = useState<string>('');
  const [editWardCategory, setEditWardCategory] = useState<WardCategory>('Medical');
  const [editWardDesc, setEditWardDesc] = useState<string>('');
  const [editWardSupervisorId, setEditWardSupervisorId] = useState<string>('');

  // Ward Category Badge Renderer
  const renderWardCategoryBadge = (category?: WardCategory, size: 'sm' | 'md' = 'sm') => {
    const catName = category || 'Medical';
    const foundDiv = effectiveDivisions.find(d => d.name.toLowerCase() === catName.toLowerCase());
    const theme = getDivisionTheme(foundDiv?.colorTheme || (catName === 'Excellency' ? 'purple' : catName === 'Surgical' ? 'rose' : 'sky'));
    const iconName = foundDiv?.icon || (catName === 'Excellency' ? 'Sparkles' : catName === 'Surgical' ? 'Activity' : 'Stethoscope');

    return (
      <span className={`inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-md ${
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[11px]'
      } ${theme.badgeBg} shadow-xs`}>
        {renderDivisionIcon(iconName, size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')}
        {catName}
      </span>
    );
  };

  // Edit Head Nurse (HN) Modal State
  const [editingHn, setEditingHn] = useState<UserAccount | null>(null);
  const [editHnName, setEditHnName] = useState<string>('');
  const [editHnEmail, setEditHnEmail] = useState<string>('');
  const [editHnCategory, setEditHnCategory] = useState<WardCategory>('Medical');
  const [editHnWardId, setEditHnWardId] = useState<string>('');
  const [editHnJobTitle, setEditHnJobTitle] = useState<string>('');
  const [editHnLicenseNumber, setEditHnLicenseNumber] = useState<string>('');
  const [editHnLicenseExpiry, setEditHnLicenseExpiry] = useState<string>('');
  const [editHnPhone, setEditHnPhone] = useState<string>('');
  const [editHnIsDutyApprover, setEditHnIsDutyApprover] = useState<boolean>(true);

  // Edit Chief Nursing Services (CNS) Modal State
  const [editingCns, setEditingCns] = useState<UserAccount | null>(null);
  const [editCnsName, setEditCnsName] = useState<string>('');
  const [editCnsEmail, setEditCnsEmail] = useState<string>('');
  const [editCnsCategory, setEditCnsCategory] = useState<WardCategory>('Medical');
  const [editCnsJobTitle, setEditCnsJobTitle] = useState<string>('');
  const [editCnsLicenseNumber, setEditCnsLicenseNumber] = useState<string>('');
  const [editCnsLicenseExpiry, setEditCnsLicenseExpiry] = useState<string>('');
  const [editCnsPhone, setEditCnsPhone] = useState<string>('');
  const [editCnsIsDutyApprover, setEditCnsIsDutyApprover] = useState<boolean>(true);

  // Add Chief Nursing Services (CNS) Modal State (GCNS)
  const [showNewCnsModal, setShowNewCnsModal] = useState<boolean>(false);
  const [newCnsName, setNewCnsName] = useState<string>('');
  const [newCnsEmail, setNewCnsEmail] = useState<string>('');
  const [newCnsCategory, setNewCnsCategory] = useState<WardCategory>('Medical');
  const [newCnsJobTitle, setNewCnsJobTitle] = useState<string>('Chief Nursing Services (Medical)');
  const [newCnsLicenseNumber, setNewCnsLicenseNumber] = useState<string>('');
  const [newCnsLicenseExpiry, setNewCnsLicenseExpiry] = useState<string>('2028-12-31');
  const [newCnsPhone, setNewCnsPhone] = useState<string>('');
  const [newCnsIsDutyApprover, setNewCnsIsDutyApprover] = useState<boolean>(true);

  // Delete Chief Nursing Services (CNS) Confirmation State (GCNS)
  const [deletingCns, setDeletingCns] = useState<UserAccount | null>(null);

  // Add Clinical Division Modal State (GCNS)
  const [showAddDivisionModal, setShowAddDivisionModal] = useState<boolean>(false);
  const [newDivisionName, setNewDivisionName] = useState<string>('');
  const [newDivisionDesc, setNewDivisionDesc] = useState<string>('');
  const [newDivisionColor, setNewDivisionColor] = useState<string>('emerald');
  const [newDivisionIcon, setNewDivisionIcon] = useState<string>('Activity');
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
    const trimmed = newDivisionName.trim();
    if (onCreateDivision) {
      onCreateDivision({
        name: trimmed,
        description: newDivisionDesc.trim() || `${trimmed} Clinical Services Directorate`,
        colorTheme: newDivisionColor,
        icon: newDivisionIcon
      });
    }

    if (newDivisionAppointCns && newDivCnsName.trim() && newDivCnsEmail.trim()) {
      onCreateUser({
        name: newDivCnsName.trim(),
        email: newDivCnsEmail.trim().toLowerCase(),
        role: 'cns',
        nurseDesignation: 'CNS',
        category: trimmed,
        jobTitle: `Chief Nursing Services (${trimmed})`,
        licenseNumber: newDivCnsLicense.trim() || `CNS-LIC-${Math.floor(1000 + Math.random() * 9000)}`,
        licenseExpiry: newDivCnsExpiry || '2028-12-31',
        isAuthorizedDutyApprover: true
      });
    }

    triggerFeedback(`Created new clinical division: ${trimmed}`);
    setShowAddDivisionModal(false);
  };

  const handleConfirmDeleteDivision = () => {
    if (!deletingDivision) return;
    if (onDeleteDivision) {
      onDeleteDivision(deletingDivision.id);
    }
    triggerFeedback(`Removed clinical division: ${deletingDivision.name}`);
    setDeletingDivision(null);
  };

  // Edit Nurse Supervisor (NS) Modal State
  const [editingNs, setEditingNs] = useState<UserAccount | null>(null);
  const [editNsName, setEditNsName] = useState<string>('');
  const [editNsEmail, setEditNsEmail] = useState<string>('');
  const [editNsWardId, setEditNsWardId] = useState<string>('');
  const [editNsHeadNurseId, setEditNsHeadNurseId] = useState<string>('');
  const [editNsJobTitle, setEditNsJobTitle] = useState<string>('');
  const [editNsLicenseNumber, setEditNsLicenseNumber] = useState<string>('');
  const [editNsLicenseExpiry, setEditNsLicenseExpiry] = useState<string>('');
  const [editNsPhone, setEditNsPhone] = useState<string>('');
  const [editNsIsDutyApprover, setEditNsIsDutyApprover] = useState<boolean>(true);

  // Trigger feedback flash message
  const triggerFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleOpenStaffDetails = (s: StaffMember) => {
    setSelectedStaffDetails(s);
  };

  // Clipboard copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filter Chief Nursing Services (CNS) - Hidden in HN account; If logged in as CNS, hide other CNS info and strictly show own profile
  const cnsUsers = useMemo(() => {
    if (isHnLoggedIn) return [];
    const all = users.filter(u => u.role === 'cns' || u.nurseDesignation === 'CNS');
    if (isCnsLoggedIn && currentUser) {
      return all.filter(cns => cns.id === currentUser.id || cns.email === currentUser.email || (currentUser.category && cns.category === currentUser.category));
    }
    return all;
  }, [users, isCnsLoggedIn, isHnLoggedIn, currentUser]);

  // Filter Head Nurses (HN)
  const headNurseUsers = useMemo(() => {
    return users.filter(u => u.role === 'head_nurse' || u.role === 'ward_supervisor' || u.nurseDesignation === 'HN');
  }, [users]);

  // Filter Nurse Supervisors (NS)
  const nurseSupervisorUsers = useMemo(() => {
    return users.filter(u => u.role === 'nurse_supervisor' || u.nurseDesignation === 'NS');
  }, [users]);

  // User's Effective Division Category
  const userDivisionCategory: WardCategory = useMemo(() => {
    if (currentUser?.category) return currentUser.category;
    if (currentUser?.wardId) {
      const matchedWard = wards.find(w => w.id === currentUser.wardId);
      if (matchedWard?.category) return matchedWard.category;
    }
    return 'Medical';
  }, [currentUser, wards]);

  // Wards / Units that the logged-in user is authorized to assign NS to:
  // GCNS: Hospital-wide (all wards across all divisions)
  // CNS: All wards / units in his/her following division
  // HN: His/her following ward / unit & division units
  const assignableWardsForNs = useMemo(() => {
    if (!currentUser) return wards;
    if (currentUserRole === 'admin' || currentUser.role === 'admin') {
      return wards;
    }
    if (isCnsLoggedIn) {
      const cnsCat = currentUser.category || userDivisionCategory;
      return wards.filter(w => (w.category || 'Medical') === cnsCat);
    }
    if (isHnLoggedIn) {
      const hnWardId = currentUser.wardId;
      const hnCat = currentUser.category || userDivisionCategory;
      const divisionWards = wards.filter(w => (w.category || 'Medical') === hnCat);
      if (hnWardId) {
        const ownWard = wards.find(w => w.id === hnWardId);
        const otherDivisionWards = divisionWards.filter(w => w.id !== hnWardId);
        return ownWard ? [ownWard, ...otherDivisionWards] : (divisionWards.length > 0 ? divisionWards : wards);
      }
      return divisionWards.length > 0 ? divisionWards : wards;
    }
    return wards;
  }, [wards, currentUser, currentUserRole, isCnsLoggedIn, isHnLoggedIn, userDivisionCategory]);

  // Head Nurses that the logged-in user can assign NS to:
  // GCNS: All Head Nurses
  // CNS: Head Nurses in his/her division
  // HN: Primarily themselves or other HNs in the same division
  const assignableHnsForNs = useMemo(() => {
    if (!currentUser) return headNurseUsers;
    if (currentUserRole === 'admin' || currentUser.role === 'admin') {
      return headNurseUsers;
    }
    if (isCnsLoggedIn) {
      const cnsCat = currentUser.category || userDivisionCategory;
      return headNurseUsers.filter(h => {
        const hCat = h.category || (h.wardId ? wards.find(w => w.id === h.wardId)?.category : undefined) || 'Medical';
        return hCat === cnsCat;
      });
    }
    if (isHnLoggedIn) {
      const hnCat = currentUser.category || userDivisionCategory;
      const self = headNurseUsers.filter(h => h.id === currentUser.id || h.email === currentUser.email);
      const divisionHns = headNurseUsers.filter(h => {
        const hCat = h.category || (h.wardId ? wards.find(w => w.id === h.wardId)?.category : undefined) || 'Medical';
        return hCat === hnCat && h.id !== currentUser.id && h.email !== currentUser.email;
      });
      return self.length > 0 ? [...self, ...divisionHns] : (divisionHns.length > 0 ? divisionHns : headNurseUsers);
    }
    return headNurseUsers;
  }, [headNurseUsers, wards, currentUser, currentUserRole, isCnsLoggedIn, isHnLoggedIn, userDivisionCategory]);

  // Nurse Supervisors visible and assignable:
  // GCNS: All NS
  // CNS: NS in CNS's division or unassigned
  // HN: NS in HN's ward, supervised by HN, in division, or unassigned
  const assignableNsUsers = useMemo(() => {
    if (!currentUser) return nurseSupervisorUsers;
    if (currentUserRole === 'admin' || currentUser.role === 'admin') {
      return nurseSupervisorUsers;
    }
    if (isCnsLoggedIn) {
      const cnsCat = currentUser.category || userDivisionCategory;
      const permittedWardIds = new Set(assignableWardsForNs.map(w => w.id));
      const permittedHnIds = new Set(assignableHnsForNs.map(h => h.id));
      return nurseSupervisorUsers.filter(ns => {
        if (ns.wardId && permittedWardIds.has(ns.wardId)) return true;
        if (ns.headNurseId && permittedHnIds.has(ns.headNurseId)) return true;
        if (ns.category === cnsCat) return true;
        if (!ns.wardId && !ns.headNurseId) return true;
        return false;
      });
    }
    if (isHnLoggedIn) {
      const hnWardId = currentUser.wardId;
      const hnId = currentUser.id;
      const permittedWardIds = new Set(assignableWardsForNs.map(w => w.id));
      return nurseSupervisorUsers.filter(ns => {
        if (ns.wardId === hnWardId) return true;
        if (ns.headNurseId === hnId) return true;
        if (ns.wardId && permittedWardIds.has(ns.wardId)) return true;
        if (!ns.wardId && !ns.headNurseId) return true;
        return false;
      });
    }
    return nurseSupervisorUsers;
  }, [nurseSupervisorUsers, assignableWardsForNs, assignableHnsForNs, currentUser, currentUserRole, isCnsLoggedIn, isHnLoggedIn, userDivisionCategory]);

  // Assign Ward directly to single Nurse Supervisor
  const handleAssignWardToSingleNs = (nsId: string, wardId: string) => {
    const targetWard = wards.find(w => w.id === wardId);
    let matchingHn = headNurseUsers.find(h => h.wardId === wardId);

    // If HN is assigning to their ward or themselves, link to this HN
    if (isHnLoggedIn && currentUser && (!matchingHn || currentUser.wardId === wardId)) {
      matchingHn = headNurseUsers.find(h => h.id === currentUser.id) || matchingHn;
    }

    onUpdateUser(nsId, {
      wardId: wardId || undefined,
      ...(matchingHn ? { headNurseId: matchingHn.id, headNurseName: matchingHn.name } : {})
    });

    if (onUpdateStaff) {
      const matchingStaff = staff.find(s => s.id === nsId || s.name.toLowerCase() === users.find(u => u.id === nsId)?.name.toLowerCase());
      if (matchingStaff) {
        onUpdateStaff(matchingStaff.id, {
          wardId: wardId || undefined,
          ...(matchingHn ? { headNurseId: matchingHn.id, headNurseName: matchingHn.name } : {})
        });
      }
    }

    const nsUser = nurseSupervisorUsers.find(n => n.id === nsId);
    triggerFeedback(wardId 
      ? `Directly assigned ${nsUser?.name || 'Nurse Supervisor'} to ${targetWard?.name || 'Ward'} (${targetWard?.code || ''})` 
      : `Unassigned Ward for ${nsUser?.name || 'Nurse Supervisor'}`
    );
  };

  // Assign HN to single Nurse Supervisor
  const handleAssignHnToSingleNs = (nsId: string, headNurseId: string) => {
    const targetHn = headNurseUsers.find(h => h.id === headNurseId);
    if (onAssignHeadNurseToSupervisors) {
      onAssignHeadNurseToSupervisors([nsId], headNurseId);
    } else {
      onUpdateUser(nsId, {
        headNurseId: headNurseId || undefined,
        headNurseName: targetHn?.name || undefined
      });
    }

    // Also update any corresponding staff record if present
    if (onUpdateStaff) {
      const matchingStaff = staff.find(s => s.id === nsId || s.name.toLowerCase() === users.find(u => u.id === nsId)?.name.toLowerCase());
      if (matchingStaff) {
        onUpdateStaff(matchingStaff.id, {
          headNurseId: headNurseId || undefined,
          headNurseName: targetHn?.name || undefined
        });
      }
    }

    const nsUser = nurseSupervisorUsers.find(n => n.id === nsId);
    triggerFeedback(headNurseId 
      ? `Assigned Head Nurse ${targetHn?.name || ''} to ${nsUser?.name || 'Nurse Supervisor'}` 
      : `Unassigned Head Nurse for ${nsUser?.name || 'Nurse Supervisor'}`
    );
  };

  // Bulk Assign Ward directly to selected Nurse Supervisors
  const handleBulkAssignWard = (targetWardId: string) => {
    if (selectedNsIds.length === 0) return;
    const targetWard = wards.find(w => w.id === targetWardId);
    let matchingHn = headNurseUsers.find(h => h.wardId === targetWardId);

    if (isHnLoggedIn && currentUser && (!matchingHn || currentUser.wardId === targetWardId)) {
      matchingHn = headNurseUsers.find(h => h.id === currentUser.id) || matchingHn;
    }

    selectedNsIds.forEach(id => {
      onUpdateUser(id, {
        wardId: targetWardId || undefined,
        ...(matchingHn ? { headNurseId: matchingHn.id, headNurseName: matchingHn.name } : {})
      });
      if (onUpdateStaff) {
        const matchingStaff = staff.find(s => s.id === id || s.name.toLowerCase() === users.find(u => u.id === id)?.name.toLowerCase());
        if (matchingStaff) {
          onUpdateStaff(matchingStaff.id, {
            wardId: targetWardId || undefined,
            ...(matchingHn ? { headNurseId: matchingHn.id, headNurseName: matchingHn.name } : {})
          });
        }
      }
    });

    triggerFeedback(targetWardId 
      ? `Successfully assigned ${selectedNsIds.length} Nurse Supervisor(s) directly to ${targetWard?.name} (${targetWard?.code})`
      : `Unassigned Ward for ${selectedNsIds.length} Nurse Supervisor(s)`
    );
    setSelectedNsIds([]);
  };

  // Open modal to manage Nurse Supervisors for a specific Ward
  const handleOpenWardNsModal = (ward: WardInfo) => {
    setWardModalForNsAssignment(ward);
    const assignedIds = nurseSupervisorUsers.filter(ns => ns.wardId === ward.id).map(ns => ns.id);
    setSelectedNsIdsInWardModal(assignedIds);
  };

  // Save assignments from specific Ward modal
  const handleSaveWardNsModal = () => {
    if (!wardModalForNsAssignment) return;
    const wardId = wardModalForNsAssignment.id;
    const wardCode = wardModalForNsAssignment.code;
    const matchingHn = headNurseUsers.find(h => h.wardId === wardId);

    nurseSupervisorUsers.forEach(ns => {
      const isSelected = selectedNsIdsInWardModal.includes(ns.id);
      const isCurrentlyAssignedToThisWard = ns.wardId === wardId;

      if (isSelected && !isCurrentlyAssignedToThisWard) {
        onUpdateUser(ns.id, {
          wardId: wardId,
          ...(matchingHn ? { headNurseId: matchingHn.id, headNurseName: matchingHn.name } : {})
        });
      } else if (!isSelected && isCurrentlyAssignedToThisWard) {
        onUpdateUser(ns.id, {
          wardId: undefined
        });
      }
    });

    triggerFeedback(`Updated Nurse Supervisor direct assignments for ${wardModalForNsAssignment.name} (${wardCode})`);
    setWardModalForNsAssignment(null);
  };

  // Bulk Assign HN to selected Nurse Supervisors
  const handleBulkAssignHn = (targetHnId: string) => {
    if (selectedNsIds.length === 0) return;
    const targetHn = headNurseUsers.find(h => h.id === targetHnId);
    
    if (onAssignHeadNurseToSupervisors) {
      onAssignHeadNurseToSupervisors(selectedNsIds, targetHnId);
    } else {
      selectedNsIds.forEach(id => {
        onUpdateUser(id, {
          headNurseId: targetHnId || undefined,
          headNurseName: targetHn?.name || undefined
        });
      });
    }

    triggerFeedback(targetHnId 
      ? `Successfully assigned Head Nurse ${targetHn?.name} to ${selectedNsIds.length} Nurse Supervisor(s)`
      : `Unassigned Head Nurse for ${selectedNsIds.length} Nurse Supervisor(s)`
    );
    setSelectedNsIds([]);
  };

  // Open modal to manage Nurse Supervisors for a specific Head Nurse (multi-NS assignment)
  const handleOpenHnNsModal = (hn: UserAccount) => {
    setHnModalForNsAssignment(hn);
    setHnModalSearch('');
    // Pre-select all supervisors currently assigned to this HN
    const assignedIds = nurseSupervisorUsers.filter(ns => ns.headNurseId === hn.id).map(ns => ns.id);
    setSelectedNsIdsInHnModal(assignedIds);
  };

  // Save assignments from specific HN modal (supporting multiple Nurse Supervisors per Head Nurse)
  const handleSaveHnNsModal = () => {
    if (!hnModalForNsAssignment) return;
    const hnId = hnModalForNsAssignment.id;
    const hnName = hnModalForNsAssignment.name;

    // Update each Nurse Supervisor
    nurseSupervisorUsers.forEach(ns => {
      const isSelected = selectedNsIdsInHnModal.includes(ns.id);
      const isCurrentlyAssignedToThisHn = ns.headNurseId === hnId;

      if (isSelected && !isCurrentlyAssignedToThisHn) {
        onUpdateUser(ns.id, {
          headNurseId: hnId,
          headNurseName: hnName
        });
        if (onUpdateStaff) {
          const matchingStaff = staff.find(s => s.id === ns.id || s.name.toLowerCase() === ns.name.toLowerCase());
          if (matchingStaff) {
            onUpdateStaff(matchingStaff.id, {
              headNurseId: hnId,
              headNurseName: hnName
            });
          }
        }
      } else if (!isSelected && isCurrentlyAssignedToThisHn) {
        onUpdateUser(ns.id, {
          headNurseId: undefined,
          headNurseName: undefined
        });
        if (onUpdateStaff) {
          const matchingStaff = staff.find(s => s.id === ns.id || s.name.toLowerCase() === ns.name.toLowerCase());
          if (matchingStaff) {
            onUpdateStaff(matchingStaff.id, {
              headNurseId: undefined,
              headNurseName: undefined
            });
          }
        }
      }
    });

    // Update Head Nurse's assigned supervisors list
    onUpdateUser(hnId, {
      assignedSupervisorIds: selectedNsIdsInHnModal
    });

    triggerFeedback(`Updated Head Nurse ${hnName}: now managing ${selectedNsIdsInHnModal.length} Nurse Supervisor(s)`);
    setHnModalForNsAssignment(null);
  };

  // Create Ward Submit
  const handleCreateWardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWardName.trim()) {
      alert('Please enter a ward name.');
      return;
    }
    const code = newWardCode.trim() || newWardName.slice(0, 3).toUpperCase();
    const supervisor = users.find(u => u.id === newWardSupervisorId);

    onCreateWard({
      name: newWardName.trim(),
      code: code,
      category: newWardCategory,
      description: newWardDesc.trim(),
      supervisorId: newWardSupervisorId || undefined,
      supervisorName: supervisor?.name || undefined,
      supervisorEmail: supervisor?.email || undefined
    });

    setNewWardName('');
    setNewWardCode('');
    setNewWardCategory('Medical');
    setNewWardDesc('');
    setNewWardSupervisorId('');
    setShowNewWardModal(false);
    triggerFeedback(`Created new ${newWardCategory} ward: ${code}`);
  };

  // Create Head Nurse (HN) Submit
  const handleCreateWsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !newWsEmail.trim()) {
      alert('Please fill in Head Nurse name and email.');
      return;
    }
    onCreateUser({
      name: newWsName.trim(),
      email: newWsEmail.trim().toLowerCase(),
      role: 'head_nurse',
      nurseDesignation: 'HN',
      category: newWsCategory,
      wardId: newWsWardId,
      jobTitle: `Head Nurse (HN - ${wards.find(w => w.id === newWsWardId)?.code || 'Ward'})`,
      licenseNumber: newWsLicenseNumber.trim() || `NUR-HN-${Math.floor(1000 + Math.random() * 9000)}`,
      licenseExpiry: newWsLicenseExpiry || '2028-12-31',
      isAuthorizedDutyApprover: true
    });

    setNewWsName('');
    setNewWsEmail('');
    setNewWsCategory('Medical');
    setNewWsLicenseNumber('');
    setNewWsLicenseExpiry('');
    setShowNewWsModal(false);
    triggerFeedback(`Appointed new Head Nurse (HN) under ${newWsCategory} category: ${newWsName.trim()}`);
  };

  // Create Nurse Supervisor (NS) Submit
  const handleCreateNsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNsName.trim() || !newNsEmail.trim()) {
      alert('Please fill in Nurse Supervisor name and email.');
      return;
    }
    const targetHn = headNurseUsers.find(h => h.id === newNsHeadNurseId);

    onCreateUser({
      name: newNsName.trim(),
      email: newNsEmail.trim().toLowerCase(),
      role: 'nurse_supervisor',
      nurseDesignation: 'NS',
      wardId: newNsWardId,
      headNurseId: newNsHeadNurseId || undefined,
      headNurseName: targetHn?.name || undefined,
      jobTitle: newNsJobTitle.trim() || 'Nurse Supervisor (NS)',
      licenseNumber: newNsLicenseNumber.trim() || `NUR-NS-${Math.floor(1000 + Math.random() * 9000)}`,
      licenseExpiry: newNsLicenseExpiry || '2028-12-31',
      isAuthorizedDutyApprover: true
    });

    setNewNsName('');
    setNewNsEmail('');
    setNewNsLicenseNumber('');
    setNewNsLicenseExpiry('');
    setNewNsHeadNurseId('');
    setShowNewNsModal(false);
    triggerFeedback(`Appointed Nurse Supervisor (NS): ${newNsName.trim()}${targetHn ? ` (Assigned to HN ${targetHn.name})` : ''}`);
  };

  // Open Edit Ward Modal
  const handleOpenEditWardModal = (w: WardInfo) => {
    setEditingWard(w);
    setEditWardName(w.name);
    setEditWardCode(w.code);
    setEditWardCategory(w.category || 'Medical');
    setEditWardDesc(w.description || '');
    setEditWardSupervisorId(w.supervisorId || '');
  };

  // Save Edit Ward
  const handleSaveEditWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWard || !editWardName.trim()) {
      alert('Please enter a valid ward name.');
      return;
    }
    const code = editWardCode.trim() || editWardName.slice(0, 3).toUpperCase();
    const supervisor = users.find(u => u.id === editWardSupervisorId);

    onUpdateWard(editingWard.id, {
      name: editWardName.trim(),
      code: code,
      category: editWardCategory,
      description: editWardDesc.trim(),
      supervisorId: editWardSupervisorId || undefined,
      supervisorName: supervisor?.name || undefined,
      supervisorEmail: supervisor?.email || undefined
    });

    if (supervisor && supervisor.wardId !== editingWard.id) {
      onUpdateUser(supervisor.id, { wardId: editingWard.id });
    }

    triggerFeedback(`Successfully updated ward information for ${editWardName.trim()} (${code})`);
    setEditingWard(null);
  };

  // Open Edit Chief Nursing Services (CNS) Modal
  const handleOpenEditCnsModal = (cns: UserAccount) => {
    setEditingCns(cns);
    setEditCnsName(cns.name);
    setEditCnsEmail(cns.email);
    setEditCnsCategory(cns.category || 'Medical');
    setEditCnsJobTitle(cns.jobTitle || `Chief Nursing Services (${cns.category || 'Medical'})`);
    setEditCnsLicenseNumber(cns.licenseNumber || '');
    setEditCnsLicenseExpiry(cns.licenseExpiry || '');
    setEditCnsPhone(cns.phone || '');
    setEditCnsIsDutyApprover(cns.isAuthorizedDutyApprover ?? true);
  };

  // Save Edit Chief Nursing Services (CNS)
  const handleSaveEditCns = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCns || !editCnsName.trim() || !editCnsEmail.trim()) {
      alert('Please fill in Chief Nursing Services name and email.');
      return;
    }

    const updates: Partial<UserAccount> = {
      name: editCnsName.trim(),
      email: editCnsEmail.trim().toLowerCase(),
      category: editCnsCategory,
      jobTitle: editCnsJobTitle.trim() || `Chief Nursing Services (${editCnsCategory})`,
      licenseNumber: editCnsLicenseNumber.trim() || undefined,
      licenseExpiry: editCnsLicenseExpiry || undefined,
      phone: editCnsPhone.trim() || undefined,
      isAuthorizedDutyApprover: editCnsIsDutyApprover
    };

    onUpdateUser(editingCns.id, updates);

    // Sync matching staff member
    if (onUpdateStaff) {
      const matchingStaff = staff.find(s => s.id === editingCns.id || s.name.toLowerCase() === editingCns.name.toLowerCase());
      if (matchingStaff) {
        onUpdateStaff(matchingStaff.id, {
          name: editCnsName.trim(),
          email: editCnsEmail.trim().toLowerCase(),
          category: editCnsCategory,
          jobTitle: editCnsJobTitle.trim() || `Chief Nursing Services (${editCnsCategory})`,
          licenseNumber: editCnsLicenseNumber.trim() || undefined,
          licenseExpiry: editCnsLicenseExpiry || undefined,
          phone: editCnsPhone.trim() || undefined,
          isAuthorizedDutyApprover: editCnsIsDutyApprover
        });
      }
    }

    triggerFeedback(`Successfully updated Chief Nursing Services executive profile for ${editCnsName.trim()} (${editCnsCategory} Division)`);
    setEditingCns(null);
  };

  // Open Add Chief Nursing Services (CNS) Modal
  const handleOpenAddCnsModal = (cat: WardCategory = 'Medical') => {
    setNewCnsName('');
    setNewCnsEmail('');
    setNewCnsCategory(cat);
    setNewCnsJobTitle(`Chief Nursing Services (${cat})`);
    setNewCnsLicenseNumber(`CNS-LIC-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewCnsLicenseExpiry('2028-12-31');
    setNewCnsPhone('');
    setNewCnsIsDutyApprover(true);
    setShowNewCnsModal(true);
  };

  // Create CNS Submit (GCNS)
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

    setNewCnsName('');
    setNewCnsEmail('');
    setShowNewCnsModal(false);
    triggerFeedback(`Appointed Chief Nursing Services (CNS) for ${newCnsCategory} Division: ${newCnsName.trim()}`);
  };

  // Confirm Delete Chief Nursing Services (CNS) (GCNS)
  const handleConfirmDeleteCns = () => {
    if (!deletingCns) return;
    onDeleteUser(deletingCns.id);
    triggerFeedback(`Removed Chief Nursing Services appointment for ${deletingCns.name}`);
    if (editingCns?.id === deletingCns.id) {
      setEditingCns(null);
    }
    setDeletingCns(null);
  };

  // Open Edit Head Nurse (HN) Modal
  const handleOpenEditHnModal = (hn: UserAccount) => {
    setEditingHn(hn);
    setEditHnName(hn.name);
    setEditHnEmail(hn.email);
    setEditHnCategory(hn.category || (hn.wardId ? wards.find(w => w.id === hn.wardId)?.category : undefined) || 'Medical');
    setEditHnWardId(hn.wardId || '');
    setEditHnJobTitle(hn.jobTitle || 'Head Nurse (HN)');
    setEditHnLicenseNumber(hn.licenseNumber || '');
    setEditHnLicenseExpiry(hn.licenseExpiry || '');
    setEditHnPhone(hn.phone || '');
    setEditHnIsDutyApprover(hn.isAuthorizedDutyApprover ?? true);
  };

  // Save Edit Head Nurse (HN)
  const handleSaveEditHn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHn || !editHnName.trim() || !editHnEmail.trim()) {
      alert('Please fill in Head Nurse name and email.');
      return;
    }

    const updates: Partial<UserAccount> = {
      name: editHnName.trim(),
      email: editHnEmail.trim().toLowerCase(),
      category: editHnCategory,
      wardId: editHnWardId || undefined,
      jobTitle: editHnJobTitle.trim() || 'Head Nurse (HN)',
      licenseNumber: editHnLicenseNumber.trim() || undefined,
      licenseExpiry: editHnLicenseExpiry || undefined,
      phone: editHnPhone.trim() || undefined,
      isAuthorizedDutyApprover: editHnIsDutyApprover
    };

    onUpdateUser(editingHn.id, updates);

    // Sync matching staff member
    if (onUpdateStaff) {
      const matchingStaff = staff.find(s => s.id === editingHn.id || s.name.toLowerCase() === editingHn.name.toLowerCase());
      if (matchingStaff) {
        onUpdateStaff(matchingStaff.id, {
          name: editHnName.trim(),
          email: editHnEmail.trim().toLowerCase(),
          category: editHnCategory,
          wardId: editHnWardId || undefined,
          jobTitle: editHnJobTitle.trim() || 'Head Nurse (HN)',
          licenseNumber: editHnLicenseNumber.trim() || undefined,
          licenseExpiry: editHnLicenseExpiry || undefined,
          phone: editHnPhone.trim() || undefined,
          isAuthorizedDutyApprover: editHnIsDutyApprover
        });
      }
    }

    // Sync ward supervisor if ward changed
    if (editHnWardId) {
      const targetWard = wards.find(w => w.id === editHnWardId);
      if (targetWard) {
        onUpdateWard(targetWard.id, {
          supervisorId: editingHn.id,
          supervisorName: editHnName.trim(),
          supervisorEmail: editHnEmail.trim().toLowerCase()
        });
      }
    }

    triggerFeedback(`Successfully updated Head Nurse profile for ${editHnName.trim()}`);
    setEditingHn(null);
  };

  // Open Edit Nurse Supervisor (NS) Modal
  const handleOpenEditNsModal = (ns: UserAccount) => {
    setEditingNs(ns);
    setEditNsName(ns.name);
    setEditNsEmail(ns.email);
    setEditNsWardId(ns.wardId || '');
    setEditNsHeadNurseId(ns.headNurseId || '');
    setEditNsJobTitle(ns.jobTitle || 'Nurse Supervisor (NS)');
    setEditNsLicenseNumber(ns.licenseNumber || '');
    setEditNsLicenseExpiry(ns.licenseExpiry || '');
    setEditNsPhone(ns.phone || '');
    setEditNsIsDutyApprover(ns.isAuthorizedDutyApprover ?? true);
  };

  // Save Edit Nurse Supervisor (NS)
  const handleSaveEditNs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNs || !editNsName.trim() || !editNsEmail.trim()) {
      alert('Please fill in Nurse Supervisor name and email.');
      return;
    }

    const targetHn = headNurseUsers.find(h => h.id === editNsHeadNurseId);
    const updates: Partial<UserAccount> = {
      name: editNsName.trim(),
      email: editNsEmail.trim().toLowerCase(),
      wardId: editNsWardId || undefined,
      headNurseId: editNsHeadNurseId || undefined,
      headNurseName: targetHn?.name || undefined,
      jobTitle: editNsJobTitle.trim() || 'Nurse Supervisor (NS)',
      licenseNumber: editNsLicenseNumber.trim() || undefined,
      licenseExpiry: editNsLicenseExpiry || undefined,
      phone: editNsPhone.trim() || undefined,
      isAuthorizedDutyApprover: editNsIsDutyApprover
    };

    onUpdateUser(editingNs.id, updates);

    // Sync matching staff member
    if (onUpdateStaff) {
      const matchingStaff = staff.find(s => s.id === editingNs.id || s.name.toLowerCase() === editingNs.name.toLowerCase());
      if (matchingStaff) {
        onUpdateStaff(matchingStaff.id, {
          name: editNsName.trim(),
          email: editNsEmail.trim().toLowerCase(),
          wardId: editNsWardId || undefined,
          headNurseId: editNsHeadNurseId || undefined,
          headNurseName: targetHn?.name || undefined,
          jobTitle: editNsJobTitle.trim() || 'Nurse Supervisor (NS)',
          licenseNumber: editNsLicenseNumber.trim() || undefined,
          licenseExpiry: editNsLicenseExpiry || undefined,
          phone: editNsPhone.trim() || undefined,
          isAuthorizedDutyApprover: editNsIsDutyApprover
        });
      }
    }

    triggerFeedback(`Successfully updated Nurse Supervisor details for ${editNsName.trim()}`);
    setEditingNs(null);
  };

  // Filter Wards
  const filteredWards = useMemo(() => {
    return wards.filter(w => {
      if (wardCategoryFilter !== 'all') {
        const cat = w.category || 'Medical';
        if (cat !== wardCategoryFilter) return false;
      }
      return (
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.category && w.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [wards, searchQuery, wardCategoryFilter]);

  // Filter Head Nurses list
  const filteredHeadNurses = useMemo(() => {
    return headNurseUsers.filter(u => {
      const uCat = u.category || (u.wardId ? wards.find(w => w.id === u.wardId)?.category : undefined) || 'Medical';
      if (hnCategoryFilter !== 'all' && uCat !== hnCategoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ward = wards.find(w => w.id === u.wardId);
        return (
          u.name.toLowerCase().includes(q) || 
          u.email.toLowerCase().includes(q) ||
          uCat.toLowerCase().includes(q) ||
          (u.licenseNumber || '').toLowerCase().includes(q) ||
          (ward && (ward.name.toLowerCase().includes(q) || ward.code.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [headNurseUsers, wards, searchQuery, hnCategoryFilter]);

  // Filter Nurse Supervisors list
  const filteredNurseSupervisors = useMemo(() => {
    return assignableNsUsers.filter(ns => {
      if (nsFilterWardId !== 'all' && ns.wardId !== nsFilterWardId) return false;
      if (nsFilterHnId === 'unassigned' && ns.headNurseId) return false;
      if (nsFilterHnId !== 'all' && nsFilterHnId !== 'unassigned' && ns.headNurseId !== nsFilterHnId) return false;

      if (nsWardCategoryFilter !== 'all') {
        const assignedWard = wards.find(w => w.id === ns.wardId);
        const assignedHn = headNurseUsers.find(h => h.id === ns.headNurseId);
        const effectiveCat = assignedWard?.category || assignedHn?.category || 'Medical';
        if (effectiveCat !== nsWardCategoryFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = ns.name.toLowerCase();
        const email = ns.email.toLowerCase();
        const wardName = (wards.find(w => w.id === ns.wardId)?.name || '').toLowerCase();
        const wardCode = (wards.find(w => w.id === ns.wardId)?.code || '').toLowerCase();
        const hnName = (headNurseUsers.find(h => h.id === ns.headNurseId)?.name || '').toLowerCase();
        const license = (ns.licenseNumber || '').toLowerCase();

        return name.includes(q) || email.includes(q) || wardName.includes(q) || wardCode.includes(q) || hnName.includes(q) || license.includes(q);
      }
      return true;
    });
  }, [assignableNsUsers, nsFilterWardId, nsFilterHnId, nsWardCategoryFilter, searchQuery, wards, headNurseUsers]);

  // Filter Staff Members for Manpower View across all search criteria
  const filteredStaffMembers = useMemo(() => {
    return staff.filter(s => {
      // 1. Category filter
      if (manpowerCategoryFilter !== 'all') {
        const assignedWard = wards.find(w => w.id === (s.wardId || wards[0]?.id));
        const assignedCat = assignedWard?.category || 'Medical';
        if (assignedCat !== manpowerCategoryFilter) return false;
      }

      // 2. Ward filter
      if (manpowerFilterWardId !== 'all') {
        const assignedWardId = s.wardId || wards[0]?.id;
        if (assignedWardId !== manpowerFilterWardId) return false;
      }

      // 3. Rank filter
      const isHa = !!s.isHa || s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)');
      const isWs = !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)');

      if (manpowerRankFilter === 'senior' && !s.isSenior) return false;
      if (manpowerRankFilter === 'junior' && (s.isSenior || isHa || isWs)) return false;
      if (manpowerRankFilter === 'ha' && !isHa) return false;
      if (manpowerRankFilter === 'ws' && !isWs) return false;

      // 4. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ward = wards.find(w => w.id === s.wardId) || wards[0];
        const wardName = ward?.name?.toLowerCase() || '';
        const wardCode = ward?.code?.toLowerCase() || '';
        const name = s.name.toLowerCase();
        const id = s.id.toLowerCase();
        const email = (s.email || `${s.id.toLowerCase()}@hospital.org`).toLowerCase();
        const phone = (s.phone || '').toLowerCase();

        let rankTitle = 'junior staff nurse';
        if (s.isSenior) rankTitle = 'senior staff nurse';
        else if (isHa) rankTitle = 'health assistant ha';
        else if (isWs) rankTitle = 'ward supervisor ws';

        const matchesName = name.includes(q);
        const matchesId = id.includes(q);
        const matchesEmail = email.includes(q);
        const matchesPhone = phone.includes(q);
        const matchesWard = wardName.includes(q) || wardCode.includes(q);
        const matchesRank = rankTitle.includes(q);

        return matchesName || matchesId || matchesEmail || matchesPhone || matchesWard || matchesRank;
      }
      return true;
    });
  }, [staff, manpowerCategoryFilter, manpowerFilterWardId, manpowerRankFilter, searchQuery, wards]);

  const handleInspectWardPersonnel = (wardId: string) => {
    setManpowerFilterWardId(wardId);
    setActiveTab('manpower');
  };

  // Summary counts for NS assignment
  const totalNsCount = nurseSupervisorUsers.length;
  const assignedNsCount = nurseSupervisorUsers.filter(ns => !!ns.headNurseId).length;
  const unassignedNsCount = totalNsCount - assignedNsCount;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Crown size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800/60">
                Institutional Nursing Administration
              </span>
              {canManageGovernance && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${
                  isHnLoggedIn
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : isCnsLoggedIn || currentUserRole === 'cns' 
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {isHnLoggedIn ? 'Head Nurse Admin' : isCnsLoggedIn || currentUserRole === 'cns' ? 'Institutional Admin' : 'GCNS'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white mt-1">Hospital Staff Directory & Hierarchy Governance</h2>
            <p className="text-xs text-slate-300">
              {isHnLoggedIn 
                ? 'Clinical Ward Structure • Nurse Supervisors • Staff Directory Governance'
                : 'Manage Head Nurses (HN) • Hospital Wards • Staff Directory & Hierarchy Governance'}
            </p>
          </div>
        </div>

        {canManageGovernance && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowNewNsModal(true)}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 uppercase tracking-wider"
            >
              <UserPlus size={16} />
              Add Nurse Supervisor (NS)
            </button>
            {!isHnLoggedIn && (
              <button
                onClick={() => setShowNewWsModal(true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 uppercase tracking-wider"
              >
                <ShieldCheck size={16} />
                Add Head Nurse (HN)
              </button>
            )}
            <button
              onClick={() => setShowNewWardModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 uppercase tracking-wider"
            >
              <Plus size={16} />
              Add Ward
            </button>
          </div>
        )}
      </div>

      {/* Floating Feedback Banner */}
      {feedbackMessage && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300 font-bold text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-200" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-200 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation tabs & Global Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {/* TAB: HEAD NURSES - HIDDEN IN HN ACCOUNT */}
          {!isHnLoggedIn && (
            <button
              onClick={() => setActiveTab('supervisors')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                activeTab === 'supervisors'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Crown size={16} />
              Head Nurses (HN) ({headNurseUsers.length})
            </button>
          )}

          {/* TAB: WARDS */}
          <button
            onClick={() => setActiveTab('wards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
              activeTab === 'wards'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 size={16} />
            Hospital Wards ({filteredWards.length})
          </button>

          {/* TAB: NURSE SUPERVISOR (NS) ASSIGNMENTS */}
          <button
            onClick={() => setActiveTab('ns_assignment')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
              activeTab === 'ns_assignment'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck size={16} />
            NS Assignments ({filteredNurseSupervisors.length})
          </button>

          {/* TAB: MANPOWER */}
          <button
            onClick={() => setActiveTab('manpower')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
              activeTab === 'manpower'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users size={16} />
            Staff Directory & Details ({staff.length})
          </button>

          {/* TAB: HIERARCHY CHART */}
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
              activeTab === 'hierarchy'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles size={16} />
            {isHnLoggedIn ? 'Command Tree' : isCnsLoggedIn ? '3-Tier Command Tree' : '4-Tier Command Tree'}
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative min-w-[240px]">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff, supervisor, ward..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 font-bold"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: HN & NURSE SUPERVISOR ASSIGNMENT (CORE USER REQUEST) */}
      {activeTab === 'ns_assignment' && (
        <div className="space-y-6">
          {/* Summary & Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Nurse Supervisors (NS)</div>
              <div className="text-2xl font-black text-slate-900">{totalNsCount}</div>
              <div className="text-[11px] text-slate-500 font-medium">Frontline Clinical Team Leaders</div>
            </div>

            <div className="bg-indigo-50/80 p-5 rounded-3xl border border-indigo-200 shadow-sm space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Building2 size={13} className="text-indigo-600" />
                Directly Assigned to Ward / Unit
              </div>
              <div className="text-2xl font-black text-indigo-950">
                {nurseSupervisorUsers.filter(ns => !!ns.wardId).length}
                <span className="text-xs font-bold text-indigo-700 ml-1">/ {totalNsCount}</span>
              </div>
              <div className="text-[11px] text-indigo-700 font-medium">Stationed at Hospital Clinical Units</div>
            </div>

            <div className="bg-emerald-50/80 p-5 rounded-3xl border border-emerald-200 shadow-sm space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Crown size={13} className="text-emerald-600" />
                Supervised by Head Nurse (HN)
              </div>
              <div className="text-2xl font-black text-emerald-950">
                {assignedNsCount}
                <span className="text-xs font-bold text-emerald-700 ml-1">/ {totalNsCount}</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">Guided by Designated Head Nurses</div>
            </div>

            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">Active Hospital Wards</div>
              <div className="text-2xl font-black text-slate-900">{wards.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">{headNurseUsers.length} Appointed Head Nurses</div>
            </div>
          </div>

          {/* DUAL BATCH ASSIGNMENT ACTION TOOLBAR */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl shadow-xl border border-indigo-800/60 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-600 text-white rounded-2xl flex items-center justify-center font-black">
                <CheckCheck size={22} />
              </div>
              <div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span>Batch Ward & Head Nurse Assignment</span>
                  {selectedNsIds.length > 0 ? (
                    <span className="px-2.5 py-0.5 bg-cyan-400 text-slate-950 font-black text-[10px] rounded-full">
                      {selectedNsIds.length} Selected
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal">Select checkboxes below to bulk-assign</span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  Directly assign selected Nurse Supervisors to a Ward/Unit and designate their supervising Head Nurse.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
              {/* Batch Direct Ward Assignment */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
                <select
                  value={bulkTargetWardId}
                  onChange={(e) => setBulkTargetWardId(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 min-w-[150px]"
                >
                  <option value="">Direct Ward / Unit...</option>
                  {assignableWardsForNs.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleBulkAssignWard(bulkTargetWardId)}
                  disabled={selectedNsIds.length === 0 || !bulkTargetWardId}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow transition flex items-center gap-1"
                >
                  <Building2 size={13} />
                  Assign Ward ({selectedNsIds.length})
                </button>
              </div>

              {/* Batch Head Nurse Assignment */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
                <select
                  value={bulkTargetHnId}
                  onChange={(e) => setBulkTargetHnId(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-cyan-500 min-w-[150px]"
                >
                  <option value="">Head Nurse (HN)...</option>
                  {assignableHnsForNs.map(hn => {
                    const ward = wards.find(w => w.id === hn.wardId);
                    return (
                      <option key={hn.id} value={hn.id}>
                        {hn.name} ({ward?.code || 'HN'})
                      </option>
                    );
                  })}
                </select>
                <button
                  onClick={() => handleBulkAssignHn(bulkTargetHnId)}
                  disabled={selectedNsIds.length === 0 || !bulkTargetHnId}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow transition flex items-center gap-1"
                >
                  <Crown size={13} />
                  Assign HN ({selectedNsIds.length})
                </button>
              </div>

              {selectedNsIds.length > 0 && (
                <button
                  onClick={() => setSelectedNsIds([])}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter & View Mode Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Select All Checkbox */}
              <button
                onClick={() => {
                  if (selectedNsIds.length === filteredNurseSupervisors.length && filteredNurseSupervisors.length > 0) {
                    setSelectedNsIds([]);
                  } else {
                    setSelectedNsIds(filteredNurseSupervisors.map(n => n.id));
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                <CheckSquare size={15} className={selectedNsIds.length === filteredNurseSupervisors.length && filteredNurseSupervisors.length > 0 ? "text-indigo-600" : "text-slate-400"} />
                {selectedNsIds.length === filteredNurseSupervisors.length && filteredNurseSupervisors.length > 0
                  ? 'Deselect All' 
                  : `Select All (${filteredNurseSupervisors.length})`}
              </button>

              {/* Ward Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span>Filter Ward:</span>
                <select
                  value={nsFilterWardId}
                  onChange={(e) => setNsFilterWardId(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="all">All Wards</option>
                  {assignableWardsForNs.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              {/* Head Nurse Assignment Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span>Filter HN:</span>
                <select
                  value={nsFilterHnId}
                  onChange={(e) => setNsFilterHnId(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="all">All Nurse Supervisors</option>
                  <option value="unassigned">⚠️ Unassigned HN Only</option>
                  {assignableHnsForNs.map(hn => (
                    <option key={hn.id} value={hn.id}>Assigned to {hn.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setNsViewMode('ward')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  nsViewMode === 'ward' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 size={14} className="text-indigo-600" /> Grouped by Ward / Unit
              </button>
              <button
                onClick={() => setNsViewMode('bento')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  nsViewMode === 'bento' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crown size={14} className="text-amber-600" /> Grouped by Head Nurse
              </button>
              <button
                onClick={() => setNsViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  nsViewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List size={14} /> Registry Table
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: GROUPED BY DIRECTLY ASSIGNED WARD / UNIT */}
          {nsViewMode === 'ward' && (
            <div className="space-y-6">
              {/* Category Filter Pills for Ward Groups */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase text-slate-500 mr-1 flex items-center gap-1.5">
                    <Filter size={14} className="text-indigo-600" />
                    Ward Category:
                  </span>
                  <button
                    type="button"
                    onClick={() => setNsWardCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      nsWardCategoryFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All Wards ({wards.length})
                  </button>
                  {effectiveDivisions.map(div => {
                    const theme = getDivisionTheme(div.colorTheme);
                    const isSelected = nsWardCategoryFilter === div.name;
                    const count = wards.filter(w => (!w.category && div.name === 'Medical') || w.category === div.name).length;
                    return (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => setNsWardCategoryFilter(div.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                          isSelected ? theme.activePill : theme.inactivePill
                        }`}
                      >
                        <span className={isSelected ? 'text-white' : theme.iconColor}>
                          {renderDivisionIcon(div.icon, 'w-3 h-3')}
                        </span>
                        {div.name} ({count})
                      </button>
                    );
                  })}

                  {isTopAdmin && (
                    <button
                      type="button"
                      onClick={handleOpenAddDivisionModal}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition flex items-center gap-1"
                      title="Create new clinical division"
                    >
                      <Plus size={12} /> Add Division
                    </button>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-500">
                  Showing <span className="font-black text-slate-900">
                    {assignableWardsForNs.filter(w => nsWardCategoryFilter === 'all' || (w.category || 'Medical') === nsWardCategoryFilter).length}
                  </span> of {assignableWardsForNs.length} authorized units
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {assignableWardsForNs.filter(w => nsWardCategoryFilter === 'all' || (w.category || 'Medical') === nsWardCategoryFilter).map(ward => {
                  const wardSupervisors = filteredNurseSupervisors.filter(ns => ns.wardId === ward.id);
                  const wardHn = headNurseUsers.find(h => h.wardId === ward.id || h.id === ward.supervisorId);

                  return (
                    <div 
                      key={ward.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-indigo-300 transition"
                    >
                      <div>
                        {/* Ward Header */}
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md">
                              {ward.code}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {renderWardCategoryBadge(ward.category, 'sm')}
                                {wardHn && (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Crown size={10} className="text-amber-600" /> {wardHn.name}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{ward.name}</h4>
                              <div className="text-[11px] text-slate-500">{ward.description || 'Hospital Ward Unit'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditWardModal(ward)}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase transition flex items-center gap-1"
                              title="Edit Ward Information"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleOpenWardNsModal(ward)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-[10px] font-black uppercase transition flex items-center gap-1"
                              title="Directly allocate Nurse Supervisors to this ward"
                            >
                              <Plus size={12} /> Allocate NS
                            </button>
                          </div>
                        </div>

                        {/* List of Directly Assigned Nurse Supervisors */}
                        <div className="pt-3 space-y-2">
                          <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                            <span className="flex items-center gap-1">
                              <Building2 size={12} className="text-indigo-600" />
                              Directly Assigned NS:
                            </span>
                            <span className="text-slate-900 font-black bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded-md border border-indigo-200">
                              {wardSupervisors.length} NS
                            </span>
                          </div>

                          {wardSupervisors.length > 0 ? (
                            <div className="space-y-2">
                              {wardSupervisors.map(ns => {
                                const isChecked = selectedNsIds.includes(ns.id);
                                const assignedHn = headNurseUsers.find(h => h.id === ns.headNurseId);

                                return (
                                  <div 
                                    key={ns.id}
                                    className={`p-3 rounded-2xl border transition space-y-2 ${
                                      isChecked 
                                        ? 'bg-indigo-50/80 border-indigo-400 shadow-sm' 
                                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/60'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2.5">
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedNsIds(prev => [...prev, ns.id]);
                                            } else {
                                              setSelectedNsIds(prev => prev.filter(id => id !== ns.id));
                                            }
                                          }}
                                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                                        />
                                        <div>
                                          <div className="text-xs font-black text-slate-900">{ns.name}</div>
                                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                            <span>{ns.email}</span>
                                            {ns.licenseNumber && <span>• {ns.licenseNumber}</span>}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Actions & Transfer Ward Selector */}
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleOpenEditNsModal(ns)}
                                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                                          title="Edit Nurse Supervisor details"
                                        >
                                          <Edit3 size={13} />
                                        </button>
                                        <select
                                          value={ns.wardId || ''}
                                          onChange={(e) => handleAssignWardToSingleNs(ns.id, e.target.value)}
                                          className="px-2 py-1 bg-white border border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-950 outline-none hover:bg-indigo-50"
                                          title="Transfer directly to another ward unit"
                                        >
                                          <option value={ward.id}>Ward: {ward.code}</option>
                                          {assignableWardsForNs.filter(w => w.id !== ward.id).map(w => (
                                            <option key={w.id} value={w.id}>Transfer to {w.code} - {w.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    {/* Supervising Head Nurse Row */}
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[10px]">
                                      <span className="text-slate-500 font-medium flex items-center gap-1">
                                        <Crown size={11} className={assignedHn ? "text-amber-600" : "text-slate-400"} />
                                        Head Nurse:
                                      </span>
                                      <select
                                        value={ns.headNurseId || ''}
                                        onChange={(e) => handleAssignHnToSingleNs(ns.id, e.target.value)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold border outline-none ${
                                          assignedHn
                                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                                            : 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                                        }`}
                                      >
                                        <option value="">⚠️ No HN Assigned</option>
                                        {assignableHnsForNs.map(h => (
                                          <option key={h.id} value={h.id}>
                                            {h.name} ({wards.find(w => w.id === h.wardId)?.code || 'HN'})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 bg-indigo-50/40 border border-dashed border-indigo-200 rounded-2xl text-center space-y-1.5">
                              <p className="text-xs font-bold text-indigo-900">No Nurse Supervisors in this Ward</p>
                              <p className="text-[11px] text-indigo-700">Directly assign clinical supervisors to {ward.name}.</p>
                              <button
                                onClick={() => handleOpenWardNsModal(ward)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase shadow-sm inline-flex items-center gap-1"
                              >
                                <Plus size={13} /> Assign Supervisors
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold flex items-center gap-1">
                          <Users size={13} className="text-slate-400" />
                          {staff.filter(s => s.wardId === ward.id).length} Ward Staff
                        </span>
                        <button
                          onClick={() => handleInspectWardPersonnel(ward.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          View Personnel Directory <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* UNASSIGNED WARD SUPERVISORS CARD */}
                {filteredNurseSupervisors.filter(ns => !ns.wardId).length > 0 && (
                  <div className="bg-gradient-to-br from-rose-50 to-amber-50/60 border-2 border-rose-300 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-rose-200 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-rose-600 text-white rounded-2xl flex items-center justify-center font-black">
                          <AlertCircle size={22} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">Unassigned Ward Supervisors</h4>
                          <span className="text-[10px] text-rose-800 font-bold">Direct Ward/Unit Assignment Required</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-200 text-rose-950 rounded-lg text-xs font-black">
                        {filteredNurseSupervisors.filter(ns => !ns.wardId).length} NS
                      </span>
                    </div>

                    <div className="space-y-2">
                      {filteredNurseSupervisors.filter(ns => !ns.wardId).map(ns => {
                        const isChecked = selectedNsIds.includes(ns.id);
                        return (
                          <div key={ns.id} className="p-3 bg-white border border-rose-200 rounded-2xl flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedNsIds(prev => [...prev, ns.id]);
                                  } else {
                                    setSelectedNsIds(prev => prev.filter(id => id !== ns.id));
                                  }
                                }}
                                className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                              />
                              <div>
                                <div className="text-xs font-black text-slate-900">{ns.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{ns.email}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditNsModal(ns)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                                title="Edit Nurse Supervisor details"
                              >
                                <Edit3 size={13} />
                              </button>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignWardToSingleNs(ns.id, e.target.value);
                                  }
                                }}
                                defaultValue=""
                                className="px-2.5 py-1.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold outline-none cursor-pointer hover:bg-rose-200"
                              >
                                <option value="" disabled>Assign Ward...</option>
                                {assignableWardsForNs.map(w => (
                                  <option key={w.id} value={w.id}>Assign to {w.code} - {w.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: GROUPED BY HEAD NURSE (HN BENTO MATRIX) */}
          {nsViewMode === 'bento' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {assignableHnsForNs.map(hn => {
                  const assignedWard = wards.find(w => w.id === hn.wardId);
                  const assignedSupervisors = filteredNurseSupervisors.filter(ns => ns.headNurseId === hn.id);

                  return (
                    <div 
                      key={hn.id} 
                      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-cyan-300 transition"
                    >
                      <div>
                        {/* Head Nurse Header */}
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-amber-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md">
                              {hn.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                  Head Nurse (HN)
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {assignedWard?.code || 'WARD'}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{hn.name}</h4>
                              <div className="text-[11px] text-indigo-600 font-mono font-semibold">{hn.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditHnModal(hn)}
                              className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[10px] font-black uppercase transition flex items-center gap-1"
                              title="Edit Head Nurse Profile"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleOpenHnNsModal(hn)}
                              className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xl text-[10px] font-black uppercase transition flex items-center gap-1"
                              title="Manage Nurse Supervisors for this Head Nurse"
                            >
                              <Plus size={12} /> Assign NS
                            </button>
                          </div>
                        </div>

                        {/* List of Assigned Nurse Supervisors */}
                        <div className="pt-3 space-y-2">
                          <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                            <span className="flex items-center gap-1.5">
                              <span>Supervised Nurse Supervisors:</span>
                              <span className="text-[10px] font-black text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">
                                {assignedSupervisors.length} NS
                              </span>
                            </span>
                            <button
                              onClick={() => handleOpenHnNsModal(hn)}
                              className="text-[11px] font-black text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 px-2 py-0.5 rounded-lg transition border border-cyan-200 flex items-center gap-1"
                              title="Assign or reallocate Nurse Supervisors for this Head Nurse"
                            >
                              <Plus size={11} /> Allocate NS
                            </button>
                          </div>

                          {assignedSupervisors.length > 0 ? (
                            <div className="space-y-2">
                              {assignedSupervisors.map(ns => {
                                const isChecked = selectedNsIds.includes(ns.id);
                                const nsWard = wards.find(w => w.id === ns.wardId);

                                return (
                                  <div 
                                    key={ns.id} 
                                    className={`p-3 rounded-2xl border transition space-y-2 ${
                                      isChecked 
                                        ? 'bg-cyan-50/80 border-cyan-400 shadow-sm' 
                                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/60'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2.5">
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedNsIds(prev => [...prev, ns.id]);
                                            } else {
                                              setSelectedNsIds(prev => prev.filter(id => id !== ns.id));
                                            }
                                          }}
                                          className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                                        />
                                        <div>
                                          <div className="text-xs font-black text-slate-900">{ns.name}</div>
                                          <div className="text-[10px] text-slate-500 font-mono">
                                            {ns.licenseNumber || ns.email}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleOpenEditNsModal(ns)}
                                          className="p-1 text-slate-500 hover:text-cyan-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                                          title="Edit Nurse Supervisor details"
                                        >
                                          <Edit3 size={13} />
                                        </button>
                                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                                          {nsWard ? nsWard.code : 'No Ward'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Direct Ward Transfer & HN Transfer */}
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[10px]">
                                      <select
                                        value={ns.wardId || ''}
                                        onChange={(e) => handleAssignWardToSingleNs(ns.id, e.target.value)}
                                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-indigo-900 outline-none"
                                        title="Change Ward Unit"
                                      >
                                        <option value="">Choose Ward</option>
                                        {assignableWardsForNs.map(w => (
                                          <option key={w.id} value={w.id}>{w.code}</option>
                                        ))}
                                      </select>

                                      <select
                                        value={ns.headNurseId || ''}
                                        onChange={(e) => handleAssignHnToSingleNs(ns.id, e.target.value)}
                                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-amber-900 outline-none"
                                        title="Reassign to another Head Nurse"
                                      >
                                        <option value={hn.id}>HN: {hn.name}</option>
                                        <option value="">Unassign HN</option>
                                        {assignableHnsForNs.filter(h => h.id !== hn.id).map(h => (
                                          <option key={h.id} value={h.id}>Transfer to {h.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 bg-amber-50/60 border border-dashed border-amber-200 rounded-2xl text-center space-y-1.5">
                              <p className="text-xs font-bold text-amber-800">No Nurse Supervisors Assigned</p>
                              <p className="text-[11px] text-amber-700">Click below to allocate Nurse Supervisors to {hn.name}.</p>
                              <button
                                onClick={() => handleOpenHnNsModal(hn)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase shadow-sm inline-flex items-center gap-1"
                              >
                                <Plus size={13} /> Assign Supervisors
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold flex items-center gap-1">
                          <Building2 size={13} className="text-amber-600" />
                          {assignedWard?.name || 'Global'}
                        </span>
                        <button
                          onClick={() => setSelectedHnForPrivileges(hn)}
                          className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                        >
                          <Shield size={13} /> View Privileges
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* UNASSIGNED SUPERVISORS BENTO CARD */}
                {filteredNurseSupervisors.filter(ns => !ns.headNurseId).length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-amber-600 text-white rounded-2xl flex items-center justify-center font-black">
                          <AlertCircle size={22} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">Unassigned Head Nurse</h4>
                          <span className="text-[10px] text-amber-800 font-bold">Pending Head Nurse Allocation</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-200 text-amber-950 rounded-lg text-xs font-black">
                        {filteredNurseSupervisors.filter(ns => !ns.headNurseId).length} NS
                      </span>
                    </div>

                    <div className="space-y-2">
                      {filteredNurseSupervisors.filter(ns => !ns.headNurseId).map(ns => {
                        const isChecked = selectedNsIds.includes(ns.id);
                        return (
                          <div key={ns.id} className="p-3 bg-white border border-amber-200 rounded-2xl flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedNsIds(prev => [...prev, ns.id]);
                                  } else {
                                    setSelectedNsIds(prev => prev.filter(id => id !== ns.id));
                                  }
                                }}
                                className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                              />
                              <div>
                                <div className="text-xs font-black text-slate-900">{ns.name}</div>
                                <div className="text-[10px] text-slate-500">{ns.email}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditNsModal(ns)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                                title="Edit Nurse Supervisor details"
                              >
                                <Edit3 size={13} />
                              </button>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignHnToSingleNs(ns.id, e.target.value);
                                  }
                                }}
                                defaultValue=""
                                className="px-2.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold outline-none cursor-pointer hover:bg-amber-200"
                              >
                                <option value="" disabled>Assign to HN...</option>
                                {assignableHnsForNs.map(h => (
                                  <option key={h.id} value={h.id}>Assign to {h.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: FLAT REGISTRY TABLE VIEW */}
          {nsViewMode === 'table' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="py-3.5 px-4 w-10">
                        <input 
                          type="checkbox"
                          checked={selectedNsIds.length === filteredNurseSupervisors.length && filteredNurseSupervisors.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNsIds(filteredNurseSupervisors.map(n => n.id));
                            } else {
                              setSelectedNsIds([]);
                            }
                          }}
                          className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                        />
                      </th>
                      <th className="py-3.5 px-4">Nurse Supervisor (NS)</th>
                      <th className="py-3.5 px-4">Directly Assigned Ward</th>
                      <th className="py-3.5 px-4">Assigned Head Nurse (HN)</th>
                      <th className="py-3.5 px-4">License Details</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredNurseSupervisors.map(ns => {
                      const isSelected = selectedNsIds.includes(ns.id);
                      const assignedWard = wards.find(w => w.id === ns.wardId);
                      const assignedHn = headNurseUsers.find(h => h.id === ns.headNurseId);

                      return (
                        <tr key={ns.id} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                          <td className="py-3.5 px-4">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedNsIds(prev => [...prev, ns.id]);
                                } else {
                                  setSelectedNsIds(prev => prev.filter(id => id !== ns.id));
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                            />
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-cyan-700 text-white rounded-xl flex items-center justify-center font-black text-xs">
                                {ns.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 text-xs">{ns.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{ns.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Directly Assigned Ward Dropdown */}
                          <td className="py-3.5 px-4">
                            <select
                              value={ns.wardId || ''}
                              onChange={(e) => handleAssignWardToSingleNs(ns.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold outline-none border transition ${
                                assignedWard 
                                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300' 
                                  : 'bg-rose-50 text-rose-900 border-rose-300 font-black'
                              }`}
                            >
                              <option value="">⚠️ No Ward Assigned</option>
                              {assignableWardsForNs.map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.code} - {w.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Assigned Head Nurse Dropdown */}
                          <td className="py-3.5 px-4">
                            <select
                              value={ns.headNurseId || ''}
                              onChange={(e) => handleAssignHnToSingleNs(ns.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold outline-none border transition ${
                                assignedHn 
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                                  : 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                              }`}
                            >
                              <option value="">⚠️ Unassigned (Choose HN)</option>
                              {assignableHnsForNs.map(h => (
                                <option key={h.id} value={h.id}>
                                  {h.name} ({wards.find(w => w.id === h.wardId)?.code || 'HN'})
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono text-slate-700 text-[11px]">
                              {ns.licenseNumber || 'N/A'} {ns.licenseExpiry ? `(${ns.licenseExpiry})` : ''}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditNsModal(ns)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                                title="Edit Nurse Supervisor details"
                              >
                                <Edit3 size={15} />
                              </button>
                              {canManageGovernance && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Remove Nurse Supervisor appointment for "${ns.name}"?`)) {
                                      onDeleteUser(ns.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                  title="Remove Supervisor"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEADERSHIP (HEAD NURSES & SUPERVISORS) CONTROL */}
      {activeTab === 'supervisors' && (
        <div className="space-y-6">
          {/* LEVEL 2: CHIEF NURSING SERVICES (CNS) EXECUTIVE BOARD - HIDDEN IN CNS & HN ACCOUNT */}
          {!isCnsLoggedIn && !isHnLoggedIn && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-purple-500/30 text-white shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-800/40 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-purple-300 uppercase tracking-widest">
                    <Sparkles size={16} className="text-purple-400" />
                    Level 2 Executive Directorate
                  </div>
                  <h3 className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
                    Chief Nursing Services (CNS) Executives
                  </h3>
                  <p className="text-xs text-purple-200/70">
                    Overseeing clinical divisions (Excellency, Medical, Surgical). Click "Edit CNS" to update credentials, titles, licenses, contact details, and division assignments.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-purple-900/80 border border-purple-400/40 text-purple-200 rounded-xl text-xs font-black flex items-center gap-1.5">
                    <Crown size={14} className="text-purple-300" />
                    {cnsUsers.length} Active CNS Leaders
                  </span>
                  {isTopAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAddDivisionModal()}
                        className="px-3 py-1.5 bg-purple-800/90 hover:bg-purple-700 text-purple-100 rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5 uppercase tracking-wider border border-purple-400/40"
                        title="Create new clinical division"
                      >
                        <Plus size={13} /> Add Division
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddCnsModal()}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 uppercase tracking-wider border border-purple-400/40"
                      >
                        <Plus size={14} /> Add CNS
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* CNS Grid: dynamic across all clinical divisions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {effectiveDivisions.map(division => {
                  const theme = getDivisionTheme(division.colorTheme);
                  const cns = cnsUsers.find(u => (u.category || 'Medical').toLowerCase() === division.name.toLowerCase());
                  const catHeadNurses = headNurseUsers.filter(h => (h.category || (h.wardId ? wards.find(w => w.id === h.wardId)?.category : undefined) || 'Medical').toLowerCase() === division.name.toLowerCase());
                  const catWards = wards.filter(w => (w.category || 'Medical').toLowerCase() === division.name.toLowerCase());
                  const catStaff = staff.filter(s => {
                    const staffWard = wards.find(w => w.id === s.wardId);
                    return (s.category || staffWard?.category || 'Medical').toLowerCase() === division.name.toLowerCase();
                  });

                  if (cns) {
                    const cnsDcnsList = users.filter(u => 
                      (u.role === 'dcns' || u.nurseDesignation === 'DCNS') &&
                      ((u.cnsId && u.cnsId === cns.id) || (!u.cnsId && (u.category || 'Medical').toLowerCase() === division.name.toLowerCase()))
                    );

                    return (
                      <div 
                        key={cns.id} 
                        className="p-5 bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl space-y-3.5 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-purple-400 transition"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md shrink-0 ${theme.avatarBg} ring-2 ring-white/20`}>
                                {cns.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-black text-sm text-white group-hover:text-purple-200 transition">{cns.name}</h4>
                                <div className="text-[11px] font-mono text-purple-300 font-bold">{cns.email}</div>
                              </div>
                            </div>

                            {renderWardCategoryBadge(cns.category || division.name, 'sm')}
                          </div>

                          <div className="text-xs text-purple-200/90 font-medium bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-900/50">
                            {cns.jobTitle || `Chief Nursing Services (${cns.category || division.name})`}
                          </div>

                          <div className="p-3 bg-slate-950/80 border border-purple-900/60 rounded-2xl space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-purple-200/80">
                              <span className="flex items-center gap-1 font-semibold">
                                <ShieldCheck size={13} className="text-purple-400" /> Supervised Head Nurses:
                              </span>
                              <span className="font-black text-white bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                                {catHeadNurses.length} HNs
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-purple-200/80">
                              <span className="flex items-center gap-1 font-semibold">
                                <Building2 size={13} className="text-purple-400" /> Division Wards:
                              </span>
                              <span className="font-bold text-white">
                                {catWards.length} Wards
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-purple-200/80">
                              <span className="flex items-center gap-1 font-semibold">
                                <Users size={13} className="text-purple-400" /> Division Personnel:
                              </span>
                              <span className="font-bold text-white">
                                {catStaff.length} Staff
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-purple-200/80 pt-1 border-t border-purple-900/60">
                              <span className="flex items-center gap-1 font-semibold">
                                <Award size={13} className="text-purple-400" /> License:
                              </span>
                              <span className="font-mono text-[11px] text-purple-200 font-bold">
                                {cns.licenseNumber || 'Active'} {cns.licenseExpiry ? `(${cns.licenseExpiry})` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Deputy Chief Nursing Services (DCNS) under this CNS */}
                          <div className="p-3 bg-indigo-950/70 border border-indigo-900/60 rounded-2xl space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-indigo-200">
                              <span className="flex items-center gap-1 font-semibold">
                                <Users size={13} className="text-indigo-400" /> Deputy Chief (DCNS):
                              </span>
                              <span className="font-bold text-white bg-indigo-900 px-2 py-0.5 rounded border border-indigo-700">
                                {cnsDcnsList.length} Appointed
                              </span>
                            </div>

                            {cnsDcnsList.length > 0 ? (
                              <div className="space-y-1 pt-1">
                                {cnsDcnsList.map(dcns => (
                                  <div key={dcns.id} className="p-2 bg-slate-950/80 rounded-xl border border-indigo-800/40 flex items-center justify-between">
                                    <div className="min-w-0">
                                      <div className="font-bold text-white text-xs truncate">{dcns.name}</div>
                                      <div className="text-[10px] font-mono text-indigo-300 truncate">{dcns.email}</div>
                                    </div>
                                    {isTopAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => setActiveTab('hierarchy')}
                                        className="px-2 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold shrink-0 ml-2"
                                        title="Manage in Hierarchy Tree"
                                      >
                                        Manage
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-indigo-300/70 italic pt-0.5 flex items-center justify-between">
                                <span>No DCNS appointed</span>
                                {isTopAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('hierarchy')}
                                    className="text-[10px] font-bold text-indigo-300 hover:text-white underline"
                                  >
                                    + Appoint in Hierarchy
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-purple-900/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleOpenEditCnsModal(cns)}
                            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
                          >
                            <Edit3 size={14} /> Edit CNS
                          </button>
                          {isTopAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeletingCns(cns)}
                              className="py-2.5 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-md uppercase tracking-wider"
                              title={`Delete CNS ${cns.name}`}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                          {isTopAdmin && (
                            <button
                              onClick={() => setActiveTab('hierarchy')}
                              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
                              title="Manage DCNS in Hierarchy Tree"
                            >
                              <Users size={14} /> DCNS Tree
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Vacant CNS leadership for this division
                  return (
                    <div 
                      key={division.id} 
                      className="p-5 bg-slate-900/60 border-2 border-dashed border-purple-500/30 rounded-3xl space-y-3.5 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-purple-400 transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm text-slate-400 shadow-inner shrink-0">
                              {renderDivisionIcon(division.icon, 'w-5 h-5')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-sm text-slate-200">{division.name} Division</h4>
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Vacant CNS
                                </span>
                              </div>
                              <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                {division.description || `${division.name} Clinical Directorate`}
                              </div>
                            </div>
                          </div>
                          {renderWardCategoryBadge(division.name, 'sm')}
                        </div>

                        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-slate-400">
                            <span className="flex items-center gap-1 font-semibold">
                              <Building2 size={13} className="text-slate-500" /> Wards Assigned:
                            </span>
                            <span className="font-bold text-slate-200">
                              {catWards.length} Units
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400">
                            <span className="flex items-center gap-1 font-semibold">
                              <Crown size={13} className="text-slate-500" /> Head Nurses (HN):
                            </span>
                            <span className="font-bold text-slate-200">
                              {catHeadNurses.length} Leaders
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400">
                            <span className="flex items-center gap-1 font-semibold">
                              <Users size={13} className="text-slate-500" /> Division Personnel:
                            </span>
                            <span className="font-bold text-slate-200">
                              {catStaff.length} Members
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-purple-900/40 flex items-center justify-between gap-2">
                        {isTopAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenAddCnsModal(division.name)}
                            className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 uppercase tracking-wider border border-purple-400/40"
                          >
                            <Plus size={14} /> Appoint CNS
                          </button>
                        )}
                        {isTopAdmin && !['Excellency', 'Medical', 'Surgical'].includes(division.name) && (
                          <button
                            type="button"
                            onClick={() => setDeletingDivision(division)}
                            className="py-2.5 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-md uppercase tracking-wider"
                            title={`Delete Division ${division.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEVEL 3: HEAD NURSES (HN) CONTROL - HIDDEN IN HN ACCOUNT */}
          {!isHnLoggedIn && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest">
                    <ShieldCheck size={16} />
                    Head Nurse (HN) Management
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">Top Admin: Appoint & Control Head Nurses</h3>
                  <p className="text-xs text-slate-500">Appoint designated Head Nurses (HN) under clinical categories (Excellency, Medical, Surgical) to lead units and oversee Nurse Supervisors.</p>
                </div>

                {canManageGovernance && (
                  <button
                    onClick={() => setShowNewWsModal(true)}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black shadow-md transition flex items-center gap-2 uppercase tracking-wider"
                  >
                    <Plus size={16} />
                    Add Head Nurse (HN)
                  </button>
                )}
              </div>

          {/* Category Filter Pills for Head Nurses */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-500 mr-1 flex items-center gap-1.5">
                <Filter size={14} className="text-amber-600" />
                HN Category:
              </span>
              <button
                onClick={() => setHnCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  hnCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All HNs
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  hnCategoryFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {headNurseUsers.length}
                </span>
              </button>

              {effectiveDivisions.map(div => {
                const theme = getDivisionTheme(div.colorTheme);
                const isSelected = hnCategoryFilter === div.name;
                const count = headNurseUsers.filter(h => (h.category || (h.wardId ? wards.find(w => w.id === h.wardId)?.category : undefined) || 'Medical') === div.name).length;
                return (
                  <button
                    key={div.id}
                    onClick={() => setHnCategoryFilter(div.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      isSelected ? theme.activePill : theme.inactivePill
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : theme.iconColor}>
                      {renderDivisionIcon(div.icon, 'w-3 h-3')}
                    </span>
                    {div.name}
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}

              {isTopAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAddDivisionModal}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition flex items-center gap-1"
                  title="Create new clinical division"
                >
                  <Plus size={12} /> Add Division
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-slate-500">
              Showing <span className="text-slate-900 font-black">{filteredHeadNurses.length}</span> of {headNurseUsers.length} Head Nurses
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHeadNurses.map(ws => {
              const assignedWards = wards.filter(w => 
                w.headNurseId === ws.id || 
                (ws.assignedWardIds && ws.assignedWardIds.includes(w.id)) || 
                w.id === ws.wardId
              );
              const assignedWard = assignedWards[0] || wards.find(w => w.id === ws.wardId);
              const hnEffectiveCategory: WardCategory = ws.category || (assignedWard?.category) || 'Medical';
              const totalHnStaffCount = staff.filter(s => assignedWards.some(w => w.id === s.wardId)).length;
              const assignedSupervisors = nurseSupervisorUsers.filter(ns => 
                ns.headNurseId === ws.id || assignedWards.some(w => w.id === ns.wardId)
              );

              return (
                <div key={ws.id} className="p-5 bg-gradient-to-br from-amber-50/50 to-white border border-amber-200/80 rounded-3xl space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md shrink-0">
                        {ws.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{ws.name}</h4>
                        <div className="text-xs font-mono text-indigo-600 font-bold">{ws.email}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        HEAD NURSE (HN)
                      </span>
                      {renderWardCategoryBadge(hnEffectiveCategory, 'sm')}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200/80 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold flex items-center gap-1">
                        <Sparkles size={13} className="text-purple-600" />
                        HN Category:
                      </span>
                      {renderWardCategoryBadge(hnEffectiveCategory, 'sm')}
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          <Building2 size={13} className="text-amber-600" />
                          Nominated Wards / Units:
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                          assignedWards.length >= 2 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {assignedWards.length} Units Nominated {assignedWards.length >= 2 ? '(≥ 2)' : ''}
                        </span>
                      </div>

                      <div className="space-y-1.5 pl-1">
                        {assignedWards.map(w => {
                          const wardSupervisors = nurseSupervisorUsers.filter(ns => 
                            ns.wardId === w.id || 
                            w.supervisorId === ns.id || 
                            (w.assignedNsIds && w.assignedNsIds.includes(ns.id))
                          );
                          const wardStaff = staff.filter(s => s.wardId === w.id);

                          return (
                            <div key={w.id} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {renderWardCategoryBadge(w.category, 'sm')}
                                <button 
                                  onClick={() => handleInspectWardPersonnel(w.id)}
                                  className="font-extrabold text-slate-900 hover:text-indigo-600 underline decoration-dotted truncate"
                                  title="Inspect Ward Personnel"
                                >
                                  {w.name} ({w.code})
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                                <span className="text-cyan-800 bg-cyan-100/70 px-1.5 py-0.5 rounded font-bold border border-cyan-300">
                                  {wardSupervisors.length} NS
                                </span>
                                <span className="text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded font-bold">
                                  {wardStaff.length} Staff
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
                      <span className="font-semibold flex items-center gap-1">
                        <ShieldCheck size={13} className="text-cyan-600" />
                        Total Supervisors:
                      </span>
                      <span className="font-black text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                        {assignedSupervisors.length} NS Assigned Across Units
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold flex items-center gap-1">
                        <Users size={13} className="text-amber-600" />
                        Total Ward Staff:
                      </span>
                      <span className="font-bold text-slate-800">{totalHnStaffCount} Staff Members</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold flex items-center gap-1">
                        <Award size={13} className="text-amber-600" />
                        License No. & Expiry:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {ws.licenseNumber || 'N/A'} {ws.licenseExpiry ? `(${ws.licenseExpiry})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-100/80">
                    <button
                      onClick={() => handleOpenEditHnModal(ws)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Edit3 size={13} /> Edit HN
                    </button>

                    <button
                      onClick={() => handleOpenHnNsModal(ws)}
                      className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus size={13} /> Manage Nurse Supervisors ({assignedSupervisors.length})
                    </button>

                    <button
                      onClick={() => setSelectedHnForPrivileges(ws)}
                      className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Shield size={13} /> View Privileges
                    </button>

                    {canManageGovernance && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove Head Nurse appointment for "${ws.name}"?`)) {
                            onDeleteUser(ws.id);
                          }
                        }}
                        className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 ml-auto"
                      >
                        <Trash2 size={14} /> Remove HN
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          )}
        </div>
      )}

      {/* TAB 3: HOSPITAL WARDS CONTROL */}
      {activeTab === 'wards' && (
        <div className="space-y-5">
          {/* Active Ward Banner if a ward is selected */}
          {activeWardId && (
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-indigo-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Current Active Ward Focus</div>
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <span>{wards.find(w => w.id === activeWardId)?.name || activeWardId}</span>
                    <span className="text-xs font-mono bg-indigo-800/80 px-2 py-0.5 rounded border border-indigo-600/60">
                      CODE: {wards.find(w => w.id === activeWardId)?.code || 'WARD'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectWard('')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                title="Cancel active ward selection and return to all wards overview"
              >
                <XCircle size={15} />
                Cancel Active Ward
              </button>
            </div>
          )}

          {/* Category Filter Pills & Stats */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-500 mr-1 flex items-center gap-1.5">
                <Filter size={14} className="text-indigo-600" />
                Category:
              </span>
              <button
                onClick={() => setWardCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  wardCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Wards ({wards.length})
              </button>
              {effectiveDivisions.map(div => {
                const theme = getDivisionTheme(div.colorTheme);
                const isSelected = wardCategoryFilter === div.name;
                const count = wards.filter(w => (!w.category && div.name === 'Medical') || w.category === div.name).length;
                return (
                  <button
                    key={div.id}
                    onClick={() => setWardCategoryFilter(div.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      isSelected ? theme.activePill : theme.inactivePill
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : theme.iconColor}>
                      {renderDivisionIcon(div.icon, 'w-3 h-3')}
                    </span>
                    {div.name} ({count})
                  </button>
                );
              })}

              {isTopAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAddDivisionModal}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition flex items-center gap-1"
                  title="Create new clinical division"
                >
                  <Plus size={12} /> Add Division
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-slate-500">
              Showing <span className="font-black text-slate-900">{filteredWards.length}</span> of {wards.length} units
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWards.map(ward => {
              const isActive = ward.id === activeWardId;
              const wardStaffList = staff.filter(s => !s.wardId || s.wardId === ward.id);
              const wardStaffCount = wardStaffList.length;
              const supervisor = headNurseUsers.find(u => u.wardId === ward.id || u.id === ward.supervisorId);

              // Find assigned Nurse Supervisors (NS) for this ward
              const assignedNsUsers = nurseSupervisorUsers.filter(ns => 
                ns.wardId === ward.id || 
                (ns.assignedWardIds && ns.assignedWardIds.includes(ward.id)) ||
                (supervisor && ns.headNurseId === supervisor.id) ||
                (ward.assignedNsIds && ward.assignedNsIds.includes(ns.id))
              );

              const assignedNsStaff = wardStaffList.filter(s => 
                s.isWardSupervisor || 
                s.name.trim().startsWith('WS') || 
                s.name.trim().startsWith('(WS)') || 
                s.name.trim().startsWith('NS') || 
                s.name.trim().startsWith('(NS)')
              );

              const allNsNames = Array.from(new Set([
                ...assignedNsUsers.map(u => u.name),
                ...assignedNsStaff.map(s => s.name.replace(/^(\(WS\)|\(NS\)|WS|NS)\s*/i, '').trim()),
                ...(ward.nurseSupervisorName ? [ward.nurseSupervisorName] : []),
                ...(ward.nsName ? [ward.nsName] : [])
              ])).filter(Boolean);

              const nsDisplayName = allNsNames.length > 0 ? allNsNames.join(', ') : 'Not Assigned';

              return (
                <div 
                  key={ward.id}
                  className={`p-6 rounded-3xl border transition-all space-y-4 relative overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-b from-indigo-50/80 to-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                      <CheckCircle2 size={10} /> Active Selected Ward
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest bg-indigo-100/70 px-2 py-0.5 rounded-md">
                          WARD CODE: {ward.code}
                        </span>
                        {renderWardCategoryBadge(ward.category, 'sm')}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mt-1.5">{ward.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {ward.description || 'Specialized clinical care unit'}
                      </p>
                    </div>
                  </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold flex items-center gap-1">
                      <ShieldCheck size={14} className="text-indigo-600" />
                      Head Nurse (HN):
                    </span>
                    <span className="font-bold text-slate-900 max-w-[170px] truncate text-right">
                      {supervisor ? supervisor.name : (ward.supervisorName || 'Not Assigned')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold flex items-center gap-1">
                      <UserCheck size={14} className="text-emerald-600" />
                      Nurse Supervisor (NS):
                    </span>
                    <span className={`font-bold max-w-[170px] truncate text-right ${allNsNames.length > 0 ? 'text-emerald-950 font-black' : 'text-slate-500 font-medium'}`}>
                      {nsDisplayName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 pt-0.5 border-t border-slate-200/60">
                    <span className="font-semibold flex items-center gap-1">
                      <Users size={14} className="text-indigo-600" />
                      Assigned Personnel:
                    </span>
                    <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      {wardStaffCount} Staff Members
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditWardModal(ward)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 uppercase"
                  >
                    <Edit3 size={13} />
                    Edit Ward Info
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {isActive ? (
                      <>
                        <div className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-sm flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          Active Ward
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectWard('')}
                          className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1"
                          title="Cancel active ward selection"
                        >
                          <XCircle size={14} />
                          Cancel Active Ward
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onSelectWard(ward.id)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                      >
                        <ArrowRightLeft size={14} />
                        Select Active Ward
                      </button>
                    )}

                    <button
                      onClick={() => handleInspectWardPersonnel(ward.id)}
                      className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 uppercase"
                      title="Inspect Staff Names & Details for this Ward"
                    >
                      <Users size={14} />
                      Staff ({wardStaffCount})
                    </button>
                  </div>

                  {onNavigateToCalendar && (
                    <button
                      onClick={() => {
                        onSelectWard(ward.id);
                        onNavigateToCalendar();
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 uppercase"
                    >
                      <Calendar size={14} className="text-indigo-600" />
                      {currentUserRole === 'admin' || isCnsLoggedIn || isHnLoggedIn ? 'View On-Call Roster' : 'View Rota Calendar'}
                    </button>
                  )}

                  {canManageGovernance && wards.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove the ward "${ward.name}"?`)) {
                          onDeleteWard(ward.id);
                        }
                      }}
                      className="w-full py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Trash2 size={13} /> Delete Ward
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* TAB 4: WARD MANPOWER OVERVIEW & STAFF DIRECTORY */}
      {activeTab === 'manpower' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                <Users size={16} />
                Hospital Staff Directory & Ward Details
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {isHnLoggedIn ? 'Clinical Staff Directory & Details' : 'Main Administrator: Search & View Personnel Details'}
              </h3>
              <p className="text-xs text-slate-500">
                Search by name, ID, contact details, clinical rank, or ward across the hospital. Inspect complete personal profiles for any staff member.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowManpowerPrintModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-emerald-600/20 shrink-0 cursor-pointer"
            >
              <Printer size={15} />
              <span>Print Manpower Summary</span>
            </button>
          </div>

          {/* Category Filter Pills for Manpower & Ward Units */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-500 mr-1 flex items-center gap-1.5">
                <Filter size={14} className="text-emerald-600" />
                Filter by Category:
              </span>
              <button
                type="button"
                onClick={() => {
                  setManpowerCategoryFilter('all');
                  setManpowerFilterWardId('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  manpowerCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All Categories ({staff.length} Staff)
              </button>
              {effectiveDivisions.map(div => {
                const theme = getDivisionTheme(div.colorTheme);
                const isSelected = manpowerCategoryFilter === div.name;
                const count = staff.filter(s => {
                  const w = wards.find(wd => wd.id === (s.wardId || wards[0]?.id));
                  return (!w?.category && div.name === 'Medical') || w?.category === div.name;
                }).length;
                return (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => {
                      setManpowerCategoryFilter(div.name);
                      setManpowerFilterWardId('all');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      isSelected ? theme.activePill : theme.inactivePill
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : theme.iconColor}>
                      {renderDivisionIcon(div.icon, 'w-3 h-3')}
                    </span>
                    {div.name} ({count})
                  </button>
                );
              })}

              {isTopAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAddDivisionModal}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition flex items-center gap-1"
                  title="Create new clinical division"
                >
                  <Plus size={12} /> Add Division
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-slate-500">
              Showing <span className="font-black text-slate-900">{filteredStaffMembers.length}</span> staff members
            </div>
          </div>

          {/* Quick Ward Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {wards.filter(w => manpowerCategoryFilter === 'all' || (w.category || 'Medical') === manpowerCategoryFilter).map(ward => {
              const wardStaff = staff.filter(s => !s.wardId || s.wardId === ward.id);
              const isSelected = manpowerFilterWardId === ward.id;
              const hnUser = headNurseUsers.find(u => u.wardId === ward.id || u.id === ward.supervisorId);
              const nsUsers = nurseSupervisorUsers.filter(u => u.wardId === ward.id || (hnUser && u.headNurseId === hnUser.id) || (ward.assignedNsIds && ward.assignedNsIds.includes(u.id)));
              const nsName = nsUsers.length > 0 ? nsUsers.map(u => u.name).join(', ') : (ward.nurseSupervisorName || ward.nsName || 'Unassigned');

              return (
                <div 
                  key={ward.id} 
                  onClick={() => setManpowerFilterWardId(isSelected ? 'all' : ward.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {ward.code}
                      </span>
                      {renderWardCategoryBadge(ward.category, 'sm')}
                    </div>
                    <span className="text-lg font-black text-slate-900">{wardStaff.length} <span className="text-xs font-normal text-slate-500">Staff</span></span>
                  </div>
                  <div className="font-extrabold text-xs text-slate-800 truncate">{ward.name}</div>
                  <div className="text-[10px] font-medium text-slate-500 flex flex-col gap-0.5 pt-1 border-t border-slate-200/50">
                    <div className="truncate"><span className="font-bold text-slate-700">HN:</span> {hnUser ? hnUser.name : (ward.supervisorName || 'None')}</div>
                    <div className="truncate"><span className="font-bold text-emerald-800">NS:</span> {nsName}</div>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 flex justify-between pt-0.5">
                    <span>Seniors: {wardStaff.filter(s => s.isSenior).length}</span>
                    <span>MSAs: {wardStaff.filter(s => s.isHa).length}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              {/* Search Field */}
              <div className="relative flex-1">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff name, ID (e.g. S001), email, phone, rank, or ward..."
                  className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 font-bold"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Ward Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-600">Ward:</span>
                <select
                  value={manpowerFilterWardId}
                  onChange={(e) => setManpowerFilterWardId(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Hospital Wards ({staff.length})</option>
                  {effectiveDivisions.map(div => {
                    const divWards = wards.filter(w => (!w.category && div.name === 'Medical') || w.category === div.name);
                    if (divWards.length === 0) return null;
                    return (
                      <optgroup key={div.id} label={`${div.name} Units`}>
                        {divWards.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({staff.filter(s => !s.wardId || s.wardId === w.id).length})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {/* Rank Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-600">Rank:</span>
                <select
                  value={manpowerRankFilter}
                  onChange={(e) => setManpowerRankFilter(e.target.value as any)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Ranks</option>
                  <option value="senior">Senior Staff Nurses</option>
                  <option value="junior">Junior Staff Nurses</option>
                  <option value="ha">Medical Service Aids (MSA)</option>
                  <option value="ws">Ward Supervisors (WS)</option>
                </select>
              </div>

              {/* View Toggle & Print Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300">
                  <button
                    onClick={() => setManpowerViewMode('table')}
                    className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      manpowerViewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Table View"
                  >
                    <List size={15} />
                  </button>
                  <button
                    onClick={() => setManpowerViewMode('grid')}
                    className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      manpowerViewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Card Grid View"
                  >
                    <Grid size={15} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowManpowerPrintModal(true)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  title="Print formatted manpower summary and staff registry report"
                >
                  <Printer size={14} className="text-emerald-700" />
                  <span>Print Summary</span>
                </button>
              </div>

            </div>
          </div>

          {/* TABLE VIEW */}
          {manpowerViewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4">Staff ID</th>
                      <th className="py-3.5 px-4">Full Name</th>
                      <th className="py-3.5 px-4">Clinical Rank</th>
                      <th className="py-3.5 px-4">Ward Unit</th>
                      <th className="py-3.5 px-4">License No.</th>
                      <th className="py-3.5 px-4">License Expiry</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaffMembers.map(s => {
                      const ward = wards.find(w => w.id === s.wardId) || wards[0];
                      const isHa = !!s.isHa || s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)');
                      const isWs = !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)');

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition group">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">
                            {s.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              {s.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.email || `${s.id.toLowerCase()}@hospital.org`}</div>
                          </td>
                          <td className="py-3 px-4">
                            {isWs ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-black">
                                Ward Supervisor
                              </span>
                            ) : isHa ? (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold">
                                Medical Service Aid
                              </span>
                            ) : s.isSenior ? (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-[10px] font-bold">
                                Senior Staff Nurse
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium">
                                Junior Staff Nurse
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {ward?.code || 'ICU'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {s.licenseNumber || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {s.licenseExpiry || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleOpenStaffDetails(s)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl text-xs font-black uppercase transition border border-emerald-200 hover:border-emerald-600 inline-flex items-center gap-1 shadow-sm"
                            >
                              <Eye size={13} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GRID VIEW */}
          {manpowerViewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaffMembers.map(s => {
                const ward = wards.find(w => w.id === s.wardId) || wards[0];
                const isHa = !!s.isHa || s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)');
                const isWs = !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)');

                return (
                  <div 
                    key={s.id}
                    className="p-5 bg-slate-50 hover:bg-white rounded-3xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          ID: {s.id}
                        </span>
                        <span className="text-[10px] font-mono font-black uppercase text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                          {ward?.code || 'ICU'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{s.name}</h4>
                        <div className="text-[11px] text-slate-500 font-mono truncate">{s.email || `${s.id.toLowerCase()}@hospital.org`}</div>
                      </div>

                      <div>
                        {isWs ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-black">
                            Ward Supervisor
                          </span>
                        ) : isHa ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold">
                            Medical Service Aid
                          </span>
                        ) : s.isSenior ? (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-[10px] font-bold">
                            Senior Staff Nurse
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-medium">
                            Junior Staff Nurse
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-1 text-[11px] font-mono text-slate-600">
                        <div className="flex justify-between">
                          <span>License:</span>
                          <span className="font-bold text-slate-900">{s.licenseNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expiry:</span>
                          <span className="text-slate-800">{s.licenseExpiry || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenStaffDetails(s)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Eye size={13} /> View Full Profile
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: 4-TIER INSTITUTIONAL HIERARCHY TREE */}
      {activeTab === 'hierarchy' && (
        <HierarchyChart 
          users={users} 
          wards={wards} 
          staff={staff} 
          activeWardId={activeWardId} 
          onCreateUser={onCreateUser}
          onUpdateUser={onUpdateUser}
          onDeleteUser={onDeleteUser}
          onAssignHeadNurseToSupervisors={onAssignHeadNurseToSupervisors}
          currentUserRole={currentUserRole}
          currentUser={currentUser}
          divisions={divisions}
          onCreateDivision={onCreateDivision}
          onDeleteDivision={onDeleteDivision}
        />
      )}

      {/* MODAL: ASSIGN NURSE SUPERVISORS TO SPECIFIC HEAD NURSE */}
      {hnModalForNsAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 text-white rounded-2xl flex items-center justify-center font-black text-sm">
                  {hnModalForNsAssignment.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Head Nurse Assignment
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    Assign Nurse Supervisors to {hnModalForNsAssignment.name}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setHnModalForNsAssignment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 font-black text-xs text-amber-900">
                <ShieldCheck size={14} className="text-amber-700" />
                <span>Multi-Supervisor Delegation Structure</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                A Head Nurse can oversee multiple Nurse Supervisors simultaneously across clinical units. Selected supervisors report directly to <strong>{hnModalForNsAssignment.name}</strong>.
              </p>
            </div>

            {/* Search and Batch Selector Controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={hnModalSearch}
                    onChange={(e) => setHnModalSearch(e.target.value)}
                    placeholder="Search supervisors by name, ward, license, or email..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500"
                  />
                  {hnModalSearch && (
                    <button
                      onClick={() => setHnModalSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = nurseSupervisorUsers.filter(ns => {
                        if (!hnModalSearch.trim()) return true;
                        const q = hnModalSearch.toLowerCase();
                        const w = wards.find(ward => ward.id === ns.wardId);
                        return (
                          ns.name.toLowerCase().includes(q) ||
                          ns.email.toLowerCase().includes(q) ||
                          (ns.licenseNumber || '').toLowerCase().includes(q) ||
                          (w && (w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q)))
                        );
                      });
                      setSelectedNsIdsInHnModal(Array.from(new Set([...selectedNsIdsInHnModal, ...filtered.map(f => f.id)])));
                    }}
                    className="px-2.5 py-2 bg-cyan-100/70 hover:bg-cyan-200/80 text-cyan-900 rounded-xl text-[10px] font-black uppercase transition"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNsIdsInHnModal([]);
                    }}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] px-1 font-bold text-slate-500">
                <span>Currently Selected: <strong className="text-cyan-800 font-black">{selectedNsIdsInHnModal.length}</strong> Nurse Supervisors</span>
                <span>Total Registered: {nurseSupervisorUsers.length} NS</span>
              </div>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50 max-h-[300px] overflow-y-auto">
              {(() => {
                const filteredList = assignableNsUsers.filter(ns => {
                  if (!hnModalSearch.trim()) return true;
                  const q = hnModalSearch.toLowerCase().trim();
                  const ward = wards.find(w => w.id === ns.wardId);
                  const currentHn = headNurseUsers.find(h => h.id === ns.headNurseId);
                  return (
                    ns.name.toLowerCase().includes(q) ||
                    ns.email.toLowerCase().includes(q) ||
                    (ns.licenseNumber || '').toLowerCase().includes(q) ||
                    (ward && (ward.name.toLowerCase().includes(q) || ward.code.toLowerCase().includes(q))) ||
                    (currentHn && currentHn.name.toLowerCase().includes(q))
                  );
                });

                if (filteredList.length === 0) {
                  return (
                    <div className="text-center py-6 text-xs text-slate-500">
                      {nurseSupervisorUsers.length === 0 
                        ? 'No Nurse Supervisors registered in the hospital.' 
                        : `No Nurse Supervisors matching "${hnModalSearch}".`}
                    </div>
                  );
                }

                return filteredList.map(ns => {
                  const isChecked = selectedNsIdsInHnModal.includes(ns.id);
                  const isAssignedToOtherHn = ns.headNurseId && ns.headNurseId !== hnModalForNsAssignment.id;
                  const currentHnName = headNurseUsers.find(h => h.id === ns.headNurseId)?.name;
                  const ward = wards.find(w => w.id === ns.wardId);

                  return (
                    <label 
                      key={ns.id} 
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                        isChecked 
                          ? 'bg-cyan-50 border-cyan-400 shadow-sm ring-1 ring-cyan-400/30' 
                          : 'bg-white border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNsIdsInHnModal(prev => [...prev, ns.id]);
                            } else {
                              setSelectedNsIdsInHnModal(prev => prev.filter(id => id !== ns.id));
                            }
                          }}
                          className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{ns.name}</span>
                            {ward ? (
                              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                                {ward.code} ({ward.name})
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400">No Ward Station</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {ns.email} {ns.licenseNumber ? `• ${ns.licenseNumber}` : ''}
                          </div>
                        </div>
                      </div>

                      {isAssignedToOtherHn ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                          Transfer from: {currentHnName}
                        </span>
                      ) : isChecked ? (
                        <span className="text-[10px] font-black text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded border border-cyan-300 shrink-0">
                          Assigned to this HN
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                          Unassigned HN
                        </span>
                      )}
                    </label>
                  );
                });
              })()}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHnModalForNsAssignment(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveHnNsModal}
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black uppercase shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                Save Assignments ({selectedNsIdsInHnModal.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIRECTLY ASSIGN NURSE SUPERVISORS TO SPECIFIC WARD / UNIT */}
      {wardModalForNsAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-sm">
                  {wardModalForNsAssignment.code}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                    Direct Ward Assignment
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    Allocate Nurse Supervisors to {wardModalForNsAssignment.name}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setWardModalForNsAssignment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Check the Nurse Supervisors who are stationed directly in <strong>{wardModalForNsAssignment.name} ({wardModalForNsAssignment.code})</strong>. Each supervisor will be assigned to this clinical unit.
            </p>

            <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50 max-h-[320px] overflow-y-auto">
              {assignableNsUsers.length > 0 ? (
                assignableNsUsers.map(ns => {
                  const isChecked = selectedNsIdsInWardModal.includes(ns.id);
                  const isAssignedToOtherWard = ns.wardId && ns.wardId !== wardModalForNsAssignment.id;
                  const currentWardName = wards.find(w => w.id === ns.wardId)?.name;
                  const supervisingHn = headNurseUsers.find(h => h.id === ns.headNurseId);

                  return (
                    <label 
                      key={ns.id} 
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                        isChecked 
                          ? 'bg-indigo-50 border-indigo-400 shadow-sm' 
                          : 'bg-white border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNsIdsInWardModal(prev => [...prev, ns.id]);
                            } else {
                              setSelectedNsIdsInWardModal(prev => prev.filter(id => id !== ns.id));
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span>{ns.name}</span>
                            {supervisingHn && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-normal">
                                HN: {supervisingHn.name}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{ns.email}</div>
                        </div>
                      </div>

                      {isAssignedToOtherWard ? (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Currently in: {currentWardName}
                        </span>
                      ) : isChecked ? (
                        <span className="text-[10px] font-black text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                          Assigned to this Ward
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          Unassigned Ward
                        </span>
                      )}
                    </label>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  No Nurse Supervisors found.
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWardModalForNsAssignment(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWardNsModal}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                Save Ward Assignments ({selectedNsIdsInWardModal.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APPOINT NEW NURSE SUPERVISOR (NS) */}
      {showNewNsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserPlus size={20} className="text-cyan-600" />
                Appoint Nurse Supervisor (NS)
              </h3>
              <button 
                onClick={() => setShowNewNsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newNsName} 
                  onChange={(e) => setNewNsName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Registered Hospital Email</label>
                <input 
                  type="email" 
                  value={newNsEmail} 
                  onChange={(e) => setNewNsEmail(e.target.value)}
                  placeholder="e.g. rachel.ns@hospital.org"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Directly Assigned Ward / Clinical Unit</label>
                <select
                  value={newNsWardId}
                  onChange={(e) => {
                    const selectedWardId = e.target.value;
                    setNewNsWardId(selectedWardId);
                    const matchingHn = headNurseUsers.find(h => h.wardId === selectedWardId);
                    if (matchingHn) {
                      setNewNsHeadNurseId(matchingHn.id);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {assignableWardsForNs.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              {/* Assign to Head Nurse Selector */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Assign to Head Nurse (HN)
                </label>
                <select
                  value={newNsHeadNurseId}
                  onChange={(e) => setNewNsHeadNurseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cyan-50 border border-cyan-300 rounded-xl text-xs font-black text-cyan-950 outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">None (Assign later)</option>
                  {assignableHnsForNs.map(hn => {
                    const ward = wards.find(w => w.id === hn.wardId);
                    return (
                      <option key={hn.id} value={hn.id}>
                        {hn.name} ({ward?.code || 'Ward'} Lead)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">License No.</label>
                  <input 
                    type="text" 
                    value={newNsLicenseNumber} 
                    onChange={(e) => setNewNsLicenseNumber(e.target.value)}
                    placeholder="e.g. NUR-NS-9101"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={newNsLicenseExpiry} 
                    onChange={(e) => setNewNsLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewNsModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black uppercase shadow-md"
                >
                  Appoint Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STAFF MEMBER PERSONAL PROFILE */}
      {selectedStaffDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md">
                  {selectedStaffDetails.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-bold">
                      ID: {selectedStaffDetails.id}
                    </span>
                    {selectedStaffDetails.isSenior ? (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-black uppercase tracking-wider">
                        Senior
                      </span>
                    ) : selectedStaffDetails.isHa ? (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-black uppercase tracking-wider">
                        MSA
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">{selectedStaffDetails.name}</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStaffDetails(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Profile Grid */}
            <div className="space-y-4 text-xs">
              
              {/* Clinical Role and Ward */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Institutional Placement</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">Assigned Ward:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {wards.find(w => w.id === selectedStaffDetails.wardId)?.name || 'General Ward'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Designation / Title:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {selectedStaffDetails.jobTitle || (selectedStaffDetails.isHa ? 'Medical Service Aid' : selectedStaffDetails.isSenior ? 'Senior Staff Nurse' : 'Staff Nurse')}
                    </span>
                  </div>
                </div>
              </div>

              {/* License Details */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Award size={14} className="text-emerald-600" /> Nursing License & Accreditation
                  </div>
                  <button
                    type="button"
                    onClick={() => setLicenseCardModalStaff(selectedStaffDetails)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 shadow-xs"
                    title="View official digital License Card picture"
                  >
                    <CreditCard size={11} />
                    {selectedStaffDetails.licenseCardUrl ? 'View License Card' : 'Inspect Card'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">License Number:</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedStaffDetails.licenseNumber || 'Not Registered'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Expiry Date:</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedStaffDetails.licenseExpiry || 'N/A'}</span>
                  </div>
                </div>

                {selectedStaffDetails.licenseCardUrl && (
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" /> Verified License Card Picture Attached
                    </span>
                    <button
                      type="button"
                      onClick={() => setLicenseCardModalStaff(selectedStaffDetails)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Enlarge Card
                    </button>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Direct Contact Details</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5"><Mail size={13} /> Email:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-900 font-bold">{selectedStaffDetails.email || `${selectedStaffDetails.id.toLowerCase()}@hospital.org`}</span>
                      <button 
                        onClick={() => copyToClipboard(selectedStaffDetails.email || `${selectedStaffDetails.id.toLowerCase()}@hospital.org`, 'email')}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5"><Phone size={13} /> Phone:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-900 font-bold">{selectedStaffDetails.phone || 'N/A'}</span>
                      {selectedStaffDetails.phone && (
                        <button 
                          onClick={() => copyToClipboard(selectedStaffDetails.phone || '', 'phone')}
                          className="p-1 text-slate-400 hover:text-slate-600"
                          title="Copy phone"
                        >
                          {copiedField === 'phone' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setSelectedStaffDetails(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md"
              >
                Close Personal Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: HEAD NURSE (HN) PRIVILEGE & PERMISSION INSPECTOR */}
      {selectedHnForPrivileges && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-600 text-white rounded-2xl flex items-center justify-center font-black text-base shadow-md">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-300">
                      HEAD NURSE (HN) ROLE PROFILE
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      ID: {selectedHnForPrivileges.id}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{selectedHnForPrivileges.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedHnForPrivileges.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedHnForPrivileges(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Controlled Ward Scope */}
            {(() => {
              const assignedWard = wards.find(w => w.id === selectedHnForPrivileges.wardId);
              const managedStaff = staff.filter(s => s.wardId === selectedHnForPrivileges.wardId);
              const assignedSupervisors = nurseSupervisorUsers.filter(ns => ns.headNurseId === selectedHnForPrivileges.id);
              const snCount = managedStaff.filter(s => !s.isHa).length;
              const haCount = managedStaff.filter(s => s.isHa).length;

              return (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Building2 size={15} className="text-amber-700" /> Assigned Clinical Jurisdiction
                    </div>
                    <span className="text-xs font-mono font-black text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-md">
                      {assignedWard ? `${assignedWard.code} UNIT` : 'GLOBAL / UNASSIGNED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Supervisors (NS)</div>
                      <div className="text-xs font-black text-cyan-700">{assignedSupervisors.length} Assigned NS</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Staff Nurses (SN)</div>
                      <div className="text-xs font-black text-indigo-700">{snCount} Nurses</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Medical Service Aids</div>
                      <div className="text-xs font-black text-purple-700">{haCount} MSAs</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Privilege Matrix Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Shield size={16} className="text-amber-600" />
                Active Privilege Capabilities Matrix
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Privilege 1: Roster Generation */}
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl mt-0.5">
                    <Sparkles size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900">AI Shift Roster Generation</span>
                      <span className="text-[9px] font-black bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">ENABLED</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Authorized to configure shift quotas, off-day limits, and run the automated constraint-solver for ward duty rosters.
                    </p>
                  </div>
                </div>

                {/* Privilege 2: Duty Exchanges & Swaps Approval */}
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl mt-0.5">
                    <ArrowRightLeft size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900">Duty Swap & Leave Approval</span>
                      <span className="text-[9px] font-black bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">ENABLED</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Sole clinical authority to approve or refuse shift transfers, peer exchanges, and leave requests submitted by ward staff.
                    </p>
                  </div>
                </div>

                {/* Privilege 3: Schedule Deployment */}
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl mt-0.5">
                    <Calendar size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900">Monthly Schedule Deployment</span>
                      <span className="text-[9px] font-black bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">ENABLED</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Authorized to publish and lock the next month's duty roster for ward visibility and hospital dispatch.
                    </p>
                  </div>
                </div>

                {/* Privilege 4: Staff Nurse Assignment */}
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl mt-0.5">
                    <Users size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900">Nurse Supervisor & Team Leading</span>
                      <span className="text-[9px] font-black bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">ENABLED</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Oversees assigned Nurse Supervisors (NS), Staff Nurses (SN), and Medical Service Aids (MSA) in the ward unit.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedHnForPrivileges(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase transition"
              >
                Close Privileges
              </button>
              {canManageGovernance && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Revoke Head Nurse appointment for "${selectedHnForPrivileges.name}"?`)) {
                      onDeleteUser(selectedHnForPrivileges.id);
                      setSelectedHnForPrivileges(null);
                    }
                  }}
                  className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={15} /> Revoke HN Appointment
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADD HEAD NURSE (HN) */}
      {showNewWsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck size={20} className="text-amber-600" />
                Appoint Head Nurse (HN)
              </h3>
              <button 
                onClick={() => setShowNewWsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Head Nurse Full Name</label>
                <input 
                  type="text" 
                  value={newWsName} 
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Registered Hospital Email</label>
                <input 
                  type="email" 
                  value={newWsEmail} 
                  onChange={(e) => setNewWsEmail(e.target.value)}
                  placeholder="e.g. david.hn@hospital.org"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Assign to Ward Unit</label>
                <select
                  value={newWsWardId}
                  onChange={(e) => {
                    const wid = e.target.value;
                    setNewWsWardId(wid);
                    const selWard = wards.find(w => w.id === wid);
                    if (selWard?.category) {
                      setNewWsCategory(selWard.category);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                >
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code}) - {w.category || 'Medical'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Head Nurse Clinical Category / Division
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {effectiveDivisions.map(div => {
                    const theme = getDivisionTheme(div.colorTheme);
                    const isSelected = newWsCategory === div.name;
                    return (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => setNewWsCategory(div.name)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          isSelected
                            ? `${theme.buttonBorder} font-bold`
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span className={theme.iconColor}>
                            {renderDivisionIcon(div.icon, 'w-3.5 h-3.5')}
                          </span>
                          <span className="truncate">{div.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight truncate">
                          {div.description || `${div.name} Division`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Nursing License No.</label>
                  <input 
                    type="text" 
                    value={newWsLicenseNumber} 
                    onChange={(e) => setNewWsLicenseNumber(e.target.value)}
                    placeholder="e.g. NUR-HN-8012"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={newWsLicenseExpiry} 
                    onChange={(e) => setNewWsLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewWsModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase shadow-md"
                >
                  Appoint Head Nurse (HN)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW WARD */}
      {showNewWardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building2 size={20} className="text-indigo-600" />
                Create New Hospital Ward
              </h3>
              <button 
                onClick={() => setShowNewWardModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Ward Name</label>
                <input 
                  type="text" 
                  value={newWardName} 
                  onChange={(e) => setNewWardName(e.target.value)}
                  placeholder="e.g. Coronary Care Unit (CCU)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Ward Short Code</label>
                <input 
                  type="text" 
                  value={newWardCode} 
                  onChange={(e) => setNewWardCode(e.target.value)}
                  placeholder="e.g. CCU"
                  maxLength={5}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Ward Category / Clinical Division
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {effectiveDivisions.map(div => {
                    const theme = getDivisionTheme(div.colorTheme);
                    const isSelected = newWardCategory === div.name;
                    return (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => setNewWardCategory(div.name)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          isSelected
                            ? `${theme.buttonBorder} font-bold`
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span className={theme.iconColor}>
                            {renderDivisionIcon(div.icon, 'w-3.5 h-3.5')}
                          </span>
                          <span className="truncate">{div.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight truncate">
                          {div.description || `${div.name} Division`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Description / Notes</label>
                <textarea 
                  value={newWardDesc} 
                  onChange={(e) => setNewWardDesc(e.target.value)}
                  placeholder="e.g. 24/7 Cardiac intensive care unit with 12 beds"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Assign Head Nurse (HN)</label>
                <select
                  value={newWardSupervisorId}
                  onChange={(e) => setNewWardSupervisorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None (Assign later)</option>
                  {headNurseUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewWardModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase shadow-md"
                >
                  Create Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT WARD INFORMATION */}
      {editingWard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit3 size={20} className="text-indigo-600" />
                Edit Ward Information
              </h3>
              <button 
                onClick={() => setEditingWard(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditWard} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Ward Name</label>
                <input 
                  type="text" 
                  value={editWardName} 
                  onChange={(e) => setEditWardName(e.target.value)}
                  placeholder="e.g. Intensive Care Unit (ICU)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Ward Short Code</label>
                <input 
                  type="text" 
                  value={editWardCode} 
                  onChange={(e) => setEditWardCode(e.target.value)}
                  placeholder="e.g. ICU"
                  maxLength={5}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Ward Category / Clinical Division
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {effectiveDivisions.map(div => {
                    const theme = getDivisionTheme(div.colorTheme);
                    const isSelected = editWardCategory === div.name;
                    return (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => setEditWardCategory(div.name)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          isSelected
                            ? `${theme.buttonBorder} font-bold`
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span className={theme.iconColor}>
                            {renderDivisionIcon(div.icon, 'w-3.5 h-3.5')}
                          </span>
                          <span className="truncate">{div.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight truncate">
                          {div.description || `${div.name} Division`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Description / Notes</label>
                <textarea 
                  value={editWardDesc} 
                  onChange={(e) => setEditWardDesc(e.target.value)}
                  placeholder="Ward clinical scope and unit notes..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Assign Head Nurse (HN)</label>
                <select
                  value={editWardSupervisorId}
                  onChange={(e) => setEditWardSupervisorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None (Unassigned)</option>
                  {headNurseUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWard(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CHIEF NURSING SERVICES (CNS) */}
      {editingCns && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-purple-100 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Edit Chief Nursing Services (CNS)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Level 2 Clinical Division Executive Leadership</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingCns(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditCns} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Executive Full Name</label>
                <input 
                  type="text" 
                  value={editCnsName} 
                  onChange={(e) => setEditCnsName(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Registered Executive Email</label>
                <input 
                  type="email" 
                  value={editCnsEmail} 
                  onChange={(e) => setEditCnsEmail(e.target.value)}
                  placeholder="e.g. cns.eleanor@hospital.org"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Executive Job Title</label>
                <input 
                  type="text" 
                  value={editCnsJobTitle} 
                  onChange={(e) => setEditCnsJobTitle(e.target.value)}
                  placeholder="e.g. Chief Nursing Services (Excellency)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Clinical Category Division
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {effectiveDivisions.map(div => {
                    const theme = getDivisionTheme(div.colorTheme);
                    const isSelected = editCnsCategory === div.name;
                    return (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => {
                          setEditCnsCategory(div.name);
                          if (!editCnsJobTitle || editCnsJobTitle.includes('Chief Nursing Services')) {
                            setEditCnsJobTitle(`Chief Nursing Services (${div.name})`);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          isSelected
                            ? `${theme.buttonBorder} font-bold`
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span className={theme.iconColor}>
                            {renderDivisionIcon(div.icon, 'w-3.5 h-3.5')}
                          </span>
                          <span className="truncate">{div.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight truncate">
                          {div.description || `${div.name} Division`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Nursing License No.</label>
                  <input 
                    type="text" 
                    value={editCnsLicenseNumber} 
                    onChange={(e) => setEditCnsLicenseNumber(e.target.value)}
                    placeholder="e.g. CNS-LIC-901"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">License Expiry Date</label>
                  <input 
                    type="date" 
                    value={editCnsLicenseExpiry} 
                    onChange={(e) => setEditCnsLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Direct Phone / Hospital Ext.</label>
                <input 
                  type="text" 
                  value={editCnsPhone} 
                  onChange={(e) => setEditCnsPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-4401"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Division Scope Information */}
              {(() => {
                const catHeadNurses = headNurseUsers.filter(h => (h.category || (h.wardId ? wards.find(w => w.id === h.wardId)?.category : undefined) || 'Medical') === editCnsCategory);
                const catWards = wards.filter(w => (w.category || 'Medical') === editCnsCategory);
                return (
                  <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2 text-xs">
                    <div className="font-black text-purple-950 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-purple-700" />
                        {editCnsCategory} Division Head Nurses ({catHeadNurses.length})
                      </span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                        {catWards.length} Wards Assigned
                      </span>
                    </div>

                    {catHeadNurses.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {catHeadNurses.map(h => (
                          <span key={h.id} className="text-[10px] font-bold bg-white text-slate-800 border border-purple-300 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <span>{h.name}</span>
                            <span className="text-[9px] text-purple-700 font-mono">({h.email})</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">No Head Nurses currently registered in this division.</p>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {isTopAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingCns(editingCns);
                    }}
                    className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-black uppercase transition flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Delete CNS
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCns(null)}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black uppercase shadow-md flex items-center gap-1.5 transition"
                  >
                    <Save size={14} /> Save CNS Profile
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CHIEF NURSING SERVICES (CNS) */}
      {showNewCnsModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-purple-100 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Appoint Chief Nursing Services (CNS)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Level 2 Clinical Division Executive Leadership</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewCnsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCnsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Executive Full Name *</label>
                <input 
                  type="text" 
                  value={newCnsName} 
                  onChange={(e) => setNewCnsName(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance, DNP, RN"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Registered Executive Email *</label>
                <input 
                  type="email" 
                  value={newCnsEmail} 
                  onChange={(e) => setNewCnsEmail(e.target.value)}
                  placeholder="e.g. cns.eleanor@hospital.org"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Clinical Division Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {effectiveDivisions.map(div => {
                    const theme = getDivisionTheme(div.colorTheme);
                    const isSelected = newCnsCategory === div.name;
                    return (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => {
                          setNewCnsCategory(div.name);
                          if (!newCnsJobTitle || newCnsJobTitle.includes('Chief Nursing Services')) {
                            setNewCnsJobTitle(`Chief Nursing Services (${div.name})`);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          isSelected
                            ? `${theme.buttonBorder} font-bold`
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span className={theme.iconColor}>
                            {renderDivisionIcon(div.icon, 'w-3.5 h-3.5')}
                          </span>
                          <span className="truncate">{div.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight truncate">
                          {div.description || `${div.name} Division`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Official Executive Job Title</label>
                <input 
                  type="text" 
                  value={newCnsJobTitle} 
                  onChange={(e) => setNewCnsJobTitle(e.target.value)}
                  placeholder="e.g. Chief Nursing Services (Medical)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Nursing License No.</label>
                  <input 
                    type="text" 
                    value={newCnsLicenseNumber} 
                    onChange={(e) => setNewCnsLicenseNumber(e.target.value)}
                    placeholder="e.g. CNS-LIC-901"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">License Expiry Date</label>
                  <input 
                    type="date" 
                    value={newCnsLicenseExpiry} 
                    onChange={(e) => setNewCnsLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Direct Phone / Hospital Ext.</label>
                <input 
                  type="text" 
                  value={newCnsPhone} 
                  onChange={(e) => setNewCnsPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-4401"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                <input
                  type="checkbox"
                  id="wardNewCnsDutyApprover"
                  checked={newCnsIsDutyApprover}
                  onChange={(e) => setNewCnsIsDutyApprover(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-white border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="wardNewCnsDutyApprover" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Authorized Duty Swap & Leave Approver for {newCnsCategory} Division
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCnsModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black uppercase shadow-md flex items-center justify-center gap-1.5 transition"
                >
                  <UserPlus size={14} /> Appoint CNS Executive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CNS CONFIRMATION DIALOG */}
      {deletingCns && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center font-black shrink-0">
                <AlertCircle size={22} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Chief Nursing Services (CNS)</h3>
                <p className="text-xs text-rose-600 font-medium">Irreversible executive removal</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <p>
                Are you sure you want to remove <span className="text-slate-900 font-bold">{deletingCns.name}</span> as Chief Nursing Services for the <span className="text-purple-700 font-bold">{deletingCns.category} Division</span>?
              </p>
              <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-start gap-1.5">
                <AlertCircle size={14} className="shrink-0 text-amber-600 mt-0.5" />
                <span>Removing this CNS unassigns this executive from the {deletingCns.category} Division governance. Head Nurses and DCNS in this division will remain active and can be covered by a newly appointed CNS.</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeletingCns(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCns}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-200"
              >
                <Trash2 size={14} /> Confirm Delete CNS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT HEAD NURSE (HN) */}
      {editingHn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit3 size={20} className="text-amber-600" />
                Edit Head Nurse (HN)
              </h3>
              <button 
                onClick={() => setEditingHn(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditHn} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editHnName} 
                  onChange={(e) => setEditHnName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Registered Hospital Email</label>
                <input 
                  type="email" 
                  value={editHnEmail} 
                  onChange={(e) => setEditHnEmail(e.target.value)}
                  placeholder="e.g. david.hn@hospital.org"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Assign to Ward Unit</label>
                <select
                  value={editHnWardId}
                  onChange={(e) => {
                    const wid = e.target.value;
                    setEditHnWardId(wid);
                    const selWard = wards.find(w => w.id === wid);
                    if (selWard?.category) {
                      setEditHnCategory(selWard.category);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">None (Unassigned)</option>
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code}) - {w.category || 'Medical'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Head Nurse Clinical Category / Division
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {effectiveDivisions.map(div => {
                    const theme = getDivisionTheme(div.colorTheme);
                    const isSelected = editHnCategory === div.name;
                    return (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => setEditHnCategory(div.name)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          isSelected
                            ? `${theme.buttonBorder} font-bold`
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span className={theme.iconColor}>
                            {renderDivisionIcon(div.icon, 'w-3.5 h-3.5')}
                          </span>
                          <span className="truncate">{div.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight truncate">
                          {div.description || `${div.name} Division`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Nursing License No.</label>
                  <input 
                    type="text" 
                    value={editHnLicenseNumber} 
                    onChange={(e) => setEditHnLicenseNumber(e.target.value)}
                    placeholder="e.g. NUR-HN-8012"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={editHnLicenseExpiry} 
                    onChange={(e) => setEditHnLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Supervised Nurse Supervisors Delegation Section */}
              {(() => {
                const supervisedNs = nurseSupervisorUsers.filter(ns => ns.headNurseId === editingHn.id);
                return (
                  <div className="p-3 bg-cyan-50/80 border border-cyan-200 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-cyan-950 flex items-center gap-1.5">
                        <Users size={14} className="text-cyan-700" />
                        Supervised Nurse Supervisors ({supervisedNs.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const targetHn = editingHn;
                          setEditingHn(null);
                          handleOpenHnNsModal(targetHn);
                        }}
                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[10px] font-black uppercase transition flex items-center gap-1"
                      >
                        <Plus size={11} /> Allocate NS
                      </button>
                    </div>
                    {supervisedNs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {supervisedNs.map(ns => {
                          const w = wards.find(ward => ward.id === ns.wardId);
                          return (
                            <span key={ns.id} className="text-[10px] font-bold bg-white text-slate-800 border border-cyan-300 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <span>{ns.name}</span>
                              <span className="text-[9px] text-cyan-700 font-mono">({w?.code || 'Ward'})</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">No Nurse Supervisors currently assigned to this Head Nurse.</p>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingHn(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> Save HN Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT NURSE SUPERVISOR (NS) */}
      {editingNs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit3 size={20} className="text-indigo-600" />
                Edit Nurse Supervisor (NS)
              </h3>
              <button 
                onClick={() => setEditingNs(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditNs} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editNsName} 
                  onChange={(e) => setEditNsName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Registered Hospital Email</label>
                <input 
                  type="email" 
                  value={editNsEmail} 
                  onChange={(e) => setEditNsEmail(e.target.value)}
                  placeholder="e.g. eleanor.ns@hospital.org"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Directly Assigned Ward/Unit</label>
                <select
                  value={editNsWardId}
                  onChange={(e) => setEditNsWardId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None (Unassigned)</option>
                  {assignableWardsForNs.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Supervising Head Nurse (HN)</label>
                <select
                  value={editNsHeadNurseId}
                  onChange={(e) => setEditNsHeadNurseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None (Unassigned)</option>
                  {assignableHnsForNs.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({wards.find(w => w.id === h.wardId)?.code || 'Global'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Nursing License No.</label>
                  <input 
                    type="text" 
                    value={editNsLicenseNumber} 
                    onChange={(e) => setEditNsLicenseNumber(e.target.value)}
                    placeholder="e.g. NUR-NS-4011"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={editNsLicenseExpiry} 
                    onChange={(e) => setEditNsLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNs(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> Save NS Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff License Card Viewer Modal */}
      {licenseCardModalStaff && (
        <StaffLicenseCardModal
          staff={licenseCardModalStaff}
          isOpen={true}
          onClose={() => setLicenseCardModalStaff(null)}
          isReadOnly={true}
        />
      )}

      {/* Manpower Summary Print & Report Modal */}
      {showManpowerPrintModal && (
        <ManpowerSummaryPrintModal
          isOpen={showManpowerPrintModal}
          onClose={() => setShowManpowerPrintModal(false)}
          staff={staff}
          wards={wards}
          users={users}
          initialCategoryFilter={manpowerCategoryFilter}
          initialWardFilter={manpowerFilterWardId}
          initialRankFilter={manpowerRankFilter}
          currentUserRole={currentUserRole}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
