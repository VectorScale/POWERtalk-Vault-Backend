const express = require("express");
const { db } = require("../config/database");

const router = express.Router();


router.get("/allCouncils/", (req, res) => {
  const query = "SELECT * FROM council";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(results);
  });
});

router.get("/councilClubs/:id", (req, res) => {
  const id = req.params.id
  const query = "SELECT * FROM club where council_id = ?";

  db.query(query,[id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(results);
  });
});



module.exports = router;