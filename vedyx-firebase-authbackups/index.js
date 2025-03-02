const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.backupAuthUsers = onRequest(async (req, res) => {
  try {
    const listUsers = async (nextPageToken) => {
      const users = [];
      const result = await admin.auth().listUsers(1000, nextPageToken);
      users.push(...result.users.map((user) => user.toJSON()));
      if (result.pageToken) {
        users.push(...(await listUsers(result.pageToken)));
      }
      return users;
    };

    const allUsers = await listUsers();
    
    res.status(200).json({
      message: "Backup completed successfully",
      userCount: allUsers.length,
      users: allUsers,
    });
  } catch (error) {
    console.error("Error backing up auth users:", error);
    res.status(500).json({ error: error.message });
  }
});
