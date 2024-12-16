import express from "express";
import User from "../models/user.model.js";

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({
        error: "Email is taken",
      });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({ user, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  res.send("login");
};

const logout = async (req, res) => {
  res.send("logout");
};

export { signup, login, logout };
