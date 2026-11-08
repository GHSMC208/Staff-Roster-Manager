import React, { useState, useMemo, useRef } from 'react';
import { StaffMember, RosterConfig, Assignment, ShiftType, ThemeType, UserRole, UserAccount, WardInfo } from '../types';
import { ICONS, MONTHS } from '../constants';
import { 
  Table2, 
  PhoneCall, 
  Edit3, 
  Eye, 
  RotateCcw, 
  Trash2, 
  Upload, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Calendar as CalendarIcon, 
  Layers, 
  ChevronDown, 
  SlidersHorizontal 
} from 'lucide-react';
import ShiftGrid from './ShiftGrid';
import StaffCardsView from './StaffCardsView';
import DailyAssignmentsPrintView from './DailyAssignmentsPrintView';
import OnCallPrintView from './OnCallPrintView';
import { WardSearchSelector } from './WardSearchSelector';

interface Props {
  staff: StaffMember[];
  allStaff?: StaffMember[];
  wards?: WardInfo[];
  currentWardId?: string;
  onSelectWard?: (wardId: string) => void;
  config: RosterConfig;
  assignments: Assignment[];
  onUpdateAssignment?: (staffId: string, date: string, shift: ShiftType) => void;
  onUpdateBatch?: (updates: Assignment[]) => void;
  onResetPreviousMonthLast5Days?: () => void;
  onResetCurrentMonth?: () => void;
  onExportCSV?: () => void;
  onImportCSV?: (csv: string) => void;
  theme?: ThemeType;
  onUpdateConfig?: (config: RosterConfig) => void;
  isTopAdmin?: boolean;
  currentUserRole?: UserRole;
  currentUser?: UserAccount;
}

