import mongoose from "mongoose";

const { Schema, model } = mongoose;
const options = { timestamps: true };
export const User = model(
  "User",
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ["customer", "admin"], default: "customer" },
    },
    options,
  ),
);
export const Category = model(
  "Category",
  new Schema(
    { name: { type: String, required: true, unique: true, trim: true } },
    options,
  ),
);
const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, unique: true },
    publisher: String,
    year: Number,
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    cover: String,
    description: String,
  },
  options,
);
bookSchema.index({ title: "text", author: "text", isbn: "text" });
bookSchema.index({ category: 1, price: 1 });
export const Book = model("Book", bookSchema);
export const Cart = model(
  "Cart",
  new Schema(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },
      items: [
        {
          book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
          quantity: { type: Number, required: true, min: 1 },
        },
      ],
    },
    options,
  ),
);
export const Order = model(
  "Order",
  new Schema(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      items: [
        {
          book: Schema.Types.ObjectId,
          title: String,
          author: String,
          cover: String,
          price: Number,
          quantity: Number,
        },
      ],
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, required: true },
      total: { type: Number, required: true },
      address: {
        fullName: String,
        line1: String,
        city: String,
        state: String,
        postalCode: String,
        phone: String,
      },
      status: {
        type: String,
        enum: ["Placed", "Packed", "Shipped", "Delivered", "Cancelled"],
        default: "Placed",
      },
    },
    options,
  ),
);
