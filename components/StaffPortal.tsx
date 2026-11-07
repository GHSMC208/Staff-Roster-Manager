import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Unlock,
  UserCheck, 
  LogOut, 
  Calendar as CalendarIcon, 
  Printer, 
  Download, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Sparkles,
  ShieldCheck,
  Send,
  FileText,
  ChevronRight,
  User,
  HeartHandshake,
  KeyRound,
  Table2,
  CreditCard,
  Image as ImageIcon
} from 'lucide-react';
import { StaffMember, RosterConfig, Assignment, ShiftType, ThemeType, UserAccount, DutyExchangeRequest, AppNotification } from '../types';
import { MONTHS, THEME_SHIFT_STYLES } from '../constants';
import { CardLayout } from './StaffCardsView';
import { StaffLicenseCardModal } from './StaffLicenseCardModal';

interface StaffPortalProps {
  staff: StaffMember[];
  config: RosterConfig;
  assignments: Assignment[];
  onUpdateAssignment: (staffId: string, date: string, shift: ShiftType) => void;
  appTheme?: ThemeType;
  loggedInStaffId?: string | null;
  onLogin?: (staffId: string) => void;
  onLogout?: () => void;
  onSwitchTab?: (tab: any) => void;
  onUpdateStaff?: (staffId: string, updates: Partial<StaffMember>) => void;

  currentUser?: UserAccount;
  exchangeRequests?: DutyExchangeRequest[];
  notifications?: AppNotification[];
  onRequestExchange?: (params: {
    requestor: StaffMember;
    target: StaffMember;
    type: 'swap' | 'transfer';
    requestorDate: string;
    requestorShift: ShiftType;
    targetDate?: string;
    targetShift?: ShiftType;
    reason?: string;
  }) => void;
  onPeerRespondExchange?: (requestId: string, accept: boolean, note?: string) => void;
  onWsRespondExchange?: (requestId: string, approve: boolean, note?: string) => void;
  onMarkNotificationRead?: (notificationId: string) => void;
  onClearNotifications?: () => void;
  onUpdateConfig?: (newConfig: RosterConfig) => void;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({
  staff,
  config,
  assignments,
  onUpdateAssignment,
  appTheme = 'Professional',
  loggedInStaffId,
  onLogin,
  onLogout,
  onSwitchTab,
  currentUser,
  exchangeRequests = [],
  notifications = [],
  onRequestExchange,
  onPeerRespondExchange,
  onWsRespondExchange,
  onMarkNotificationRead,
  onClearNotifications,
  onUpdateConfig,
  onUpdateStaff
}) => {
  // Local sign-in state
  const [inputEmail, setInputEmail] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'card' | 'schedule' | 'requests'>('card');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [cardColorMode, setCardColorMode] = useState<'ClassicRetro' | 'AppTheme'>('ClassicRetro');
  const [isLicenseCardModalOpen, setIsLicenseCardModalOpen] = useState<boolean>(false);

  // Shift Request Form state
  const [requestCategory, setRequestCategory] = useState<'next_month' | 'current_month_exchange'>('next_month');
  const [requestDates, setRequestDates] = useState<string[]>([]);
  const [requestSingleDate, setRequestSingleDate] = useState<string>('');
  const [requestShift, setRequestShift] = useState<ShiftType>(ShiftType.RequestedOff);
  const [requestNote, setRequestNote] = useState<string>('');
  const [requestSubmittedMsg, setRequestSubmittedMsg] = useState<string | null>(null);

  // Current Month Duty Exchange state
  const [exchangeMyDate, setExchangeMyDate] = useState<string>('');
  const [exchangeTargetStaffId, setExchangeTargetStaffId] = useState<string>('');
  const [exchangeType, setExchangeType] = useState<'swap' | 'transfer'>('swap');
  const [exchangeTargetDate, setExchangeTargetDate] = useState<string>('');
  const [exchangeReason, setExchangeReason] = useState<string>('');
  const [exchangeSubmittedMsg, setExchangeSubmittedMsg] = useState<string | null>(null);

  const [exchangeLogs, setExchangeLogs] = useState<Array<{
    id: string;
    date1: string;
    shift1: ShiftType;
    staff1Id: string;
    staff1Name: string;
    date2?: string;
    shift2?: ShiftType;
    staff2Id: string;
    staff2Name: string;
    type: 'swap' | 'transfer';
    reason?: string;
    timestamp: string;
  }>>([]);

  // Roster Month Selection & 5 Days Prior Rule state
  const [selectedViewPeriod, setSelectedViewPeriod] = useState<'current' | 'next'>('current');
  const [simulate5DaysPrior, setSimulate5DaysPrior] = useState<boolean>(false);

  // Date constants and math for current config month
  const monthIdx = useMemo(() => {
    const idx = MONTHS.indexOf(config.month);
    return idx === -1 ? 0 : idx;
  }, [config.month]);

  const daysInMonth = useMemo(() => {
    return new Date(config.year, monthIdx + 1, 0).getDate();
  }, [config.year, monthIdx]);

  const startDayOfWeek = useMemo(() => {
    return new Date(config.year, monthIdx, 1).getDay();
  }, [config.year, monthIdx]);

  // Calculate Next Month info
  const nextMonthInfo = useMemo(() => {
    const currentIdx = MONTHS.indexOf(config.month);
    const validIdx = currentIdx === -1 ? 11 : currentIdx;
    if (validIdx === 11) {
      return { month: 'January', year: config.year + 1, monthIdx: 0 };
    }
    return { month: MONTHS[validIdx + 1], year: config.year, monthIdx: validIdx + 1 };
  }, [config.month, config.year]);

  // Target month details (Exclusively Next Month for advance requests)
  const targetMonthDetails = useMemo(() => {
    const days = new Date(nextMonthInfo.year, nextMonthInfo.monthIdx + 1, 0).getDate();
    return {
      month: nextMonthInfo.month,
      year: nextMonthInfo.year,
      monthIdx: nextMonthInfo.monthIdx,
      daysInMonth: days
    };
  }, [nextMonthInfo]);

  // Specified Deployment Date & 5 Days Prior Rule calculations for regular staff and HAs
  const todayDay = useMemo(() => new Date().getDate(), []);
  const unlockDay = useMemo(() => Math.max(1, daysInMonth - 4), [daysInMonth]); // Day 27 for 31-day month, Day 26 for 30-day month
  const is5DaysPriorReached = useMemo(() => todayDay >= unlockDay, [todayDay, unlockDay]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const specifiedDeployDate = useMemo(() => {
    if (config.nextMonthDeployDate) return config.nextMonthDeployDate;
    const mStr = (monthIdx + 1).toString().padStart(2, '0');
    return `${config.year}-${mStr}-25`;
  }, [config.nextMonthDeployDate, config.year, monthIdx]);

  const isDeployDateReached = useMemo(() => todayStr >= specifiedDeployDate, [todayStr, specifiedDeployDate]);

  const nextMonthPrefix = useMemo(() => `${nextMonthInfo.year}-${(nextMonthInfo.monthIdx + 1).toString().padStart(2, '0')}-`, [nextMonthInfo]);
  const isNextMonthGenerated = useMemo(() => assignments.some(a => a.date.startsWith(nextMonthPrefix)), [assignments, nextMonthPrefix]);

  const isNextMonthUnlocked = useMemo(() => {
    return !!(
      config.isNextMonthDeployed || 
      isDeployDateReached || 
      is5DaysPriorReached || 
      simulate5DaysPrior || 
      currentUser?.role === 'admin' || 
      currentUser?.role === 'ward_supervisor'
    );
  }, [config.isNextMonthDeployed, isDeployDateReached, is5DaysPriorReached, simulate5DaysPrior, currentUser]);

  // Active display month metadata (Current Month vs Next Month if unlocked)
  const activeDisplayMonthInfo = useMemo(() => {
    if (selectedViewPeriod === 'next' && isNextMonthUnlocked) {
      return {
        month: nextMonthInfo.month,
        year: nextMonthInfo.year,
        monthIdx: nextMonthInfo.monthIdx,
        daysInMonth: targetMonthDetails.daysInMonth,
        startDayOfWeek: new Date(nextMonthInfo.year, nextMonthInfo.monthIdx, 1).getDay(),
        isNextMonth: true
      };
    }
    return {
      month: config.month,
      year: config.year,
      monthIdx: monthIdx,
      daysInMonth: daysInMonth,
      startDayOfWeek: startDayOfWeek,
      isNextMonth: false
    };
  }, [selectedViewPeriod, isNextMonthUnlocked, nextMonthInfo, targetMonthDetails, config.month, config.year, monthIdx, daysInMonth, startDayOfWeek]);

  const activeConfig: RosterConfig = useMemo(() => ({
    ...config,
    month: activeDisplayMonthInfo.month,
    year: activeDisplayMonthInfo.year
  }), [config, activeDisplayMonthInfo]);

  // Day expansion state for "Who's working with me"
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Selected staff object if logged in
  const currentStaff = useMemo(() => {
    return staff.find(s => s.id === loggedInStaffId) || null;
  }, [staff, loggedInStaffId]);

  // Handle email sign in submission
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const cleanEmail = inputEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setAuthError('Please enter your hospital email address.');
      return;
    }

    const matchedStaff = staff.find(s => s.email && s.email.trim().toLowerCase() === cleanEmail);

    if (matchedStaff) {
      if (onLogin) {
        onLogin(matchedStaff.id);
      }
      setInputEmail('');
      setInputPin('');
      setAuthError(null);
    } else {
      setAuthError(`No staff member found with email "${cleanEmail}". Please check your email or select a demo staff member below.`);
    }
  };

