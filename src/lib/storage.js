const STORAGE_KEYS = {
  GROUPS: 'amigo_secreto_groups',
  MEMBERS: 'amigo_secreto_members',
  ASSIGNMENTS: 'amigo_secreto_assignments',
  MESSAGES: 'amigo_secreto_messages',
  INVITES: 'amigo_secreto_invites',
  NOTIFICATIONS: 'amigo_secreto_notifications',
  AUDIT_LOGS: 'amigo_secreto_audit_logs',
  DRAW_BATCHES: 'amigo_secreto_draw_batches'
};

export const storage = {
  get: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Storage get error:', error);
      return [];
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  getGroups: () => storage.get(STORAGE_KEYS.GROUPS),
  setGroups: (groups) => storage.set(STORAGE_KEYS.GROUPS, groups),

  getMembers: () => storage.get(STORAGE_KEYS.MEMBERS),
  setMembers: (members) => storage.set(STORAGE_KEYS.MEMBERS, members),

  getAssignments: () => storage.get(STORAGE_KEYS.ASSIGNMENTS),
  setAssignments: (assignments) => storage.set(STORAGE_KEYS.ASSIGNMENTS, assignments),

  getMessages: () => storage.get(STORAGE_KEYS.MESSAGES),
  setMessages: (messages) => storage.set(STORAGE_KEYS.MESSAGES, messages),

  getInvites: () => storage.get(STORAGE_KEYS.INVITES),
  setInvites: (invites) => storage.set(STORAGE_KEYS.INVITES, invites),

  getNotifications: () => storage.get(STORAGE_KEYS.NOTIFICATIONS),
  setNotifications: (notifications) => storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications),

  getAuditLogs: () => storage.get(STORAGE_KEYS.AUDIT_LOGS),
  setAuditLogs: (logs) => storage.set(STORAGE_KEYS.AUDIT_LOGS, logs),

  getDrawBatches: () => storage.get(STORAGE_KEYS.DRAW_BATCHES),
  setDrawBatches: (batches) => storage.set(STORAGE_KEYS.DRAW_BATCHES, batches)
};