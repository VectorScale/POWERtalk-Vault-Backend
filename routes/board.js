const express = require("express");
const { db } = require("../config/database");
const { authenticateToken, requireRole, limiter } = require("../config/security");

const router = express.Router();


/**
 * Get board member access level by user ID
 * URL Parameter: id 
 * @param {int} id The user ID to retrieve access level for
 */
router.get("/boardMemberAccess/:id", async (req, res) => {
  const id = req.params.id;
  const query = "SELECT level_of_access FROM board_members WHERE user_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    res.json(result[0]);
  });
});
/**
 * Get board member information by user ID
 * URL Parameter: id 
 * @param {int} id The user ID to retrieve club access for
 */
router.get("/clubAccess/:id", (req, res) => {
  const memberId = req.params.id;
  const query = "SELECT * FROM board_members WHERE user_id = ?";

  db.query(query, [memberId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(202).json({ message: "No Club Access" });
    }

    res.status(200).json(results[0]); // Send only the first (and only) result
  });
});
/**
 * Get board members by access level
 * URL Parameter: access 
 * @param {string} access The access level to filter board members by
 */
router.get("/association/boardMembers/:access", (req, res) => {
  const access = req.params.access;
  const levels = ['club','council','association'];

  const query = `SELECT user_id FROM board_members WHERE level_of_access IN ('${levels.slice(access-1).join("','")}')`;
  
  db.query(query, (err, results) => {
    res.json(results);
  });
});
/**
 * Update payment information for a user
 * Request Body: { user_id, paid, paid_date }
 * @param {int} user_id The user ID to update payment for
 * @param {boolean} paid The payment status to set
 * @param {date} paid_date The date payment was made
 */
router.post("/updatePayment", requireRole('club'), (req, res) => {
  const { user_id, paid, paid_date } = req.body;
  const query =
    "UPDATE members SET paid = ?, paid_date = ?, guest = 0 WHERE user_id = ?";
  db.query(query, [paid, paid_date, user_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "Payment Updated Successfully" });
  });
});
/**
 * Increment guest meeting count for a user
 * Request Body: { user_id, guest }
 * @param {int} user_id The user ID to update guest count for
 * @param {int} guest The guest meeting count to set
 */
router.post("/guest/increment", requireRole('club'), (req, res) => {
  const {user_id, guest} = req.body;
  const query =
    "UPDATE members SET guest = ? WHERE user_id = ?";
  db.query(query, [guest, user_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "Meetings Incremented Successfully" });
  });
});
/**
 * Get board member details by sender ID
 * Request Body: { senderId }
 * @param {int} senderId The board member ID to retrieve details for
 */
router.post("/send-messages", async (req, res) => {
  const { senderId } = req.body;
  const query = "SELECT * FROM boardmember WHERE member_id = ?";
  db.query(query, [senderId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    res.json(result);
  });
});

router.get("/allClubBoardMembers/", (req, res) => {
  const query = "SELECT * FROM board_members";

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

router.post("/editBoardMember", (req, res) => {
const {user_id, position, start, end} = req.body;

  const query =
    "UPDATE `board_members` SET position = ?, term_start = ?, term_end = ? WHERE user_id = ?";

  db.query(query, [position, start, end || null, user_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "New Member Added Successfully" });
  });
});
module.exports = router;