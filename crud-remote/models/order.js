const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Matches your User model name
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Matches your Product model name
        required: true
      },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 }
    }
  ],
  total_amount: {
    type: Number,
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'shipped'],
    default: 'pending'
  },
  stripe_session_id: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);