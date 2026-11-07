import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, User } from 'lucide-react';
import { StaffMember, RosterConfig, Assignment, ShiftType, ThemeType } from '../types';
import { ICONS, MONTHS, THEME_SHIFT_STYLES } from '../constants';

interface Props {
  staff: StaffMember[];
  config: RosterConfig;
  assignments: Assignment[];
  onBack?: () => void;
  appTheme?: ThemeType;
  showBackButton?: boolean;
}

type CardColorMode = 'ClassicRetro' | 'AppTheme';
type CardsPerPage = '1' | '2' | 'continuous';

const StaffCardsView: React.FC<Props> = ({ 
  staff, 
  config, 
  assignments, 
  onBack,
  appTheme = 'Professional',
  showBackButton = false
}) => {
  // Customizable fields
  const [rosterTitle, setRosterTitle] = useState<string>(() => config.wardName || '208CCU');
  const [footerText, setFooterText] = useState<string>(() => config.wardName ? `Done By ${config.wardName}` : 'Done By 208 CCU');
  const [colorMode, setColorMode] = useState<CardColorMode>('ClassicRetro');
  const [cardsPerPage, setCardsPerPage] = useState<CardsPerPage>('1');

  // Sync with central wardName when it changes
  useEffect(() => {
    if (config.wardName) {
      setRosterTitle(config.wardName);
      setFooterText(`Done By ${config.wardName}`);
    }
  }, [config.wardName]);
  
  // Selection / Filter states
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(
    staff.map(s => s.id)
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Date constants and math
  const monthIdx = useMemo(() => {
    const idx = MONTHS.indexOf(config.month);
    return idx === -1 ? 0 : idx;
  }, [config.month]);

  const shortMonthName = useMemo(() => {
    return config.month.substring(0, 3);
  }, [config.month]);

  const daysInMonth = useMemo(() => {
    return new Date(config.year, monthIdx + 1, 0).getDate();
  }, [config.year, monthIdx]);

  const startDayOfWeek = useMemo(() => {
    return new Date(config.year, monthIdx, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  }, [config.year, monthIdx]);

  // Calendar grid template structure
  const gridCellsTemplate = useMemo(() => {
    const paddingBefore = Array.from({ length: startDayOfWeek }, (_, i) => ({
      isPadding: true,
      dayNum: null,
      dateStr: null
    }));

    const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = `${config.year}-${(monthIdx + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
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
  }, [config.year, monthIdx, daysInMonth, startDayOfWeek]);

  // Filtering staff list based on search
  const filteredStaff = useMemo(() => {
    return staff.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staff, searchQuery]);

  // Quick selection helpers
  const handleSelectAll = () => setSelectedStaffIds(staff.map(s => s.id));
  const handleSelectNone = () => setSelectedStaffIds([]);
  const handleSelectSeniors = () => setSelectedStaffIds(staff.filter(s => s.isSenior).map(s => s.id));
  const handleSelectJuniors = () => setSelectedStaffIds(staff.filter(s => !s.isSenior).map(s => s.id));

  const toggleStaffSelection = (id: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // Get active staff list to render cards for
  const staffToRender = useMemo(() => {
    return staff.filter(s => selectedStaffIds.includes(s.id));
  }, [staff, selectedStaffIds]);

  // Styles dynamically defined for print layouts and colors
  const printConfigStyle = useMemo(() => {
    let pagingRule = '';
    if (cardsPerPage === '1') {
      pagingRule = `
        .print-cards-container {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 100% !important;
        }
        .print-card-item {
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
      `;
    } else if (cardsPerPage === '2') {
      pagingRule = `
        .print-cards-container {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 40px !important;
          width: 100% !important;
        }
        .print-card-item {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          display: flex !important;
          justify-content: center !important;
        }
        .print-card-item:nth-child(2n) {
          page-break-after: always !important;
          break-after: page !important;
        }
      `;
    } else {
      // Continuous grid: fits 2 cards side-by-side perfectly on portrait page!
      pagingRule = `
        .print-cards-container {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 20px !important;
          width: 100% !important;
        }
        .print-card-item {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          display: flex !important;
          justify-content: center !important;
        }
      `;
    }

    return `
      @media print {
        @page {
          size: portrait !important;
          margin: 15mm 15mm 15mm 15mm !important;
        }
        body {
          background: white !important;
          color: black !important;
        }
        .no-print {
          display: none !important;
        }
        ${pagingRule}
      }
    `;
  }, [cardsPerPage]);

  return (
    <div className="space-y-6">
      {/* Dynamic style tag for precise printer configuration */}
      <style dangerouslySetInnerHTML={{ __html: printConfigStyle }} />

      {/* Header and main actions bar */}
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
            <span className="p-1 bg-amber-500 text-white rounded-lg flex items-center justify-center">
              <ICONS.Plus size={16} className="rotate-45" />
            </span>
            Staff Duty Cards
          </h2>
          <p className="text-xs text-gray-500 font-medium">Generate, customize, and print high-fidelity individual calendar cards</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handlePrint}
            disabled={staffToRender.length === 0}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition font-black text-xs shadow-md uppercase tracking-wider ${
              staffToRender.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ICONS.Printer size={14} />
            Print Cards ({staffToRender.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
        {/* Left column: Selection Controls & Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card customization settings */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
              <ICONS.Settings size={14} />
              Card Settings
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Roster Code (Top-Right)</label>
                <input 
                  type="text"
                  maxLength={12}
                  value={rosterTitle}
                  onChange={(e) => setRosterTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 208CCU"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Footer Text</label>
                <input 
                  type="text"
                  maxLength={40}
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Done By 208 CCU"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Color Theme</label>
                <select
                  value={colorMode}
                  onChange={(e) => setColorMode(e.target.value as CardColorMode)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ClassicRetro">High-Contrast B&W (Retro)</option>
                  <option value="AppTheme">Current App Theme ({appTheme})</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Print Layout Paging</label>
                <select
                  value={cardsPerPage}
                  onChange={(e) => setCardsPerPage(e.target.value as CardsPerPage)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="1">1 Card per Page (A4 Portrait)</option>
                  <option value="2">2 Cards per Page (A4 Portrait)</option>
                  <option value="continuous">Continuous Flow (Grid)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Staff members filtering & selection */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <ICONS.Users size={14} />
                Staff Members
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-black">
                {selectedStaffIds.length} Selected
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
                onClick={handleSelectSeniors}
                className="py-1 px-2 text-[10px] font-black border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase text-indigo-600"
              >
                Seniors
              </button>
              <button 
                onClick={handleSelectJuniors}
                className="py-1 px-2 text-[10px] font-black border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase text-amber-600"
              >
                Juniors
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input 
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-400 outline-none"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400">
                <ICONS.Users size={12} />
              </span>
            </div>

            {/* Staff list checkboxes */}
            <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
              {filteredStaff.length === 0 ? (
                <p className="text-[10px] text-gray-400 text-center py-4 font-bold">No matching staff found</p>
              ) : (
                filteredStaff.map(member => {
                  const isChecked = selectedStaffIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleStaffSelection(member.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition-all text-xs font-bold ${
                        isChecked 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 shadow-sm'
                          : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-gray-200 shrink-0" />
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${member.isSenior ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                        )}
                        <span>{member.name || `Staff ${member.id}`}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">{member.id}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: Interactive Roster Cards Grid Container */}
        <div className="lg:col-span-3 space-y-6">
          {staffToRender.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 text-center space-y-4">
              <div className="p-3 bg-rose-50 text-rose-500 rounded-full animate-bounce">
                <ICONS.Users size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-gray-800 text-sm">No Staff Selected</h4>
                <p className="text-xs text-gray-400 max-w-sm">Please select at least one staff member from the left sidebar to generate their roster cards.</p>
              </div>
              <button 
                onClick={handleSelectAll}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-black text-xs uppercase"
              >
                Select All Staff
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
              {staffToRender.map(member => (
                <div 
                  key={member.id}
                  className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm relative hover:shadow-md transition-shadow w-full max-w-[264px] flex flex-col items-center"
                >
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5 no-print z-20">
                    <button
                      onClick={() => toggleStaffSelection(member.id)}
                      className="p-1.5 bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition border border-gray-100"
                      title="Hide Card"
                    >
                      <ICONS.Trash2 size={12} />
                    </button>
                  </div>

                  {/* Render the core card */}
                  <div className="print-card-item pt-4 w-full flex justify-center">
                    <CardLayout 
                      member={member}
                      config={config}
                      rosterTitle={rosterTitle}
                      footerText={footerText}
                      colorMode={colorMode}
                      appTheme={appTheme}
                      gridCells={gridCellsTemplate}
                      assignments={assignments}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Printable Area - Hidden on screen, shown strictly during printing */}
      <div className="hidden print:block print-cards-container">
        {staffToRender.map(member => (
          <div key={member.id} className="print-card-item">
            <CardLayout 
              member={member}
              config={config}
              rosterTitle={rosterTitle}
              footerText={footerText}
              colorMode={colorMode}
              appTheme={appTheme}
              gridCells={gridCellsTemplate}
              assignments={assignments}
              isPrint={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/* Core card component that renders the classic high-contrast calendar grid */
export interface CardLayoutProps {
  member: StaffMember;
  config: RosterConfig;
  rosterTitle: string;
  footerText: string;
  colorMode: CardColorMode;
  appTheme: ThemeType;
  gridCells: Array<{ isPadding: boolean; dayNum: number | null; dateStr: string | null }>;
  assignments: Assignment[];
  isPrint?: boolean;
}

export const CardLayout: React.FC<CardLayoutProps> = ({
  member,
  config,
  rosterTitle,
  footerText,
  colorMode,
  appTheme,
  gridCells,
  assignments,
  isPrint = false
}) => {
  const monthIdx = MONTHS.indexOf(config.month);
  const shortMonthName = config.month.substring(0, 3);

  // Style class maps
  const isRetro = colorMode === 'ClassicRetro';

  // Card theme classes
  const outerBorderClass = isRetro 
    ? 'border-[3px] border-black bg-white text-black rounded-xl shadow-none'
    : appTheme === 'Night' 
      ? 'border border-slate-700 bg-slate-950 text-slate-100 shadow-md rounded-2xl'
      : 'border border-slate-200 bg-white text-slate-800 shadow-md rounded-2xl';

  return (
    <div className={`${outerBorderClass} w-[240px] h-[180px] overflow-hidden select-none flex p-1.5 relative font-sans`}>
      {/* CALENDAR SCHEDULE GRID */}
      <div className="flex-1 h-full flex flex-col justify-between p-1">
        
        {/* Calendar Title with Staff Member Name and Seniority */}
        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800/80 pb-1">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="flex flex-col text-left overflow-hidden">
              {(() => {
                const isHa = member.name.trim().startsWith('HA') || member.name.trim().startsWith('(HA)') || member.name.trim().startsWith('MSA') || member.name.trim().startsWith('(MSA)') || !!member.isHa;
                return (
                  <span className={`text-[10px] font-black uppercase tracking-tight leading-none truncate max-w-[130px] ${isHa ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {member.name || 'Anonymous'}
                  </span>
                );
              })()}
              <span className="text-[6px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-0.5 flex items-center gap-1 truncate">
                <span>{member.jobTitle ? member.jobTitle : (member.name.trim().startsWith('HA') || member.name.trim().startsWith('(HA)') || member.name.trim().startsWith('MSA') || member.name.trim().startsWith('(MSA)') || !!member.isHa ? 'MSA Staff' : (member.isSenior ? 'Senior' : 'Junior'))} • {config.month}</span>
                {!member.isMale && member.hasCaringHours && (
                  <span className="text-pink-600 font-extrabold text-[5.5px] bg-pink-50 dark:bg-pink-950/60 px-1 py-0.2 rounded border border-pink-200 dark:border-pink-800 shrink-0">
                    Caring
                  </span>
                )}
              </span>
            </div>
          </div>
          <span className="text-[6.5px] font-black px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 rounded uppercase tracking-widest font-mono shrink-0">
            {rosterTitle || 'DUTY'}
          </span>
        </div>

        {/* Calendar Weekdays Row */}
        <div className="grid grid-cols-7 text-[7px] font-black uppercase text-center text-slate-400 dark:text-slate-500 border-b border-slate-200/50 dark:border-slate-800/50 py-0.5">
          <span>S</span>
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span className="text-amber-500 dark:text-amber-400 font-extrabold">F</span>
          <span className="text-amber-500 dark:text-amber-400 font-extrabold">S</span>
        </div>

        {/* 7-Column Grid Cells */}
        <div className="grid grid-cols-7 gap-[1px] bg-slate-200/60 dark:bg-slate-800/60 rounded overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
          {gridCells.map((cell, idx) => {
            const isPadding = cell.isPadding;

            if (isPadding || !cell.dateStr) {
              const cellBgClass = isRetro
                ? 'bg-white'
                : 'bg-transparent';
              return (
                <div 
                  key={`padding-${idx}`} 
                  className={`${cellBgClass} h-[15.5px]`}
                />
              );
            }

            // Find current assignment
            const assignment = assignments.find(
              a => a.staffId === member.id && a.date === cell.dateStr
            );
            const shiftCode = assignment ? assignment.shift : '';

            // Formatting backgrounds for retro vs colored theme
            let cellBg = 'bg-white dark:bg-slate-950';
            let shiftTextColor = 'text-slate-800 dark:text-slate-100';
            let dayNumColor = 'text-slate-400 dark:text-slate-500';

            const isWeekend = (idx % 7 === 5) || (idx % 7 === 6); // Fri or Sat
            const isHoliday = config.holidays?.includes(cell.dateStr);

            if (isRetro) {
              if (shiftCode === ShiftType.Off || shiftCode === ShiftType.RequestedOff) {
                cellBg = 'bg-gray-200 font-bold';
              } else if (isHoliday) {
                cellBg = 'bg-rose-100 font-bold';
              } else if (isWeekend) {
                cellBg = 'bg-amber-100 font-bold';
              }
            } else {
              if (shiftCode && shiftCode !== ShiftType.None) {
                const shiftStyles = THEME_SHIFT_STYLES[appTheme][shiftCode as ShiftType];
                if (shiftStyles) {
                  cellBg = shiftStyles.bg;
                  shiftTextColor = shiftStyles.color;
                } else {
                  cellBg = 'bg-slate-100 dark:bg-slate-800';
                }

                if (isHoliday) {
                  cellBg += ' ring-1 ring-inset ring-rose-500/50';
                } else if (isWeekend) {
                  cellBg += ' ring-1 ring-inset ring-amber-500/30';
                }
              } else {
                if (isHoliday) {
                  cellBg = 'bg-rose-50/50 dark:bg-rose-950/20';
                  dayNumColor = 'text-rose-500 dark:text-rose-400 font-bold';
                } else if (isWeekend) {
                  cellBg = 'bg-amber-50/50 dark:bg-amber-950/20';
                  dayNumColor = 'text-amber-500 dark:text-amber-400 font-bold';
                }
              }
            }

            return (
              <div 
                key={cell.dateStr} 
                className={`${cellBg} h-[15.5px] flex items-center justify-between px-1 relative select-none`}
              >
                <span className={`text-[6.5px] font-bold leading-none ${dayNumColor}`}>
                  {cell.dayNum}
                </span>
                {shiftCode && shiftCode !== ShiftType.None && (
                  <span className={`text-[8px] font-black font-mono leading-none tracking-tighter ${shiftTextColor}`}>
                    {shiftCode}
                  </span>
                )}
                {!isRetro && isHoliday && (
                  <span className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-rose-500 rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Card Footer */}
        <div className="flex justify-between items-center text-[5.5px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider pt-1 border-t border-slate-200/60 dark:border-slate-800/80 mt-1">
          <span className="truncate max-w-[120px]">{footerText}</span>
          <span>VALID FOR {shortMonthName} {config.year}</span>
        </div>

      </div>
    </div>
  );
};

export default StaffCardsView;
