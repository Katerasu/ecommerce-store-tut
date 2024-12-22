import Product from "../models/product.model.js";

const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find((item) => item.id === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push(productId);
    }

    await user.save();

    res.status(200).json(user.cartItems);
  } catch (error) {
    console.log("Error in addToCart controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find((item) => item.id === productId);

    if (existingItem) {
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);
    } else {
      return res.status(400).json({ error: "Item is not in cart" });
    }

    await user.save();

    res.status(200).json(user.cartItems);
  } catch (error) {
    console.log("Error in removeFromCart controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getCartProducts = async (req, res) => {
  try {
    const user = req.user;

    let cartProducts = await Product.find({ _id: { $in: user.cartItems } });

    // Add qty for each product
    cartProducts = cartProducts.map((product) => {
      const cartItem = user.cartItems.find((item) => item.id === product.id);
      return { ...product.toJSON(), quantity: cartItem.quantity };
    });

    res.status(200).json(cartProducts);
  } catch (error) {
    console.log("Error in getCartProducts controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const updateQty = async (req, res) => {
  try {
    const { productId, newQty } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find((item) => item.id === productId);

    if (existingItem) {
      if (newQty === 0) {
        user.cartItems = user.cartItems.filter((item) => item.id !== productId);
        await user.save();
        return res.status(200).json(user.cartItems);
      } else {
        existingItem.quantity = newQty;
        await user.save();
        return res.status(200).json(user.cartItems);
      }
    } else {
      return res.status(400).json({ error: "Item is not in cart" });
    }
  } catch (error) {
    console.log("Error in updateQty controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

export { addToCart, getCartProducts, removeFromCart, updateQty };
