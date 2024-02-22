const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cron = require('cron');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin-shubhi:2001shubhi@cluster0.mbvcn.mongodb.net/task_management', { useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Load models
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  due_date: { type: Date, required: true },
  priority: { type: Number, default: 0 },
  status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
  deleted_at: { type: Date },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

const subTaskSchema = new mongoose.Schema({
  task_id: { type: Number, ref: 'Task', required: true },
  status: { type: Number, enum: [0, 1], default:1},
  deleted_at: { type: Date },
}, { timestamps: true });

const SubTask = mongoose.model('SubTask', subTaskSchema);

// Middleware for JWT authentication


app.use(bodyParser.json());

const user = {
  title: "Project-3",
  description: "Task-3",
  due_date: "2024-02-22",
  priority: 0,
  status:"TODO"
};
const secretKey = 'secret_key'; 

const token = jwt.sign({ user }, secretKey, { expiresIn: '2h' });
console.log(token);
const authenticateUser = (req, res, next) =>  {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token,secretKey); 
    console.log('Decoded:', decoded);
    req.user=req.body;
    console.log('Request:',req.user);

    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};




// Routes for tasks
app.post('/tasks', authenticateUser, async (req, res) => {
  try {
   
    const { title, description, due_date, priority, status } = req.body;
    console.log("Req:",req.body);
    if (!title || !description || !due_date|| !priority || !status) {
      return res.status(400).json({ error: 'Title, description, and due_date are required fields.' });
    }
    const task = new Task({ title, description, due_date,priority,status});
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    
    console.error(error);
    res.status(501).json({ error: 'Internal Server Error' });
  }
});

app.put('/tasks/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { due_date, status } = req.body;

  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Object ID' });
    }

    
    const task = await Task.findById(id);

    // If the task is not found
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update the task properties if new values are provided
    if (due_date) task.due_date = due_date;
    if (status) task.status = status;
    console.log("Task:",task);
    // Save the updated task
    await task.save();

    // Respond with the updated task
    res.json(task);
  } catch (error) {
    // Handle errors, log them, and respond with a 500 Internal Server Error
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/tasks', authenticateUser, async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Routes for subtasks
app.post('/subtasks', authenticateUser, async (req, res) => {
  try {
    console.log(req.body);
    const { task_id } = req.body;
    const subTask = new SubTask({ task_id });
    await subTask.save();
    res.status(201).json(subTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/subtasks/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Object ID' });
    }
    const subTask = await SubTask.findById(id);
    if (!subTask) {
      return res.status(404).json({ error: 'SubTask not found' });
    }
    subTask.status = status;
    await subTask.save();
    res.json(subTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/subtasks', authenticateUser, async (req, res) => {
  try {
    const subTasks = await SubTask.find();
    res.json(subTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Cron jobs
const taskPriorityCron = new cron.CronJob('0 0 * * *', async () => {
 
  console.log('Running task priority cron job...');
});

const voiceCallingCron = new cron.CronJob('0 12 * * *', async () => {
  console.log('Running voice calling cron job...');
});

taskPriorityCron.start();
voiceCallingCron.start();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
