import { DutyExchangeRequest, AppNotification, Assignment, ShiftType, StaffMember, WardInfo, UserAccount } from '../types';

export function createExchangeRequestHelper(
  params: {
    wardId: string;
    requestor: StaffMember;
    target: StaffMember;
    type: 'swap' | 'transfer';
    requestorDate: string;
    requestorShift: ShiftType;
    targetDate?: string;
    targetShift?: ShiftType;
    reason?: string;
    wardSupervisorEmail?: string;
  }
): {
  request: DutyExchangeRequest;
  notifications: AppNotification[];
} {
  const requestId = `EX-${Date.now()}`;
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });

  const request: DutyExchangeRequest = {
    id: requestId,
    wardId: params.wardId,
    requestorStaffId: params.requestor.id,
    requestorStaffName: params.requestor.name,
    requestorStaffEmail: params.requestor.email || `${params.requestor.id.toLowerCase()}@hospital.org`,
    targetStaffId: params.target.id,
    targetStaffName: params.target.name,
    targetStaffEmail: params.target.email || `${params.target.id.toLowerCase()}@hospital.org`,
    type: params.type,
    requestorDate: params.requestorDate,
    requestorShift: params.requestorShift,
    targetDate: params.targetDate || params.requestorDate,
    targetShift: params.targetShift || ShiftType.None,
    reason: params.reason || '',
    status: 'pending_peer',
    createdAt: now
  };

  // Notification for target peer (Staff B)
  const peerNotification: AppNotification = {
    id: `NOTIF-${Date.now()}-1`,
    recipientEmail: request.targetStaffEmail,
    recipientStaffId: request.targetStaffId,
    recipientRole: 'staff',
    title: `📧 Duty Exchange Request from ${request.requestorStaffName}`,
    message: `${request.requestorStaffName} requested a ${request.type === 'swap' ? '2-Way Duty Swap' : '1-Way Shift Coverage'} on ${request.requestorDate} (${request.requestorShift}). Please Accept or Refuse this request.`,
    type: 'exchange_peer_request',
    requestId: requestId,
    isRead: false,
    createdAt: now
  };

  // Confirmation Notification for requestor (Staff A)
  const requestorNotification: AppNotification = {
    id: `NOTIF-${Date.now()}-2`,
    recipientEmail: request.requestorStaffEmail,
    recipientStaffId: request.requestorStaffId,
    recipientRole: 'staff',
    title: `📧 Duty Exchange Request Sent`,
    message: `Your duty exchange request for ${request.requestorDate} was sent to ${request.targetStaffName} (${request.targetStaffEmail}). An email notification has been dispatched to their inbox.`,
    type: 'general',
    requestId: requestId,
    isRead: false,
    createdAt: now
  };

  return {
    request,
    notifications: [peerNotification, requestorNotification]
  };
}

