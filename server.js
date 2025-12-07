require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

// Middleware
app.use(express.json());

// Global CORS
app.use(cors({ origin: '*' }));
app.options('*', cors()); // Handle preflight requests

// MongoDB connection with reuse
let conn = null;

async function connectToMongo() {
  if (conn) return conn;
  conn = await mongoose.connect(process.env.MONGO_URL, {
    bufferCommands: false,
  });
  return conn;
}

// Schema & Model
const linkSchema = new mongoose.Schema({
  link: { type: String, required: true },
  price: { type: Number, required: true, unique: true },
});

const Link = mongoose.models.Link || mongoose.model('Link', linkSchema);

// Routes
app.get('/links', async (req, res) => {
  try {
    await connectToMongo();
    const links = await Link.find().sort({ price: 1 });
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/links', async (req, res) => {
  try {
    await connectToMongo();
    const { link, price } = req.body;
    if (!link || price === undefined) return res.status(400).json({ error: 'Link and price required' });

    const newLink = new Link({ link, price });
    await newLink.save();
    res.json(newLink);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Price already exists' });
    res.status(500).json({ error: err.message });
  }
});

app.delete('/links/:price', async (req, res) => {
  try {
    await connectToMongo();
    const price = parseFloat(req.params.price);
    const deleted = await Link.findOneAndDelete({ price });
    if (!deleted) return res.status(404).json({ error: 'Link not found' });
    res.json({ message: 'Deleted', link: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export for Vercel serverless
module.exports.handler = serverless(app);










