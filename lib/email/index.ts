import { Resend } from 'resend';
import { useBranding } from '@/providers/branding-provider';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail(email: string, teamName: string, inviteId: number) {
  const inviteLink = `${process.env.BASE_URL}/sign-up?inviteId=${inviteId}`;
  const { branding } = useBranding();
  try {
    await resend.emails.send({
      from: `${branding?.name || 'WhatSaaS'} <onboarding@resend.dev>`,
      to: email,
      subject: `Invitation to join ${teamName} on ${branding?.name || 'WhatSaaS'}`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <h2>You've been invited!</h2>
          <p>You have been invited to join the team <strong>${teamName}</strong> on ${branding?.name || 'WhatSaaS'}.</p>
          <p>Click the link below to accept the invitation and set up your account:</p>
          <p>
            <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #44A64D; color: white; text-decoration: none; border-radius: 5px;">
              Accept Invitation
            </a>
          </p>
          <p style="font-size: 14px; color: #666;">
            Or copy this link: <br />
            <a href="${inviteLink}">${inviteLink}</a>
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send invitation email');
  }
}