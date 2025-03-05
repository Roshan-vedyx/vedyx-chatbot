// GuestLimitHandler.jsx - Fully handles guest limits & triggers AuthModal
import { useEffect, useState } from "react";

const GuestLimitHandler = ({ isGuest, guestMessageCount, setAuthMode, setAuthModalOpen }) => {
  //console.log("GuestLimitHandler Props:", { isGuest, guestMessageCount, setAuthMode, setAuthModalOpen });
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (isGuest) {
      if (guestMessageCount === 3) {
        setShowSignupPrompt(true); // Soft limit at 3 messages
      } else if (guestMessageCount >= 5) {
        setLimitReached(true);
        setAuthMode("signup");
        setAuthModalOpen(true);
      }
    }
  }, [guestMessageCount, isGuest, setAuthMode, setAuthModalOpen]);

  return (
    <>
      {showSignupPrompt && !limitReached && (
        <div className="popup">
          <p>Vedyx learns with you! Sign up for unlimited access.</p>
          <button onClick={() => { setAuthMode("signup"); setAuthModalOpen(true); }}>Sign Up Now</button>
          <button onClick={() => setShowSignupPrompt(false)}>Maybe Later</button>
        </div>
      )}
      {limitReached && (
        <div className="hard-limit-popup">
          <p>Sign up to continue learning! Or come back tomorrow for more free questions.</p>
          <button onClick={() => { setAuthMode("signup"); setAuthModalOpen(true); }}>Sign Up Now</button>
        </div>
      )}
    </>
  );
};

export default GuestLimitHandler;