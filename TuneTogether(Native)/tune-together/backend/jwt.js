const JWT = require("jsonwebtoken");

const generateToken = (code, userData = {}) => {
  console.log("code:", code);
  const payload = {
    code,
  };
  return JWT.sign(payload, "Y+88p4NldTYqVNWLSVKODcprx0g59PackkQWqGwxow0=", {
    expiresIn: '1d',
  });
}

module.exports = generateToken;
