import React, { useState, useEffect, useMemo } from 'react';
import { StaffMember, RosterConfig, Assignment, ShiftType } from '../types';
import { ICONS, MONTHS } from '../constants';
import { Type, LayoutGrid, CheckCircle2, Sliders, Info, Eye } from 'lucide-react';

interface Props {
  staff: StaffMember[];
  config: RosterConfig;
  assignments: Assignment[];
  onBack?: () => void;
  appTheme?: string;
  showBackButton?: boolean;
}

type DaysPerPage = '1' | '2' | 'continuous';
type FontSizeMode = 'auto' | 'compact' | 'regular' | 'large';
type NameDisplayMode = 'auto' | 'truncate' | 'wrap';

interface DayInputData {
  course1?: string;
  loc1?: string;
  course2?: string;
  loc2?: string;
  time1?: string;
  time2?: string;
  presenter1?: string;
  presenter2?: string;
  notes?: string;
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
    headerBg: 'bg-slate-100 text-slate-800',
    subHeaderBg: 'bg-slate-50 text-slate-600',
    borderColor: 'border-slate-900',
    accentText: 'text-slate-900',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-white',
    bgTint: 'bg-slate-50/50',
  },
  teal: {
    headerBg: 'bg-teal-100/80 text-teal-900',
    subHeaderBg: 'bg-teal-50/80 text-teal-800',
    borderColor: 'border-teal-900',
    accentText: 'text-teal-700',
    badgeBg: 'bg-teal-800',
    badgeText: 'text-teal-50',
    bgTint: 'bg-teal-50/40',
  },
  indigo: {
    headerBg: 'bg-indigo-100/80 text-indigo-900',
    subHeaderBg: 'bg-indigo-50/80 text-indigo-800',
    borderColor: 'border-indigo-900',
    accentText: 'text-indigo-700',
    badgeBg: 'bg-indigo-800',
    badgeText: 'text-indigo-50',
    bgTint: 'bg-indigo-50/40',
  },
  amber: {
    headerBg: 'bg-amber-100/80 text-amber-900',
    subHeaderBg: 'bg-amber-50/80 text-amber-800',
    borderColor: 'border-amber-900',
    accentText: 'text-amber-700',
    badgeBg: 'bg-amber-800',
    badgeText: 'text-amber-50',
    bgTint: 'bg-amber-50/40',
  },
  emerald: {
    headerBg: 'bg-emerald-100/80 text-emerald-900',
    subHeaderBg: 'bg-emerald-50/80 text-emerald-800',
    borderColor: 'border-emerald-900',
    accentText: 'text-emerald-700',
    badgeBg: 'bg-emerald-800',
    badgeText: 'text-emerald-50',
    bgTint: 'bg-emerald-50/40',
  },
};

const DEFAULT_COLORS = {
  morning: '#000000',
  evening: '#000000',
  night: '#000000',
  workshop: '#000000',
  onCall: '#000000',
  notes: '#000000',
};

export interface LayoutMetrics {
  rowMinHeightScreen: string;
  rowMinHeightPrint: string;
  rowPaddingY: string;
  nameFontSizeScreen: string;
  nameFontSizePrint: string;
  headerFontSize: string;
  badgeFontSize: string;
  counterpartFontSize: string;
  workshopRowHeight: string;
  notesFontSize: string;
  onCallFontSize: string;
  dateNumberSize: string;
  isDense: boolean;
}

