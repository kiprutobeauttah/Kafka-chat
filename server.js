const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { Kafka } = require("kafkajs");
const { saveMessage, getMessages, saveUser, findUser, getAllUsers } = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const os = require("os");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const kafka = new Kafka({
  clientId: "chat-app",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "chat-group" });

const TOPIC = "chat";
const SECRET_KEY = "your_secret_key";

app.use(express.static("public"));
app.use(express.json());

let clients = [];

// WebSocket
wss.on("connection", async (ws) => {
  clients.push(ws);

  // Send chat history on connect
  const history = await getMessages();
  ws.send(JSON.stringify({ type: "history", data: history }));

  ws.on("message", async (raw) => {
    const data = JSON.parse(raw.toString());

    const payload = {
      user: data.user,
      message: data.message,
    };

    // Save to DB
    saveMessage(payload.user, payload.message);

    // Send to Kafka
    await producer.send({
      topic: TOPIC,
      messages: [{ value: JSON.stringify(payload) }],
    });
  });

  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
  });
});

// Kafka consumer → broadcast
async function run() {
  try {
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const msg = JSON.parse(message.value.toString());

        clients.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "message", data: msg }));
          }
        });
      },
    });
  } catch (error) {
    console.error("Kafka error:", error);
  }
}

run();

server.listen(3000, '0.0.0.0', () => {
  console.log("Server running on port 3000");
  console.log("\nAccess URLs:");
  console.log("- Local: http://localhost:3000");
  
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach((name) => {
    interfaces[name].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`- Network: http://${iface.address}:3000`);
      }
    });
  });
});

// User registration
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await saveUser(username, hashedPassword);
    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).send({ error: "Error registering user" });
  }
});

// User login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await findUser(username);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: "1h" });
    res.send({ message: "Login successful", token });
  } catch (error) {
    res.status(500).send({ error: "Error logging in" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: "Error fetching users" });
  }
});
