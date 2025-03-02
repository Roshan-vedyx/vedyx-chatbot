const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const express = require("express");
const axios = require("axios");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Google OAuth2 Client
const GOOGLE_CLIENT_ID = "81285666995-k5nbqbqnhj5kpr4q6pupl7hbsska7j7c.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Express App
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Log Incoming Requests for debugging
app.use((req, res, next) => {
  console.log(`🔹 Incoming Request: ${req.method} ${req.url}`);
  
  // Only log token presence, not the actual token
  if (req.body && req.body.idToken) {
    console.log('🔹 ID Token received (length:', req.body.idToken.length, ')');
  } else if (req.body && req.body.accessToken) {
    console.log('🔹 Access Token received (length:', req.body.accessToken.length, ')');
  }
  
  next();
});

/**
 * Google Sign-In Handler
 */
app.post("/", async (req, res) => {
  try {
    console.log("📌 Starting Google authentication process...");
    
    // Check for tokens in request body
    const { idToken, accessToken, userInfo } = req.body;
    
    let uid, email, displayName, photoURL;
    
    // Handle ID Token flow (One Tap)
    if (idToken) {
      console.log(`📌 Authenticating with ID Token (length: ${idToken.length})`);
      
      try {
        // Verify Google ID Token
        const ticket = await client.verifyIdToken({
          idToken,
          audience: GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        
        if (!payload || !payload.sub) {
          console.error("❌ Invalid payload from Google ID Token");
          return res.status(401).json({ error: "Invalid Google Token Payload" });
        }
        
        uid = payload.sub;
        email = payload.email;
        displayName = payload.name;
        photoURL = payload.picture;
        
        console.log("✅ Google ID token verified for:", { uid, email });
      } catch (verifyError) {
        console.error("❌ Failed to verify Google ID Token:", verifyError.message);
        return res.status(401).json({ 
          error: "Failed to verify Google ID Token",
          message: verifyError.message
        });
      }
    } 
    // Handle Access Token flow (OAuth popup)
    else if (accessToken) {
      console.log(`📌 Authenticating with Access Token (length: ${accessToken.length})`);
      
      try {
        // If userInfo was not provided, fetch it using the access token
        if (!userInfo) {
          console.log("📌 Fetching user info with access token...");
          const userInfoResponse = await axios.get(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
          );
          userInfo = userInfoResponse.data;
        }
        
        if (!userInfo || !userInfo.sub) {
          console.error("❌ Invalid user info from Access Token");
          return res.status(401).json({ error: "Invalid User Info" });
        }
        
        uid = userInfo.sub;
        email = userInfo.email;
        displayName = userInfo.name;
        photoURL = userInfo.picture;
        
        console.log("✅ Google access token verified for:", { uid, email });
      } catch (accessTokenError) {
        console.error("❌ Failed to verify Google Access Token:", accessTokenError.message);
        return res.status(401).json({ 
          error: "Failed to verify Google Access Token",
          message: accessTokenError.message
        });
      }
    } else {
      console.error("❌ Missing authentication tokens in request");
      return res.status(400).json({ error: "Missing ID Token or Access Token" });
    }
    
    // Create Firebase Custom Token
    console.log("📌 Creating Firebase custom token...");
    let firebaseToken;
    try {
      firebaseToken = await admin.auth().createCustomToken(uid);
    } catch (tokenError) {
      console.error("❌ Failed to create Firebase custom token:", tokenError.message);
      return res.status(500).json({ 
        error: "Failed to create Firebase token",
        message: tokenError.message 
      });
    }
    
    // Save user to Firestore
    console.log("📌 Saving user to Firestore...");
    try {
      await admin.firestore().collection("users").doc(uid).set(
        { 
          email, 
          displayName, 
          photoURL, 
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
          uid
        },
        { merge: true }
      );
      console.log("✅ User saved to Firestore successfully");
    } catch (firestoreError) {
      // Don't fail the entire process if Firestore write fails
      console.error("⚠️ Failed to save user to Firestore:", firestoreError.message);
      // Continue with authentication
    }
    
    console.log("✅ Authentication successful for:", { uid, email });
    return res.status(200).json({ 
      firebaseToken,
      user: { uid, email, displayName, photoURL }
    });
    
  } catch (error) {
    console.error("❌ Unhandled error in Google OAuth process:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error.message 
    });
  }
});

/**
 * Test Route (Check if Cloud Function is running)
 */
app.get("/test", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "✅ Auth Google Cloud Function is running!",
    timestamp: new Date().toISOString(),
    clientId: GOOGLE_CLIENT_ID.substring(0, 8) + "..." // Show partial client ID for verification
  });
});

// Deploy as Firebase Cloud Function
exports.authGoogle = functions
  .region("asia-south1")
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
    minInstances: 0
  })
  .https.onRequest(app);