import { Product } from "../models/Product.js";
import bufferGenerator from "../utils/bufferGenerator.js";
import TryCatch from "../utils/TryCatch.js";
import { v2 as cloudinary } from "cloudinary";

export const createProduct = TryCatch(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "You are not admin" });
  }

  const { title, about, category, price, stock } = req.body;

  //   if (!req.body) {
  //     return res.status(400).json({ message: "Request body is missing" });
  //   }

  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No file to upload" });
  }

  const imageUploadPromises = files.map(async (file) => {
    const fileBuffer = bufferGenerator(file);

    const result = await cloudinary.uploader.upload(fileBuffer.content);

    return { id: result.public_id, url: result.secure_url };
  });

  const uploadImage = await Promise.all(imageUploadPromises);

  const product = await Product.create({
    title,
    about,
    category,
    price,
    stock,
    images: uploadImage,
  });

  res.status(201).json({ message: "Product created successfully", product });
});

export const getAllProducts = TryCatch(async (req, res) => {
  const { search, category, page, sortByPrice } = req.query;

  const filter = {};

  if (search) {
    filter.title = {
      $regex: search,
      $options: "i",
    };
  }

  if (category) {
    filter.category = category;
  }

  const limit = 8;

  const skip = (page - 1) * limit;

  let sortOption = { createdAt: -1 };

  if (sortByPrice) {
    if (sortByPrice === "lowToHigh") {
      sortOption = { price: 1 };
    } else if (sortByPrice === "highToLow") {
      sortOption = { price: -1 };
    }
  }

  const products = await Product.find(filter)
    .sort(sortOption)
    .limit(limit)
    .skip(skip);

  const categories = await Product.distinct("category");

  const newProduct = await Product.find().sort("-createdAt").limit(4);

  const countProduct = await Product.countDocuments();

  const totalPages = Math.ceil(countProduct / limit);

  res.json({ products, categories, totalPages, newProduct });
});

export const getSingleProduct = TryCatch(async (req, res) => {
  const product = await Product.findById(req.params.id);

  const relatedProduct = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  }).limit(4);

  res.json({ product, relatedProduct });
});

export const updateProduct = TryCatch(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "You are not admin" });
  }

  const { title, about, category, price, stock } = req.body;

  const updateFields = {};

  if (title) updateFields.title = title;
  if (about) updateFields.about = about;
  if (category) updateFields.category = category;
  if (price) updateFields.price = price;
  if (stock) updateFields.stock = stock;

  const updateProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  );

  if (!updateProduct) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ message: "Product updated", updateProduct });
});

export const updateProductImage = TryCatch(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "You are not admin" });
  }

  const { id } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files to upload" });
  }

  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const oldImages = product.images || [];

  for (const img of oldImages) {
    if (img.id) {
      await cloudinary.uploader.destroy(img.id);
    }
  }

  const imageUploadPromises = files.map(async (file) => {
    const buffer = bufferGenerator(file);

    const uploadFile = await cloudinary.uploader.upload(buffer.content);

    return {
      id: uploadFile.public_id,
      url: uploadFile.secure_url,
    };
  });

  const uploadImage = await Promise.all(imageUploadPromises);

  product.images = uploadImage;

  await product.save();

  res.status(200).json({ message: "Product updated successfully", product });
});
