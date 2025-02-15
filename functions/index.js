const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

// Initialize Firebase Admin SDK
initializeApp({ credential: applicationDefault() });
const db = getFirestore();

// Set up Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) return res.status(400).send("Missing data");

  try {
    const messagesRef = db.collection("users").doc(userId).collection("messages");
    const chatHistory = await messagesRef.orderBy("timestamp", "asc").get();
    
    let conversation = chatHistory.docs.map(doc => doc.data());
    conversation = conversation.map(msg => ({ role: msg.sender, content: msg.text }));
    
    conversation.push({ role: "user", content: message });

    // ✅ Fetch OpenAI API key from Firebase Config
    const openAiApiKey = process.env.OPENAI_API_KEY || "YOUR_BACKUP_KEY_HERE";

    if (!openAiApiKey) {
      return res.status(500).json({ error: "Missing OpenAI API Key" });
    }

    const openAiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      { model: "gpt-4o", messages: conversation, temperature: 0.7 },
      { headers: { "Authorization": `Bearer ${openAiApiKey}`, "Content-Type": "application/json" } }
    );

    const aiMessage = openAiResponse.data.choices[0].message.content;

    // Store user and AI messages in Firestore
    await messagesRef.add({ text: message, sender: "user", timestamp: Date.now() });
    await messagesRef.add({ text: aiMessage, sender: "ai", timestamp: Date.now() });

    res.json({ text: aiMessage });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Set region to Mumbai (`asia-south1`)
exports.chatAI = onRequest({ region: "asia-south1" }, app);
