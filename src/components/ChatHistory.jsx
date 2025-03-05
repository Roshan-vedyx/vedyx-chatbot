// ChatHistory.jsx - Displays chat history in the sidebar
import { useEffect, useState } from "react";
import { fetchChatSessions } from "../services/FirestoreUtils";

const ChatHistory = ({ user, loadChatSession }) => {
  const [chatSessions, setChatSessions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchChatSessions(user?.primaryEmailAddress?.emailAddress, setChatSessions);
    }
  }, [user]);

  return (
    <div className="chat-history-sidebar">
      <h3>Chat History</h3>
      <ul>
        {chatSessions.length > 0 ? (
          chatSessions.map((session, index) => (
            <li key={index}>
              <button onClick={() => loadChatSession(session)}>
                {session.date}
              </button>
            </li>
          ))
        ) : (
          <li>No chat history found</li>
        )}
      </ul>
    </div>
  );
};

export default ChatHistory;
