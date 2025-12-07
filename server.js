require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Enable CORS for all origins (you can restrict to your frontend domain)
app.use(cors({
  origin: '*', // or 'https://your-frontend-domain.com' for production
  methods: ['GET','POST','DELETE'],
  allowedHeaders: ['Content-Type']
}));

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error(err));

// Schema
const linkSchema = new mongoose.Schema({
  link: { type: String, required: true },
  price: { type: Number, required: true, unique: true }
});

const Link = mongoose.model('Link', linkSchema);

// Routes
// Get all links
app.get('/links', async (req,res)=>{
  try {
    const links = await Link.find().sort({ price: 1 });
    res.json(links);
  } catch(err){ res.status(500).json({ error: err.message }); }
});

// Add a new link
app.post('/links', async (req,res)=>{
  const { link, price } = req.body;
  if(!link || price === undefined) return res.status(400).json({ error: 'Link and price required' });

  try {
    const newLink = new Link({ link, price });
    await newLink.save();
    res.json(newLink);
  } catch(err){
    if(err.code === 11000) return res.status(400).json({ error: 'Price already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Delete link by price
app.delete('/links/:price', async (req,res)=>{
  const price = parseFloat(req.params.price);
  try {
    const deleted = await Link.findOneAndDelete({ price });
    if(!deleted) return res.status(404).json({ error: 'Link not found' });
    res.json({ message: 'Deleted', link: deleted });
  } catch(err){ res.status(500).json({ error: err.message }); }
});

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));




