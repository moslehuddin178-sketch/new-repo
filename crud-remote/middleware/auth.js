const jwt = require('jsonwebtoken');

const authenticationMiddleware = (req, res, next) => {
  // 1. Get token from Headers (Standard: 'Bearer <token>')
  const authHeader = req.headers['authorization'];
  //console.log('Authorization Header:', authHeader); // Debugging log
  const token = authHeader && authHeader.split(' ')[1]; 
 //console.log('Extracted Token:', token); // Debugging log
  // 2. If no token, block the request
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  try {
    // 3. Verify token using your Secret Key
    const verified = jwt.verify(token, 'fgdsfdgs'); // Use process.env.JWT_SECRET in production
   // console.log('Verified Token Payload:', verified); // Debugging log
    
    // 4. Attach user data to the request so the next function can use it
    req.user = verified; 
    
    // 5. Move to the actual route handler
    next(); 
  } catch (error) {
    res.status(403).json({ message: 'Invalid or Expired Token' });
  }
};

module.exports = authenticationMiddleware;