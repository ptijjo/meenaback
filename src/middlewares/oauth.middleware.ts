import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ORIGIN, SERVEUR_URL } from '../config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';


console.log(`${SERVEUR_URL}/auth/google/callback`)

passport.use(
  new GoogleStrategy(
    {
      clientID: String(GOOGLE_CLIENT_ID!),
      clientSecret: String(GOOGLE_CLIENT_SECRET!),
      callbackURL: `${SERVEUR_URL}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    },
  ),
);

// Sérialisation/désérialisation utilisateur
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

export default passport;