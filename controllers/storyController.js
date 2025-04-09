const { auth, db } = require("../config/firebase");
const {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
} = require("firebase/firestore");
const { v4: uuidv4 } = require("uuid");

exports.addStory = async (req, res) => {
  try {
    const { title, content, genre } = req.body;

    const userId = req.session.userId;
    const storyId = uuidv4();
    const storyRef = doc(db, "stories", storyId);

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const storyData = {
      storyId,
      userId,
      title,
      content,
      genre,
      author: userData.name,
      createdAt: new Date().toISOString(),
    };

    await setDoc(storyRef, { ...storyData });
    await updateDoc(userRef, { points: userData.points + 1 });

    return res.status(200).json({
      success: true,
      message: "Your story is live and ready to read!",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Please try again later",
    });
  }
};

exports.getStoryById = async (req, res) => {
  try {
    const userId = req.session.userId;
    const storyRef = doc(db, "stories", req.params.id);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      return res.status(404).send("Story not found.");
    }

    const story = storySnap.data();

    let hasSubscription = false;

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).send("Story not found.");
    }

    const userData = userSnap.data();

    if (userData.subscription) {
      hasSubscription = true;
    }

    return res.render("story/view.ejs", { story, hasSubscription });
  } catch (e) {
    console.log(e);
    return res.status(500).send("Failed to look up the story");
  }
};

exports.getAllStories = async (req, res) => {
  try {
    const storyDocs = await getDocs(collection(db, "stories"));
    const stories = storyDocs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.render("story/list", { stories });
  } catch (e) {
    console.log(e);
    return res.status(500).send("Failed to look up the story");
  }
};
