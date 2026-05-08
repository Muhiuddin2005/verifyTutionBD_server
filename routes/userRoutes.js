import express from 'express';
import { ObjectId } from 'mongodb';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await req.db.collection('users').findOne(query);
    
    if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null });
    }

    const result = await req.db.collection('users').insertOne({
        ...user,
        role: user.role || 'student',
        createdAt: new Date()
    });
    res.send(result);
});

router.get('/:email/role', verifyToken, async (req, res) => {
    const email = req.params.email;
    if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden' });
    }
    const user = await req.db.collection('users').findOne({ email });
    res.send({ role: user?.role || 'student' });
});

router.patch('/:id/role', verifyToken, verifyAdmin, async (req, res) => {
    const id = req.params.id;
    const { role } = req.body;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = { $set: { role } };
    const result = await req.db.collection('users').updateOne(filter, updateDoc);
    res.send(result);
});

export default router;
