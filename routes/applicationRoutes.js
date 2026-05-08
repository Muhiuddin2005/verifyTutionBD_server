import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
    const application = req.body;
    const newApplication = {
        ...application,
        tuitionId: new ObjectId(application.tuitionId),
        status: 'pending',
        appliedAt: new Date()
    };
    const result = await req.db.collection('applications').insertOne(newApplication);
    res.send(result);
});

router.get('/my-tuition-apps/:tuitionId', verifyToken, async (req, res) => {
    const tuitionId = req.params.tuitionId;
    const query = { tuitionId: new ObjectId(tuitionId) };
    const result = await req.db.collection('applications').find(query).toArray();
    res.send(result);
});

export default router;
