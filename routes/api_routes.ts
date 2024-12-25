import express, { Request, Response } from "express";
import dbMod from "../database/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import verifyToken from "../middleware/auth.js";
import { Parser } from "@json2csv/plainjs";

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
    res.status(400).json({ message: "ID or Password is Missing!" });
    return;
  }
  const user = await db("user_data").where("user_id", user_id).first();
  if (!user) {
    res.status(404).json({ message: `No user found with ID ${user_id}!` });
    return;
  }
  const validPass = await bcrypt.compare(Password, user.Password);
  if (validPass) {
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_KEY, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "Successfully Verified User!", token });
    return;
  } else {
    res.status(401).json({ message: "Invalid Credentials!" });
    return;
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

router.get(
  "/get-project/:project_id",
  verifyToken,
  async (req: Request, res: Response) => {
    const { project_id } = req.params;
    const result = await db("projects")
      .select("*")
      .where("project_id", project_id)
      .first();
    if (result) {
      res.status(200).send(result);
    } else {
      res
        .status(404)
        .json({ message: `No Project found with ID: ${project_id}` });
    }
  }
);

router.delete(
  "/delete-project",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { project_id } = req.body;
      const deleted = await db("projects")
        .where("project_id", project_id)
        .del();
      if (deleted === 0) {
        res
          .status(404)
          .json({ message: `No Project found with ID: ${project_id}` });
        return;
      }
      res.status(200).json({ message: "Project deleted successfully!" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting project!" });
      console.log(error);
    }
  }
);

router.post(
  "/project-timestamp",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { user_id, project_id, start_time, end_time, description } =
        req.body;
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
  }
);

router.get("/get-summary/:project_id", async (req: Request, res: Response) => {
  const { project_id } = req.params;
  const project = await db("projects")
    .select("*")
    .where("project_id", project_id)
    .first();
  if (!project) {
    res
      .status(404)
      .json({ message: `No project found with ID: ${project_id}` });
    return;
  }
  const timestamps = await db("time_entries")
    .select("start_time", "end_time")
    .where("project_id", project_id);

  if (!timestamps) {
    res.send(404).json({
      message: `No timestamps found for project with ID: ${project_id}!`,
    });
    return;
  }

  const result = await db("time_entries")
    .select(
      db.raw(
        "SUM(TIMESTAMPDIFF(SECOND, start_time, end_time) / 3600) as total_hours"
      )
    )
    .where("project_id", project_id)
    .as("total_hours");

  const totalHours = result[0].total_hours;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  const summary = {
    ...project,
    "Total time spent": `${hours} hours ${minutes} minutes`,
  };

  const parser = new Parser();
  const csv = parser.parse(summary);
  // console.log(csv);
  res.header("Content-Type", "text/csv");
  res.attachment("summary.csv");
  res.status(200).send(csv);
});

router.get("/get-summary", async (req: Request, res: Response) => {
  const projects = await db("projects").select("*");
  if (!projects || projects.length === 0) {
    res.status(404).json({ message: "No projects found." });
    return;
  }

  const summaries = [];
  for (const project of projects) {
    const timestamps = await db("time_entries")
      .select("start_time", "end_time")
      .where("project_id", project.project_id);

    if (!timestamps) {
      summaries.push({
        ...project,
        "Total time spent": "0 hours 0 minutes",
      });
      continue;
    }
    const result = await db("time_entries")
      .select(
        db.raw(
          "SUM(TIMESTAMPDIFF(SECOND, start_time, end_time) / 3600) as total_hours"
        )
      )
      .where("project_id", project.project_id)
      .as("total_hours");

    const totalHours = result[0].total_hours;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    summaries.push({
      ...project,
      "Total time spent": `${hours} hours ${minutes} minutes`,
    });
  }

  const parser = new Parser();
  const csv = parser.parse(summaries);
  res.header("Content-Type", "text/csv");
  res.attachment("project_summaries.csv");
  res.status(200).send(csv);
});

export default router;
