require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const serverless = require('serverless-http');

const app = express();
app.use(bodyParser.json());

// Enable CORS for all origins (or restrict to your frontend)
app.use(cors({
    origin: '*', // For production, replace '*' with your frontend URL
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Schema
const linkSchema = new mongoose.Schema({
    link: { type: String, required: true },
    price: { type: Number, required: true, unique: true }
});

const Link = mongoose.model('Link', linkSchema);

// Routes
app.get('/links', async (req, res) => {
    try {
        const links = await Link.find().sort({ price: 1 });
        res.json(links);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/links', async (req, res) => {
    const { link, price } = req.body;
    if (!link || price === undefined) return res.status(400).json({ error: 'Link and price required' });

    try {
        const newLink = new Link({ link, price });
        await newLink.save();
        res.json(newLink);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'Price already exists' });
        res.status(500).json({ error: err.message });
    }
});

app.delete('/links/:price', async (req, res) => {
    const price = parseFloat(req.params.price);
    try {
        const deleted = await Link.findOneAndDelete({ price });
        if (!deleted) return res.status(404).json({ error: 'Link not found' });
        res.json({ message: 'Deleted', link: deleted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Important for Vercel Serverless**
module.exports.handler = serverless(app);








