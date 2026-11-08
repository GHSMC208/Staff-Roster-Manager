import React, { useState } from 'react';
import { StaffMember, RosterConfig, Assignment } from '../types';
import { ICONS } from '../constants';
import { generateRoster } from '../services/geminiService';
import { generateLocalRoster, SolverResult } from '../services/localScheduleSolver';
import { 
  Cpu, 
  Sparkles, 
  Key, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Clock, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Info
} from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export type GenerationEngine = 'local' | 'api';

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
  const [engine, setEngine] = useState<GenerationEngine>('local');
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    return localStorage.getItem('hospital_gemini_api_key') || '';
  });
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastStats, setLastStats] = useState<SolverResult['stats'] | null>(null);

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

  const handleApiKeyChange = (val: string) => {
    setApiKeyInput(val);
    if (val.trim()) {
      localStorage.setItem('hospital_gemini_api_key', val.trim());
    } else {
      localStorage.removeItem('hospital_gemini_api_key');
    }
  };

  const handleGenerate = async (forcedEngine?: GenerationEngine) => {
    const selectedEngine = forcedEngine || engine;
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    setLastStats(null);

    try {
      const targetConfig: RosterConfig = {
        ...config,
        month: targetMonth,
        year: targetYear,
        nextMonthDeployDate: targetPeriod === 'next' ? deployDate : config.nextMonthDeployDate,
        isNextMonthDeployed: targetPeriod === 'next' ? (autoDeploy || !!config.isNextMonthDeployed) : config.isNextMonthDeployed
      };

      let newGenerated: Assignment[] = [];

      if (selectedEngine === 'local') {
        // Fast local rule-based solver
        const result = generateLocalRoster(staff, targetConfig, assignments);
        newGenerated = result.assignments;
        setLastStats(result.stats);
      } else {
        // Gemini AI API generation
        newGenerated = await generateRoster(staff, targetConfig, assignments, apiKeyInput);
      }

      // Merge generated assignments cleanly with existing assignments from other months
      const targetMonthIdx = MONTHS.indexOf(targetMonth);
      const targetPrefix = `${targetYear}-${(targetMonthIdx + 1).toString().padStart(2, '0')}-`;
      const otherAssignments = assignments.filter(a => !a.date.startsWith(targetPrefix));
      const combined = [...otherAssignments, ...newGenerated];

      onGenerate(combined);
      if (onUpdateConfig) {
        onUpdateConfig(targetConfig);
      }

      const engineName = selectedEngine === 'local' ? 'Local System Solver' : 'Gemini AI Engine';
      setSuccessMessage(
        targetPeriod === 'next'
          ? `Successfully generated Next Month (${targetMonth} ${targetYear}) schedule using ${engineName}! ${autoDeploy ? 'Roster is now deployed to staff.' : `Scheduled to deploy on ${deployDate}.`}`
          : `Successfully generated Current Month (${targetMonth} ${targetYear}) schedule using ${engineName}!`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to generate schedule. Please check your configuration and try again.');
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
      <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-sm">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Sparkles className="text-amber-500" size={24} />
              Schedule Generator & Deployment Hub
            </h2>
            <p className="text-sm text-slate-500">
              Choose between the built-in Local System Solver (no API key required) or the Gemini Cloud AI Engine.
            </p>
          </div>

          {currentUserRole === 'ward_supervisor' && (
            <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 text-xs font-black rounded-xl uppercase tracking-wider self-start md:self-auto">
              WS Supervisor Control
            </span>
          )}
        </div>

        {/* Engine Selection: Local vs API Key */}
        <div className="p-6 bg-slate-50/70 border-b border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase text-slate-600 tracking-wider block">
              1. Select Generation Method
            </label>
            <span className="text-xs text-slate-500 font-medium">Both methods preserve all manual entries and requests</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: Local System Generation */}
            <div 
              onClick={() => setEngine('local')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                engine === 'local'
                  ? 'border-indigo-600 bg-white ring-4 ring-indigo-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-xl ${engine === 'local' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <Cpu size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Local System Generation</h4>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Zap size={12} /> Instant • 100% Offline • No API Key Needed
                      </span>
                    </div>
                  </div>

                  <input
                    type="radio"
                    name="generation_engine"
                    checked={engine === 'local'}
                    onChange={() => setEngine('local')}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Runs directly on your computer in milliseconds. Algorithmically solves headcount minimums, sequence rules, mandatory rest after nights, and senior distribution.
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>Zero quota limits • Works anytime without internet</span>
              </div>
            </div>

            {/* Option B: Gemini Cloud AI Generation */}
            <div 
              onClick={() => setEngine('api')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                engine === 'api'
                  ? 'border-indigo-600 bg-white ring-4 ring-indigo-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-xl ${engine === 'api' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Gemini Cloud AI (API Key)</h4>
                      <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                        <Key size={12} /> Google Gemini AI Reasoning
                      </span>
                    </div>
                  </div>

                  <input
                    type="radio"
                    name="generation_engine"
                    checked={engine === 'api'}
                    onChange={() => setEngine('api')}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Connects to Google Gemini API using an API key. Employs deep reasoning models to synthesize complex multi-variable nurse scheduling and constraint trade-offs.
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                <CheckCircle2 size={13} className="text-indigo-500" />
                <span>Uses environment key or your custom Gemini API key</span>
              </div>
            </div>
          </div>

          {/* Optional API Key Input for Cloud AI Mode */}
          {engine === 'api' && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Key size={14} className="text-indigo-600" />
                  <span>Custom Google Gemini API Key (Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showApiKey ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Leave blank to use system environment key, or paste AI Studio API key..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500">
                If left blank, the generator uses the pre-configured system key (<code className="text-slate-700">process.env.GEMINI_API_KEY</code>).
              </p>
            </div>
          )}
        </div>

        {/* Target Month Selector Tabs */}
        <div className="p-6 bg-white border-b border-slate-100 space-y-3">
          <label className="text-xs font-black uppercase text-slate-600 tracking-wider block">
            2. Select Target Schedule Period
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setTargetPeriod('next')}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 border shadow-2xs cursor-pointer ${
                targetPeriod === 'next'
                  ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Sparkles size={16} className={targetPeriod === 'next' ? 'text-amber-300' : 'text-indigo-500'} />
              <span>Next Month ({nextMonthInfo.month} {nextMonthInfo.year})</span>
              <span className="px-2 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-black rounded-md uppercase">
                Recommended
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTargetPeriod('current')}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 border shadow-2xs cursor-pointer ${
                targetPeriod === 'current'
                  ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <CalendarIcon size={16} />
              <span>Current Month ({config.month} {config.year})</span>
            </button>
          </div>
        </div>

        {/* Specified Deployment Settings Card for Next Month */}
        {targetPeriod === 'next' && (
          <div className="mx-6 mt-6 p-5 bg-amber-50/80 border-2 border-amber-200 rounded-2xl space-y-4 text-amber-950">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950">
                    Next Month ({nextMonthInfo.month} {nextMonthInfo.year}) Specified Deployment Settings
                  </h4>
                  <p className="text-xs text-amber-800">
                    Specify the date when regular staff and MSAs can view their generated duty schedule.
                  </p>
                </div>
              </div>

              {config.isNextMonthDeployed ? (
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto shadow-2xs">
                  <CheckCircle2 size={14} /> Deployed & Visible to Staff
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto">
                  <Clock size={14} /> Scheduled Deployment
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
                  className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition border shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    config.isNextMonthDeployed
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  }`}
                >
                  <Sparkles size={14} />
                  {config.isNextMonthDeployed ? 'Re-Lock / Convert to Scheduled Date' : 'Deploy Schedule to Staff Right Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Active Ward Staff</span>
            <div className="text-2xl font-black mt-1 text-slate-800">{staff.length}</div>
          </div>
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
            <span className="text-xs text-indigo-600 uppercase font-bold tracking-wider block">Target Period</span>
            <div className="text-2xl font-black mt-1 text-indigo-950">{targetMonth} {targetYear}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Min Morning Staff</span>
            <div className="text-2xl font-black mt-1 text-slate-800">{config.minMorning}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Active Engine</span>
            <div className="text-base font-black mt-2 text-indigo-700 flex items-center gap-1.5">
              {engine === 'local' ? <Cpu size={16} /> : <Sparkles size={16} />}
              <span>{engine === 'local' ? 'Local System' : 'Gemini AI'}</span>
            </div>
          </div>
        </div>

        {/* Rules & Logic Checklist */}
        <div className="p-6 space-y-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Clinical Constraint Logic:</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {[
              "Preserves all manually entered duties and requests (R1, R2, R3, RW, L, P, H) as fixed anchors",
              "Enforces sequence rules: Morning only after W/L/P/1; Evening only after W/L/P/1/2; Night after any shift",
              "Ensures minimum staffing per shift (Morning, Evening, Night for Weekdays, Weekends, Holidays)",
              "Enforces mandatory recovery days (Off) following any Night shift series",
              "Limits maximum consecutive night/evening shifts and maximum consecutive duty days",
              "Maintains senior nurse coverage and respects caring hours limits per shift"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Error Notice with Fallback to Local Engine */}
        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <div className="text-xs font-bold text-red-900 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            {engine === 'api' && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEngine('local');
                    handleGenerate('local');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Cpu size={14} />
                  <span>Generate with Local System Instead (Instant & Free)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Notice with Statistics */}
        {successMessage && (
          <div className="mx-6 mb-6 p-5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <span className="font-extrabold text-sm text-emerald-900">{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={onComplete}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm active:scale-95"
              >
                <span>View Roster Schedule</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {lastStats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-emerald-200/80 text-xs">
                <div className="p-2 bg-white/80 rounded-lg">
                  <div className="text-slate-500 text-[10px] font-bold uppercase">Total Duties</div>
                  <div className="font-black text-slate-800 text-base">{lastStats.totalAssigned}</div>
                </div>
                <div className="p-2 bg-white/80 rounded-lg">
                  <div className="text-slate-500 text-[10px] font-bold uppercase">Morning (M)</div>
                  <div className="font-black text-blue-700 text-base">{lastStats.morningCount}</div>
                </div>
                <div className="p-2 bg-white/80 rounded-lg">
                  <div className="text-slate-500 text-[10px] font-bold uppercase">Evening (E)</div>
                  <div className="font-black text-amber-700 text-base">{lastStats.eveningCount}</div>
                </div>
                <div className="p-2 bg-white/80 rounded-lg">
                  <div className="text-slate-500 text-[10px] font-bold uppercase">Night (N)</div>
                  <div className="font-black text-indigo-900 text-base">{lastStats.nightCount}</div>
                </div>
                <div className="p-2 bg-white/80 rounded-lg">
                  <div className="text-slate-500 text-[10px] font-bold uppercase">Off (W) Days</div>
                  <div className="font-black text-emerald-700 text-base">{lastStats.offCount}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="p-6 bg-slate-100 border-t border-slate-200">
          <button 
            disabled={isGenerating}
            onClick={() => handleGenerate()}
            className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer ${
              isGenerating 
                ? 'bg-slate-400 cursor-not-allowed text-white' 
                : engine === 'local'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.99] shadow-indigo-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Generating {targetMonth} {targetYear} Duty Schedule ({engine === 'local' ? 'Local Engine' : 'Gemini AI'})...</span>
              </>
            ) : (
              <>
                {engine === 'local' ? <Cpu size={18} /> : <Sparkles size={18} className="text-amber-400" />}
                <span>
                  Generate with {engine === 'local' ? 'Local System' : 'Gemini AI'} for {targetMonth} {targetYear}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Generator;