const DailyAssignmentsPrintView: React.FC<Props> = ({
  staff,
  config,
  assignments,
  onBack,
  showBackButton = false
}) => {
  const [daysPerPage, setDaysPerPage] = useState<DaysPerPage>('2');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [numRows, setNumRows] = useState<number>(8); // Minimum rows for shifts list
  const [fontSizeMode, setFontSizeMode] = useState<FontSizeMode>('auto');
  const [nameDisplayMode, setNameDisplayMode] = useState<NameDisplayMode>('auto');
  const [showCounterparts, setShowCounterparts] = useState<boolean>(true);
  const [combineOnCalls, setCombineOnCalls] = useState<boolean>(() => {
    const saved = localStorage.getItem('roster_combine_oncall_list');
    return saved !== null ? saved === 'true' : false;
  });
  const [printTheme, setPrintTheme] = useState<'slate' | 'teal' | 'indigo' | 'amber' | 'emerald'>('slate');

  const handleToggleCombineOnCalls = (val: boolean) => {
    setCombineOnCalls(val);
    localStorage.setItem('roster_combine_oncall_list', String(val));
  };
  
  // Font Colors settings state
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('roster_print_category_colors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return { ...DEFAULT_COLORS };
  });

  const handleColorChange = (category: string, color: string) => {
    setCategoryColors(prev => {
      const updated = { ...prev, [category]: color };
      localStorage.setItem('roster_print_category_colors', JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetColors = () => {
    setCategoryColors({ ...DEFAULT_COLORS });
    localStorage.removeItem('roster_print_category_colors');
  };
  
  // Local storage state for courses, locations, and students
  const [inputsData, setInputsData] = useState<Record<string, DayInputData>>({});

  const monthIdx = useMemo(() => {
    const idx = MONTHS.indexOf(config.month);
    return idx === -1 ? 0 : idx;
  }, [config.month]);

  const daysInMonth = useMemo(() => {
    return new Date(config.year, monthIdx + 1, 0).getDate();
  }, [config.year, monthIdx]);

  // Initialize selected days (all by default)
  useEffect(() => {
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    setSelectedDays(days);
  }, [daysInMonth]);

  // Load custom inputs from localStorage
  useEffect(() => {
    const key = `roster_daily_inputs_${config.year}_${config.month}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setInputsData(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading daily assignments inputs', e);
      }
    }
  }, [config.year, config.month]);

  // Save inputs to localStorage
  const handleInputChange = (dayNum: number, field: keyof DayInputData, value: string) => {
    const key = `roster_daily_inputs_${config.year}_${config.month}`;
    const updated = {
      ...inputsData,
      [dayNum]: {
        ...((inputsData[dayNum] || {})),
        [field]: value
      }
    };
    setInputsData(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

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
      if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Not Friday or Saturday
        weekdays.push(d);
      }
    }
    setSelectedDays(weekdays);
  };

  const handleSelectWeekends = () => {
    const weekends: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(config.year, monthIdx, d).getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
        weekends.push(d);
      }
    }
    setSelectedDays(weekends);
  };

  const handlePrint = () => {
    window.print();
  };

  // Get weekday name
  const getWeekdayName = (day: number) => {
    const date = new Date(config.year, monthIdx, day);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const shortMonthName = useMemo(() => {
    return config.month.substring(0, 3);
  }, [config.month]);

  // Compute adaptive layout sizing metrics based on daysPerPage, numRows, and font size mode
  const layoutMetrics: LayoutMetrics = useMemo(() => {
    const is2Up = daysPerPage === '2';
    const is1Up = daysPerPage === '1';

    let rowMinHeightScreen = '28px';
    let rowMinHeightPrint = '18px';
    let rowPaddingY = 'py-1';
    let nameFontSizeScreen = '13px';
    let nameFontSizePrint = '10px';
    let headerFontSize = '11px';
    let badgeFontSize = '8px';
    let counterpartFontSize = '8px';
    let workshopRowHeight = '20px';
    let notesFontSize = '9px';
    let onCallFontSize = '8px';
    let dateNumberSize = 'text-3xl';
    let isDense = false;

    if (is2Up) {
      // 2 Days per landscape page: Target height per day card in print is strictly 94mm
      if (numRows <= 5) {
        rowMinHeightScreen = '32px';
        rowMinHeightPrint = '23px';
        rowPaddingY = 'py-1.5';
        nameFontSizeScreen = '13.5px';
        nameFontSizePrint = '11.5px';
        headerFontSize = '11px';
        badgeFontSize = '8px';
        counterpartFontSize = '8px';
        workshopRowHeight = '22px';
        notesFontSize = '9.5px';
        onCallFontSize = '8.5px';
        dateNumberSize = 'text-3xl';
        isDense = false;
      } else if (numRows <= 7) {
        rowMinHeightScreen = '28px';
        rowMinHeightPrint = '19.5px';
        rowPaddingY = 'py-1';
        nameFontSizeScreen = '12.5px';
        nameFontSizePrint = '10.5px';
        headerFontSize = '10.5px';
        badgeFontSize = '7.5px';
        counterpartFontSize = '7.5px';
        workshopRowHeight = '20px';
        notesFontSize = '9px';
        onCallFontSize = '8px';
        dateNumberSize = 'text-2xl';
        isDense = false;
      } else if (numRows <= 9) {
        rowMinHeightScreen = '25px';
        rowMinHeightPrint = '17px';
        rowPaddingY = 'py-0.5';
        nameFontSizeScreen = '11.5px';
        nameFontSizePrint = '9.5px';
        headerFontSize = '10px';
        badgeFontSize = '7px';
        counterpartFontSize = '7px';
        workshopRowHeight = '18px';
        notesFontSize = '8.5px';
        onCallFontSize = '7.5px';
        dateNumberSize = 'text-2xl';
        isDense = false;
      } else if (numRows <= 12) {
        rowMinHeightScreen = '22px';
        rowMinHeightPrint = '14px';
        rowPaddingY = 'py-0.5';
        nameFontSizeScreen = '10.5px';
        nameFontSizePrint = '8.5px';
        headerFontSize = '9.5px';
        badgeFontSize = '6.5px';
        counterpartFontSize = '6.5px';
        workshopRowHeight = '16px';
        notesFontSize = '8px';
        onCallFontSize = '7px';
        dateNumberSize = 'text-xl';
        isDense = true;
      } else if (numRows <= 15) {
        rowMinHeightScreen = '20px';
        rowMinHeightPrint = '12px';
        rowPaddingY = 'py-0';
        nameFontSizeScreen = '9.5px';
        nameFontSizePrint = '7.5px';
        headerFontSize = '8.5px';
        badgeFontSize = '6px';
        counterpartFontSize = '6px';
        workshopRowHeight = '14px';
        notesFontSize = '7.5px';
        onCallFontSize = '6.5px';
        dateNumberSize = 'text-lg';
        isDense = true;
      } else {
        // 16+ rows (ultra-dense)
        rowMinHeightScreen = '18px';
        rowMinHeightPrint = '10.5px';
        rowPaddingY = 'py-0';
        nameFontSizeScreen = '8.5px';
        nameFontSizePrint = '6.8px';
        headerFontSize = '8px';
        badgeFontSize = '5.5px';
        counterpartFontSize = '5.5px';
        workshopRowHeight = '13px';
        notesFontSize = '7px';
        onCallFontSize = '6px';
        dateNumberSize = 'text-base';
        isDense = true;
      }
    } else if (is1Up) {
      // 1 Day per landscape page: Full vertical height (~194mm available)
      if (numRows <= 7) {
        rowMinHeightScreen = '38px';
        rowMinHeightPrint = '34px';
        rowPaddingY = 'py-2';
        nameFontSizeScreen = '14px';
        nameFontSizePrint = '13px';
        headerFontSize = '12px';
        badgeFontSize = '9px';
        counterpartFontSize = '9px';
        workshopRowHeight = '28px';
        notesFontSize = '10.5px';
        onCallFontSize = '9.5px';
        dateNumberSize = 'text-4xl';
        isDense = false;
      } else if (numRows <= 11) {
        rowMinHeightScreen = '30px';
        rowMinHeightPrint = '25px';
        rowPaddingY = 'py-1.5';
        nameFontSizeScreen = '13px';
        nameFontSizePrint = '11.5px';
        headerFontSize = '11px';
        badgeFontSize = '8px';
        counterpartFontSize = '8px';
        workshopRowHeight = '22px';
        notesFontSize = '9.5px';
        onCallFontSize = '8.5px';
        dateNumberSize = 'text-3xl';
        isDense = false;
      } else {
        rowMinHeightScreen = '24px';
        rowMinHeightPrint = '19px';
        rowPaddingY = 'py-1';
        nameFontSizeScreen = '11px';
        nameFontSizePrint = '9.5px';
        headerFontSize = '10px';
        badgeFontSize = '7.5px';
        counterpartFontSize = '7px';
        workshopRowHeight = '18px';
        notesFontSize = '8.5px';
        onCallFontSize = '7.5px';
        dateNumberSize = 'text-2xl';
        isDense = true;
      }
    } else {
      // Continuous scroll mode
      rowMinHeightScreen = '28px';
      rowMinHeightPrint = '20px';
      rowPaddingY = 'py-1';
      nameFontSizeScreen = '12px';
      nameFontSizePrint = '10px';
      headerFontSize = '11px';
      badgeFontSize = '8px';
      counterpartFontSize = '8px';
      workshopRowHeight = '20px';
      notesFontSize = '9px';
      onCallFontSize = '8px';
      dateNumberSize = 'text-3xl';
      isDense = numRows > 9;
    }

    // Apply manual font size override if selected
    if (fontSizeMode === 'compact') {
      nameFontSizeScreen = `${Math.max(8.5, parseFloat(nameFontSizeScreen) - 1.5)}px`;
      nameFontSizePrint = `${Math.max(6.8, parseFloat(nameFontSizePrint) - 1.2)}px`;
      notesFontSize = `${Math.max(7, parseFloat(notesFontSize) - 1)}px`;
      onCallFontSize = `${Math.max(6, parseFloat(onCallFontSize) - 1)}px`;
    } else if (fontSizeMode === 'large') {
      nameFontSizeScreen = `${parseFloat(nameFontSizeScreen) + 2}px`;
      nameFontSizePrint = `${parseFloat(nameFontSizePrint) + 1.8}px`;
      notesFontSize = `${parseFloat(notesFontSize) + 1.2}px`;
      onCallFontSize = `${parseFloat(onCallFontSize) + 1.2}px`;
    } else if (fontSizeMode === 'regular') {
      nameFontSizeScreen = '12px';
      nameFontSizePrint = '10px';
    }

    return {
      rowMinHeightScreen,
      rowMinHeightPrint,
      rowPaddingY,
      nameFontSizeScreen,
      nameFontSizePrint,
      headerFontSize,
      badgeFontSize,
      counterpartFontSize,
      workshopRowHeight,
      notesFontSize,
      onCallFontSize,
      dateNumberSize,
      isDense,
    };
  }, [daysPerPage, numRows, fontSizeMode]);

  // Helper to retrieve staff assignments for a given day and shift types
  const getStaffForShift = (day: number, shiftCodes: ShiftType[]) => {
    const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Find all assignments for this date with any of the requested shift codes
    const dayAssignments = assignments.filter(
      a => a.date === dateStr && shiftCodes.includes(a.shift)
    );

    const isHaStaff = (name: string): boolean => {
      const trimmed = name.trim();
      return trimmed.startsWith('HA') || trimmed.startsWith('(HA)') || trimmed.startsWith('MSA') || trimmed.startsWith('(MSA)');
    };

    const isWsStaff = (s: StaffMember): boolean => {
      return !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)');
    };

    // Map to actual staff details (EXCLUDING counterpart and ward supervisor staff)
    return dayAssignments
      .map(a => staff.find(s => s.id === a.staffId))
      .filter((s): s is StaffMember => !!s && !s.isCounterPart && !isWsStaff(s))
      .sort((a, b) => {
        const isHaA = isHaStaff(a.name) || !!a.isHa;
        const isHaB = isHaStaff(b.name) || !!b.isHa;
        if (isHaA && !isHaB) return 1;
        if (!isHaA && isHaB) return -1;

        // Seniors first
        if (a.isSenior && !b.isSenior) return -1;
        if (!a.isSenior && b.isSenior) return 1;
        return a.name.localeCompare(b.name);
      });
  };

  // Dynamic style tag for precise printer configuration
  const printConfigStyle = useMemo(() => {
    let pagingRule = '';
    if (daysPerPage === '1') {
      pagingRule = `
        .print-day-block {
          box-sizing: border-box !important;
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          height: 194mm !important;
          max-height: 194mm !important;
          min-height: 194mm !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: stretch !important;
          overflow: hidden !important;
        }
      `;
    } else if (daysPerPage === '2') {
      pagingRule = `
        .print-day-block {
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-top: 0 !important;
          margin-bottom: 3.5mm !important;
          height: 94mm !important;
          max-height: 94mm !important;
          min-height: 94mm !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: stretch !important;
          overflow: hidden !important;
        }
        .print-day-block:nth-child(2n) {
          page-break-after: always !important;
          break-after: page !important;
          margin-bottom: 0 !important;
        }
        .print-day-block:nth-child(2n-1) {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
      `;
    } else {
      pagingRule = `
        .print-day-block {
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 6mm !important;
          height: auto !important;
        }
      `;
    }

    return `
      @media print {
        @page {
          size: A4 landscape !important;
          margin: 5mm 6mm !important;
        }
        html, body {
          background: white !important;
          color: black !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print {
          display: none !important;
        }
        .print-days-container {
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
        input::placeholder, textarea::placeholder {
          color: transparent !important;
        }
        ${pagingRule}
      }

      /* Screen & Print Category Colors */
      .print-color-morning, .print-color-morning .staff-name-text {
        color: ${categoryColors.morning} !important;
      }
      .print-color-evening, .print-color-evening .staff-name-text {
        color: ${categoryColors.evening} !important;
      }
      .print-color-night, .print-color-night .staff-name-text {
        color: ${categoryColors.night} !important;
      }
      .print-color-workshop, .print-color-workshop .staff-name-text, .print-color-workshop td, .print-color-workshop span {
        color: ${categoryColors.workshop} !important;
      }
      .print-color-oncall, .print-color-oncall .staff-name-text, .print-color-oncall span {
        color: ${categoryColors.onCall} !important;
      }
      .print-color-notes, .print-color-notes textarea, .print-color-notes .notes-print-content {
        color: ${categoryColors.notes} !important;
      }
    `;
  }, [daysPerPage, categoryColors]);

  return (
    <div className="space-y-6">
      {/* Dynamic style tag for precise printer configuration */}
      <style dangerouslySetInnerHTML={{ __html: printConfigStyle }} />

      {/* Header & Main Controls (no-print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print pb-4 border-b border-gray-200/50">
        <div>
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-black text-gray-500 hover:text-gray-800 transition uppercase mb-1 cursor-pointer"
            >
              <ICONS.ChevronLeft size={14} />
              Back to Table Grid
            </button>
          )}
          <h2 className="text-xl font-black flex items-center gap-2 text-gray-800">
            <span className="p-1 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-xs">
              <ICONS.CalendarIcon size={16} />
            </span>
            Daily Assignment Sheet (Print Layout)
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Generate and print daily duty logs matching physical roster charts with sign-off cells
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            disabled={selectedDays.length === 0}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition font-black text-xs shadow-md uppercase tracking-wider cursor-pointer active:scale-95 ${
              selectedDays.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ICONS.Printer size={14} />
            Print sheets ({selectedDays.length} days)
          </button>
        </div>
      </div>

      {/* Settings Grid (no-print) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
        {/* Settings column */}
        <div className="space-y-6">
          {/* Controls box */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
              <ICONS.Settings size={14} />
              Print Options & Auto-Fit
            </h3>

            <div className="space-y-3.5">
              {/* Days per Page */}
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1 flex items-center gap-1">
                  <LayoutGrid size={11} className="text-blue-500" />
                  Days per Page
                </label>
                <select
                  value={daysPerPage}
                  onChange={(e) => setDaysPerPage(e.target.value as DaysPerPage)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="2">2 Days per Page (Landscape - Standard Fit)</option>
                  <option value="1">1 Day per Page (Landscape - Large / Spacious)</option>
                  <option value="continuous">Continuous (Scroll / Multi-Day)</option>
                </select>
              </div>

              {/* Min Rows for Personnel */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase block">Min Rows for Personnel</label>
                  <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    {numRows} Rows
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={4}
                    max={18}
                    step={1}
                    value={numRows}
                    onChange={(e) => setNumRows(parseInt(e.target.value) || 8)}
                    className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={numRows}
                    onChange={(e) => setNumRows(Math.max(4, Math.min(20, parseInt(e.target.value) || 8)))}
                    className="w-14 p-1.5 text-center bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5 block">
                  Grid rows scale dynamically to fit page without overflow
                </span>
              </div>

              {/* Staff Names Font & Size Mode */}
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1 flex items-center gap-1">
                  <Type size={11} className="text-purple-500" />
                  Staff Font & Auto-Size
                </label>
                <select
                  value={fontSizeMode}
                  onChange={(e) => setFontSizeMode(e.target.value as FontSizeMode)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="auto">Auto (Smart Fit to Page Height)</option>
                  <option value="compact">Compact Font (Dense Layout)</option>
                  <option value="regular">Regular Font (Balanced)</option>
                  <option value="large">Large Font (High Legibility)</option>
                </select>
              </div>

              {/* Name Text Truncation / Wrap Mode */}
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1 flex items-center gap-1">
                  <Sliders size={11} className="text-emerald-500" />
                  Staff Name Fitting
                </label>
                <select
                  value={nameDisplayMode}
                  onChange={(e) => setNameDisplayMode(e.target.value as NameDisplayMode)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="auto">Auto Fit (Smart Truncate + Badges)</option>
                  <option value="truncate">Single Line (Strict Truncate)</option>
                  <option value="wrap">Allow Multi-Line Wrap</option>
                </select>
              </div>

              {/* Counterparts tag toggle */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-700">Show Counterparts</span>
                  <span className="text-[9px] text-gray-400">Display +Partner tags under names</span>
                </div>
                <input
                  type="checkbox"
                  checked={showCounterparts}
                  onChange={(e) => setShowCounterparts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                />
              </div>

              {/* Combine On-Call List Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <ICONS.Users size={12} className="text-amber-600" />
                    Combine On-Call List
                  </span>
                  <span className="text-[9px] text-amber-700">Merge M/E/N on-calls into single row</span>
                </div>
                <input
                  type="checkbox"
                  checked={combineOnCalls}
                  onChange={(e) => handleToggleCombineOnCalls(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded cursor-pointer accent-amber-600"
                />
              </div>

              {/* Color Theme */}
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">Color Theme</label>
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

              {/* Live Layout Fit Status Banner */}
              <div className={`p-2.5 rounded-xl border text-[10px] space-y-1 ${
                layoutMetrics.isDense 
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900' 
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <Info size={13} className="shrink-0" />
                  <span>
                    {daysPerPage === '2' 
                      ? `${numRows} Rows · 2 Days/Page Fit` 
                      : daysPerPage === '1' 
                        ? `${numRows} Rows · 1 Day/Page Spacious` 
                        : `${numRows} Rows · Continuous Mode`}
                  </span>
                </div>
                <p className="text-[9px] leading-tight text-gray-600">
                  {daysPerPage === '2' && numRows >= 10
                    ? `Auto-compacted row height to ~${layoutMetrics.rowMinHeightPrint} and font to ${layoutMetrics.nameFontSizePrint} to ensure 2 days fit squarely per printed landscape sheet.`
                    : daysPerPage === '2'
                      ? `Standard row height ~${layoutMetrics.rowMinHeightPrint} with font ${layoutMetrics.nameFontSizePrint} perfectly fits landscape A4/Letter.`
                      : `Generous line heights with font ${layoutMetrics.nameFontSizePrint} fill the landscape page.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Category Font Colors Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-600">
                <ICONS.Palette size={14} />
                Font Colors
              </span>
              <button
                onClick={handleResetColors}
                className="text-[9px] font-black text-rose-600 hover:text-rose-700 hover:underline uppercase tracking-tight cursor-pointer"
                title="Reset all categories to default color"
              >
                Default
              </button>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">Morning</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={categoryColors.morning}
                    onChange={(e) => handleColorChange('morning', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-200"
                  />
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">{categoryColors.morning}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">Evening</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={categoryColors.evening}
                    onChange={(e) => handleColorChange('evening', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-200"
                  />
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">{categoryColors.evening}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">Night</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={categoryColors.night}
                    onChange={(e) => handleColorChange('night', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-200"
                  />
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">{categoryColors.night}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">Workshop</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={categoryColors.workshop}
                    onChange={(e) => handleColorChange('workshop', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-200"
                  />
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">{categoryColors.workshop}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">On-Call</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={categoryColors.onCall}
                    onChange={(e) => handleColorChange('onCall', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-200"
                  />
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">{categoryColors.onCall}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">Notes</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={categoryColors.notes}
                    onChange={(e) => handleColorChange('notes', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-200"
                  />
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">{categoryColors.notes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Date selectors */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <ICONS.CalendarIcon size={14} />
                Days to Print
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-black">
                {selectedDays.length} / {daysInMonth} Selected
              </span>
            </h3>

            {/* Quick selectors */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleSelectAll}
                className="py-1 px-2 text-[10px] font-black border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase cursor-pointer"
              >
                All
              </button>
              <button
                onClick={handleSelectNone}
                className="py-1 px-2 text-[10px] font-black border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase cursor-pointer"
              >
                None
              </button>
              <button
                onClick={handleSelectWeekdays}
                className="py-1 px-2 text-[10px] font-black border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase text-indigo-600 cursor-pointer"
              >
                Weekdays
              </button>
              <button
                onClick={handleSelectWeekends}
                className="py-1 px-2 text-[10px] font-black border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase text-amber-600 cursor-pointer"
              >
                Weekends
              </button>
            </div>

            {/* Checkbox grid */}
            <div className="grid grid-cols-5 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDays.includes(dayNum);
                const isWeekend = new Date(config.year, monthIdx, dayNum).getDay() === 5 || new Date(config.year, monthIdx, dayNum).getDay() === 6;
                return (
                  <button
                    key={dayNum}
                    onClick={() => toggleDaySelection(dayNum)}
                    className={`p-1.5 rounded-lg text-center font-bold text-xs border transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold shadow-2xs'
                        : isWeekend
                          ? 'bg-amber-50/50 border-amber-100 text-amber-700'
                          : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-3 space-y-6">
          {selectedDays.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 text-center space-y-4">
              <div className="p-3 bg-rose-50 text-rose-500 rounded-full animate-bounce">
                <ICONS.CalendarIcon size={32} />
              </div>
              <div>
                <h4 className="font-black text-gray-800 text-sm">No Days Selected</h4>
                <p className="text-xs text-gray-400 max-w-sm">
                  Please select at least one day from the left sidebar to render the daily assignment preview.
                </p>
              </div>
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-black text-xs uppercase cursor-pointer"
              >
                Select All Days
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-800 text-xs font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-amber-600 shrink-0" />
                  <span>
                    <strong>Interactive Preview:</strong> Type workshop topics or agenda notes directly into the **Agenda & Notes** box below. It saves instantly!
                  </span>
                </div>
              </div>

              {selectedDays.map(dayNum => (
                <div
                  key={dayNum}
                  className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 no-print z-10">
                    <button
                      onClick={() => toggleDaySelection(dayNum)}
                      className="p-1 bg-gray-100 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Remove from printout"
                    >
                      <ICONS.Trash2 size={12} />
                    </button>
                  </div>

                  <DayAssignmentCard
                    staff={staff}
                    dayNum={dayNum}
                    config={config}
                    monthIdx={monthIdx}
                    shortMonthName={shortMonthName}
                    getWeekdayName={getWeekdayName}
                    numRows={numRows}
                    getStaffForShift={getStaffForShift}
                    inputData={inputsData[dayNum] || {}}
                    onInputChange={(field, val) => handleInputChange(dayNum, field, val)}
                    assignments={assignments}
                    printTheme={printTheme}
                    metrics={layoutMetrics}
                    nameDisplayMode={nameDisplayMode}
                    showCounterparts={showCounterparts}
                    combineOnCalls={combineOnCalls}
                    isPrint={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Printable Area - Hidden on screen, shown strictly during printing */}
      <div className="hidden print:block print-days-container">
        {selectedDays.map(dayNum => (
          <div key={dayNum} className="print-day-block">
            <DayAssignmentCard
              staff={staff}
              dayNum={dayNum}
              config={config}
              monthIdx={monthIdx}
              shortMonthName={shortMonthName}
              getWeekdayName={getWeekdayName}
              numRows={numRows}
              getStaffForShift={getStaffForShift}
              inputData={inputsData[dayNum] || {}}
              onInputChange={(field, val) => handleInputChange(dayNum, field, val)}
              isPrint={true}
              assignments={assignments}
              printTheme={printTheme}
              metrics={layoutMetrics}
              nameDisplayMode={nameDisplayMode}
              showCounterparts={showCounterparts}
              combineOnCalls={combineOnCalls}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/* Core card layout of a single daily assignment sheet */
interface CardProps {
  staff: StaffMember[];
  dayNum: number;
  config: RosterConfig;
  monthIdx: number;
  shortMonthName: string;
  getWeekdayName: (d: number) => string;
  numRows: number;
  getStaffForShift: (day: number, codes: ShiftType[]) => StaffMember[];
  inputData: DayInputData;
  onInputChange: (field: keyof DayInputData, val: string) => void;
  isPrint?: boolean;
  assignments: Assignment[];
  printTheme: 'slate' | 'teal' | 'indigo' | 'amber' | 'emerald';
  metrics: LayoutMetrics;
  nameDisplayMode: NameDisplayMode;
  showCounterparts: boolean;
  combineOnCalls?: boolean;
}

const DayAssignmentCard: React.FC<CardProps> = ({
  staff,
  dayNum,
  config,
  monthIdx,
  shortMonthName,
  getWeekdayName,
  numRows,
  getStaffForShift,
  inputData,
  onInputChange,
  isPrint = false,
  assignments,
  printTheme,
  metrics,
  nameDisplayMode,
  showCounterparts,
  combineOnCalls = false,
}) => {
  const themeStyles = THEME_CONFIGS[printTheme] || THEME_CONFIGS.slate;

  // Helper to find counterparts mirroring a given staffId on this specific day
  const getCounterpartsForStaff = (staffId: string) => {
    if (!showCounterparts) return [];
    const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    return staff.filter(s => 
      s.isCounterPart && 
      s.counterPartOf === staffId &&
      (!s.counterPartStart || dateStr >= s.counterPartStart) &&
      (!s.counterPartEnd || dateStr <= s.counterPartEnd)
    );
  };

  const renderStaffNameWithCounterparts = (member: StaffMember) => {
    const cps = getCounterpartsForStaff(member.id);
    const isHa = member.name.trim().startsWith('HA') || member.name.trim().startsWith('(HA)') || member.name.trim().startsWith('MSA') || member.name.trim().startsWith('(MSA)') || !!member.isHa;
    const isWrap = nameDisplayMode === 'wrap';

    return (
      <div className="flex flex-col items-start leading-tight max-w-full overflow-hidden w-full">
        <span 
          style={{
            fontSize: isPrint ? metrics.nameFontSizePrint : metrics.nameFontSizeScreen,
            lineHeight: isPrint ? '1.1' : '1.2'
          }}
          className={`${isWrap ? 'break-words' : 'truncate'} block font-black staff-name-text flex items-center gap-1 ${isHa ? 'text-emerald-800' : 'text-gray-900'}`}
        >
          {member.isSenior && !isHa ? (
            <span className={`font-black mr-0.5 shrink-0 ${themeStyles.accentText}`}>S</span>
          ) : null}
          <span className={isWrap ? '' : 'truncate'}>{member.name}</span>
          {isHa && (
            <span 
              style={{ fontSize: metrics.badgeFontSize }}
              className="font-black bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded border border-emerald-200 uppercase tracking-tight shrink-0 inline-block"
            >
              MSA
            </span>
          )}
        </span>
        {cps.map(cp => (
          <span 
            key={cp.id} 
            style={{ fontSize: metrics.counterpartFontSize }}
            className="text-violet-700 font-extrabold normal-case bg-violet-50/90 border border-violet-200/80 px-1 py-0.2 rounded mt-0.5 block truncate max-w-full" 
            title={`Counterpart: ${cp.name}`}
          >
            +{cp.name || cp.id}
          </span>
        ))}
      </div>
    );
  };

  // Helper to separate HA / MSA staff down to the bottom of the list
  const getSeparatedStaffRows = (staffList: StaffMember[], totalRows: number) => {
    const isHaStaff = (name: string): boolean => {
      const trimmed = name.trim();
      return trimmed.startsWith('HA') || trimmed.startsWith('(HA)') || trimmed.startsWith('MSA') || trimmed.startsWith('(MSA)');
    };

    const regulars = staffList.filter(s => !isHaStaff(s.name) && !s.isHa);
    const has = staffList.filter(s => isHaStaff(s.name) || !!s.isHa);

    const requiredLength = Math.max(totalRows, regulars.length + has.length);
    const rows = Array<StaffMember | undefined>(requiredLength).fill(undefined);

    // Put regulars at the top
    regulars.forEach((s, idx) => {
      rows[idx] = s;
    });

    // Put HAs / MSAs at the bottom
    has.forEach((s, idx) => {
      const targetIdx = requiredLength - has.length + idx;
      rows[targetIdx] = s;
    });

    return rows;
  };

  // Staff lists
  const morningStaff = useMemo(() => {
    return getStaffForShift(dayNum, [ShiftType.Morning, ShiftType.RequestedMorning]);
  }, [dayNum, getStaffForShift]);

  const eveningStaff = useMemo(() => {
    return getStaffForShift(dayNum, [ShiftType.Evening, ShiftType.RequestedEvening]);
  }, [dayNum, getStaffForShift]);

  const nightStaff = useMemo(() => {
    return getStaffForShift(dayNum, [ShiftType.Night, ShiftType.RequestedNight]);
  }, [dayNum, getStaffForShift]);

  const workshopStaff = useMemo(() => {
    return getStaffForShift(dayNum, [ShiftType.MorningSpecial]);
  }, [dayNum, getStaffForShift]);

  const morningOncalls = useMemo(() => {
    return getStaffForShift(dayNum, [ShiftType.MorningOnCall]);
  }, [dayNum, getStaffForShift]);

  const eveningOncalls = useMemo(() => {
    return getStaffForShift(dayNum, [ShiftType.EveningOnCall]);
  }, [dayNum, getStaffForShift]);

  const nightOncalls = useMemo(() => {
    return getStaffForShift(dayNum, [ShiftType.NightOnCall]);
  }, [dayNum, getStaffForShift]);

  const combinedOncalls = useMemo(() => {
    const list: { staff: StaffMember; label: string; badgeClass: string }[] = [];
    morningOncalls.forEach(s => list.push({ staff: s, label: 'M-Call', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' }));
    eveningOncalls.forEach(s => list.push({ staff: s, label: 'E-Call', badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300' }));
    nightOncalls.forEach(s => list.push({ staff: s, label: 'N-Call', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' }));
    return list;
  }, [morningOncalls, eveningOncalls, nightOncalls]);

  // Row-separated lists to separate HA / MSA staff below regular staff
  const morningStaffRows = useMemo(() => {
    return getSeparatedStaffRows(morningStaff, numRows);
  }, [morningStaff, numRows]);

  const eveningStaffRows = useMemo(() => {
    return getSeparatedStaffRows(eveningStaff, numRows);
  }, [eveningStaff, numRows]);

  const nightStaffRows = useMemo(() => {
    return getSeparatedStaffRows(nightStaff, numRows);
  }, [nightStaff, numRows]);

  const isFirstHaInList = (member: StaffMember | undefined, list: (StaffMember | undefined)[], index: number) => {
    if (!member) return false;
    const trimmed = member.name.trim();
    const isHa = trimmed.startsWith('HA') || trimmed.startsWith('(HA)') || trimmed.startsWith('MSA') || trimmed.startsWith('(MSA)') || !!member.isHa;
    if (!isHa) return false;
    
    // Find first index of HA / MSA in the list
    const firstHaIdx = list.findIndex(s => s && (s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)') || !!s.isHa));
    return firstHaIdx === index;
  };

  // Determine row indices to map
  const maxLen = Math.max(numRows, morningStaffRows.length, eveningStaffRows.length, nightStaffRows.length);
  const rowIndices = Array.from({ length: maxLen });

  const effectiveRowHeight = isPrint ? metrics.rowMinHeightPrint : metrics.rowMinHeightScreen;

  return (
    <div className={`w-full h-full border-2 ${themeStyles.borderColor} bg-white text-black font-sans select-none overflow-hidden flex flex-col md:flex-row print:flex-row print:${themeStyles.borderColor} box-border`}>
      
      {/* 1. Date column (Vertical block) */}
      <div className={`w-full md:w-[8%] print:w-[8%] flex flex-col justify-center items-center p-1 sm:p-2 text-center border-b md:border-b-0 md:border-r ${themeStyles.borderColor} bg-white shrink-0`}>
        {config.wardName && (
          <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-slate-500 mb-0.5 text-center truncate max-w-full">
            {config.wardName}
          </span>
        )}
        <span className="text-[9px] font-black uppercase tracking-tight text-gray-500">Date</span>
        <span className={`${metrics.dateNumberSize} font-black leading-none my-0.5 sm:my-1 ${themeStyles.accentText}`}>
          {dayNum}
        </span>
        <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 leading-tight">
          {shortMonthName}, {config.year}
        </span>
        <span className={`text-[10px] sm:text-[11px] font-black underline tracking-tight uppercase mt-1 sm:mt-2 ${themeStyles.accentText}`}>
          {getWeekdayName(dayNum).substring(0, 3)}day
        </span>
      </div>

      {/* 2. Roster Columns: Morning, Evening, Night */}
      <div 
        style={{
          gridTemplateRows: `auto repeat(${maxLen}, 1fr)`
        }}
        className={`w-full md:w-[67%] print:w-[67%] grid grid-cols-[1.7fr_0.8fr_1.7fr_0.8fr_1.7fr_0.8fr] border-b md:border-b-0 md:border-r ${themeStyles.borderColor} flex-grow h-full`}
      >
        {/* Table Headers */}
        <div 
          style={{ fontSize: isPrint ? metrics.nameFontSizePrint : metrics.headerFontSize }}
          className={`${themeStyles.headerBg} font-black border-b border-r ${themeStyles.borderColor} text-center py-0.5 uppercase tracking-tight print-color-morning flex items-center justify-center`}
        >
          Morning
        </div>
        <div 
          style={{ fontSize: isPrint ? metrics.badgeFontSize : '8px' }}
          className={`${themeStyles.headerBg} font-semibold border-b border-r ${themeStyles.borderColor} text-center py-0.5 uppercase tracking-tight text-gray-500/90 print-color-morning flex items-center justify-center`}
        >
          (Assignment)
        </div>
        <div 
          style={{ fontSize: isPrint ? metrics.nameFontSizePrint : metrics.headerFontSize }}
          className={`${themeStyles.headerBg} font-black border-b border-r ${themeStyles.borderColor} text-center py-0.5 uppercase tracking-tight print-color-evening flex items-center justify-center`}
        >
          Evening
        </div>
        <div 
          style={{ fontSize: isPrint ? metrics.badgeFontSize : '8px' }}
          className={`${themeStyles.headerBg} font-semibold border-b border-r ${themeStyles.borderColor} text-center py-0.5 uppercase tracking-tight text-gray-500/90 print-color-evening flex items-center justify-center`}
        >
          (Assignment)
        </div>
        <div 
          style={{ fontSize: isPrint ? metrics.nameFontSizePrint : metrics.headerFontSize }}
          className={`${themeStyles.headerBg} font-black border-b border-r ${themeStyles.borderColor} text-center py-0.5 uppercase tracking-tight print-color-night flex items-center justify-center`}
        >
          Night
        </div>
        <div 
          style={{ fontSize: isPrint ? metrics.badgeFontSize : '8px' }}
          className={`${themeStyles.headerBg} font-semibold border-b ${themeStyles.borderColor} text-center py-0.5 uppercase tracking-tight text-gray-500/90 print-color-night flex items-center justify-center`}
        >
          (Assignment)
        </div>

        {/* Rows of personnel & blank inputs */}
        {rowIndices.map((_, i) => {
          const mMember = morningStaffRows[i];
          const eMember = eveningStaffRows[i];
          const nMember = nightStaffRows[i];

          const isLastRow = i === rowIndices.length - 1;
          const borderClass = isLastRow ? '' : `border-b ${themeStyles.borderColor}/30`;

          const mIsFirstHa = isFirstHaInList(mMember, morningStaffRows, i);
          const eIsFirstHa = isFirstHaInList(eMember, eveningStaffRows, i);
          const nIsFirstHa = isFirstHaInList(nMember, nightStaffRows, i);

          return (
            <React.Fragment key={i}>
              {/* Morning Personnel */}
              <div 
                style={{ minHeight: effectiveRowHeight }}
                className={`px-1 sm:px-1.5 ${metrics.rowPaddingY} font-bold border-r ${themeStyles.borderColor} ${borderClass} flex items-center justify-start overflow-hidden min-h-0 print-color-morning ${
                  mIsFirstHa ? 'border-t-2 border-t-emerald-600 bg-emerald-50/5' : ''
                }`}
              >
                {mMember && renderStaffNameWithCounterparts(mMember)}
              </div>
              {/* Morning Assignment */}
              <div 
                style={{ minHeight: effectiveRowHeight }}
                className={`p-0.5 border-r ${themeStyles.borderColor} ${borderClass} bg-transparent min-h-0 print-color-morning ${
                  mIsFirstHa ? 'border-t-2 border-t-emerald-600 bg-emerald-50/5' : ''
                }`} 
              />

              {/* Evening Personnel */}
              <div 
                style={{ minHeight: effectiveRowHeight }}
                className={`px-1 sm:px-1.5 ${metrics.rowPaddingY} font-bold border-r ${themeStyles.borderColor} ${borderClass} flex items-center justify-start overflow-hidden min-h-0 print-color-evening ${
                  eIsFirstHa ? 'border-t-2 border-t-emerald-600 bg-emerald-50/5' : ''
                }`}
              >
                {eMember && renderStaffNameWithCounterparts(eMember)}
              </div>
              {/* Evening Assignment */}
              <div 
                style={{ minHeight: effectiveRowHeight }}
                className={`p-0.5 border-r ${themeStyles.borderColor} ${borderClass} bg-transparent min-h-0 print-color-evening ${
                  eIsFirstHa ? 'border-t-2 border-t-emerald-600 bg-emerald-50/5' : ''
                }`} 
              />

              {/* Night Personnel */}
              <div 
                style={{ minHeight: effectiveRowHeight }}
                className={`px-1 sm:px-1.5 ${metrics.rowPaddingY} font-bold border-r ${themeStyles.borderColor} ${borderClass} flex items-center justify-start overflow-hidden min-h-0 print-color-night ${
                  nIsFirstHa ? 'border-t-2 border-t-emerald-600 bg-emerald-50/5' : ''
                }`}
              >
                {nMember && renderStaffNameWithCounterparts(nMember)}
              </div>
              {/* Night Assignment */}
              <div 
                style={{ minHeight: effectiveRowHeight }}
                className={`p-0.5 ${borderClass} bg-transparent min-h-0 print-color-night ${
                  nIsFirstHa ? 'border-t-2 border-t-emerald-600 bg-emerald-50/5' : ''
                }`} 
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* 3. Workshop, Training & On-Calls Column */}
      <div className="w-full md:w-[25%] print:w-[25%] flex flex-col justify-between bg-white shrink-0 overflow-hidden">
        
        {/* Top: Workshop Header */}
        <div 
          style={{ fontSize: isPrint ? metrics.badgeFontSize : '9.5px' }}
          className={`${themeStyles.headerBg} font-black border-b ${themeStyles.borderColor} text-center py-1 uppercase tracking-tight print-color-workshop`}
        >
          [Workshop / Training / Special]
        </div>

        {/* Workshop Personnel Area */}
        <div className={`border-b ${themeStyles.borderColor} flex-shrink-0 bg-white overflow-hidden`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr 
                style={{ fontSize: isPrint ? '7px' : '7.5px' }}
                className={`${themeStyles.subHeaderBg} border-b ${themeStyles.borderColor} font-black uppercase tracking-tight print-color-workshop`}
              >
                <th className={`px-1 py-0.5 border-r ${themeStyles.borderColor} text-center w-5`}>#</th>
                <th className="px-1 py-0.5">Name</th>
              </tr>
            </thead>
            <tbody>
              {workshopStaff.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center py-2 text-[8.5px] text-gray-400 italic font-medium print-color-workshop">
                    No special assignments
                  </td>
                </tr>
              ) : (
                workshopStaff.slice(0, 4).map((w, idx) => {
                  const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                  const assignment = assignments.find(a => a.staffId === w.id && a.date === dateStr);
                  const isSpecial = assignment?.shift === ShiftType.MorningSpecial;
                  return (
                    <tr key={idx} className="border-b border-black/10 last:border-0" style={{ height: metrics.workshopRowHeight }}>
                      <td className={`px-1 py-0.2 border-r ${themeStyles.borderColor} text-center font-black text-gray-500 text-[8px] ${themeStyles.bgTint}`}>
                        {idx + 1}
                      </td>
                      <td className="px-1 py-0.2 font-bold max-w-[120px] overflow-hidden print-color-workshop">
                        <div className="flex flex-col items-start overflow-hidden leading-tight w-full">
                          <span 
                            style={{ fontSize: isPrint ? metrics.nameFontSizePrint : '11px' }}
                            className="truncate block staff-name-text"
                          >
                            {w.isSenior ? <span className={`font-black mr-0.5 ${themeStyles.accentText}`}>[S]</span> : ''}
                            {w.name}
                            {isSpecial ? <span className={`text-[7px] ${themeStyles.accentText} font-bold ml-1`}>(1S)</span> : ''}
                          </span>
                          {showCounterparts && getCounterpartsForStaff(w.id).map(cp => (
                            <span key={cp.id} style={{ fontSize: metrics.counterpartFontSize }} className="text-violet-600 font-extrabold bg-violet-50 px-1 py-0.2 rounded block whitespace-nowrap">
                              +{cp.name || cp.id}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Middle: Free Text Agenda / Notes */}
        <div className={`flex flex-col border-b ${themeStyles.borderColor} flex-1 min-h-[40px] bg-white overflow-hidden`}>
          <div 
            style={{ fontSize: isPrint ? '7px' : '7.5px' }}
            className={`${themeStyles.subHeaderBg} border-b ${themeStyles.borderColor} px-1.5 py-0.5 flex justify-between items-center font-black uppercase tracking-tight print-color-notes shrink-0`}
          >
            <span>Agenda & Notes</span>
            <span className={`${themeStyles.badgeBg} ${themeStyles.badgeText} px-1 rounded-sm text-[6px]`}>FREE-TEXT</span>
          </div>
          <div className="flex-1 flex flex-col p-1 overflow-hidden">
            {isPrint ? (
              <div 
                style={{ fontSize: metrics.notesFontSize }}
                className="w-full flex-1 font-semibold whitespace-pre-wrap leading-tight text-gray-800 break-words p-0.5 print-color-notes notes-print-content overflow-hidden"
              >
                {inputData.notes || <span className="text-gray-300 italic">No notes scheduled.</span>}
              </div>
            ) : (
              <textarea
                placeholder="Type workshop topic, schedule, or notes here..."
                value={inputData.notes || ''}
                onChange={(e) => onInputChange('notes', e.target.value)}
                style={{ fontSize: metrics.notesFontSize }}
                className="w-full flex-1 font-semibold bg-transparent border-none outline-none resize-none leading-tight placeholder:text-gray-300 placeholder:italic placeholder:font-normal focus:bg-blue-50/30 p-0.5 h-full print-color-notes"
              />
            )}
          </div>
        </div>

        {/* Bottom Sub-grid: Combined On-call or [Morning Oncall] [Evening Oncall] [Night Oncall] */}
        {combineOnCalls ? (
          <div className={`flex flex-col border-t ${themeStyles.borderColor} shrink-0 pb-0.5 bg-white`}>
            <div 
              style={{ fontSize: isPrint ? '6.5px' : '7.5px' }}
              className={`${themeStyles.headerBg} font-black text-center py-0.5 border-b ${themeStyles.borderColor} uppercase tracking-tighter truncate px-1 print-color-oncall`}
            >
              [Combined On-Call Personnel]
            </div>
            <div className="p-1 font-bold flex flex-wrap items-center justify-center overflow-hidden leading-tight text-center gap-x-2 gap-y-0.5 min-h-[26px]">
              {combinedOncalls.length === 0 ? (
                <span className="text-[7.5px] text-gray-400 italic">None Scheduled</span>
              ) : (
                combinedOncalls.map(({ staff: s, label, badgeClass }, idx) => {
                  const cps = getCounterpartsForStaff(s.id);
                  return (
                    <div key={idx} style={{ fontSize: metrics.onCallFontSize }} className="inline-flex items-center gap-1 leading-tight print-color-oncall px-1 py-0.5 bg-gray-50/80 rounded border border-gray-200/60">
                      <span className={`text-[6.5px] font-black px-1 py-0.2 rounded border ${badgeClass} leading-none`}>
                        {label}
                      </span>
                      <span className="truncate staff-name-text">{s.name}</span>
                      {showCounterparts && cps.map(cp => (
                        <span key={cp.id} style={{ fontSize: metrics.counterpartFontSize }} className="text-violet-600 font-extrabold bg-violet-50 px-0.5 rounded whitespace-nowrap">
                          +{cp.name || cp.id}
                        </span>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-3 border-t ${themeStyles.borderColor} shrink-0 pb-0.5 bg-white`}>
            {/* Sub headers */}
            <div className={`flex flex-col border-r ${themeStyles.borderColor}`}>
              <div 
                style={{ fontSize: isPrint ? '6.5px' : '7.5px' }}
                className={`${themeStyles.headerBg} font-black text-center py-0.5 border-b ${themeStyles.borderColor} uppercase tracking-tighter truncate px-0.5 print-color-oncall`}
              >
                [M-Oncall]
              </div>
              <div className="p-0.5 font-bold flex flex-col justify-start overflow-hidden leading-tight text-center gap-0.5 min-h-[26px]">
                {morningOncalls.map((s, idx) => {
                  const cps = getCounterpartsForStaff(s.id);
                  return (
                    <div key={idx} style={{ fontSize: metrics.onCallFontSize }} className="flex flex-col items-center justify-center leading-tight print-color-oncall">
                      <span className="truncate staff-name-text">{s.name}</span>
                      {showCounterparts && cps.map(cp => (
                        <span key={cp.id} style={{ fontSize: metrics.counterpartFontSize }} className="text-violet-600 font-extrabold bg-violet-50 px-0.5 rounded whitespace-nowrap">
                          +{cp.name || cp.id}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`flex flex-col border-r ${themeStyles.borderColor}`}>
              <div 
                style={{ fontSize: isPrint ? '6.5px' : '7.5px' }}
                className={`${themeStyles.headerBg} font-black text-center py-0.5 border-b ${themeStyles.borderColor} uppercase tracking-tighter truncate px-0.5 print-color-oncall`}
              >
                [E-Oncall]
              </div>
              <div className="p-0.5 font-bold flex flex-col justify-start overflow-hidden leading-tight text-center gap-0.5 min-h-[26px]">
                {eveningOncalls.map((s, idx) => {
                  const cps = getCounterpartsForStaff(s.id);
                  return (
                    <div key={idx} style={{ fontSize: metrics.onCallFontSize }} className="flex flex-col items-center justify-center leading-tight print-color-oncall">
                      <span className="truncate staff-name-text">{s.name}</span>
                      {showCounterparts && cps.map(cp => (
                        <span key={cp.id} style={{ fontSize: metrics.counterpartFontSize }} className="text-violet-600 font-extrabold bg-violet-50 px-0.5 rounded whitespace-nowrap">
                          +{cp.name || cp.id}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col">
              <div 
                style={{ fontSize: isPrint ? '6.5px' : '7.5px' }}
                className={`${themeStyles.headerBg} font-black text-center py-0.5 border-b ${themeStyles.borderColor} uppercase tracking-tighter truncate px-0.5 print-color-oncall`}
              >
                [N-Oncall]
              </div>
              <div className="p-0.5 font-bold flex flex-col justify-start overflow-hidden leading-tight text-center gap-0.5 min-h-[26px]">
                {nightOncalls.map((s, idx) => {
                  const cps = getCounterpartsForStaff(s.id);
                  return (
                    <div key={idx} style={{ fontSize: metrics.onCallFontSize }} className="flex flex-col items-center justify-center leading-tight print-color-oncall">
                      <span className="truncate staff-name-text">{s.name}</span>
                      {showCounterparts && cps.map(cp => (
                        <span key={cp.id} style={{ fontSize: metrics.counterpartFontSize }} className="text-violet-600 font-extrabold bg-violet-50 px-0.5 rounded whitespace-nowrap">
                          +{cp.name || cp.id}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DailyAssignmentsPrintView;
