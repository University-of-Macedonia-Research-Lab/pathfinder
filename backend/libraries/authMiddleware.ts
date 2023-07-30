// libraries/authMiddleware.ts
import { Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getUserByProviderId } from "../components/users/data-access";
import session from "express-session";
import { PassportUser } from "../custom";

export const authMiddleware = (app: Express) => {
  app.use(
    session({ secret: "secret-key", resave: true, saveUninitialized: true })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          // Find or create the user in your database here.
          const user = await getUserByProviderId(profile.id);
          return cb(null, user as PassportUser);
        } catch (error) {
          cb(error as Error);
        }
      }
    )
  );

  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      // Find the user in your database here. For example:
      const user = await getUserByProviderId(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
