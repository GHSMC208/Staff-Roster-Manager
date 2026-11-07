import React, { useState, useMemo, useEffect } from 'react';
import { Phone, Mail, Check, Copy, Download, Building2, UserCheck, FileText, Filter, Layers, Sliders } from 'lucide-react';
import { StaffMember, RosterConfig, Assignment, ShiftType, WardInfo } from '../types';
import { ICONS, MONTHS } from '../constants';

interface Props {
  staff: StaffMember[];
  allStaff?: StaffMember[];
  wards?: WardInfo[];
  currentWardId?: string;
  config: RosterConfig;
  assignments: Assignment[];
  onBack: () => void;
  appTheme?: string;
  showBackButton?: boolean;
}

interface ThemeConfig {
  headerBg: string;
  subHeaderBg: string;
  borderColor: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  bgTint: string;
}

const THEME_CONFIGS: Record<string, ThemeConfig> = {
  slate: {
    headerBg: 'bg-slate-100 text-slate-900 border-slate-900',
    subHeaderBg: 'bg-slate-50 text-slate-700',
    borderColor: 'border-slate-900',
    accentText: 'text-slate-950',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-white',
    bgTint: 'bg-slate-50/50',
  },
  teal: {
    headerBg: 'bg-teal-100/90 text-teal-950 border-teal-900',
    subHeaderBg: 'bg-teal-50/80 text-teal-800',
    borderColor: 'border-teal-900',
    accentText: 'text-teal-800',
    badgeBg: 'bg-teal-800',
    badgeText: 'text-teal-50',
    bgTint: 'bg-teal-50/40',
  },
  indigo: {
    headerBg: 'bg-indigo-100/90 text-indigo-950 border-indigo-900',
    subHeaderBg: 'bg-indigo-50/80 text-indigo-800',
    borderColor: 'border-indigo-900',
    accentText: 'text-indigo-800',
    badgeBg: 'bg-indigo-800',
    badgeText: 'text-indigo-50',
    bgTint: 'bg-indigo-50/40',
  },
  amber: {
    headerBg: 'bg-amber-100/90 text-amber-950 border-amber-900',
    subHeaderBg: 'bg-amber-50/80 text-amber-800',
    borderColor: 'border-amber-900',
    accentText: 'text-amber-800',
    badgeBg: 'bg-amber-800',
    badgeText: 'text-amber-50',
    bgTint: 'bg-amber-50/40',
  },
  emerald: {
    headerBg: 'bg-emerald-100/90 text-emerald-950 border-emerald-900',
    subHeaderBg: 'bg-emerald-50/80 text-emerald-800',
    borderColor: 'border-emerald-900',
    accentText: 'text-emerald-800',
    badgeBg: 'bg-emerald-800',
    badgeText: 'text-emerald-50',
    bgTint: 'bg-emerald-50/40',
  },
};

export interface CombinedOnCallItem {
  staff: StaffMember;
  shift: ShiftType;
  shiftLabel: string;
  shiftCode: string;
  badgeStyle: string;
  wardName?: string;
  dateStr: string;
  dayNum: number;
}

