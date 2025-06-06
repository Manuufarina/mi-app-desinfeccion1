const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({limit: '10mb'}));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

app.post('/send-credential', async (req, res) => {
  const { to, subject, text, pdfBase64 } = req.body;
  if (!to || !pdfBase64) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  const buffer = Buffer.from(pdfBase64, 'base64');
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: subject || 'Credencial de Desinfección',
      text: text || 'Adjuntamos la credencial digital del vehículo.',
      attachments: [{ filename: 'credencial.pdf', content: buffer }]
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Error sending email' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
