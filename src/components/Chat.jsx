import React, { useState, useRef, useEffect } from 'react';

const Chat = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! How can I help you today?", isBot: true },
        { id: 2, text: "I have a question about science.", isBot: false },
    ]);
    const userInput = useRef(null);
    const chatArea = useRef(null);

    const sendMessage = () => {
        const message = userInput.current.value;
        if (message.trim() !== "") {
            const newMessage = { id: Date.now(), text: message, isBot: false };
            setMessages([...messages, newMessage]);
            userInput.current.value = '';

            setTimeout(() => {
                const botReply = generateBotReply(message);
                const botMessage = { id: Date.now(), text: botReply, isBot: true };
                setMessages([...messages, newMessage, botMessage]); // Include both new messages
            }, 500);
        }
    };

    const handleAttachment = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log("File selected:", file.name);
            const attachmentMessage = { id: Date.now(), text: `📎 ${file.name} (Attachment)`, isBot: false };
            setMessages([...messages, attachmentMessage]);
            event.target.value = ''; // Clear the input
        }
    };

    useEffect(() => {
        if (chatArea.current) {
            chatArea.current.scrollTop = chatArea.current.scrollHeight;
        }
    }, [messages]);

    const generateBotReply = (userMessage) => {
        const responses = [
            "I'm still learning, but I'll try my best to answer.",
            "That's an interesting question!",
            "Let me think about that...",
            "Could you please rephrase your question?",
            "I'm not sure about that, but I can search for information."
        ];
        const randomIndex = Math.floor(Math.random() * responses.length);
        return responses[randomIndex];
    };

    return (
        <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
            <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    {/* Replace with your logo */}
                    <img src="vedyx_logo.png" alt="Vedyx Logo" className="h-8 w-8 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Vedyx Chat</h2>
                </div>
                <div></div>
            </div>

            <div id="chat-area" className="flex-grow bg-white rounded-lg shadow-md p-4 overflow-y-auto" ref={chatArea}>
                {messages.map((m) => (
                    <div key={m.id} className={`mb-4 ${m.isBot ? 'ml-auto' : ''}`}>
                        <div className={`rounded-lg p-3 max-w-md ${m.isBot ? 'bg-gray-200 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 mt-4 flex items-center">
                <input
                    type="text"
                    ref={userInput}
                    placeholder="Type your message..."
                    className="flex-grow border rounded-lg px-3 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={sendMessage} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    Send
                </button>
                <label htmlFor="attachment-input" className="ml-2 cursor-pointer">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-500 hover:text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h7m-7 7v-7m7 7a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </label>
                <input type="file" id="attachment-input" className="hidden" onChange={handleAttachment} />
            </div>
        </div>
    );
};

export default Chat;