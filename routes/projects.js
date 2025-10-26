const express = require("express");
const { db } = require("../config/database");

const router = express.Router();

/**
 * Get projects by project level
 * URL Parameter: id
 * @param {int} id the project level to filter by
 */
router.get("/project/:id", (req, res) => {
  const projectlevel = req.params.id;
  const query = "SELECT * FROM `development program` WHERE project_level = ?";

  db.query(query, [projectlevel], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result);
  });
});
/**
 * Get projects by program level and user ID
 * Request Body: { program_level, user_id }
 * @param {Int} program_level The program level to filter by
 * @param {int} user_id The user ID to filter by
 */
router.post("/projects/", (req, res) => {
  const { program_level, user_id } = req.body;
  const query =
    "SELECT * FROM development_program WHERE program_level = ? AND user_id = ? ORDER BY project_number ASC";

  db.query(query, [program_level, user_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result);
  });
});
/**
 * Get projects by member ID and project level
 * URL Parameters: id - member ID, level - project level
 * @param {int} id The member ID to filter by
 * @param {int} level The project level to filter by
 */
router.get("/projectss/:id/:level", (req, res) => {
  const projectlevel = req.params.level;
  const projectid = req.params.id;
  const query =
    "SELECT * FROM `development program` WHERE member_id= ? AND project_level = ?";

  db.query(query, [projectid, projectlevel], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result);
  });
});
/**
 * Get completed projects count by user
 */
router.get("/projects/completed", (req, res) => {
  const query =
    "SELECT user_id, SUM(completed) as completed from `development_program` Group By user_id";

  db.query(query, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(201).json({ message: "No Projects Found" });
    }

    res.json(result);
  });
});

/**
 * Initialize Level 1 projects for a member
 * Request Body: { user_id }
 * @param {string} user_id The user ID to initialize projects for
 */
router.post("/member/projects/1", async (req, res) => {
  const projectnames = [
    "Thoughts for the Day/Inspiration",
    "Closing Thought",
    "Issues of the Day",
    "Self-Introduction Speech\n4-7 minutes",
    "Oral Reading\n4-7 minutes",
    "Poetry Reading\n4-7 minutes",
    "Word Power Education\n10 minutes",
    "Speach to Inform\n5-8 minutes",
    "Speech Containing Gestures\n5-8 minutes",
    "Introduction of a Speaker",
    "Thanking a Speaker",
    "Trainee Evaluator",
    "Self=Evaluation",
  ];
  const insertPromises = [];
  const { user_id } = req.body;
  try {
    for (let i = 0; i < projectnames.length; i++) {
      console.log(i)
      if (i == 2 || i == 11) {
        for (let j = 0; j < 3; j++) {
          const query =
            "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
          insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 1]));
        }
      } else {
        const query =
          "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 1]));
      }
    } 
    // Execute all inserts in parallel
    const results = await Promise.all(insertPromises);
    
    console.log("All lv1 projects inserted successfully");
    res.json({ 
      message: "All projects inserted successfully", 
      totalProjects: projectnames.length,
      totalInserts: insertPromises.length 
    });
  }catch(err){
    console.error("Database error:", err);
    return res.status(500).json({ message: "Database Error" });
  }
});
/**
 * Initialize Level 2 projects for a member
 * Request Body: { user_id }
 * @param {int} user_id The user ID to initialize projects for
 */
