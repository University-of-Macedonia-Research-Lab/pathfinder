import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as domain from "./domain";

const router = express.Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: `${process.env.API_URL}/auth/google/callback`,
    },
    async function (accessToken, refreshToken, profile, cb) {
      let user = await domain.getUserByProviderId(profile.id);

      if (!user) {
        user = await domain.createUser({
          providerId: profile.id,
          email: profile.emails?.[0].value,
          // Add any other profile information you want to store here
        });
      }

      return cb(null, user);
    }
  )
);

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

router.get("/user", async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(404).send();
  }
});

router.get("/user/email/:email", async (req, res) => {
  const user = await domain.getUserByEmail(req.params.email);
  if (user) {
    res.json(user);
  } else {
    res.status(404).send();
  }
});

export default router;
