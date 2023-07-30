// libraries/authMiddleware.ts
import { Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import {
  createUser,
  getUserById,
  getUserByProviderId,
} from "../components/users/domain";
import { PassportUser } from "../custom";

export const authMiddleware = (app: Express) => {
  app.use(
    session({ secret: "secret-key", resave: true, saveUninitialized: true })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: PassportUser, done) => {
    if (user.id != null) {
      // check if id is not null and not undefined
      done(null, user.id);
    } else {
      done(new Error("User ID is not defined"));
    }
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      // Find the user in your database here. For example:
      const user = await getUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: `${process.env.API_URL}/auth/google/callback`,
      },
      async function (accessToken, refreshToken, profile, cb) {
        console.log("profilesss", profile);
        let user = await getUserByProviderId(profile.id);
        if (!user) {
          user = await createUser({
            provider_id: profile.id,
            email: profile.emails?.[0].value,
            provider: profile.provider,
            image_url: profile.photos?.[0]?.value,
            display_name: profile.displayName,
          });
        }

        return cb(null, user);
      }
    )
  );
};
