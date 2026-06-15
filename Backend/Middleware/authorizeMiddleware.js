import Repository from "../model/repoModel.js";
import Notification from "../model/notificationModel.js";

export const authorizeUser =
  (paramName = "id") =>
  (req, res, next) => {
    const targetUserId = req.params[paramName] || req.body[paramName];

    if (!targetUserId) {
      return res.status(400).json({ error: "Target user id is required" });
    }

    if (String(targetUserId) !== String(req.userId)) {
      return res.status(403).json({ error: "Forbidden: unauthorized user" });
    }

    return next();
  };

export const authorizeRepositoryOwner = async (req, res, next) => {
  const repositoryId = req.params.id;
  if (!repositoryId) {
    return res.status(400).json({ error: "Repository id is required" });
  }

  const repository = await Repository.findById(repositoryId).lean();
  if (!repository) {
    return res.status(404).json({ error: "Repository not found" });
  }

  if (String(repository.owner) !== String(req.userId)) {
    return res.status(403).json({ error: "Forbidden: not repository owner" });
  }

  req.repository = repository;
  return next();
};

export const authorizeNotificationOwner = async (req, res, next) => {
  const notificationId = req.params.id;
  if (!notificationId) {
    return res.status(400).json({ error: "Notification id is required" });
  }

  const notification = await Notification.findById(notificationId).lean();
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  if (String(notification.recipient) !== String(req.userId)) {
    return res.status(403).json({ error: "Forbidden: not notification owner" });
  }

  req.notification = notification;
  return next();
};
