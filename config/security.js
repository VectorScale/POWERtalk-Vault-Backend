const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');


const limiter = rateLimit({
  windowMs: 5 * 1000, // 15 minutes
  max: 150, // Limit each IP to 100 requests per `window` (here, per 15 minutes
  message: "Too many requests from this IP, please try again after 15 minutes",
});

/**
 * Authenticates tokens for routes that need authentication
 * @param {object} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  //console.log(jwt.verify(token, process.env.JWT_SECRET))
  try{
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      req.user = user; // Add user info to request object
      console.log("Verification of", token, "Successful")
      next();
  });
  }catch{
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  
}

function requireRole(role) {
  return (req, res, next) => {
    //console.log(req)
    const authHeader = req.headers['authorization'];
    //console.log(req.headers['authorization'])
    const token = authHeader && authHeader.split(' ')[1]; 
    const { access } = jwt.verify(token, process.env.JWT_SECRET);
    //console.log(access);
    if(role == 'club'){
      if (!req.headers['authorization'] || (access != role && access != 'council' && access != 'association')) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: role
        });
      }
    }
    else if(role == 'council'){
      if (!req.headers['authorization'] || (access != role && access != 'association')) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: role
        });
      }
    }
    else if(role == 'association'){
      if (!req.headers['authorization'] || access != role) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: role
        });
      }
    }
    
    next();
  };
}

module.exports = { authenticateToken, requireRole, limiter};