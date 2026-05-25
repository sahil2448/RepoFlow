import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient, ReturnDocument } from "mongodb";
import { configDotenv } from "dotenv";
import { ObjectId } from "mongodb";
configDotenv();
// Note --> In this file we have used mongo queries using MongoDB ...not Mongoose -> in the repositories we have used Mongoose

const URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY;
let client;

async function connectToClient() {
  if (!client) {
    client = new MongoClient(URI);
  }
  await client.connect();
}

const signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // connect to the database
    await connectToClient();
    const db = client.db(DB_NAME);
    const userCollection = db.collection("users");
    const user = await userCollection.findOne({ username });

    if (user) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds - password encryption
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

    res.json({ token, userId: result.insertedId }).status(200); // status code -- 200 means success
  } catch (error) {
    console.error("Error during signup", error);
    res.status(500).send("Server error");
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    await connectToClient();
    const db = client.db(DB_NAME);
    const userCollection = db.collection("users");

    const user = await userCollection.findOne({ email });

    if (!user) {
      return res.status(404).send("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send("Invalid password");
    }

    // check if token is expired

    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ token, userId: user._id }).status(200);
  } catch (error) {
    return res.status(500).send("Server error");
  }
};

async function getAllUsers(req, res) {
  try {
    // connect to db
    await connectToClient();
    const db = client.db(DB_NAME);
    const userCollection = db.collection("users");
    const users = await userCollection.find({}).toArray(); // .toArray() returns a promise....written here otherwise will get error because will not be able to convert to json hence no response

    res.json(users).status(200);
  } catch (err) {
    console.log("Error during getting all users", err.message);
    res.status(500).send("Server Error");
  }
}

async function getUserProfile(req, res) {
  const currentId = req.params.id;

  try {
    await connectToClient();
    const db = client.db(DB_NAME);
    const userCollection = db.collection("users");

    const user = await userCollection.findOne({
      _id: new ObjectId(currentId),
    });

    if (!user) {
      return res.status(404).send("User not found");
    }
    res.json(user).status(200);
    console.log("User profile fetched successfully");
  } catch (error) {
    res.status(500).send("Server Error");
  }
}

const updateUserProfile = async (req, res) => {
  const currentId = req.params.id;
  const { email, password } = req.body;

  try {
    await connectToClient();
    const db = client.db(DB_NAME);
    const userCollection = db.collection("users");

    const updateFields = {};
    if (email) updateFields.email = email;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }

    const result = await userCollection.findOneAndUpdate(
      { _id: new ObjectId(currentId) },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    if (!result.value) {
      return res.status(404).send("User not found!");
    }

    return res.status(200).json(result.value);
  } catch (error) {
    return res.status(500).send("Server Error");
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

// fetch all the starred repos

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
  const { currentUserId } = req.body;

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
