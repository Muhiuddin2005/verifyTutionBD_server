import express from 'express';
import Stripe from 'stripe';
import { verifyToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET);
const router = express.Router();

router.post('/create-checkout-session', verifyToken, async (req, res) => {
    const { applicationId, tuitionId, salary, tutorEmail } = req.body;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'bdt',
                product_data: { name: `Tuition Salary Payment` },
                unit_amount: salary * 100,
            },
            quantity: 1,
        }],
        mode: 'payment',
        metadata: { applicationId, tuitionId, tutorEmail },
        success_url: `${process.env.CLIENT_URL}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/dashboard/payment-fail`,
    });

    res.send({ url: session.url });
});

router.patch('/payment-success', verifyToken, async (req, res) => {
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
        const { applicationId, tuitionId } = session.metadata;

        await req.db.collection('applications').updateOne(
            { _id: new ObjectId(applicationId) },
            { $set: { status: 'approved' } }
        );

        const result = await req.db.collection('tuitions').updateOne(
            { _id: new ObjectId(tuitionId) },
            { $set: { status: 'filled' } }
        );

        res.send({ success: true, result });
    } else {
        res.status(400).send({ success: false, message: 'Payment not completed' });
    }
});

export default router;
