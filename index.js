const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3i9ecp5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const usersCollection = client.db("mfs-server").collection('user');
    
    // User Registration Endpoint
    app.post('/user/register', async (req, res) => {
      const { name, pin, number, email } = req.body;
      const hashedPin = await bcrypt.hash(pin, 10);
      const newUser = {name, number, email, pin: hashedPin };

      // Check if the user already exists
      const existingUser = await usersCollection.findOne({ email, number});
      if (existingUser) {
        return res.status(400).send('User already exists');
      }

      await usersCollection.insertOne(newUser);
      res.send('User registered');
    });
    
    // User Login Endpoint
    app.post('/user/login', async (req, res) => {
      const { credential, pin } = req.body;
      console.log('Request Body:', req.body); // Log request body for debugging
    
      try {
        // Find user by email or number (credential)
        const user = await usersCollection.findOne({ $or: [{ email: credential }, { number: credential }] });
    
        if (user) {
          console.log('Found User:', user); // Log user details for debugging
    
          // Compare the provided pin with the hashed password stored in the database
          const isMatch = await bcrypt.compare(pin, user.pin);
    
          if (isMatch) {
            res.send('Login successful');
          } else {
            res.status(400).send('Invalid credentials');
          }
        } else {
          res.status(400).send('User not found');
        }
      } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    
    
    

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Comment out the line below to keep the connection open
    // await client.close();
  }
}

run().catch(console.dir);

// Root route
app.get("/", (req, res) => {
  res.send("App Running");
});

app.listen(port, () => {
  console.log(`Blog server running on port: ${port}`);
});
