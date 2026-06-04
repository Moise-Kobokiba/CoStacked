const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d', // The token will be valid for 30 days
  });
};

module.exports = generateToken;