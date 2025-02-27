import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, type User } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

// Fixed type declaration to avoid recursive reference
declare global {
  namespace Express {
    interface User extends Omit<User, 'password'> { }
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "youtube-ai-summarizer-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
      sameSite: "none",
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password auth
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user || !user.password) {
          return done(null, false, { message: "Incorrect username or password." });
        }

        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect username or password." });
        }

        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        return done(new Error('User not found'));
      }

      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (err) {
      done(err);
    }
  });

  // Routes for local authentication
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).send("Username and password are required");
      }

      if (username.length < 3) {
        return res.status(400).send("Username must be at least 3 characters");
      }

      if (password.length < 6) {
        return res.status(400).send("Password must be at least 6 characters");
      }

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await crypto.hash(password);

      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          subscription: "free",
          provider: null,
          email: null,
          avatar: null,
        })
        .returning();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      req.login(userWithoutPassword, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: userWithoutPassword,
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }

      req.login(user, (err) => {
        if (err) {
          return next(err);
        }

        return res.json({
          message: "Login successful",
          user,
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }

      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }

    res.status(401).send("Not logged in");
  });

  // Placeholder routes for social authentication
  // These will be configured when OAuth credentials are available
  app.get("/auth/google", (req, res) => {
    res.status(501).send("Google authentication not configured");
  });

  app.get("/auth/github", (req, res) => {
    res.status(501).send("GitHub authentication not configured");
  });

  app.get("/auth/apple", (req, res) => {
    res.status(501).send("Apple authentication not configured");
  });
}