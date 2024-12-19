import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken)
      return res
        .status(401)
        .json({ error: "Unauthorized - No access token provided" });

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    res.status(500).json({ error: error.message });
  }
};

const adminRoute = async (req, res, next) => {
  try {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({ error: "Access denied - Admin only" });
    }
  } catch (error) {
    console.log("Error in adminRoute middleware", error.message);
    res.status(500).json({ error: error.message });
  }
};

export { protectRoute, adminRoute };
