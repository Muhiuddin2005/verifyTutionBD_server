import admin from 'firebase-admin';

export const verifyToken = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    const token = authorization.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.decoded = decodedToken;
        next();
    } catch (error) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
};

export const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const user = await req.db.collection('users').findOne({ email });
    if (!user || user.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden access' });
    }
    next();
};

export const verifyRole = (roles) => {
    return async (req, res, next) => {
        const email = req.decoded.email;
        const user = await req.db.collection('users').findOne({ email });

        if (!user || !roles.includes(user.role)) {
            return res.status(403).send({ 
                error: true, 
                message: 'forbidden access: insufficient permissions' 
            });
        }
        
        req.userRole = user.role;
        next();
    };
};