router.post("/member/projects/2", async (req, res) => {
  const projectnames = [
    "Issues of the day Leader",
    "Program Leader",
    "Speech to Persuade\n5-8 minutes",
    "Speech to inspire\n5-8 minutes",
    "Speech to Entertain\n5-8 minutes",
    "Research Speech\n5-8 minutes",
    "Current Event Speech\n5-8 minutes",
    "Speech Using Visual Aids\n5-8 minutes",
    "Impromptu Speech\n4-7 minutes",
    "Word Power Education\n20 minutes",
    "Assignment Evaluator",
    "General Evaluator\n8-10 minutes",
    "Committee Member",
  ];
  const insertPromises = [];
  const { user_id } = req.body;
  try{
    for (let i = 0; i < projectnames.length; i++) {
      if (i == 10) {
        for (let j = 0; j < 3; j++) {
          const query =
            "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
          insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 2]));
        }
      } else if (i == 1 || i == 12) {
        for (let j = 0; j < 2; j++) {
          const query =
            "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
          insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 2]));
        }
      } else {
        const query =
          "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
          insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 2]));
      }
    }

    // Execute all inserts in parallel
    const results = await Promise.all(insertPromises);
    
    console.log("All lv2 projects inserted successfully");
    res.json({ 
      message: "All projects inserted successfully", 
      totalProjects: projectnames.length,
      totalInserts: insertPromises.length 
    });
  }catch(err){
    console.error("Database error:", err);
    return res.status(500).json({ message: "Database Error" });
  }
  
});
/**
 * Initialize Level 3 projects for a member
 * Request Body: { user_id }
 * @param {int} user_id The user ID to initialize projects for
 */
router.post("/member/projects/3", async (req, res) => {
  const projectnames = [
    "Prepare a Written Report and Present Using a Microphone",
    "Present an Education Session\n20-30 minutes",
    "Program a Meeting at any Level",
    "Moderator or Discussion Leader",
    "General Evaluator",
    "Committee Chairman",
    "Club Elected Officer",
    "POWERtalk Australia Conference Delegate",
    "Speech Contest Judge",
    "Plus any six of the following eight speeches:",
    "Speech Using a Whiteboard\n8-10 minutes",
    "Biographical Speech\n8-10 minutes",
    "Review Assignment 6-9 minutes",
    "Be in Earnest Speech 5-8 minutes",
    "TV Talk 6-8 minutes",
    "Speech to Inspire, Using Technology 5-8 minutes",
    "Travelogue 7-10 minutes",
    "Impromptu Speech 7-8 minutes",
  ];
  const insertPromises = [];
  const { user_id } = req.body;
  try{
      for (let i = 0; i < projectnames.length; i++) {
      if (i == 1 || i == 2 || i == 4 || i == 5 || i == 6) {
        for (let j = 0; j < 2; j++) {
          const query =
            "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
          insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 3]));
        }
      } else {
        const query =
          "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 3]));
      }
      
    } 
    const results = await Promise.all(insertPromises);
      
      console.log("All lv3 projects inserted successfully");
      res.json({ 
        message: "All projects inserted successfully", 
        totalProjects: projectnames.length,
        totalInserts: insertPromises.length 
      });
  } catch(err){
    console.error("Database error:", err);
    return res.status(500).json({ message: "Database Error" });
  }

});
/**
 * Initialize Level 3a projects for a member
 * Request Body: { user_id }
 * @param {int} user_id The user ID to initialize projects for
 */
router.post("/member/projects/3a", async (req, res) => {
  const projectnames = [
    "Art Exhibition Review (Time 6-9 minutes)",
    "Concert Review (Time 6-9 minutes)",
    "Film Review (Time 6-9 minutes)",
    "Play/Theatre Review (Time 6-9 minutes)",
    "Book Review (Time 6-9 minutes)",
    "Book Report (Time 3-5 minutes)",
    "Impact Speech (Time 5-8 minutes)",
    "Special Occasion Speech (Time as programmed)",
    "Occupational or personal interest speech (5-7 minutes)",
    "Speech contest speech (Time 5-8 minutes)",
    "Extemporaneous Speech (Time 5-7 minutes)",
    "Moderator of a Dialogue Evaluation (Time 20-30 minutes)",
    "Assignment using a microphone (Time as programmed)",
  ];
  const insertPromises = [];
  const { user_id } = req.body;
  try{
    for (let i = 0; i < projectnames.length; i++) {
      const query =
        "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
      insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 3.1]));
    }
    const results = await Promise.all(insertPromises);
    
    console.log("All lv3a projects inserted successfully");
    res.json({ 
      message: "All projects inserted successfully", 
      totalProjects: projectnames.length,
      totalInserts: insertPromises.length 
    });

  }catch(err){
    console.error("Database error:", err);
    return res.status(500).json({ message: "Database Error" });
  }
});
/**
 * Initialize Level 4 projects for a member
 * Request Body: { user_id }
 * @param {int} user_id The user ID to initialize projects for
 */
