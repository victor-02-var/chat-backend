// backend.js
const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
const { db } = require("./firebase");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ========================
// 1️⃣ Chat message endpoint
// ========================
app.post("/send-message", async (req, res) => {
  try {
    const { chatId, senderName, senderEmail, receiverEmail, text } = req.body;

    if (!receiverEmail || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Optional: Save message to Firestore
    // await db.collection("chats").doc(chatId).collection("messages").add({
    //   senderName,
    //   senderEmail,
    //   receiverEmail,
    //   text,
    //   createdAt: new Date(),
    // });

    // Send email via SendGrid
    await sgMail.send({
      to: receiverEmail,
      from: process.env.FROM_EMAIL, // Must be domain-based
      subject: `💬 You have a new message from ${senderName} on TownMate`,
      text: `Hi there,

${senderName} has sent you a new chat on TownMate.

Log in now to view and respond:
https://townmate.co/

Thank you for being a part of TownMate!
Best regards,
The TownMate Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Hi there,</p>
          <p><strong>${senderName}</strong> has sent you a new message on <strong>TownMate</strong>.</p>
          <p>Please log in to view the conversation and respond:</p>
          <p>
            <a href="https://townmate.co/" 
               style="padding:10px 16px;background:#0070f3;color:#ffffff;text-decoration:none;border-radius:5px;display:inline-block;">
               🔗 View Your Message
            </a>
          </p>
          
          <p>https://townmate.co/</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
          <p style="font-size:12px;color:#777;">
            You’re receiving this email because you have an active TownMate account.
            If this wasn’t you, please ignore this message or contact support.
          </p>
          <p style="font-size:12px;color:#777;">
            <strong>TownMate</strong> • Connecting people and communities.
          </p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: "Message saved & email sent" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================
// 2️⃣ Publish blog endpoint
// ========================
app.post("/publish-blog", async (req, res) => {
  try {
    const { title, description, blogUrl } = req.body;

    if (!title || !description || !blogUrl) {
      return res.status(400).json({ error: "Missing required blog fields" });
    }

    // Get all user emails from Firestore
    const usersSnapshot = await db.collection("users").get();
    const emails = usersSnapshot.docs.map(doc => doc.data().email).filter(Boolean);

    if (emails.length === 0) {
      return res.status(200).json({ success: true, message: "No users to notify." });
    }

    // Prepare email
    const msg = {
      to: emails,
      from: process.env.FROM_EMAIL, // Must be domain-based
      subject: `📰 New Blog Published: ${title}`,
      text: `A new blog has been published on TownMate.

Title: ${title}
${description}

Read here: ${blogUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>🆕 New Blog Published on the TownMate</h2>
          <h3>${title}</h3>
          <p>${description}</p>
          <p>
            <a href="${blogUrl}" 
               style="padding:10px 16px;background:#0070f3;color:#ffffff;text-decoration:none;border-radius:5px;display:inline-block;">
               📖 Read Full Blog
            </a>
          </p>
          
          <p>${blogUrl}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
          <p style="font-size:12px;color:#777;">
            You're receiving this email because you're subscribed to TownMate updates.
          </p>
        </div>
      `
    };

    // Send bulk email
    await sgMail.sendMultiple(msg);

    res.status(200).json({ success: true, message: "Blog published & emails sent to all users" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================
// Start server
// ========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
