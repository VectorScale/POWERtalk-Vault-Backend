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
  ssl: {ca: fs.readFileSync(path.resolve(__dirname,"../backend/combined-ca-certificates.pem"))}
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

    res.json({ Club_id: results });
  });
});

app.get("/allClubs/", (req, res) => {
  const userId = req.params.id;
  const query = "SELECT Club_id FROM club";

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ Club_id: results });
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
app.get("/project/:id", (req, res) =>{
  const projectlevel = req.params.id;
  const query = "SELECT * FROM `development program` WHERE project_level = ?";

  db.query(query, [projectlevel], (err, result) =>{
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
        res.json(result);

  })
});
app.get("/projects/:id", (req, res) =>{
  const projectlevel = req.params.id;
  const query = "SELECT * FROM `development program` WHERE assignment_id = ?";

  db.query(query, [projectlevel], (err, result) =>{
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
        res.json(result);

  })
});
app.get("/projectss/:id/:level", (req, res) =>{
  const projectlevel = req.params.level;
  const projectid= req.params.id;
  const query = "SELECT * FROM `development program` WHERE member_id= ? AND project_level = ?";

  db.query(query, [projectid, projectlevel], (err, result) =>{
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
        res.json(result);

  })
});
app.post("/member/projects/1", async (req, res) => {
  const projectnames = ["Thoughts for the Day/Inspiration", "Closing Thought", "Issues of the Day", 
    "Self-Introduction Speech\n4-7 minutes", "Oral Reading\n4-7 minutes", "Poetry Reading\n4-7 minutes", 
    "Word Power Education\n10 minutes", "Speach to Inform\n5-8 minutes", "Speech Containing Gestures\n5-8 minutes", 
    "Introduction of a Speaker", "Thanking a Speaker", "Trainee Evaluator", "Self=Evaluation"];
  const { senderId } = req.body;
  for (const i=0; i< projectnames.length; i++){
    if (i == 2 || i == 11){
      for (const j=0; j<3; j++){
        const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        db.query(query, [senderId, i, projectnames[i], 1], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database Error" });
        }
        res.json(result);
      });
      }
    }
    else{
      const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        db.query(query, [senderId, i, projectnames[i], 1], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database Error" });
        }
        res.json(result);
      });
    }
  }
});
app.post("/member/projects/2", async (req, res) => {
  const projectnames = ["Issues of the day Leader", "Program Leader", "Speech to Persuade\n5-8 minutes", 
    "Speech to inspire\n5-8 minutes", "Speech to Entertain\n5-8 minutes", "Research Speech\n5-8 minutes", 
    "Current Event Speech\n5-8 minutes", "Speech Using Visual Aids\n5-8 minutes", "Impromptu Speech\n4-7 minutes", 
    "Word Power Education\n20 minutes", "Assignment Evaluator", "General Evaluator\n8-10 minutes", "Committee Member"];
  const { senderId } = req.body;
  for (const i=0; i< projectnames.length; i++){
    if (i == 10){
      for (const j=0; j<3; j++){
        const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        db.query(query, [senderId, i, projectnames[i], 2], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database Error" });
        }
        res.json(result);
      });
      }
    }
    else if (i == 1 || i == 12){
      for (const j=0; j<2; j++){
        const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        db.query(query, [senderId, i, projectnames[i], 2], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database Error" });
        }
        res.json(result);
      });
      }
    }
    else{
      const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        db.query(query, [senderId, i, projectnames[i], 2], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database Error" });
        }
        res.json(result);
      });
    }
  }
});
app.post("/member/projects/3", async (req, res) => {
  const projectnames = ["Prepare a Written Report and Present Using a Microphone", "Present an Education Session\n20-30 minutes", "Program a Meeting at any Level",
    "Moderator or Discussion Leader", "General Evaluator", "Committee Chairman", 
    "Club Elected Officer", "POWERtalk Australia Conference Delegate", "Speech Contest Judge", 
    "Plus any six of the following eight speeches:", "Speech Using a Whiteboard\n8-10 minutes", "Biographical Speech\n8-10 minutes", 
    "Review Assignment 6-9 minutes", "Be in Earnest Speech 5-8 minutes", "TV Talk 6-8 minutes", 
    "Speech to Inspire, Using Technology 5-8 minutes", "Travelogue 7-10 minutes", "	Impromptu Speech 7-8 minutes"];
  const { senderId } = req.body;
  for (const i=0; i< projectnames.length; i++){
    if (i == 1 || i == 2|| i == 4|| i == 5|| i == 6){
      for (const j=0; j<2; j++){
        const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        db.query(query, [senderId, i, projectnames[i], 3], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database Error" });
        }
        res.json(result);
      });
      }
    }
    else{
      const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        db.query(query, [senderId, i, projectnames[i], 3], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database Error" });
        }
        res.json(result);
      });
    }
  }
});
app.post("/member/projects/3a", async (req, res) => {
  const projectnames = ["Art Exhibition Review (Time 6-9 minutes)", "	Concert Review (Time 6-9 minutes)", "Film Review (Time 6-9 minutes)",
    "Play/Theatre Review (Time 6-9 minutes)", "Book Review (Time 6-9 minutes)", "Book Report (Time 3-5 minutes)",
    "Impact Speech (Time 5-8 minutes)", "	Special Occasion Speech (Time as programmed)", "Occupational or personal interest speech (5-7 minutes)",
    "Speech contest speech (Time 5-8 minutes)", "Extemporaneous Speech (Time 5-7 minutes)", "Moderator of a Dialogue Evaluation (Time 20-30 minutes)",
    "Assignment using a microphone (Time as programmed)", "Assignment using a microphone (Time as programmed)",];
  const { senderId } = req.body;
  for (const i=0; i< projectnames.length; i++){
    
    const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
      db.query(query, [senderId, i, projectnames[i], 3.1], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      res.json(result);
    });
    
  }
});
app.post("/member/projects/4", async (req, res) => {
  const projectnames = ["Prepare and present an education session at any level", "Prepare and present an education session at any level", "Present at any level an education session developed by someone else", "Interpretive Reading", "Delivering a Presentation with PowerPoint", "Research Speech\n5-8 minutes", "Current Event Speech\n5-8 minutes", "Speech Using Visual Aids\n5-8 minutes", "Impromptu Speech\n4-7 minutes", "Word Power Education\n20 minutes", "Assignment Evaluator", "General Evaluator\n8-10 minutes", "Committee Member"];
  const { senderId } = req.body;
  for (const i=0; i< projectnames.length; i++){
    if (i == 10){
      for (const j=0; j<3; j++){
        const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        db.query(query, [senderId, i, projectnames[i], 4], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database Error" });
        }
        res.json(result);
      });
      }
    }
    else if (i == 1 || i == 12){
      for (const j=0; j<2; j++){
        const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        db.query(query, [senderId, i, projectnames[i], 4], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database Error" });
        }
        res.json(result);
      });
      }
    }
    else{
      const query = "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        db.query(query, [senderId, i, projectnames[i], 4], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database Error" });
        }
        res.json(result);
      });
    }
  }
});
app.post("/request-project", async (req, res) => {
  const {club_id, project_no} = req.body;
  const query = "INSERT INTO `program_requests` (project_id, club_id) VALUES (?, ?)"
  db.query(query, [project_no, club_id], (err, result) => {
  //need to change this to meeting
  console.log(club_id)
  console.log(project_no);
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
      return res.status(200).json({ message: "New Request Successful" });
  });
});
app.post("/autofill-meetings", async (req, res) => {
    
    let nextDates = [];
    const club_data = await get_clubdates();
    console.log(club_data);
    for (var i = 0; i < club_data.length; i++){
      club = club_data[i];
      console.log(club)
      const arr = club.interval.split(",");
      const days = arr.flatMap((el) =>{
        if(typeof el == "string"){ //converts string to int
            return el.split(",").map((n)=> (+n - 1)); //-1 to align with dayjs counting 0 as 1st
        }
        return el;
      })
      const cal = dayjs.recur().every(club.club_day).daysOfWeek().every(days).weeksOfMonthByDay();
      const firstDayOfMonth = dayjs().startOf("month")
      cal.fromDate(firstDayOfMonth);
      const curr_month = dayjs().month()
      if(curr_month == 0 || curr_month == 10){ //if january or november
        nextmeetings = cal.next(1);
        for (var j = 0; j < 1; j++){
          nextDates.push(nextmeetings[j].toDate());
          const meet_name = `${club.Club_name} Meeting ${j+1}`
          set_meetings(club.Club_id, meet_name, nextmeetings[j].toDate(), club.club_time, "placeholder");
        }
        
        console.log(nextDates)
        const club_memb = await members_in_clubs(club.Club_id);
    
        console.log(club_memb)
        for (var j = 0; j < 1; j++){
          mem = club_memb[j];
          for (var k = 0; k < days.length; k++){
            console.log(nextmeetings[k].toDate())
            const alligned_meeting = await get_meetingids(club.Club_id, nextmeetings[k].toDate());
            console.log(alligned_meeting);
            assign_all_to_meetings(mem.User_id, alligned_meeting[0].meeting_id);
          }
        }
      }
      if(curr_month == 11){ // If december
        //no meetings
        console.log("No meetings for this month")
        return
      }
      else{
        nextmeetings = cal.next(days.length);
      for (var j = 0; j < days.length; j++){
        nextDates.push(nextmeetings[j].toDate());
        const meet_name = `${club.Club_name} Meeting ${j+1}`
        set_meetings(club.Club_id, meet_name, nextmeetings[j].toDate(), club.club_time, "placeholder");
      }
      
      console.log(nextDates)
      const club_memb = await members_in_clubs(club.Club_id);
  
      console.log(club_memb)
      for (var j = 0; j < club_memb.length; j++){
        mem = club_memb[j];
        for (var k = 0; k < days.length; k++){
          console.log(nextmeetings[k].toDate())
          const alligned_meeting = await get_meetingids(club.Club_id, nextmeetings[k].toDate());
          console.log(alligned_meeting);
          assign_all_to_meetings(mem.User_id, alligned_meeting[0].meeting_id);
        }
      }
      }
      
    }
});
app.listen(+process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on port ` + process.env.PORT);
});


function get_clubdates(){
  return new Promise((resolve, reject) => {
    db.query('SELECT Club_id, Club_name, club_day, `interval`, club_time  FROM `club`', (err, results, fields) => {
      if(!err){
        resolve(results);
      }
      else{
        reject(err)
      }
    })
  })
}

function set_meetings(clubid, meetingname, meetingdate, meetingtime, meetingplace){ //CHANGE IN INDEX.js
  return new Promise((resolve, reject) => {
    query = "INSERT INTO `meeting` (club_id, meeting_name, meeting_date, meeting_time, meeting_place) VALUES (?, ?, ?, ?, ?)"
    db.query(query, [clubid, meetingname, meetingdate, meetingtime, meetingplace], (err, results, fields) => {
      if(!err){
        //console.log(results);
        resolve(results);
      }
      else{
        reject(err);
      }
    })
  })
}

function members_in_clubs(clubid){ //CHANGE IN INDEX.js
  return new Promise((resolve, reject) => {
    query = "SELECT User_id FROM `member's club` WHERE Club_id = ?"
    db.query(query, [clubid], (err, results, fields) => {
      if(!err){
        //console.log(results);
        resolve(results);
      }
      else{
        reject(err);
      }
    })
  })
}

function get_meetingids(clubid, meetingdate){ //CHANGE IN INDEX.js
  return new Promise((resolve, reject) => {
    const formattedDate = meetingdate.toISOString().split('T')[0]
    query = "SELECT meeting_id FROM meeting WHERE club_id = ? and meeting_date = ?"
    db.query(query, [clubid, formattedDate], (err, results, fields) => {
      if(!err){
        //console.log(`${results} + ${clubid} + ${meetingdate}`);
        resolve(results);
      }
      else{
        reject(err);
      }
    })
  })
}

function assign_all_to_meetings(user, meetingid){ //CHANGE IN INDEX.js
  return new Promise((resolve, reject) => {
    query = "INSERT INTO meeting_attendance (user_id, meeting_id) VALUES (?, ?)"
    db.query(query, [user, meetingid], (err, results, fields) => {
      if(!err){
        console.log(results);
        resolve(results);
      }
      else{
        reject(err);
      }
    })
  })
}

module.exports = app;