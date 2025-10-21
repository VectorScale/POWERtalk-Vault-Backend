const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const db = mysql.createPool({
  host: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: +process.env.DB_PORT,
  ssl: {ca: fs.readFileSync(path.resolve(__dirname,"../ssl/combined-ca-certificates.pem"))},
  connectionLimit: 85,
  idleTimeout: 60000, // Add this for better timeout handling
  maxIdle: 5,
  waitForConnections: true
});

db.on('connection', (connection) => {
  console.log('New database connection established');
});

db.on('error', (err) => {
  console.error('Database pool error:', err);
});

module.exports = { db};