const CalendarView: React.FC<Props> = ({ 
  staff, 
  allStaff,
  wards,
  currentWardId,
  onSelectWard,
  config, 
  assignments, 
  onUpdateAssignment,
  onUpdateBatch,
  onResetPreviousMonthLast5Days,
  onResetCurrentMonth,
  onExportCSV, 
  onImportCSV,
  theme = 'Professional',
  onUpdateConfig,
  isTopAdmin = false,
  currentUserRole,
  currentUser
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Role permissions
  const isGcns = isTopAdmin || 
    currentUserRole === 'admin' || 
    currentUser?.role === 'admin' || 
    currentUser?.nurseDesignation === 'GCNS';

  const isCns = currentUserRole === 'cns' || 
    currentUser?.role === 'cns' || 
    currentUser?.nurseDesignation === 'CNS';

  const isHeadNurse = currentUserRole === 'head_nurse' || 
    currentUserRole === 'ward_supervisor' || 
    currentUser?.role === 'head_nurse' || 
    currentUser?.role === 'ward_supervisor' || 
    currentUser?.nurseDesignation === 'HN';

  const isSupervisor = currentUserRole === 'nurse_supervisor' || 
    currentUser?.role === 'nurse_supervisor' || 
    currentUser?.nurseDesignation === 'NS';

  const isLeadership = isGcns || isCns || isHeadNurse;

  const isStaffOrMsa = currentUserRole === 'staff' || 
    currentUser?.role === 'staff' || 
    currentUser?.nurseDesignation === 'SN' || 
    currentUser?.nurseDesignation === 'MSA' ||
    currentUser?.nurseDesignation === 'HA';

  // Can the user edit the shifts?
  const canEdit = (isSupervisor || isLeadership) && !!onUpdateAssignment;

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'daily' | 'oncall'>('table');
  
  // Edit mode vs Audit/View mode (default to Edit mode for Supervisors, View mode for executives/staff)
  const [isEditMode, setIsEditMode] = useState<boolean>(isSupervisor);
  const [showContextDays, setShowContextDays] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<'PREV_5' | 'CURRENT' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4500);
  };

  const handlePrint = () => {
    window.print();
  };

  const monthIdx = useMemo(() => {
    const idx = MONTHS.indexOf(config.month);
    return idx >= 0 ? idx : 0;
  }, [config.month]);

  const prevMonthLast5Days = useMemo(() => {
    return [-4, -3, -2, -1, 0].map(offset => {
      const d = new Date(config.year, monthIdx, offset);
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${day}`;
    });
  }, [config.year, monthIdx]);

  const currentMonthDays = useMemo(() => {
    const totalDays = new Date(config.year, monthIdx + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      const m = (monthIdx + 1).toString().padStart(2, '0');
      return `${config.year}-${m}-${day}`;
    });
  }, [config.year, monthIdx]);

  const prev5AssignmentsCount = useMemo(() => {
    const datesSet = new Set(prevMonthLast5Days);
    const staffIds = new Set(staff.map(s => s.id));
    return assignments.filter(a => datesSet.has(a.date) && a.shift !== ShiftType.None && staffIds.has(a.staffId)).length;
  }, [assignments, prevMonthLast5Days, staff]);

  const currentMonthAssignmentsCount = useMemo(() => {
    const datesSet = new Set(currentMonthDays);
    const staffIds = new Set(staff.map(s => s.id));
    return assignments.filter(a => datesSet.has(a.date) && a.shift !== ShiftType.None && staffIds.has(a.staffId)).length;
  }, [assignments, currentMonthDays, staff]);

  const executeResetPrev5 = () => {
    if (onResetPreviousMonthLast5Days) {
      onResetPreviousMonthLast5Days();
    } else if (onUpdateBatch) {
      const updates: Assignment[] = [];
      staff.forEach(s => {
        prevMonthLast5Days.forEach(date => {
          updates.push({ staffId: s.id, date, shift: ShiftType.None });
        });
      });
      onUpdateBatch(updates);
    }
    setConfirmModal(null);
    showFeedback("Previous month's last 5 context days duty entries have been successfully reset.");
  };

  const executeResetCurrent = () => {
    if (onResetCurrentMonth) {
      onResetCurrentMonth();
    } else if (onUpdateBatch) {
      const updates: Assignment[] = [];
      staff.forEach(s => {
        currentMonthDays.forEach(date => {
          updates.push({ staffId: s.id, date, shift: ShiftType.None });
        });
      });
      onUpdateBatch(updates);
    }
    setConfirmModal(null);
    showFeedback(`Current month (${config.month} ${config.year}) duty entries have been successfully reset.`);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportCSV) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onImportCSV(text);
        e.target.value = '';
      };
      reader.readAsText(file);
    }
  };

  const activeViewMode = (isStaffOrMsa && (viewMode === 'cards' || viewMode === 'daily' || viewMode === 'oncall')) 
    ? 'table' 
    : viewMode;

  return (
    <div className="space-y-6" id="print-root">
      <input type="file" ref={fileInputRef} onChange={handleImportFileChange} accept=".csv" className="hidden" />

      {/* Top Controls & Action Bar */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 no-print">
        
        {/* Left: Ward Title, Ward Selector & View Modes */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {config.wardName ? `${config.wardName} — ` : ''}{config.month} {config.year}
                </h2>
                {wards && wards.length > 1 && onSelectWard && isLeadership && (
                  <WardSearchSelector
                    wards={wards}
                    currentWardId={currentWardId || wards[0]?.id}
                    onSelectWard={onSelectWard}
                  />
                )}
              </div>
              <p className="text-xs font-medium text-slate-500">
                Official Ward Duty Rota & Assignments • {staff.length} Active Personnel
              </p>
            </div>
          </div>

          {/* Roster View Mode Segmented Controls */}
          <div className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeViewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Table2 size={14} />
              Table Grid
            </button>
            {!isStaffOrMsa && (
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeViewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={14} />
                Staff Cards
              </button>
            )}
            {!isStaffOrMsa && (
              <button
                onClick={() => setViewMode('daily')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeViewMode === 'daily'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ICONS.Save size={14} />
                Daily Sheet
              </button>
            )}
            {!isStaffOrMsa && (
              <button
                onClick={() => setViewMode('oncall')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeViewMode === 'oncall'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <PhoneCall size={14} />
                On-Call List
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions Toolbar (Edit Mode, Reset, Import, Export, Print) */}
        {activeViewMode === 'table' && (
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
            {/* Edit / View Mode Switch for Supervisors & Leadership */}
            {canEdit && (
              <div className="flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isEditMode 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Enable interactive cell editing and shift assignment"
                >
                  <Edit3 size={13} />
                  <span>Edit Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isEditMode 
                      ? 'bg-white text-slate-800 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to protected view (prevent accidental edits)"
                >
                  <Eye size={13} />
                  <span>View Only</span>
                </button>
              </div>
            )}

            {/* Context Days Toggle */}
            <button
              type="button"
              onClick={() => setShowContextDays(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                showContextDays
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Show or hide the 5 context days from the previous month"
            >
              Context Days: {showContextDays ? 'On' : 'Off'}
            </button>

            {/* Supervisor Roster Tools (Reset & CSV Import) */}
            {canEdit && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  <SlidersHorizontal size={14} />
                  <span>Manage</span>
                  <ChevronDown size={13} />
                </button>

                {isToolsOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                    {onImportCSV && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsToolsOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Upload size={14} className="text-blue-600" />
                        <span>Import CSV Schedule</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsOpen(false);
                        setConfirmModal('PREV_5');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-amber-900 hover:bg-amber-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <RotateCcw size={14} className="text-amber-600" />
                      <span>Reset Prev 5 Days ({prev5AssignmentsCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsOpen(false);
                        setConfirmModal('CURRENT');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-900 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Trash2 size={14} className="text-rose-600" />
                      <span>Reset Current Month ({currentMonthAssignmentsCount})</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Export CSV */}
            {onExportCSV && (
              <button 
                onClick={onExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition font-bold text-xs shadow-2xs cursor-pointer active:scale-95"
                title="Download Ward Roster as CSV File"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            )}



            {/* Print / PDF */}
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer active:scale-95"
              title="Print or Save Roster as PDF Document"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Temporary Feedback Notification */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium rounded-xl flex items-center justify-between shadow-2xs animate-in fade-in duration-200 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs ml-4 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Confirmation Modal for Resets */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${confirmModal === 'PREV_5' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {confirmModal === 'PREV_5' ? 'Reset Previous Month (Last 5 Days)?' : `Reset Current Month (${config.month} ${config.year})?`}
                  </h3>
                  <p className="text-xs text-slate-500">This action clears duty shift entries for active staff.</p>
                </div>
              </div>
              <button 
                onClick={() => setConfirmModal(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-2">
              {confirmModal === 'PREV_5' ? (
                <>
                  <p>
                    You are about to reset shift entries across the <strong className="text-slate-900">5 context days</strong> preceding {config.month} 1st:
                  </p>
                  <div className="flex flex-wrap gap-1 font-mono text-[11px] text-slate-800 font-bold">
                    {prevMonthLast5Days.map(d => (
                      <span key={d} className="px-2 py-0.5 bg-white rounded border border-slate-200 shadow-2xs">{d}</span>
                    ))}
                  </div>
                  <p className="text-amber-800 font-medium">
                    Currently assigned: <strong>{prev5AssignmentsCount}</strong> shift entries in this period.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    You are about to reset <strong className="text-slate-900">all shift assignments</strong> for the entire month of <strong className="text-slate-900">{config.month} {config.year}</strong> across {staff.length} staff members.
                  </p>
                  <p className="text-rose-800 font-medium">
                    Currently assigned: <strong>{currentMonthAssignmentsCount}</strong> shift entries will be wiped.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal === 'PREV_5' ? executeResetPrev5 : executeResetCurrent}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition cursor-pointer ${
                  confirmModal === 'PREV_5'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-sm'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-sm'
                }`}
              >
                {confirmModal === 'PREV_5' ? 'Confirm Reset 5 Days' : 'Confirm Wipe Current Month'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view Content Body */}
      {activeViewMode === 'cards' && (
        <StaffCardsView
          staff={staff}
          config={config}
          assignments={assignments}
          onBack={() => setViewMode('table')}
          appTheme={theme}
          showBackButton={false}
        />
      )}

      {activeViewMode === 'daily' && (
        <DailyAssignmentsPrintView
          staff={staff}
          config={config}
          assignments={assignments}
          onBack={() => setViewMode('table')}
          appTheme={theme}
          showBackButton={false}
        />
      )}

      {activeViewMode === 'oncall' && (
        <OnCallPrintView
          staff={staff}
          allStaff={allStaff}
          wards={wards}
          currentWardId={currentWardId}
          config={config}
          assignments={assignments}
          onBack={() => setViewMode('table')}
          appTheme={theme}
          showBackButton={false}
        />
      )}

      {activeViewMode === 'table' && (
        <>
          <div className="hidden print:block mb-4 text-center">
            {config.wardName && (
              <h2 className="text-lg font-black uppercase tracking-widest text-gray-700 mb-0.5">{config.wardName}</h2>
            )}
            <h1 className="text-2xl font-black uppercase tracking-widest">{config.month} {config.year} DUTY ROSTER</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Generated by AI Staff Manager</p>
          </div>

          <ShiftGrid 
            staff={staff} 
            config={config} 
            assignments={assignments} 
            onUpdate={onUpdateAssignment}
            onUpdateBatch={onUpdateBatch}
            readOnly={!canEdit || !isEditMode} 
            hideContextDays={!showContextDays}
            theme={theme}
          />
          
          <div className="hidden print:block mt-8 border-t border-slate-300 pt-4">
            <div className="flex justify-between items-end">
              <div className="space-y-4">
                <div className="w-48 h-px bg-slate-400 mb-1" />
                <p className="text-[10px] font-bold uppercase text-slate-500">Department Head Signature</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Printed on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarView;
