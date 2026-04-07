const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { firstName, lastName, organization, email, message } = req.body || {};

  if (!firstName || !lastName || !organization || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'FlameFlux Contact <onboarding@resend.dev>',
      to: ['skyturtlejet@gmail.com'],
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
    return res.status(500).json({ error: 'Unable to send message.' });
  }
};
