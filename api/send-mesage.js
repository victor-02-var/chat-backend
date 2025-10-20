const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { chatId, senderName, senderEmail, receiverEmail } = JSON.parse(event.body);

    if (!senderName || !receiverEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Send “new chat” notification email
    await sgMail.send({
      to: receiverEmail,
      from: process.env.FROM_EMAIL,
      subject: `New chat from ${senderName}`,
      text: `You have a new chat from ${senderName}. Log in to view it: https://townmate.co/`,
      html: `
        <p>You have a new chat from <strong>${senderName}</strong>.</p>
        <p>
          <a href="https://townmate.co/" 
             style="padding:8px 12px;background:#0070f3;color:#fff;text-decoration:none;border-radius:5px;">
             View Chat
          </a>
        </p>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Notification email sent." }),
    };

  } catch (err) {
    console.error("SendGrid Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Internal Server Error" }),
    };
  }
};
