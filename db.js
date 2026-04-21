const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./chat.db");

// Create table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Create users table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);
});

function saveMessage(user, message) {
  db.run(
    "INSERT INTO messages (user, message) VALUES (?, ?)",
    [user, message]
  );
}

function getMessages(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM messages ORDER BY id DESC LIMIT ?",
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows.reverse());
      }
    );
  });
}

function saveUser(username, password) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, password],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function findUser(username) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT username FROM users ORDER BY username",
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

module.exports = { saveMessage, getMessages, saveUser, findUser, getAllUsers };
