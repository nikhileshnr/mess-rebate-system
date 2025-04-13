// authMiddleware.js
const authMiddleware = (req, res, next) => {
    // Check if a session exists (if a user is logged in)
    if (req.session && req.session.manager) {
      // User is authenticated, proceed to the next middleware/route handler
      return next();
    } else {
      // User is not authenticated, respond with a 401 Unauthorized error
      return res.status(401).json({ error: "Unauthorized, please log in first." });
    }
  };
  
  export default authMiddleware;
  