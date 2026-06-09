
import Contribution from "../model/contributionModel.js";

const logContribution = async (userId, type) => {
  try {
    const date = new Date().toISOString().split("T")[0]; 
    await Contribution.create({ userId, type, date });
  } catch (err) {
    console.error("logContribution failed silently:", err);
  }
};

export default logContribution;
