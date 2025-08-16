const mongoose = require('mongoose');

const flagSchema = new mongoose.Schema(
  {
    shopkeeperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    quantityBought: {
      type: Number,
      required: true,
      min: [0, 'Quantity bought cannot be negative'],
    },
    quantitySold: {
      type: Number,
      required: true,
      min: [0, 'Quantity sold cannot be negative'],
    },
    date: {
      type: Date,
      required: true,
    },
    receiptPath: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

flagSchema.virtual('quantityRemaining').get(function () {
  const bought = this.quantityBought || 0;
  const sold = this.quantitySold || 0;
  return bought - sold;
});

flagSchema.virtual('lossPercent').get(function () {
  const bought = this.quantityBought || 0;
  if (bought <= 0) return 0;
  const remaining = this.quantityRemaining;
  const soldPercent = ((bought - remaining) / bought) * 100;
  return 100 - soldPercent;
});

flagSchema.set('toJSON', { virtuals: true });
flagSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Flag', flagSchema);
