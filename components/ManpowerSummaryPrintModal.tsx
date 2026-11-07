import React, { useState, useMemo } from 'react';
import { StaffMember, WardInfo, UserAccount, UserRole, WardCategory } from '../types';
import { 
  Printer, 
  X, 
  Building2, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  Stethoscope, 
  Activity, 
  Filter, 
  Award, 
  FileText, 
  Check, 
  Layers, 
  Briefcase,
  Phone,
  Mail,
  Hospital
} from 'lucide-react';

interface ManpowerSummaryPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember[];
  wards: WardInfo[];
  users: UserAccount[];
  initialCategoryFilter?: 'all' | WardCategory;
  initialWardFilter?: string;
  initialRankFilter?: 'all' | 'senior' | 'junior' | 'ha' | 'ws';
  currentUserRole?: UserRole;
  currentUser?: UserAccount;
}

export const ManpowerSummaryPrintModal: React.FC<ManpowerSummaryPrintModalProps> = ({
  isOpen,
  onClose,
  staff,
  wards,
  users,
  initialCategoryFilter = 'all',
  initialWardFilter = 'all',
  initialRankFilter = 'all',
  currentUserRole,
  currentUser
}) => {
  // State for print configurations
  const [categoryFilter, setCategoryFilter] = useState<'all' | WardCategory>(initialCategoryFilter);
  const [wardFilter, setWardFilter] = useState<string>(initialWardFilter);
  const [rankFilter, setRankFilter] = useState<'all' | 'senior' | 'junior' | 'ha' | 'ws'>(initialRankFilter);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [groupByWard, setGroupByWard] = useState<boolean>(true);
  const [includeKpis, setIncludeKpis] = useState<boolean>(true);
  const [includeWardTable, setIncludeWardTable] = useState<boolean>(true);
  const [includeStaffDirectory, setIncludeStaffDirectory] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [showContacts, setShowContacts] = useState<boolean>(true);
  const [showLicense, setShowLicense] = useState<boolean>(true);

  // Filtered staff list based on report settings
  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const ward = wards.find(w => w.id === s.wardId) || wards[0];
      const wardCategory = ward?.category || 'Medical';

      // Category filter
      if (categoryFilter !== 'all' && wardCategory !== categoryFilter) {
        return false;
      }

      // Ward filter
      if (wardFilter !== 'all') {
        const assignedWardId = s.wardId || wards[0]?.id;
        if (assignedWardId !== wardFilter) return false;
      }

      // Rank filter
      const isHa = !!s.isHa || s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)');
      const isWs = !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)');

      if (rankFilter === 'senior' && !s.isSenior) return false;
      if (rankFilter === 'junior' && (s.isSenior || isHa || isWs)) return false;
      if (rankFilter === 'ha' && !isHa) return false;
      if (rankFilter === 'ws' && !isWs) return false;

      return true;
    });
  }, [staff, wards, categoryFilter, wardFilter, rankFilter]);

  // Filtered wards based on report settings
  const filteredWards = useMemo(() => {
    return wards.filter(w => {
      if (categoryFilter !== 'all' && (w.category || 'Medical') !== categoryFilter) return false;
      if (wardFilter !== 'all' && w.id !== wardFilter) return false;
      return true;
    });
  }, [wards, categoryFilter, wardFilter]);

  // Summary Metrics Breakdown
  const metrics = useMemo(() => {
    const total = filteredStaff.length;
    const seniors = filteredStaff.filter(s => s.isSenior).length;
    const msas = filteredStaff.filter(s => !!s.isHa || s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)')).length;
    const ws = filteredStaff.filter(s => !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)')).length;
    const juniors = total - seniors - msas - ws;

    const seniorPct = total > 0 ? Math.round((seniors / total) * 100) : 0;
    const juniorPct = total > 0 ? Math.round((juniors / total) * 100) : 0;
    const msaPct = total > 0 ? Math.round((msas / total) * 100) : 0;

    return { total, seniors, juniors, msas, ws, seniorPct, juniorPct, msaPct };
  }, [filteredStaff]);

  // Current formatted timestamp
  const reportDateStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Dynamic CSS injection for print
  const printConfigStyle = `
    @media print {
      @page {
        size: ${orientation} !important;
        margin: 8mm 10mm 8mm 10mm !important;
      }
      body {
        background: white !important;
        color: black !important;
      }
      .no-print, nav, header, aside, .modal-backdrop {
        display: none !important;
      }
      .print-manpower-summary-container {
        display: block !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .page-break-after {
        page-break-after: always !important;
        break-after: page !important;
      }
    }
  `;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Dynamic print style */}
      <style dangerouslySetInnerHTML={{ __html: printConfigStyle }} />

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* MODAL HEADER & CONTROLS TOOLBAR (no-print) */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-wrap justify-between items-center gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Official Manpower Summary Report</h2>
              <p className="text-xs text-slate-400">Preview, configure sections, and print hospital staffing directory</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Printer size={15} />
              <span>Print Report ({filteredStaff.length} Staff)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close print preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CONTROLS & FILTER DRAWER (no-print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 no-print space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Division / Category Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Filter size={13} className="text-emerald-600" /> Division:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as any);
                  setWardFilter('all');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Hospital Divisions</option>
                <option value="Excellency">Excellency Division</option>
                <option value="Medical">Medical Division</option>
                <option value="Surgical">Surgical Division</option>
              </select>
            </div>

            {/* Ward Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Ward:</span>
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Wards in Scope</option>
                {filteredWards.map(w => (
                  <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                ))}
              </select>
            </div>

            {/* Rank Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Rank:</span>
              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Clinical Ranks</option>
                <option value="senior">Senior Staff Nurses Only</option>
                <option value="junior">Junior Staff Nurses Only</option>
                <option value="ha">Medical Service Aids (MSA) Only</option>
                <option value="ws">Ward Supervisors Only</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  orientation === 'portrait' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  orientation === 'landscape' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Section Checkboxes */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
            <span className="text-[11px] font-black uppercase text-slate-400">Include:</span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeKpis}
                onChange={(e) => setIncludeKpis(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Executive Metrics</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeWardTable}
                onChange={(e) => setIncludeWardTable(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Ward Allocation Table</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeStaffDirectory}
                onChange={(e) => setIncludeStaffDirectory(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Staff Personnel Directory</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={groupByWard}
                onChange={(e) => setGroupByWard(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Group Directory by Ward</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLicense}
                onChange={(e) => setShowLicense(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>License Numbers</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showContacts}
                onChange={(e) => setShowContacts(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Phone & Email</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Signature Block</span>
            </label>
          </div>
        </div>

        {/* REPORT CONTENT BODY (Live preview on screen & Print markup) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-md border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none print-manpower-summary-container space-y-6 text-slate-900 font-sans">
            
            {/* 1. OFFICIAL HOSPITAL LETTERHEAD */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-900 text-white rounded-lg print:border print:border-black">
                    <Hospital size={20} />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">
                      GENERAL HOSPITAL NURSING SERVICES
                    </h1>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 print:text-black">
                      Department of Nursing Administration &bull; Clinical Manpower Registry
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs font-bold text-slate-700">
                  <span className="uppercase tracking-wider">Report Scope: </span>
                  <span className="font-black text-slate-900">
                    {categoryFilter === 'all' 
                      ? 'Hospital-Wide Manpower (All Divisions)' 
                      : `${categoryFilter} Division Manpower`}
                    {wardFilter !== 'all' && ` - ${wards.find(w => w.id === wardFilter)?.name || ''}`}
                  </span>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-600 print:text-black leading-tight">
                <div className="font-bold uppercase text-slate-900">Official Summary</div>
                <div>Date: {reportDateStr}</div>
                <div>Staff Count: <strong className="text-slate-900">{filteredStaff.length}</strong></div>
                <div>Wards Covered: <strong className="text-slate-900">{filteredWards.length}</strong></div>
              </div>
            </div>

            {/* 2. EXECUTIVE SUMMARY & HEADCOUNT KPIS */}
            {includeKpis && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  1. Executive Manpower Distribution Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl print:border-black/30">
                    <div className="text-[10px] font-black uppercase text-slate-500">Total Personnel</div>
                    <div className="text-xl font-black text-slate-900">{metrics.total}</div>
                    <div className="text-[10px] text-slate-500 font-medium">100% Active Roster</div>
                  </div>
                  <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl print:border-black/30">
                    <div className="text-[10px] font-black uppercase text-indigo-800 print:text-black">Senior Staff Nurses</div>
                    <div className="text-xl font-black text-indigo-900 print:text-black">{metrics.seniors}</div>
                    <div className="text-[10px] text-indigo-700 print:text-black font-semibold">{metrics.seniorPct}% Senior Ratio</div>
                  </div>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl print:border-black/30">
                    <div className="text-[10px] font-black uppercase text-emerald-800 print:text-black">Junior Staff Nurses</div>
                    <div className="text-xl font-black text-emerald-900 print:text-black">{metrics.juniors}</div>
                    <div className="text-[10px] text-emerald-700 print:text-black font-semibold">{metrics.juniorPct}% Junior Ratio</div>
                  </div>
                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl print:border-black/30">
                    <div className="text-[10px] font-black uppercase text-purple-800 print:text-black">Medical Aids (MSA)</div>
                    <div className="text-xl font-black text-purple-900 print:text-black">{metrics.msas}</div>
                    <div className="text-[10px] text-purple-700 print:text-black font-semibold">{metrics.msaPct}% Support Ratio</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. WARD-BY-WARD ALLOCATION TABLE */}
            {includeWardTable && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  2. Ward & Unit Allocation Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-300 print:border-black">
                    <thead className="bg-slate-100 print:bg-gray-200 text-[10px] font-black uppercase text-slate-700 border-b border-slate-300 print:border-black">
                      <tr>
                        <th className="p-2 border-r border-slate-300 print:border-black">Ward Code</th>
                        <th className="p-2 border-r border-slate-300 print:border-black">Ward Unit Name</th>
                        <th className="p-2 border-r border-slate-300 print:border-black">Division</th>
                        <th className="p-2 border-r border-slate-300 print:border-black text-center">Seniors</th>
                        <th className="p-2 border-r border-slate-300 print:border-black text-center">Juniors</th>
                        <th className="p-2 border-r border-slate-300 print:border-black text-center">MSAs</th>
                        <th className="p-2 border-r border-slate-300 print:border-black text-center">Total Staff</th>
                        <th className="p-2">Assigned Supervisor / HN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 print:divide-black/40">
                      {filteredWards.map(w => {
                        const wardStaff = staff.filter(s => !s.wardId || s.wardId === w.id);
                        const seniors = wardStaff.filter(s => s.isSenior).length;
                        const msas = wardStaff.filter(s => !!s.isHa || s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)')).length;
                        const ws = wardStaff.filter(s => !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)')).length;
                        const juniors = wardStaff.length - seniors - msas - ws;

                        // Find supervisor
                        const supervisor = users.find(u => u.wardId === w.id && (u.role === 'nurse_supervisor' || u.role === 'ward_supervisor'));
                        const headNurse = users.find(u => u.wardId === w.id && u.role === 'head_nurse');

                        return (
                          <tr key={w.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                            <td className="p-2 font-mono font-bold border-r border-slate-300 print:border-black text-slate-900">
                              {w.code}
                            </td>
                            <td className="p-2 font-bold border-r border-slate-300 print:border-black text-slate-800">
                              {w.name}
                            </td>
                            <td className="p-2 border-r border-slate-300 print:border-black text-slate-600">
                              <span className="font-semibold">{w.category || 'Medical'}</span>
                            </td>
                            <td className="p-2 border-r border-slate-300 print:border-black text-center font-bold text-indigo-900 print:text-black">
                              {seniors}
                            </td>
                            <td className="p-2 border-r border-slate-300 print:border-black text-center font-bold text-emerald-900 print:text-black">
                              {juniors}
                            </td>
                            <td className="p-2 border-r border-slate-300 print:border-black text-center font-bold text-purple-900 print:text-black">
                              {msas}
                            </td>
                            <td className="p-2 border-r border-slate-300 print:border-black text-center font-black text-slate-900 bg-slate-50 print:bg-transparent">
                              {wardStaff.length}
                            </td>
                            <td className="p-2 text-slate-700">
                              {headNurse ? (
                                <span className="font-bold">{headNurse.name} <span className="text-[10px] text-slate-500">(HN)</span></span>
                              ) : supervisor ? (
                                <span className="font-medium">{supervisor.name} <span className="text-[10px] text-slate-500">(WS)</span></span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Summary Total Row */}
                      <tr className="bg-slate-100 print:bg-gray-200 font-black border-t-2 border-slate-400 print:border-black">
                        <td colSpan={3} className="p-2 border-r border-slate-300 print:border-black text-right uppercase tracking-wider text-[11px]">
                          Grand Total ({filteredWards.length} Wards):
                        </td>
                        <td className="p-2 border-r border-slate-300 print:border-black text-center font-black">{metrics.seniors}</td>
                        <td className="p-2 border-r border-slate-300 print:border-black text-center font-black">{metrics.juniors}</td>
                        <td className="p-2 border-r border-slate-300 print:border-black text-center font-black">{metrics.msas}</td>
                        <td className="p-2 border-r border-slate-300 print:border-black text-center font-black text-sm">{metrics.total}</td>
                        <td className="p-2 text-[10px] text-slate-500 font-normal italic">Verified Hospital Manpower</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. DETAILED PERSONNEL STAFF DIRECTORY */}
            {includeStaffDirectory && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  3. Official Personnel Staff Roster ({filteredStaff.length} Records)
                </h3>

                {groupByWard ? (
                  // Grouped by Ward Unit
                  <div className="space-y-6">
                    {filteredWards.map(w => {
                      const wardStaff = filteredStaff.filter(s => !s.wardId || s.wardId === w.id);
                      if (wardStaff.length === 0) return null;

                      return (
                        <div key={w.id} className="space-y-1.5">
                          <div className="flex justify-between items-center bg-slate-100 print:bg-gray-200 px-3 py-1.5 rounded-lg border border-slate-300 print:border-black">
                            <span className="font-black text-xs uppercase text-slate-900">
                              {w.code} - {w.name} ({w.category || 'Medical'} Division)
                            </span>
                            <span className="text-[11px] font-bold text-slate-600 print:text-black">
                              {wardStaff.length} Personnel Assigned
                            </span>
                          </div>

                          <table className="w-full text-left text-xs border border-slate-300 print:border-black">
                            <thead className="bg-slate-50 print:bg-gray-100 text-[10px] font-black uppercase text-slate-600 border-b border-slate-300 print:border-black">
                              <tr>
                                <th className="p-2 border-r border-slate-300 print:border-black w-16">ID</th>
                                <th className="p-2 border-r border-slate-300 print:border-black">Staff Full Name</th>
                                <th className="p-2 border-r border-slate-300 print:border-black">Designation / Rank</th>
                                {showLicense && <th className="p-2 border-r border-slate-300 print:border-black">License No.</th>}
                                {showLicense && <th className="p-2 border-r border-slate-300 print:border-black">Expiry</th>}
                                {showContacts && <th className="p-2 border-r border-slate-300 print:border-black">Contact</th>}
                                {showContacts && <th className="p-2">Email</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 print:divide-black/30">
                              {wardStaff.map(s => {
                                const isHa = !!s.isHa || s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)');
                                const isWs = !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)');

                                return (
                                  <tr key={s.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                                    <td className="p-2 font-mono font-bold border-r border-slate-300 print:border-black text-slate-900">
                                      {s.id}
                                    </td>
                                    <td className="p-2 font-extrabold border-r border-slate-300 print:border-black text-slate-900">
                                      {s.name}
                                    </td>
                                    <td className="p-2 border-r border-slate-300 print:border-black font-semibold">
                                      {isWs ? (
                                        <span className="font-bold text-amber-900 print:text-black">Ward Supervisor (WS)</span>
                                      ) : isHa ? (
                                        <span className="font-bold text-purple-900 print:text-black">Medical Service Aid (MSA)</span>
                                      ) : s.isSenior ? (
                                        <span className="font-bold text-indigo-900 print:text-black">Senior Staff Nurse (SN-S)</span>
                                      ) : (
                                        <span className="font-medium text-slate-700 print:text-black">Junior Staff Nurse (SN)</span>
                                      )}
                                    </td>
                                    {showLicense && (
                                      <td className="p-2 font-mono border-r border-slate-300 print:border-black text-slate-700">
                                        {s.licenseNumber || '—'}
                                      </td>
                                    )}
                                    {showLicense && (
                                      <td className="p-2 font-mono border-r border-slate-300 print:border-black text-slate-700">
                                        {s.licenseExpiry || '—'}
                                      </td>
                                    )}
                                    {showContacts && (
                                      <td className="p-2 font-mono border-r border-slate-300 print:border-black text-slate-700">
                                        {s.phone || '—'}
                                      </td>
                                    )}
                                    {showContacts && (
                                      <td className="p-2 font-mono text-slate-600 text-[10px] truncate max-w-[140px]">
                                        {s.email || `${s.id.toLowerCase()}@hospital.org`}
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
                ) : (
                  // Flat Directory Table
                  <table className="w-full text-left text-xs border border-slate-300 print:border-black">
                    <thead className="bg-slate-100 print:bg-gray-200 text-[10px] font-black uppercase text-slate-700 border-b border-slate-300 print:border-black">
                      <tr>
                        <th className="p-2 border-r border-slate-300 print:border-black w-16">ID</th>
                        <th className="p-2 border-r border-slate-300 print:border-black">Staff Full Name</th>
                        <th className="p-2 border-r border-slate-300 print:border-black">Ward Unit</th>
                        <th className="p-2 border-r border-slate-300 print:border-black">Designation / Rank</th>
                        {showLicense && <th className="p-2 border-r border-slate-300 print:border-black">License No.</th>}
                        {showLicense && <th className="p-2 border-r border-slate-300 print:border-black">Expiry</th>}
                        {showContacts && <th className="p-2">Contact</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 print:divide-black/30">
                      {filteredStaff.map(s => {
                        const ward = wards.find(w => w.id === s.wardId) || wards[0];
                        const isHa = !!s.isHa || s.name.trim().startsWith('HA') || s.name.trim().startsWith('(HA)') || s.name.trim().startsWith('MSA') || s.name.trim().startsWith('(MSA)');
                        const isWs = !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)');

                        return (
                          <tr key={s.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                            <td className="p-2 font-mono font-bold border-r border-slate-300 print:border-black text-slate-900">
                              {s.id}
                            </td>
                            <td className="p-2 font-extrabold border-r border-slate-300 print:border-black text-slate-900">
                              {s.name}
                            </td>
                            <td className="p-2 border-r border-slate-300 print:border-black font-bold text-slate-800">
                              {ward?.code || 'ICU'}
                            </td>
                            <td className="p-2 border-r border-slate-300 print:border-black font-semibold">
                              {isWs ? (
                                <span className="font-bold text-amber-900 print:text-black">Ward Supervisor</span>
                              ) : isHa ? (
                                <span className="font-bold text-purple-900 print:text-black">MSA</span>
                              ) : s.isSenior ? (
                                <span className="font-bold text-indigo-900 print:text-black">Senior Staff Nurse</span>
                              ) : (
                                <span className="font-medium text-slate-700 print:text-black">Junior Staff Nurse</span>
                              )}
                            </td>
                            {showLicense && (
                              <td className="p-2 font-mono border-r border-slate-300 print:border-black text-slate-700">
                                {s.licenseNumber || '—'}
                              </td>
                            )}
                            {showLicense && (
                              <td className="p-2 font-mono border-r border-slate-300 print:border-black text-slate-700">
                                {s.licenseExpiry || '—'}
                              </td>
                            )}
                            {showContacts && (
                              <td className="p-2 font-mono text-slate-700">
                                {s.phone || '—'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 5. ADMINISTRATIVE APPROVAL & SIGNATURE BLOCK */}
            {includeSignatures && (
              <div className="pt-6 border-t-2 border-slate-900 page-break-avoid">
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                  <div className="space-y-12">
                    <div className="text-[11px] font-black uppercase text-slate-700">Prepared By</div>
                    <div className="border-t border-slate-400 print:border-black pt-1">
                      <div className="font-bold text-slate-900">{currentUser?.name || 'Head Nurse / Supervisor'}</div>
                      <div className="text-[10px] text-slate-500 print:text-black uppercase">Ward / Department Head</div>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <div className="text-[11px] font-black uppercase text-slate-700">Reviewed By</div>
                    <div className="border-t border-slate-400 print:border-black pt-1">
                      <div className="font-bold text-slate-900">Chief Nursing Services (CNS)</div>
                      <div className="text-[10px] text-slate-500 print:text-black uppercase">Division Governance</div>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <div className="text-[11px] font-black uppercase text-slate-700">Approved & Verified By</div>
                    <div className="border-t border-slate-400 print:border-black pt-1">
                      <div className="font-bold text-slate-900">General Chief Nursing Services (GCNS)</div>
                      <div className="text-[10px] text-slate-500 print:text-black uppercase">Hospital Executive Directorate</div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 text-center text-[10px] text-slate-400 print:text-black font-mono">
                  CONFIDENTIAL &bull; FOR INTERNAL HOSPITAL ADMINISTRATION USE ONLY &bull; ISSUED BY HOSPITAL ROTA GOVERNANCE SYSTEM
                </div>
              </div>
            )}

          </div>
        </div>

        {/* MODAL FOOTER (no-print) */}
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex justify-between items-center no-print">
          <div className="text-xs text-slate-400">
            Total Staff Included in Document: <strong className="text-emerald-400">{filteredStaff.length}</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Printer size={15} />
              <span>Print Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
