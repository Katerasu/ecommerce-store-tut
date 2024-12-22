import express from "express";
import { addToCart, getCartProducts, removeFromCart, updateQty } from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);

router.post("/", protectRoute, addToCart);

router.delete("/", protectRoute, removeFromCart);

router.put("/", protectRoute, updateQty);

export default router;