router.post("/member/projects/4", async (req, res) => {
  const projectnames = [
    "Prepare and present an education session at any level\nMin. 45 minutes each",
    "Prepare and present an education session at any level\nMin. 90 minutes each",
    "Present at any level an education session developed by someone else\nMin 30 mintues each",
    "Interpretive Reading",
    "Delivering a Presentation with PowerPoint\nas negotiated/alloted",
    "Speech Using Visual Aids Advanced\n8-10 minutes",
    "Tachnical Presentation\n20-30 minutes",
    "Organise a Speech Contest",
    "Installation of Officers",
    "Training/Workshop Session Evaluator",
    "General Evaluator\n8-10 minutes",
    "Coordinate a Leadership Conference",
    "POWERtalk Australia Elected Officer",
    "Self-Evaluation Advanced"
  ];
  const insertPromises = [];
  const { user_id } = req.body;
  try{
    for (let i = 0; i < projectnames.length; i++) {
      if (i == 0 || i == 3|| i == 10) {
        for (let j = 0; j < 3; j++) {
          const query =
            "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
          insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 4]));
        }
      } else if (i == 1 || i == 2 || i == 9) {
        for (let j = 0; j < 2; j++) {
          const query =
            "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
          insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 4]));
        }
      } else {
        const query =
          "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 4]));
      }
    } 
    const results = await Promise.all(insertPromises);
    
    console.log("All projects inserted successfully");
    res.json({ 
      message: "All lv4 projects inserted successfully", 
      totalProjects: projectnames.length,
      totalInserts: insertPromises.length 
    });
  }catch(err){
    console.error("Database error:", err);
    return res.status(500).json({ message: "Database Error" });
  }

});
/**
 * Initialize Level 4a projects for a member
 * Request Body: { user_id }
 * @param {int} user_id The user ID to initialize projects for
 */
router.post("/member/projects/4a", async (req, res) => {
  const projectnames = [
    //0-4 are a replacement for any other project 4
    "Workshop on Constructive Evaluation\n45-90 minutes",
    "Guest Speaker Address",
    "Writing - Non-Fiction",
    "Writing - Fiction",
    "Writing - Poetry",
    //These should be presented as Level 4 Interperative Reading
    "Present a monologue\n5-7 minutes",
    "Interpret Poetry\n6-8 minutes",
    "Read a story\n8-10 minutes",
    "Oratorical Speech\n8-10 minutes",
    "Present a Play\n12-15 minutes",
    //Assitional Options for Level Leading Trainer
    "Speaker in a Debate",
    "Promote POWERtalk in the Media",
    "Organise an Online Meeting",
    "Present a Parliamentary Procedure Workshop\n45-60 minutes",
    "Be a mentor"
  ];
  const insertPromises = [];
  const { user_id } = req.body;
  try{
    for (let i = 0; i < projectnames.length; i++) {
      if (i == 0 || i == 3|| i == 10) {
        for (let j = 0; j < 3; j++) {
          const query =
            "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
          insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 4.1]));
        }
      } else if (i == 1 || i == 2 || i == 9) {
        for (let j = 0; j < 2; j++) {
          const query =
            "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
          insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 4.1]));
        }
      } else {
        const query =
          "INSERT INTO `development_program` (user_id, project_number, project_title, program_level) VALUES (?, ?, ?, ?)";
        insertPromises.push(db.promise().query(query, [user_id, i, projectnames[i], 4.1]));
      }
    } 
    const results = await Promise.all(insertPromises);
    
    console.log("All lv4a projects inserted successfully");
    res.json({ 
      message: "All projects inserted successfully", 
      totalProjects: projectnames.length,
      totalInserts: insertPromises.length 
    });
  }catch (err){
    console.error("Database error:", err);
    return res.status(500).json({ message: "Database Error" });
  }
  
});
/**
 * Request a project for a club
 * Request Body: { club_id, project_id }
 * @param {int} club_id The club ID making the request
 * @param {int} project_id The project ID being requested
 */
