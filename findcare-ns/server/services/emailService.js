const RESEND_API_URL = 'https://api.resend.com/emails';

function addEmailFooter(html) {
  return `${html}
    <div style="font-family:sans-serif;max-width:600px;margin:20px auto 0;padding:12px 24px 0;border-top:1px solid #E5E7EB;color:#6B7280;font-size:12px;line-height:1.5">
      <p style="margin:0">
        This is an automated email from FindCare NS. Please don’t reply to this message. Need help? Email us at
        <a href="mailto:support@findcarens.com" style="color:#6B7280;text-decoration:underline">support@findcarens.com</a>.
      </p>
    </div>`;
}

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error('Email service is not configured: set RESEND_API_KEY and RESEND_FROM_EMAIL');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html: addEmailFooter(html) }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Email provider request failed (${response.status}): ${details}`);
  }

  return response.json();
}

module.exports = { sendEmail };
