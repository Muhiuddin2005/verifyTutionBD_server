import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { MongoClient, ServerApiVersion } from 'mongodb';

import userRoutes from './routes/userRoutes.js';
import tuitionRoutes from './routes/tuitionRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { verifyToken, verifyRole } from './middleware/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const serviceAccount = JSON.parse(
  await readFile(new URL('./serviceAccountKey.json', import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yvkvp7u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const db = client.db('verifyTutionBD');

    app.use((req, res, next) => {
        req.db = db;
        next();
    });

    app.use('/users', userRoutes);
    app.use('/tuitions', tuitionRoutes);
    app.use('/applications', applicationRoutes);
    app.use('/payments', paymentRoutes);

    app.use('/admin', verifyToken, verifyRole(['admin']), adminRoutes);
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('verifyTutionBD server is running and ready to go!');
});

app.listen(port, () => {
    console.log(`Server is running heavily on port: ${port}`);
});
