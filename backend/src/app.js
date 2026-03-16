const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const actionPlanRoutes = require('./routes/actionPlanRoutes');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// API Router
const apiRouter = express.Router();
apiRouter.use('/contacts', contactRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/chatbot', chatbotRoutes);
apiRouter.use('/action-plans', actionPlanRoutes);

// Mount the API router at both common prefixes
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);

// Basic Route for health check
app.get('/', (req, res) => res.send('CareLink Backend API is running...'));
app.get('/.netlify/functions/api', (req, res) => res.send('CareLink Backend API (Netlify) is running...'));

// Export app for serverless functions
module.exports = app;

// Port Settings (Only run listen if not in a serverless environment)
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
