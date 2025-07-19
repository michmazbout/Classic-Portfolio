export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, message } = req.body;
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ message: 'Webhook not configured' });
  }

  const discordPayload = {
    embeds: [
      {
        title: 'New Contact Message',
        color: 0x5865f2,
        fields: [
          { name: 'Email', value: email || 'No email' },
          { name: 'Message', value: message || 'No message' },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (!discordRes.ok) {
      throw new Error(`Discord error ${discordRes.status}`);
    }

    return res.status(200).json({ message: 'Sent successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send message' });
  }
}
