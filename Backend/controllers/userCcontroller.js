import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { configDotenv } from "dotenv";
configDotenv();

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
const getAllUsers = (req, res) => {
  res.send("All users fetched");
};

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
      respositories: [],
      followedUsers: [],
      starRepositories: [],
    };

    const result = await userCollection.insertOne(newUser);

    const token = jwt.sign({ id: result.insertedId }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({ token }).status(200); // status code -- 200 means success
  } catch (error) {
    console.error("Error during signup", error);
    res.status(500).send("Server error");
  }
};

const login = (req, res) => {
  res.send("Logging in");
};

const getUserProfile = (req, res) => {
  res.send("Getting user profile");
};

const updateUserProfile = (req, res) => {
  res.send("Updating user profile");
};

const deleteUser = (req, res) => {
  res.send("Deleting user");
};

export {
  getAllUsers,
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUser,
};
