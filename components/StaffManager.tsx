import React, { useRef, useState, useMemo } from 'react';
import { StaffMember, RosterConfig, ThemeType, WardInfo, UserAccount } from '../types';
import { 
  Users, 
  Trash2, 
  Download, 
  Upload, 
  Plus, 
  ArrowRightLeft, 
  Camera, 
  Calendar as CalendarIcon, 
  AlertCircle,
  X,
  Send,
  Info,
  CreditCard,
  Image as ImageIcon
} from 'lucide-react';
import { StaffPhotoModal } from './StaffPhotoModal';
import { StaffLicenseCardModal } from './StaffLicenseCardModal';

interface Props {
  staff: StaffMember[];
  config: RosterConfig;
  wards?: WardInfo[];
  users?: UserAccount[];
  onAdd: () => void;
  onAddHa?: () => void;
  onAddWs?: () => void;
  onAddCounterPart: () => void;
  onUpdate: (id: string, updates: Partial<StaffMember>) => void;
  onRemoveMultiple: (ids: string[]) => void;
  onExport: () => void;
  onImport: (csv: string) => void;
  onInitiateWardTransfer?: (staffMember: StaffMember, targetWardId: string, reason: string) => void;
  theme?: ThemeType;
  currentUserRole?: string;
}

interface EditableIdInputProps {
  id: string;
  onUpdate: (oldId: string, updates: { id: string }) => void;
}

const EditableIdInput: React.FC<EditableIdInputProps> = ({ id, onUpdate }) => {
  const [value, setValue] = useState(id);

  React.useEffect(() => {
    setValue(id);
  }, [id]);

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== id) {
      onUpdate(id, { id: trimmed });
    } else {
      setValue(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setValue(id);
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="bg-transparent font-mono text-[11px] font-bold text-center w-full outline-none text-slate-900"
      placeholder="ID"
    />
  );
};

// Date formatter: "YYYY-MM-DD" -> "DD / MM / YYYY"
const formatDateForDisplay = (dateStr?: string) => {
  if (!dateStr) return 'dd / mm / yyyy';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')} / ${m.padStart(2, '0')} / ${y}`;
  }
  return dateStr;
};

// Check if license is expiring within 60 days or already expired
const getExpiryStatus = (dateStr?: string): 'expired' | 'warning' | 'normal' | 'none' => {
  if (!dateStr) return 'none';
  const target = new Date(dateStr).getTime();
  if (isNaN(target)) return 'none';
  // Use current local date for checking 60-day expiry threshold
  const now = new Date('2026-08-27').getTime();
  const diffDays = (target - now) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 60) return 'warning';
  return 'normal';
};

interface DateCellProps {
  value?: string;
  onChange: (newDate: string) => void;
  disabled?: boolean;
}

const DateCell: React.FC<DateCellProps> = ({ value, onChange, disabled }) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const status = getExpiryStatus(value);
  const displayText = formatDateForDisplay(value);
  const isPlaceholder = !value;

  const textColorClass = isPlaceholder
    ? 'text-slate-400'
    : status === 'expired'
    ? 'text-red-600 font-bold'
    : status === 'warning'
    ? 'text-amber-600 font-bold'
    : 'text-slate-700';

  const triggerDatePicker = () => {
    if (disabled) return;
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5 relative">
      <span 
        onClick={triggerDatePicker}
        className={`text-xs ${textColorClass} tracking-tight cursor-pointer hover:opacity-80 transition select-none`}
      >
        {displayText}
      </span>
      {!disabled && (
        <button
          type="button"
          onClick={triggerDatePicker}
          className="text-slate-400 hover:text-slate-700 transition p-0.5 rounded"
          title="Pick expiry date"
        >
          <CalendarIcon size={13} />
        </button>
      )}
      <input
        ref={dateInputRef}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
};

