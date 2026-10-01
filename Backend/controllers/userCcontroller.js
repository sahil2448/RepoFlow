import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient, ReturnDocument } from "mongodb";
import { configDotenv } from "dotenv";
import { ObjectId } from "mongodb";
import { notifyUser } from "../helpers/notifyUser.js";
import { getIO } from "../helpers/socketInstance.js";
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheKeys,
} from "../helpers/cache.js";
configDotenv();

const URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
const SECRET_KEY =
  process.env.JWT_SECRET || process.env.SECRET_KEY || "repoflow_default_secret";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
let client;

async function connectToClient() {
  if (!client) {
    client = new MongoClient(URI);
  }
  await client.connect();
}

const signup = async (req, res) => {
  const rawUsername = req.body?.username;
  const rawEmail = req.body?.email;
  const rawPassword = req.body?.password;

  const username = typeof rawUsername === "string" ? rawUsername.trim() : "";
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!username) {
    return res.status(400).json({ error: "Username is required." });
  }
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email address." });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required." });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    });
  }

  try {
    await connectToClient();
    const db = client.db(DB_NAME);
    const userCollection = db.collection("users");
    const existingUser = await userCollection.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      const message =
        existingUser.username === username
          ? "Username already exists."
          : "An account with this email already exists.";
      return res.status(409).json({ error: message });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username,
      email,
      password: hashedPassword,
      repositories: [],
      followedUsers: [],
      starRepositories: [],
    };

    const result = await userCollection.insertOne(newUser);

    const token = jwt.sign({ id: result.insertedId }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res
      .status(200)
      .json({ token, userId: result.insertedId, username });
  } catch (error) {
    console.error("Error during signup", error);
    res.status(500).json({ error: "Server error" });
  }
};

const login = async (req, res) => {
  const rawEmail = req.body?.email;
  const rawPassword = req.body?.password;

  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required." });
  }

  try {
    await connectToClient();
    const db = client.db(DB_NAME);
    const userCollection = db.collection("users");

    const user = await userCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });

    res
      .status(200)
      .json({
        token,
        userId: user._id,
        username: user.username,
        avatar: user.avatar || "",
      });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

async function getAllUsers(req, res) {
  try {
    await connectToClient();
    const db = client.db(DB_NAME);
    const userCollection = db.collection("users");
    const users = await userCollection.find({}).toArray();

    res.json(users).status(200);
  } catch (err) {
    console.log("Error during getting all users", err.message);
    res.status(500).send("Server Error");
  }
}

const getUserProfile = async (req, res) => {
  const { id } = req.params;
  try {
    // Cache hit — serve straight from Redis without touching MongoDB.
    const key = cacheKeys.userProfile(id);
    const cached = await cacheGet(key);
    if (cached) {
      return res.status(200).json(cached);
    }

    await connectToClient();
    const db = client.db(DB_NAME);
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          password: 0,
        },
      },
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    const payload = {
      ...user,
      followers: user.myFollowers?.length ?? 0,
      following: user.followingUsers?.length ?? 0,
    };

    await cacheSet(key, payload, 30); // short TTL: edits appear quickly
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateUserProfile = async (req, res) => {
  const { id } = req.params;

  const { username, email, bio, location, website, avatar } = req.body;

  try {
    await connectToClient();
    const db = client.db(DB_NAME);

    const updateFields = {};
    if (username !== undefined) updateFields.username = username;
    if (email !== undefined) updateFields.email = email;
    if (bio !== undefined) updateFields.bio = bio;
    if (location !== undefined) updateFields.location = location;
    if (website !== undefined) updateFields.website = website;
    if (avatar !== undefined) updateFields.avatar = avatar;

    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: "after", projection: { password: 0 } },
      );

    if (!result) return res.status(404).json({ error: "User not found" });

    await cacheDelete(cacheKeys.userProfile(id));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteUser = async (req, res) => {
  const currentId = req.params.id;

  try {
    await connectToClient();
    const db = client.db(DB_NAME);
    const userCollection = db.collection("users");

    const result = await userCollection.findOneAndDelete({
      _id: new ObjectId(currentId),
    });

    if (!result.deleteCount == 0) {
      return res.status(404).send("User not found");
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).send("Server Error");
  }
};

const fetchStarredRepos = async (req, res) => {
  const { id } = req.params;

  try {
    await connectToClient();
    const db = client.db(DB_NAME);

    const userCollection = db.collection("users");
    const repoCollection = db.collection("repositories");

    const user = await userCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const starredRepos = await repoCollection
      .find({
        _id: {
          $in: (user.starredRepositories || []).map(
            (repoId) => new ObjectId(repoId),
          ),
        },
      })
      .toArray();

    return res.status(200).json({ repositories: starredRepos });
  } catch (error) {
    console.error("Error fetching starred repos:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const followUser = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.userId;

  if (!currentUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await connectToClient();
    const db = client.db(DB_NAME);
    const userCollection = db.collection("users");

    const targetUser = await userCollection.findOne({ _id: new ObjectId(id) });
    const currentUser = await userCollection.findOne({
      _id: new ObjectId(currentUserId),
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Target User not found" });
    }

    if (!currentUser) {
      return res.status(404).json({ error: "Current User not found" });
    }

    if (currentUserId === id) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { myFollowers: currentUserId } },
    );

    await userCollection.updateOne(
      { _id: new ObjectId(currentUserId) },
      { $addToSet: { followingUsers: id } },
    );

    // Follower/following counts changed on both profiles — drop cached copies.
    await cacheDelete(
      cacheKeys.userProfile(id),
      cacheKeys.userProfile(currentUserId),
    );

    await notifyUser(getIO(), {
      recipientId: id,
      senderId: currentUserId,
      type: "new_follower",
      message: `started following you`,
      link: `/profile/${currentUserId}`,
    });
    return res
      .status(200)
      .json({ message: `You are now following ${targetUser.name}` });
  } catch (error) {
    console.error("Error following user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export {
  getAllUsers,
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  fetchStarredRepos,
  followUser,
};
