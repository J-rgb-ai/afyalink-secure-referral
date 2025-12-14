const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:8080', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AfyaLink Backend is running' });
});

// Import and use routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
app.use('/api/auth', authRoutes);
app.use('/api', dataRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
