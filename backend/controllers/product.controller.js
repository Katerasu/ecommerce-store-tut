import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});

    res.status(200).json(products);
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featuredProducts");

    if (featuredProducts) {
      return res.status(200).json(JSON.parse(featuredProducts));
    }

    // If not in redis, fetch from mongodb
    featuredProducts = await Product.find({ isFeatured: true }).lean(); //lean() is used to convert mongoose document to plain javascript object which is better for performance

    if (!featuredProducts) {
      return res.status(404).json({ message: "No featured products found" });
    }

    // Store in redis for quick access
    await redis.set("featuredProducts", JSON.stringify(featuredProducts));

    res.json(featuredProducts);
  } catch (error) {
    console.log("Error in getFeaturedProducts controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    let cloudinaryResponse = null;

    if (image) {
      await cloudinary.uploader.upload(image, { folder: "products" });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
      category,
    });

    res.status(201).json(product);
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }

    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`product/${publicId}`);
        console.log("Deleted image from cloudinary");
      } catch (error) {
        console.log("Error deleting image from cloudinary", error.message);
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getRecommendedProducts = async (req, res) => {
  try {
    // Get 3 random products
    const products = await Product.aggregate([
      { $sample: { size: 3 } }, // Randomly select 3 documents
      { $project: { _id: 1, name: 1, description: 1, price: 1, image: 1 } }, // The number 1 indicates that the field should be included, while 0 would exclude the field.
    ]);

    res.status(200).json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category: category });

    res.status(200).json(products);
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const toggleFeaturedProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);

    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedProductCache();
      res.status(200).json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

const updateFeaturedProductCache = async () => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featuredProducts", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
  }
};

export {
  getAllProducts,
  getFeaturedProducts,
  createProduct,
  deleteProduct,
  getRecommendedProducts,
  getProductsByCategory,
  toggleFeaturedProduct,
};
