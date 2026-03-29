const getAllUsers = (req, res) => {
  res.send("All users fetched");
};

const signup = (req, res) => {
  res.send("Signing up");
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
