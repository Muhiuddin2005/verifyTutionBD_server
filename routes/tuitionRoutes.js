import express from 'express';
import { ObjectId } from 'mongodb';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { 
            search, 
            classLevel, 
            subject, 
            location, 
            sort, 
            page = 1, 
            limit = 6 
        } = req.query;

        let query = { status: 'approved' };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        if (classLevel) query.classLevel = classLevel;
        if (subject) query.subject = { $regex: subject, $options: 'i' };
        if (location) query.location = { $regex: location, $options: 'i' };

        let sortOptions = {};
        if (sort === 'budgetLow') sortOptions.budget = 1;
        if (sort === 'budgetHigh') sortOptions.budget = -1;
        if (sort === 'newest') sortOptions.createdAt = -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalTuitions = await req.db.collection('tuitions').countDocuments(query);

        const tuitions = await req.db.collection('tuitions')
            .find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        res.send({
            tuitions,
            totalTuitions,
            totalPages: Math.ceil(totalTuitions / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).send({ message: 'Error fetching tuitions', error: error.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    const tuitionData = req.body;
    const result = await req.db.collection('tuitions').insertOne({
        ...tuitionData,
        status: 'pending',
        createdAt: new Date()
    });
    res.send(result);
});

router.patch('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = { $set: { status } };
    const result = await req.db.collection('tuitions').updateOne(filter, updateDoc);
    res.send(result);
});

router.delete('/:id', verifyToken, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id), studentEmail: req.decoded.email };
    const result = await req.db.collection('tuitions').deleteOne(query);
    res.send(result);
});

export default router;
