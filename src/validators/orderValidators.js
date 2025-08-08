import Joi from 'joi';

export const placeOrderSchema = Joi.object({
  userId: Joi.string().required(),
  companyName: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
});