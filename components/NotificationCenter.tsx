import React, { useState } from 'react';
import { DutyExchangeRequest, AppNotification, UserAccount, StaffMember, WardInfo, WardTransferRequest } from '../types';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  HeartHandshake, 
  Bell, 
  Sparkles, 
  UserCheck,
  ChevronDown,
  ChevronUp,
  Inbox,
  Check,
  X,
  AlertCircle,
  ArrowRightLeft,
  Building2
} from 'lucide-react';

interface NotificationCenterProps {
  currentUser: UserAccount;
  currentStaff?: StaffMember | null;
  currentWard?: WardInfo;
  exchangeRequests: DutyExchangeRequest[];
  wardTransferRequests?: WardTransferRequest[];
  notifications: AppNotification[];
  onPeerRespond: (requestId: string, accept: boolean, note?: string) => void;
  onWsRespond: (requestId: string, approve: boolean, note?: string) => void;
  onTargetWsRespondTransfer?: (requestId: string, accept: boolean, note?: string) => void;
  onAdminRespondTransfer?: (requestId: string, approve: boolean, note?: string) => void;
  onMarkNotificationRead: (notificationId: string) => void;
  onClearNotifications: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  currentStaff,
  currentWard,
  exchangeRequests,
  wardTransferRequests = [],
  notifications,
  onPeerRespond,
  onWsRespond,
  onTargetWsRespondTransfer,
  onAdminRespondTransfer,
  onMarkNotificationRead,
  onClearNotifications
}) => {
  const [activeTab, setActiveTab] = useState<'pending_action' | 'email_inbox' | 'all_requests'>('pending_action');
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Filter notifications for current logged in user (by email or staff ID or WS role)
  const userEmail = (currentUser.email || (currentStaff?.email) || '').toLowerCase().trim();
  const userStaffId = currentStaff?.id || currentUser.staffMemberId || '';
  const isAuthorizedApprover = !!(currentStaff?.isAuthorizedDutyApprover || currentUser.isAuthorizedDutyApprover);

  const myNotifications = notifications.filter(n => {
    if (n.recipientEmail && n.recipientEmail.toLowerCase().trim() === userEmail) return true;
    if (userStaffId && n.recipientStaffId === userStaffId) return true;
    if (currentUser.role === 'ward_supervisor' && n.recipientRole === 'ward_supervisor') return true;
    if (isAuthorizedApprover && n.type === 'exchange_ws_request') return true;
    if (currentUser.role === 'admin' || currentUser.role === 'cns') return true; // Admin/CNS can monitor all
    return false;
  });

  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  // Filter pending peer requests where I am the target staff member B
  const pendingPeerRequestsForMe = exchangeRequests.filter(req => {
    if (req.status !== 'pending_peer') return false;
    if (userStaffId && req.targetStaffId === userStaffId) return true;
    if (userEmail && req.targetStaffEmail.toLowerCase().trim() === userEmail) return true;
    return false;
  });

  // Filter pending WS / Authorized Staff requests for this ward (Admin is read-only observer for duty swaps, approved by WS)
  const pendingWsRequestsForMe = exchangeRequests.filter(req => {
    if (req.status !== 'pending_ws') return false;
    if (currentUser.role === 'admin' || currentUser.role === 'cns') return false; // Main admin / CNS does not approve ward-level shift duty swaps; WS decides
    if (currentUser.role === 'ward_supervisor') {
      if (!currentUser.wardId || currentUser.wardId === 'ALL') return true;
      return req.wardId === currentUser.wardId;
    }
    if (isAuthorizedApprover) {
      if (currentStaff?.wardId && req.wardId) return currentStaff.wardId === req.wardId;
      return true;
    }
    return false;
  });

  // Filter pending Target WS transfers
  const pendingTargetWsTransfers = wardTransferRequests.filter(req => {
    if (req.status !== 'pending_target_ws') return false;
    if (currentUser.role === 'admin' || currentUser.role === 'cns') return false; // Admin/CNS only approves stage 3 (pending_admin)
    if (currentUser.role === 'ward_supervisor') {
      if (userEmail && req.targetWsEmail?.toLowerCase().trim() === userEmail) return true;
      if (currentUser.wardId && currentUser.wardId !== 'ALL' && req.targetWardId === currentUser.wardId) return true;
      return true;
    }
    return false;
  });

  // Filter pending Admin transfer approvals
  const pendingAdminTransfers = wardTransferRequests.filter(req => {
    if (req.status !== 'pending_admin') return false;
    if (currentUser.role === 'admin' || currentUser.role === 'cns') return true;
    return false;
  });

  const totalPendingActions = pendingPeerRequestsForMe.length + pendingWsRequestsForMe.length + pendingTargetWsTransfers.length + pendingAdminTransfers.length;

  const handleNoteChange = (reqId: string, val: string) => {
    setResponseNotes(prev => ({ ...prev, [reqId]: val }));
  };

  return (
    <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl overflow-hidden mb-8 transition-all">
      {/* Top Banner Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-3 bg-indigo-600/80 text-white rounded-2xl shadow-md border border-indigo-400/30">
              <Inbox size={22} />
            </div>
            {totalPendingActions > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-amber-500 text-slate-950 text-[11px] font-black rounded-full border-2 border-slate-900 animate-bounce">
                {totalPendingActions}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-tight">
                Application & Email Notification Center
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-500/80 text-white text-[10px] font-black uppercase rounded-full">
                  {unreadCount} New Email(s)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Real-time duty exchange requests, peer approvals, WS review & email dispatches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-indigo-900/60 px-3 py-1.5 rounded-xl border border-indigo-700/50 text-xs font-bold text-indigo-200">
            <Mail size={14} className="text-amber-400" />
            <span>Simulated Mail Server: Active</span>
          </div>

          <button className="text-slate-300 hover:text-white transition p-1">
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 space-y-6">
          {/* Sub Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('pending_action')}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'pending_action'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <HeartHandshake size={16} />
                Pending My Review ({totalPendingActions})
              </button>

              <button
                onClick={() => setActiveTab('email_inbox')}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'email_inbox'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Mail size={16} />
                Email Inbox ({myNotifications.length})
              </button>

              <button
                onClick={() => setActiveTab('all_requests')}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'all_requests'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Clock size={16} />
                All Duty Exchange Records ({exchangeRequests.length})
              </button>
            </div>

            {myNotifications.length > 0 && activeTab === 'email_inbox' && (
              <button
                onClick={onClearNotifications}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition uppercase"
              >
                Clear Email Log
              </button>
            )}
          </div>

          {/* TAB 1: PENDING MY REVIEW */}
          {activeTab === 'pending_action' && (
            <div className="space-y-6">
              {totalPendingActions === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                  <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                  <div className="font-bold text-slate-700">No pending exchange requests requiring your approval right now.</div>
                  <p className="text-slate-400">When colleagues send you a duty swap or the WS needs to review an application, it will appear here.</p>
                </div>
              ) : (
                <>
                  {/* Section A: Pending Peer Acceptance (Staff B) */}
                  {pendingPeerRequestsForMe.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-black text-amber-800 uppercase tracking-wider bg-amber-50 p-3 rounded-2xl border border-amber-200">
                        <UserCheck size={18} className="text-amber-600" />
                        <span>1. Incoming Peer Duty Exchange Requests (Awaiting Your Acceptance)</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {pendingPeerRequestsForMe.map(req => (
                          <div key={req.id} className="p-5 bg-amber-50/40 border border-amber-200/80 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-200/60 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-amber-600 text-white text-[10px] font-black uppercase rounded-lg">
                                  Action Required
                                </span>
                                <span className="font-extrabold text-xs text-slate-900">
                                  Request from: {req.requestorStaffName} ({req.requestorStaffEmail})
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{req.createdAt}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="p-3 bg-white rounded-2xl border border-amber-200/80 space-y-1">
                                <span className="text-[10px] font-black uppercase text-amber-700 block">Duty Exchange Details</span>
                                <div className="font-bold text-slate-800">Date: {req.requestorDate}</div>
                                <div className="text-slate-600">Requestor Shift: <strong className="text-amber-800 font-mono">[{req.requestorShift}]</strong></div>
                                <div className="text-slate-600">Exchange Type: <strong className="text-indigo-700">{req.type === 'swap' ? '2-Way Shift Swap' : '1-Way Duty Coverage'}</strong></div>
                              </div>

                              <div className="p-3 bg-white rounded-2xl border border-amber-200/80 space-y-1">
                                <span className="text-[10px] font-black uppercase text-amber-700 block">Request Notes & Reason</span>
                                <div className="text-slate-700 italic">"{req.reason || 'No specific note provided.'}"</div>
                              </div>
                            </div>

                            {/* Response Note & Action Buttons */}
                            <div className="space-y-3 pt-2">
                              <input
                                type="text"
                                placeholder="Optional response note to colleague (e.g., Happy to cover!)..."
                                value={responseNotes[req.id] || ''}
                                onChange={(e) => handleNoteChange(req.id, e.target.value)}
                                className="w-full p-3 bg-white border border-amber-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                              />

                              <div className="flex gap-3">
                                <button
                                  onClick={() => onPeerRespond(req.id, true, responseNotes[req.id])}
                                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                                >
                                  <Check size={16} />
                                  Accept Request & Send to WS
                                </button>

                                <button
                                  onClick={() => onPeerRespond(req.id, false, responseNotes[req.id])}
                                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                                >
                                  <X size={16} />
                                  Refuse Request
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section B: Pending HN / Authorised Review */}
                  {pendingWsRequestsForMe.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-black text-indigo-900 uppercase tracking-wider bg-indigo-50 p-3 rounded-2xl border border-indigo-200">
                        <ShieldCheck size={18} className="text-indigo-600" />
                        <span>2. {currentUser.role === 'ward_supervisor' ? 'Head Nurse (HN)' : 'Authorised Duty'} Approval Center (Peer Agreed • Final Review Required)</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {pendingWsRequestsForMe.map(req => (
                          <div key={req.id} className="p-5 bg-indigo-50/40 border border-indigo-200/80 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-200/60 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
                                  <ShieldCheck size={12} /> {currentUser.role === 'ward_supervisor' ? 'Head Nurse Decision Required' : 'Authorised Staff Approval Required'}
                                </span>
                                <span className="font-extrabold text-xs text-slate-900">
                                  {req.requestorStaffName} ↔ {req.targetStaffName}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{req.createdAt}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              <div className="p-3 bg-white rounded-2xl border border-indigo-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-indigo-600 block">Requestor (Staff A)</span>
                                <div className="font-bold text-slate-800">{req.requestorStaffName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{req.requestorStaffEmail}</div>
                                <div className="text-xs text-indigo-900 font-bold mt-1">Shift: [{req.requestorShift}] on {req.requestorDate}</div>
                              </div>

                              <div className="p-3 bg-white rounded-2xl border border-indigo-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-indigo-600 block">Target Peer (Staff B)</span>
                                <div className="font-bold text-slate-800">{req.targetStaffName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{req.targetStaffEmail}</div>
                                <div className="text-xs text-emerald-700 font-bold mt-1">Status: Agreed & Peer Accepted!</div>
                              </div>

                              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-emerald-700 block">AI Rule & Safety Check</span>
                                <div className="text-[11px] text-emerald-900 font-semibold flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                  <span>Shift Swap Complies with Ward Rules (Rest & Hours Limits Safe)</span>
                                </div>
                              </div>
                            </div>

                            {/* Response Note & Action Buttons */}
                            <div className="space-y-3 pt-2">
                              <input
                                type="text"
                                placeholder="Optional Head Nurse decision note (e.g., Approved by Head Nurse)..."
                                value={responseNotes[req.id] || ''}
                                onChange={(e) => handleNoteChange(req.id, e.target.value)}
                                className="w-full p-3 bg-white border border-indigo-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                              />

                              <div className="flex gap-3">
                                <button
                                  onClick={() => onWsRespond(req.id, true, responseNotes[req.id])}
                                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                                >
                                  <ShieldCheck size={16} />
                                  Approve & Automatically Update Duty Roster
                                </button>

                                <button
                                  onClick={() => onWsRespond(req.id, false, responseNotes[req.id])}
                                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                                >
                                  <X size={16} />
                                  Refuse Request
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section C: Target HN Ward Transfer Review */}
                  {pendingTargetWsTransfers.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-black text-indigo-950 uppercase tracking-wider bg-indigo-100/70 p-3 rounded-2xl border border-indigo-200">
                        <ArrowRightLeft size={18} className="text-indigo-700" />
                        <span>3. Incoming Ward Transfer Requests (Target Head Nurse Acceptance Required)</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {pendingTargetWsTransfers.map(req => (
                          <div key={req.id} className="p-5 bg-indigo-50/60 border border-indigo-200 rounded-3xl space-y-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-200 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-indigo-700 text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
                                  <Building2 size={12} /> Target HN Acceptance Required
                                </span>
                                <span className="font-extrabold text-xs text-slate-900">
                                  Staff Transfer: {req.staffName} ({req.staffId})
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{req.createdAt}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              <div className="p-3 bg-white rounded-2xl border border-indigo-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-indigo-600 block">Transfer Source & Target</span>
                                <div className="font-bold text-slate-800">Source: {req.sourceWardName} (HN: {req.sourceWsName})</div>
                                <div className="font-bold text-indigo-900">Destination: {req.targetWardName}</div>
                              </div>

                              <div className="p-3 bg-white rounded-2xl border border-indigo-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-indigo-600 block">Staff Details</span>
                                <div className="font-bold text-slate-800">{req.staffName} (ID: {req.staffId})</div>
                                <div className="text-[11px] text-slate-500 font-mono">{req.staffEmail}</div>
                                <div className="text-xs text-amber-700 font-bold mt-1">
                                  Category: {req.isHa ? 'Medical Service Aid (MSA)' : (req.isSenior ? 'Senior Staff Nurse' : 'Junior Staff Nurse')}
                                </div>
                              </div>

                              <div className="p-3 bg-white rounded-2xl border border-indigo-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-indigo-600 block">Source HN Reason</span>
                                <div className="text-slate-700 italic">"{req.reason || 'No specific reason provided.'}"</div>
                              </div>
                            </div>

                            {/* Response Note & Action Buttons */}
                            <div className="space-y-3 pt-2">
                              <input
                                type="text"
                                placeholder="Optional Target Head Nurse note for Main Admin..."
                                value={responseNotes[req.id] || ''}
                                onChange={(e) => handleNoteChange(req.id, e.target.value)}
                                className="w-full p-3 bg-white border border-indigo-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                              />

                              <div className="flex gap-3">
                                <button
                                  onClick={() => onTargetWsRespondTransfer && onTargetWsRespondTransfer(req.id, true, responseNotes[req.id])}
                                  className="flex-1 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                                >
                                  <Check size={16} />
                                  Accept Transfer & Forward to GCNS
                                </button>

                                <button
                                  onClick={() => onTargetWsRespondTransfer && onTargetWsRespondTransfer(req.id, false, responseNotes[req.id])}
                                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                                >
                                  <X size={16} />
                                  Reject Transfer Request
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section D: GCNS Final Ward Transfer Approval */}
                  {pendingAdminTransfers.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-black text-amber-950 uppercase tracking-wider bg-amber-100/80 p-3 rounded-2xl border border-amber-300">
                        <ShieldCheck size={18} className="text-amber-700" />
                        <span>4. GCNS Final Ward Transfer Approval (Target WS Accepted)</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {pendingAdminTransfers.map(req => (
                          <div key={req.id} className="p-5 bg-amber-50/70 border border-amber-300 rounded-3xl space-y-4 shadow-md">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-200 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-amber-700 text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
                                  <ShieldCheck size={12} /> GCNS Final Approval
                                </span>
                                <span className="font-extrabold text-xs text-slate-900">
                                  {req.staffName} ({req.sourceWardName} ➔ {req.targetWardName})
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{req.createdAt}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              <div className="p-3 bg-white rounded-2xl border border-amber-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-amber-800 block">Transfer Route</span>
                                <div className="font-bold text-slate-800">From: {req.sourceWardName} ({req.sourceWsName})</div>
                                <div className="font-bold text-amber-900">To: {req.targetWardName} ({req.targetWsName})</div>
                              </div>

                              <div className="p-3 bg-white rounded-2xl border border-amber-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-amber-800 block">Target WS Response</span>
                                <div className="text-emerald-700 font-bold flex items-center gap-1">
                                  <CheckCircle2 size={13} /> Target WS Accepted ({req.targetWsActionAt})
                                </div>
                                <div className="text-slate-600 italic">"{req.targetWsNote || 'Target WS accepted staff transfer.'}"</div>
                              </div>

                              <div className="p-3 bg-amber-100/60 rounded-2xl border border-amber-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-amber-900 block">Automated Transfer Action</span>
                                <div className="text-[11px] text-amber-900 font-medium">
                                  Approving will automatically reassign <strong>{req.staffName}</strong>'s primary ward to <strong>{req.targetWardName}</strong> across all hospital modules.
                                </div>
                              </div>
                            </div>

                            {/* Response Note & Action Buttons */}
                            <div className="space-y-3 pt-2">
                              <input
                                type="text"
                                placeholder="Optional GCNS decision note (e.g., Ward transfer approved per nursing governance policy)..."
                                value={responseNotes[req.id] || ''}
                                onChange={(e) => handleNoteChange(req.id, e.target.value)}
                                className="w-full p-3 bg-white border border-amber-300 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                              />

                              <div className="flex gap-3">
                                <button
                                  onClick={() => onAdminRespondTransfer && onAdminRespondTransfer(req.id, true, responseNotes[req.id])}
                                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                                >
                                  <ShieldCheck size={16} />
                                  Approve & Automatically Transfer Staff to Ward
                                </button>

                                <button
                                  onClick={() => onAdminRespondTransfer && onAdminRespondTransfer(req.id, false, responseNotes[req.id])}
                                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                                >
                                  <X size={16} />
                                  Reject Transfer
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL INBOX SIMULATION */}
          {activeTab === 'email_inbox' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400">
                  <Mail size={16} />
                  Simulated Hospital Email Inbox ({userEmail || 'All System Emails'})
                </div>
                <p className="text-xs text-slate-300">
                  Real-time email dispatch notifications automatically sent when exchange applications are created, peer-reviewed, or WS approved.
                </p>
              </div>

              {myNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No email notifications in inbox yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {myNotifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => onMarkNotificationRead(notif.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        notif.isRead 
                          ? 'bg-slate-50 border-slate-200 opacity-80' 
                          : 'bg-indigo-50/70 border-indigo-200 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className={notif.isRead ? 'text-slate-400' : 'text-indigo-600'} />
                          <span className="font-extrabold text-xs text-slate-900">{notif.title}</span>
                          {!notif.isRead && (
                            <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-black uppercase">
                              New
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{notif.createdAt}</span>
                      </div>

                      <div className="text-[11px] font-mono text-indigo-900/70 mb-1">
                        To: {notif.recipientEmail}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {notif.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ALL DUTY EXCHANGE RECORDS */}
          {activeTab === 'all_requests' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Request ID</th>
                      <th className="py-3 px-4">Requestor (A)</th>
                      <th className="py-3 px-4">Target Peer (B)</th>
                      <th className="py-3 px-4">Date & Shift</th>
                      <th className="py-3 px-4">Workflow Status</th>
                      <th className="py-3 px-4">Timestamps & Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exchangeRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          No exchange requests recorded yet.
                        </td>
                      </tr>
                    ) : (
                      exchangeRequests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{req.id}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{req.requestorStaffName}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{req.targetStaffName}</td>
                          <td className="py-3 px-4 font-mono">
                            <div>{req.requestorDate}</div>
                            <div className="text-[10px] text-indigo-600">Shift: [{req.requestorShift}]</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                              req.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              req.status === 'pending_peer' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              req.status === 'pending_ws' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' :
                              'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {req.status === 'approved' ? ' Approved & Updated' :
                               req.status === 'pending_peer' ? '⏳ Pending Peer Review' :
                               req.status === 'pending_ws' ? '🛡️ Pending WS Review' :
                               req.status === 'refused_by_peer' ? '❌ Refused by Peer' :
                               '❌ Refused by WS'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[10px] text-slate-500 space-y-0.5">
                            <div>Created: {req.createdAt}</div>
                            {req.peerActionAt && <div>Peer Note: {req.peerNote || 'Agreed'}</div>}
                            {req.wsActionAt && <div>WS Note: {req.wsNote || 'Reviewed'}</div>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
