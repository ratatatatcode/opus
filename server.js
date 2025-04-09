require("dotenv").config();
const express = require("express");
const app = express();
const session = require("express-session");
const path = require("path");
const auth = require("./routes/authRoutes");
const story = require("./routes/storyRoutes");
const user = require("./routes/userRoutes");

app.use(
  session({
    secret: process.env.SECRET_SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.use("/", auth, story, user);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Listening to PORT ${PORT}...`);
});