export function handlePeerResponseHelper(
  request: DutyExchangeRequest,
  accepted: boolean,
  peerNote: string,
  supervisorEmail: string,
  authorizedStaff?: StaffMember[]
): {
  updatedRequest: DutyExchangeRequest;
  notifications: AppNotification[];
} {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  const notifications: AppNotification[] = [];

  if (accepted) {
    const updatedRequest: DutyExchangeRequest = {
      ...request,
      status: 'pending_ws',
      peerActionAt: now,
      peerNote
    };

    // Notification to Requestor (Staff A)
    notifications.push({
      id: `NOTIF-${Date.now()}-1`,
      recipientEmail: request.requestorStaffEmail,
      recipientStaffId: request.requestorStaffId,
      recipientRole: 'staff',
      title: `📧 Peer Accepted: Exchange Request`,
      message: `${request.targetStaffName} ACCEPTED your duty exchange for ${request.requestorDate}! It has now been automatically submitted to the Ward Supervisor (${supervisorEmail}) and Authorised Staff for final review.`,
      type: 'general',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    // Notification to Ward Supervisor (WS)
    notifications.push({
      id: `NOTIF-${Date.now()}-2`,
      recipientEmail: supervisorEmail,
      recipientRole: 'ward_supervisor',
      title: `📧 Approval Required: Duty Exchange (${request.requestorStaffName} ↔ ${request.targetStaffName})`,
      message: `${request.requestorStaffName} and ${request.targetStaffName} have mutually agreed to exchange duties on ${request.requestorDate}. Please review and approve or refuse to update the roster.`,
      type: 'exchange_ws_request',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    // Notifications to Authorised Staff Members
    if (authorizedStaff && authorizedStaff.length > 0) {
      authorizedStaff.forEach((authMember, idx) => {
        notifications.push({
          id: `NOTIF-${Date.now()}-AUTH-${idx}`,
          recipientEmail: authMember.email || `${authMember.id.toLowerCase()}@hospital.org`,
          recipientStaffId: authMember.id,
          recipientRole: 'staff',
          title: `🛡️ Authorised Review Required: Duty Exchange (${request.requestorStaffName} ↔ ${request.targetStaffName})`,
          message: `As a WS-authorised duty change approver, you can review & approve the duty exchange between ${request.requestorStaffName} and ${request.targetStaffName} for ${request.requestorDate}.`,
          type: 'exchange_ws_request',
          requestId: request.id,
          isRead: false,
          createdAt: now
        });
      });
    }

    return { updatedRequest, notifications };
  } else {
    const updatedRequest: DutyExchangeRequest = {
      ...request,
      status: 'refused_by_peer',
      peerActionAt: now,
      peerNote
    };

    // Notification to Requestor (Staff A)
    notifications.push({
      id: `NOTIF-${Date.now()}-1`,
      recipientEmail: request.requestorStaffEmail,
      recipientStaffId: request.requestorStaffId,
      recipientRole: 'staff',
      title: `📧 Exchange Request Refused`,
      message: `${request.targetStaffName} declined your duty exchange request for ${request.requestorDate}.${peerNote ? ` Note: "${peerNote}"` : ''}`,
      type: 'exchange_result',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    return { updatedRequest, notifications };
  }
}

export function handleWsResponseHelper(
  request: DutyExchangeRequest,
  approved: boolean,
  wsNote: string,
  wsName: string
): {
  updatedRequest: DutyExchangeRequest;
  notifications: AppNotification[];
  assignmentsToUpdate: Array<{ staffId: string; date: string; shift: ShiftType }>;
} {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  const notifications: AppNotification[] = [];
  const assignmentsToUpdate: Array<{ staffId: string; date: string; shift: ShiftType }> = [];

  if (approved) {
    const updatedRequest: DutyExchangeRequest = {
      ...request,
      status: 'approved',
      wsActionAt: now,
      wsNote,
      wsApproverName: wsName
    };

    // Prepare roster assignment updates!
    if (request.type === 'swap') {
      const targetDate = request.targetDate || request.requestorDate;
      // Requestor gets target's shift on target date (or requestor date)
      assignmentsToUpdate.push({
        staffId: request.requestorStaffId,
        date: request.requestorDate,
        shift: request.targetShift && request.targetShift !== ShiftType.None ? request.targetShift : ShiftType.Morning
      });
      // Target gets requestor's shift on requestor date
      assignmentsToUpdate.push({
        staffId: request.targetStaffId,
        date: request.requestorDate,
        shift: request.requestorShift
      });

      if (targetDate !== request.requestorDate) {
        assignmentsToUpdate.push({
          staffId: request.requestorStaffId,
          date: targetDate,
          shift: request.targetShift || ShiftType.Morning
        });
        assignmentsToUpdate.push({
          staffId: request.targetStaffId,
          date: targetDate,
          shift: request.requestorShift
        });
      }
    } else {
      // 1-Way Transfer / Coverage
      // Requestor gets Off
      assignmentsToUpdate.push({
        staffId: request.requestorStaffId,
        date: request.requestorDate,
        shift: ShiftType.Off
      });
      // Target takes requestor's shift
      assignmentsToUpdate.push({
        staffId: request.targetStaffId,
        date: request.requestorDate,
        shift: request.requestorShift
      });
    }

    // Email & In-App Notification to Requestor (Staff A)
    notifications.push({
      id: `NOTIF-${Date.now()}-1`,
      recipientEmail: request.requestorStaffEmail,
      recipientStaffId: request.requestorStaffId,
      recipientRole: 'staff',
      title: `🎉 Duty Exchange APPROVED & Roster Updated`,
      message: `Ward Supervisor ${wsName} APPROVED your duty exchange with ${request.targetStaffName} for ${request.requestorDate}! Your duty roster has been automatically updated.`,
      type: 'exchange_result',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    // Email & In-App Notification to Target (Staff B)
    notifications.push({
      id: `NOTIF-${Date.now()}-2`,
      recipientEmail: request.targetStaffEmail,
      recipientStaffId: request.targetStaffId,
      recipientRole: 'staff',
      title: `🎉 Duty Exchange APPROVED & Roster Updated`,
      message: `Ward Supervisor ${wsName} APPROVED your duty exchange with ${request.requestorStaffName} for ${request.requestorDate}! Your duty roster has been automatically updated.`,
      type: 'exchange_result',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    return { updatedRequest, notifications, assignmentsToUpdate };
  } else {
    const updatedRequest: DutyExchangeRequest = {
      ...request,
      status: 'refused_by_ws',
      wsActionAt: now,
      wsNote,
      wsApproverName: wsName
    };

    // Notification to Requestor (Staff A)
    notifications.push({
      id: `NOTIF-${Date.now()}-1`,
      recipientEmail: request.requestorStaffEmail,
      recipientStaffId: request.requestorStaffId,
      recipientRole: 'staff',
      title: `❌ Duty Exchange Refused by WS`,
      message: `Ward Supervisor ${wsName} refused the duty exchange for ${request.requestorDate}.${wsNote ? ` Reason: "${wsNote}"` : ''}`,
      type: 'exchange_result',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    // Notification to Target (Staff B)
    notifications.push({
      id: `NOTIF-${Date.now()}-2`,
      recipientEmail: request.targetStaffEmail,
      recipientStaffId: request.targetStaffId,
      recipientRole: 'staff',
      title: `❌ Duty Exchange Refused by WS`,
      message: `Ward Supervisor ${wsName} refused the duty exchange with ${request.requestorStaffName} for ${request.requestorDate}.${wsNote ? ` Reason: "${wsNote}"` : ''}`,
      type: 'exchange_result',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    return { updatedRequest, notifications, assignmentsToUpdate: [] };
  }
}
