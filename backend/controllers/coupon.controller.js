import Coupon from "../models/coupon.model.js";

const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.status(200).json(coupon);
  } catch (error) {
    console.log("Error in getCoupon controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const coupon = await Coupon.findOne({
      code: couponCode,
      isActive: true,
      userId: req.user._id,
    });

    if (!coupon) {
      return res.status(400).json({ error: "Invalid coupon" });
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(400).json({ error: "Coupon has expired" });
    }

    res.status(200).json({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.log("Error in validateCoupon controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

export { getCoupon, validateCoupon };
