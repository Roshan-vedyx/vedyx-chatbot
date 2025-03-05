// ChatLogic.js - Handles AI responses
import axios from "axios";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const handleUserMessage = async (userMessage) => {
  const thinkingMessage = { text: "Thinking...", sender: "ai", timestamp: new Date() };
  
  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are Vedyx, a personalized AI tutor." },
        { role: "user", content: userMessage.text }
      ],
      temperature: 0.7,
    }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    });

    return {
      text: response.data.choices[0]?.message?.content || "No response from AI.",
      sender: "ai",
      timestamp: new Date()
    };
  } catch (error) {
    console.error("Error in AI response:", error);
    return { text: "Error communicating with AI. Please try again.", sender: "ai", timestamp: new Date() };
  }
};
