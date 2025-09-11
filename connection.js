require('dotenv').config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require('fs');
const path = require("path");
const dayjs = require('dayjs');
const dayjsRecur = require('dayjs-recur');

dayjs.extend(dayjsRecur);

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: +process.env.DB_PORT,
  ssl: {ca: fs.readFileSync(path.resolve(__dirname,"./ssl/combined-ca-certificates.pem"))}
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to MySQL database.");
  /* Testing connection
  const Query = "SELECT * FROM members";
  db.query(Query, (err, result) => {
    if (err) {
      console.error("Database error:", err);
    }
    else{
      console.log('Selected ' + result.length + ' row(s).');
      for (i = 0; i < result.length; i++) {
          console.log('Row: ' + JSON.stringify(result[i]));
      }
      console.log('Done.');
    }
  }); */
});

//Registers a members login and password into the member_logins table. This is done when a club treasurer confirms that the member has paid.
app.post("/users/register", (req, res) => {
  const { user_id, website_login, password } = req.body;

  const loginQuery =
    "INSERT INTO member_logins (user_id, website_login, password) VALUES (?, ?, ?)";
  db.query(loginQuery, [user_id, website_login, password], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "User Added Successfully" });
  });
});
//Adds a new member to the members table.
app.post("/users/newMember", (req, res) => {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();

  const { user_id, first_name, last_name, email } = req.body;
  var join_date = yyyy + "-" + mm + "-" + dd;

  const memberQuery =
    "INSERT INTO members (user_id, first_name, last_name, email, join_date, guest, paid) VALUES (?, ?, ?, ?, ?, TRUE, FALSE)";
  db.query(
    memberQuery,
    [user_id, first_name, last_name, email, join_date],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      return res.status(200).json({ message: "Member Added" });
    }
  );
});
//Checks how many members have joined in the past month. Used to determine a new members sequential number.
app.post("/users/checkMonthlyMembers", (req, res) => {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();

  const monthlyMembersQuery =
    "SELECT * FROM members WHERE join_date between '" +
    yyyy +
    "-" +
    mm +
    "-" +
    "01' and '" +
    yyyy +
    "-" +
    mm +
    "-" +
    dd +
    "'";
  db.query(monthlyMembersQuery, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res
      .status(200)
      .json({ monthlyMembers: result.length + 1, message: "Query Successful" });
  });
});
//Checks if the requested userID is already in the members table.
app.post("/users/checkIDExists", (req, res) => {
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
app.get("/profile/:id", (req, res) => {
  const userId = req.params.id;
  const Query = "SELECT * FROM members WHERE user_id = ?";
  db.query(Query, [userId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    if (result.length > 0) {
      const user = result[0];

      res.json(user);
    }
  });
});
app.post("/profile/edit/", (req, res) => {
  const {
    profile_id,
    first_name,
    last_name,
    email,
    phone_number,
    address,
    postcode,
    interests,
    pronouns,
    dob,
  } = req.body;
  const editProfileQuery =
    "UPDATE members SET first_name = ?, last_name = ?, email = ?, phone_number = ?, address = ?, postcode = ?, interests = ?, pronouns = ?, dob = ? WHERE user_id = ?";
    db.query(
    editProfileQuery,
    [
      first_name,
      last_name,
      email,
      phone_number,
      address,
      postcode,
      interests,
      pronouns,
      dob,
      profile_id,
    ],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      return res.status(200).json({ message: "Profile Updated Successfully" });
    }
  );
});

//Update the database on what data the user wants to share
app.post("/profile/share/", (req, res) => {
  const {
    profile_id,
    phone_private,
    address_private
  } = req.body;
  const editProfileQuery =
    "UPDATE members SET phone_private = ?, address_private = ? WHERE user_id = ?";
    db.query(
    editProfileQuery,
    [
      phone_private,
      address_private,
      profile_id,
    ],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      return res.status(200).json({ message: "Profile Updated Successfully" });
    }
  );
});
app.post("/user/guest", (req, res) => {
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
app.post("/user/member", (req, res) => {
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
app.post("/users/login", (req, res) => {
  const { website_login, password } = req.body;

  // SQL query with placeholders for Email and Password
  const loginQuery =
    "SELECT * FROM member_logins WHERE website_login = ? AND password = ?";

  db.query(loginQuery, [website_login, password], (err, result) => {
    const user = result[0];

    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    if (result.length > 0) {
      res.json({
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
app.get("/member/:id", (req, res) => {
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
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const query = "SELECT Club_id FROM `member's club` WHERE User_id = ?";

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results;
    res.json({ Club_id: user });
  });
});
app.get("/club/:id", (req, res) => {
  const clubId = req.params.id;
  const query = "SELECT Club_name FROM club WHERE Club_id = ?";

  db.query(query, [clubId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results;
    res.json({ Club_name: user });
  });
});
app.get("/meeting/:id", (req, res) => {
  const clubId = req.params.id;
  const query = "SELECT * FROM meeting WHERE club_id = ?";

  db.query(query, [clubId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    } else if (results.length > 0) {
      res.json(results);
    }
  });
});
app.get("/meeting_details/:id", (req, res) => {
  const meetingId = req.params.id;
  const query = "SELECT * FROM meeting WHERE meeting_id = ?";

  db.query(query, [meetingId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json(results); // Send only the first (and only) result
  });
});
app.get("/club_details/:id", (req, res) => {
  const clubId = req.params.id;
  const query = "SELECT * FROM club WHERE Club_id = ?";

  db.query(query, [clubId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "CLub not found" });
    }

    res.json(results); // Send only the first (and only) result
  });
});
app.get("/clubAccess/:id", (req, res) => {
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
app.get("/clubBoard/:id", (req, res) => {
  const clubId = req.params.id;
  const query = "SELECT User_id FROM `member's club` WHERE Club_id = ?";

  db.query(query, [clubId], (err, results) => {
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

app.get("/clubBoardMembers/:id", (req, res) => {
  const UserId = req.params.id;
  const query = "SELECT * FROM members WHERE user_id = ?";

  db.query(query, [UserId], (err, results) => {
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
app.get("/members", (req, res) => {
  const query = "SELECT * FROM members";
  db.query(query, (err, results) => {
    const user = results;
    res.json({ user });
  });
});

app.get("/club/:clubName", (req, res) => {
  const clubName = req.params.clubName;
  const query = "SELECT * FROM club WHERE Club_name = ?";

  db.query(query, [clubName], (err, results) => {
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
app.post("/BoardMember", (req, res) => {
  const { User_id, Club_id } = req.body;
  const query = "INSERT INTO `member's club` (User_id, Club_id) VALUES (?, ?)";
  db.query(query, [User_id, Club_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "New Member Added Successfully" });
  });
});
app.get("/clubs", (req, res) => {
  const query = "SELECT Club_id, Club_name FROM club";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Internal server error" });
    res.json(results);
  });
});
app.post("/send-message", async (req, res) => {
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
app.post("/send-messages", async (req, res) => {
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
app.listen(+process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on port ` + process.env.PORT);
});
