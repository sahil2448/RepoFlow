const createRepository = (req, res) => {
  res.send("creating Repo");
};
const getAllRepositories = (req, res) => {
  res.send("All Repositories fetched");
};

const fetchRepositoryById = (req, res) => {
  res.send("Got Repo by id");
};

const fetchRepositoryByName = (req, res) => {
  res.send("Got Repo by name");
};

const fetchRepositoriesForCurrentUser = (req, res) => {
  res.send("Got Repos for current user");
};

const updateRepositoryById = (req, res) => {
  res.send("updating Repo by id");
};

const toggleVisibility = (req, res) => {
  res.send("toggling visibility");
};

const deleteRepositoryById = (req, res) => {
  res.send("deleting Repo by id");
};

export {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibility,
  deleteRepositoryById,
};
