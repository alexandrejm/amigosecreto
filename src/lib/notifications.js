import { storage } from '@/lib/storage';

export function sendNotification({ groupId, type, channel, toEmail, toPhone, templateName, payload }) {
  const notifications = storage.getNotifications();
  
  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    groupId,
    type,
    channel,
    toEmail,
    toPhone,
    templateName,
    payload: JSON.stringify(payload),
    status: 'sent',
    createdAt: new Date().toISOString()
  };
  
  notifications.push(notification);
  storage.setNotifications(notifications);
  
  console.log(`📧 Notificação enviada:`, {
    type,
    channel,
    to: toEmail || toPhone,
    template: templateName
  });
  
  return notification;
}

export function sendInviteNotification(group, member) {
  const inviteLink = `${window.location.origin}/g/${group.slug}/join?token=${member.inviteToken}`;
  
  return sendNotification({
    groupId: group.id,
    type: 'invite',
    channel: 'email',
    toEmail: member.email,
    templateName: 'invite',
    payload: {
      groupName: group.name,
      inviteLink,
      ownerName: group.ownerName
    }
  });
}

export function sendAssignmentNotification(group, giver, receiver) {
  const roomLink = `${window.location.origin}/g/${group.slug}/my`;
  
  return sendNotification({
    groupId: group.id,
    type: 'assignment',
    channel: giver.notificationPreference || 'email',
    toEmail: giver.email,
    toPhone: giver.phone,
    templateName: 'assignment',
    payload: {
      groupName: group.name,
      receiverName: receiver.name,
      budgetMin: group.budgetMin,
      budgetMax: group.budgetMax,
      wishlistUrl: receiver.wishlistUrl,
      roomLink
    }
  });
}

export function sendReminderNotification(group, member) {
  return sendNotification({
    groupId: group.id,
    type: 'reminder',
    channel: 'email',
    toEmail: member.email,
    templateName: 'reminder',
    payload: {
      groupName: group.name,
      signupDeadline: new Date(group.signupDeadline).toLocaleDateString('pt-BR')
    }
  });
}