// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const authMiddleware = require("../middleware/auth");
const Order = require('../models/order');
// POST /api/payments/checkout

router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    console.log('Received checkout request with items:', items); // Debugging log
    console.log('Creating order with user:', req.user.id, 'and items:', items); // Debugging log
    console.log('User email for Stripe session:', req.user.email); // Debugging log
    console.log('Stripe Secret Key:', process.env.STRIPE_SECRET_KEY); // Debugging log
    //console.log('Stripe instance:', stripe); // Debugging log
    // //console.log('Stripe checkout session creation parameters:', {
    //   payment_method_types: ['card'],
    //   line_items: items.map(item => ({
    //     price_data: {
    //       currency: 'usd',
    //       product_data: { 
    //         name: item.name,
    //         metadata: { productId: item.productId } 
    //       },
    //       unit_amount: Math.round(item.price * 100), // Stripe expects cents
    //     },
    //     quantity: item.quantity,
    //   })),
    //   mode: 'payment',
    //   customer_email: req.user.email,
    //   success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.FRONTEND_URL}/cart`,
    // }); // Debugging log
    // 1. Create a "Pending" order in your database first
    const order = await Order.create({
      user: req.user.id,
      items: items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price
      })),

      total_amount: items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      status: 'pending'
    });


    // 2. Map items to Stripe format
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { 
          name: item.name,
          metadata: { productId: item.productId } 
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects cents
      },
      quantity: item.quantity,
    }));

    // 3. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      // Attach your DB Order ID to the Stripe Session
      metadata: { orderId: order._id.toString() } 
    });

    // Send the URL to the frontend to redirect the user
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// POST /api/payments/webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the request actually came from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 3. Handle the 'Paid' event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Update MongoDB status using the ID we passed in metadata
    await Order.findByIdAndUpdate(session.metadata.orderId, { 
      status: 'paid' 
    });

    console.log(`Order ${session.metadata.orderId} updated to PAID`);
  }

  res.json({ received: true });
});

// GET /success
router.get('/success', async (req, res) => {
  const sessionId = req.query.session_id;

  try {
    // 1. Retrieve the session from Stripe to double-check
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // 2. Update the Order in MongoDB (if the webhook hasn't already)
      const orderId = session.metadata.orderId;
      await Order.findByIdAndUpdate(orderId, { status: 'paid' });

      // 3. Send a friendly response
      res.send(`
        <h1>Payment Successful!</h1>
        <p>Thank you for your order. Order ID: ${orderId}</p>
        <a href="/api/orders/my-orders">View your orders</a>
      `);
    } else {
      res.status(400).send('Payment not confirmed yet.');
    }
  } catch (error) {
    console.error('Success Route Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;