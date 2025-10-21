const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const db = mysql.createConnection({
  host: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: +process.env.DB_PORT,
  ssl: {
    ca: fs.readFileSync(
      path.resolve(__dirname, "../combined-ca-certificates.pem")
    ),
  },
});

const connect = () => {
  return new Promise((resolve, reject) => {
    db.connect((err) => {
      if (err) {
        console.error("Database connection failed: " + err.stack);
        reject(err);
        return;
      }
      console.log("Connected to MySQL database.");
      resolve(db);
    });
  });
};

module.exports = { db, connect };