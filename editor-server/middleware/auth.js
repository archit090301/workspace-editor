export function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

export function ensureRole(roleId) {
  return (req, res, next) => {
    if (!(req.isAuthenticated && req.isAuthenticated())) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = Number(req.user.role_id);
    if (userRole !== Number(roleId)) {
      console.warn(
        `🚫 Forbidden: user ${req.user?.username} tried to access role ${roleId} route`
      );
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}


export const ensureAdmin = ensureRole(2);
