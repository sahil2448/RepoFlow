
import Contribution from "../model/contributionModel.js";

export const getUserContributions = async (req, res) => {
  const { userId } = req.params;

  try {
    const year = new Date().getFullYear();
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const raw = await Contribution.find({
      userId,
      date: { $gte: start, $lte: end },
    }).lean();

    
    
    const grouped = raw.reduce((acc, doc) => {
      acc[doc.date] = (acc[doc.date] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));

    return res.status(200).json({ contributions: result, year });
  } catch (err) {
    console.error("Error fetching contributions:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
