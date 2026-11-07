import React, { useState, useMemo } from 'react';
import { UserAccount, WardInfo, StaffMember, WardCategory, ClinicalDivision, DEFAULT_DIVISIONS } from '../types';
import { 
  Crown, 
  ShieldCheck, 
  UserCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Hospital,
  ChevronRight,
  Shield,
  Users,
  Activity,
  Layers,
  Award,
  Check,
  Briefcase,
  LayoutGrid,
  FolderTree,
  Filter
} from 'lucide-react';

interface LoginPageProps {
  users: UserAccount[];
  wards: WardInfo[];
  staff: StaffMember[];
  divisions?: ClinicalDivision[];
  onLoginUser: (user: UserAccount) => void;
  onLoginStaffByEmail: (email: string) => boolean;
  onLoginStaffById: (staffId: string) => boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  wards,
  staff,
  divisions,
  onLoginUser,
  onLoginStaffByEmail,
  onLoginStaffById
}) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<'admin' | 'cns' | 'head_nurse' | 'nurse_supervisor' | 'staff'>('admin');
  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'all' | 'sn' | 'ha'>('all');

  // Directorate CNS & DCNS view controls
  const [cnsSubRoleFilter, setCnsSubRoleFilter] = useState<'all' | 'cns' | 'dcns'>('all');
  const [cnsDivisionFilter, setCnsDivisionFilter] = useState<'all' | WardCategory>('all');
  const [cnsSearch, setCnsSearch] = useState('');
  const [cnsViewMode, setCnsViewMode] = useState<'hierarchy' | 'grid'>('hierarchy');

  // Dynamically consolidate all active clinical divisions
  const effectiveDivisions = useMemo(() => {
    const list = [...(divisions || DEFAULT_DIVISIONS)];
    wards.forEach(w => {
      if (w.category && !list.some(d => d.name.toLowerCase() === w.category!.toLowerCase())) {
        list.push({
          id: `div-${w.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: w.category,
          description: `${w.category} Clinical Directorate`,
          colorTheme: 'teal',
          icon: 'Activity'
        });
      }
    });
    users.forEach(u => {
      if (u.category && !list.some(d => d.name.toLowerCase() === u.category!.toLowerCase())) {
        list.push({
          id: `div-${u.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: u.category,
          description: `${u.category} Clinical Directorate`,
          colorTheme: 'indigo',
          icon: 'Activity'
        });
      }
    });
    return list;
  }, [divisions, wards, users]);

  // 1. List of Admin accounts (Tier 1)
  const adminUsers = useMemo(() => {
    return users.filter(u => u.role === 'admin');
  }, [users]);

  // 2. List of Chief & Deputy Chief Nursing Services (CNS / DCNS) (Tier 2 - covering division category)
  const cnsOnlyUsers = useMemo(() => {
    return users.filter(u => u.role === 'cns' || u.nurseDesignation === 'CNS');
  }, [users]);

  const dcnsOnlyUsers = useMemo(() => {
    return users.filter(u => u.role === 'dcns' || u.nurseDesignation === 'DCNS');
  }, [users]);

  const allDirectorateUsers = useMemo(() => {
    return users.filter(u => u.role === 'cns' || u.role === 'dcns' || u.nurseDesignation === 'CNS' || u.nurseDesignation === 'DCNS');
  }, [users]);

  const filteredDirectorateUsers = useMemo(() => {
    return allDirectorateUsers.filter(u => {
      const isDcns = u.role === 'dcns' || u.nurseDesignation === 'DCNS';
      if (cnsSubRoleFilter === 'cns' && isDcns) return false;
      if (cnsSubRoleFilter === 'dcns' && !isDcns) return false;
      if (cnsDivisionFilter !== 'all' && (u.category || 'Medical') !== cnsDivisionFilter) return false;
      if (cnsSearch.trim()) {
        const q = cnsSearch.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchTitle = (u.jobTitle || '').toLowerCase().includes(q);
        const matchDivision = (u.category || '').toLowerCase().includes(q);
        const matchLicense = (u.licenseNumber || '').toLowerCase().includes(q);
        return matchName || matchEmail || matchTitle || matchDivision || matchLicense;
      }
      return true;
    });
  }, [allDirectorateUsers, cnsSubRoleFilter, cnsDivisionFilter, cnsSearch]);

  // 3. List of Head Nurses (HN) (Tier 3)
  const headNurseUsers = useMemo(() => {
    return users.filter(u => u.role === 'head_nurse' || u.role === 'ward_supervisor' || u.nurseDesignation === 'HN');
  }, [users]);

  // 4. List of Nurse Supervisors (NS) (Tier 4)
  const nurseSupervisorUsers = useMemo(() => {
    return users.filter(u => u.role === 'nurse_supervisor' || u.nurseDesignation === 'NS');
  }, [users]);

  // 5. Filtered staff list for the staff tab (Tier 5: SN / MSA)
  const filteredStaffList = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = searchTerm === '' || 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.jobTitle && s.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesWard = selectedWardFilter === 'all' || s.wardId === selectedWardFilter;

      let matchesRole = true;
      if (staffRoleFilter === 'sn') {
        matchesRole = !s.isHa && !s.name.includes('(HA)') && !s.name.includes('(MSA)');
      } else if (staffRoleFilter === 'ha') {
        matchesRole = !!s.isHa || s.name.includes('(HA)') || s.name.includes('(MSA)');
      }

      return matchesSearch && matchesWard && matchesRole;
    });
  }, [staff, searchTerm, selectedWardFilter, staffRoleFilter]);

  // Handle Direct Email Form Submission
  const handleEmailFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('Please enter your registered hospital email address or staff ID.');
      return;
    }

    // 1. Check if email/ID matches a system UserAccount (Admin, HN, NS, or Staff)
    const matchedUser = users.find(u => 
      u.email.trim().toLowerCase() === cleanEmail || 
      (u.staffMemberId && u.staffMemberId.toLowerCase() === cleanEmail)
    );

    if (matchedUser) {
      onLoginUser(matchedUser);
      return;
    }

    // 2. Check if it's a staff email
    const staffLoginSuccess = onLoginStaffByEmail(cleanEmail);
    if (staffLoginSuccess) {
      return;
    }

    // 3. Check if it's a staff ID
    const matchedStaff = staff.find(s => s.id.toLowerCase() === cleanEmail);
    if (matchedStaff) {
      onLoginStaffById(matchedStaff.id);
      return;
    }

    setErrorMessage(`No account found for "${emailInput}". Please select one of the 4 account types below or choose from the demo directory.`);
  };

  const handleQuickAccountLogin = (accountUser: UserAccount) => {
    setErrorMessage(null);
    onLoginUser(accountUser);
  };

  const handleQuickStaffLogin = (staffMember: StaffMember) => {
    setErrorMessage(null);
    if (staffMember.email) {
      const success = onLoginStaffByEmail(staffMember.email);
      if (success) return;
    }
    onLoginStaffById(staffMember.id);
  };

  return (
    <div id="login-page-container" className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar / Hospital Header */}
      <header className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/90 border border-indigo-400/30 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Hospital size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">Hospital Staff Roster & Hierarchy Portal</span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                4-Tier Hierarchy
              </span>
            </div>
            <p className="text-xs text-slate-400">Institutional Command Structure • Bahrain Medical Services</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{wards.length} Active Wards</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700">
            <span>{staff.length} Medical Personnel</span>
          </div>
        </div>
      </header>

      {/* Main Login Screen Content */}
      <main className="max-w-6xl w-full mx-auto my-6 sm:my-8 space-y-6">
        {/* Welcome Banner */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-widest">
            <Lock size={13} className="text-indigo-400" />
            Hospital Authentication Gateway
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Select Your Account Type to Sign In
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Institutional access is organized across 5 leadership tiers: GCNS (General Chief Nursing Services), Chief Nursing Services (CNS), Head Nurse (HN), Nurse Supervisor (NS), and Staff Nurse (SN) / Medical Service Aid (MSA).
          </p>
        </div>

        {/* 5 User Types Selection Cards / Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-3.5">
          {/* 1. Main Hospital Admin / GCNS */}
          <button
            id="role-tab-admin"
            type="button"
            onClick={() => {
              setSelectedRoleTab('admin');
              setErrorMessage(null);
            }}
            className={`p-4 sm:p-5 rounded-3xl text-left transition-all duration-200 border relative overflow-hidden flex flex-col justify-between ${
              selectedRoleTab === 'admin'
                ? 'bg-slate-800/95 border-indigo-500 ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-600/20'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
            }`}
          >
            {selectedRoleTab === 'admin' && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            )}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Crown size={18} />
                </div>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Type 1
                </span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">GCNS</h3>
                <p className="text-[10px] text-indigo-200/70 mt-0.5 font-medium">General Chief Nursing Services</p>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Apex nursing authority: oversees clinical wards, CNS executives, Head Nurses, and global hospital roster.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs font-black">
              <span className={`${selectedRoleTab === 'admin' ? 'text-indigo-400' : 'text-slate-400'}`}>
                {selectedRoleTab === 'admin' ? 'Active' : 'Select'}
              </span>
              <ChevronRight size={14} className={selectedRoleTab === 'admin' ? 'text-indigo-400' : 'text-slate-500'} />
            </div>
          </button>

          {/* 2. Chief Nursing Services (CNS) & Deputy Chief (DCNS) */}
          <button
            id="role-tab-cns"
            type="button"
            onClick={() => {
              setSelectedRoleTab('cns');
              setErrorMessage(null);
            }}
            className={`p-4 sm:p-5 rounded-3xl text-left transition-all duration-200 border relative overflow-hidden flex flex-col justify-between ${
              selectedRoleTab === 'cns'
                ? 'bg-slate-800/95 border-purple-500 ring-2 ring-purple-500/50 shadow-2xl shadow-purple-600/20'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
            }`}
          >
            {selectedRoleTab === 'cns' && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            )}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Sparkles size={18} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Type 2
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-indigo-900/80 text-indigo-200 border border-indigo-700/50">
                    {cnsOnlyUsers.length} CNS • {dcnsOnlyUsers.length} DCNS
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                  <span>CNS &amp; DCNS</span>
                </h3>
                <p className="text-[10px] text-purple-200/80 mt-0.5 font-bold">Division Directorate &amp; Deputy Chiefs</p>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Division executive leadership: Chief (CNS) &amp; Deputy Chief (DCNS) governing clinical divisions (Excellency, Medical, Surgical), overseeing Head Nurses, and managing division operations.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs font-black">
              <span className={`${selectedRoleTab === 'cns' ? 'text-purple-400' : 'text-slate-400'}`}>
                {selectedRoleTab === 'cns' ? 'Active Directorate' : 'Select'}
              </span>
              <ChevronRight size={14} className={selectedRoleTab === 'cns' ? 'text-purple-400' : 'text-slate-500'} />
            </div>
          </button>

          {/* 3. Head Nurse (HN) */}
          <button
            id="role-tab-head-nurse"
            type="button"
            onClick={() => {
              setSelectedRoleTab('head_nurse');
              setErrorMessage(null);
            }}
            className={`p-4 sm:p-5 rounded-3xl text-left transition-all duration-200 border relative overflow-hidden flex flex-col justify-between ${
              selectedRoleTab === 'head_nurse'
                ? 'bg-slate-800/95 border-amber-500 ring-2 ring-amber-500/50 shadow-2xl shadow-amber-600/20'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
            }`}
          >
            {selectedRoleTab === 'head_nurse' && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            )}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <ShieldCheck size={18} />
                </div>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Type 3
                </span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">Head Nurse (HN)</h3>
                <p className="text-[10px] text-amber-200/70 mt-0.5 font-medium">Ward Unit In-Charge</p>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Ward leadership: oversees shift rosters, directs assigned Nurse Supervisors (NS), and manages ward unit operations.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs font-black">
              <span className={`${selectedRoleTab === 'head_nurse' ? 'text-amber-400' : 'text-slate-400'}`}>
                {selectedRoleTab === 'head_nurse' ? 'Active' : 'Select'}
              </span>
              <ChevronRight size={14} className={selectedRoleTab === 'head_nurse' ? 'text-amber-400' : 'text-slate-500'} />
            </div>
          </button>

          {/* 4. Nurse Supervisor (NS) */}
          <button
            id="role-tab-nurse-supervisor"
            type="button"
            onClick={() => {
              setSelectedRoleTab('nurse_supervisor');
              setErrorMessage(null);
            }}
            className={`p-4 sm:p-5 rounded-3xl text-left transition-all duration-200 border relative overflow-hidden flex flex-col justify-between ${
              selectedRoleTab === 'nurse_supervisor'
                ? 'bg-slate-800/95 border-cyan-500 ring-2 ring-cyan-500/50 shadow-2xl shadow-cyan-600/20'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
            }`}
          >
            {selectedRoleTab === 'nurse_supervisor' && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
            )}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Activity size={18} />
                </div>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Type 4
                </span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">Nurse Supervisor (NS)</h3>
                <p className="text-[10px] text-cyan-200/70 mt-0.5 font-medium">Team Leader / Shift In-Charge</p>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Frontline shift leader: runs daily clinical duty rosters, coordinates staff assignments, and oversees handovers.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs font-black">
              <span className={`${selectedRoleTab === 'nurse_supervisor' ? 'text-cyan-400' : 'text-slate-400'}`}>
                {selectedRoleTab === 'nurse_supervisor' ? 'Active' : 'Select'}
              </span>
              <ChevronRight size={14} className={selectedRoleTab === 'nurse_supervisor' ? 'text-cyan-400' : 'text-slate-500'} />
            </div>
          </button>

          {/* 5. Staff Nurse (SN) / MSA */}
          <button
            id="role-tab-staff"
            type="button"
            onClick={() => {
              setSelectedRoleTab('staff');
              setErrorMessage(null);
            }}
            className={`p-4 sm:p-5 rounded-3xl text-left transition-all duration-200 border relative overflow-hidden flex flex-col justify-between ${
              selectedRoleTab === 'staff'
                ? 'bg-slate-800/95 border-emerald-500 ring-2 ring-emerald-500/50 shadow-2xl shadow-emerald-600/20'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
            }`}
          >
            {selectedRoleTab === 'staff' && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            )}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <UserCheck size={18} />
                </div>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Type 5
                </span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">Staff Nurse (SN) / MSA</h3>
                <p className="text-[10px] text-emerald-200/70 mt-0.5 font-medium">Frontline Clinical Staff</p>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Staff portal: personal monthly duty card, submit peer-to-peer shift swaps, and view ward table grid.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs font-black">
              <span className={`${selectedRoleTab === 'staff' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {selectedRoleTab === 'staff' ? 'Active' : 'Select'}
              </span>
              <ChevronRight size={14} className={selectedRoleTab === 'staff' ? 'text-emerald-400' : 'text-slate-500'} />
            </div>
          </button>
        </div>

        {/* Selected Role Interactive Portal Card */}
        <div className="bg-slate-800/90 rounded-[2.5rem] border border-slate-700/80 p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header of Active Role Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                selectedRoleTab === 'admin' ? 'bg-indigo-600 text-white' :
                selectedRoleTab === 'cns' ? 'bg-purple-600 text-white' :
                selectedRoleTab === 'head_nurse' ? 'bg-amber-500 text-slate-950' :
                selectedRoleTab === 'nurse_supervisor' ? 'bg-cyan-500 text-slate-950' :
                'bg-emerald-500 text-slate-950'
              }`}>
                {selectedRoleTab === 'admin' && <Crown size={20} />}
                {selectedRoleTab === 'cns' && <Sparkles size={20} />}
                {selectedRoleTab === 'head_nurse' && <ShieldCheck size={20} />}
                {selectedRoleTab === 'nurse_supervisor' && <Activity size={20} />}
                {selectedRoleTab === 'staff' && <UserCheck size={20} />}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {selectedRoleTab === 'admin' && '1. Hospital Administrator Gateway (Controls All Wards & CNS)'}
                  {selectedRoleTab === 'cns' && '2. Directorate Portal: Chief (CNS) & Deputy Chief (DCNS)'}
                  {selectedRoleTab === 'head_nurse' && '3. Head Nurse (HN) Sign-In Portal (Ward In-Charge)'}
                  {selectedRoleTab === 'nurse_supervisor' && '4. Nurse Supervisor (NS) Sign-In Portal (Team Leader)'}
                  {selectedRoleTab === 'staff' && '5. Staff Nurse (SN) & Medical Service Aid (MSA) Portal'}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedRoleTab === 'admin' && 'Select an admin account or enter hospital credentials'}
                  {selectedRoleTab === 'cns' && 'Sign in as Division Chief (CNS) or Deputy Chief (DCNS) across Excellency, Medical, and Surgical divisions'}
                  {selectedRoleTab === 'head_nurse' && 'Choose your Head Nurse (HN) profile or enter hospital email'}
                  {selectedRoleTab === 'nurse_supervisor' && 'Choose your Nurse Supervisor (NS) profile for shift leadership'}
                  {selectedRoleTab === 'staff' && 'Select your staff name from the roster or enter Staff ID / email'}
                </p>
              </div>
            </div>

            {/* Direct Email / ID Sign-In Toggle */}
            <form onSubmit={handleEmailFormSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setErrorMessage(null); }}
                  placeholder={selectedRoleTab === 'staff' ? "Enter Staff ID or Email..." : "Enter Hospital Email..."}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Sign In</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB CONTENT: 1. ADMIN */}
          {selectedRoleTab === 'admin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-400" />
                  Authorized Hospital Administrator Accounts (1-Click Login):
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminUsers.map((admin) => (
                  <div
                    key={admin.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-indigo-500/30 hover:border-indigo-500 transition-all group flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {admin.photoUrl ? (
                          <img
                            src={admin.photoUrl}
                            alt={admin.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-indigo-400/40"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-black text-sm">
                            {admin.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-white">{admin.name}</h4>
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              GCNS
                            </span>
                          </div>
                          <p className="text-xs text-indigo-300/80 font-medium">{admin.jobTitle || 'General Chief Nursing Services (GCNS)'}</p>
                          <p className="text-[11px] font-mono text-slate-400">{admin.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Institutional Authority:</span>
                        <span className="font-semibold text-indigo-300">Apex General Chief Nursing Services (GCNS)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Authorized Scope:</span>
                        <span className="font-semibold text-white">All Hospital Wards &amp; Divisions</span>
                      </div>
                    </div>

                    <button
                      id={`login-admin-${admin.id}`}
                      type="button"
                      onClick={() => handleQuickAccountLogin(admin)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={15} />
                      Sign In as {admin.name.split(' ')[0]} (GCNS)
                    </button>
                  </div>
                ))}
              </div>

              {/* Admin Capability Overview Card */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
                <Layers size={16} className="text-indigo-400 shrink-0" />
                <span>GCNS (General Chief Nursing Services) is at the apex of the hierarchy, overseeing Chief Nursing Services (CNS), Head Nurses (HN), and the master hospital-wide roster.</span>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. CHIEF & DEPUTY CHIEF NURSING SERVICES (CNS / DCNS) */}
          {selectedRoleTab === 'cns' && (
            <div className="space-y-6">
              {/* Directorate Overview & Control Toolbar */}
              <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-purple-500/30 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Section Header & Directorate Stats */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
                      <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                        Division Directorate Directory (1-Click Executive Access)
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-300 font-medium">
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-900/60 text-purple-200 border border-purple-700/50 font-bold flex items-center gap-1">
                        <Crown size={12} className="text-amber-400" />
                        {cnsOnlyUsers.length} Chief Nursing Services (CNS)
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 font-bold flex items-center gap-1">
                        <Shield size={12} className="text-indigo-400" />
                        {dcnsOnlyUsers.length} Deputy Chief Nursing Services (DCNS)
                      </span>
                      <span className="text-slate-400">
                        • 3 Clinical Divisions (Excellency, Medical, Surgical)
                      </span>
                    </div>
                  </div>

                  {/* Right: View Mode Toggle & Search */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Directorate */}
                    <div className="relative">
                      <input
                        type="text"
                        value={cnsSearch}
                        onChange={(e) => setCnsSearch(e.target.value)}
                        placeholder="Search name, email, license..."
                        className="w-full sm:w-60 pl-8 pr-8 py-1.5 bg-slate-950/80 border border-purple-500/30 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                      <Search size={13} className="absolute left-2.5 top-2.5 text-purple-400" />
                      {cnsSearch && (
                        <button
                          type="button"
                          onClick={() => setCnsSearch('')}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* View Switcher (Hierarchy vs Grid) */}
                    <div className="inline-flex p-1 bg-slate-950/90 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setCnsViewMode('hierarchy')}
                        className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                          cnsViewMode === 'hierarchy'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'hover:text-white'
                        }`}
                      >
                        <FolderTree size={13} />
                        <span>Division Hierarchy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCnsViewMode('grid')}
                        className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                          cnsViewMode === 'grid'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'hover:text-white'
                        }`}
                      >
                        <LayoutGrid size={13} />
                        <span>Executive Grid</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-Filters: Role Pill & Division Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  {/* Role Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                    <span className="text-slate-400 text-[11px] font-semibold uppercase mr-1">Role:</span>
                    <button
                      type="button"
                      onClick={() => setCnsSubRoleFilter('all')}
                      className={`px-3 py-1 rounded-xl transition ${
                        cnsSubRoleFilter === 'all'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Directorate ({allDirectorateUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCnsSubRoleFilter('cns')}
                      className={`px-3 py-1 rounded-xl transition flex items-center gap-1 ${
                        cnsSubRoleFilter === 'cns'
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                          : 'bg-slate-800/60 text-purple-300 hover:bg-slate-800'
                      }`}
                    >
                      <Crown size={12} className="text-amber-400" />
                      Chiefs (CNS) ({cnsOnlyUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCnsSubRoleFilter('dcns')}
                      className={`px-3 py-1 rounded-xl transition flex items-center gap-1 ${
                        cnsSubRoleFilter === 'dcns'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'bg-slate-800/60 text-indigo-300 hover:bg-slate-800'
                      }`}
                    >
                      <Shield size={12} className="text-indigo-400" />
                      Deputy Chiefs (DCNS) ({dcnsOnlyUsers.length})
                    </button>
                  </div>

                  {/* Division Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                    <span className="text-slate-400 text-[11px] font-semibold uppercase mr-1">Division:</span>
                    <button
                      type="button"
                      onClick={() => setCnsDivisionFilter('all')}
                      className={`px-3 py-1 rounded-xl transition ${
                        cnsDivisionFilter === 'all'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Divisions
                    </button>
                    {effectiveDivisions.map((div) => {
                      const isActive = cnsDivisionFilter === div.name;
                      let colorClasses = 'bg-sky-950/40 text-sky-300 border-sky-800/40 hover:bg-sky-900/40';
                      let activeClasses = 'bg-sky-600 text-white shadow-sm';
                      if (div.name === 'Excellency' || div.colorTheme === 'purple') {
                        colorClasses = 'bg-purple-950/40 text-purple-300 border-purple-800/40 hover:bg-purple-900/40';
                        activeClasses = 'bg-purple-600 text-white shadow-sm';
                      } else if (div.name === 'Surgical' || div.colorTheme === 'rose') {
                        colorClasses = 'bg-rose-950/40 text-rose-300 border-rose-800/40 hover:bg-rose-900/40';
                        activeClasses = 'bg-rose-600 text-white shadow-sm';
                      } else if (div.colorTheme === 'emerald') {
                        colorClasses = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/40';
                        activeClasses = 'bg-emerald-600 text-white shadow-sm';
                      } else if (div.colorTheme === 'amber') {
                        colorClasses = 'bg-amber-950/40 text-amber-300 border-amber-800/40 hover:bg-amber-900/40';
                        activeClasses = 'bg-amber-600 text-white shadow-sm';
                      } else if (div.colorTheme === 'teal') {
                        colorClasses = 'bg-teal-950/40 text-teal-300 border-teal-800/40 hover:bg-teal-900/40';
                        activeClasses = 'bg-teal-600 text-white shadow-sm';
                      }
                      return (
                        <button
                          key={div.id || div.name}
                          type="button"
                          onClick={() => setCnsDivisionFilter(div.name as WardCategory)}
                          className={`px-3 py-1 rounded-xl transition border ${isActive ? activeClasses : colorClasses}`}
                        >
                          {div.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* VIEW 1: DIVISION HIERARCHY VIEW (Grouped with CNS as Division Apex and DCNS as Appointed Deputies) */}
              {cnsViewMode === 'hierarchy' && (
                <div className="space-y-6">
                  {effectiveDivisions
                    .map(d => d.name)
                    .filter(div => cnsDivisionFilter === 'all' || cnsDivisionFilter === div)
                    .map((div) => {
                      const divCns = cnsOnlyUsers.find(u => (u.category || 'Medical') === div);
                      const divDcnsList = dcnsOnlyUsers.filter(u => (u.category || 'Medical') === div);
                      const divWards = wards.filter(w => (w.category || 'Medical') === div);
                      const divHNs = headNurseUsers.filter(h => (h.category || (h.wardId && wards.find(w => w.id === h.wardId)?.category) || 'Medical') === div);

                      // Check search filter for this division
                      if (cnsSearch.trim()) {
                        const q = cnsSearch.toLowerCase().trim();
                        const cnsMatch = divCns && (
                          divCns.name.toLowerCase().includes(q) ||
                          divCns.email.toLowerCase().includes(q) ||
                          (divCns.licenseNumber || '').toLowerCase().includes(q) ||
                          div.toLowerCase().includes(q)
                        );
                        const dcnsMatch = divDcnsList.some(d => 
                          d.name.toLowerCase().includes(q) ||
                          d.email.toLowerCase().includes(q) ||
                          (d.licenseNumber || '').toLowerCase().includes(q)
                        );
                        if (!cnsMatch && !dcnsMatch) return null;
                      }

                      // Check sub-role filter
                      const showCns = cnsSubRoleFilter === 'all' || cnsSubRoleFilter === 'cns';
                      const showDcns = cnsSubRoleFilter === 'all' || cnsSubRoleFilter === 'dcns';

                      const divBorder = div === 'Excellency'
                        ? 'border-purple-500/50 bg-gradient-to-br from-purple-950/30 via-slate-900/90 to-slate-900/80'
                        : div === 'Surgical'
                        ? 'border-rose-500/50 bg-gradient-to-br from-rose-950/30 via-slate-900/90 to-slate-900/80'
                        : 'border-sky-500/50 bg-gradient-to-br from-sky-950/30 via-slate-900/90 to-slate-900/80';

                      const divBadge = div === 'Excellency'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : div === 'Surgical'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/40';

                      return (
                        <div
                          key={div}
                          className={`rounded-3xl border ${divBorder} p-5 sm:p-6 space-y-5 shadow-xl`}
                        >
                          {/* Division Banner & Metrics */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border ${divBadge}`}>
                                <Building2 size={20} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base sm:text-lg font-black text-white">{div} Clinical Division</h3>
                                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${divBadge}`}>
                                    Directorate Branch
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">Governs dedicated clinical units, patient flow, and supervisory rota</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2.5 py-1 bg-slate-800/90 rounded-lg text-slate-300 border border-slate-700 font-semibold flex items-center gap-1.5">
                                <Building2 size={13} className="text-purple-400" />
                                {divWards.length} Wards: <span className="text-white font-bold">{divWards.map(w => w.code).join(', ') || 'None'}</span>
                              </span>
                              <span className="px-2.5 py-1 bg-slate-800/90 rounded-lg text-amber-300 border border-slate-700 font-semibold flex items-center gap-1.5">
                                <ShieldCheck size={13} className="text-amber-400" />
                                {divHNs.length} Head Nurses
                              </span>
                              <span className="px-2.5 py-1 bg-slate-800/90 rounded-lg text-indigo-300 border border-slate-700 font-semibold flex items-center gap-1.5">
                                <Shield size={13} className="text-indigo-400" />
                                {divDcnsList.length} Deputy Chief{divDcnsList.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>

                          {/* Hierarchy Grid: CNS (Division Apex) & DCNS (Appointed Deputies) */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* 1. CHIEF NURSING SERVICES (CNS) CARD (Division In-Charge) */}
                            {showCns && (
                              <div className={`${showDcns && divDcnsList.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
                                <div className="h-full p-5 rounded-2xl bg-slate-900/90 border-2 border-purple-500/50 hover:border-purple-400 transition-all shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
                                  
                                  <div className="space-y-3.5">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        {divCns?.photoUrl ? (
                                          <img
                                            src={divCns.photoUrl}
                                            alt={divCns.name}
                                            className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-400 shadow-md"
                                          />
                                        ) : (
                                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 border-2 border-purple-400 text-white flex items-center justify-center font-black text-base shadow-md">
                                            {divCns ? divCns.name.slice(0, 2).toUpperCase() : 'CNS'}
                                          </div>
                                        )}
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-extrabold text-base text-white">{divCns?.name || `Chief (${div})`}</h4>
                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                                              <Crown size={10} className="text-amber-400" />
                                              Apex Division Chief
                                            </span>
                                          </div>
                                          <p className="text-xs text-purple-300 font-bold">{divCns?.jobTitle || `Chief Nursing Services (CNS - ${div} Division)`}</p>
                                          <p className="text-xs font-mono text-slate-400">{divCns?.email}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* CNS Authority Info */}
                                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-purple-500/20 space-y-2 text-xs text-slate-300">
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400 flex items-center gap-1.5">
                                          <Award size={13} className="text-purple-400" />
                                          Institutional Authority:
                                        </span>
                                        <span className="font-bold text-purple-200">Level 1 Clinical Division Head</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Supervisory Scope:</span>
                                        <span className="font-semibold text-white">{divWards.length} Wards • {divHNs.length} Head Nurses</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Nursing License:</span>
                                        <span className="font-mono text-amber-300">{divCns?.licenseNumber || 'Verified Official'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {divCns && (
                                    <button
                                      id={`login-cns-${divCns.id}`}
                                      type="button"
                                      onClick={() => handleQuickAccountLogin(divCns)}
                                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                                    >
                                      <Crown size={15} className="text-amber-400" />
                                      Sign In as {divCns.name.split(' ')[0]} (Chief - {div})
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 2. DEPUTY CHIEF NURSING SERVICES (DCNS) SECTION */}
                            {showDcns && (
                              <div className={`${showCns ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-3`}>
                                <div className="flex items-center justify-between px-1">
                                  <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Shield size={14} className="text-indigo-400" />
                                    Appointed Deputy Chief(s) under {divCns ? divCns.name : `${div} CNS`}:
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-bold">
                                    {divDcnsList.length} Appointed
                                  </span>
                                </div>

                                {divDcnsList.length > 0 ? (
                                  <div className="space-y-3">
                                    {divDcnsList.map((dcns) => (
                                      <div
                                        key={dcns.id}
                                        className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/40 hover:border-indigo-400 transition-all flex flex-col justify-between space-y-3.5 shadow-md group"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-center gap-3">
                                            {dcns.photoUrl ? (
                                              <img
                                                src={dcns.photoUrl}
                                                alt={dcns.name}
                                                className="w-12 h-12 rounded-2xl object-cover border border-indigo-400/50 shadow"
                                              />
                                            ) : (
                                              <div className="w-12 h-12 rounded-2xl bg-indigo-900/60 border border-indigo-400/50 text-indigo-200 flex items-center justify-center font-black text-sm shadow">
                                                {dcns.name.slice(0, 2).toUpperCase()}
                                              </div>
                                            )}
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <h4 className="font-extrabold text-sm text-white">{dcns.name}</h4>
                                                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                                                  <Shield size={10} className="text-indigo-400" />
                                                  DCNS • Deputy
                                                </span>
                                              </div>
                                              <p className="text-xs text-indigo-300 font-medium">{dcns.jobTitle || `Deputy Chief (DCNS - ${div} Division)`}</p>
                                              <p className="text-[11px] font-mono text-slate-400">{dcns.email}</p>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-indigo-500/20 space-y-1 text-[11px] text-slate-300">
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Direct Command Line:</span>
                                            <span className="font-semibold text-indigo-200">Reports to Dr. {divCns?.name || `${div} CNS`}</span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Duty Approver Status:</span>
                                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                                              <Check size={12} />
                                              Authorized Approver
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Nursing License:</span>
                                            <span className="font-mono text-slate-300">{dcns.licenseNumber || 'NUR-DCNS-ACTIVE'}</span>
                                          </div>
                                        </div>

                                        <button
                                          id={`login-dcns-${dcns.id}`}
                                          type="button"
                                          onClick={() => handleQuickAccountLogin(dcns)}
                                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                                        >
                                          <Shield size={14} />
                                          Sign In as {dcns.name.split(' ')[0]} (DCNS - {div})
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-6 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center space-y-2">
                                    <Shield size={24} className="mx-auto text-slate-600" />
                                    <p className="text-xs font-bold text-slate-400">No Deputy Chief (DCNS) appointed yet for {div} Division</p>
                                    <p className="text-[11px] text-slate-500">
                                      GCNS administrators can appoint a DCNS in the Hierarchy Manager under this division's CNS.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* VIEW 2: EXECUTIVE CARDS GRID VIEW (Flat Grid with Crisp Distinction between CNS and DCNS) */}
              {cnsViewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDirectorateUsers.map((user) => {
                    const isDcns = user.role === 'dcns' || user.nurseDesignation === 'DCNS';
                    const div = user.category || 'Medical';
                    const categoryWards = wards.filter(w => (w.category || 'Medical') === div);
                    const categoryHeadNurses = headNurseUsers.filter(h => (h.category || (h.wardId && wards.find(w => w.id === h.wardId)?.category) || 'Medical') === div);

                    return (
                      <div
                        key={user.id}
                        className={`p-5 rounded-2xl bg-slate-900/80 border transition-all flex flex-col justify-between space-y-4 shadow-lg group ${
                          isDcns
                            ? 'border-indigo-500/40 hover:border-indigo-400'
                            : 'border-purple-500/50 hover:border-purple-400 ring-1 ring-purple-500/20'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {user.photoUrl ? (
                                <img
                                  src={user.photoUrl}
                                  alt={user.name}
                                  className={`w-12 h-12 rounded-2xl object-cover border ${
                                    isDcns ? 'border-indigo-400/60' : 'border-purple-400/60'
                                  }`}
                                />
                              ) : (
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white ${
                                  isDcns ? 'bg-indigo-700' : 'bg-purple-700'
                                }`}>
                                  {user.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-sm text-white">{user.name}</h4>
                                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border flex items-center gap-1 ${
                                    isDcns
                                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                      : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  }`}>
                                    {isDcns ? <Shield size={10} /> : <Crown size={10} className="text-amber-400" />}
                                    {isDcns ? 'DCNS' : 'CNS'} • {div}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium">{user.jobTitle || `${isDcns ? 'DCNS' : 'CNS'} (${div} Division)`}</p>
                                <p className="text-[11px] font-mono text-slate-400">{user.email}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Clinical Division:</span>
                              <span className="font-bold text-white">{div} Division</span>
                            </div>
                            {isDcns ? (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Reports to:</span>
                                <span className="font-semibold text-indigo-300">{user.cnsName || `${div} CNS`}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Supervisory Scope:</span>
                                <span className="font-semibold text-purple-300">{categoryWards.length} Wards • {categoryHeadNurses.length} HNs</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Nursing License:</span>
                              <span className="font-mono text-amber-300">{user.licenseNumber || 'VERIFIED'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Duty Approver:</span>
                              <span className="font-bold text-emerald-400 flex items-center gap-1">
                                <Check size={11} /> Authorized
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          id={`login-directorate-${user.id}`}
                          type="button"
                          onClick={() => handleQuickAccountLogin(user)}
                          className={`w-full py-2.5 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 ${
                            isDcns
                              ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                              : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                          }`}
                        >
                          {isDcns ? <Shield size={14} /> : <Crown size={14} className="text-amber-400" />}
                          Sign In as {user.name.split(' ')[0]} ({isDcns ? 'DCNS' : 'CNS'} - {div})
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state for search/filters */}
              {filteredDirectorateUsers.length === 0 && (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-700 text-center space-y-3">
                  <AlertCircle size={32} className="mx-auto text-purple-400" />
                  <h4 className="text-base font-bold text-white">No Directorate Personnel Found</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    No CNS or DCNS accounts matched your search criteria or role filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCnsSearch('');
                      setCnsSubRoleFilter('all');
                      setCnsDivisionFilter('all');
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}

              {/* Directorate Governance Explanatory Card */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-purple-400 shrink-0" />
                  <span>
                    <strong className="text-purple-300">Command Governance:</strong> Chief Nursing Services (CNS) sets clinical division strategy and directly assigns Head Nurses. Appointed Deputy Chiefs (DCNS) exercise operational oversight, approving off-duty schedules and supervising Nurse Supervisors.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. HEAD NURSE (HN) */}
          {selectedRoleTab === 'head_nurse' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  Assigned Head Nurses (HN) by Ward Unit (1-Click Login):
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {headNurseUsers.map((hn) => {
                  const ward = wards.find(w => w.id === hn.wardId);
                  const hnEffectiveCategory = hn.category || (ward?.category) || 'Medical';
                  const assignedSupervisors = users.filter(u => (u.role === 'nurse_supervisor' || u.nurseDesignation === 'NS') && u.headNurseId === hn.id);
                  const supervisingCns = hn.cnsName || users.find(u => (u.role === 'cns' || u.nurseDesignation === 'CNS') && u.category === hnEffectiveCategory)?.name || 'Division CNS';

                  const categoryColor = hnEffectiveCategory === 'Excellency' 
                    ? 'border-purple-500/40 hover:border-purple-400' 
                    : hnEffectiveCategory === 'Surgical' 
                    ? 'border-rose-500/40 hover:border-rose-400' 
                    : 'border-amber-500/40 hover:border-amber-400';

                  const badgeColor = hnEffectiveCategory === 'Excellency'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : hnEffectiveCategory === 'Surgical'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

                  return (
                    <div
                      key={hn.id}
                      className={`p-5 rounded-2xl bg-slate-900/70 border ${categoryColor} transition-all group flex flex-col justify-between space-y-4`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {hn.photoUrl ? (
                            <img
                              src={hn.photoUrl}
                              alt={hn.name}
                              className="w-12 h-12 rounded-2xl object-cover border border-amber-400/40"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black text-sm">
                              {hn.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-white">{hn.name}</h4>
                              <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${badgeColor}`}>
                                HN • {hnEffectiveCategory}
                              </span>
                            </div>
                            <p className="text-xs text-amber-300/80 font-medium">{hn.jobTitle || `Head Nurse (${ward ? ward.code : 'Unit'})`}</p>
                            <p className="text-[11px] font-mono text-slate-400">{hn.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1.5 text-[11px] text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Building2 size={12} className="text-amber-400" />
                            Assigned Ward Unit:
                          </span>
                          <span className="font-bold text-amber-300">{ward ? `${ward.name} (${ward.code})` : 'All Wards'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Clinical Division:</span>
                          <span className="font-semibold text-purple-300">{hnEffectiveCategory} Division</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Reports To (CNS):</span>
                          <span className="font-semibold text-indigo-300">{supervisingCns}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Supervisors Under Command:</span>
                          <span className="font-semibold text-cyan-300">{assignedSupervisors.length} Nurse Supervisors</span>
                        </div>
                      </div>

                      <button
                        id={`login-hn-${hn.id}`}
                        type="button"
                        onClick={() => handleQuickAccountLogin(hn)}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={15} />
                        Sign In as {hn.name.split(' ')[0]} (HN - {hnEffectiveCategory})
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Head Nurse Privilege Note */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-400 shrink-0" />
                <span>Head Nurses (HN) hold unit-level clinical authority: configuring shift constraints, running the AI Roster engine, approving swap requests, and directing Nurse Supervisors.</span>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. NURSE SUPERVISOR (NS) */}
          {selectedRoleTab === 'nurse_supervisor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-cyan-400" />
                  Nurse Supervisors (NS) - Clinical Team Leaders (1-Click Login):
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nurseSupervisorUsers.map((ns) => {
                  const ward = wards.find(w => w.id === ns.wardId);

                  return (
                    <div
                      key={ns.id}
                      className="p-5 rounded-2xl bg-slate-900/70 border border-cyan-500/30 hover:border-cyan-500 transition-all group flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {ns.photoUrl ? (
                            <img
                              src={ns.photoUrl}
                              alt={ns.name}
                              className="w-11 h-11 rounded-2xl object-cover border border-cyan-400/40"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-black text-sm">
                              {ns.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-white">{ns.name}</h4>
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                NS
                              </span>
                            </div>
                            <p className="text-xs text-cyan-300/80 font-medium">{ns.jobTitle || `Nurse Supervisor (${ward ? ward.code : 'Unit'})`}</p>
                            <p className="text-[11px] font-mono text-slate-400">{ns.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1.5 text-[11px] text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Building2 size={12} className="text-cyan-400" />
                            Assigned Ward:
                          </span>
                          <span className="font-bold text-cyan-300">{ward ? ward.name : 'All Wards'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Reports To:</span>
                          <span className="font-semibold text-amber-300">Head Nurse (HN)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Directly Supervises:</span>
                          <span className="font-semibold text-emerald-300">Staff Nurses (SN) & MSA</span>
                        </div>
                      </div>

                      <button
                        id={`login-ns-${ns.id}`}
                        type="button"
                        onClick={() => handleQuickAccountLogin(ns)}
                        className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={15} />
                        Sign In as {ns.name.split(' ')[0]} (NS)
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Nurse Supervisor Privilege Note */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
                <Activity size={16} className="text-cyan-400 shrink-0" />
                <span>Nurse Supervisors (NS) lead shift execution, coordinate daily assignments, manage shift handovers, and perform first-line verification for duty swaps.</span>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4. STAFF NURSE (SN) / MSA */}
          {selectedRoleTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  Select Any Staff Nurse (SN) or Medical Service Aid (MSA):
                </span>

                {/* Filter & Search Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Role Sub-Filter */}
                  <div className="flex bg-slate-900 rounded-xl p-0.5 border border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setStaffRoleFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${staffRoleFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      All ({staff.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffRoleFilter('sn')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${staffRoleFilter === 'sn' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      SN Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffRoleFilter('ha')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${staffRoleFilter === 'ha' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      MSA Only
                    </button>
                  </div>

                  {/* Ward Filter */}
                  <select
                    value={selectedWardFilter}
                    onChange={(e) => setSelectedWardFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="all">All Wards</option>
                    {wards.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>

                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search name, CPR ID..."
                      className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-52"
                    />
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Staff Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredStaffList.map((member) => {
                  const memberWard = wards.find(w => w.id === member.wardId);
                  const isHa = !!member.isHa || member.name.includes('(HA)') || member.name.includes('(MSA)');

                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 hover:border-emerald-500/80 transition-all flex flex-col justify-between space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                            isHa ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            member.isSenior ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {member.name ? member.name.slice(0, 2).toUpperCase() : member.id.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-xs text-white truncate group-hover:text-emerald-300">
                              {member.name || `Staff ${member.id}`}
                            </h5>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <span>ID: {member.id}</span>
                              <span>•</span>
                              <span className="text-emerald-400">{memberWard ? memberWard.code : 'ICU'}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded ${
                          isHa ? 'bg-amber-500/20 text-amber-300' :
                          member.isSenior ? 'bg-indigo-500/20 text-indigo-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {isHa ? 'MSA' : member.isSenior ? 'Senior SN' : 'SN'}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 truncate">
                        {member.jobTitle || (isHa ? 'Medical Service Aid (MSA)' : 'Staff Nurse (SN)')}
                      </div>

                      <button
                        id={`login-staff-${member.id}`}
                        type="button"
                        onClick={() => handleQuickStaffLogin(member)}
                        className="w-full py-2 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                      >
                        <UserCheck size={13} />
                        <span>Sign In as {isHa ? 'MSA' : 'SN'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {filteredStaffList.length === 0 && (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  No medical personnel found matching your search term or ward filter.
                </div>
              )}

              {/* Staff Privileges Note */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
                <UserCheck size={16} className="text-emerald-400 shrink-0" />
                <span>Staff Nurses (SN) and Medical Service Aids (MSA) are supervised by Nurse Supervisors (NS), can view their personal duty cards, and request peer shift swaps.</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto py-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        <p>Hospital Clinical Duty & Roster Management System • 4-Tier Command Structure • Bahrain Medical Services</p>
      </footer>
    </div>
  );
};
