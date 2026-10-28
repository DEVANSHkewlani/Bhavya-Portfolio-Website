const resend = require('resend');

const _rateMap = {};
const RATE_WINDOW = 60 * 1000;

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(404).json({ error: 'Not found' });

    const ip = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const now = Date.now();
    if (now - (_rateMap[ip] || 0) < RATE_WINDOW) {
        return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }
    _rateMap[ip] = now;

    const { name = '', email = '', message = '', website = '' } = req.body || {};
    if (website) return res.status(200).json({ ok: true }); // honeypot
    if (!name || !email || !message) return res.status(400).json({ error: 'Please fill in all fields.' });
    if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email.' });

    try {
        const client = new resend.Resend(process.env.RESEND_API_KEY);
        const { data, error } = await client.emails.send({
            from: process.env.RESEND_FROM || 'Portfolio Contact <onboarding@resend.dev>',
            to: [process.env.RECIPIENT_EMAIL || 'bhavya.tia@gmail.com'],
            reply_to: email,
            subject: `New inquiry from ${name}`,
            html: `<h2>New portfolio inquiry</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`,
            text: `From: ${name} <${email}>\n\n${message}`,
        });
        if (error) throw new Error(JSON.stringify(error));
        return res.status(200).json({ ok: true });
    } catch (e) {
        console.error('Email error:', e);
        return res.status(500).json({ error: 'Failed to send. Please email directly.' });
    }
};