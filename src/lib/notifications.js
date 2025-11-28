import { supabase } from '@/lib/customSupabaseClient';

/**
 * Função centralizada para enviar e-mails usando a Edge Function 'send-smtp-email'.
 * @param {string} to - O e-mail do destinatário.
 * @param {string} subject - O assunto do e-mail.
 * @param {string} html - O corpo HTML do e-mail.
 * @returns {Promise<{data: any, error: Error | null}>}
 */
async function sendSmtpEmail({ to, subject, html }) {
  try {
    console.log(`Tentando enviar e-mail para ${to} via Edge Function...`);
    const { data, error } = await supabase.functions.invoke('send-smtp-email', {
      body: { to, subject, html },
    });

    if (error) {
      console.error(`Erro ao invocar a Edge Function 'send-smtp-email':`, error);
      throw error;
    }

    if (data?.error) {
      console.error(`Erro retornado pela Edge Function 'send-smtp-email':`, data.error);
      throw new Error(data.error);
    }
    
    console.log(`✅ E-mail SMTP despachado com sucesso para: ${to}`);
    return { data, error: null };
  } catch (e) {
    console.error('Erro capturado ao tentar enviar e-mail via SMTP:', e.message);
    return { data: null, error: e };
  }
}

/**
 * Envia um e-mail de convite para um novo membro do grupo.
 * @param {object} group - O objeto do grupo (com `name`, `slug`, `owner_email`, `budget_min`, `budget_max`).
 * @param {object} member - O objeto do membro convidado (com `email`, `invite_token`).
 * @returns {Promise<{error: Error | null}>}
 */
export async function sendInviteNotification(group, member) {
  const inviteLink = `${window.location.origin}/#/g/${group.slug}/join?token=${member.invite_token}`;
  const subject = `Você foi convidado para o Amigo Secreto: ${group.name}!`;
  const html = `
    <h1>Olá!</h1>
    <p>Você foi convidado por <strong>${group.owner_email || 'o organizador'}</strong> para participar do amigo secreto <strong>"${group.name}"</strong>.</p>
    <p><strong>Orçamento:</strong> R$${group.budget_min} - R$${group.budget_max}</p>
    <p>Para participar, clique no link abaixo:</p>
    <p style="margin: 20px 0;">
      <a href="${inviteLink}" style="padding: 12px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Entrar no Grupo</a>
    </p>
    <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
    <p><a href="${inviteLink}">${inviteLink}</a></p>
    <hr>
    <p style="font-size: 12px; color: #888;">Atenciosamente,<br>Equipe Amigo Secreto Hori</p>
  `;

  const { error } = await sendSmtpEmail({ to: member.email, subject, html });
  return { error };
}

/**
 * Envia um e-mail notificando o resultado do sorteio para um participante.
 * @param {object} group - O objeto do grupo (com `name`, `slug`).
 * @param {object} giver - O membro que vai presentear (com `name`, `email`).
 * @returns {Promise<{error: Error | null}>}
 */
export async function sendAssignmentNotification(group, giver) {
  const roomLink = `${window.location.origin}/#/g/${group.slug}/my`;
  const subject = `🎁 Sorteio realizado! Descubra seu amigo secreto no grupo "${group.name}"`;
  const html = `
    <h1>Olá, ${giver.name}!</h1>
    <p>O sorteio do amigo secreto <strong>"${group.name}"</strong> foi realizado com sucesso!</p>
    <p>Para descobrir quem você tirou e ver a lista de desejos, acesse sua sala no link abaixo:</p>
    <p style="margin: 20px 0;">
      <a href="${roomLink}" style="padding: 12px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Meu Amigo Secreto</a>
    </p>
    <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
    <p><a href="${roomLink}">${roomLink}</a></p>
    <hr>
    <p style="font-size: 12px; color: #888;">Boas compras!<br>Equipe Amigo Secreto Hori</p>
  `;
  
  const { error } = await sendSmtpEmail({ to: giver.email, subject, html });
  return { error };
}