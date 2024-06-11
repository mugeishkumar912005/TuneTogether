const JWT = require("jsonwebtoken");
const mongoose = require("mongoose");
const Code = mongoose.model('Code', require('./schema.js').codes);

const protectRoute = async (request, response, next) => {
  try {
    const token = request.cookies["JWT"];
    console.log("Token:", token);
    if (!token) {
      return response.status(401).json({ Msg: "Unauthorized: Missing JWT token" });
    }

    const decoded = JWT.verify(token, "Y+88p4NldTYqVNWLSVKODcprx0g59PackkQWqGwxow0=");
    console.log("Decoded:", decoded);

    if (!decoded || !decoded.code) {
      return response.status(401).json({ Msg: "Unauthorized: Invalid or missing code in JWT token" });
    }

    const code = decoded.code;
    console.log("Code from JWT:", code);

    const foundCode = await Code.findOne({ code: code.toString() });
    console.log("Found Code:", foundCode);

    if (!foundCode) {
      return response.status(401).json({ Msg: "Unauthorized: Code not found" });
    }

    next();
  } catch (error) {
    console.error("Error:", error.message);
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ Msg: "Unauthorized: Invalid JWT token" });
    } else if (error.name === 'TokenExpiredError') {
      return response.status(401).json({ Msg: "Unauthorized: JWT token has expired" });
    } else {
      return response.status(500).json({ Msg: "Internal server error" });
    }
  }
};

module.exports = protectRoute;
