import { WardTransferRequest, AppNotification, StaffMember, WardInfo, UserAccount } from '../types';

export function createWardTransferRequestHelper(params: {
  staffMember: StaffMember;
  sourceWard: WardInfo;
  sourceWsUser?: UserAccount;
  targetWard: WardInfo;
  targetWsUser?: UserAccount;
  reason: string;
}): {
  request: WardTransferRequest;
  notifications: AppNotification[];
} {
  const requestId = `TR-${Date.now()}`;
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });

  const isHa = !!params.staffMember.isHa || params.staffMember.name.trim().startsWith('HA') || params.staffMember.name.trim().startsWith('(HA)') || params.staffMember.name.trim().startsWith('MSA') || params.staffMember.name.trim().startsWith('(MSA)');

  const request: WardTransferRequest = {
    id: requestId,
    staffId: params.staffMember.id,
    staffName: params.staffMember.name,
    staffEmail: params.staffMember.email || `${params.staffMember.id.toLowerCase()}@hospital.org`,
    isHa,
    isSenior: params.staffMember.isSenior,

    sourceWardId: params.sourceWard.id,
    sourceWardName: params.sourceWard.name,
    sourceWsName: params.sourceWsUser?.name || params.sourceWard.supervisorName || 'Source Ward Supervisor',
    sourceWsEmail: params.sourceWsUser?.email || params.sourceWard.supervisorEmail || 'supervisor@hospital.org',

    targetWardId: params.targetWard.id,
    targetWardName: params.targetWard.name,
    targetWsName: params.targetWsUser?.name || params.targetWard.supervisorName || 'Target Ward Supervisor',
    targetWsEmail: params.targetWsUser?.email || params.targetWard.supervisorEmail || 'supervisor.target@hospital.org',

    reason: params.reason,
    status: 'pending_target_ws',
    createdAt: now
  };

  // Notification 1: To Target Ward Supervisor (Target WS)
  const targetWsNotification: AppNotification = {
    id: `NOTIF-${Date.now()}-TR1`,
    recipientEmail: request.targetWsEmail || 'supervisor@hospital.org',
    recipientRole: 'ward_supervisor',
    title: `🔄 Incoming Staff Ward Transfer Request: ${request.staffName}`,
    message: `Ward Supervisor ${request.sourceWsName} of ${request.sourceWardName} requested to transfer ${isHa ? 'Medical Service Aid (MSA)' : 'General Staff Nurse'} "${request.staffName}" (${request.staffId}) to your ward (${request.targetWardName}). Reason: "${request.reason || 'No reason provided'}". Please Accept or Reject this transfer request.`,
    type: 'ward_transfer_target_ws',
    requestId: requestId,
    isRead: false,
    createdAt: now
  };

  // Notification 2: Confirmation to Source Ward Supervisor
  const sourceWsNotification: AppNotification = {
    id: `NOTIF-${Date.now()}-TR2`,
    recipientEmail: request.sourceWsEmail || 'supervisor@hospital.org',
    recipientRole: 'ward_supervisor',
    title: `🔄 Ward Transfer Request Submitted for ${request.staffName}`,
    message: `Your request to transfer ${request.staffName} (${request.staffId}) to ${request.targetWardName} was successfully sent to Target Ward Supervisor ${request.targetWsName} (${request.targetWsEmail}).`,
    type: 'general',
    requestId: requestId,
    isRead: false,
    createdAt: now
  };

  return {
    request,
    notifications: [targetWsNotification, sourceWsNotification]
  };
}

