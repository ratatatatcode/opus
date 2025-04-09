const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

const isLogged = (req) => Boolean(req.session.userId);

// View other user?
router.get("/profile", (req, res) => {
  if (isLogged(req)) {
    userController.displayProfile(req, res);
  } else {
    res.redirect("/");
  }
});

router.get("/payment", (req, res) => {
  if (isLogged(req)) {
    userController.getPaymentPage(req, res);
  } else {
    res.redirect("/");
  }
});

router.post("/api/payment/pay", userController.addPoints);
router.post("/api/payment/subscription", userController.buySubscription);

module.exports = router;