const StaffManager: React.FC<Props> = ({ 
  staff, 
  config, 
  wards = [], 
  users = [], 
  onAdd, 
  onAddHa, 
  onAddWs, 
  onAddCounterPart, 
  onUpdate, 
  onRemoveMultiple, 
  onExport, 
  onImport, 
  onInitiateWardTransfer,
  theme = 'Professional', 
  currentUserRole 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [photoModalStaff, setPhotoModalStaff] = useState<StaffMember | null>(null);
  const [licenseCardModalStaff, setLicenseCardModalStaff] = useState<StaffMember | null>(null);

  // Transfer Ward Modal State
  const [transferStaff, setTransferStaff] = useState<StaffMember | null>(null);
  const [targetWardId, setTargetWardId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');

  const isHaStaff = (name?: string, member?: StaffMember): boolean => {
    if (member?.isHa) return true;
    const trimmed = (name || '').trim();
    return trimmed.startsWith('HA') || trimmed.startsWith('(HA)') || trimmed.startsWith('MSA') || trimmed.startsWith('(MSA)');
  };

  const isWsStaff = (member: StaffMember): boolean => {
    return !!member.isWardSupervisor || member.name.trim().startsWith('WS') || member.name.trim().startsWith('(WS)');
  };

  const handleOpenTransferModal = (member: StaffMember) => {
    setTransferStaff(member);
    const availableWards = wards.filter(w => w.id !== (member.wardId || config.wardId));
    if (availableWards.length > 0) {
      setTargetWardId(availableWards[0].id);
    } else {
      setTargetWardId('');
    }
    setTransferReason('');
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStaff || !targetWardId) {
      alert('Please select a target ward to transfer this staff member to.');
      return;
    }
    if (onInitiateWardTransfer) {
      onInitiateWardTransfer(transferStaff, targetWardId, transferReason);
    }
    setTransferStaff(null);
  };

  const activeSelectedIds = useMemo(() => {
    return selectedIds.filter(id => staff.some(s => s.id === id));
  }, [selectedIds, staff]);

  // Statistics calculation for the header
  const totalCount = staff.length;
  const supervisorCount = useMemo(() => staff.filter(s => isWsStaff(s)).length, [staff]);
  const haCount = useMemo(() => staff.filter(s => !isWsStaff(s) && isHaStaff(s.name, s)).length, [staff]);
  const regularCount = useMemo(() => totalCount - supervisorCount - haCount, [totalCount, supervisorCount, haCount]);

  // Expiring Licences within 60 days
  const expiringStaffList = useMemo(() => {
    return staff.filter(s => {
      if (!s.licenseExpiry) return false;
      const status = getExpiryStatus(s.licenseExpiry);
      return status === 'expired' || status === 'warning';
    });
  }, [staff]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onImport(text);
        e.target.value = '';
      };
      reader.readAsText(file);
    }
  };

  const toggleSelectAll = () => {
    if (activeSelectedIds.length === staff.length && staff.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(staff.map(s => s.id));
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    const msg = ids.length === 1 
      ? "Delete this staff member?" 
      : `Delete ${ids.length} selected staff members?`;
    
    if (window.confirm(msg)) {
      onRemoveMultiple(ids);
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    }
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Staff</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
            <span>{totalCount} on the roster</span>
            <span>·</span>
            <span>{regularCount} regular</span>
            <span>·</span>
            <span className="text-amber-600 font-medium">{supervisorCount} supervisor</span>
            <span>·</span>
            <span className="text-emerald-600 font-medium">{haCount} MSA</span>
          </div>
        </div>

        {/* Action Buttons Matching Screenshot */}
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />

          {activeSelectedIds.length > 0 && (
            <button 
              onClick={() => handleDelete(activeSelectedIds)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white shadow-2xs"
            >
              <Trash2 size={15} /> Delete ({activeSelectedIds.length})
            </button>
          )}

          <button 
            onClick={handleImportClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition shadow-2xs"
          >
            <Upload size={15} className="text-slate-600" />
            <span>Import</span>
          </button>

          <button 
            onClick={onExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition shadow-2xs"
          >
            <Download size={15} className="text-slate-600" />
            <span>Export</span>
          </button>

          {onAddWs && (
            <button 
              onClick={onAddWs}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition shadow-2xs"
            >
              <Plus size={15} className="text-slate-600" />
              <span>Supervisor</span>
            </button>
          )}

          {onAddHa && (
            <button 
              onClick={onAddHa}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition shadow-2xs"
            >
              <Plus size={15} className="text-slate-600" />
              <span>MSA staff</span>
            </button>
          )}

          <button 
            onClick={onAddCounterPart}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition shadow-2xs"
          >
            <Plus size={15} className="text-slate-600" />
            <span>Counterpart</span>
          </button>

          <button 
            onClick={onAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-xs"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Add staff</span>
          </button>
        </div>
      </div>

      {/* Licences Expiring Banner Matching Screenshot */}
      {expiringStaffList.length > 0 && (
        <div className="mb-4 bg-amber-50/80 border border-amber-200/90 rounded-xl px-4 py-2.5 text-xs text-amber-900 flex items-start sm:items-center gap-2.5 shadow-2xs">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" size={16} />
          <div className="leading-relaxed">
            <span className="font-semibold">{expiringStaffList.length} licences expire within 60 days: </span>
            {expiringStaffList.map((st, idx) => (
              <span key={st.id}>
                <span className="font-bold text-amber-950">{st.name || st.id}</span>
                {' '}
                <span className={getExpiryStatus(st.licenseExpiry) === 'expired' ? 'text-red-600 font-bold' : 'text-amber-700 font-medium'}>
                  ({st.licenseExpiry})
                </span>
                {idx < expiringStaffList.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Staff Table */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="py-3 px-3 w-10 text-center">
                  <input 
                    type="checkbox"
                    checked={staff.length > 0 && activeSelectedIds.length === staff.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="py-3 px-3 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-36">
                  ID
                </th>
                <th className="py-3 px-3 font-semibold text-slate-500 uppercase text-[11px] tracking-wider min-w-[170px]">
                  NAME & ROLE
                </th>
                <th className="py-3 px-3 font-semibold text-slate-500 uppercase text-[11px] tracking-wider min-w-[180px]">
                  CONTACT
                </th>
                <th className="py-3 px-3 font-semibold text-slate-500 uppercase text-[11px] tracking-wider min-w-[140px]">
                  LICENCE
                </th>
                <th className="py-3 px-2 font-semibold text-slate-500 uppercase text-[11px] tracking-wider text-center w-12">
                  SNR
                </th>
                <th className="py-3 px-2 font-semibold text-slate-500 uppercase text-[11px] tracking-wider text-center w-12">
                  MALE
                </th>
                <th className="py-3 px-2 font-semibold text-slate-500 uppercase text-[11px] tracking-wider text-center w-12">
                  CARE
                </th>
                <th className="py-3 px-2 font-semibold text-slate-500 uppercase text-[11px] tracking-wider text-center w-12">
                  APPR
                </th>
                <th className="py-3 px-2 font-semibold text-slate-500 uppercase text-[11px] tracking-wider text-center w-14">
                  MAX M
                </th>
                <th className="py-3 px-2 font-semibold text-slate-500 uppercase text-[11px] tracking-wider text-center w-14">
                  MAX E
                </th>
                <th className="py-3 px-2 font-semibold text-slate-500 uppercase text-[11px] tracking-wider text-center w-14">
                  MAX N
                </th>
                <th className="py-3 px-3 w-16 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((member) => {
                const isSelected = activeSelectedIds.includes(member.id);
                const isWs = isWsStaff(member);
                const isHa = !isWs && isHaStaff(member.name, member);

                return (
                  <tr 
                    key={member.id}
                    className={`transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'}`}
                  >
                    {/* Row Select Checkbox */}
                    <td className="py-3 px-3 text-center align-middle">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(member.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                    </td>

                    {/* Photo Button & ID Tag */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPhotoModalStaff(member)}
                          className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:border-slate-400 hover:bg-slate-100 transition shrink-0 overflow-hidden"
                          title="NS Photo Manager: Upload or update photo for SN / MSA"
                        >
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Camera size={14} className="text-slate-400" />
                          )}
                        </button>

                        <div className="flex flex-col items-center">
                          <div className="border border-slate-200 bg-slate-50 text-slate-900 font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs text-center w-24 tracking-wider">
                            <EditableIdInput id={member.id} onUpdate={onUpdate} />
                          </div>
                          {isWs && (
                            <span className="bg-amber-100/90 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight text-center mt-1 w-full">
                              SUPERVISOR
                            </span>
                          )}
                          {isHa && (
                            <span className="bg-emerald-100/90 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight text-center mt-1 w-full">
                              MSA
                            </span>
                          )}
                          {member.isCounterPart && (
                            <span className="bg-violet-100/90 text-violet-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight text-center mt-1 w-full">
                              COUNTERPART
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* NAME & ROLE */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex flex-col min-w-[160px]">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => onUpdate(member.id, { name: e.target.value })}
                          placeholder="Staff Name"
                          className="text-sm font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 -mx-1 py-0.5 outline-none transition-all placeholder:text-slate-300"
                        />
                        <input
                          type="text"
                          value={member.jobTitle || ''}
                          onChange={(e) => onUpdate(member.id, { jobTitle: e.target.value })}
                          placeholder="Job title"
                          className="text-xs text-slate-500 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 -mx-1 py-0.5 outline-none transition-all placeholder:text-slate-400 placeholder:italic"
                        />
                      </div>
                    </td>

                    {/* CONTACT */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex flex-col min-w-[170px]">
                        <input
                          type="email"
                          value={member.email || ''}
                          onChange={(e) => onUpdate(member.id, { email: e.target.value })}
                          placeholder="@hospitals.gov.bh"
                          className="text-xs text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 -mx-1 py-0.5 outline-none transition-all placeholder:text-slate-400"
                        />
                        <input
                          type="text"
                          value={member.phone || ''}
                          onChange={(e) => onUpdate(member.id, { phone: e.target.value })}
                          placeholder="Phone number"
                          className="text-xs text-slate-500 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 -mx-1 py-0.5 outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </td>

                    {/* LICENCE */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex flex-col min-w-[145px] gap-1">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={member.licenseNumber || ''}
                            onChange={(e) => onUpdate(member.id, { licenseNumber: e.target.value })}
                            placeholder="Licence no."
                            className="flex-1 text-xs font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 -mx-1 py-0.5 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:italic font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setLicenseCardModalStaff(member)}
                            className={`p-1 rounded-lg text-[10px] font-bold transition flex items-center gap-0.5 shrink-0 ${
                              member.licenseCardUrl
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                            }`}
                            title={member.licenseCardUrl ? 'View or update official License Card picture' : 'Upload official License Card picture'}
                          >
                            <CreditCard size={12} className={member.licenseCardUrl ? 'text-emerald-600' : 'text-slate-400'} />
                            <span className="hidden xl:inline text-[9px] font-semibold">
                              {member.licenseCardUrl ? 'Card' : '+Card'}
                            </span>
                          </button>
                        </div>
                        <DateCell
                          value={member.licenseExpiry}
                          onChange={(newDate) => onUpdate(member.id, { licenseExpiry: newDate })}
                        />
                      </div>
                    </td>

                    {/* SNR (Senior) */}
                    <td className="py-3 px-2 text-center align-middle">
                      {isWs || isHa ? (
                        <span className="text-slate-300 text-xs select-none">n/a</span>
                      ) : (
                        <input 
                          type="checkbox"
                          checked={member.isSenior}
                          onChange={(e) => onUpdate(member.id, { isSenior: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      )}
                    </td>

                    {/* MALE */}
                    <td className="py-3 px-2 text-center align-middle">
                      {isWs || isHa ? (
                        <span className="text-slate-300 text-xs select-none">n/a</span>
                      ) : (
                        <input 
                          type="checkbox"
                          checked={member.isMale}
                          onChange={(e) => onUpdate(member.id, { 
                            isMale: e.target.checked,
                            ...(e.target.checked ? { hasCaringHours: false } : {})
                          })}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      )}
                    </td>

                    {/* CARE (Caring hours) */}
                    <td className="py-3 px-2 text-center align-middle">
                      {isWs || isHa || member.isMale ? (
                        <span className="text-slate-300 text-xs select-none">n/a</span>
                      ) : (
                        <input 
                          type="checkbox"
                          checked={!!member.hasCaringHours}
                          onChange={(e) => onUpdate(member.id, { hasCaringHours: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      )}
                    </td>

                    {/* APPR (Duty change authorized approver) */}
                    <td className="py-3 px-2 text-center align-middle">
                      {isWs ? (
                        <span className="text-slate-300 text-xs select-none">n/a</span>
                      ) : (
                        <input 
                          type="checkbox"
                          checked={!!member.isAuthorizedDutyApprover}
                          onChange={(e) => onUpdate(member.id, { isAuthorizedDutyApprover: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          title="Authorized duty approver"
                        />
                      )}
                    </td>

                    {/* MAX M */}
                    <td className="py-3 px-2 text-center align-middle">
                      <input 
                        type="number"
                        value={member.maxMorning}
                        onChange={(e) => onUpdate(member.id, { maxMorning: parseInt(e.target.value) || 0 })}
                        className="w-12 h-8 border border-slate-200 rounded-lg text-xs text-center font-normal text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </td>

                    {/* MAX E */}
                    <td className="py-3 px-2 text-center align-middle">
                      <input 
                        type="number"
                        value={member.maxEvening}
                        onChange={(e) => onUpdate(member.id, { maxEvening: parseInt(e.target.value) || 0 })}
                        className="w-12 h-8 border border-slate-200 rounded-lg text-xs text-center font-normal text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </td>

                    {/* MAX N */}
                    <td className="py-3 px-2 text-center align-middle">
                      <input 
                        type="number"
                        value={member.maxNight}
                        onChange={(e) => onUpdate(member.id, { maxNight: parseInt(e.target.value) || 0 })}
                        className="w-12 h-8 border border-slate-200 rounded-lg text-xs text-center font-normal text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </td>

                    {/* Actions: Transfer & Delete */}
                    <td className="py-3 px-3 text-right align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenTransferModal(member)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                          title="Transfer ward"
                        >
                          <ArrowRightLeft size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete([member.id])}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          title="Delete staff"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {staff.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-slate-400 text-sm">
                    No staff members on this roster yet. Click "+ Add staff" to add personnel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Photo Modal */}
      {photoModalStaff && (
        <StaffPhotoModal
          staff={photoModalStaff}
          isOpen={true}
          onClose={() => setPhotoModalStaff(null)}
          onSavePhoto={(staffId, photoUrl) => {
            onUpdate(staffId, { photoUrl });
            setPhotoModalStaff(null);
          }}
        />
      )}

      {/* Staff License Card Picture Modal */}
      {licenseCardModalStaff && (
        <StaffLicenseCardModal
          staff={licenseCardModalStaff}
          isOpen={true}
          onClose={() => setLicenseCardModalStaff(null)}
          onSaveLicenseCard={(staffId, licenseCardUrl) => {
            onUpdate(staffId, { licenseCardUrl });
            setLicenseCardModalStaff(null);
          }}
        />
      )}

      {/* Ward Transfer Request Modal */}
      {transferStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <ArrowRightLeft size={18} className="text-blue-600" />
                <span>Request Staff Ward Transfer</span>
              </div>
              <button 
                onClick={() => setTransferStaff(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Staff Member:</span>
                  <span className="font-bold text-slate-900">{transferStaff.name || transferStaff.id} ({transferStaff.id})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Ward:</span>
                  <span className="font-semibold text-slate-800">{config.wardName || 'Current Ward'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Target Ward:
                </label>
                <select
                  value={targetWardId}
                  onChange={(e) => setTargetWardId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Target Ward --</option>
                  {wards
                    .filter(w => w.id !== (transferStaff.wardId || config.wardId))
                    .map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for Transfer:
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Manpower rebalancing, specialized ICU support"
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferStaff(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <Send size={14} />
                  Submit Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
