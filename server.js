const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zanika-builds';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected successfully');
}).catch(err => {
  console.log('❌ MongoDB connection error:', err);
});

// Build Schema
const buildSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  buildType: { type: String, enum: ['development', 'staging', 'production'], required: true },
  description: { type: String },
  status: { type: String, enum: ['In Progress', 'Complete', 'Failed'], default: 'In Progress' },
  timestamp: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const Build = mongoose.model('Build', buildSchema);

// Routes

// GET all builds
app.get('/api/builds', async (req, res) => {
  try {
    const builds = await Build.find().sort({ createdAt: -1 });
    res.json(builds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching builds', error });
  }
});

// POST create new build
app.post('/api/builds', async (req, res) => {
  try {
    const { projectName, buildType, description } = req.body;
    
    if (!projectName || !buildType) {
      return res.status(400).json({ message: 'Project name and build type are required' });
    }
    
    const newBuild = new Build({
      projectName,
      buildType,
      description,
      status: 'In Progress',
      timestamp: new Date()
    });
    
    const savedBuild = await newBuild.save();
    res.status(201).json(savedBuild);
  } catch (error) {
    res.status(500).json({ message: 'Error creating build', error });
  }
});

// GET build by ID
app.get('/api/builds/:id', async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) {
      return res.status(404).json({ message: 'Build not found' });
    }
    res.json(build);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching build', error });
  }
});

// PUT update build status
app.put('/api/builds/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['In Progress', 'Complete', 'Failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const updatedBuild = await Build.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updatedBuild) {
      return res.status(404).json({ message: 'Build not found' });
    }
    
    res.json(updatedBuild);
  } catch (error) {
    res.status(500).json({ message: 'Error updating build', error });
  }
});

// DELETE build
app.delete('/api/builds/:id', async (req, res) => {
  try {
    const deletedBuild = await Build.findByIdAndDelete(req.params.id);
    
    if (!deletedBuild) {
      return res.status(404).json({ message: 'Build not found' });
    }
    
    res.json({ message: 'Build deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting build', error });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Build Orchestrator Server running on http://localhost:${PORT}`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET    /api/builds - Get all builds`);
  console.log(`  POST   /api/builds - Create a new build`);
  console.log(`  GET    /api/builds/:id - Get build by ID`);
  console.log(`  PUT    /api/builds/:id - Update build status`);
  console.log(`  DELETE /api/builds/:id - Delete a build`);
  console.log(`  GET    /api/health - Health check\n`);
});

module.exports = app;
