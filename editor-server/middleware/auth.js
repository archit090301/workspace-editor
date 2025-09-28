exports.ensureAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
};

exports.ensureRole = (roleId) => (req, res, next) => {
  if (!(req.isAuthenticated && req.isAuthenticated())) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Convert both sides to numbers (or strings) for safety
  const userRole = Number(req.user.role_id);

  if (userRole !== Number(roleId)) {
    console.warn(`🚫 Forbidden: user ${req.user.username} tried to access role ${roleId} route`);
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

// Shortcut for admin-only routes
exports.ensureAdmin = exports.ensureRole(2);
