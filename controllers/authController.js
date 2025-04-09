const { auth, db } = require("../config/firebase");
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} = require("firebase/auth");
const {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} = require("firebase/firestore");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!auth) console.log("Firebase Auth is not initialized.");

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const userId = user.uid;
    req.session.userId = userId;
    console.log(userId);

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return res.status(404).send("User not found.");

    const userData = userSnap.data();
    let hasSubscription = false;
    let remainingDays = null;

    if (userData.subscription && userData.subscriptionExpiry) {
      const now = new Date();
      const expiryDate = new Date(userData.subscriptionExpiry);

      if (expiryDate > now) {
        const diffTime = expiryDate - now;
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        hasSubscription = true;
      } else {
        await updateDoc(userRef, {
          subscription: false,
          subscriptionExpiry: null,
        });
      }
    }

    return res.status(200).json({
      success: true,
      hasSubscription,
      remainingDays,
    });
  } catch (e) {
    if (
      e.code === "auth/wrong-password" ||
      e.code === "auth/user-not-found" ||
      e.code === "auth/invalid-credential"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Add fallback?
    console.log(e);
  }
};

exports.signup = async (req, res) => {
  let user = null;

  try {
    const { name, email, password } = req.body;

    if (!auth) console.log("Firebase Auth is not initialized");

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    user = userCredential.user;
    const userId = user.uid;

    const userData = {
      userId,
      name,
      email,
      subscription: false,
      subscriptionExpiry: null,
      points: 0,
    };

    await setDoc(doc(db, "users", userId), { ...userData });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (e) {
    if (e.code === "auth/email-already-in-use") {
      return res.status(409).json({
        success: false,
        message: "The email address is already in use",
      });
    }

    if (user) {
      try {
        await deleteUser(user);
        console.log("Account deleted due to error:", e);
      } catch (authError) {
        console.log("Failed to delete account from Firebase Auth:", authError);
      }
    }

    console.log(e);
  }
};

exports.resetPasswordForEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    let emailFound = false;

    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", email),
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (!usersSnapshot.empty) {
      emailFound = true;
    }

    if (!emailFound) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    await sendPasswordResetEmail(auth, email);

    return res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);

    if (error.code === "auth/user-not-found") {
      return res.status(404).json({
        success: false,
        message: "No user found with that email address",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to send password reset email",
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    res.redirect("/");
  });
};
