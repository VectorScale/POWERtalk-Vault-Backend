const express = require("express");
const { db } = require("../config/database");

const router = express.Router();

router.post("/join", (req, res) => {
   let { user_id, meeting_id, attended }= req.body;
  const query = "INSERT INTO meeting_attendance (user_id , meeting_id, attended) VALUES (?, ?, ?)";
  db.query(query, [ user_id, meeting_id, attended] , (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "User Joined Successfully" });
  })
})
router.post("/notjoin", (req, res) => {
   let { user_id, meeting_id }= req.body;
  const query = "DELETE FROM meeting_attendance WHERE user_id = ? AND meeting_id = ?";
  db.query(query, [ user_id , meeting_id] , (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "User Deleted Successfully" });
  })
})
router.get("/join_meeting/:id" , (req, res) =>{
  let id = req.params.id;
  const query = "SELECT * FROM meeting_attendance WHERE user_id = ?"
   db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }

      res.json(result);
    
  });
})

module.exports = router;
