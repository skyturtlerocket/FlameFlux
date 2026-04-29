const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || '');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON payload.' });
    }
  }

  const { firstName, lastName, organization, email, message } = body;

  if (!firstName || !lastName || !organization || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({
      error: 'Email service is not configured. Missing RESEND_API_KEY in deployment environment.',
    });
  }

  try {
    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'FlameFlux Contact <onboarding@resend.dev>',
      to: [process.env.CONTACT_TO_EMAIL || 'skyturtlejet@gmail.com'],
      replyTo: email,
      subject: `FlameFlux Contact Form: ${firstName} ${lastName}`,
      text: [
        `First Name: ${firstName}`,
        `Last Name: ${lastName}`,
        `Organization: ${organization}`,
        `Email: ${email}`,
        '',
        'Message:',
        message,
      ].join('\n'),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    const providerMessage =
      error?.message ||
      error?.error?.message ||
      error?.response?.data?.message ||
      'Unable to send message.';

    return res.status(500).json({ error: providerMessage });
  }
};
