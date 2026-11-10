
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { StaffMember, RosterConfig, Assignment, ShiftType, ThemeType } from '../types';
import { THEME_SHIFT_STYLES, ICONS } from '../constants';
import { validateShiftSequence } from '../utils/sequenceRules';
import { 
  UserCheck, 
  CheckSquare, 
  Square, 
  Eye, 
  EyeOff, 
  Filter, 
  Check, 
  X, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Users,
  ListFilter,
  UserPlus,
  RotateCcw
} from 'lucide-react';

export type StaffCategoryFilter = 'ALL' | 'REGULAR' | 'WS' | 'HA' | 'COUNTERPART' | 'SENIOR' | 'JUNIOR' | 'MALE' | 'FEMALE';

export const parseShiftCode = (input: string): ShiftType => {
  const clean = input.trim().toUpperCase();
  if (!clean || clean === '-' || clean === '0' || clean === 'NONE') return ShiftType.None;
  if (clean === '1' || clean === 'M' || clean === 'MORNING') return ShiftType.Morning;
  if (clean === '2' || clean === 'E' || clean === 'EVENING') return ShiftType.Evening;
  if (clean === '3' || clean === 'N' || clean === 'NIGHT') return ShiftType.Night;
  if (clean === 'W' || clean === 'OFF') return ShiftType.Off;
  if (clean === 'L' || clean === 'LEAVE') return ShiftType.Leave;
  if (clean === 'O' || clean === 'OTHER' || clean === 'OTHER LEAVE' || clean === 'OL') return ShiftType.OtherLeave;
  if (clean === 'H' || clean === 'HOLIDAY') return ShiftType.PublicHoliday;
  if (clean === 'P' || clean === 'COMP' || clean === 'COMPENSATION') return ShiftType.CompensationLeave;
  if (clean === '1S' || clean === 'MS') return ShiftType.MorningSpecial;
  if (clean === 'O1' || clean === 'MO') return ShiftType.MorningOnCall;
  if (clean === 'O2' || clean === 'EO') return ShiftType.EveningOnCall;
  if (clean === 'O3' || clean === 'NO') return ShiftType.NightOnCall;
  if (clean === 'R1' || clean === 'RM') return ShiftType.RequestedMorning;
  if (clean === 'R2' || clean === 'RE') return ShiftType.RequestedEvening;
  if (clean === 'R3' || clean === 'RN') return ShiftType.RequestedNight;
  if (clean === 'RW') return ShiftType.RequestedOff;
  return ShiftType.None;
};

interface Props {
  staff: StaffMember[];
  config: RosterConfig;
  assignments: Assignment[];
  onUpdate?: (staffId: string, date: string, shift: ShiftType) => void;
  onUpdateBatch?: (updates: Assignment[]) => void;
  readOnly?: boolean;
  hideContextDays?: boolean;
  theme?: ThemeType;
  selectedCategory?: StaffCategoryFilter | StaffCategoryFilter[];
  selectedCategories?: StaffCategoryFilter[];
  onCategoryChange?: (category: StaffCategoryFilter | StaffCategoryFilter[]) => void;
}

interface ActiveCell {
  staffId: string;
  dateStr: string;
  viewportX: number;
  viewportY: number;
  shouldFlip: boolean;
}

type EntryMode = 'KEYBOARD' | 'PICKER';

interface KeyboardCellState {
  staffIndex: number;
  dayIndex: number;
  inputValue: string;
}

