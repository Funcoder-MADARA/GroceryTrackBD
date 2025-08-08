import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { updateUserSchema, createUserSchema } from '../validators/userValidators.js';

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json(users);
});

export const createUser = asyncHandler(async (req, res) => {
  const { error, value } = createUserSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details.map((d) => d.message) });
  }
  const created = await User.create(value);
  res.status(201).json(created);
});

export const getProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { error, value } = updateUserSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details.map((d) => d.message) });
  }

  const updated = await User.findByIdAndUpdate(userId, value, { new: true, runValidators: true });
  if (!updated) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(updated);
});