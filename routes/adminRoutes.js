import express from 'express';

const router = express.Router();

router.get('/admin-stats', async (req, res) => {
    const totalTuitions = await req.db.collection('tuitions').countDocuments();
    const totalUsers = await req.db.collection('users').countDocuments();
    
    const revenueData = await req.db.collection('payments').aggregate([
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]).toArray();

    res.send({
        totalTuitions,
        totalUsers,
        revenue: revenueData[0]?.totalRevenue || 0
    });
});

export default router;
