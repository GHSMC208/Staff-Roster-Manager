
import React, { useMemo, useState } from 'react';
import { RosterConfig, StaffMember, Assignment, ShiftType } from '../types';
import { ICONS, MONTHS, YEARS } from '../constants';

interface Props {
  config: RosterConfig;
  onUpdate: (config: RosterConfig) => void;
  staff: StaffMember[];
  assignments: Assignment[];
}

const RulesManager: React.FC<Props> = ({ config, onUpdate, staff, assignments }) => {
  const [activeCategory, setActiveCategory] = useState<'regular' | 'ha'>('regular');

  const handleChange = (key: keyof RosterConfig, value: any) => {
    onUpdate({ ...config, [key]: value });
  };

  const isHAActive = activeCategory === 'ha';

  const getValue = (key: keyof RosterConfig, haKey?: keyof RosterConfig) => {
    if (isHAActive && haKey) {
      return config[haKey] ?? config[key];
    }
    return config[key];
  };

  const handleValueChange = (key: keyof RosterConfig, haKey: keyof RosterConfig | undefined, value: any) => {
    if (isHAActive && haKey) {
      onUpdate({ ...config, [haKey]: value });
    } else {
      onUpdate({ ...config, [key]: value });
    }
  };

  const toggleHoliday = (dayNum: number) => {
    const monthIdx = MONTHS.indexOf(config.month);
    const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    const currentHolidays = config.holidays || [];
    let updatedHolidays: string[];
    if (currentHolidays.includes(dateStr)) {
      updatedHolidays = currentHolidays.filter(h => h !== dateStr);
    } else {
      updatedHolidays = [...currentHolidays, dateStr];
    }
    handleChange('holidays', updatedHolidays);
  };

  const renderHolidayPicker = () => {
    const days = [];
    const monthIdx = MONTHS.indexOf(config.month);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(config.year, monthIdx, d);
      const dayOfWeekName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const isSelected = config.holidays?.includes(dateStr);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday & Saturday

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => toggleHoliday(d)}
          className={`flex flex-col items-center justify-center p-1 border rounded-lg text-center transition-all hover:scale-105 active:scale-95 ${
            isSelected 
              ? 'bg-rose-600 border-rose-700 text-white shadow-sm font-black ring-2 ring-rose-200'
              : isWeekend
              ? 'bg-amber-50 border-amber-100 text-amber-800 hover:bg-amber-100 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
          }`}
          style={{ minWidth: '28px' }}
        >
          <span className="text-[10px] font-black">{d}</span>
          <span className="text-[6px] uppercase font-bold opacity-75">{dayOfWeekName}</span>
        </button>
      );
    }
    return (
      <div className="grid grid-cols-7 gap-1 max-h-[160px] overflow-y-auto pr-1">
        {days}
      </div>
    );
  };

  const daysInMonth = useMemo(() => {
    const monthIdx = MONTHS.indexOf(config.month);
    return new Date(config.year, monthIdx + 1, 0).getDate();
  }, [config.month, config.year]);

  const smartAnalysis = useMemo(() => {
    const monthIdx = MONTHS.indexOf(config.month);
    let totalSlotsRequired = 0;

    const isHA = activeCategory === 'ha';
    const isHaStaff = (name: string): boolean => {
      const trimmed = name.trim();
      return trimmed.startsWith('HA') || trimmed.startsWith('(HA)') || trimmed.startsWith('MSA') || trimmed.startsWith('(MSA)');
    };
    const isWsStaff = (s: StaffMember): boolean => {
      return !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)');
    };

    const targetStaff = staff.filter(s => !s.isCounterPart && !isWsStaff(s) && (isHA ? (isHaStaff(s.name) || !!s.isHa) : (!isHaStaff(s.name) && !s.isHa)));

    const minM = isHA ? (config.haMinMorning ?? config.minMorning) : config.minMorning;
    const minE = isHA ? (config.haMinEvening ?? config.minEvening) : config.minEvening;
    const minN = isHA ? (config.haMinNight ?? config.minNight) : config.minNight;

    const minMWeekend = isHA ? (config.haMinMorningWeekend ?? config.minMorningWeekend) : config.minMorningWeekend;
    const minEWeekend = isHA ? (config.haMinEveningWeekend ?? config.minEveningWeekend) : config.minEveningWeekend;
    const minNWeekend = isHA ? (config.haMinNightWeekend ?? config.minNightWeekend) : config.minNightWeekend;

    const minMHoliday = isHA ? (config.haMinMorningHoliday ?? config.minMorningHoliday ?? config.minMorning) : (config.minMorningHoliday ?? config.minMorning);
    const minEHoliday = isHA ? (config.haMinEveningHoliday ?? config.minEveningHoliday ?? config.minEvening) : (config.minEveningHoliday ?? config.minEvening);
    const minNHoliday = isHA ? (config.haMinNightHoliday ?? config.minNightHoliday ?? config.minNight) : (config.minNightHoliday ?? config.minNight);

    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      const dateObj = new Date(config.year, monthIdx, dNum);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday & Saturday
      const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${dNum.toString().padStart(2, '0')}`;
      const isHoliday = config.holidays?.includes(dateStr);
      
      let mm = minM;
      let me = minE;
      let mn = minN;

      if (isHoliday) {
        mm = minMHoliday;
        me = minEHoliday;
        mn = minNHoliday;
      } else if (isWeekend) {
        mm = minMWeekend;
        me = minEWeekend;
        mn = minNWeekend;
      }
      
      totalSlotsRequired += (mm + me + mn);
    }
    
    // Standard availability factor: 0.71 (approx 5/7 days)
    const staffCapacityFactor = 0.71;
    const slotsPerStaffMember = daysInMonth * staffCapacityFactor;
    
    // Min staff needed mathematically to cover the basic duty blocks
    const minStaffNeeded = Math.ceil(totalSlotsRequired / slotsPerStaffMember);

    const workingStaffCount = targetStaff.length;
    const leaveDays = assignments.filter(a => a.shift === ShiftType.Leave && targetStaff.some(s => s.id === a.staffId)).length;
    
    // Net effective capacity of current team
    const totalPossibleSlots = workingStaffCount * daysInMonth;
    const netEffectiveCapacity = Math.floor((totalPossibleSlots - leaveDays) * staffCapacityFactor);
    
    const deficit = totalSlotsRequired - netEffectiveCapacity;
    const ratio = workingStaffCount / (minStaffNeeded || 1);

    // Calculate max staff allowed for leave (surplus staff)
    const maxLeaveAllowed = Math.max(0, Math.floor(workingStaffCount - (totalSlotsRequired / slotsPerStaffMember)));

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (ratio < 0.9) status = 'critical';
    else if (ratio < 1.1) status = 'warning';

    return {
      totalSlotsRequired,
      netEffectiveCapacity,
      leaveDays,
      status,
      deficit,
      minStaffNeeded,
      maxLeaveAllowed,
      workingStaffCount
    };
  }, [config, staff, assignments, daysInMonth, activeCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <ICONS.Settings className="text-blue-500" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configuration & Rules</h2>
          <p className="text-sm text-gray-500">Optimize staffing levels and AI constraints</p>
        </div>
      </div>

      {/* Smart Manpower Insight Card */}
      <div className={`p-6 rounded-2xl border-2 shadow-sm transition-all ${
        smartAnalysis.status === 'critical' ? 'bg-red-50 border-red-200' :
        smartAnalysis.status === 'warning' ? 'bg-amber-50 border-amber-200' :
        'bg-emerald-50 border-emerald-200'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className={`p-4 rounded-xl ${
            smartAnalysis.status === 'critical' ? 'bg-red-100 text-red-600' :
            smartAnalysis.status === 'warning' ? 'bg-amber-100 text-amber-600' :
            'bg-emerald-100 text-emerald-600'
          }`}>
            <ICONS.Sparkles size={32} />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight">Smart Manpower Insight</h3>
            <p className="text-sm text-gray-600 font-medium">Monthly Analysis for {config.month} {config.year}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase block leading-tight">Min Required Personnel</span>
                <div className="text-2xl font-black text-blue-600">{smartAnalysis.minStaffNeeded}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase block leading-tight">Actual Staff Count</span>
                <div className="text-2xl font-black text-gray-900">
                  {smartAnalysis.workingStaffCount}
                  {staff.filter(s => s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)')).length > 0 && (
                    <span className="text-xs text-amber-600 font-bold ml-1" title="Ward Supervisor staff not counted in rules">
                      (+{staff.filter(s => s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)')).length} WS)
                    </span>
                  )}
                  {staff.filter(s => s.isCounterPart).length > 0 && (
                    <span className="text-xs text-violet-500 font-bold ml-1" title="Counterpart staff not counted in requirements">
                      (+{staff.filter(s => s.isCounterPart).length} CP)
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase block leading-tight">Total Duty Slots</span>
                <div className="text-2xl font-black text-gray-900">{smartAnalysis.totalSlotsRequired}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase block leading-tight">Max Staff on Leave</span>
                <div className={`text-2xl font-black ${smartAnalysis.maxLeaveAllowed > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {smartAnalysis.maxLeaveAllowed}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black text-gray-400 uppercase block leading-tight">Capacity Gap</span>
                <div className={`text-2xl font-black ${smartAnalysis.deficit > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {smartAnalysis.deficit > 0 ? `-${smartAnalysis.deficit}` : 'Optimal'}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 px-4 py-2 bg-white/60 rounded-lg border border-white">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                smartAnalysis.status === 'critical' ? 'bg-red-500' :
                smartAnalysis.status === 'warning' ? 'bg-amber-500' :
                'bg-emerald-500'
              }`} />
              <p className="text-sm font-bold text-gray-700">
                {smartAnalysis.status === 'critical' 
                  ? `Insufficient Staff: You are ${smartAnalysis.minStaffNeeded - staff.length} short. Roster generation may fail.` 
                  : smartAnalysis.status === 'warning'
                  ? `Borderline Coverage: Minimum requirements met, but only ${smartAnalysis.maxLeaveAllowed} person can safely take leave.`
                  : `Optimal Staffing: You can afford to have up to ${smartAnalysis.maxLeaveAllowed} staff members on leave.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category rules selector tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveCategory('regular')}
          className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2.5 ${
            activeCategory === 'regular'
              ? 'bg-white text-slate-900 shadow-md scale-100'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ICONS.Users size={18} /> Regular Staff Rules
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('ha')}
          className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2.5 ${
            activeCategory === 'ha'
              ? 'bg-emerald-600 text-white shadow-md scale-100'
              : 'text-slate-500 hover:text-emerald-700'
          }`}
        >
          <ICONS.Sparkles size={18} /> (MSA) Staff Rules
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <ICONS.CalendarIcon size={18} className="text-blue-500" />
              Roster Details &amp; Ward
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Ward / Department Name</label>
                <input
                  type="text"
                  value={config.wardName || ''}
                  onChange={(e) => handleChange('wardName', e.target.value)}
                  placeholder="e.g. ICU, CCU, Ward 3"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Year</label>
                  <select 
                    value={config.year} 
                    onChange={(e) => handleChange('year', parseInt(e.target.value))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Month</label>
                  <select 
                    value={config.month} 
                    onChange={(e) => handleChange('month', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="p-1 bg-rose-500 text-white rounded-lg flex items-center justify-center">
                <ICONS.Sparkles size={14} />
              </span>
              Public Holidays
            </h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Click on the days below to designate them as public holidays for this month.
            </p>
            {renderHolidayPicker()}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 lg:col-span-2">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ICONS.Users size={18} className="text-emerald-500" />
            Min Staffing per Shift
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Weekdays (Sun – Thu)</h4>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <span className="font-bold text-emerald-800 text-sm">Morning (Shift 1)</span>
                <input 
                  type="number" 
                  value={getValue('minMorning', 'haMinMorning')} 
                  onChange={(e) => handleValueChange('minMorning', 'haMinMorning', parseInt(e.target.value) || 0)}
                  className="w-14 p-2 bg-white border border-emerald-200 rounded-lg text-center font-black focus:ring-2 focus:ring-emerald-400 outline-none" 
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <span className="font-bold text-blue-800 text-sm">Evening (Shift 2)</span>
                <input 
                  type="number" 
                  value={getValue('minEvening', 'haMinEvening')} 
                  onChange={(e) => handleValueChange('minEvening', 'haMinEvening', parseInt(e.target.value) || 0)}
                  className="w-14 p-2 bg-white border border-blue-200 rounded-lg text-center font-black focus:ring-2 focus:ring-blue-400 outline-none" 
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                <span className="font-bold text-indigo-800 text-sm">Night (Shift 3)</span>
                <input 
                  type="number" 
                  value={getValue('minNight', 'haMinNight')} 
                  onChange={(e) => handleValueChange('minNight', 'haMinNight', parseInt(e.target.value) || 0)}
                  className="w-14 p-2 bg-white border border-indigo-200 rounded-lg text-center font-black focus:ring-2 focus:ring-indigo-400 outline-none" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-amber-50 pb-1">Weekends (Fri – Sat)</h4>
              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-dashed border-emerald-200">
                <span className="font-bold text-emerald-800 text-sm">Morning (Shift 1)</span>
                <input 
                  type="number" 
                  value={getValue('minMorningWeekend', 'haMinMorningWeekend')} 
                  onChange={(e) => handleValueChange('minMorningWeekend', 'haMinMorningWeekend', parseInt(e.target.value) || 0)}
                  className="w-14 p-2 bg-white border border-emerald-200 rounded-lg text-center font-black focus:ring-2 focus:ring-emerald-400 outline-none" 
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-dashed border-blue-200">
                <span className="font-bold text-blue-800 text-sm">Evening (Shift 2)</span>
                <input 
                  type="number" 
                  value={getValue('minEveningWeekend', 'haMinEveningWeekend')} 
                  onChange={(e) => handleValueChange('minEveningWeekend', 'haMinEveningWeekend', parseInt(e.target.value) || 0)}
                  className="w-14 p-2 bg-white border border-blue-200 rounded-lg text-center font-black focus:ring-2 focus:ring-blue-400 outline-none" 
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-dashed border-indigo-200">
                <span className="font-bold text-indigo-800 text-sm">Night (Shift 3)</span>
                <input 
                  type="number" 
                  value={getValue('minNightWeekend', 'haMinNightWeekend')} 
                  onChange={(e) => handleValueChange('minNightWeekend', 'haMinNightWeekend', parseInt(e.target.value) || 0)}
                  className="w-14 p-2 bg-white border border-indigo-200 rounded-lg text-center font-black focus:ring-2 focus:ring-indigo-400 outline-none" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest border-b border-rose-50 pb-1">Holidays (Selected)</h4>
              <div className="flex items-center justify-between p-3 bg-rose-50/40 rounded-xl border border-dotted border-rose-200">
                <span className="font-bold text-rose-800 text-sm">Morning (Shift 1)</span>
                <input 
                  type="number" 
                  value={getValue('minMorningHoliday', 'haMinMorningHoliday')} 
                  onChange={(e) => handleValueChange('minMorningHoliday', 'haMinMorningHoliday', parseInt(e.target.value) || 0)}
                  className="w-14 p-2 bg-white border border-rose-200 rounded-lg text-center font-black focus:ring-2 focus:ring-rose-400 outline-none" 
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-rose-50/40 rounded-xl border border-dotted border-rose-200">
                <span className="font-bold text-rose-800 text-sm">Evening (Shift 2)</span>
                <input 
                  type="number" 
                  value={getValue('minEveningHoliday', 'haMinEveningHoliday')} 
                  onChange={(e) => handleValueChange('minEveningHoliday', 'haMinEveningHoliday', parseInt(e.target.value) || 0)}
                  className="w-14 p-2 bg-white border border-rose-200 rounded-lg text-center font-black focus:ring-2 focus:ring-rose-400 outline-none" 
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-rose-50/40 rounded-xl border border-dotted border-rose-200">
                <span className="font-bold text-rose-800 text-sm">Night (Shift 3)</span>
                <input 
                  type="number" 
                  value={getValue('minNightHoliday', 'haMinNightHoliday')} 
                  onChange={(e) => handleValueChange('minNightHoliday', 'haMinNightHoliday', parseInt(e.target.value) || 0)}
                  className="w-14 p-2 bg-white border border-rose-200 rounded-lg text-center font-black focus:ring-2 focus:ring-rose-400 outline-none" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl border border-slate-800 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <ICONS.CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest">Advanced Rule Engine ({isHAActive ? 'MSA Staff' : 'Regular Staff'})</h3>
            <p className="text-xs text-slate-400 font-medium">Constraints and sequence rules enforced across all roster generators</p>
          </div>
        </div>

        {/* Sequence Rules (Shift After Previous Day) Card */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <ICONS.Sparkles size={18} />
              </span>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-100">Sequence Rules (Shift After Previous Day)</h4>
                <p className="text-xs text-slate-400 font-medium">Strict forward rotation limits preventing rest-breaking backward shifts</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
              Strict Enforcement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-200">Morning Shift (1)</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">Shift Code 1</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Allowed only after previous day shift is:</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black rounded-lg">"W" (Off)</span>
                <span className="px-2 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black rounded-lg">"L" (Leave)</span>
                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-black rounded-lg">"1" (Morning)</span>
              </div>
              <div className="text-[10px] text-red-400 font-semibold pt-1 border-t border-slate-800">
                ❌ Blocked after Evening (2) or Night (3)
              </div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-200">Evening Shift (2)</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">Shift Code 2</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Allowed only after previous day shift is:</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black rounded-lg">"W" (Off)</span>
                <span className="px-2 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black rounded-lg">"L" (Leave)</span>
                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-black rounded-lg">"1" (Morning)</span>
                <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-black rounded-lg">"2" (Evening)</span>
              </div>
              <div className="text-[10px] text-red-400 font-semibold pt-1 border-t border-slate-800">
                ❌ Blocked after Night (3)
              </div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-200">Night Shift (3)</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">Shift Code 3</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Allowed after previous day shift is:</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black rounded-lg">"W" (Off)</span>
                <span className="px-2 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black rounded-lg">"L" (Leave)</span>
                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-black rounded-lg">"1"</span>
                <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-black rounded-lg">"2"</span>
                <span className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-black rounded-lg">"3"</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                ✓ Full rotation transition permitted
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            {isHAActive ? (
              <div className="bg-slate-800/50 p-4 border border-slate-800 rounded-2xl flex flex-col justify-center h-[90px]">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Seniority Requirements</span>
                <span className="text-xs font-bold text-slate-400 mt-1 uppercase">Not considered for MSA Staff</span>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Seniors per Shift</label>
                <input 
                  type="number" 
                  value={getValue('minSenior', 'haMinSenior')} 
                  onChange={(e) => handleValueChange('minSenior', 'haMinSenior', parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-white" 
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Total Consecutive Days</label>
              <input 
                type="number" 
                value={getValue('maxConsecutiveDuty', 'haMaxConsecutiveDuty')} 
                onChange={(e) => handleValueChange('maxConsecutiveDuty', 'haMaxConsecutiveDuty', parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-white" 
              />
            </div>
          </div>
          <div className="space-y-6">
            {isHAActive ? (
              <div className="bg-slate-800/50 p-4 border border-slate-800 rounded-2xl flex flex-col justify-center h-[90px]">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gender Balance Rules</span>
                <span className="text-xs font-bold text-slate-400 mt-1 uppercase">Not considered for MSA Staff</span>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Male Staff per Shift</label>
                <input 
                  type="number" 
                  value={getValue('maxMale', 'haMaxMale')} 
                  onChange={(e) => handleValueChange('maxMale', 'haMaxMale', parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-white" 
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Max Caring Hours Staff per Shift</label>
              <input 
                type="number" 
                value={getValue('maxCaringHoursPerShift', 'haMaxCaringHoursPerShift') ?? 2} 
                onChange={(e) => handleValueChange('maxCaringHoursPerShift', 'haMaxCaringHoursPerShift', parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-slate-800 border border-pink-500/50 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-black text-pink-300" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Off Days After Night</label>
              <input 
                type="number" 
                value={getValue('offAfterNight', 'haOffAfterNight')} 
                onChange={(e) => handleValueChange('offAfterNight', 'haOffAfterNight', parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Max Off Days Per Month</label>
              <input 
                type="number" 
                value={getValue('maxOffPerMonth', 'haMaxOffPerMonth') ?? 10} 
                onChange={(e) => handleValueChange('maxOffPerMonth', 'haMaxOffPerMonth', parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-slate-800 border border-emerald-500/50 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-emerald-300" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition shadow-xl flex items-center gap-3">
          <ICONS.Save size={24} />
          Save Global Config
        </button>
      </div>
    </div>
  );
};

export default RulesManager;
