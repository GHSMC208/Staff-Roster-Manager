import React, { useRef, useMemo, useState } from 'react';
import { StaffMember, RosterConfig, Assignment, ShiftType, ThemeType } from '../types';
import ShiftGrid from './ShiftGrid';
import { ICONS, MONTHS } from '../constants';
import { RotateCcw, Trash2, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface Props {
  staff: StaffMember[];
  config: RosterConfig;
  assignments: Assignment[];
  onUpdateAssignment: (staffId: string, date: string, shift: ShiftType) => void;
  onUpdateBatch?: (updates: Assignment[]) => void;
  onResetPreviousMonthLast5Days?: () => void;
  onResetCurrentMonth?: () => void;
  onExport: () => void;
  onImport: (csv: string) => void;
  theme?: ThemeType;
}

const ManualEntry: React.FC<Props> = ({ 
  staff, 
  config, 
  assignments, 
  onUpdateAssignment, 
  onUpdateBatch,
  onResetPreviousMonthLast5Days,
  onResetCurrentMonth,
  onExport, 
  onImport,
  theme = 'Professional'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<'PREV_5' | 'CURRENT' | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4500);
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
    } else {
      staff.forEach(s => {
        prevMonthLast5Days.forEach(date => {
          onUpdateAssignment(s.id, date, ShiftType.None);
        });
      });
    }
    setConfirmModal(null);
    showFeedback("Previous month's last 5 days duty entries have been successfully reset.");
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
    } else {
      staff.forEach(s => {
        currentMonthDays.forEach(date => {
          onUpdateAssignment(s.id, date, ShiftType.None);
        });
      });
    }
    setConfirmModal(null);
    showFeedback(`Current month (${config.month} ${config.year}) duty entries have been successfully reset.`);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
            <ICONS.Edit size={20} className="text-blue-500" />
            Manual Duty Entry
          </h2>
          <p className="text-sm text-gray-500">Edit individual shifts, reset month periods, or import/export calendar templates</p>
        </div>
        
        {/* Actions Bar including Reset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

          {/* Reset Previous Month Last 5 Days */}
          <button 
            type="button"
            onClick={() => setConfirmModal('PREV_5')}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Reset / clear shifts for the previous month's last 5 context days"
          >
            <RotateCcw size={14} className="text-amber-700 shrink-0" />
            <span>Reset Prev 5 Days</span>
            {prev5AssignmentsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-200/80 text-amber-950 rounded-full text-[10px] font-mono font-black">
                {prev5AssignmentsCount}
              </span>
            )}
          </button>

          {/* Reset Current Month */}
          <button 
            type="button"
            onClick={() => setConfirmModal('CURRENT')}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300/80 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title={`Reset / clear all shifts for ${config.month} ${config.year}`}
          >
            <Trash2 size={14} className="text-rose-600 shrink-0" />
            <span>Reset Current Month</span>
            {currentMonthAssignmentsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-rose-200/80 text-rose-950 rounded-full text-[10px] font-mono font-black">
                {currentMonthAssignmentsCount}
              </span>
            )}
          </button>

          <div className="h-5 w-[1px] bg-gray-200 hidden sm:block mx-1" />

          <button onClick={handleImportClick} className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition shadow-xs cursor-pointer">
            <ICONS.Upload size={14} /> Import CSV
          </button>
          <button onClick={onExport} className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-emerald-600 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-50 transition shadow-xs cursor-pointer">
            <ICONS.Download size={14} /> Export Layout
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium rounded-xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs ml-4 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* In-App Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
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
                    You are about to reset all duty shifts for the entire month of <strong className="text-slate-900">{config.month} {config.year}</strong> (Days 1 to {currentMonthDays.length}) for the current ward roster.
                  </p>
                  <p className="text-rose-800 font-medium">
                    Currently assigned: <strong>{currentMonthAssignmentsCount}</strong> shift entries in this month.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
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
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  confirmModal === 'PREV_5' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirmModal === 'PREV_5' ? 'Yes, Reset 5 Context Days' : 'Yes, Reset Current Month'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex flex-col sm:flex-row gap-4 p-4 border rounded-xl items-start sm:items-center justify-between ${theme === 'Attractive' ? 'bg-white/40 border-white' : 'border-gray-100 bg-gray-50/50'}`}>
        <div className="flex gap-4">
          <div className="flex-1 min-w-[120px] max-w-[200px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Month</label>
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 shadow-sm">{config.month}</div>
          </div>
          <div className="flex-1 min-w-[120px] max-w-[200px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Year</label>
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 shadow-sm">{config.year}</div>
          </div>
        </div>

        {/* Keyboard Navigation Quick Info Banner */}
        <div className="bg-blue-50/90 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900 flex flex-col gap-1.5 w-full sm:w-auto shadow-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Keyboard Entry Mode</span>
            <span>Type shift code & press <kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded font-mono font-bold text-blue-800 shadow-2xs">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded font-mono font-bold text-blue-800 shadow-2xs">→</kbd> to shift right!</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
            <span className="text-gray-500 font-sans font-semibold text-[9px]">Codes:</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Morning">1</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Evening">2</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Night">3</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Off">W</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Comp Leave">P</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Leave">L</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold text-purple-700" title="Other Leave">O</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Holiday">H</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Morning Special">1S</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Morning On-Call">O1</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Evening On-Call">O2</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Night On-Call">O3</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Req Morning">R1</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Req Evening">R2</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Req Night">R3</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold" title="Req Off">RW</span>
            <span className="bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold text-gray-400" title="None / Clear">-</span>
          </div>
          <div className="text-[10px] text-blue-800 font-medium bg-white/70 px-2 py-1 rounded border border-blue-200/60 flex items-center gap-2">
            <span className="font-bold text-blue-900">Sequence Rules:</span>
            <span>M (1) after W/L/O/P/1 · E (2) after W/L/O/P/1/2 · N (3) after W/L/O/P/1/2/3</span>
          </div>
        </div>
      </div>
      <ShiftGrid staff={staff} config={config} assignments={assignments} onUpdate={onUpdateAssignment} onUpdateBatch={onUpdateBatch} theme={theme} />
    </div>
  );
};

export default ManualEntry;
