// import jwt from 'jsonwebtoken';

// const authMiddleware = async (req, res, next) => {
//   const { token } = req.headers;

//   if (!token) {
//     return res.json({ success: false, message: 'Not Authorized! Login again' });
//   }
//   try {
//     const token_decode = jwt.verify(token, process.env.JWT_SECRET);
//     req.body.userId = token_decode.id;
//     next();
//   } catch (error) {
//     console.log(error);
//     res.json({ success: false, message: 'Error!' });
//   }
// };
// export default authMiddleware;

import jwt from 'jsonwebtoken';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, message: 'Not Authorized! Login again' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Attach user info to req.user instead of modifying req.body
    next();
  } catch (error) {
    console.error('JWT Error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired! Please log in again.',
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid token!' });
  }
};

export default authMiddleware;
