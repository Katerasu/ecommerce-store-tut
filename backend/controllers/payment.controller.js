import Coupon from "../models/coupon.model.js";
import { stripe } from "..lib/stripe.js";
import dotenv from "dotenv";
import Order from "../models/order.model.js";

dotenv.config();

const createCheckoutSession = async (req, res) => {
  try {
    const { products, code } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid products" });
    }

    let totalAmount = 0;
    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // stripe wants cents
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [products.image],
          },
          unit_amount: amount,
        },
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });

      if (coupon) {
        totalAmount -= Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
      }
    }

    const session = await stripe.checkout.session.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?=${CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discount: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discountPercentage),
            },
          ]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            price: p.price,
            quantity: p.quantity,
          }))
        ),
      },
    });

    if (totalAmount >= 200 * 100) {
      await createNewCoupon(req.user._id);
    }

    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const createStripeCoupon = async (discountPercentage) => {
  try {
    const coupon = await stripe.coupons.create({
      percent_off: discountPercentage,
      duration: "once",
    });

    return coupon.id;
  } catch (error) {
    console.log("Error in createStripeCoupon controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const createNewCoupon = async (userId) => {
  try {
    const newCoupon = new Coupon({
      code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      discountPercentage: 10,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //
      userId: userId,
    });

    await newCoupon.save();

    return newCoupon;
  } catch (error) {
    console.log("Error in createNewCoupon controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrive(sessionId);

    if (session.payment_status === "paid") {
      // deactivate coupon if used
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }

      // create a new order
      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        userId: session.metadata.userId,
        products: products.map((p) => ({
          productId: p.id,
          quantity: p.quantity,
          price: p.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
      });

      await newOrder.save();

      res.status(200).json({
        success: true,
        message: 'Payment successful, order created, and coupon deactivated if used',
        orderId: newOrder._id
      })
    }
  } catch (error) {
    console.log("Error in checkoutSuccess controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

export { createCheckoutSession, checkoutSuccess };
