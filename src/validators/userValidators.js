import Joi from 'joi';

export const createUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').default('Other'),
  shopName: Joi.string().allow('', null),
  shopAddress: Joi.string().allow('', null),
  shopType: Joi.string().valid('Small', 'Medium', 'Large').default('Small'),
  district: Joi.string().allow('', null),
  avatarUrl: Joi.string().uri().allow('', null),
});

export const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  gender: Joi.string().valid('Male', 'Female', 'Other'),
  shopName: Joi.string().allow('', null),
  shopAddress: Joi.string().allow('', null),
  shopType: Joi.string().valid('Small', 'Medium', 'Large'),
  district: Joi.string().allow('', null),
  avatarUrl: Joi.string().uri().allow('', null),
}).min(1);