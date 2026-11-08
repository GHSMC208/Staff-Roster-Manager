import React, { useState } from 'react';
import { UserAccount, WardInfo, StaffMember } from '../types';
import { 
  Crown, 
  ShieldCheck, 
  UserCheck, 
  Mail, 
  KeyRound, 
  Sparkles, 
  AlertCircle, 
  Building2, 
  ArrowRight,
  User,
  X,
  CheckCircle2,
  Lock,
  Activity,
  Search
} from 'lucide-react';
import { PasswordAuthModal, PendingAuthUser } from './PasswordAuthModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  wards: WardInfo[];
  staff: StaffMember[];
  onLoginUser: (user: UserAccount) => void;
  onLoginStaffByEmail: (email: string) => boolean;
  onLoginStaffById?: (staffId: string) => boolean;
  currentUser?: UserAccount;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  wards,
  staff,
  onLoginUser,
  onLoginStaffByEmail,
  onLoginStaffById,
  currentUser
}) => {
  const [inputEmail, setInputEmail] = useState('');
  const [inputPasscode, setInputPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'admin' | 'cns' | 'head_nurse' | 'nurse_supervisor' | 'staff'>('all');
  const [modalSearch, setModalSearch] = useState('');
  const [pendingAuthUser, setPendingAuthUser] = useState<PendingAuthUser | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleQuickEmailLogin = (email: string) => {
    setErrorMsg(null);
    const clean = email.trim().toLowerCase();
    const matchedUser = users.find(u => u.email.trim().toLowerCase() === clean);
    if (matchedUser) {
      const ward = wards.find(w => w.id === matchedUser.wardId);
      setPendingAuthUser({
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        nurseDesignation: matchedUser.nurseDesignation,
        jobTitle: matchedUser.jobTitle,
        photoUrl: matchedUser.photoUrl,
        wardName: ward?.name,
        staffMemberId: matchedUser.staffMemberId,
        userAccount: matchedUser
      });
      setIsPasswordModalOpen(true);
      return;
    }

    const matchedStaff = staff.find(s => 
      (s.email && s.email.trim().toLowerCase() === clean) ||
      s.id.toLowerCase() === clean
    );
    if (matchedStaff) {
      const ward = wards.find(w => w.id === matchedStaff.wardId);
      setPendingAuthUser({
        id: matchedStaff.id,
        name: matchedStaff.name,
        email: matchedStaff.email || `${matchedStaff.id.toLowerCase()}@hospital.org`,
        role: 'staff',
        nurseDesignation: matchedStaff.isHa ? 'MSA' : 'SN',
        jobTitle: matchedStaff.jobTitle || (matchedStaff.isHa ? 'Medical Service Aid' : 'Staff Nurse'),
        wardName: ward?.name,
        staffMemberId: matchedStaff.id,
        staffMember: matchedStaff
      });
      setIsPasswordModalOpen(true);
      return;
    }

    setErrorMsg(`No registered hospital account found for "${email}". Please select from the list below.`);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const clean = inputEmail.trim().toLowerCase();
    
    if (!clean) {
      setErrorMsg('Please enter your registered hospital email address or Staff ID.');
      return;
    }

    handleQuickEmailLogin(clean);
  };

  const handleSuccessAuthLogin = (authUser: PendingAuthUser) => {
    setIsPasswordModalOpen(false);
    if (authUser.userAccount) {
      onLoginUser(authUser.userAccount);
      onClose();
    } else if (authUser.staffMember) {
      if (authUser.staffMember.email) {
        const success = onLoginStaffByEmail(authUser.staffMember.email);
        if (success) {
          onClose();
          return;
        }
      }
      if (onLoginStaffById) {
        onLoginStaffById(authUser.staffMember.id);
      }
      onClose();
    } else {
      const clean = authUser.email.trim().toLowerCase();
      const u = users.find(acc => acc.email.toLowerCase() === clean);
      if (u) {
        onLoginUser(u);
        onClose();
        return;
      }
      const s = staff.find(st => st.email?.toLowerCase() === clean || st.id.toLowerCase() === authUser.id?.toLowerCase());
      if (s) {
        if (s.email && onLoginStaffByEmail(s.email)) {
          onClose();
          return;
        }
        if (onLoginStaffById) onLoginStaffById(s.id);
        onClose();
        return;
      }
    }
  };

  // Compile full list of accounts categorized into tiers
  const registeredAccounts: Array<{ 
    name: string; 
    email: string; 
    role: 'admin' | 'cns' | 'dcns' | 'head_nurse' | 'nurse_supervisor' | 'staff'; 
    detail: string;
    badge: string;
    color: string;
  }> = [];

  users.forEach(u => {
    if (u.role === 'admin') {
      registeredAccounts.push({
        name: u.name,
        email: u.email,
        role: 'admin',
        detail: 'Hospital Apex Admin • Controls Head Nurses',
        badge: 'Main Admin',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      });
    } else if (u.role === 'cns' || u.nurseDesignation === 'CNS') {
      // In CNS account, hide own account or other CNS if desired
      const isCurrentThisUser = currentUser?.id === u.id;
      if (isCurrentThisUser) {
        return; // hide current user
      }

      registeredAccounts.push({
        name: u.name,
        email: u.email,
        role: 'cns',
        detail: `Chief Nursing Services (CNS) • ${u.category || 'Division'} Executive`,
        badge: `CNS • ${u.category || 'Division'}`,
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      });
    } else if (u.role === 'dcns' || u.nurseDesignation === 'DCNS') {
      const isCurrentThisUser = currentUser?.id === u.id;
      if (isCurrentThisUser) {
        return;
      }

      registeredAccounts.push({
        name: u.name,
        email: u.email,
        role: 'cns',
        detail: `Deputy Chief (DCNS) • ${u.category || 'Division'} • Reports to ${u.cnsName || 'CNS'}`,
        badge: `DCNS • ${u.category || 'Division'}`,
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      });
    } else if (u.role === 'head_nurse' || u.role === 'ward_supervisor' || u.nurseDesignation === 'HN') {
      const ward = wards.find(w => w.id === u.wardId);
      const cat = u.category || (ward?.category) || 'Medical';
      registeredAccounts.push({
        name: u.name,
        email: u.email,
        role: 'head_nurse',
        detail: `Head Nurse (HN) • ${cat} Division • ${ward ? ward.name : 'Ward'} In-Charge`,
        badge: `HN • ${cat}`,
        color: cat === 'Excellency' 
          ? 'bg-purple-100 text-purple-800 border-purple-200' 
          : cat === 'Surgical' 
          ? 'bg-rose-100 text-rose-800 border-rose-200' 
          : 'bg-amber-100 text-amber-800 border-amber-200'
      });
    } else if (u.role === 'nurse_supervisor' || u.nurseDesignation === 'NS') {
      const ward = wards.find(w => w.id === u.wardId);
      registeredAccounts.push({
        name: u.name,
        email: u.email,
        role: 'nurse_supervisor',
        detail: `Nurse Supervisor (NS) • ${ward ? ward.code : 'Unit'} Team Leader`,
        badge: 'Nurse Supervisor (NS)',
        color: 'bg-cyan-100 text-cyan-800 border-cyan-200'
      });
    }
  });

  staff.forEach(s => {
    const emailToUse = s.email || `${s.id.toLowerCase()}@hospital.org`;
    if (!registeredAccounts.some(a => a.email.toLowerCase() === emailToUse.toLowerCase())) {
      const ward = wards.find(w => w.id === s.wardId);
      const isHa = !!s.isHa || s.name.includes('(HA)') || s.name.includes('(MSA)');
      registeredAccounts.push({
        name: s.name,
        email: emailToUse,
        role: 'staff',
        detail: `${isHa ? 'Medical Service Aid (MSA)' : (s.isSenior ? 'Senior Staff Nurse' : 'Staff Nurse')} (${s.id}) • ${ward ? ward.code || ward.name : 'ICU'}`,
        badge: isHa ? 'Medical Service Aid (MSA)' : 'Staff Nurse (SN)',
        color: isHa ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
      });
    }
  });

  const filteredAccounts = registeredAccounts.filter(acc => {
    if (activeFilter === 'admin' && acc.role !== 'admin') return false;
    if (activeFilter === 'cns' && acc.role !== 'cns') return false;
    if (activeFilter === 'head_nurse' && acc.role !== 'head_nurse') return false;
    if (activeFilter === 'nurse_supervisor' && acc.role !== 'nurse_supervisor') return false;
    if (activeFilter === 'staff' && acc.role !== 'staff') return false;

    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      return acc.name.toLowerCase().includes(q) || 
             acc.email.toLowerCase().includes(q) || 
             acc.detail.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] p-5 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-100 space-y-5 relative animate-in fade-in zoom-in duration-200 my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full flex items-center justify-center transition font-bold"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-[10px] font-black uppercase tracking-widest">
            <Lock size={12} className="text-indigo-600" />
            Hospital 4-Tier Account Switcher
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Switch Active Account</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select any account from the 4-tier hierarchy or enter a registered hospital email to switch instantly.
          </p>
        </div>

        {/* Primary Email Sign-In Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <label className="block text-xs font-black uppercase text-slate-800 mb-1 flex items-center gap-1.5">
              <Mail size={13} className="text-indigo-600" />
              Registered Hospital Email or Staff ID <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input 
                type="text"
                value={inputEmail}
                onChange={(e) => { setInputEmail(e.target.value); setErrorMsg(null); }}
                placeholder="e.g. admin@hospital.org, david.hn.icu@hospital.org, rachel.ns.icu1@hospital.org"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm placeholder:text-slate-400 placeholder:font-normal"
              />
              <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            <span>Authenticate & Switch Session</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* 4-Tier Hierarchy Quick-Switch Directory */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600" />
              1-Click Switch Directory (4-Tier Roles):
            </span>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search account..."
                className="pl-7 pr-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
              />
              <Search size={11} className="absolute left-2 top-2 text-slate-400" />
            </div>
          </div>

          {/* 5-Tier Role Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold text-slate-600">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 min-w-[50px] py-1 px-2 rounded-lg transition text-center ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}`}
            >
              All ({registeredAccounts.length})
            </button>
            <button
              onClick={() => setActiveFilter('admin')}
              className={`flex-1 min-w-[65px] py-1 px-2 rounded-lg transition text-center ${activeFilter === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-slate-900'}`}
            >
              Admin
            </button>
            {!(currentUser?.role === 'cns' || currentUser?.nurseDesignation === 'CNS') && (
              <button
                onClick={() => setActiveFilter('cns')}
                className={`flex-1 min-w-[75px] py-1 px-2 rounded-lg transition text-center ${activeFilter === 'cns' ? 'bg-purple-600 text-white shadow-sm' : 'hover:text-slate-900'}`}
              >
                CNS / DCNS
              </button>
            )}
            <button
              onClick={() => setActiveFilter('head_nurse')}
              className={`flex-1 min-w-[70px] py-1 px-2 rounded-lg transition text-center ${activeFilter === 'head_nurse' ? 'bg-amber-600 text-white shadow-sm' : 'hover:text-slate-900'}`}
            >
              HN
            </button>
            <button
              onClick={() => setActiveFilter('nurse_supervisor')}
              className={`flex-1 min-w-[70px] py-1 px-2 rounded-lg transition text-center ${activeFilter === 'nurse_supervisor' ? 'bg-cyan-600 text-white shadow-sm' : 'hover:text-slate-900'}`}
            >
              NS
            </button>
            <button
              onClick={() => setActiveFilter('staff')}
              className={`flex-1 min-w-[75px] py-1 px-2 rounded-lg transition text-center ${activeFilter === 'staff' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-slate-900'}`}
            >
              SN / MSA
            </button>
          </div>

          {/* Accounts List */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {filteredAccounts.map((account, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickEmailLogin(account.email)}
                className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-300 rounded-xl text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                    account.role === 'admin' ? 'bg-indigo-600 text-white' :
                    account.role === 'cns' ? 'bg-purple-600 text-white' :
                    account.role === 'head_nurse' ? 'bg-amber-500 text-slate-950' :
                    account.role === 'nurse_supervisor' ? 'bg-cyan-500 text-slate-950' :
                    'bg-emerald-500 text-slate-950'
                  }`}>
                    {account.role === 'admin' && <Crown size={14} />}
                    {account.role === 'cns' && <Sparkles size={14} />}
                    {account.role === 'head_nurse' && <ShieldCheck size={14} />}
                    {account.role === 'nurse_supervisor' && <Activity size={14} />}
                    {account.role === 'staff' && <UserCheck size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900 truncate group-hover:text-indigo-600">
                        {account.name}
                      </span>
                      <span className={`px-1.5 py-0.2 text-[8px] font-black uppercase rounded border ${account.color}`}>
                        {account.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{account.email} • {account.detail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <span>Switch</span>
                  <CheckCircle2 size={13} />
                </div>
              </button>
            ))}

            {filteredAccounts.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                No accounts found matching this filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Authentication & OTP Reset Popup Modal */}
      <PasswordAuthModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        targetUser={pendingAuthUser}
        onSuccessLogin={handleSuccessAuthLogin}
      />
    </div>
  );
};