const ShiftGrid: React.FC<Props> = ({ 
  staff, 
  config, 
  assignments, 
  onUpdate, 
  onUpdateBatch, 
  readOnly = false,
  hideContextDays = false,
  theme = 'Professional',
  selectedCategory: propCategory,
  selectedCategories: propCategories,
  onCategoryChange
}) => {
  const [internalCategories, setInternalCategories] = useState<StaffCategoryFilter[]>(['ALL']);
  const [matchMode, setMatchMode] = useState<'OR' | 'AND'>('OR');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>('KEYBOARD');
  const [keyboardCell, setKeyboardCell] = useState<KeyboardCellState | null>(null);

  // Selected Staff specific filters
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [viewSelectedOnly, setViewSelectedOnly] = useState<boolean>(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<StaffCategoryFilter | 'ALL'>('ALL');

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Selection toggle helpers
  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) {
        const next = prev.filter(id => id !== staffId);
        if (next.length === 0 && viewSelectedOnly) {
          setViewSelectedOnly(false);
        }
        return next;
      } else {
        return [...prev, staffId];
      }
    });
  };

  const handleSelectAllStaff = () => {
    setSelectedStaffIds(staff.map(s => s.id));
  };

  const handleClearStaffSelection = () => {
    setSelectedStaffIds([]);
    setViewSelectedOnly(false);
  };

  const handleInvertStaffSelection = () => {
    const currentSet = new Set(selectedStaffIds);
    const inverted = staff.filter(s => !currentSet.has(s.id)).map(s => s.id);
    setSelectedStaffIds(inverted);
    if (inverted.length === 0 && viewSelectedOnly) {
      setViewSelectedOnly(false);
    }
  };

  const handleSelectCategoryGroup = (cat: StaffCategoryFilter) => {
    const matchingIds = staff.filter(s => matchesCategory(s, cat)).map(s => s.id);
    const unionSet = new Set([...selectedStaffIds, ...matchingIds]);
    setSelectedStaffIds(Array.from(unionSet));
  };

  // Normalize prop or state into activeCategories list
  const activeCategories = useMemo<StaffCategoryFilter[]>(() => {
    let source = propCategories || propCategory || internalCategories;
    let list: StaffCategoryFilter[];
    if (Array.isArray(source)) {
      list = source;
    } else {
      list = [source];
    }
    if (list.length === 0 || (list.includes('ALL') && list.length === 1)) {
      return ['ALL'];
    }
    const filtered = list.filter(c => c !== 'ALL');
    return filtered.length > 0 ? filtered : ['ALL'];
  }, [propCategory, propCategories, internalCategories]);

  const isAllSelected = activeCategories.includes('ALL') || activeCategories.length === 0;

  const handleCategoryToggle = (cat: StaffCategoryFilter) => {
    let nextCats: StaffCategoryFilter[];
    if (cat === 'ALL') {
      nextCats = ['ALL'];
    } else {
      if (activeCategories.includes('ALL')) {
        nextCats = [cat];
      } else if (activeCategories.includes(cat)) {
        nextCats = activeCategories.filter(c => c !== cat);
        if (nextCats.length === 0) {
          nextCats = ['ALL'];
        }
      } else {
        nextCats = [...activeCategories, cat];
      }
    }

    if (onCategoryChange) {
      onCategoryChange(nextCats.length === 1 ? nextCats[0] : nextCats);
    }
    setInternalCategories(nextCats);
  };

  // Helper functions for staff categories
  const isWsStaff = (s: StaffMember): boolean => {
    return !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)');
  };

  const isHaStaff = (name: string): boolean => {
    const trimmed = name.trim();
    return trimmed.startsWith('HA') || trimmed.startsWith('(HA)') || trimmed.startsWith('MSA') || trimmed.startsWith('(MSA)');
  };

  const isRegularStaff = (s: StaffMember): boolean => {
    return !isWsStaff(s) && !isHaStaff(s.name) && !s.isHa && !s.isCounterPart;
  };

  const matchesCategory = (s: StaffMember, cat: StaffCategoryFilter): boolean => {
    if (cat === 'ALL') return true;
    if (cat === 'REGULAR') return isRegularStaff(s);
    if (cat === 'WS') return isWsStaff(s);
    if (cat === 'HA') return (isHaStaff(s.name) || !!s.isHa) && !isWsStaff(s);
    if (cat === 'COUNTERPART') return !!s.isCounterPart;
    if (cat === 'SENIOR') return s.isSenior && !isWsStaff(s) && !isHaStaff(s.name) && !s.isHa;
    if (cat === 'JUNIOR') return !s.isSenior && !isWsStaff(s) && !isHaStaff(s.name) && !s.isHa && !s.isCounterPart;
    if (cat === 'MALE') return s.isMale && !isWsStaff(s) && !isHaStaff(s.name) && !s.isHa;
    if (cat === 'FEMALE') return !s.isMale && !isWsStaff(s) && !isHaStaff(s.name) && !s.isHa;
    return false;
  };

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    return {
      ALL: staff.length,
      REGULAR: staff.filter(s => isRegularStaff(s)).length,
      WS: staff.filter(s => isWsStaff(s)).length,
      HA: staff.filter(s => (isHaStaff(s.name) || !!s.isHa) && !isWsStaff(s)).length,
      COUNTERPART: staff.filter(s => !!s.isCounterPart).length,
      SENIOR: staff.filter(s => s.isSenior && !isWsStaff(s) && !isHaStaff(s.name) && !s.isHa).length,
      JUNIOR: staff.filter(s => !s.isSenior && !isWsStaff(s) && !isHaStaff(s.name) && !s.isHa && !s.isCounterPart).length,
      MALE: staff.filter(s => s.isMale && !isWsStaff(s) && !isHaStaff(s.name) && !s.isHa).length,
      FEMALE: staff.filter(s => !s.isMale && !isWsStaff(s) && !isHaStaff(s.name) && !s.isHa).length,
    };
  }, [staff]);

  // Filtered staff based on category, selected staff & search
  const displayStaff = useMemo(() => {
    let filtered = staff;

    if (viewSelectedOnly && selectedStaffIds.length > 0) {
      const selectedSet = new Set(selectedStaffIds);
      filtered = filtered.filter(s => selectedSet.has(s.id));
    } else if (!isAllSelected) {
      filtered = staff.filter(s => {
        if (matchMode === 'AND') {
          return activeCategories.every(cat => matchesCategory(s, cat));
        } else {
          return activeCategories.some(cat => matchesCategory(s, cat));
        }
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.id.toLowerCase().includes(q)
      );
    }

    if (isAllSelected && (!viewSelectedOnly || selectedStaffIds.length === 0)) {
      const ws = filtered.filter(s => isWsStaff(s));
      const regular = filtered.filter(s => isRegularStaff(s));
      const ha = filtered.filter(s => isHaStaff(s.name) && !isWsStaff(s));
      const cp = filtered.filter(s => !!s.isCounterPart && !isWsStaff(s) && !isHaStaff(s.name));
      
      const accounted = new Set([...ws, ...regular, ...ha, ...cp].map(s => s.id));
      const others = filtered.filter(s => !accounted.has(s.id));

      return [...ws, ...regular, ...ha, ...cp, ...others];
    }

    return filtered;
  }, [staff, isAllSelected, activeCategories, matchMode, searchQuery, viewSelectedOnly, selectedStaffIds]);

  // Get theme-specific styles
  const SHIFT_DETAILS = THEME_SHIFT_STYLES[theme];

  const monthIdx = useMemo(() => {
    const d = new Date(Date.parse(config.month + " 1, " + config.year));
    return d.getMonth();
  }, [config.month, config.year]);

  const contextDays = useMemo(() => {
    return [-4, -3, -2, -1, 0].map(offset => {
      const d = new Date(config.year, monthIdx, offset);
      const dayOfWeek = d.getDay();
      return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        dateStr: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
        isContext: true,
        isWeekend: dayOfWeek === 5 || dayOfWeek === 6
      };
    });
  }, [config.year, monthIdx]);

  const currentMonthDays = useMemo(() => {
    const totalDays = new Date(config.year, monthIdx + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const d = new Date(config.year, monthIdx, day);
      const dayOfWeek = d.getDay();
      return {
        day,
        month: monthIdx + 1,
        year: config.year,
        dateStr: `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        isContext: false,
        isWeekend: dayOfWeek === 5 || dayOfWeek === 6
      };
    });
  }, [config.year, monthIdx]);

  const allVisibleDays = useMemo(() => {
    return hideContextDays ? currentMonthDays : [...contextDays, ...currentMonthDays];
  }, [contextDays, currentMonthDays, hideContextDays]);

  const getDayName = (year: number, month: number, day: number) => {
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getShift = (staffId: string, dateStr: string) => {
    const found = assignments.find(a => a.staffId === staffId && a.date === dateStr);
    return found ? found.shift : ShiftType.None;
  };

  const getStaffTotals = (staffId: string) => {
    const staffAssignments = assignments.filter(a => 
      a.staffId === staffId && 
      currentMonthDays.some(d => d.dateStr === a.date)
    );
    
    return {
      morning: staffAssignments.filter(a => 
        [ShiftType.Morning, ShiftType.RequestedMorning, ShiftType.MorningSpecial].includes(a.shift)
      ).length,
      evening: staffAssignments.filter(a => 
        [ShiftType.Evening, ShiftType.RequestedEvening].includes(a.shift)
      ).length,
      night: staffAssignments.filter(a => 
        [ShiftType.Night, ShiftType.RequestedNight].includes(a.shift)
      ).length,
      off: staffAssignments.filter(a => 
        [ShiftType.Off, ShiftType.RequestedOff].includes(a.shift)
      ).length,
      compLeave: staffAssignments.filter(a => a.shift === ShiftType.CompensationLeave).length,
      leave: staffAssignments.filter(a => a.shift === ShiftType.Leave).length,
      otherLeave: staffAssignments.filter(a => a.shift === ShiftType.OtherLeave).length,
      holiday: staffAssignments.filter(a => a.shift === ShiftType.PublicHoliday).length,
    };
  };

  const commitKeyboardCell = (staffIdx: number, dayIdx: number, rawInput: string) => {
    if (readOnly || !onUpdate) return;
    const member = displayStaff[staffIdx];
    const dayInfo = allVisibleDays[dayIdx];
    if (!member || !dayInfo || member.isCounterPart) return;

    const parsedShift = parseShiftCode(rawInput);
    onUpdate(member.id, dayInfo.dateStr, parsedShift);
  };

  const navigateToCell = (
    currentStaffIdx: number,
    currentDayIdx: number,
    direction: 'RIGHT' | 'LEFT' | 'UP' | 'DOWN'
  ) => {
    if (displayStaff.length === 0 || allVisibleDays.length === 0) return;

    let nextStaffIdx = currentStaffIdx;
    let nextDayIdx = currentDayIdx;

    if (direction === 'RIGHT') {
      nextDayIdx = currentDayIdx + 1;
      if (nextDayIdx >= allVisibleDays.length) {
        nextDayIdx = 0;
        nextStaffIdx = currentStaffIdx + 1;
        if (nextStaffIdx >= displayStaff.length) {
          nextStaffIdx = 0; // Wrap around to first staff member
        }
      }
    } else if (direction === 'LEFT') {
      nextDayIdx = currentDayIdx - 1;
      if (nextDayIdx < 0) {
        nextDayIdx = allVisibleDays.length - 1;
        nextStaffIdx = currentStaffIdx - 1;
        if (nextStaffIdx < 0) {
          nextStaffIdx = displayStaff.length - 1; // Wrap around to last staff member
        }
      }
    } else if (direction === 'UP') {
      nextStaffIdx = currentStaffIdx - 1;
      if (nextStaffIdx < 0) {
        nextStaffIdx = displayStaff.length - 1;
      }
    } else if (direction === 'DOWN') {
      nextStaffIdx = currentStaffIdx + 1;
      if (nextStaffIdx >= displayStaff.length) {
        nextStaffIdx = 0;
      }
    }

    // Skip counterpart staff if non-editable
    let attempts = 0;
    while (attempts < displayStaff.length && displayStaff[nextStaffIdx]?.isCounterPart) {
      if (direction === 'UP') {
        nextStaffIdx = (nextStaffIdx - 1 + displayStaff.length) % displayStaff.length;
      } else {
        nextStaffIdx = (nextStaffIdx + 1) % displayStaff.length;
      }
      attempts++;
    }

    const targetMember = displayStaff[nextStaffIdx];
    const targetDay = allVisibleDays[nextDayIdx];

    if (targetMember && targetDay) {
      const currentShift = getShift(targetMember.id, targetDay.dateStr);
      const initialCode = currentShift === ShiftType.None ? '' : currentShift;
      setKeyboardCell({
        staffIndex: nextStaffIdx,
        dayIndex: nextDayIdx,
        inputValue: initialCode
      });
    }
  };

  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    sIdx: number,
    dIdx: number
  ) => {
    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey) || e.key === 'ArrowRight') {
      e.preventDefault();
      commitKeyboardCell(sIdx, dIdx, keyboardCell?.inputValue || '');
      navigateToCell(sIdx, dIdx, 'RIGHT');
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      commitKeyboardCell(sIdx, dIdx, keyboardCell?.inputValue || '');
      navigateToCell(sIdx, dIdx, 'LEFT');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commitKeyboardCell(sIdx, dIdx, keyboardCell?.inputValue || '');
      navigateToCell(sIdx, dIdx, 'UP');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commitKeyboardCell(sIdx, dIdx, keyboardCell?.inputValue || '');
      navigateToCell(sIdx, dIdx, 'DOWN');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setKeyboardCell(null);
    }
  };

  const handleCellClick = (e: React.MouseEvent, member: StaffMember, sIdx: number, dateStr: string, dIdx: number) => {
    if (readOnly || (!onUpdate && !onUpdateBatch)) return;
    if (member.isCounterPart) return;

    if (entryMode === 'KEYBOARD') {
      setActiveCell(null);
      const currentShift = getShift(member.id, dateStr);
      const initialCode = currentShift === ShiftType.None ? '' : currentShift;
      setKeyboardCell({
        staffIndex: sIdx,
        dayIndex: dIdx,
        inputValue: initialCode
      });
    } else {
      setKeyboardCell(null);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const menuEstimatedHeight = 350;
      const shouldFlip = rect.bottom + menuEstimatedHeight > window.innerHeight;

      setActiveCell({
        staffId: member.id,
        dateStr,
        viewportX: rect.left,
        viewportY: shouldFlip ? rect.top : rect.bottom,
        shouldFlip
      });
    }
  };

  const handleSelectShift = (shift: ShiftType) => {
    if (activeCell && onUpdate) {
      onUpdate(activeCell.staffId, activeCell.dateStr, shift);
      setActiveCell(null);
    }
  };

  const handle15DayLeave = () => {
    if (!activeCell || !onUpdateBatch) return;
    const staffId = activeCell.staffId;
    const dateParts = activeCell.dateStr.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);
    if (window.confirm(`Set 15 continuous days of LEAVE (L) for ${staffId}?`)) {
      const batchUpdates: Assignment[] = [];
      const cursorDate = new Date(year, month - 1, day);
      for (let i = 0; i < 15; i++) {
        const dStr = `${cursorDate.getFullYear()}-${(cursorDate.getMonth() + 1).toString().padStart(2, '0')}-${cursorDate.getDate().toString().padStart(2, '0')}`;
        batchUpdates.push({ staffId, date: dStr, shift: ShiftType.Leave });
        cursorDate.setDate(cursorDate.getDate() + 1);
      }
      onUpdateBatch(batchUpdates);
      setActiveCell(null);
    }
  };

  useEffect(() => {
    if (keyboardCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [keyboardCell?.staffIndex, keyboardCell?.dayIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveCell(null);
      }
      if (gridContainerRef.current && !gridContainerRef.current.contains(event.target as Node)) {
        if (keyboardCell) {
          commitKeyboardCell(keyboardCell.staffIndex, keyboardCell.dayIndex, keyboardCell.inputValue);
          setKeyboardCell(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeCell, keyboardCell]);

  const stats = useMemo(() => {
    const visibleStaffIds = new Set(displayStaff.map(s => s.id));

    return allVisibleDays.map(dInfo => {
      const dayAssignments = assignments.filter(a => a.date === dInfo.dateStr && visibleStaffIds.has(a.staffId));
      const calculateShiftDetails = (type: '1' | '2' | '3') => {
        const matchingAssignments = dayAssignments.filter(a => {
          const assocStaff = displayStaff.find(s => s.id === a.staffId);
          if (!assocStaff || assocStaff.isCounterPart) return false;

          if (type === '1') return [ShiftType.Morning, ShiftType.RequestedMorning, ShiftType.MorningSpecial].includes(a.shift);
          if (type === '2') return [ShiftType.Evening, ShiftType.RequestedEvening].includes(a.shift);
          if (type === '3') return [ShiftType.Night, ShiftType.RequestedNight].includes(a.shift);
          return false;
        });
        const staffIds = matchingAssignments.map(a => a.staffId);
        const staffInShift = displayStaff.filter(s => staffIds.includes(s.id));
        return {
          total: matchingAssignments.length,
          seniors: staffInShift.filter(s => s.isSenior && !isHaStaff(s.name) && !isWsStaff(s)).length,
          males: staffInShift.filter(s => s.isMale && !isHaStaff(s.name) && !isWsStaff(s)).length,
          caringHours: staffInShift.filter(s => !s.isMale && s.hasCaringHours && !isHaStaff(s.name) && !isWsStaff(s)).length
        };
      };
      return {
        dateStr: dInfo.dateStr,
        isWeekend: dInfo.isWeekend,
        m: calculateShiftDetails('1'),
        e: calculateShiftDetails('2'),
        n: calculateShiftDetails('3'),
      };
    });
  }, [assignments, allVisibleDays, displayStaff]);

  const tableClasses = {
    Professional: "border-gray-200 shadow-md rounded-xl bg-white",
    Colorful: "border-emerald-200 shadow-xl rounded-2xl bg-white",
    Attractive: "border-white/50 shadow-2xl rounded-[2rem] border-2 bg-white/90",
    Day: "border-amber-100 shadow-xl rounded-3xl bg-white",
    Night: "border-slate-700/50 shadow-2xl rounded-xl bg-[#0d1117]"
  };

  const headerBg = {
    Professional: "bg-slate-50",
    Colorful: "bg-slate-50",
    Attractive: "bg-indigo-50/50",
    Day: "bg-amber-50/50",
    Night: "bg-[#161b22]"
  };

  const textPrimary = theme === 'Night' ? 'text-slate-300' : 'text-slate-900';

  const categoryLabels: Record<StaffCategoryFilter, string> = {
    ALL: 'All Staff',
    REGULAR: 'Regular Staff',
    WS: 'Ward Supervisor (WS)',
    HA: 'Medical Service Aid (MSA)',
    COUNTERPART: 'Counterpart (CP)',
    SENIOR: 'Seniors',
    JUNIOR: 'Juniors',
    MALE: 'Male Staff',
    FEMALE: 'Female Staff',
  };

  const categoryShortLabels: Record<StaffCategoryFilter, string> = {
    ALL: 'All',
    REGULAR: 'Regular',
    WS: 'WS Staff',
    HA: 'MSA Staff',
    COUNTERPART: 'Counterpart',
    SENIOR: 'Seniors',
    JUNIOR: 'Juniors',
    MALE: 'Male',
    FEMALE: 'Female',
  };

  const categoriesList: StaffCategoryFilter[] = [
    'ALL',
    'REGULAR',
    'WS',
    'HA',
    'COUNTERPART',
    'SENIOR',
    'JUNIOR',
    'MALE',
    'FEMALE',
  ];

  // Staff filtered inside the selector modal
  const modalStaffList = useMemo(() => {
    let list = staff;
    if (modalCategory !== 'ALL') {
      list = list.filter(s => matchesCategory(s, modalCategory));
    }
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
    return list;
  }, [staff, modalCategory, modalSearch]);

  return (
    <div ref={gridContainerRef} className="space-y-4 relative w-full">
      {/* Staff Category Filter & Entry Mode Controls Bar */}
      <div className={`p-3 rounded-xl border shadow-sm no-print space-y-2.5 transition-all ${
        theme === 'Night' ? 'bg-slate-900/80 border-slate-700 text-slate-200' :
        theme === 'Day' ? 'bg-amber-50/80 border-amber-200 text-amber-950' :
        theme === 'Colorful' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' :
        theme === 'Attractive' ? 'bg-indigo-50/40 border-indigo-100 text-indigo-950' :
        'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                theme === 'Night' ? 'bg-blue-900/50 text-cyan-400' : 'bg-blue-100 text-blue-700'
              }`}>
                <ICONS.Users size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider block">Staff Filter & Selection</span>
                  {!isAllSelected && (
                    <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                      {activeCategories.length} cat selected
                    </span>
                  )}
                  {selectedStaffIds.length > 0 && (
                    <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                      {selectedStaffIds.length} staff chosen
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 font-medium">
                  Showing {displayStaff.length} of {staff.length} personnel {viewSelectedOnly ? '(Selected Staff Only)' : isAllSelected ? '(All Staff)' : ''}
                </span>
              </div>
            </div>

            {/* Quick Reset All Categories button if filtered */}
            {!isAllSelected && (
              <button
                type="button"
                onClick={() => handleCategoryToggle('ALL')}
                className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 flex items-center gap-1"
                title="Reset filter to show all staff categories"
              >
                <span>Reset Categories</span>
              </button>
            )}

            {/* Match Mode Toggle (OR vs AND) when multiple categories are selected */}
            {activeCategories.length > 1 && !isAllSelected && (
              <div className="flex items-center gap-1 p-0.5 bg-gray-200/80 dark:bg-slate-800 rounded-lg border border-gray-300/80">
                <span className="text-[9px] font-black uppercase text-gray-500 px-1">Logic:</span>
                <button
                  type="button"
                  onClick={() => setMatchMode('OR')}
                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition ${
                    matchMode === 'OR' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                  }`}
                  title="Display staff members matching ANY of the selected categories (Union / OR)"
                >
                  ANY (OR)
                </button>
                <button
                  type="button"
                  onClick={() => setMatchMode('AND')}
                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition ${
                    matchMode === 'AND' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                  }`}
                  title="Display staff members matching ALL of the selected categories (Intersection / AND)"
                >
                  ALL (AND)
                </button>
              </div>
            )}

            {/* View Selected Staff Control Buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-gray-200/60 dark:bg-slate-800 rounded-lg border border-gray-300/60">
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(true)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition flex items-center gap-1.5 ${
                  selectedStaffIds.length > 0
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
                title="Select specific staff members to highlight or view"
              >
                <Users size={12} />
                <span>Select Staff</span>
                {selectedStaffIds.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-white/20 text-white text-[9px] font-black rounded-full">
                    {selectedStaffIds.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedStaffIds.length === 0) {
                    setIsStaffModalOpen(true);
                  } else {
                    setViewSelectedOnly(!viewSelectedOnly);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition flex items-center gap-1.5 ${
                  viewSelectedOnly && selectedStaffIds.length > 0
                    ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500'
                    : selectedStaffIds.length > 0
                    ? 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 font-black'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
                title={
                  selectedStaffIds.length === 0 
                    ? "Click to choose staff members to view in table grid" 
                    : viewSelectedOnly 
                    ? "Viewing only selected staff. Click to show all staff" 
                    : "Filter table grid to show only the selected staff"
                }
              >
                {viewSelectedOnly && selectedStaffIds.length > 0 ? (
                  <>
                    <Eye size={12} />
                    <span>Viewing Selected ({selectedStaffIds.length})</span>
                  </>
                ) : (
                  <>
                    <Eye size={12} />
                    <span>View Selected {selectedStaffIds.length > 0 ? `(${selectedStaffIds.length})` : ''}</span>
                  </>
                )}
              </button>

              {selectedStaffIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearStaffSelection}
                  className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-400 rounded-md transition"
                  title="Clear staff selection"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>

            {/* Entry Mode Selector (Manual Keyboard Typing vs Quick Picker) */}
            {!readOnly && (
              <div className="flex items-center gap-1 p-0.5 bg-gray-200/60 dark:bg-slate-800 rounded-lg border border-gray-300/60">
                <button
                  type="button"
                  onClick={() => { setEntryMode('KEYBOARD'); setActiveCell(null); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition flex items-center gap-1 ${
                    entryMode === 'KEYBOARD' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                  }`}
                  title="Type duty codes directly using keyboard (Enter / Right Arrow shifts to next cell)"
                >
                  <span>⌨️</span> Keyboard Mode
                </button>
                <button
                  type="button"
                  onClick={() => { setEntryMode('PICKER'); setKeyboardCell(null); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition flex items-center gap-1 ${
                    entryMode === 'PICKER' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                  }`}
                  title="Click cells to open shift selection popup menu"
                >
                  <span>🎯</span> Popup Picker
                </button>
              </div>
            )}
          </div>

          {/* Quick Search & Select */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-48">
              <input
                type="text"
                placeholder="Search name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-7 pr-2.5 py-1 text-xs font-bold rounded-lg border outline-none transition-colors ${
                  theme === 'Night' 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-cyan-400' 
                    : 'bg-white border-gray-200 text-gray-800 focus:border-blue-500'
                }`}
              />
              <span className="absolute left-2 top-1.5 text-gray-400">
                <ICONS.Users size={12} />
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-gray-400 hover:text-red-500 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile / Compact Multi-Select Helper Dropdown */}
            <select
              value={isAllSelected ? 'ALL' : activeCategories[0] || 'ALL'}
              onChange={(e) => {
                const val = e.target.value as StaffCategoryFilter;
                handleCategoryToggle(val);
              }}
              className={`lg:hidden text-xs font-bold py-1 px-2 rounded-lg border outline-none ${
                theme === 'Night' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-800'
              }`}
            >
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' 
                    ? `Show All Staff (${categoryCounts.ALL})` 
                    : `${activeCategories.includes(cat) ? '✓ ' : ''}${categoryLabels[cat]} (${categoryCounts[cat]})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-Select Category Pill Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-gray-200/40">
          <span className="text-[10px] font-black uppercase text-gray-400 self-center mr-1 hidden sm:inline">
            Select Categories:
          </span>
          {categoriesList.map(cat => {
            const isSelected = cat === 'ALL' ? isAllSelected : activeCategories.includes(cat);
            const count = categoryCounts[cat];

            let activeStyle = 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600';
            let inactiveStyle = theme === 'Night'
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              : 'bg-white text-slate-700 hover:bg-gray-100 border border-gray-200';

            if (isSelected && cat !== 'ALL') {
              if (cat === 'WS') activeStyle = 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500';
              else if (cat === 'HA') activeStyle = 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500';
              else if (cat === 'COUNTERPART') activeStyle = 'bg-violet-600 text-white shadow-sm ring-2 ring-violet-500';
              else if (cat === 'SENIOR') activeStyle = 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500';
              else if (cat === 'JUNIOR') activeStyle = 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-500';
              else if (cat === 'MALE') activeStyle = 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-600';
              else if (cat === 'FEMALE') activeStyle = 'bg-fuchsia-600 text-white shadow-sm ring-2 ring-fuchsia-500';
            }

            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryToggle(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-tight transition-all flex items-center gap-1.5 select-none ${
                  isSelected ? activeStyle : inactiveStyle
                }`}
              >
                {isSelected && cat !== 'ALL' && <span className="text-[10px] font-extrabold">✓</span>}
                <span>{categoryShortLabels[cat]}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                  isSelected 
                    ? 'bg-white/20 text-white' 
                    : theme === 'Night' ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Banner when viewing selected staff only */}
      {viewSelectedOnly && selectedStaffIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-900 dark:text-emerald-200 shadow-sm no-print">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
              <Eye size={15} />
            </span>
            <div>
              <p className="text-xs font-black">
                Filtered View: Showing {displayStaff.length} Selected Personnel ({selectedStaffIds.length} Staff Selected • {staff.length} Total in Ward)
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                Only the chosen staff members are displayed in the grid below. You can edit shifts, print, or modify selection.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsStaffModalOpen(true)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-100/50 border border-emerald-400 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5"
            >
              <Users size={13} />
              Modify Selection ({selectedStaffIds.length})
            </button>
            <button
              type="button"
              onClick={() => setViewSelectedOnly(false)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5"
            >
              <EyeOff size={13} />
              Show All Staff ({staff.length})
            </button>
          </div>
        </div>
      )}

      <div className={`overflow-x-auto border w-full transition-all duration-700 ${tableClasses[theme]}`}>
        <table className="shift-grid-table w-full text-[9px] border-collapse table-fixed select-none print:text-[7px]">
          <thead>
            <tr className={`${headerBg[theme]} border-b border-gray-200/20 print:bg-slate-100`}>
              <th className={`sticky left-0 ${headerBg[theme]} z-30 p-2 border-r border-gray-200/20 w-36 sm:w-44 font-black text-slate-500 uppercase tracking-tighter text-left print:static print:w-24 print-header-personnel`}>
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={displayStaff.length > 0 && displayStaff.every(s => selectedStaffIds.includes(s.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allIds = new Set([...selectedStaffIds, ...displayStaff.map(s => s.id)]);
                          setSelectedStaffIds(Array.from(allIds));
                        } else {
                          const visibleIds = new Set(displayStaff.map(s => s.id));
                          setSelectedStaffIds(selectedStaffIds.filter(id => !visibleIds.has(id)));
                        }
                      }}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer print:hidden"
                      title="Select / Deselect all visible staff members"
                    />
                    <span>Personnel</span>
                  </div>
                  {!isAllSelected && (
                    <span className="text-[7px] text-blue-600 font-extrabold bg-blue-50 px-1 py-0.5 rounded uppercase truncate max-w-[70px]" title={activeCategories.map(c => categoryShortLabels[c]).join(', ')}>
                      {activeCategories.length === 1 
                        ? categoryShortLabels[activeCategories[0]] 
                        : `${activeCategories.length} Cats`}
                    </span>
                  )}
                </div>
              </th>
              {allVisibleDays.map((d, idx) => {
                const isHoliday = config.holidays?.includes(d.dateStr);
                return (
                  <th 
                    key={d.dateStr} 
                    className={`p-1 border-r border-gray-200/20 min-w-[24px] text-center relative print-header-day
                      ${isHoliday ? (theme === 'Night' ? 'bg-rose-950/30' : 'bg-rose-50/80') : d.isWeekend ? (theme === 'Night' ? 'bg-amber-950/20' : 'bg-amber-50') : ''}
                      ${d.isContext ? (theme === 'Night' ? 'bg-slate-800/50' : 'bg-slate-100/50') : ''} 
                      ${!hideContextDays && idx === contextDays.length - 1 ? (theme === 'Night' ? 'border-r-2 border-r-slate-600' : 'border-r-2 border-r-gray-400') : ''}`}
                    title={isHoliday ? "Public Holiday" : d.isWeekend ? "Weekend" : "Weekday"}
                  >
                    <div className={`font-black ${d.isContext ? 'text-gray-400' : textPrimary} ${isHoliday ? 'text-rose-600' : d.isWeekend ? 'text-amber-600' : ''}`}>
                      {d.day}
                      {isHoliday && <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-rose-500 rounded-full" />}
                    </div>
                    <div className={`text-[5px] font-bold uppercase print:text-[4px] ${isHoliday ? 'text-rose-500' : d.isWeekend ? 'text-amber-500' : 'text-gray-400'}`}>{getDayName(d.year, d.month, d.day)}</div>
                  </th>
                );
              })}
              <th className={`p-1 border-r border-gray-200/20 ${theme === 'Night' ? 'bg-emerald-950/30' : 'bg-emerald-100'} font-black w-6 text-emerald-600`}>M</th>
              <th className={`p-1 border-r border-gray-200/20 ${theme === 'Night' ? 'bg-blue-950/30' : 'bg-blue-100'} font-black w-6 text-blue-600`}>E</th>
              <th className={`p-1 border-r border-gray-200/20 ${theme === 'Night' ? 'bg-indigo-950/30' : 'bg-indigo-100'} font-black w-6 text-indigo-400`}>N</th>
              <th className={`p-1 border-r border-gray-200/20 ${theme === 'Night' ? 'bg-slate-800' : 'bg-gray-200'} font-black w-6 text-gray-500`}>W</th>
              <th className={`p-1 border-r border-gray-200/20 ${theme === 'Night' ? 'bg-amber-950/30' : 'bg-amber-100'} font-black w-6 text-amber-600`}>P</th>
              <th className={`p-1 border-r border-gray-200/20 ${theme === 'Night' ? 'bg-red-950/30' : 'bg-red-100'} font-black w-6 text-red-500`}>L</th>
              <th className={`p-1 ${theme === 'Night' ? 'bg-purple-950/30' : 'bg-purple-100'} font-black w-6 text-purple-600`} title="Other Leave (O)">O</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'Night' ? 'divide-slate-800' : 'divide-gray-100'}`}>
            {displayStaff.map((member, sIdx) => {
              const totals = getStaffTotals(member.id);
              const isCP = member.isCounterPart;
              const isSelected = selectedStaffIds.includes(member.id);
              return (
                <tr key={member.id} className={`group transition-colors ${
                  isSelected
                    ? (theme === 'Night' ? 'bg-cyan-950/30' : 'bg-blue-50/50')
                    : isCP ? (theme === 'Night' ? 'bg-violet-950/10 hover:bg-violet-950/20' : 'bg-violet-50/20 hover:bg-violet-50/35')
                    : theme === 'Attractive' ? 'hover:bg-indigo-50/30'
                    : theme === 'Night' ? 'hover:bg-slate-800/40'
                    : 'hover:bg-blue-50/20'
                }`}>
                  <td className={`sticky left-0 ${
                    isSelected ? (theme === 'Night' ? 'bg-[#122233]' : 'bg-blue-50/90') :
                    isCP ? (theme === 'Night' ? 'bg-[#121620]' : 'bg-violet-50/50') : 
                    (theme === 'Night' ? 'bg-[#0d1117]' : 'bg-white')
                  } z-10 p-2 border-r border-gray-200/20 font-black truncate text-[9px] print:static print:text-[7px] print-cell-personnel`}>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleStaffSelection(member.id);
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 print:hidden"
                        title={isSelected ? `Deselect ${member.name}` : `Select ${member.name} to view`}
                      />
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0 print:hidden" />
                      ) : null}
                      <div className="flex items-center gap-1 truncate">
                        <span className="text-slate-400 font-mono text-[8px] print:hidden">{member.id}</span>
                        {(() => {
                          const isHa = member.name.trim().startsWith('HA') || member.name.trim().startsWith('(HA)') || member.name.trim().startsWith('MSA') || member.name.trim().startsWith('(MSA)') || !!member.isHa;
                          const isWs = member.isWardSupervisor || member.name.trim().startsWith('WS') || member.name.trim().startsWith('(WS)');
                          return (
                            <span 
                              title={member.jobTitle ? `${member.name} (${member.jobTitle})` : undefined}
                              className={`truncate ${isWs ? 'text-amber-700 font-black' : isHa ? (theme === 'Night' ? 'text-emerald-400 font-bold' : 'text-emerald-800 font-black') : (theme === 'Night' ? 'text-slate-300' : 'text-slate-700')}`}
                            >
                              {member.name || 'UNNAMED'}
                              {isCP && <span className="text-[7px] text-violet-500 font-black ml-1 uppercase tracking-tighter" title="Counterpart Staff">(CP)</span>}
                              {isWs && <span className="text-[7px] text-amber-600 font-black ml-1 uppercase tracking-tighter" title="Ward Supervisor">(WS)</span>}
                              {isHa && <span className="text-[7px] text-emerald-600 font-black ml-1 uppercase tracking-tighter" title="Medical Service Aid">(MSA)</span>}
                              {!member.isMale && member.hasCaringHours && <span className="text-[7px] text-pink-500 font-extrabold ml-1 uppercase tracking-tighter" title="Female Staff with Caring Hours">(CH)</span>}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  {allVisibleDays.map((d, dIdx) => {
                    const shift = getShift(member.id, d.dateStr);
                    const details = SHIFT_DETAILS[shift];
                    const isActivePicker = activeCell?.staffId === member.id && activeCell?.dateStr === d.dateStr;
                    const isKeyboardEditing = entryMode === 'KEYBOARD' && keyboardCell?.staffIndex === sIdx && keyboardCell?.dayIndex === dIdx;
                    const isRequested = shift.startsWith('R');
                    let displayValue: string = shift;
                    if (shift === ShiftType.RequestedMorning) displayValue = '1';
                    else if (shift === ShiftType.RequestedEvening) displayValue = '2';
                    else if (shift === ShiftType.RequestedNight) displayValue = '3';
                    else if (shift === ShiftType.RequestedOff) displayValue = 'W';

                    // Check sequence rules against previous day
                    const prevDayInfo = dIdx > 0 ? allVisibleDays[dIdx - 1] : null;
                    const prevShift = prevDayInfo ? getShift(member.id, prevDayInfo.dateStr) : ShiftType.None;
                    const seqVal = validateShiftSequence(prevShift, shift);
                    const isSeqInvalid = !seqVal.isValid;

                    if (isKeyboardEditing && !readOnly && !isCP) {
                      return (
                        <td 
                          key={d.dateStr} 
                          className="p-0 border-r border-blue-400 text-center h-8 print:h-6 bg-blue-100 ring-2 ring-blue-600 z-30 relative shadow-md min-w-[28px]"
                        >
                          <input
                            ref={inputRef}
                            type="text"
                            value={keyboardCell.inputValue}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setKeyboardCell(prev => prev ? { ...prev, inputValue: val } : null);
                            }}
                            onKeyDown={(e) => handleInputKeyDown(e, sIdx, dIdx)}
                            onBlur={() => {
                              commitKeyboardCell(sIdx, dIdx, keyboardCell.inputValue);
                            }}
                            className="w-full h-full text-center font-black text-[11px] bg-white text-blue-900 border-none outline-none p-0 uppercase"
                          />
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={d.dateStr} 
                        onClick={(e) => handleCellClick(e, member, sIdx, d.dateStr, dIdx)}
                        className={`p-1 border-r border-gray-200/10 text-center transition-all h-8 print:h-6 shift-cell-${shift} relative
                          ${details.bg} ${details.color} font-black text-[10px] print:text-[8px]
                          ${isActivePicker ? 'ring-2 ring-blue-500 z-20 relative scale-110 shadow-xl' : ''}
                          ${isRequested ? 'ring-2 ring-red-500 ring-inset print:ring-0' : ''}
                          ${isSeqInvalid ? 'ring-2 ring-rose-500 ring-inset bg-rose-500/20 font-extrabold print:ring-0' : ''}
                          ${d.isContext ? 'opacity-30 grayscale' : ''}
                          ${!hideContextDays && dIdx === contextDays.length - 1 ? (theme === 'Night' ? 'border-r-2 border-r-slate-600' : 'border-r-2 border-r-gray-400') : ''}
                          ${isCP ? 'cursor-not-allowed opacity-90' : readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        title={isSeqInvalid ? `⚠ Sequence Violation: ${seqVal.message}` : (isCP ? "Counterpart Duty (Mirrored)" : (readOnly ? "Protected Roster (View-Only) • Duty rota editing is authorized solely for Nurse Supervisors (NS)" : undefined))}
                      >
                        <div className="flex items-center justify-center relative w-full h-full">
                          {shift === ShiftType.None ? '·' : displayValue}
                          {isSeqInvalid && (
                            <span 
                              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[7px] font-black shadow-xs print:hidden animate-pulse" 
                              title={`Sequence Violation: ${seqVal.message}`}
                            >
                              !
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className={`p-1 border-r border-gray-200/20 text-center ${theme === 'Night' ? 'bg-emerald-950/20 text-emerald-400' : 'bg-emerald-50 text-emerald-900'} font-black`}>{totals.morning}</td>
                  <td className={`p-1 border-r border-gray-200/20 text-center ${theme === 'Night' ? 'bg-blue-950/20 text-blue-400' : 'bg-blue-50 text-blue-900'} font-black`}>{totals.evening}</td>
                  <td className={`p-1 border-r border-gray-200/20 text-center ${theme === 'Night' ? 'bg-indigo-950/20 text-indigo-400' : 'bg-indigo-50 text-indigo-900'} font-black`}>{totals.night}</td>
                  <td className={`p-1 border-r border-gray-200/20 text-center ${theme === 'Night' ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-900'} font-black`}>{totals.off}</td>
                  <td className={`p-1 border-r border-gray-200/20 text-center ${theme === 'Night' ? 'bg-amber-950/20 text-amber-400' : 'bg-amber-50 text-amber-900'} font-black`}>{totals.compLeave}</td>
                  <td className={`p-1 border-r border-gray-200/20 text-center ${theme === 'Night' ? 'bg-red-950/20 text-red-400' : 'bg-red-50 text-red-900'} font-black`}>{totals.leave}</td>
                  <td className={`p-1 text-center ${theme === 'Night' ? 'bg-purple-950/20 text-purple-400' : 'bg-purple-50 text-purple-900'} font-black`}>{totals.otherLeave}</td>
                </tr>
              );
            })}

            {displayStaff.length === 0 && (
              <tr>
                <td colSpan={allVisibleDays.length + 8} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ICONS.Users size={28} className="text-gray-300" />
                    <p className="font-bold text-sm">
                      No staff members match the selected category filter ({
                        isAllSelected 
                          ? 'All Categories' 
                          : activeCategories.map(c => categoryLabels[c]).join(', ')
                      }).
                    </p>
                    <button
                      onClick={() => {
                        handleCategoryToggle('ALL');
                        setSearchQuery('');
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                    >
                      Show All Staff
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className={`border-t-2 ${theme === 'Night' ? 'border-slate-700' : 'border-slate-400'}`}>
             {/* Detailed Morning Shift Totals */}
             <tr className={`${SHIFT_DETAILS[ShiftType.Morning].bg} text-white print-total-row-M`}>
                <td className={`sticky left-0 ${theme === 'Night' ? 'bg-slate-900' : 'bg-black/10'} z-10 p-1 border-r border-white/20 font-black text-[7px] uppercase print:static print-header-personnel`}>
                  {isAllSelected 
                    ? 'Morning Total' 
                    : activeCategories.length === 1 
                      ? `${categoryShortLabels[activeCategories[0]]} Morning Total` 
                      : `Morning Total (${activeCategories.map(c => categoryShortLabels[c]).join('+')})`}
                </td>
                {stats.map((s, idx) => {
                  const isHoliday = config.holidays?.includes(s.dateStr);
                  const targetMin = isHoliday ? (config.minMorningHoliday ?? config.minMorning) : s.isWeekend ? (config.minMorningWeekend ?? config.minMorning) : config.minMorning;
                  const isShort = isAllSelected && s.m.total < targetMin;
                  return (
                    <td key={idx} className={`text-center font-black text-[11px] ${!hideContextDays && idx === contextDays.length - 1 ? 'border-r-2 border-r-white/30' : 'border-r border-white/20'} ${isShort ? 'text-red-300 animate-pulse font-extrabold' : 'text-white'}`} title={isHoliday ? `Holiday Min Requirement: ${targetMin}` : s.isWeekend ? `Weekend Min Requirement: ${targetMin}` : `Weekday Min Requirement: ${targetMin}`}>
                      {s.m.total}
                    </td>
                  );
                })}
                <td colSpan={7} className="bg-black/20"></td>
             </tr>
             <tr className={`${theme === 'Night' ? 'bg-[#0d1117] text-slate-400' : 'bg-slate-50 text-slate-900'}`}>
                <td className={`sticky left-0 ${theme === 'Night' ? 'bg-slate-800' : 'bg-slate-100'} z-10 p-1 border-r border-gray-200/10 font-black text-[6px] uppercase print:static print-header-personnel`}>M Seniors/Males/CH</td>
                {stats.map((s, idx) => (
                  <td key={idx} className={`text-center text-[6.5px] font-bold ${s.isWeekend ? (theme === 'Night' ? 'bg-amber-950/10' : 'bg-amber-50/40') : ''} ${!hideContextDays && idx === contextDays.length - 1 ? (theme === 'Night' ? 'border-r-2 border-r-slate-600' : 'border-r-2 border-r-gray-400') : 'border-r border-gray-200/10'}`}>
                    <span className={s.m.seniors < config.minSenior ? (theme === 'Night' ? 'text-rose-400' : 'text-red-600') : ''}>S{s.m.seniors}</span>
                    <span className="mx-0.5 opacity-30">/</span>
                    <span className={s.m.males > config.maxMale ? (theme === 'Night' ? 'text-rose-400 font-black' : 'text-red-600 font-black') : ''}>M{s.m.males}</span>
                    {s.m.caringHours > 0 && (
                      <>
                        <span className="mx-0.5 opacity-30">/</span>
                        <span className={s.m.caringHours > (config.maxCaringHoursPerShift ?? 2) ? (theme === 'Night' ? 'text-pink-400 font-black ring-1 ring-pink-500' : 'text-pink-600 font-black bg-pink-100 px-0.5 rounded') : 'text-pink-500 font-bold'}>C{s.m.caringHours}</span>
                      </>
                    )}
                  </td>
                ))}
                <td colSpan={7}></td>
             </tr>

             {/* Detailed Evening Shift Totals */}
             <tr className={`${SHIFT_DETAILS[ShiftType.Evening].bg} text-white print-total-row-E`}>
                <td className={`sticky left-0 ${theme === 'Night' ? 'bg-slate-900' : 'bg-black/10'} z-10 p-1 border-r border-white/20 font-black text-[7px] uppercase print:static print-header-personnel`}>
                  {isAllSelected 
                    ? 'Evening Total' 
                    : activeCategories.length === 1 
                      ? `${categoryShortLabels[activeCategories[0]]} Evening Total` 
                      : `Evening Total (${activeCategories.map(c => categoryShortLabels[c]).join('+')})`}
                </td>
                {stats.map((s, idx) => {
                  const isHoliday = config.holidays?.includes(s.dateStr);
                  const targetMin = isHoliday ? (config.minEveningHoliday ?? config.minEvening) : s.isWeekend ? (config.minEveningWeekend ?? config.minEvening) : config.minEvening;
                  const isShort = isAllSelected && s.e.total < targetMin;
                  return (
                    <td key={idx} className={`text-center font-black text-[11px] ${!hideContextDays && idx === contextDays.length - 1 ? 'border-r-2 border-r-white/30' : 'border-r border-white/20'} ${isShort ? 'text-red-300 animate-pulse font-extrabold' : 'text-white'}`} title={isHoliday ? `Holiday Min Requirement: ${targetMin}` : s.isWeekend ? `Weekend Min Requirement: ${targetMin}` : `Weekday Min Requirement: ${targetMin}`}>
                      {s.e.total}
                    </td>
                  );
                })}
                <td colSpan={7} className="bg-black/20"></td>
             </tr>
             <tr className={`${theme === 'Night' ? 'bg-[#0d1117] text-slate-400' : 'bg-slate-50 text-slate-900'}`}>
                <td className={`sticky left-0 ${theme === 'Night' ? 'bg-slate-800' : 'bg-slate-100'} z-10 p-1 border-r border-gray-200/10 font-black text-[6px] uppercase print:static print-header-personnel`}>E Seniors/Males/CH</td>
                {stats.map((s, idx) => (
                  <td key={idx} className={`text-center text-[6.5px] font-bold ${s.isWeekend ? (theme === 'Night' ? 'bg-amber-950/10' : 'bg-amber-50/40') : ''} ${!hideContextDays && idx === contextDays.length - 1 ? (theme === 'Night' ? 'border-r-2 border-r-slate-600' : 'border-r-2 border-r-gray-400') : 'border-r border-gray-200/10'}`}>
                    <span className={s.e.seniors < config.minSenior ? (theme === 'Night' ? 'text-rose-400' : 'text-red-600') : ''}>S{s.e.seniors}</span>
                    <span className="mx-0.5 opacity-30">/</span>
                    <span className={s.e.males > config.maxMale ? (theme === 'Night' ? 'text-rose-400 font-black' : 'text-red-600 font-black') : ''}>M{s.e.males}</span>
                    {s.e.caringHours > 0 && (
                      <>
                        <span className="mx-0.5 opacity-30">/</span>
                        <span className={s.e.caringHours > (config.maxCaringHoursPerShift ?? 2) ? (theme === 'Night' ? 'text-pink-400 font-black ring-1 ring-pink-500' : 'text-pink-600 font-black bg-pink-100 px-0.5 rounded') : 'text-pink-500 font-bold'}>C{s.e.caringHours}</span>
                      </>
                    )}
                  </td>
                ))}
                <td colSpan={7}></td>
             </tr>

             {/* Detailed Night Shift Totals */}
             <tr className={`${SHIFT_DETAILS[ShiftType.Night].bg} text-white print-total-row-N`}>
                <td className={`sticky left-0 ${theme === 'Night' ? 'bg-[#0d1117]' : 'bg-black/10'} z-10 p-1 border-r border-white/20 font-black text-[7px] uppercase print:static print-header-personnel`}>
                  {isAllSelected 
                    ? 'Night Total' 
                    : activeCategories.length === 1 
                      ? `${categoryShortLabels[activeCategories[0]]} Night Total` 
                      : `Night Total (${activeCategories.map(c => categoryShortLabels[c]).join('+')})`}
                </td>
                {stats.map((s, idx) => {
                  const isHoliday = config.holidays?.includes(s.dateStr);
                  const targetMin = isHoliday ? (config.minNightHoliday ?? config.minNight) : s.isWeekend ? (config.minNightWeekend ?? config.minNight) : config.minNight;
                  const isShort = isAllSelected && s.n.total < targetMin;
                  return (
                    <td key={idx} className={`text-center font-black text-[11px] ${!hideContextDays && idx === contextDays.length - 1 ? 'border-r-2 border-r-white/30' : 'border-r border-white/20'} ${isShort ? 'text-red-300 animate-pulse font-extrabold' : 'text-white'}`} title={isHoliday ? `Holiday Min Requirement: ${targetMin}` : s.isWeekend ? `Weekend Min Requirement: ${targetMin}` : `Weekday Min Requirement: ${targetMin}`}>
                      {s.n.total}
                    </td>
                  );
                })}
                <td colSpan={7} className="bg-black/20"></td>
             </tr>
             <tr className={`${theme === 'Night' ? 'bg-[#0d1117] text-slate-400' : 'bg-slate-50 text-slate-900'}`}>
                <td className={`sticky left-0 ${theme === 'Night' ? 'bg-slate-800' : 'bg-slate-100'} z-10 p-1 border-r border-gray-200/10 font-black text-[6px] uppercase print:static print-header-personnel`}>N Seniors/Males/CH</td>
                {stats.map((s, idx) => (
                  <td key={idx} className={`text-center text-[6.5px] font-bold ${s.isWeekend ? (theme === 'Night' ? 'bg-amber-950/10' : 'bg-amber-50/40') : ''} ${!hideContextDays && idx === contextDays.length - 1 ? (theme === 'Night' ? 'border-r-2 border-r-slate-600' : 'border-r-2 border-r-gray-400') : 'border-r border-gray-200/10'}`}>
                    <span className={s.n.seniors < config.minSenior ? (theme === 'Night' ? 'text-rose-400' : 'text-red-600') : ''}>S{s.n.seniors}</span>
                    <span className="mx-0.5 opacity-30">/</span>
                    <span className={s.n.males > config.maxMale ? (theme === 'Night' ? 'text-rose-400 font-black' : 'text-red-600 font-black') : ''}>M{s.n.males}</span>
                    {s.n.caringHours > 0 && (
                      <>
                        <span className="mx-0.5 opacity-30">/</span>
                        <span className={s.n.caringHours > (config.maxCaringHoursPerShift ?? 2) ? (theme === 'Night' ? 'text-pink-400 font-black ring-1 ring-pink-500' : 'text-pink-600 font-black bg-pink-100 px-0.5 rounded') : 'text-pink-500 font-bold'}>C{s.n.caringHours}</span>
                      </>
                    )}
                  </td>
                ))}
                <td colSpan={7}></td>
             </tr>
          </tfoot>
        </table>
      </div>

      {activeCell && !readOnly && (
        <div 
          ref={menuRef}
          className={`fixed z-[9999] border rounded-xl shadow-2xl p-2 w-52 animate-in fade-in zoom-in duration-100 no-print ${
            theme === 'Night' ? 'bg-[#1c2128] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
          style={{ 
            top: activeCell.shouldFlip ? 'auto' : `${activeCell.viewportY + 6}px`,
            bottom: activeCell.shouldFlip ? `${window.innerHeight - activeCell.viewportY + 6}px` : 'auto',
            left: `${Math.min(activeCell.viewportX, window.innerWidth - 220)}px` 
          }}
        >
          <div className="flex items-center justify-between mb-2 border-b border-gray-50/10 pb-1">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{activeCell.staffId} | {activeCell.dateStr}</span>
            <button onClick={() => setActiveCell(null)} className="text-slate-300 hover:text-red-500">✕</button>
          </div>
          <div className="grid grid-cols-4 gap-1 mb-2">
            {(Object.keys(SHIFT_DETAILS) as ShiftType[]).map(st => {
              const details = SHIFT_DETAILS[st];
              return (
                <button
                  key={st}
                  onClick={() => handleSelectShift(st)}
                  className={`flex flex-col items-center justify-center py-1.5 rounded border border-black/5 shadow-sm transition-all active:scale-95 ${details.bg} ${details.color}`}
                >
                  <span className="text-[9px] font-black">{st === ShiftType.None ? '-' : st}</span>
                </button>
              );
            })}
          </div>
          <button onClick={handle15DayLeave} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-600 text-white font-black text-[8px] hover:bg-red-700 transition shadow-sm uppercase">
            <ICONS.Sparkles size={10} /> 15-Day Leave Block
          </button>
        </div>
      )}

      {/* Staff Selection Modal Dialog */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print animate-in fade-in duration-150">
          <div 
            className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
              theme === 'Night' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              theme === 'Night' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight">Select Staff to View in Table Grid</h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Choose individual staff members to isolate or highlight in the roster grid
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  selectedStaffIds.length > 0
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : theme === 'Night' ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {selectedStaffIds.length} of {staff.length} Selected
                </span>
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Controls: Search & Category Filter */}
            <div className="p-4 border-b space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search personnel by name or ID..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className={`w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl border outline-none transition ${
                      theme === 'Night'
                        ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-600 focus:bg-white'
                    }`}
                  />
                  {modalSearch && (
                    <button
                      onClick={() => setModalSearch('')}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-red-500 font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Bulk Action Buttons */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const allShownIds = modalStaffList.map(s => s.id);
                      const union = new Set([...selectedStaffIds, ...allShownIds]);
                      setSelectedStaffIds(Array.from(union));
                    }}
                    className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-extrabold transition flex items-center gap-1"
                  >
                    <Check size={13} />
                    Select Shown ({modalStaffList.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleInvertStaffSelection}
                    className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold transition"
                  >
                    Invert
                  </button>
                  {selectedStaffIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearStaffSelection}
                      className="px-2.5 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      Clear ({selectedStaffIds.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {categoriesList.map(cat => {
                  const isCatActive = modalCategory === cat;
                  const count = categoryCounts[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setModalCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition flex items-center gap-1 ${
                        isCatActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : theme === 'Night' ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{categoryShortLabels[cat]}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded-full ${
                        isCatActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Staff Grid */}
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
              {modalStaffList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 space-y-2">
                  <Users size={32} className="mx-auto opacity-30" />
                  <p className="text-xs font-bold">No personnel matched your search or category filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {modalStaffList.map(member => {
                    const isSelected = selectedStaffIds.includes(member.id);
                    const isWs = member.isWardSupervisor || member.name.trim().startsWith('WS') || member.name.trim().startsWith('(WS)');
                    const isHa = member.name.trim().startsWith('HA') || member.name.trim().startsWith('(HA)') || member.name.trim().startsWith('MSA') || member.name.trim().startsWith('(MSA)') || !!member.isHa;
                    const isCP = member.isCounterPart;

                    return (
                      <div
                        key={member.id}
                        onClick={() => toggleStaffSelection(member.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                            : theme === 'Night'
                            ? 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by container onClick
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isWs ? 'bg-amber-100 text-amber-800' :
                              isHa ? 'bg-emerald-100 text-emerald-800' :
                              isCP ? 'bg-violet-100 text-violet-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {member.name.charAt(0) || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black truncate">{member.name}</span>
                              <span className="text-[9px] font-mono text-gray-400">#{member.id}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500">
                              {isWs && <span className="text-amber-600 font-black">WS</span>}
                              {isHa && <span className="text-emerald-600 font-black">MSA</span>}
                              {isCP && <span className="text-violet-600 font-black">CP</span>}
                              {!isWs && !isHa && !isCP && <span>{member.isSenior ? 'Senior' : 'Junior'}</span>}
                              <span>• {member.isMale ? 'Male' : 'Female'}</span>
                              {!member.isMale && member.hasCaringHours && <span className="text-pink-600 font-bold">• Caring Hours</span>}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="p-1 bg-blue-600 text-white rounded-full flex items-center justify-center">
                              <Check size={12} />
                            </span>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`px-5 py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
              theme === 'Night' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-medium text-gray-500">
                {selectedStaffIds.length > 0 ? (
                  <span><strong>{selectedStaffIds.length}</strong> personnel selected for isolated view</span>
                ) : (
                  <span>No specific staff selected (Showing all ward personnel)</span>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setViewSelectedOnly(false);
                    setIsStaffModalOpen(false);
                  }}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  Show All Staff
                </button>
                <button
                  type="button"
                  disabled={selectedStaffIds.length === 0}
                  onClick={() => {
                    setViewSelectedOnly(true);
                    setIsStaffModalOpen(false);
                  }}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-1.5 ${
                    selectedStaffIds.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Eye size={14} />
                  <span>View Selected in Grid ({selectedStaffIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`p-4 rounded-xl border shadow-sm no-print transition-all duration-700 ${
        theme === 'Attractive' ? 'bg-white/50 backdrop-blur-md border-white rounded-3xl' : 
        theme === 'Night' ? 'bg-slate-800/40 border-slate-700/50 rounded-xl' :
        theme === 'Day' ? 'bg-amber-50/50 border-amber-100 rounded-3xl' :
        'bg-slate-50 border-gray-100'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-black text-slate-400 mb-2 text-[8px] uppercase tracking-widest flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme === 'Night' ? 'bg-cyan-400' : 'bg-blue-500'}`} />
              Shift Legend ({theme})
            </h4>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(Object.keys(SHIFT_DETAILS) as ShiftType[]).map((key) => {
                const details = SHIFT_DETAILS[key];
                return (
                  key !== ShiftType.None && (
                    <div key={key} className="flex items-center gap-2 text-[8px]">
                      <div className={`w-6 h-4 flex items-center justify-center rounded shadow-sm ${details.bg} ${details.color} font-black text-[7px] ${(key as string).startsWith('R') ? 'ring-1 ring-red-500 ring-inset' : ''}`}>
                        {(key as string).startsWith('R') ? (key === 'RW' ? 'W' : (key as string).charAt(1)) : key}
                      </div>
                      <span className={`${theme === 'Night' ? 'text-slate-400' : 'text-slate-600'} font-black uppercase`}>{details.label}</span>
                    </div>
                  )
                );
              })}
            </div>
          </div>

          {/* Sequence rules reminder badge */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 text-white border border-slate-700/80 text-[9px] font-mono space-y-1">
            <div className="flex items-center gap-1.5 font-sans font-bold text-slate-300 text-[10px]">
              <span className="p-0.5 bg-blue-500 text-white rounded text-[8px]">⚡</span>
              <span>Sequence Rules (Shift After Previous Day)</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-slate-300">
              <span>Morning (1): <strong className="text-blue-400 font-extrabold">W, L, O, P, 1</strong></span>
              <span>Evening (2): <strong className="text-purple-400 font-extrabold">W, L, O, P, 1, 2</strong></span>
              <span>Night (3): <strong className="text-indigo-400 font-extrabold">W, L, O, P, 1, 2, 3</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftGrid;
