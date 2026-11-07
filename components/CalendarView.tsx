
import React, { useState } from 'react';
import { StaffMember, RosterConfig, Assignment, ThemeType, UserRole, UserAccount, WardInfo } from '../types';
import { ICONS } from '../constants';
import { Table2, PhoneCall, Database } from 'lucide-react';
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
  onExportCSV?: () => void;
  onOpenAccessExport?: () => void;
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
  onExportCSV, 
  onOpenAccessExport,
  theme = 'Professional',
  onUpdateConfig,
  isTopAdmin = false,
  currentUserRole,
  currentUser
}) => {
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

  const isLeadership = isGcns || isCns || isHeadNurse;

  const isStaffOrMsa = currentUserRole === 'staff' || 
    currentUser?.role === 'staff' || 
    currentUser?.nurseDesignation === 'SN' || 
    currentUser?.nurseDesignation === 'MSA' ||
    currentUser?.nurseDesignation === 'HA';

  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'daily' | 'oncall'>('table');

  // Hide Staff Duty Cards and Daily Sheet from GCNS, CNS, HN, as well as Staff/MSA
  const isRestrictedView = isStaffOrMsa || isLeadership;

  // Hide Export CSV from GCNS, CNS, HN, and Staff accounts in Table Grid
  const shouldHideExportCSV = isLeadership || isStaffOrMsa;

  const handlePrint = () => {
    window.print();
  };

  const activeViewMode = (isStaffOrMsa && (viewMode === 'cards' || viewMode === 'daily' || viewMode === 'oncall')) 
    ? 'table' 
    : viewMode;

  return (
    <div className="space-y-6" id="print-root">
      {/* Top Controls & Action Bar */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 no-print">
        
        {/* Left: Title, Ward Selector & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
              <ICONS.CalendarIcon size={20} />
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
              <p className="text-xs font-medium text-slate-500">Official Ward Duty Rota & Assignments</p>
            </div>
          </div>

          {/* Roster View Mode Toggle Bar */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                activeViewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Table2 size={14} />
              Table Grid
            </button>
            {!isRestrictedView && (
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  activeViewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ICONS.Plus size={14} className="rotate-45" />
                Staff Duty Cards
              </button>
            )}
            {!isRestrictedView && (
              <button
                onClick={() => setViewMode('daily')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  activeViewMode === 'daily'
                    ? 'bg-white text-blue-600 shadow-sm'
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  activeViewMode === 'oncall'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <PhoneCall size={14} />
                On-Call List
              </button>
            )}
          </div>
        </div>

        {/* Right: Action Buttons Group (Export CSV & Print / PDF for Table Grid) */}
        {activeViewMode === 'table' && (
          <div className="flex items-center gap-2.5 w-full xl:w-auto justify-end shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
            {!shouldHideExportCSV && onExportCSV && (
              <button 
                onClick={onExportCSV}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl transition font-bold text-xs shadow-xs active:scale-95 cursor-pointer"
                title="Download Ward Roster as CSV File"
              >
                <ICONS.Download size={16} />
                Export CSV
              </button>
            )}
            {onOpenAccessExport && (
              <button 
                onClick={onOpenAccessExport}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl transition font-bold text-xs shadow-xs active:scale-95 cursor-pointer"
                title="Export entire system to Microsoft Access (.accdb) database"
              >
                <Database size={16} />
                MS Access (.accdb)
              </button>
            )}
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition font-black text-xs uppercase tracking-wider shadow-md active:scale-95 cursor-pointer"
              title="Print or Save Roster as PDF Document"
            >
              <ICONS.Printer size={16} />
              Print / PDF
            </button>
          </div>
        )}
      </div>

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
            readOnly={true} 
            hideContextDays={true}
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
