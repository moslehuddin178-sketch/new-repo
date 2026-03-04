/**
 * Role-based access control middleware
 * @param {String|Array} allowedRoles - The role(s) allowed to access the route
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // 1. Check if user exists (set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    // 2. Normalize allowedRoles to an array if it's a single string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
 console.log('Allowed Roles:', roles); // Debugging log
 console.log('User Role:', req.user); // Debugging log
    // 3. Check if user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: You do not have the required permissions (${roles.join(', ')})` 
      });
    }

    // 4. User has the right role, move to the next function
    next();
  };
};

module.exports = roleMiddleware;