const createIssue = (req, res) => {
  res.send("creating issue");
};
const getAllIssues = (req, res) => {
  res.send("All issues fetched");
};

const updateIssueById = (req, res) => {
  res.send("updating issue");
};

const deleteIssueById = (req, res) => {
  res.send("deleting issue");
};

const getIssueById = (req, res) => {
  res.send("Got issue by id");
};

export {
  createIssue,
  getAllIssues,
  updateIssueById,
  deleteIssueById,
  getIssueById,
};
