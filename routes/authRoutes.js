const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const isLogged = (req) => Boolean(req.session.userId);

router.get("/", (req, res) => {
  if (isLogged(req)) {
    res.redirect("/story");
  } else {
    res.render("auth/login.ejs");
  }
});

router.get("/signup", (req, res) => res.render("auth/signup.ejs"));
router.get("/recovery", (req, res) => res.render("auth/forgotPassword.ejs"));

router.post("/api/auth/login", authController.login);
router.post("/api/auth/signup", authController.signup);
router.post("/api/auth/recovery", authController.resetPasswordForEmail);
router.get("/api/auth/logout", authController.logout); // get -> post

module.exports = router;
