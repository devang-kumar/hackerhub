const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const send = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: `"HackHub" <${process.env.EMAIL_USER}>`, to, subject, html });
    return true;
  } catch (err) {
    console.error('[Mailer] Failed:', err.message);
    return false;
  }
};

exports.sendVerification = (name, email, token) => send({
  to: email,
  subject: 'Verify your HackHub account',
  html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px">
    <h2 style="color:#6366f1">Welcome to HackHub, ${name}!</h2>
    <p>Click the button below to verify your email address.</p>
    <a href="${process.env.BASE_URL}/auth/verify/${token}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Verify Email</a>
    <p style="color:#64748b;font-size:0.85rem">If you didn't create an account, ignore this email.</p>
  </div>`
});

exports.sendPasswordReset = (name, email, token) => send({
  to: email,
  subject: 'Reset your HackHub password',
  html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px">
    <h2 style="color:#6366f1">Password Reset</h2>
    <p>Hi ${name}, click below to reset your password. This link expires in 1 hour.</p>
    <a href="${process.env.BASE_URL}/auth/reset-password/${token}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Reset Password</a>
    <p style="color:#64748b;font-size:0.85rem">If you didn't request this, ignore this email.</p>
  </div>`
});

exports.sendTeamInvite = (email, teamName, competitionTitle, token) => send({
  to: email,
  subject: `You're invited to join team "${teamName}"`,
  html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px">
    <h2 style="color:#6366f1">Team Invitation</h2>
    <p>You've been invited to join <strong>${teamName}</strong> for <strong>${competitionTitle}</strong>.</p>
    <a href="${process.env.BASE_URL}/competitions/invite/${token}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Accept Invitation</a>
    <p style="color:#64748b;font-size:0.85rem">If you don't know who sent this, ignore it.</p>
  </div>`
});

exports.sendApplicationConfirmation = (name, email, jobTitle, company) => send({
  to: email,
  subject: `Application received — ${jobTitle} at ${company}`,
  html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px">
    <h2 style="color:#6366f1">Application Received!</h2>
    <p>Hi ${name}, your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been received.</p>
    <p>The hiring team will review your profile and get back to you.</p>
    <a href="${process.env.BASE_URL}/jobs/my-applications" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">View My Applications</a>
  </div>`
});

exports.sendStatusUpdate = (name, email, jobTitle, status) => send({
  to: email,
  subject: `Application update — ${jobTitle}`,
  html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px">
    <h2 style="color:#6366f1">Application Status Update</h2>
    <p>Hi ${name}, your application for <strong>${jobTitle}</strong> has been updated.</p>
    <p>New status: <strong style="text-transform:capitalize">${status}</strong></p>
    <a href="${process.env.BASE_URL}/jobs/my-applications" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">View Application</a>
  </div>`
});

exports.sendAssessmentResult = (name, email, title, score, total) => send({
  to: email,
  subject: `Your assessment result — ${title}`,
  html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px">
    <h2 style="color:#6366f1">Assessment Result</h2>
    <p>Hi ${name}, you've completed <strong>${title}</strong>.</p>
    <p style="font-size:2rem;font-weight:800;color:#6366f1;text-align:center">${score} / ${total}</p>
    <p style="text-align:center;color:#64748b">${Math.round((score/total)*100)}%</p>
  </div>`
});
