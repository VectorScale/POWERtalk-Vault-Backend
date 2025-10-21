const express = require("express");
const { db } = require("../config/database");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const router = express.Router();

/**
 * Register a new user
 * Description: Registers a new user login with hashed password
 * Request Body: { user_id, website_login, password }
 * @param {int} user_id The users id
 * @param {string} website_login The login username for the website
 * @param {string} password The password to be hashed and stored
 */
router.post("/users/register", async (req, res) => {
  // Extract user data from request body
  let { user_id, website_login, password } = req.body;

  // Configure bcrypt for password hashing
  const saltRounds = 11;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // SQL query to insert new user login credentials
  const loginQuery = "INSERT INTO member_logins (user_id, website_login, password) VALUES (?, ?, ?)";
  
  // Execute database query
  db.query(loginQuery, [user_id, website_login, passwordHash], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "User Added Successfully" });
  });
});
/**
 *  Authenticates user credentials and returns JWT token
 * Request Body: { website_login, password }
 * @param {string} website_login The login username for authentication
 * @param {string} password The password to verify
 */
router.post("/users/login", async (req, res) => {
  const { website_login, password } = req.body;

  // SQL query to fetch user data with join to get access level
  const loginQuery =
    "SELECT member_logins.user_id, member_logins.website_login, member_logins.password, board_members.level_of_access FROM member_logins LEFT JOIN board_members ON member_logins.user_id=board_members.user_id WHERE website_login = ?";
  // Execute database query
  db.query(loginQuery, [website_login, password], (err, result) => {

    // Extract first user from results
    const user = result[0];

    // Handle database errors
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    // Check if user was found and return appropriate response
    if (result.length > 0) {
      //Checks if the password is hashed (mainly for development as there are hashed and non hashed passwords)
      if(/^$/.test(user.password)){
        //If it is hashed then compares to check if its the same to the database password
        const isValidPassword = bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }
      // Create JWT token with user data and their level of access
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.website_login,
          access: user.level_of_access
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      //console.log(token)
      res.json({
        success: true,
        token: token,
        user_id: user.user_id,
        website_login: user.website_login,
        password: user.password,
        message: "Login successful",
      });
    } else {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

  });
});
/**
 * Get member profile by ID
 * Description: Retrieves member information by user ID
 * URL Parameter: id - the user ID to look up
 * * @param {int} id The user ID to retrieve member information for
 */
router.get("/member/:id", (req, res) => {
  //id from URL
  const userId = req.params.id;

  const query = "SELECT * FROM `members` WHERE User_id = ?";

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(201).json({ message: "User not found" });
    }

    res.status(200).json(results[0]);
  });
});

/**
 * Add a new member to the system
 * Request Body: { user_id, first_name, last_name, email, phone_number, join_date }
 * @param {string} user_id The users id
 * @param {string} first_name The first name of the new member
 * @param {string} last_name The last name of the new member
 * @param {string} email The email of the new member
 * @param {string} phone_number The new members phone number
 * @param {date} join_date the current date or the date that the member joined
 */
router.post("/users/newMember", (req, res) => {
  let { user_id, first_name, last_name, email, phone_number, join_date } =
    req.body;

  // Set default join date to today if not provided
  if (join_date == null || join_date == "") {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var yyyy = today.getFullYear();

    join_date = yyyy + "-" + mm + "-" + dd;
  }
  //SQL Query to insert the request body information into the database
  const memberQuery =
    "INSERT INTO members (user_id, first_name, last_name, email, phone_number, join_date) VALUES (?, ?, ?, ?, ?, ?)";
    
  db.query(
    memberQuery,
    [user_id, first_name, last_name, email, phone_number || null, join_date],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      return res.status(200).json({ message: "Member Added" });
    }
  );
});

/**
 * Gets the count of members registered in current month for ID generation
 */
router.post("/users/checkMonthlyMembers", (req, res) => {
  var today = new Date();
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();

  const monthlyMembersQuery =
    "SELECT COALESCE(MAX(Substring(website_login, 7)+1), 0) as 'monthlyMembers' FROM member_logins WHERE SUBSTRING(website_login, 1, 6) = " +
    yyyy +
    mm +
    " Order by website_login DESC LIMIT 1";

  db.query(monthlyMembersQuery, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({
      monthlyMembers: Number(result[0].monthlyMembers),
      message: "Query Successful",
    });
  });
});

/**
 * Verifies if a user ID is already in use
 * Request Body: { user_id }
 * @param {int} user_id The user ID to check for existence in the system
 */
router.post("/users/checkIDExists", (req, res) => {
  const { user_id } = req.body;

  const idExistsQuery = "SELECT * FROM members WHERE user_id = ?";
  db.query(idExistsQuery, [user_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    if (result.length > 0) {
      return res
        .status(200)
        .json({ exists: true, message: "Query Successful. ID already Exists" });
    } else {
      return res
        .status(200)
        .json({ exists: false, message: "Query Successful. ID Unique" });
    }
  });
});

/**
 * Get all guest users
 */
router.get("/allGuests/", (req, res) => {
  const query = "SELECT user_id FROM members WHERE paid = 0";

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

/**
 * Update user to guest status
 * Description: Changes a user's status to guest (guest=TRUE, paid=FALSE)
 * Request Body: { user_id }
 * @param {int} user_id The user ID to update to guest status
 */
router.post("/user/guest", (req, res) => {
  const { user_id } = req.body;
  const ConstraintQuery =
    "UPDATE members SET guest=TRUE, paid=FALSE WHERE user_id = ?";
  db.query(ConstraintQuery, [user_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "guest Updated Successfully" });
  });
});

/**
 * Update user's join date, end date and updates their guest statuses
 * Request Body: { user_id }
 * @param {int} user_id The user ID to update to member status
 */
router.post("/user/member", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const { user_id } = req.body;
  const ConstraintQuery = `UPDATE members SET join_date=?, end_date=?, guest=FALSE, paid=TRUE WHERE user_id = ?`;
  db.query(ConstraintQuery, [today, "2025-06-30", user_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "guest Updated Successfully" });
  });
});

/**
 * Get all paid members
 */
router.get("/members", (req, res) => {
  const query = "SELECT user_id FROM members where paid = 1";
  db.query(query, (err, results) => {
    res.json(results);
  });
});

/**
 * Get member details by sender ID
 * Request Body: { senderId }
 * @param {int} senderId The user ID to retrieve details for
 */
router.post("/send-message", async (req, res) => {
  const { senderId } = req.body;
  const query = "SELECT * FROM members WHERE user_id = ?";
  db.query(query, [senderId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }

    res.json(result);
  });
});


module.exports = router;