export function handleTargetWsTransferResponseHelper(
  request: WardTransferRequest,
  accept: boolean,
  targetWsNote: string,
  targetWsName: string,
  adminEmail: string = 'admin@hospital.org'
): {
  updatedRequest: WardTransferRequest;
  notifications: AppNotification[];
} {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  const notifications: AppNotification[] = [];

  if (accept) {
    const updatedRequest: WardTransferRequest = {
      ...request,
      status: 'pending_admin',
      targetWsActionAt: now,
      targetWsNote,
      targetWsName
    };

    // Notification to GCNS (General Chief Nursing Services)
    notifications.push({
      id: `NOTIF-${Date.now()}-TR-ADM`,
      recipientEmail: adminEmail,
      recipientRole: 'admin',
      title: `🛡️ GCNS Approval Required: Ward Transfer of ${request.staffName}`,
      message: `Target Ward Supervisor ${targetWsName} (${request.targetWardName}) ACCEPTED the transfer request for ${request.staffName} (${request.staffId}) from ${request.sourceWardName}.${targetWsNote ? ` Note: "${targetWsNote}"` : ''}. GCNS approval is required to automatically execute the ward transfer.`,
      type: 'ward_transfer_admin',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    // Notification to Source WS
    notifications.push({
      id: `NOTIF-${Date.now()}-TR-SRC`,
      recipientEmail: request.sourceWsEmail || 'supervisor@hospital.org',
      recipientRole: 'ward_supervisor',
      title: `🔄 Target WS Accepted Transfer Request: ${request.staffName}`,
      message: `Target Ward Supervisor ${targetWsName} ACCEPTED the transfer of ${request.staffName} to ${request.targetWardName}! The transfer has been forwarded to GCNS (${adminEmail}) for final approval.`,
      type: 'general',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    return { updatedRequest, notifications };
  } else {
    const updatedRequest: WardTransferRequest = {
      ...request,
      status: 'rejected_by_target_ws',
      targetWsActionAt: now,
      targetWsNote,
      targetWsName
    };

    // Notification to Source WS
    notifications.push({
      id: `NOTIF-${Date.now()}-TR-REJ`,
      recipientEmail: request.sourceWsEmail || 'supervisor@hospital.org',
      recipientRole: 'ward_supervisor',
      title: `❌ Ward Transfer Request REJECTED by Target WS`,
      message: `Target Ward Supervisor ${targetWsName} (${request.targetWardName}) rejected the transfer request for ${request.staffName} (${request.staffId}).${targetWsNote ? ` Reason: "${targetWsNote}"` : ''}`,
      type: 'ward_transfer_result',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    return { updatedRequest, notifications };
  }
}

export function handleAdminTransferResponseHelper(
  request: WardTransferRequest,
  approve: boolean,
  adminNote: string,
  adminName: string
): {
  updatedRequest: WardTransferRequest;
  notifications: AppNotification[];
  shouldTransfer: boolean;
  staffId: string;
  targetWardId: string;
} {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  const notifications: AppNotification[] = [];

  if (approve) {
    const updatedRequest: WardTransferRequest = {
      ...request,
      status: 'approved',
      adminActionAt: now,
      adminNote,
      adminApproverName: adminName
    };

    // Notification 1: To Source WS
    notifications.push({
      id: `NOTIF-${Date.now()}-TR-ADM-SRC`,
      recipientEmail: request.sourceWsEmail || 'supervisor@hospital.org',
      recipientRole: 'ward_supervisor',
      title: `🎉 Ward Transfer APPROVED by GCNS: ${request.staffName}`,
      message: `GCNS ${adminName} APPROVED the ward transfer of ${request.staffName} (${request.staffId}) from ${request.sourceWardName} to ${request.targetWardName}! The staff member has been automatically assigned to ${request.targetWardName}.`,
      type: 'ward_transfer_result',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    // Notification 2: To Target WS
    notifications.push({
      id: `NOTIF-${Date.now()}-TR-ADM-TGT`,
      recipientEmail: request.targetWsEmail || 'supervisor.target@hospital.org',
      recipientRole: 'ward_supervisor',
      title: `🎉 Ward Transfer APPROVED & Staff Member Added!`,
      message: `GCNS ${adminName} APPROVED the transfer of ${request.staffName} (${request.staffId}) to your ward (${request.targetWardName})! The staff member is now automatically added to your ward directory.`,
      type: 'ward_transfer_result',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    // Notification 3: To Staff Member
    if (request.staffEmail) {
      notifications.push({
        id: `NOTIF-${Date.now()}-TR-ADM-STF`,
        recipientEmail: request.staffEmail,
        recipientStaffId: request.staffId,
        recipientRole: 'staff',
        title: `🏢 Ward Assignment Transfer Approved`,
        message: `GCNS ${adminName} has approved your official ward transfer from ${request.sourceWardName} to ${request.targetWardName}. Your primary ward assignment has been updated in the hospital roster system.`,
        type: 'ward_transfer_result',
        requestId: request.id,
        isRead: false,
        createdAt: now
      });
    }

    return {
      updatedRequest,
      notifications,
      shouldTransfer: true,
      staffId: request.staffId,
      targetWardId: request.targetWardId
    };
  } else {
    const updatedRequest: WardTransferRequest = {
      ...request,
      status: 'rejected_by_admin',
      adminActionAt: now,
      adminNote,
      adminApproverName: adminName
    };

    // Notification to Source WS
    notifications.push({
      id: `NOTIF-${Date.now()}-TR-ADM-REJ1`,
      recipientEmail: request.sourceWsEmail || 'supervisor@hospital.org',
      recipientRole: 'ward_supervisor',
      title: `❌ Ward Transfer Request REJECTED by GCNS`,
      message: `GCNS ${adminName} rejected the transfer of ${request.staffName} from ${request.sourceWardName} to ${request.targetWardName}.${adminNote ? ` Reason: "${adminNote}"` : ''}`,
      type: 'ward_transfer_result',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    // Notification to Target WS
    notifications.push({
      id: `NOTIF-${Date.now()}-TR-ADM-REJ2`,
      recipientEmail: request.targetWsEmail || 'supervisor.target@hospital.org',
      recipientRole: 'ward_supervisor',
      title: `❌ Ward Transfer Request REJECTED by GCNS`,
      message: `GCNS ${adminName} rejected the transfer of ${request.staffName} to ${request.targetWardName}.${adminNote ? ` Reason: "${adminNote}"` : ''}`,
      type: 'ward_transfer_result',
      requestId: request.id,
      isRead: false,
      createdAt: now
    });

    return {
      updatedRequest,
      notifications,
      shouldTransfer: false,
      staffId: request.staffId,
      targetWardId: request.targetWardId
    };
  }
}