router.post("/request-project", async (req, res) => {
  const { club_id, project_id } = req.body;
  const query =
    "INSERT INTO `program_requests` (project_id, club_id) VALUES (?, ?)";
  db.query(query, [project_id, club_id], (err, result) => {
    //need to change this to meeting
    if (err) {
      if(`${err}`.slice(7,16) == "Duplicate") return res.status(201).json({ message: "Request already sent" });
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "New Request Successful"});
  });
});
/**
 * Mark a project as completed
 * URL Parameter: id - the project ID to mark as completed
 * @param {int} id The project ID to complete
 */
router.post("/projects/completeProject/:id", async (req, res) => {
  const project_id = req.params.id;
  const query =
    "UPDATE `development_program` SET `date_achieved` = NOW(), `completed` = 1, `has_signature` = 1 WHERE `project_id` = ?";
  db.query(query, [project_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "New Request Successful" });
  });
});
/**
 * Send feedback for a project
 * Request Body: { project_id, recipient_id, feedback }
 * @param {int} project_id The project ID to provide feedback for
 * @param {int} recipient_id The user ID receiving the feedback
 * @param {string} feedback The feedback content
 */
router.post("/projects/sendFeedback", async (req, res) => {
  const { project_id, recipient_id, feedback } = req.body;

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();

  var date_feedback_sent = yyyy + "-" + mm + "-" + dd;
  const query =
    "INSERT INTO `project_feedback` (project_id, recipient_id, feedback, date_feedback_sent) VALUES (?, ?, ?, ?)";
  db.query(
    query,
    [project_id, recipient_id, feedback, date_feedback_sent],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      return res.status(200).json({ message: "New Request Successful" });
    }
  );
});
/**
 * Delete project feedback
 * URL Parameter: id - the feedback ID to delete
 * @param {int} id The feedback ID to delete
 */
router.post("/projects/deleteFeedback/:id", async (req, res) => {
  const id = req.params.id;

  const query =
    "DELETE FROM `project_feedback` WHERE feedback_id = ?";
  db.query(
    query,
    [id],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      return res.status(200).json({ message: "Feedback Deleted Successfully" });
    }
  );
});
/**
 * Delete program request
 * URL Parameter: id - the request ID to delete
 * @param {int} id The request ID to delete
 */
router.post("/projects/deleteRequest/:id", async (req, res) => {
  const id = req.params.id;

  const query =
    "DELETE FROM `program_requests` WHERE request_id = ?";
  db.query(
    query,
    [id],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      return res.status(200).json({ message: "Request Deleted Successfully" });
    }
  );
});
/**
 * Get feedback for a user
 * URL Parameter: id - the user ID to get feedback for
 * @param {int} id The user ID to retrieve feedback for
 */
router.get("/projects/getFeedback/:id", async (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM project_feedback as A LEFT JOIN development_program AS B ON A.project_id = B.project_id WHERE a.recipient_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    res.json(result);
  });
});
/**
 * Get program requests for a user
 * URL Parameter: id - the user ID to get requests for
 * @param {int} id The user ID to retrieve requests for
 */
router.get("/projects/getRequests/:id", async (req, res) => {
  const id = req.params.id;
  const query = "SELECT A.project_id, A.request_id, B.project_title, B.project_number FROM program_requests as A Inner JOIN development_program AS B ON A.project_id = B.project_id where B.user_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    res.json(result);
  });
});

module.exports = router;