  // Quick sign in helper for demo testing
  const handleQuickSignIn = (member: StaffMember) => {
    if (onLogin) {
      onLogin(member.id);
    }
    setAuthError(null);
  };

  // Calendar grid template structure for CardLayout
  const gridCellsTemplate = useMemo(() => {
    const paddingBefore = Array.from({ length: activeDisplayMonthInfo.startDayOfWeek }, (_, i) => ({
      isPadding: true,
      dayNum: null,
      dateStr: null
    }));

    const dayCells = Array.from({ length: activeDisplayMonthInfo.daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = `${activeDisplayMonthInfo.year}-${(activeDisplayMonthInfo.monthIdx + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      return {
        isPadding: false,
        dayNum: d,
        dateStr
      };
    });

    const totalCells = paddingBefore.length + dayCells.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    
    const paddingAfter = Array.from({ length: remainingCells }, (_, i) => ({
      isPadding: true,
      dayNum: null,
      dateStr: null
    }));

    return [...paddingBefore, ...dayCells, ...paddingAfter];
  }, [activeDisplayMonthInfo]);

  // Active monthly assignments for current logged in staff
  const staffAssignments = useMemo(() => {
    if (!currentStaff) return [];
    const monthPrefix = `${activeDisplayMonthInfo.year}-${(activeDisplayMonthInfo.monthIdx + 1).toString().padStart(2, '0')}-`;
    return assignments.filter(a => a.staffId === currentStaff.id && a.date.startsWith(monthPrefix));
  }, [assignments, currentStaff, activeDisplayMonthInfo]);

  // Stats calculation
  const stats = useMemo(() => {
    let morning = 0, evening = 0, night = 0, off = 0, leave = 0, holiday = 0, onCall = 0;
    staffAssignments.forEach(a => {
      if ([ShiftType.Morning, ShiftType.MorningSpecial, ShiftType.RequestedMorning].includes(a.shift)) {
        morning++;
      } else if ([ShiftType.Evening, ShiftType.RequestedEvening].includes(a.shift)) {
        evening++;
      } else if ([ShiftType.Night, ShiftType.RequestedNight].includes(a.shift)) {
        night++;
      } else if ([ShiftType.MorningOnCall, ShiftType.EveningOnCall, ShiftType.NightOnCall].includes(a.shift)) {
        onCall++;
      } else if ([ShiftType.Off, ShiftType.RequestedOff].includes(a.shift)) {
        off++;
      } else if ([ShiftType.Leave, ShiftType.OtherLeave, ShiftType.CompensationLeave].includes(a.shift)) {
        leave++;
      } else if (a.shift === ShiftType.PublicHoliday) {
        holiday++;
      }
    });

    return { morning, evening, night, off, leave, holiday, onCall, totalWorkShifts: morning + evening + night };
  }, [staffAssignments]);

  // Print current staff duty card
  const handlePrintCard = () => {
    window.print();
  };

  // Copy schedule summary text to clipboard
  const handleCopySchedule = () => {
    if (!currentStaff) return;
    let summary = `DUTY SCHEDULE CARD - ${currentStaff.name} (${currentStaff.id})\n`;
    summary += `Ward: ${config.wardName || 'ICU'} | Period: ${activeDisplayMonthInfo.month} ${activeDisplayMonthInfo.year}\n`;
    summary += `--------------------------------------------------\n`;

    for (let day = 1; day <= activeDisplayMonthInfo.daysInMonth; day++) {
      const dateStr = `${activeDisplayMonthInfo.year}-${(activeDisplayMonthInfo.monthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const assignment = staffAssignments.find(a => a.date === dateStr);
      const shiftCode = assignment ? assignment.shift : ShiftType.None;
      const dayOfWeek = new Date(activeDisplayMonthInfo.year, activeDisplayMonthInfo.monthIdx, day).toLocaleDateString('en-US', { weekday: 'short' });
      summary += `${activeDisplayMonthInfo.month.substring(0, 3)} ${day.toString().padStart(2, '0')} (${dayOfWeek}): ${shiftCode}\n`;
    }

    navigator.clipboard.writeText(summary);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Download iCalendar file (.ics)
  const handleDownloadICS = () => {
    if (!currentStaff) return;
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AI Staff Roster Manager//Duty Card//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

    staffAssignments.forEach(a => {
      if (!a.shift || a.shift === ShiftType.None || a.shift === ShiftType.Off) return;

      const [yearStr, mStr, dStr] = a.date.split('-');
      let startTime = '070000';
      let endTime = '150000';
      let shiftTitle = 'Morning Shift';

      if ([ShiftType.Evening, ShiftType.EveningOnCall, ShiftType.RequestedEvening].includes(a.shift)) {
        startTime = '150000';
        endTime = '230000';
        shiftTitle = 'Evening Shift';
      } else if ([ShiftType.Night, ShiftType.NightOnCall, ShiftType.RequestedNight].includes(a.shift)) {
        startTime = '230000';
        endTime = '070000'; // next day
        shiftTitle = 'Night Shift';
      } else if (a.shift === ShiftType.Leave) {
        shiftTitle = 'On Leave';
      }

      const dtStart = `${yearStr}${mStr}${dStr}T${startTime}`;
      const dtEnd = `${yearStr}${mStr}${dStr}T${endTime}`;

      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:Hospital Shift (${a.shift}) - ${shiftTitle}\n`;
      icsContent += `DTSTART:${dtStart}\n`;
      icsContent += `DTEND:${dtEnd}\n`;
      icsContent += `DESCRIPTION:Ward ${config.wardName || 'ICU'} Duty Shift Assignment for ${currentStaff.name}\n`;
      icsContent += `LOCATION:Ward ${config.wardName || 'ICU'}\n`;
      icsContent += "STATUS:CONFIRMED\n";
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${currentStaff.name.replace(/\s+/g, '_')}_duty_schedule_${config.month}_${config.year}.ics`);
    link.click();
  };

  // Submitted requests for current staff in target selected month
  const submittedRequestsForTargetMonth = useMemo(() => {
    if (!currentStaff) return [];
    const prefix = `${targetMonthDetails.year}-${(targetMonthDetails.monthIdx + 1).toString().padStart(2, '0')}-`;
    return assignments.filter(a => 
      a.staffId === currentStaff.id && 
      a.date.startsWith(prefix) && 
      [ShiftType.RequestedOff, ShiftType.RequestedMorning, ShiftType.RequestedEvening, ShiftType.RequestedNight, ShiftType.Leave, ShiftType.OtherLeave, ShiftType.CompensationLeave].includes(a.shift)
    );
  }, [assignments, currentStaff, targetMonthDetails]);

  // Submit Shift Request for single or multiple dates
  const handleShiftRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) return;

    let datesToProcess: string[] = [];
    if (requestDates.length > 0) {
      datesToProcess = [...requestDates];
    } else if (requestSingleDate) {
      datesToProcess = [requestSingleDate];
    }

    if (datesToProcess.length === 0) {
      alert("Please select at least one date for your request.");
      return;
    }

    datesToProcess.forEach(d => {
      onUpdateAssignment(currentStaff.id, d, requestShift);
    });

    setRequestSubmittedMsg(
      `Successfully submitted ${datesToProcess.length} request(s) (${requestShift}) for ${targetMonthDetails.month} ${targetMonthDetails.year}!`
    );
    setRequestDates([]);
    setRequestSingleDate('');
    setTimeout(() => setRequestSubmittedMsg(null), 4000);
  };

  // Submit Current Month Duty Exchange / Shift Swap
  const handleDutyExchangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) return;
    if (!exchangeMyDate) {
      alert("Please select your duty date in current month for exchange.");
      return;
    }
    if (!exchangeTargetStaffId) {
      alert("Please select a colleague to exchange duty with.");
      return;
    }

    const targetStaffMember = staff.find(s => s.id === exchangeTargetStaffId);
    if (!targetStaffMember) return;

    // Find current staff shift on exchangeMyDate
    const myShiftObj = assignments.find(a => a.staffId === currentStaff.id && a.date === exchangeMyDate);
    const myShift = myShiftObj ? myShiftObj.shift : ShiftType.None;

    const targetDate = exchangeTargetDate || exchangeMyDate;
    const targetShiftObj = assignments.find(a => a.staffId === targetStaffMember.id && a.date === targetDate);
    const targetShift = targetShiftObj ? targetShiftObj.shift : ShiftType.None;

    if (onRequestExchange) {
      onRequestExchange({
        requestor: currentStaff,
        target: targetStaffMember,
        type: exchangeType,
        requestorDate: exchangeMyDate,
        requestorShift: myShift,
        targetDate: targetDate,
        targetShift: targetShift,
        reason: exchangeReason
      });

      setExchangeSubmittedMsg(
        `Duty Exchange Request Submitted! An in-app application and email notification have been sent to ${targetStaffMember.name} (${targetStaffMember.email || targetStaffMember.id.toLowerCase() + '@hospital.org'}). Once ${targetStaffMember.name} accepts, the Ward Supervisor will receive an email & application notification for final approval.`
      );
    } else {
      // Fallback direct execution
      if (exchangeType === 'swap') {
        onUpdateAssignment(currentStaff.id, exchangeMyDate, targetShift !== ShiftType.None ? targetShift : ShiftType.Morning);
        onUpdateAssignment(targetStaffMember.id, exchangeMyDate, myShift !== ShiftType.None ? myShift : ShiftType.Morning);
        if (targetDate !== exchangeMyDate) {
          onUpdateAssignment(currentStaff.id, targetDate, targetShift !== ShiftType.None ? targetShift : ShiftType.Morning);
          onUpdateAssignment(targetStaffMember.id, targetDate, myShift !== ShiftType.None ? myShift : ShiftType.Morning);
        }
      } else {
        onUpdateAssignment(currentStaff.id, exchangeMyDate, ShiftType.Off);
        onUpdateAssignment(targetStaffMember.id, exchangeMyDate, myShift !== ShiftType.None ? myShift : ShiftType.Morning);
      }
      setExchangeSubmittedMsg(`Duty Exchange successfully executed with ${targetStaffMember.name}!`);
    }

    setExchangeMyDate('');
    setExchangeTargetDate('');
    setExchangeReason('');
    setTimeout(() => setExchangeSubmittedMsg(null), 6000);
  };

  const handleRevertExchange = (logId: string) => {
    const log = exchangeLogs.find(l => l.id === logId);
    if (!log) return;

    if (log.type === 'swap') {
      onUpdateAssignment(log.staff1Id, log.date1, log.shift1);
      onUpdateAssignment(log.staff2Id, log.date1, log.shift2 || ShiftType.None);
      if (log.date2 && log.date2 !== log.date1) {
        onUpdateAssignment(log.staff1Id, log.date2, ShiftType.None);
        onUpdateAssignment(log.staff2Id, log.date2, log.shift2 || ShiftType.None);
      }
    } else {
      onUpdateAssignment(log.staff1Id, log.date1, log.shift1);
      onUpdateAssignment(log.staff2Id, log.date1, ShiftType.None);
    }

    setExchangeLogs(prev => prev.filter(l => l.id !== logId));
    alert("Duty exchange reverted! Original shift assignments restored on roster.");
  };

  // Helper for shift timing description
  const getShiftTimeLabel = (shift: ShiftType) => {
    if ([ShiftType.Morning, ShiftType.MorningSpecial, ShiftType.MorningOnCall, ShiftType.RequestedMorning].includes(shift)) {
      return '07:00 - 15:00 (8 hrs)';
    }
    if ([ShiftType.Evening, ShiftType.EveningOnCall, ShiftType.RequestedEvening].includes(shift)) {
      return '15:00 - 23:00 (8 hrs)';
    }
    if ([ShiftType.Night, ShiftType.NightOnCall, ShiftType.RequestedNight].includes(shift)) {
      return '23:00 - 07:00 (8 hrs)';
    }
    if ([ShiftType.Off, ShiftType.RequestedOff].includes(shift)) {
      return 'Scheduled Off Day';
    }
    if ([ShiftType.Leave, ShiftType.OtherLeave, ShiftType.CompensationLeave].includes(shift)) {
      return 'Approved Leave';
    }
    if (shift === ShiftType.PublicHoliday) {
      return 'Public Holiday';
    }
    return 'No Shift Assigned';
  };

  // IF NOT SIGNED IN: Render Login Screen
  if (!currentStaff) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-8">
        {/* Banner Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-indigo-800/40">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <ShieldCheck size={28} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800/60">
                Staff Duty Privilege Portal
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">Staff Email Sign In</h2>
            </div>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
            Sign in with your registered hospital email address to view your personal duty schedule card, monthly shift details, print your roster, and submit shift preferences.
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Registered Hospital Email Address
              </label>
              <div className="relative">
                <input 
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="e.g. skldf@hospital.org"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <Mail size={18} className="absolute left-4 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Security Passcode / PIN <span className="text-slate-400 font-medium text-[10px] lowercase">(optional)</span>
                </label>
                <span className="text-[10px] font-bold text-indigo-600">Default: 1234</span>
              </div>
              <div className="relative">
                <input 
                  type="password"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <KeyRound size={18} className="absolute left-4 top-3.5 text-slate-400" />
              </div>
            </div>

            {authError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <UserCheck size={18} />
              Sign In to View My Duty Card
            </button>
          </form>

          {/* Quick Demo Sign-In Selector */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Quick Demo Sign-In (Click any staff email):
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {staff.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleQuickSignIn(member)}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-200 rounded-2xl transition-all text-left group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-900 truncate">
                      {member.name || `Staff ${member.id}`}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {member.email || `${member.id.toLowerCase()}@hospital.org`}
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                    member.isSenior 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {member.isSenior ? 'Senior' : 'Junior'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SIGNED IN: Staff Duty Card Privilege Portal
  return (
    <div className="space-y-6">
      {/* Header Profile Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-indigo-800/40">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {currentStaff.photoUrl ? (
              <img
                src={currentStaff.photoUrl}
                alt={currentStaff.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-indigo-400/50"
              />
            ) : (
              <div
                className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20"
              >
                {currentStaff.name ? currentStaff.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-white">{currentStaff.name || `Staff ${currentStaff.id}`}</h2>
              {currentStaff.jobTitle && (
                <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-[11px] font-bold">
                  {currentStaff.jobTitle}
                </span>
              )}
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                <CheckCircle2 size={10} /> Privileged Access
              </span>
              {currentStaff.isAuthorizedDutyApprover && (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                  <ShieldCheck size={10} className="text-amber-400" /> WS Authorised Duty Approver
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 font-medium">
              <span>ID: <strong className="text-white font-mono">{currentStaff.id}</strong></span>
              <span>•</span>
              <span>Ward: <strong className="text-amber-300">{config.wardName || 'ICU'}</strong></span>
              <span>•</span>
              <span>Email: <strong className="text-slate-200">{currentStaff.email || `${currentStaff.id}@hospital.org`}</strong></span>
              {currentStaff.phone && (
                <>
                  <span>•</span>
                  <span>Phone: <strong className="text-slate-200">{currentStaff.phone}</strong></span>
                </>
              )}
              {currentStaff.licenseNumber && (
                <>
                  <span>•</span>
                  <span>License: <strong className="text-indigo-200 font-mono">{currentStaff.licenseNumber}</strong></span>
                </>
              )}
              {currentStaff.licenseExpiry && (
                <>
                  <span>•</span>
                  <span>Expires: <strong className="text-emerald-300 font-mono">{currentStaff.licenseExpiry}</strong></span>
                </>
              )}
              {currentStaff.joinDate && (
                <>
                  <span>•</span>
                  <span>Joined Service: <strong className="text-teal-200 font-mono">{currentStaff.joinDate}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Official License Card Picture Button */}
          <button
            onClick={() => setIsLicenseCardModalOpen(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border shadow-md uppercase tracking-wider ${
              currentStaff.licenseCardUrl
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-950/40 ring-2 ring-emerald-400/20'
                : 'bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border-indigo-700/60'
            }`}
            title="View official verified License Card picture in high-resolution"
          >
            <CreditCard size={14} className={currentStaff.licenseCardUrl ? 'text-emerald-200' : 'text-indigo-300'} />
            <span>{currentStaff.licenseCardUrl ? 'Official License Card' : 'License Card'}</span>
            {currentStaff.licenseCardUrl ? (
              <span className="px-1.5 py-0.5 bg-emerald-300 text-emerald-950 text-[9px] font-black rounded-md leading-none">
                VIEW
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-normal lowercase">
                (info)
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Roster Month Selection Bar (Current Month vs Next Month 5-Days-Prior Rule) */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shrink-0">
            <CalendarIcon size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">
              Duty Roster Viewing Period
            </span>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <span>{activeDisplayMonthInfo.month} {activeDisplayMonthInfo.year}</span>
              {activeDisplayMonthInfo.isNextMonth ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
                  <Sparkles size={10} className="text-amber-600" /> Next Month Duty
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-extrabold uppercase">
                  Current Active Month
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {/* Current Month Button */}
          <button
            type="button"
            onClick={() => setSelectedViewPeriod('current')}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all border flex items-center gap-1.5 ${
              selectedViewPeriod === 'current'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Clock size={14} />
            {config.month} {config.year}
          </button>

          {/* Next Month Button with 5-Days-Prior Tag */}
          <button
            type="button"
            onClick={() => setSelectedViewPeriod('next')}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all border flex items-center gap-1.5 ${
              selectedViewPeriod === 'next'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border-indigo-200'
            }`}
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>{nextMonthInfo.month} {nextMonthInfo.year}</span>
            {isNextMonthUnlocked ? (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-extrabold rounded-md uppercase">
                Unlocked (5 Days Prior)
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[9px] font-extrabold rounded-md uppercase">
                Day {unlockDay} Unlock
              </span>
            )}
          </button>

          {/* Test 5-Days-Prior Simulation Toggle */}
          <button
            type="button"
            onClick={() => setSimulate5DaysPrior(!simulate5DaysPrior)}
            className={`px-3 py-2 rounded-2xl text-[10px] font-black uppercase transition-all border flex items-center gap-1 ${
              simulate5DaysPrior
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
            }`}
            title="Hospital Policy Test: Toggle 5 days prior next month duty view simulation"
          >
            <ShieldCheck size={12} />
            {simulate5DaysPrior ? '5 Days Prior Sim ON' : 'Test 5 Days Prior'}
          </button>
        </div>
      </div>

      {/* Policy Notification Banner when Next Month is selected */}
      {selectedViewPeriod === 'next' && !isNextMonthUnlocked && (
        <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-3xl shadow-sm space-y-4 text-amber-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-xs">
                <Lock size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Hospital Policy • Roster Release Protocol
                </span>
                <h3 className="text-base font-black text-amber-950 mt-1">
                  Next Month ({nextMonthInfo.month} {nextMonthInfo.year}) Duty Roster Release Notice
                </h3>
              </div>
            </div>

            {currentUser?.role === 'ward_supervisor' && (
              <button
                type="button"
                onClick={() => {
                  if (onUpdateConfig) {
                    onUpdateConfig({ ...config, isNextMonthDeployed: true });
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto transition"
              >
                <Sparkles size={14} />
                Deploy Schedule to Staff Right Now
              </button>
            )}
          </div>

          <p className="text-xs text-amber-900 font-medium leading-relaxed">
            All regular nursing staff and Medical Service Aids (MSA) can view their next month duty schedule once generated by the Ward Supervisor and deployed on the <strong>specified deployment date ({specifiedDeployDate})</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200">
              <span className="text-[10px] font-black uppercase text-amber-600 block">Current Date</span>
              <span className="font-mono font-black text-amber-900 text-sm">{todayStr}</span>
            </div>
            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200">
              <span className="text-[10px] font-black uppercase text-amber-600 block">Specified Deployment Date</span>
              <span className="font-mono font-black text-amber-900 text-sm">{specifiedDeployDate}</span>
            </div>
            <div className="p-3 bg-amber-100/80 rounded-2xl border border-amber-300 flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-amber-800 block">Status</span>
              <span className="font-mono font-black text-amber-950 text-sm">
                {isNextMonthGenerated ? 'Generated (Pending Deploy Date)' : 'Awaiting WS Generation'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-200/80">
            <span className="text-[11px] text-amber-900 font-semibold italic">
              Want to preview next month's duty right now for testing? Click below to simulate the deployment window.
            </span>
            <button
              type="button"
              onClick={() => setSimulate5DaysPrior(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Sparkles size={14} />
              Simulate Specified Release Window Now
            </button>
          </div>
        </div>
      )}

      {selectedViewPeriod === 'next' && isNextMonthUnlocked && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-900 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>
              <strong>Next Month Duty Roster ({nextMonthInfo.month} {nextMonthInfo.year}) Unlocked & Deployed:</strong> All regular staff and Medical Service Aids (MSA) can now view their own next month duty schedule (Specified Deployment Date: {specifiedDeployDate}).
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {currentUser?.role === 'ward_supervisor' && (
              <button
                type="button"
                onClick={() => {
                  if (onUpdateConfig) {
                    onUpdateConfig({ ...config, isNextMonthDeployed: false });
                  }
                }}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black uppercase transition"
                title="Re-lock schedule to draft mode"
              >
                Re-Lock Schedule
              </button>
            )}
            <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase">
              Deployed & Active
            </span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs inside Staff Portal */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-print">
        <button
          onClick={() => setActiveSubTab('card')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase transition-all ${
            activeSubTab === 'card'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CalendarIcon size={16} />
          My Duty Card
        </button>

        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase transition-all ${
            activeSubTab === 'schedule'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText size={16} />
          Monthly Schedule List
        </button>

        <button
          onClick={() => setActiveSubTab('requests')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase transition-all ${
            activeSubTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send size={16} />
          Request Shift / Leave
        </button>
      </div>

      {/* SUB-TAB 1: MY DUTY CARD VIEW */}
      {activeSubTab === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Duty Card Display */}
          <div className="lg:col-span-2 bg-slate-900/5 p-6 rounded-3xl border border-slate-200 flex flex-col items-center justify-center space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-md gap-3">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                  Personal Duty Calendar Card
                </h3>
                <p className="text-xs text-slate-500 font-medium">Valid for {activeDisplayMonthInfo.month} {activeDisplayMonthInfo.year}</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={cardColorMode}
                  onChange={(e) => setCardColorMode(e.target.value as 'ClassicRetro' | 'AppTheme')}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="ClassicRetro">Retro High-Contrast</option>
                  <option value="AppTheme">Current App Theme</option>
                </select>
              </div>
            </div>

            {/* Render High-Fidelity Card */}
            <div className="print-card-item transform scale-110 sm:scale-125 my-6">
              <CardLayout 
                member={currentStaff}
                config={activeConfig}
                rosterTitle={config.wardName || 'ICU'}
                footerText={`Done By ${config.wardName || 'Ward'}`}
                colorMode={cardColorMode}
                appTheme={appTheme}
                gridCells={gridCellsTemplate}
                assignments={assignments}
              />
            </div>

            {/* Actions for Duty Card */}
            <div className="flex flex-wrap justify-center gap-3 w-full max-w-md pt-4 border-t border-slate-200/80">
              <button
                onClick={handlePrintCard}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition uppercase"
              >
                <Printer size={16} />
                Print My Duty Card
              </button>

              <button
                onClick={handleDownloadICS}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition uppercase"
              >
                <Download size={16} />
                Export to Calendar (.ics)
              </button>

              <button
                onClick={handleCopySchedule}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-md transition uppercase"
              >
                <Copy size={16} />
                {copiedSuccess ? 'Schedule Copied!' : 'Copy Summary'}
              </button>
            </div>
          </div>

          {/* Side Summary & Instructions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-600" />
                Monthly Duty Summary ({activeDisplayMonthInfo.month})
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Morning Shifts</span>
                  <span className="text-xl font-black text-slate-800">{stats.morning}</span>
                  <span className="text-[10px] text-slate-500 block">Max: {currentStaff.maxMorning}</span>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-blue-600 block">Evening Shifts</span>
                  <span className="text-xl font-black text-blue-900">{stats.evening}</span>
                  <span className="text-[10px] text-blue-600 block">Max: {currentStaff.maxEvening}</span>
                </div>

                <div className="p-3 bg-slate-100 border border-slate-300 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-600 block">Night Shifts</span>
                  <span className="text-xl font-black text-slate-900">{stats.night}</span>
                  <span className="text-[10px] text-slate-500 block">Max: {currentStaff.maxNight}</span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-emerald-700 block">Off Days</span>
                  <span className="text-xl font-black text-emerald-900">{stats.off}</span>
                  <span className="text-[10px] text-emerald-600 block">Target: {currentStaff.maxOff || 10}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/60 p-6 rounded-3xl border border-indigo-100 text-indigo-950 space-y-3">
              <div className="flex items-center gap-2 font-black text-xs uppercase text-indigo-900">
                <Sparkles size={16} className="text-amber-500" />
                Staff Privilege Features
              </div>
              <ul className="text-xs text-indigo-900/80 space-y-2 leading-relaxed list-disc list-inside">
                <li>Export your shifts as an <strong>.ics calendar file</strong> and import directly into Google Calendar, Outlook, or Apple Calendar.</li>
                <li>Submit <strong>Shift & Off Requests</strong> for upcoming dates directly from the Request tab.</li>
                <li>Check who is scheduled on duty alongside you for any day of the month.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MONTHLY SCHEDULE LIST */}
      {activeSubTab === 'schedule' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-base font-black text-slate-800">
                Monthly Duty Schedule List ({activeDisplayMonthInfo.month} {activeDisplayMonthInfo.year})
              </h3>
              <p className="text-xs text-slate-500">Day-by-day shift breakdown for {currentStaff.name}</p>
            </div>

            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              Total Duty Shifts: <strong>{stats.totalWorkShifts}</strong> | Off Days: <strong>{stats.off}</strong>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Assigned Shift</th>
                  <th className="py-3 px-4">Timing & Hours</th>
                  <th className="py-3 px-4">Co-Workers On Duty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: activeDisplayMonthInfo.daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${activeDisplayMonthInfo.year}-${(activeDisplayMonthInfo.monthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const dayOfWeek = new Date(activeDisplayMonthInfo.year, activeDisplayMonthInfo.monthIdx, day).toLocaleDateString('en-US', { weekday: 'short' });
                  const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
                  const isHoliday = config.holidays?.includes(dateStr);

                  const assignment = staffAssignments.find(a => a.date === dateStr);
                  const shiftCode = assignment ? assignment.shift : ShiftType.None;

                  // Find co-workers on same shift
                  const sameShiftCoWorkers = assignments
                    .filter(a => a.date === dateStr && a.shift === shiftCode && a.staffId !== currentStaff.id)
                    .map(a => staff.find(s => s.id === a.staffId))
                    .filter(Boolean) as StaffMember[];

                  const isExpanded = expandedDate === dateStr;

                  return (
                    <tr key={dateStr} className={`hover:bg-slate-50/80 transition-colors ${isHoliday ? 'bg-rose-50/30' : isWeekend ? 'bg-amber-50/20' : ''}`}>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {activeDisplayMonthInfo.month.substring(0, 3)} {day.toString().padStart(2, '0')}, {activeDisplayMonthInfo.year}
                      </td>
                      <td className="py-3 px-4 font-extrabold uppercase text-[11px] text-slate-500">
                        <span className={isWeekend ? 'text-amber-600' : ''}>{dayOfWeek}</span>
                        {isHoliday && <span className="ml-1 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px]">Holiday</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono inline-block ${
                          [ShiftType.Morning, ShiftType.RequestedMorning].includes(shiftCode) ? 'bg-slate-800 text-white' :
                          [ShiftType.Evening, ShiftType.RequestedEvening].includes(shiftCode) ? 'bg-blue-600 text-white' :
                          [ShiftType.Night, ShiftType.RequestedNight].includes(shiftCode) ? 'bg-slate-900 text-white' :
                          [ShiftType.Off, ShiftType.RequestedOff].includes(shiftCode) ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          shiftCode === ShiftType.Leave ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {shiftCode || 'None'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">
                        {getShiftTimeLabel(shiftCode)}
                      </td>
                      <td className="py-3 px-4">
                        {shiftCode && shiftCode !== ShiftType.None && shiftCode !== ShiftType.Off ? (
                          <div className="space-y-1">
                            <button
                              onClick={() => setExpandedDate(isExpanded ? null : dateStr)}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              <Users size={12} />
                              {sameShiftCoWorkers.length} Co-workers on Shift
                            </button>

                            {isExpanded && (
                              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1 mt-1">
                                {sameShiftCoWorkers.length === 0 ? (
                                  <span className="text-slate-400">No other staff assigned to this shift.</span>
                                ) : (
                                  sameShiftCoWorkers.map(cw => (
                                    <div key={cw.id} className="flex justify-between text-slate-700 font-medium">
                                      <span>{cw.name}</span>
                                      <span className="text-[9px] text-slate-400 font-mono">{cw.isSenior ? 'Senior' : 'Junior'}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: REQUEST SHIFT / LEAVE */}
      {activeSubTab === 'requests' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Request Category Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Send size={18} className="text-indigo-600" />
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider">Request Mode:</span>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setRequestCategory('next_month')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  requestCategory === 'next_month'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles size={14} className="text-amber-300" />
                Next Month Requests ({nextMonthInfo.month} {nextMonthInfo.year})
              </button>

              <button
                type="button"
                onClick={() => setRequestCategory('current_month_exchange')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  requestCategory === 'current_month_exchange'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartHandshake size={14} />
                Current Month Duty Exchange ({config.month} {config.year})
              </button>
            </div>
          </div>

          {/* CATEGORY 1: NEXT MONTH ADVANCE REQUESTS */}
          {requestCategory === 'next_month' && (
            <>
              {/* Header Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      Staff Roster Privilege Portal
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-2 flex items-center gap-2">
                      <Send size={22} className="text-indigo-600" />
                      Submit Next Month Shift & Leave Requests
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submit your advance shift preferences, off-day requests, or leave for different dates in next month ({targetMonthDetails.month} {targetMonthDetails.year}).
                    </p>
                  </div>

                  {/* Target Month Indicator */}
                  <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="text-xs font-black text-indigo-950">
                      Planning for {targetMonthDetails.month} {targetMonthDetails.year}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleShiftRequestSubmit} className="space-y-6">
                  {/* Target Period Banner */}
                  <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl">
                        <CalendarIcon size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                          Target Roster Month
                        </span>
                        <h4 className="text-sm font-black text-indigo-950">
                          {targetMonthDetails.month} {targetMonthDetails.year} (Advance Next Month Roster Requests)
                        </h4>
                      </div>
                    </div>

                    <div className="text-xs font-extrabold text-indigo-900 bg-white px-3 py-1.5 rounded-xl border border-indigo-100">
                      {requestDates.length > 0 
                        ? `${requestDates.length} Date(s) Selected`
                        : requestSingleDate 
                        ? `1 Date Selected (${requestSingleDate})` 
                        : 'No dates selected yet'}
                    </div>
                  </div>

                  {/* Multi-Date Interactive Calendar Picker */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                        Click Dates in {targetMonthDetails.month} {targetMonthDetails.year} to Request
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Select all weekend dates
                            const weekendDates: string[] = [];
                            for (let d = 1; d <= targetMonthDetails.daysInMonth; d++) {
                              const dateStr = `${targetMonthDetails.year}-${(targetMonthDetails.monthIdx + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                              const dayOfWeek = new Date(targetMonthDetails.year, targetMonthDetails.monthIdx, d).getDay();
                              if (dayOfWeek === 0 || dayOfWeek === 6) {
                                weekendDates.push(dateStr);
                              }
                            }
                            setRequestDates(weekendDates);
                            setRequestSingleDate('');
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition"
                        >
                          + Select All Weekends
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRequestDates([]);
                            setRequestSingleDate('');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid Box */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] font-black uppercase text-slate-400 border-b border-slate-200/80 pb-2">
                        <span>Sun</span>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {/* Padding before first day of month */}
                        {Array.from({ length: new Date(targetMonthDetails.year, targetMonthDetails.monthIdx, 1).getDay() }, (_, i) => (
                          <div key={`pad-${i}`} className="h-12 bg-transparent opacity-0 pointer-events-none" />
                        ))}

                        {/* Day Cards */}
                        {Array.from({ length: targetMonthDetails.daysInMonth }, (_, i) => {
                          const d = i + 1;
                          const dateStr = `${targetMonthDetails.year}-${(targetMonthDetails.monthIdx + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                          const dayOfWeek = new Date(targetMonthDetails.year, targetMonthDetails.monthIdx, d).getDay();
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                          const isSelected = requestDates.includes(dateStr) || requestSingleDate === dateStr;

                          // Existing request for this date
                          const existingReq = assignments.find(a => a.staffId === currentStaff.id && a.date === dateStr);

                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => {
                                if (requestDates.includes(dateStr)) {
                                  setRequestDates(prev => prev.filter(x => x !== dateStr));
                                } else {
                                  setRequestDates(prev => [...prev, dateStr]);
                                }
                                setRequestSingleDate('');
                              }}
                              className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between h-14 relative ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
                                  : isWeekend
                                  ? 'bg-amber-50/70 border-amber-200 hover:border-indigo-400 text-slate-800'
                                  : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
                              }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                  {d}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 size={12} className="text-amber-300" />
                                )}
                              </div>

                              {existingReq && existingReq.shift !== ShiftType.None && (
                                <span className={`text-[9px] font-mono font-black px-1 rounded ${
                                  isSelected 
                                    ? 'bg-indigo-800 text-amber-200' 
                                    : 'bg-indigo-100 text-indigo-900'
                                }`}>
                                  {existingReq.shift}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Shift Type and Note Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                        Requested Shift Type
                      </label>
                      <select
                        value={requestShift}
                        onChange={(e) => setRequestShift(e.target.value as ShiftType)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={ShiftType.RequestedOff}>Requested Off (RW)</option>
                        <option value={ShiftType.RequestedMorning}>Requested Morning (R1)</option>
                        <option value={ShiftType.RequestedEvening}>Requested Evening (R2)</option>
                        <option value={ShiftType.RequestedNight}>Requested Night (R3)</option>
                        <option value={ShiftType.Leave}>Approved Leave (L)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                        Note / Reason for Roster Manager
                      </label>
                      <input
                        type="text"
                        value={requestNote}
                        onChange={(e) => setRequestNote(e.target.value)}
                        placeholder="e.g. Annual Leave / Family Duty..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {requestSubmittedMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <span>{requestSubmittedMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Submit Requests for {targetMonthDetails.month} {targetMonthDetails.year} ({requestDates.length || (requestSingleDate ? 1 : 0)} Selected Dates)
                  </button>
                </form>
              </div>

              {/* Submitted Requests List Table */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      My Active Requests for {targetMonthDetails.month} {targetMonthDetails.year}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Showing requests submitted by {currentStaff.name} ({currentStaff.id})
                    </p>
                  </div>

                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-black">
                    {submittedRequestsForTargetMonth.length} Request(s)
                  </span>
                </div>

                {submittedRequestsForTargetMonth.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No shift requests submitted yet for {targetMonthDetails.month} {targetMonthDetails.year}. Select dates above to make your requests.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Requested Shift</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {submittedRequestsForTargetMonth.map(req => {
                          const [, , dayStr] = req.date.split('-');
                          const dayNum = parseInt(dayStr, 10);
                          const dayOfWeek = new Date(targetMonthDetails.year, targetMonthDetails.monthIdx, dayNum).toLocaleDateString('en-US', { weekday: 'short' });

                          return (
                            <tr key={req.date} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-bold text-slate-800">
                                {targetMonthDetails.month.substring(0, 3)} {dayStr} ({dayOfWeek})
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-black font-mono text-xs inline-block">
                                  {req.shift}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 w-fit">
                                  <CheckCircle2 size={10} /> Active Roster Request
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    onUpdateAssignment(currentStaff.id, req.date, ShiftType.None);
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition"
                                >
                                  Withdraw Request
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* CATEGORY 2: CURRENT MONTH DUTY EXCHANGE */}
          {requestCategory === 'current_month_exchange' && (
            <div className="space-y-8">
              {/* Form Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                    Current Active Roster ({config.month} {config.year})
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2 flex items-center gap-2">
                    <HeartHandshake size={22} className="text-indigo-600" />
                    Duty Exchange & Shift Swap Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Request a shift swap or duty coverage with a fellow staff member for the current month.
                  </p>
                </div>

                <form onSubmit={handleDutyExchangeSubmit} className="space-y-6">
                  {/* Step 1: My Duty Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                        1. Select My Duty Date ({config.month} {config.year})
                      </label>
                      <select
                        value={exchangeMyDate}
                        onChange={(e) => setExchangeMyDate(e.target.value)}
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose my date to exchange --</option>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const d = i + 1;
                          const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                          const dayOfWeek = new Date(config.year, monthIdx, d).toLocaleDateString('en-US', { weekday: 'short' });
                          const myAssignedShift = assignments.find(a => a.staffId === currentStaff.id && a.date === dateStr)?.shift || ShiftType.None;
                          return (
                            <option key={dateStr} value={dateStr}>
                              {config.month.substring(0, 3)} {d.toString().padStart(2, '0')} ({dayOfWeek}) - Shift: [{myAssignedShift}]
                            </option>
                          );
                        })}
                      </select>
                      {exchangeMyDate && (
                        <p className="text-[11px] font-bold text-indigo-600 mt-1">
                          Current Assigned Shift: [{assignments.find(a => a.staffId === currentStaff.id && a.date === exchangeMyDate)?.shift || ShiftType.None}]
                        </p>
                      )}
                    </div>

                    {/* Step 2: Target Colleague */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                        2. Select Colleague to Exchange With
                      </label>
                      <select
                        value={exchangeTargetStaffId}
                        onChange={(e) => setExchangeTargetStaffId(e.target.value)}
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Select Colleague --</option>
                        {staff.filter(s => s.id !== currentStaff.id).map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.id}) {s.isSenior ? '[Senior]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 3: Exchange Type */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700 uppercase">
                      3. Exchange Agreement Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setExchangeType('swap')}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                          exchangeType === 'swap'
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300 text-indigo-950 font-black'
                            : 'bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${exchangeType === 'swap' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <Copy size={16} />
                        </div>
                        <div>
                          <div className="text-xs">🔄 Mutual Shift Swap (2-Way)</div>
                          <div className="text-[10px] text-slate-500 font-normal">Swap my duty with colleague's duty</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExchangeType('transfer')}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                          exchangeType === 'transfer'
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300 text-indigo-950 font-black'
                            : 'bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${exchangeType === 'transfer' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <Send size={16} />
                        </div>
                        <div>
                          <div className="text-xs">➡️ Duty Coverage (1-Way)</div>
                          <div className="text-[10px] text-slate-500 font-normal">Colleague covers my duty (I take Off)</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Step 4: Colleague's Date (for Mutual Swap) */}
                  {exchangeType === 'swap' && (
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                        4. Select Colleague's Duty Date to Take in Swap ({config.month} {config.year})
                      </label>
                      <select
                        value={exchangeTargetDate}
                        onChange={(e) => setExchangeTargetDate(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Same date as mine ({exchangeMyDate || 'Select Date 1 First'}) --</option>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const d = i + 1;
                          const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                          const dayOfWeek = new Date(config.year, monthIdx, d).toLocaleDateString('en-US', { weekday: 'short' });
                          const targetShift = exchangeTargetStaffId 
                            ? (assignments.find(a => a.staffId === exchangeTargetStaffId && a.date === dateStr)?.shift || ShiftType.None)
                            : ShiftType.None;
                          return (
                            <option key={dateStr} value={dateStr}>
                              {config.month.substring(0, 3)} {d.toString().padStart(2, '0')} ({dayOfWeek}) - Colleague Shift: [{targetShift}]
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Step 5: Reason */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                      Reason / Exchange Agreement Notes
                    </label>
                    <input
                      type="text"
                      value={exchangeReason}
                      onChange={(e) => setExchangeReason(e.target.value)}
                      placeholder="e.g. Mutual shift swap / Medical appointment..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {exchangeSubmittedMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <span>{exchangeSubmittedMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <HeartHandshake size={18} />
                    Execute Duty Exchange & Update Roster
                  </button>
                </form>
              </div>

              {/* Exchange Logs Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Clock size={16} className="text-indigo-600" />
                      Current Session Duty Exchange History ({config.month} {config.year})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Record of executed duty swaps and coverage transfers
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black border border-indigo-100">
                    {exchangeLogs.length} Exchange Log(s)
                  </span>
                </div>

                {exchangeLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No duty exchanges executed yet for {config.month} {config.year}. Use the form above to initiate a duty swap or coverage with a colleague.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Time</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Staff Members</th>
                          <th className="py-3 px-4">Date(s) & Shifts</th>
                          <th className="py-3 px-4">Reason</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {exchangeLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.timestamp}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                log.type === 'swap' 
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {log.type === 'swap' ? '2-Way Swap' : '1-Way Transfer'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {log.staff1Name} ↔ {log.staff2Name}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">
                              <div>{log.date1} (Shift: {log.shift1})</div>
                              {log.date2 && log.date2 !== log.date1 && (
                                <div className="text-[10px] text-slate-400">Target Date: {log.date2}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-500">{log.reason || '-'}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleRevertExchange(log.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition"
                              >
                                Revert Exchange
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official License Card Modal (Personal Profile View) */}
      {isLicenseCardModalOpen && currentStaff && (
        <StaffLicenseCardModal
          staff={currentStaff}
          isOpen={true}
          onClose={() => setIsLicenseCardModalOpen(false)}
          isReadOnly={true}
        />
      )}

    </div>
  );
};

export default StaffPortal;
