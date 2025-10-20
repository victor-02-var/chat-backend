  const express = require("express");
  const cors = require("cors");
  const sgMail = require("@sendgrid/mail");
  const { db } = require("./firebase");
  require("dotenv").config();

  const app = express();
  app.use(cors());
  app.use(express.json());

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  app.post("/send-message", async (req, res) => {
    try {
      const { chatId, senderName, senderEmail, receiverEmail, text } = req.body;

      if (!receiverEmail || !text) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // 1️⃣ Save message to Firestore
      // await db
      //   .collection("chats")
      //   .doc(chatId)
      //   .collection("messages")
      //   .add({
      //     senderName,
      //     senderEmail,
      //     receiverEmail,
      //     text,
      //     createdAt: new Date(),
      //   });

      // 2️⃣ Send email via SendGrid
  await sgMail.send({
    to: receiverEmail,
    from: process.env.FROM_EMAIL,
    subject: `New chat from ${senderName}`,
    text: `You have a new chat from ${senderName}. Log in to read it:https://townmate.co/`,
    html: `<p>You have a new chat from <strong>${senderName}</strong>.</p>
          <p><a href="https://townmate.co/" style="padding:8px 12px;background:#0070f3;color:#fff;text-decoration:none;border-radius:5px;">View Chat</a></p>`
  });


      res.status(200).json({ success: true, message: "Message saved & email sent" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
