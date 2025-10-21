const express = require("express");
const { db } = require("../config/database");

const router = express.Router();

/**
 * Get user profile by ID
 * URL Parameter: id
 * @param {int} id the user ID to retrieve the profile for
 */
router.get("/profile/:id", (req, res) => {
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
/**
 * Edit user profile
 * Request Body: { profile_id, first_name, last_name, email, phone_number, address, postcode, interests, pronouns, dob }
 * @param {int} profile_id The user ID to update profile for
 * @param {string} first_name The first name of the user
 * @param {string} last_name The last name of the user
 * @param {string} email The email of the user
 * @param {string} phone_number The phone number of the user
 * @param {string} address The address of the user
 * @param {string} postcode The postcode of the user
 * @param {string} interests The interests of the user
 * @param {string} pronouns The pronouns of the user
 * @param {date} dob The date of birth of the user
 */
router.post("/profile/edit/", (req, res) => {
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

/**
 * Update profile privacy settings
 * Request Body: { profile_id, phone_private, address_private }
 * @param {int} profile_id The user ID to update privacy settings for
 * @param {boolean} phone_private Whether phone number is private
 * @param {boolean} address_private Whether address is private
 */
router.post("/profile/share/", (req, res) => {
  const { profile_id, phone_private, address_private } = req.body;
  const editProfileQuery =
    "UPDATE members SET phone_private = ?, address_private = ? WHERE user_id = ?";
  db.query(
    editProfileQuery,
    [phone_private, address_private, profile_id],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      return res.status(200).json({ message: "Profile Updated Successfully" });
    }
  );
});
module.exports = router;