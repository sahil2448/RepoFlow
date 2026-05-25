// helpers/logContribution.js
import Contribution from "../model/contributionModel.js";

/**
 * Call this inside any controller after a successful user action.
 * Intentionally fire-and-forget — never let a logging failure
 * break the actual API response.
 *
 * @example
 * await logContribution(userId, "repo_created");
 */
const logContribution = async (userId, type) => {
  try {
    const date = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    await Contribution.create({ userId, type, date });
  } catch (err) {
    console.error("logContribution failed silently:", err);
  }
};

export default logContribution;