const OnCallPrintView: React.FC<Props> = ({
  staff,
  allStaff,
  wards = [],
  currentWardId,
  config,
  assignments,
  onBack,
  appTheme = 'Professional',
  showBackButton = true,
}) => {
  // Primary layout mode: combined unified list vs 3-column split
  const [listLayout, setListLayout] = useState<'combined' | 'columns'>(() => {
    const saved = localStorage.getItem('roster_oncall_list_layout');
    return saved === 'columns' ? 'columns' : 'combined';
  });

  const [selectedShifts, setSelectedShifts] = useState<ShiftType[]>([
    ShiftType.MorningOnCall,
    ShiftType.EveningOnCall,
    ShiftType.NightOnCall,
  ]);

  // Restrict on-call combination strictly to same division (category)
  const activeWard = useMemo(() => {
    return wards.find(w => w.id === currentWardId) || wards[0];
  }, [wards, currentWardId]);

  const currentDivision = activeWard?.category || 'Medical';

  const sameDivisionWards = useMemo(() => {
    if (!wards || wards.length === 0) return [];
    if (!activeWard?.category) return wards;
    return wards.filter(w => w.category === activeWard.category);
  }, [wards, activeWard]);

  const [wardScope, setWardScope] = useState<'category' | 'current' | 'custom'>('category');
  const [selectedWardIds, setSelectedWardIds] = useState<string[]>(() => {
    const defaultIds = sameDivisionWards.map(w => w.id);
    return defaultIds.length > 0 ? defaultIds : (currentWardId ? [currentWardId] : []);
  });

  const [groupBy, setGroupBy] = useState<'date' | 'shift'>('date');
  const [showPhone, setShowPhone] = useState<boolean>(true);
  const [showEmail, setShowEmail] = useState<boolean>(true);
  const [showSignatureColumn, setShowSignatureColumn] = useState<boolean>(true);
  const [compactDensity, setCompactDensity] = useState<boolean>(false);

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [printTheme, setPrintTheme] = useState<'slate' | 'teal' | 'indigo' | 'amber' | 'emerald'>('slate');
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [hideEmptyDays, setHideEmptyDays] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const effectiveStaffList = useMemo(() => {
    const sourceStaff = allStaff && allStaff.length > 0 ? allStaff : staff;
    if (wardScope === 'current') {
      return currentWardId ? sourceStaff.filter(s => !s.wardId || s.wardId === currentWardId) : staff;
    }
    if (wardScope === 'category') {
      const catWardIds = sameDivisionWards.map(w => w.id);
      return sourceStaff.filter(s => {
        if (s.wardId && catWardIds.includes(s.wardId)) return true;
        if (s.category && s.category === currentDivision) return true;
        if (!s.wardId && currentWardId && s.id) return true;
        return false;
      });
    }
    if (wardScope === 'custom') {
      return sourceStaff.filter(s => s.wardId && selectedWardIds.includes(s.wardId));
    }
    return staff;
  }, [allStaff, staff, wardScope, currentWardId, sameDivisionWards, currentDivision, selectedWardIds]);

  const monthIdx = useMemo(() => {
    const idx = MONTHS.indexOf(config.month);
    return idx === -1 ? 0 : idx;
  }, [config.month]);

  const daysInMonth = useMemo(() => {
    return new Date(config.year, monthIdx + 1, 0).getDate();
  }, [config.year, monthIdx]);

  // Set all days selected by default
  useEffect(() => {
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    setSelectedDays(days);
  }, [daysInMonth]);

  const toggleDaySelection = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => {
    setSelectedDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  };

  const handleSelectNone = () => {
    setSelectedDays([]);
  };

  const handleSelectWeekdays = () => {
    const weekdays: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(config.year, monthIdx, d).getDay();
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        weekdays.push(d);
      }
    }
    setSelectedDays(weekdays);
  };

  const handleSelectWeekends = () => {
    const weekends: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(config.year, monthIdx, d).getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        weekends.push(d);
      }
    }
    setSelectedDays(weekends);
  };

  const handleLayoutModeChange = (mode: 'combined' | 'columns') => {
    setListLayout(mode);
    localStorage.setItem('roster_oncall_list_layout', mode);
  };

  const toggleShiftFilter = (shift: ShiftType) => {
    setSelectedShifts(prev => {
      if (prev.includes(shift)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(s => s !== shift);
      } else {
        return [...prev, shift];
      }
    });
  };

  const getShiftMetadata = (shiftCode: ShiftType) => {
    switch (shiftCode) {
      case ShiftType.MorningOnCall:
        return {
          label: 'Morning On-Call',
          code: 'O1',
          badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
          order: 1,
        };
      case ShiftType.EveningOnCall:
        return {
          label: 'Evening On-Call',
          code: 'O2',
          badgeStyle: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          order: 2,
        };
      case ShiftType.NightOnCall:
        return {
          label: 'Night On-Call',
          code: 'O3',
          badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          order: 3,
        };
      default:
        return {
          label: 'On-Call',
          code: 'ON',
          badgeStyle: 'bg-slate-100 text-slate-900 border-slate-300',
          order: 9,
        };
    }
  };

  // Helper to extract concise ward number / code only (e.g. ICU, CCU, 55, 411)
  const getShortWardLabel = (staffWard?: WardInfo, fallbackName?: string): string => {
    if (staffWard?.code && staffWard.code.trim()) {
      return staffWard.code.trim().toUpperCase();
    }
    const raw = (staffWard?.name || fallbackName || '').trim();
    if (!raw) return '';

    // 1. If parenthesized code exists like "ICU (Intensive Care Unit)" or "Coronary Care Unit (CCU)"
    const parenMatch = raw.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1].trim().length <= 6) {
      return parenMatch[1].trim().toUpperCase();
    }

    // 2. If starts with acronym/code before parenthesis or dash, e.g., "ICU - Critical Care"
    const prefixMatch = raw.match(/^([A-Za-z0-9]+)\s*[\(\-–—]/);
    if (prefixMatch && prefixMatch[1].trim().length <= 6) {
      return prefixMatch[1].trim().toUpperCase();
    }

    // 3. If contains "Ward 55", "Ward 411", "Unit 55" etc.
    const wardNumMatch = raw.match(/(?:Ward|Unit|Room|Dept|Section|W)\s*([A-Za-z0-9]+)/i);
    if (wardNumMatch && wardNumMatch[1].trim()) {
      return wardNumMatch[1].trim().toUpperCase();
    }

    // 4. If plain short string (e.g. "ICU", "CCU", "55", "411", "208CCU") <= 6 chars
    if (raw.length <= 6) {
      return raw.toUpperCase();
    }

    // 5. Look for standalone 2-4 digit ward number (e.g. "55", "411", "208")
    const digitMatch = raw.match(/\b\d{2,4}\b/);
    if (digitMatch) {
      return digitMatch[0];
    }

    // 6. Look for uppercase acronyms (e.g. "ICU", "CCU", "ER", "MED")
    const capsMatch = raw.match(/\b[A-Z]{2,5}\b/);
    if (capsMatch) {
      return capsMatch[0];
    }

    // Fallback: first word up to 6 chars
    return raw.split(/\s+/)[0].slice(0, 6).toUpperCase();
  };

  // Helper to retrieve staff assignments for a given day and shift type
  const getStaffForOnCall = (day: number, shiftCode: ShiftType): StaffMember[] => {
    const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dayAssignments = assignments.filter(a => a.date === dateStr && a.shift === shiftCode);
    
    return dayAssignments
      .map(a => effectiveStaffList.find(s => s.id === a.staffId))
      .filter((s): s is StaffMember => !!s)
      .sort((a, b) => {
        if (a.isSenior && !b.isSenior) return -1;
        if (!a.isSenior && b.isSenior) return 1;
        return a.name.localeCompare(b.name);
      });
  };

  // Helper to get all combined on-calls for a day
  const getCombinedOnCallsForDay = (day: number): CombinedOnCallItem[] => {
    const list: CombinedOnCallItem[] = [];
    const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    selectedShifts.forEach(shiftCode => {
      const staffList = getStaffForOnCall(day, shiftCode);
      const meta = getShiftMetadata(shiftCode);
      staffList.forEach(s => {
        const staffWard = wards.find(w => w.id === s.wardId);
        list.push({
          staff: s,
          shift: shiftCode,
          shiftLabel: meta.label,
          shiftCode: meta.code,
          badgeStyle: meta.badgeStyle,
          wardName: getShortWardLabel(staffWard, config.wardName),
          dateStr,
          dayNum: day,
        });
      });
    });

    return list;
  };

  const getWeekdayName = (day: number) => {
    const date = new Date(config.year, monthIdx, day);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Filter visible days
  const visibleDays = useMemo(() => {
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d => selectedDays.includes(d));
    if (!hideEmptyDays) return days;
    
    return days.filter(d => {
      const items = getCombinedOnCallsForDay(d);
      return items.length > 0;
    });
  }, [daysInMonth, selectedDays, hideEmptyDays, assignments, effectiveStaffList, selectedShifts]);

  const themeStyles = THEME_CONFIGS[printTheme] || THEME_CONFIGS.slate;

  // Formatted string for clipboard copy
  const handleCopyCombinedList = () => {
    let text = `========================================================\n`;
    text += `${currentDivision} Division - COMBINED ON-CALL DUTY ROSTER\n`;
    if (wardScope === 'category') {
      text += `Covering Wards: ${sameDivisionWards.map(w => w.name || w.code).join(', ')}\n`;
    } else if (wardScope === 'current') {
      text += `Ward: ${config.wardName || activeWard.name}\n`;
    }
    text += `${config.month} ${config.year}\n`;
    text += `========================================================\n\n`;

    visibleDays.forEach(dayNum => {
      const weekday = getWeekdayName(dayNum);
      const items = getCombinedOnCallsForDay(dayNum);
      text += `📅 ${dayNum} ${config.month} (${weekday.substring(0, 3)}):\n`;
      if (items.length === 0) {
        text += `   — No on-call duty scheduled —\n`;
      } else {
        items.forEach(item => {
          const s = item.staff;
          const isSenior = s.isSenior ? ' [Senior]' : '';
          const wardTag = item.wardName ? ` [${item.wardName}]` : '';
          const phone = s.phone ? ` | Tel: ${s.phone}` : '';
          text += `   • [${item.shiftCode} - ${item.shiftLabel}] ${s.name}${isSenior}${wardTag}${phone}\n`;
        });
      }
      text += `\n`;
    });

    text += `Generated on: ${new Date().toLocaleString()}\n`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // CSV Export for combined on-call list
  const handleExportCSV = () => {
    const headers = ['Division', 'Date', 'Day', 'Shift Code', 'Shift Name', 'Staff Name', 'Staff ID', 'Seniority', 'Ward', 'Phone', 'Email'];
    const rows: string[][] = [headers];

    visibleDays.forEach(dayNum => {
      const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      const weekday = getWeekdayName(dayNum);
      const items = getCombinedOnCallsForDay(dayNum);

      if (items.length === 0) {
        rows.push([currentDivision, dateStr, weekday, '-', 'None', '-', '-', '-', '-', '-', '-']);
      } else {
        items.forEach(item => {
          const s = item.staff;
          rows.push([
            currentDivision,
            dateStr,
            weekday,
            item.shiftCode,
            item.shiftLabel,
            s.name,
            s.id || '',
            s.isSenior ? 'Senior' : 'Regular',
            item.wardName || config.wardName || '',
            s.phone || '',
            s.email || '',
          ]);
        });
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `oncall_${currentDivision.toLowerCase()}_division_${config.month}_${config.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate dynamic @media print config
  const printConfigStyle = useMemo(() => {
    return `
      @media print {
        @page {
          size: ${printOrientation} !important;
          margin: 8mm 10mm 8mm 10mm !important;
        }
        body {
          background: white !important;
          color: black !important;
        }
        .no-print {
          display: none !important;
        }
        .print-oncall-container {
          display: block !important;
          width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        input, textarea {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          resize: none !important;
        }
        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
    `;
  }, [printOrientation]);

  return (
    <div className="space-y-6">
      {/* Dynamic style tag for print parameters */}
      <style dangerouslySetInnerHTML={{ __html: printConfigStyle }} />

      {/* Top Header & Navigation Bar (no-print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print pb-4 border-b border-gray-200/60">
        <div>
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-black text-gray-500 hover:text-gray-800 transition uppercase mb-1.5"
            >
              <ICONS.ChevronLeft size={14} />
              Back to Roster
            </button>
          )}
          <h2 className="text-xl font-black flex items-center gap-2 text-gray-900">
            <span className="p-1.5 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-sm">
              <ICONS.Users size={16} />
            </span>
            On-Call Duty Roster &amp; Print View
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Configure, combine, and export the official standby &amp; on-call roster
          </p>
        </div>
      </div>

      {/* Main Settings Panel & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
        {/* Left Control Column */}
        <div className="space-y-5">
          {/* Layout Mode Switcher Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-700">
              <Layers size={14} />
              List Layout Structure
            </h3>

            {/* Combined vs 3-Columns Button Group */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200/80">
              <button
                onClick={() => handleLayoutModeChange('combined')}
                className={`py-2 px-2.5 rounded-lg font-black text-xs transition flex flex-col items-center justify-center gap-1 text-center ${
                  listLayout === 'combined'
                    ? 'bg-white text-amber-800 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <ICONS.Users size={13} />
                  <span>Combined List</span>
                </div>
                <span className="text-[9px] font-normal text-gray-400">Single unified column</span>
              </button>

              <button
                onClick={() => handleLayoutModeChange('columns')}
                className={`py-2 px-2.5 rounded-lg font-black text-xs transition flex flex-col items-center justify-center gap-1 text-center ${
                  listLayout === 'columns'
                    ? 'bg-white text-blue-700 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Sliders size={13} />
                  <span>3-Columns Split</span>
                </div>
                <span className="text-[9px] font-normal text-gray-400">M / E / N columns</span>
              </button>
            </div>

            {/* Combined Grouping Mode (if combined) */}
            {listLayout === 'combined' && (
              <div className="pt-2 border-t border-gray-100">
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Grouping Order</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setGroupBy('date')}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition ${
                      groupBy === 'date'
                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    By Date
                  </button>
                  <button
                    onClick={() => setGroupBy('shift')}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition ${
                      groupBy === 'shift'
                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    By Shift Type
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Shift Inclusions & Ward Scope */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
              <Filter size={14} />
              Included On-Call Shifts
            </h3>

            {/* Shift Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded-xl border border-gray-200 bg-gray-50/70 cursor-pointer hover:bg-amber-50/50 transition">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Morning On-Call (O1)
                </span>
                <input
                  type="checkbox"
                  checked={selectedShifts.includes(ShiftType.MorningOnCall)}
                  onChange={() => toggleShiftFilter(ShiftType.MorningOnCall)}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl border border-gray-200 bg-gray-50/70 cursor-pointer hover:bg-indigo-50/50 transition">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Evening On-Call (O2)
                </span>
                <input
                  type="checkbox"
                  checked={selectedShifts.includes(ShiftType.EveningOnCall)}
                  onChange={() => toggleShiftFilter(ShiftType.EveningOnCall)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl border border-gray-200 bg-gray-50/70 cursor-pointer hover:bg-emerald-50/50 transition">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Night On-Call (O3)
                </span>
                <input
                  type="checkbox"
                  checked={selectedShifts.includes(ShiftType.NightOnCall)}
                  onChange={() => toggleShiftFilter(ShiftType.NightOnCall)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>
            </div>

            {/* Department / Multi-Ward Combining Scope (strictly same division) */}
            {wards && wards.length > 1 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-amber-800 uppercase block tracking-wider">
                    On-Call Scope ({currentDivision} Division)
                  </label>
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded font-bold border border-amber-200">
                    Same Division Only
                  </span>
                </div>
                <select
                  value={wardScope}
                  onChange={(e) => setWardScope(e.target.value as any)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="category">
                    Combine All in Same Division ({currentDivision} - {sameDivisionWards.length} Wards)
                  </option>
                  <option value="current">Current Ward Only ({config.wardName || activeWard.name})</option>
                  <option value="custom">Select Specific Wards in {currentDivision} Division...</option>
                </select>

                {wardScope === 'custom' && (
                  <div className="p-2 bg-gray-50 rounded-xl border border-gray-200 max-h-36 overflow-y-auto space-y-1 mt-1">
                    <p className="text-[10px] font-bold text-gray-500 mb-1">
                      Wards in {currentDivision} Division:
                    </p>
                    {sameDivisionWards.map(w => (
                      <label key={w.id} className="flex items-center gap-2 text-[11px] font-medium text-gray-700 cursor-pointer hover:bg-white p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedWardIds.includes(w.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWardIds(prev => [...prev, w.id]);
                            } else {
                              setSelectedWardIds(prev => prev.filter(id => id !== w.id));
                            }
                          }}
                          className="rounded text-blue-600 h-3.5 w-3.5"
                        />
                        <span>{w.name} ({w.code})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Display & Formatting Options */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
              <ICONS.Settings size={14} />
              Display &amp; Print Options
            </h3>

            <div className="space-y-3">
              {/* Orientation */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Print Orientation</label>
                <select
                  value={printOrientation}
                  onChange={(e) => setPrintOrientation(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="portrait">Portrait (Recommended for Combined List)</option>
                  <option value="landscape">Landscape (Best for 3 Columns)</option>
                </select>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Color Theme</label>
                <select
                  value={printTheme}
                  onChange={(e) => setPrintTheme(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="slate">Classic Slate (Standard)</option>
                  <option value="teal">Medical Teal</option>
                  <option value="indigo">Navy Professional</option>
                  <option value="amber">Warm Amber</option>
                  <option value="emerald">Emerald Healing</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-gray-100 space-y-2.5 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-gray-700">Show Phone Numbers</span>
                  <input
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-gray-700">Show Email Addresses</span>
                  <input
                    type="checkbox"
                    checked={showEmail}
                    onChange={(e) => setShowEmail(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-gray-700">Handover Signature Column</span>
                  <input
                    type="checkbox"
                    checked={showSignatureColumn}
                    onChange={(e) => setShowSignatureColumn(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-gray-700">Hide Empty Days</span>
                  <input
                    type="checkbox"
                    checked={hideEmptyDays}
                    onChange={(e) => setHideEmptyDays(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-gray-700">Compact Density</span>
                  <input
                    type="checkbox"
                    checked={compactDensity}
                    onChange={(e) => setCompactDensity(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Day Selector */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <ICONS.CalendarIcon size={14} />
                Days to Print
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                {selectedDays.length} / {daysInMonth} Selected
              </span>
            </h3>

            {/* Quick selectors */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleSelectAll}
                className="py-1 px-2 text-[10px] font-black border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase"
              >
                All
              </button>
              <button
                onClick={handleSelectNone}
                className="py-1 px-2 text-[10px] font-black border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase"
              >
                None
              </button>
              <button
                onClick={handleSelectWeekdays}
                className="py-1 px-2 text-[10px] font-black border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase text-indigo-600"
              >
                Weekdays
              </button>
              <button
                onClick={handleSelectWeekends}
                className="py-1 px-2 text-[10px] font-black border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase text-amber-600"
              >
                Weekends
              </button>
            </div>

            {/* Calendar grid check list */}
            <div className="grid grid-cols-7 gap-1 p-2 bg-gray-50 rounded-xl border border-gray-100">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDays.includes(dayNum);
                const isWeekend = new Date(config.year, monthIdx, dayNum).getDay() === 5 || new Date(config.year, monthIdx, dayNum).getDay() === 6;
                return (
                  <button
                    key={dayNum}
                    onClick={() => toggleDaySelection(dayNum)}
                    className={`h-7 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isWeekend
                        ? 'bg-amber-100/60 text-amber-900 hover:bg-amber-200'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Live Interactive Preview */}
        <div className="lg:col-span-3 space-y-3">
          {/* Print Button aligned left to the sheet margin */}
          <div className="flex items-center justify-start">
            <button
              onClick={handlePrint}
              disabled={visibleDays.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition font-black text-xs shadow-md uppercase tracking-wider ${
                visibleDays.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ICONS.Printer size={15} />
              <span>Print Sheet ({visibleDays.length} Days)</span>
            </button>
          </div>

          <div className="bg-gray-100 border border-gray-200 rounded-3xl p-4 sm:p-6 overflow-x-auto min-h-[500px]">
            <div className="min-w-[650px] bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200 select-none">
              {/* Call log preview markup */}
              {renderOnCallContent(false)}
            </div>
          </div>
        </div>
      </div>

      {/* Pure Print Markup (always hidden on screen, handled by browser print) */}
      <div className="hidden print-oncall-container w-full bg-white text-black p-0">
        {renderOnCallContent(true)}
      </div>
    </div>
  );

  function renderOnCallContent(isPrint: boolean) {
    const isCombinedMode = listLayout === 'combined';

    return (
      <div className="w-full font-sans text-black bg-white">
        {/* Table Title and Metadata Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl sm:text-2xl font-black uppercase tracking-wider ${themeStyles.accentText}`}>
                {wardScope === 'category'
                  ? `${currentDivision} Division `
                  : config.wardName ? `${config.wardName} ` : ''}
                {isCombinedMode ? 'Combined On-Call Duty Roster' : 'On-Call Duty Roster'}
              </h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase border ${
                isCombinedMode ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-blue-100 text-blue-900 border-blue-300'
              }`}>
                {isCombinedMode ? 'Unified Schedule' : '3-Shift Split'}
              </span>
              {wardScope === 'category' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase border bg-purple-100 text-purple-900 border-purple-300">
                  {currentDivision} Division Combined
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mt-1 tracking-wider">
              {config.month} {config.year} &bull; Official Standby &amp; On-Call Log
              {wardScope === 'category' && ` &bull; Covering ${currentDivision} Division Wards (${sameDivisionWards.map(w => w.name || w.code).join(', ')})`}
              {wardScope === 'current' && ` &bull; ${config.wardName || activeWard.name} (${currentDivision} Division)`}
            </p>
          </div>
          <div className="mt-2 sm:mt-0 text-left sm:text-right text-[10px] font-black uppercase text-gray-500 leading-tight">
            <div>Division: {currentDivision}</div>
            <div>Department: {wardScope === 'category' ? `${currentDivision} Division Wards` : (config.wardName || activeWard.name)}</div>
            <div>Status: Confirmed</div>
            <div>Printed: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Render either Combined Layout or 3-Column Split */}
        {visibleDays.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400 font-bold uppercase border-2 border-dashed border-gray-200 rounded-xl">
            No days selected or match the active filter parameters
          </div>
        ) : isCombinedMode ? (
          groupBy === 'shift' ? (
            renderGroupedByShift(isPrint)
          ) : (
            renderCombinedUnifiedTable(isPrint)
          )
        ) : (
          renderThreeColumnsTable(isPrint)
        )}

        {/* Bottom Sign-off block */}
        <div className="mt-8 border-t border-gray-300 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6">
            <div className="space-y-4 w-full sm:w-72">
              <div className="w-full h-px bg-black mb-1" />
              <p className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                Authorized Department Head Signature &amp; Stamp
              </p>
            </div>
            <div className="space-y-4 w-full sm:w-72">
              <div className="w-full h-px bg-black mb-1" />
              <p className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                Duty Supervisor Handover Confirmation
              </p>
            </div>
            <div className="text-left sm:text-right text-[9px] font-bold uppercase text-gray-400">
              On-Call List &bull; {config.month} {config.year} &bull; Page 1 of 1
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. COMBINED UNIFIED TABLE (By Date)
  function renderCombinedUnifiedTable(isPrint: boolean) {
    const padClass = compactDensity ? 'py-1.5 px-2.5' : 'py-2.5 px-3';

    return (
      <table className="w-full text-left text-xs border-collapse border-2 border-black">
        <thead>
          <tr className={`${themeStyles.headerBg} font-black uppercase text-[10px] tracking-tight border-b-2 border-black`}>
            <th className="px-3 py-2 border-r border-black w-24 text-center">Date &amp; Day</th>
            <th className="px-3 py-2 border-r border-black">Combined On-Call Duty Personnel</th>
            {showSignatureColumn && (
              <th className="px-3 py-2 w-40 text-center">Handover / Acknowledgment</th>
            )}
          </tr>
        </thead>
        <tbody>
          {visibleDays.map((dayNum) => {
            const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
            const isHoliday = config.holidays?.includes(dateStr);
            const isWeekend = new Date(config.year, monthIdx, dayNum).getDay() === 5 || new Date(config.year, monthIdx, dayNum).getDay() === 6;

            const items = getCombinedOnCallsForDay(dayNum);

            let rowBg = 'bg-white';
            let dateBadgeStyle = 'font-bold text-gray-900';

            if (isHoliday) {
              rowBg = 'bg-rose-50/50';
              dateBadgeStyle = 'font-black text-rose-700';
            } else if (isWeekend) {
              rowBg = 'bg-amber-50/40';
              dateBadgeStyle = 'font-black text-amber-800';
            }

            return (
              <tr
                key={dayNum}
                className={`${rowBg} border-b border-black/30 last:border-b-0 hover:bg-gray-50/50 transition-colors`}
              >
                {/* Date Column */}
                <td className={`${padClass} border-r border-black/30 text-center font-bold align-middle`}>
                  <div className="flex flex-col justify-center items-center">
                    <span className={`text-base leading-none ${dateBadgeStyle}`}>{dayNum}</span>
                    <span className="text-[9px] uppercase font-bold tracking-tight text-gray-600 mt-0.5">
                      {getWeekdayName(dayNum).substring(0, 3)}
                      {isHoliday && <span className="text-rose-600 font-black ml-0.5">*</span>}
                    </span>
                  </div>
                </td>

                {/* Combined On-Call Personnel Column */}
                <td className={`${padClass} border-r border-black/30 align-middle`}>
                  {items.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5 items-center">
                      {items.map((item, idx) => {
                        const s = item.staff;
                        const isHa = s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)') || !!s.isHa;
                        return (
                          <div
                            key={idx}
                            className="inline-flex flex-col p-2 bg-gray-50/90 rounded-xl border border-gray-200/80 shadow-xs min-w-[210px] max-w-xs"
                          >
                            {/* Shift Badge */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border leading-none ${item.badgeStyle}`}>
                                {item.shiftCode} {item.shiftLabel}
                              </span>

                              {s.isSenior && !isHa && (
                                <span className="text-[8px] px-1 bg-amber-500 text-white rounded font-black leading-none">
                                  S
                                </span>
                              )}
                            </div>

                            {/* Staff Name & Ward / Unit */}
                            <div className="font-bold text-xs text-gray-900 mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className={isHa ? 'text-emerald-800' : ''}>{s.name}</span>
                              {item.wardName && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-2xs whitespace-nowrap">
                                  {item.wardName}
                                </span>
                              )}
                            </div>

                            {/* Contacts */}
                            <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-gray-600 font-medium font-mono">
                              {showPhone && s.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone size={10} className="text-gray-400 shrink-0" />
                                  <span>{s.phone}</span>
                                </div>
                              )}
                              {showEmail && s.email && (
                                <div className="flex items-center gap-1">
                                  <Mail size={10} className="text-gray-400 shrink-0" />
                                  <span className="truncate max-w-[180px]">{s.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-medium italic">— No on-call duty scheduled —</span>
                  )}
                </td>

                {/* Handover Signature / Sign-off Column */}
                {showSignatureColumn && (
                  <td className={`${padClass} align-middle text-center`}>
                    <div className="h-10 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-[9px] text-gray-400 font-medium">
                      Sign / Acknowledge
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  // 2. COMBINED GROUPED BY SHIFT TYPE
  function renderGroupedByShift(isPrint: boolean) {
    return (
      <div className="space-y-6">
        {selectedShifts.map((shiftCode) => {
          const meta = getShiftMetadata(shiftCode);

          return (
            <div key={shiftCode} className="border-2 border-black rounded-xl overflow-hidden">
              <div className={`${themeStyles.headerBg} px-4 py-2 font-black uppercase text-xs tracking-wider border-b-2 border-black flex items-center justify-between`}>
                <span className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded border text-[10px] ${meta.badgeStyle}`}>
                    {meta.code}
                  </span>
                  {meta.label} Duty Schedule
                </span>
                <span className="text-[10px] font-bold text-gray-600 lowercase">
                  {visibleDays.length} days checked
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/30 text-[10px] font-bold uppercase text-gray-600">
                    <th className="px-3 py-2 border-r border-black/30 w-24 text-center">Date</th>
                    <th className="px-3 py-2 border-r border-black/30">Assigned Nurse</th>
                    {showPhone && <th className="px-3 py-2 border-r border-black/30 w-32">Phone</th>}
                    {showEmail && <th className="px-3 py-2 border-r border-black/30 w-44">Email</th>}
                    {showSignatureColumn && <th className="px-3 py-2 w-32 text-center">Signature</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleDays.map(dayNum => {
                    const staffList = getStaffForOnCall(dayNum, shiftCode);
                    const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                    const isHoliday = config.holidays?.includes(dateStr);
                    const isWeekend = new Date(config.year, monthIdx, dayNum).getDay() === 5 || new Date(config.year, monthIdx, dayNum).getDay() === 6;

                    let rowBg = 'bg-white';
                    if (isHoliday) rowBg = 'bg-rose-50/40';
                    else if (isWeekend) rowBg = 'bg-amber-50/30';

                    return (
                      <tr key={dayNum} className={`${rowBg} border-b border-black/20 last:border-b-0`}>
                        <td className="px-3 py-2 border-r border-black/30 text-center font-bold">
                          <span className="text-sm font-black">{dayNum}</span>{' '}
                          <span className="text-[10px] text-gray-500 font-bold uppercase">
                            {getWeekdayName(dayNum).substring(0, 3)}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-r border-black/30 font-bold text-gray-900">
                          {staffList.length > 0 ? (
                            staffList.map(s => {
                              const staffWard = wards.find(w => w.id === s.wardId);
                              const wardLabel = getShortWardLabel(staffWard, config.wardName);
                              return (
                                <div key={s.id} className="flex items-center gap-1.5 flex-wrap py-0.5">
                                  {s.isSenior && <span className="text-[8px] px-1 bg-amber-500 text-white rounded font-black">S</span>}
                                  <span>{s.name}</span>
                                  {wardLabel && (
                                    <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-2xs whitespace-nowrap">
                                      {wardLabel}
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-gray-400 italic text-[11px] font-normal">— None —</span>
                          )}
                        </td>
                        {showPhone && (
                          <td className="px-3 py-2 border-r border-black/30 font-mono text-[11px] text-gray-600">
                            {staffList.map(s => s.phone).filter(Boolean).join(', ') || '—'}
                          </td>
                        )}
                        {showEmail && (
                          <td className="px-3 py-2 border-r border-black/30 font-mono text-[10px] text-gray-600 truncate">
                            {staffList.map(s => s.email).filter(Boolean).join(', ') || '—'}
                          </td>
                        )}
                        {showSignatureColumn && (
                          <td className="px-2 py-1 text-center">
                            <div className="h-6 border border-dashed border-gray-300 rounded" />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  }

  // 3. 3-COLUMNS SPLIT TABLE
  function renderThreeColumnsTable(isPrint: boolean) {
    const padClass = compactDensity ? 'px-2.5 py-1.5' : 'px-3 py-2.5';

    return (
      <table className="w-full text-left text-xs border-collapse border-2 border-black">
        <thead>
          <tr className={`${themeStyles.headerBg} font-black uppercase text-[10px] tracking-tight border-b-2 border-black`}>
            <th rowSpan={showPhone ? 2 : 1} className="px-3 py-2 border-r border-black w-20 text-center align-middle">Date</th>
            <th colSpan={showPhone ? 2 : 1} className="px-3 py-2 border-r border-black text-center">Morning On-Call (O1)</th>
            <th colSpan={showPhone ? 2 : 1} className="px-3 py-2 border-r border-black text-center">Evening On-Call (O2)</th>
            <th colSpan={showPhone ? 2 : 1} className="px-3 py-2 text-center">Night On-Call (O3)</th>
          </tr>
          {showPhone && (
            <tr className="bg-gray-100/90 font-bold uppercase text-[9px] text-gray-700 border-b-2 border-black tracking-tight">
              <th className="px-2.5 py-1.5 border-r border-black/40">Staff Name</th>
              <th className="px-2 py-1.5 border-r border-black w-28 text-center">Phone</th>
              <th className="px-2.5 py-1.5 border-r border-black/40">Staff Name</th>
              <th className="px-2 py-1.5 border-r border-black w-28 text-center">Phone</th>
              <th className="px-2.5 py-1.5 border-r border-black/40">Staff Name</th>
              <th className="px-2 py-1.5 text-center w-28">Phone</th>
            </tr>
          )}
        </thead>
        <tbody>
          {visibleDays.map((dayNum) => {
            const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
            const isHoliday = config.holidays?.includes(dateStr);
            const isWeekend = new Date(config.year, monthIdx, dayNum).getDay() === 5 || new Date(config.year, monthIdx, dayNum).getDay() === 6;

            const morningOnCallStaff = getStaffForOnCall(dayNum, ShiftType.MorningOnCall);
            const eveningOnCallStaff = getStaffForOnCall(dayNum, ShiftType.EveningOnCall);
            const nightOnCallStaff = getStaffForOnCall(dayNum, ShiftType.NightOnCall);

            let rowBg = 'bg-white';
            let dateBadgeStyle = 'font-bold text-gray-800';

            if (isHoliday) {
              rowBg = 'bg-rose-50/50';
              dateBadgeStyle = 'font-black text-rose-700';
            } else if (isWeekend) {
              rowBg = 'bg-amber-50/30';
              dateBadgeStyle = 'font-black text-amber-700';
            }

            return (
              <tr
                key={dayNum}
                className={`${rowBg} border-b border-black/30 last:border-b-0 hover:bg-gray-50/40`}
              >
                {/* Date Column */}
                <td className={`${padClass} border-r border-black/30 text-center font-bold align-middle`}>
                  <div className="flex flex-col justify-center items-center">
                    <span className={`text-base leading-none ${dateBadgeStyle}`}>{dayNum}</span>
                    <span className="text-[9px] uppercase font-bold tracking-tight text-gray-500 mt-0.5">
                      {getWeekdayName(dayNum).substring(0, 3)}
                      {isHoliday && <span className="text-rose-500 font-black ml-0.5">*</span>}
                    </span>
                  </div>
                </td>

                {/* Morning On-Call (O1) Staff Column */}
                <td className={`${padClass} ${showPhone ? 'border-r border-black/20' : 'border-r border-black/30'} align-middle`}>
                  {morningOnCallStaff.length > 0 ? (
                    <div className="space-y-1">
                      {morningOnCallStaff.map(s => {
                        const isHa = s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)') || !!s.isHa;
                        const staffWard = wards.find(w => w.id === s.wardId);
                        const wardLabel = getShortWardLabel(staffWard, config.wardName);
                        return (
                          <div key={s.id} className="leading-tight">
                            <div className="font-bold flex items-center gap-1 flex-wrap">
                              {s.isSenior && !isHa && <span className="text-[8px] px-1 bg-amber-500 text-white rounded font-black">S</span>}
                              <span className={isHa ? 'text-emerald-800' : ''}>{s.name}</span>
                              {wardLabel && (
                                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-2xs whitespace-nowrap">
                                  {wardLabel}
                                </span>
                              )}
                            </div>
                            {showEmail && s.email && (
                              <div className="text-[9.5px] text-gray-500 font-medium font-mono flex items-center gap-0.5 mt-0.5">
                                <Mail size={8} className="text-gray-400 shrink-0" />
                                <span className="truncate max-w-[120px]">{s.email}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-medium italic">—</span>
                  )}
                </td>

                {/* Morning Phone Column (Separated) */}
                {showPhone && (
                  <td className={`${padClass} border-r border-black/30 align-middle bg-slate-50/40 text-center font-mono text-[11px]`}>
                    {morningOnCallStaff.length > 0 ? (
                      <div className="space-y-1">
                        {morningOnCallStaff.map(s => (
                          <div key={s.id} className="flex items-center justify-center gap-1 font-bold text-gray-800">
                            <Phone size={9} className="text-gray-400 shrink-0" />
                            <span>{s.phone || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-medium">—</span>
                    )}
                  </td>
                )}

                {/* Evening On-Call (O2) Staff Column */}
                <td className={`${padClass} ${showPhone ? 'border-r border-black/20' : 'border-r border-black/30'} align-middle`}>
                  {eveningOnCallStaff.length > 0 ? (
                    <div className="space-y-1">
                      {eveningOnCallStaff.map(s => {
                        const isHa = s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)') || !!s.isHa;
                        const staffWard = wards.find(w => w.id === s.wardId);
                        const wardLabel = getShortWardLabel(staffWard, config.wardName);
                        return (
                          <div key={s.id} className="leading-tight">
                            <div className="font-bold flex items-center gap-1 flex-wrap">
                              {s.isSenior && !isHa && <span className="text-[8px] px-1 bg-amber-500 text-white rounded font-black">S</span>}
                              <span className={isHa ? 'text-emerald-800' : ''}>{s.name}</span>
                              {wardLabel && (
                                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-2xs whitespace-nowrap">
                                  {wardLabel}
                                </span>
                              )}
                            </div>
                            {showEmail && s.email && (
                              <div className="text-[9.5px] text-gray-500 font-medium font-mono flex items-center gap-0.5 mt-0.5">
                                <Mail size={8} className="text-gray-400 shrink-0" />
                                <span className="truncate max-w-[120px]">{s.email}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-medium italic">—</span>
                  )}
                </td>

                {/* Evening Phone Column (Separated) */}
                {showPhone && (
                  <td className={`${padClass} border-r border-black/30 align-middle bg-slate-50/40 text-center font-mono text-[11px]`}>
                    {eveningOnCallStaff.length > 0 ? (
                      <div className="space-y-1">
                        {eveningOnCallStaff.map(s => (
                          <div key={s.id} className="flex items-center justify-center gap-1 font-bold text-gray-800">
                            <Phone size={9} className="text-gray-400 shrink-0" />
                            <span>{s.phone || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-medium">—</span>
                    )}
                  </td>
                )}

                {/* Night On-Call (O3) Staff Column */}
                <td className={`${padClass} ${showPhone ? 'border-r border-black/20' : ''} align-middle`}>
                  {nightOnCallStaff.length > 0 ? (
                    <div className="space-y-1">
                      {nightOnCallStaff.map(s => {
                        const isHa = s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)') || !!s.isHa;
                        const staffWard = wards.find(w => w.id === s.wardId);
                        const wardLabel = getShortWardLabel(staffWard, config.wardName);
                        return (
                          <div key={s.id} className="leading-tight">
                            <div className="font-bold flex items-center gap-1 flex-wrap">
                              {s.isSenior && !isHa && <span className="text-[8px] px-1 bg-amber-500 text-white rounded font-black">S</span>}
                              <span className={isHa ? 'text-emerald-800' : ''}>{s.name}</span>
                              {wardLabel && (
                                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-2xs whitespace-nowrap">
                                  {wardLabel}
                                </span>
                              )}
                            </div>
                            {showEmail && s.email && (
                              <div className="text-[9.5px] text-gray-500 font-medium font-mono flex items-center gap-0.5 mt-0.5">
                                <Mail size={8} className="text-gray-400 shrink-0" />
                                <span className="truncate max-w-[120px]">{s.email}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-medium italic">—</span>
                  )}
                </td>

                {/* Night Phone Column (Separated) */}
                {showPhone && (
                  <td className={`${padClass} align-middle bg-slate-50/40 text-center font-mono text-[11px]`}>
                    {nightOnCallStaff.length > 0 ? (
                      <div className="space-y-1">
                        {nightOnCallStaff.map(s => (
                          <div key={s.id} className="flex items-center justify-center gap-1 font-bold text-gray-800">
                            <Phone size={9} className="text-gray-400 shrink-0" />
                            <span>{s.phone || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-medium">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
};

export default OnCallPrintView;
