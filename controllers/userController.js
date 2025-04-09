const { subscribe } = require("firebase/data-connect");
const { db } = require("../config/firebase");
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

exports.displayProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return res.status(404).send("User not found.");
    const user = userSnap.data();

    return res.render("user/profile.ejs", { user });
  } catch (e) {
    console.log(e);
  }
};

exports.getPaymentPage = async (req, res) => {
  try {
    const userId = req.session.userId;
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
          subscriptionExpiry: null
        });
      }
    }

    res.render("user/payment.ejs", { hasSubscription, remainingDays });
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
};

exports.buySubscription = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return res.status(404).send("User not found.");
    const userData = userSnap.data();

    if(userData.points >= 50) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      await updateDoc(userRef, {
        subscription: true,
        subscriptionExpiry: expiryDate.toISOString(),
        points: userData.points - 50
      });

      return res.status(200).json({
        success: true,
        message: "Thank you for buying subscription!",
      });
    }

    return res.status(200).json({
      success: false,
      message: "Not enough points",
    });
  } catch (e) {
    console.log(e);

    return res.status(500).json({
      success: false,
      message: "Failed to process your payment",
    });
  }
};

exports.addPoints = async (req, res) => {
  try {
    const { amount } = req.body;

    const userId = req.session.userId;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return res.status(404).send("User not found.");
    const userData = userSnap.data();

    await updateDoc(userRef, { points: userData.points + parseInt(amount) });

    return res.status(200).json({
      success: true,
      message: "Thank you for buying some points!",
    });
  } catch (e) {
    console.log(e);

    return res.status(500).json({
      success: false,
      message: "Failed to process your payment",
    });
  }
};
