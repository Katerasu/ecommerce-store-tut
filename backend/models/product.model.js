import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      requred: true,
    },
    description: {
      type: String,
      requred: true,
    },
    price: {
      type: Number,
      min: 0,
      requred: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      required: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema)

export default Product;