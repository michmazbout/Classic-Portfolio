export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, subject, message } = req.body;
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ message: 'Webhook not configured' });
  }

  const discordPayload = {
    embeds: [
      {
        title: subject || 'New Contact Form Submission',
        color: 0x00b0f4,
        fields: [
          { name: '🧑 Name', value: name || 'No name provided' },
          { name: '📧 Email', value: email || 'No email provided' },
          { name: '✉️ Message', value: message || 'No message provided' }
        ],
        footer: {
          text: '📬 New message from your website contact form'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!discordRes.ok) {
      throw new Error(`Discord error ${discordRes.status}`);
    }

    return res.status(200).json({ message: 'Message sent successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send message' });
  }
}
