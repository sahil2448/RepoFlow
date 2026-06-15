import mongoose from "mongoose";
import Issue from "../model/issueModel.js";
import User from "../model/userModel.js";
import Repository from "../model/repoModel.js";

import { getIO } from "../helpers/socketInstance.js";
import { notifyUser } from "../helpers/notifyUser.js";

import { ObjectId } from "mongodb";
import logContribution from "../helpers/logContribution.js";

async function createRepository(req, res) {
  const { name, issues, content, description, visibility } = req.body;
  const owner = req.body.owner || req.userId;

  try {
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const ownerUser = await User.exists({ _id: owner });
    if (!ownerUser) {
      return res.status(404).json({ error: "Owner user not found" });
    }

    const newRepository = new Repository({
      name,
      description,
      visibility,
      owner,
      content,
      issues,
    });

    const result = await newRepository.save();

    await User.findByIdAndUpdate(owner, {
      $push: { repositories: result._id },
    });

    console.log(ownerUser);
    await logContribution(owner, "repo_created");

    return res.status(201).json({
      message: "Repository created successfully",
      repositoryId: result._id,
    });
  } catch (error) {
    console.log("Error :", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({})
      .populate("owner")
      .populate("issues");

    res
      .status(200)
      .json({ repositories, message: "Repositories fetched successfully" });
  } catch (error) {
    console.log("Error during fetching all repositories", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function fetchRepositoryById(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id)
      .populate("owner")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    res.status(200).json({
      repository,
      message: "Repository fetched successfully",
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid Repository ID format" });
    }

    console.error("Error during fetching repo by id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function fetchRepositoryByName(req, res) {
  const { name } = req.params;
  try {
    const repository = await Repository.findOne({ name })
      .populate("owner")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    res.status(200).json({ repository });
  } catch (error) {
    console.log("Error during fetching repo by name", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function fetchRepositoriesForCurrentUser(req, res) {
  const { userId } = req.params;

  try {
    const repositories = await Repository.find({ owner: userId });

    if (!repositories || repositories.length === 0) {
      return res.status(404).json({ error: "No repositories found" });
    }

    res.status(200).json({ repositories, message: "Repositories fetched" });
  } catch (error) {
    console.log("Error during fetching repositories for current user", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    repository.content.push(content);
    repository.description = description;

    const updatedRepository = await repository.save();

    res.status(200).json({
      message: "Repository updated successfully",
      repository: updatedRepository,
    });
  } catch (error) {
    console.log("Error during updateing repositories for current id", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function toggleVisibility(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    res.status(200).json({
      message: "Repository visibility toggled successfully",
      repository: updatedRepository,
    });
  } catch (error) {
    console.log("Error during toggeling repository visibility", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteRepositoryById(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findByIdAndDelete(id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    await User.findByIdAndUpdate(repository.owner, {
      $pull: { repositories: repository._id },
    });

    return res.status(200).json({ message: "Repository deleted successfully" });
  } catch (error) {
    console.log("Error during deleting repository by id", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function starRepository(req, res) {
  const { id } = req.params;
  const userId = req.body.userId || req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const repository = await Repository.findById(id);
    const user = await User.findById(userId);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let updatedRepository;

    if (repository.starredUsers.includes(userId)) {
      repository.stars = Math.max(0, repository.stars - 1);
      repository.starredUsers = repository.starredUsers.filter(
        (starredId) => starredId.toString() !== userId,
      );
      user.starredRepositories = user.starredRepositories.filter(
        (repoId) => repoId.toString() !== id,
      );
      updatedRepository = await repository.save();
      await user.save();

      return res.status(200).json({
        message: "Repository unstarred successfully",
        stars: updatedRepository.stars,
      });
    } else {
      repository.stars += 1;
      repository.starredUsers.push(userId);
      user.starredRepositories.push(repository._id);
      updatedRepository = await repository.save();
      await logContribution(userId, "repo_starred");
      await notifyUser(getIO(), {
        recipientId: repository.owner,
        senderId: userId,
        type: "repo_starred",
        message: `starred your repository ${repository.name}`,
        link: `/repo/${repository.name}/${repository._id}`,
      });
      await user.save();

      return res.status(200).json({
        message: "Repository starred successfully",
        stars: updatedRepository.stars,
      });
    }
  } catch (error) {
    console.error("Error during starring repository:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibility,
  deleteRepositoryById,
  starRepository,
};
