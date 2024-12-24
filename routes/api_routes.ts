import express, { Request, Response } from "express";
import dbMod from "../database/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import verifyToken from "../middleware/auth.js";
configDotenv();

const router = express.Router();
const { db, checkConnection } = dbMod;

checkConnection();

router.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    messgae: "Welcome to the time tracker API!",
    description:
      "A RESTful API to help freelancers track time spent on projects and generate work summaries.",
    routes: "TBD!",
  });
});

router.post("/add-user", async (req: Request, res: Response) => {
  const { Name, Email_ID, Password } = req.body;
  const newPass = await bcrypt.hash(Password, 10);
  try {
    await db("user_data").insert({
      Name,
      Email_ID,
      Password: newPass,
    });
    const user = await db("user_data")
      .select("user_id")
      .where("Email_ID", Email_ID)
      .first();
    res
      .status(200)
      .json({ message: "User Added Successfully!!", user_id: user.user_id });
  } catch (error: any) {
    res
      .status(400)
      .json({ message: "Could not add user!", Error: error.sqlMessage });
    console.log("Error: ", error);
  }
});

router.post("/verify-user", async (req: Request, res: Response) => {
  const { user_id, Password } = req.body;
  if (!user_id || !Password) {
    return res.status(400).json({ message: "ID or Password is Missing!" });
  }
  const user = await db("user_data").where("user_id", user_id).first();
  if (!user) {
    return res
      .status(404)
      .json({ message: `No user found with ID ${user_id}!` });
  }
  const validPass = await bcrypt.compare(Password, user.Password);
  if (validPass) {
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_KEY, {
      expiresIn: "1h",
    });
    return res
      .status(200)
      .json({ message: "Successfully Verified User!", token });
  } else {
    return res.status(404).json({ message: "Invalid Credentials!" });
  }
});

router.post(
  "/create-project",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { user_id, name, description, status } = req.body;
      if (!user_id || !name || !description || !status) {
        return res.status(400).json({
          message:
            "Incomelpete details! Please provide all the details to add project.",
        });
      }
      const result = await db("projects").insert({
        user_id,
        name,
        description,
        status,
      });
      console.log(result);
      res.status(200).json({ message: "Project added successfully!" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Could not add project!", error: error.sqlMessage });
    }
  }
);

router.get("/get-project/:project_id", verifyToken, async (req, res) => {
  const { project_id } = req.params;
  const result = await db("projects")
    .select("*")
    .where("project_id", project_id)
    .first();
  if (result) {
    return res.status(200).send(result);
  } else {
    res
      .status(404)
      .json({ message: `No Project found with ID: ${project_id}` });
  }
});

router.delete("/delete-project", verifyToken, async (req, res) => {
  try {
    const { project_id } = req.body;
    const deleted = await db("projects").where("project_id", project_id).del();
    if (deleted === 0) {
      return res
        .status(404)
        .json({ message: `No Project found with ID: ${project_id}` });
    }
    res.status(200).json({ message: "Project deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project!" });
    console.log(error);
  }
});

router.post("/project-timestamp", verifyToken, async (req, res) => {
  try {
    const { user_id, project_id, start_time, end_time, description } = req.body;
    if (!user_id || !project_id || !start_time || !end_time || !description) {
      return res.status(400).json({
        message:
          "Incomelpete details! Please provide all the details to add timestamp in the project.",
      });
    }
    const user = await db("user_data").where("user_id", user_id).first();
    if (!user) {
      return res.status(404).json({
        message: `User with ID ${user_id} does not exist.`,
      });
    }

    const project = await db("projects")
      .where("project_id", project_id)
      .first();
    if (!project) {
      return res.status(404).json({
        message: `Project with ID ${project_id} does not exist.`,
      });
    }

    await db("time_entries").insert({
      user_id,
      project_id,
      start_time,
      end_time,
      description,
    });
    res.status(200).json({
      message: `Timestamp for Project with ID : ${project_id} inserted!`,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error adding timestamp!", error: error.sqlMessage });
  }
});

export default router;
