
import { supabase } from '@/lib/customSupabaseClient';

export async function logAudit({ groupId, actorUserId, eventType, metadata }) {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      group_id: groupId,
      actor_user_id: actorUserId,
      event_type: eventType,
      metadata: metadata,
    });

  if (error) {
    console.error('Supabase error', 'Fetch error from https://guztfaaxffaxhxeixaca.supabase.co/rest/v1/audit_logs: ' + JSON.stringify(error));
  }
}
