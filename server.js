require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  'http://127.0.0.1:5500',       // local frontend
  'http://localhost:5500',       // local frontend alternative
  'https://your-frontend.vercel.app' // deployed frontend
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // allow non-browser tools
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'CORS policy does not allow access from this origin';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error('MongoDB connection error:', err));

// Link Schema
const linkSchema = new mongoose.Schema({
  link: { type: String, required: true },
  price: { type: Number, required: true, unique: true }
});

const Link = mongoose.model('Link', linkSchema);

// Routes
app.get('/links', async (req,res)=>{
  try{
    const links = await Link.find().sort({price:1});
    res.json(links);
  }catch(err){ res.status(500).json({error:err.message}); }
});

app.post('/links', async (req,res)=>{
  const { link, price } = req.body;
  if(!link || price===undefined) return res.status(400).json({error:'Link and price required'});
  try{
    const newLink = new Link({link, price});
    await newLink.save();
    res.json(newLink);
  }catch(err){
    if(err.code===11000) return res.status(400).json({error:'Price already exists'});
    res.status(500).json({error:err.message});
  }
});

app.delete('/links/:price', async (req,res)=>{
  const price = parseFloat(req.params.price);
  try{
    const deleted = await Link.findOneAndDelete({price});
    if(!deleted) return res.status(404).json({error:'Link not found'});
    res.json({message:'Deleted', link:deleted});
  }catch(err){ res.status(500).json({error:err.message}); }
});

// Start server (for local testing)
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));

module.exports = app; // needed if using serverless deployment (Vercel)






