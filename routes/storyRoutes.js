const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");

const isLogged = (req) => Boolean(req.session.userId);

router.get("/add", (req, res) => {
  if (isLogged(req)) {
    res.render("story/add.ejs");
  } else {
    res.redirect("/");
  }
});

router.get("/story", (req, res) => {
  if (isLogged(req)) {
    storyController.getAllStories(req, res);
  } else {
    res.redirect("/");
  }
});

router.get("/story/:id", (req, res) => {
  if (isLogged(req)) {
    storyController.getStoryById(req, res);
  } else {
    res.redirect("/");
  }
});

router.post("/api/story/add", storyController.addStory);

module.exports = router;
