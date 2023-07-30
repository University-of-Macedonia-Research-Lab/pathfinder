import express from "express";
import passport from "passport";
import * as domain from "./domain";

const router = express.Router();

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/google/success",
    failureRedirect: "/auth/google/failure",
  })
);

router.get("/auth/google/success", (_, res) =>
  res.redirect(`${process.env.WEBSITE_URL}`)
);

router.get("/auth/google/failure", (req, res) => res.end("you failed"));

router.post("/user", async (req, res) => {
  console.log("in here");
  const user = await domain.createUser(req.body);
  res.json(user);
});

router.get("/user", async (req, res, next) => {
  if (req.user) {
    res.json(req.user);
  } else {
    next();
  }
});

router.get("/user/email/:email", async (req, res, next) => {
  const user = await domain.getUserByEmail(req.params.email);
  if (user) {
    res.json(user);
  } else {
    next();
  }
});

export default router;
