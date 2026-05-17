import mongoose from "mongoose";
import Issue from "../model/issueModel.js";
import User from "../model/userModel.js";
import Repository from "../model/repoModel.js";

import { ObjectId } from "mongodb";
// as we are using mongoose here....we don't need to always setup our databse connection and also don't need to get collection....we can do queries directly on model

async function createRepository(req, res) {
  const { owner, name, issues, content, description, visibility } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    // ✅ Add this — ensure the owner actually exists
    const ownerUser = await User.findById(owner);
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
    res.status(201).json({
      message: "Repository created successfully",
      repositoryId: result._id,
    });
  } catch (error) {
    console.log("Error :", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({})
      .populate("owner")
      .populate("issues"); // populate -> to fetch data from another collections like user collection and issue collection

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
      .populate("owner") // Optionally only fetch specific fields
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    res.status(200).json({
      repository,
      message: "Repository fetched successfully",
    });
  } catch (error) {
    // If 'id' is not a valid 24-character hex string, Mongoose throws a CastError
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
  const userId = req.user;

  try {
    const repositories = await Repository.find({ owner: userId });

    if (!repositories || reqpositories.length === 0) {
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

    // Save the updated repository

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

    res.status(200).json({ message: "Repository deleted successfully" });
  } catch (error) {
    console.log("Error during deleting repository by id", error);
    res.status(500).json({ error: "Internal server error" });
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
};
