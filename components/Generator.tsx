import React, { useState } from 'react';
import { StaffMember, RosterConfig, Assignment } from '../types';
import { ICONS } from '../constants';
import { generateRoster } from '../services/geminiService';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
  staff: StaffMember[];
  config: RosterConfig;
  assignments: Assignment[];
  onGenerate: (newAssignments: Assignment[]) => void;
  onComplete: () => void;
  onUpdateConfig?: (newConfig: RosterConfig) => void;
  currentUserRole?: string;
}

const Generator: React.FC<Props> = ({ 
  staff, 
  config, 
  assignments, 
  onGenerate, 
  onComplete,
  onUpdateConfig,
  currentUserRole 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentIdx = MONTHS.indexOf(config.month);
  const validIdx = currentIdx === -1 ? 11 : currentIdx;
  const nextMonthInfo = validIdx === 11 
    ? { month: 'January', year: config.year + 1, monthIdx: 0 }
    : { month: MONTHS[validIdx + 1], year: config.year, monthIdx: validIdx + 1 };

  const defaultDeployDate = config.nextMonthDeployDate || `${config.year}-${(validIdx + 1).toString().padStart(2, '0')}-25`;

  const [targetPeriod, setTargetPeriod] = useState<'current' | 'next'>('next');
  const [deployDate, setDeployDate] = useState<string>(defaultDeployDate);
  const [autoDeploy, setAutoDeploy] = useState<boolean>(!!config.isNextMonthDeployed);

  const targetMonth = targetPeriod === 'next' ? nextMonthInfo.month : config.month;
  const targetYear = targetPeriod === 'next' ? nextMonthInfo.year : config.year;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const targetConfig: RosterConfig = {
        ...config,
        month: targetMonth,
        year: targetYear,
        nextMonthDeployDate: targetPeriod === 'next' ? deployDate : config.nextMonthDeployDate,
        isNextMonthDeployed: targetPeriod === 'next' ? (autoDeploy || !!config.isNextMonthDeployed) : config.isNextMonthDeployed
      };

      const newGenerated = await generateRoster(staff, targetConfig, assignments);

      // Merge generated assignments cleanly with existing assignments from other months
      const targetMonthIdx = MONTHS.indexOf(targetMonth);
      const targetPrefix = `${targetYear}-${(targetMonthIdx + 1).toString().padStart(2, '0')}-`;
      const otherAssignments = assignments.filter(a => !a.date.startsWith(targetPrefix));
      const combined = [...otherAssignments, ...newGenerated];

      onGenerate(combined);
      if (onUpdateConfig) {
        onUpdateConfig(targetConfig);
      }

      setSuccessMessage(
        targetPeriod === 'next'
          ? `Successfully generated Next Month (${targetMonth} ${targetYear}) Duty Schedule! ${autoDeploy ? 'Roster is now DEPLOYED to all staff.' : `Scheduled to automatically deploy to staff on ${deployDate}.`}`
          : `Successfully generated Current Month (${targetMonth} ${targetYear}) Duty Schedule!`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to generate schedule. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickDeployToggle = () => {
    const newDeployedState = !config.isNextMonthDeployed;
    const updated: RosterConfig = {
      ...config,
      nextMonthDeployDate: deployDate,
      isNextMonthDeployed: newDeployedState
    };
    if (onUpdateConfig) {
      onUpdateConfig(updated);
    }
    setAutoDeploy(newDeployedState);
  };

  return (
    <div className="space-y-8">
      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <ICONS.Sparkles className="text-amber-500" size={24} />
              AI Schedule Generator & Deployment Manager
            </h2>
            <p className="text-sm text-gray-500">
              Generate optimized monthly duty schedules and control specified deployment dates for staff release.
            </p>
          </div>

          {currentUserRole === 'ward_supervisor' && (
            <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-full uppercase tracking-wider self-start md:self-auto">
              WS Exclusive Control
            </span>
          )}
        </div>

        {/* Target Month Selector Tabs */}
        <div className="p-6 bg-slate-50 border-b border-gray-100 space-y-4">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider block">
            1. Select Target Schedule Generation Period
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setTargetPeriod('next')}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 border shadow-2xs ${
                targetPeriod === 'next'
                  ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <ICONS.Sparkles size={16} className={targetPeriod === 'next' ? 'text-amber-300' : 'text-indigo-500'} />
              <span>Next Month ({nextMonthInfo.month} {nextMonthInfo.year})</span>
              <span className="px-2 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-black rounded-md uppercase">
                Recommended
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTargetPeriod('current')}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 border shadow-2xs ${
                targetPeriod === 'current'
                  ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <ICONS.CalendarIcon size={16} />
              <span>Current Month ({config.month} {config.year})</span>
            </button>
          </div>
        </div>

        {/* Specified Deployment Settings Card for Next Month */}
        {targetPeriod === 'next' && (
          <div className="mx-6 mt-6 p-5 bg-amber-50/80 border-2 border-amber-200 rounded-2xl space-y-4 text-amber-950">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ICONS.ShieldCheck size={20} className="text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950">
                    Next Month ({nextMonthInfo.month} {nextMonthInfo.year}) Specified Deployment Settings
                  </h4>
                  <p className="text-xs text-amber-800">
                    Specify the date when regular staff and HAs can view their generated duty schedule.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {config.isNextMonthDeployed ? (
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto shadow-2xs">
                  <ICONS.CheckCircle2 size={14} /> Deployed & Visible to Staff
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto">
                  <ICONS.Lock size={14} /> Scheduled Deployment
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-200">
              <div>
                <label className="text-[11px] font-black uppercase text-amber-900 block mb-1">
                  Specified Deployment / Release Date
                </label>
                <input
                  type="date"
                  value={deployDate}
                  onChange={(e) => setDeployDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[10px] text-amber-800 mt-1 italic">
                  Regular staff can access next month's duty on or after this specified date.
                </p>
              </div>

              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <input
                    type="checkbox"
                    checked={autoDeploy}
                    onChange={(e) => setAutoDeploy(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-950">
                    Deploy / Release Immediately Upon Generation
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleQuickDeployToggle}
                  className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition border shadow-2xs flex items-center justify-center gap-1.5 ${
                    config.isNextMonthDeployed
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  }`}
                >
                  <ICONS.Sparkles size={14} />
                  {config.isNextMonthDeployed ? 'Re-Lock / Convert to Scheduled Date' : 'Deploy Schedule to Staff Right Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Total Active Ward Staff</span>
            <div className="text-3xl font-black mt-1 text-slate-800">{staff.length}</div>
          </div>
          <div className="bg-indigo-50/60 p-6 rounded-2xl border border-indigo-100">
            <span className="text-xs text-indigo-600 uppercase font-bold tracking-wider block">Target Schedule Period</span>
            <div className="text-3xl font-black mt-1 text-indigo-950">{targetMonth} {targetYear}</div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Min Morning Staff / Shift</span>
            <div className="text-3xl font-black mt-1 text-slate-800">{config.minMorning}</div>
          </div>
        </div>

        {/* AI Features Checklist */}
        <div className="p-6 space-y-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">AI Scheduler Rules & Logic:</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Preserves all manually entered duties as fixed anchors",
              "Enforces sequence rules (Morning after W/L/1, Evening after W/L/1/2, Night after W/L/1/2/3)",
              "Ensures minimum staffing per shift (Morning, Evening, Night)",
              "Respects senior staff and gender balance quotas",
              "Limits consecutive evening/night shifts & forces recovery days",
              "Supports Next Month Duty generation and specified release date controls"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <ICONS.CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <ICONS.CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={onComplete}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition shrink-0"
            >
              View Calendar Roster
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="p-6 bg-slate-100 border-t border-slate-200">
          <button 
            disabled={isGenerating}
            onClick={handleGenerate}
            className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-black text-base transition-all shadow-md ${
              isGenerating 
                ? 'bg-slate-400 cursor-not-allowed text-white' 
                : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Generating {targetMonth} {targetYear} Duty Schedule...</span>
              </>
            ) : (
              <>
                <ICONS.Sparkles size={20} className="text-amber-400" />
                <span>Generate AI Duty Schedule for {targetMonth} {targetYear}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Generator;
