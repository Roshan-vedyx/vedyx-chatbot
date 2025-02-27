import { useState, useEffect } from "react";

const GuestLimitHandler = ({ isGuest, onLimitReached }) => {
  const [messageCount, setMessageCount] = useState(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (messageCount === 3) {
      setShowSignupPrompt(true);
    } else if (messageCount >= 5) {
      setLimitReached(true);
      onLimitReached();
    }
  }, [messageCount, onLimitReached]);

  const handleDismissPopup = () => {
    setShowSignupPrompt(false);
  };

  const handleNewMessage = () => {
    if (!limitReached) {
      setMessageCount((prevCount) => prevCount + 1);
    }
  };

  return {
    messageCount,
    showSignupPrompt,
    limitReached,
    handleNewMessage,
    handleDismissPopup,
  };
};

export default GuestLimitHandler;
