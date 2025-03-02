import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Cloud Function URL (Backend)
const GOOGLE_OAUTH_FUNCTION_URL = "https://asia-south1-vedyx-ai.cloudfunctions.net/authGoogle";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // ✅ Read from .env

/**
 * Initialize Google Sign-In
 * This sets up the Google Sign-In SDK but doesn't render any button yet
 */
const initializeGoogleSignIn = () => {
  if (window.google && window.google.accounts) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        if (response && response.credential) {
          try {
            const user = await handleGoogleCredential(response.credential);
            return user;
          } catch (error) {
            console.error("❌ Error processing Google credential:", error);
            throw error;
          }
        }
      },
      cancel_on_tap_outside: false,
    });
    console.log("✅ Google Sign-In initialized");
    return true;
  } else {
    console.error("❌ Google Sign-In SDK not loaded");
    return false;
  }
};

/**
 * Render a standard Google Sign-In button
 * @param {string} elementId - DOM ID of the container element
 * @param {Object} options - Button customization options
 */
const renderGoogleSignInButton = (elementId, options = {}) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`❌ Element with ID '${elementId}' not found`);
    return false;
  }

  if (window.google && window.google.accounts) {
    // Initialize if not already done
    initializeGoogleSignIn();
    
    // Render the button
    window.google.accounts.id.renderButton(
      element,
      {
        theme: options.theme || 'outline',
        size: options.size || 'large',
        text: options.text || 'signin_with',
        shape: options.shape || 'rectangular',
        logo_alignment: options.logoAlignment || 'left',
        ...options
      }
    );
    console.log("✅ Google Sign-In button rendered");
    return true;
  } else {
    console.error("❌ Google Sign-In SDK not loaded");
    return false;
  }
};

/**
 * Process Google credential (ID token) with backend
 * @param {string} idToken - Google ID token
 * @returns {Promise<Object>} - Firebase user object
 */
const handleGoogleCredential = async (idToken) => {
  console.log("✅ Google ID token obtained, sending to backend...");
  
  // Send ID token to our Firebase Cloud Function
  const response = await fetch(GOOGLE_OAUTH_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error || errorData.message || `HTTP error ${response.status}`;
    throw new Error(`Failed to authenticate with backend: ${errorMsg}`);
  }
  
  const { firebaseToken } = await response.json();
  
  // Sign in to Firebase with the custom token
  const userCredential = await signInWithCustomToken(auth, firebaseToken);
  console.log("✅ Successfully signed in with Google");
  return userCredential.user;
};

/**
 * Manually trigger Google Sign-In
 * This can be used for custom buttons
 * @returns {Promise<Object>} - Firebase user object
 */
const signInWithGoogle = async () => {
  try {
    // First check if Google library is available
    if (!window.google || !window.google.accounts) {
      throw new Error("❌ Google Sign-In SDK not loaded. Please refresh the page.");
    }

    // Make sure Google Sign-In is initialized
    initializeGoogleSignIn();

    // Programmatically prompt for Google Sign-In
    // This uses a simpler approach that's more reliable
    return new Promise((resolve, reject) => {
      // Create a temporary invisible button
      const tempButtonId = 'temp-google-signin-' + Math.random().toString(36).substring(2, 11);
      const tempButton = document.createElement('div');
      tempButton.id = tempButtonId;
      tempButton.style.position = 'absolute';
      tempButton.style.opacity = '0';
      tempButton.style.pointerEvents = 'none';
      document.body.appendChild(tempButton);

      // Override the callback temporarily for this flow
      const originalInitialize = window.google.accounts.id.initialize;
      window.google.accounts.id.initialize = (options) => {
        const originalCallback = options.callback;
        options.callback = (response) => {
          // Clean up
          document.body.removeChild(tempButton);
          window.google.accounts.id.initialize = originalInitialize;
          
          // Process the response
          if (response && response.credential) {
            handleGoogleCredential(response.credential)
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error("Failed to get Google credential"));
          }
        };
        originalInitialize(options);
      };

      // Re-initialize with our temporary callback
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: () => {}, // Will be overridden above
        cancel_on_tap_outside: false,
      });

      // Render and click the button
      window.google.accounts.id.renderButton(
        document.getElementById(tempButtonId),
        { theme: 'outline', size: 'large', type: 'standard' }
      );
      
      // Trigger the Google Sign-In prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Clean up if prompt fails
          document.body.removeChild(tempButton);
          window.google.accounts.id.initialize = originalInitialize;
          reject(new Error("Google Sign-In prompt could not be displayed"));
        }
      });
    });
  } catch (error) {
    console.error("❌ Google sign-in error:", error);
    throw error;
  }
};

export { auth, db, signInWithGoogle, renderGoogleSignInButton, initializeGoogleSignIn };