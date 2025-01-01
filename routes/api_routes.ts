import express, { Request, Response } from "express";
import dbMod from "../database/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import verifyToken from "../middleware/auth.js";
import { Parser } from "@json2csv/plainjs";
import moment from "moment";

configDotenv();

const router = express.Router();
const { db, checkConnection } = dbMod;
interface MyRequest extends Request {
  user?: any;
}

function validateDates(startDate:string, endDate:string) {
  const start = moment(startDate, "YYYY-MM-DD HH:mm:ss", true);
  const end = moment(endDate, "YYYY-MM-DD HH:mm:ss", true);

  if (!start.isValid()) {
    throw new Error(
      "Start date is invalid. Please use the format YYYY-MM-DD HH:MM:SS."
    );
  }

  if (!end.isValid()) {
    throw new Error(
      "End date is invalid. Please use the format YYYY-MM-DD HH:MM:SS."
    );
  }

  if (start.isAfter(end)) {
    throw new Error("Start date cannot be greater than end date.");
  }

  return true;

}

interface Project {
  user_id: number;
  name:string;
  description:string;
  status: string;
  project_id: number;
  start_time: string,
  end_time:string
}

interface Task{
  user_id: number,
  project_id: number,
  task_description: string,
  task_id: number,
  status: string,
  start_time: string,
  end_time: string;
}
interface User{
  Name: string,
  Email_ID: string,
  Password: string,
  user_id:number,
}

checkConnection();

router.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    messgae: "Welcome to the time tracker API!",
    description:
      "A RESTful API to help freelancers track time spent on projects and generate work summaries.",
    routes:
      "'/', '/add-user', '/verify-user', '/get-project/:project_id', '/delete-project', '/project-timestamp', '/get-summary/:project_id', '/get-summary'",
  });
});

router.post("/add-user", async (req: Request, res: Response) => {
  const { Name, Email_ID, Password }:User = req.body;
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
  const { user_id, Password }:User = req.body;
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
    //@ts-ignore
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
  //@ts-ignore
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { user_id, name, description, status }:Project = req.body;
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
      // console.log(result);
      res.status(200).json({
        message: "Project added successfully!",
        project_id: result[0],
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Could not add project!" });
      console.log(error);
    }
  }
);

router.get(
  "/get-project/:project_id",
  //@ts-ignore
  verifyToken,
  async (req: Request, res: Response) => {
    const { project_id } = req.params;
    const result = await db("projects")
      .select("*")
      .where("project_id", project_id)
      .first();
    result.created_at = moment(result.created_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    result.updated_at = moment(result.updated_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
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
  //@ts-ignore
  verifyToken,
  async (req: MyRequest, res: Response) => {
    try {
      const { project_id } = req.body;
      const user_id = req.user?.user_id;
      if (!user_id) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      const project = await db("projects")
        .where("project_id", project_id)
        .first();

      if (!project) {
        res
          .status(404)
          .json({ message: `No Project found with ID: ${project_id}` });
        return;
      }
      if (project.user_id !== user_id) {
        res.status(403).json({
          message: `User with ID: ${user_id} does not have permission to delete this project.`,
        });
        return;
      }

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
  "/create-project-task",
  //@ts-ignore
  verifyToken,
  async (req: MyRequest, res: Response) => {
    try {
      const user_id = req.user.user_id;
      const { project_id, task_description, start_time, end_time } : Task = req.body;
      if (!project_id || !task_description || !start_time || !end_time) {
        return res.status(400).json({
          message:
            "Incomelpete details! Please provide all the details to create task in the project.",
        });
      }
      try {
        validateDates(start_time, end_time);
      } catch (error:any) {
        res.status(400).json({Error:error.message});
        return;
      }
      const proj_user = await db("projects")
        .select("user_id")
        .where("project_id", project_id)
        .first();
      if (!proj_user) {
        res
          .status(404)
          .json({ message: `No project found with ID: ${project_id}.` });
        return;
      }
      if (proj_user.user_id !== user_id) {
        res.status(401).json({
          message: `User with ID: ${user_id} does not have access to project with ID: ${project_id}.`,
        });
        return;
      }
      const task = await db("proj_tasks").insert({
        project_id,
        user_id,
        task_description,
        start_time,
        end_time,
      });
      res
        .status(200)
        .json({ message: "Task created successfully!", task_id: task[0] });
      return;
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Could not add task!", error: error.sqlMessage });
    }
  }
);

router.get(
  "/get-project/:project_id/tasks",
  //@ts-ignore
  verifyToken,
  async (req: Request, res: Response) => {
    const { project_id } = req.params;
    if (project_id === ":project_id") {
      res.status(400).json({ message: "No project ID Provided!" });
      return;
    }
    const result = await db("proj_tasks")
      .select("*")
      .where("project_id", project_id)
      .first();
    result.start_time = moment(result.start_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    result.end_time = moment(result.end_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(404).json({
        message: `No Tasks found with for project with ID: ${project_id}`,
      });
    }
  }
);

router.get(
  "/get-project/:project_id/tasks/:task_id",
  //@ts-ignore
  verifyToken,
  async (req: MyRequest, res: Response) => {
    const { project_id, task_id } = req.params;
    if (project_id === ":project_id" || task_id === ":task_id") {
      res.status(400).json({
        message: "Please provide the complete details to update the task!",
      });
      return;
    }
    const project = await db("proj_tasks")
      .select("*")
      .where("project_id", project_id)
      .where("task_id", task_id)
      .first();
    if (!project) {
      res.status(404).json({ message: `Task with ID: ${task_id} not fonud! ` });
      return;
    }
    project.start_time = moment(project.start_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    project.end_time = moment(project.end_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    project.created_at = moment(project.created_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    res.status(200).json(project);
  }
);

router.put(
  "/get-project/:project_id/tasks/:task_id",
  //@ts-ignore
  verifyToken,
  async (req: MyRequest, res: Response) => {
    const { project_id, task_id } = req.params;
    const { task_description, start_time, end_time, status } : Task = req.body;
    if (!task_description && !start_time && !end_time && !status) {
      res
        .status(400)
        .json({ message: "Please provide details to update the task" });
      return;
    }
    if (project_id === ":project_id" || task_id === ":task_id") {
      res.status(400).json({
        message: "Please provide the complete details to update the task!",
      });
      return;
    }

    const project = await db("proj_tasks")
      .select("*")
      .where("project_id", project_id)
      .where("task_id", task_id)
      .first();
    if (!project) {
      res.status(404).json({ message: `Task with ID: ${task_id} not fonud! ` });
      return;
    }
    project.start_time = moment(project.start_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    project.end_time = moment(project.end_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    project.created_at = moment(project.created_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");

    if (task_description) {
      await db("proj_tasks").update({ task_description }).where("task_id", task_id);
    }
    if (start_time) {
      await db("proj_tasks").update({ start_time }).where("task_id", task_id);
    }
    if (end_time) {
      await db("proj_tasks").update({ end_time }).where("task_id", task_id);
    }
    if (status) {
      await db("proj_tasks").update({ status }).where("task_id", task_id);
    }
    res.status(200).json({ message: "Task updated succesfully!" });
  }
);

router.post(
  "/project-task-timestamp",
  //@ts-ignore
  verifyToken,
  async (req: MyRequest, res: Response) => {
    try {
      const user_id = req.user.user_id;
      const { task_id, project_id, start_time, end_time, task_description } : Task =
        req.body;
      if (
        !task_id ||
        !user_id ||
        !project_id ||
        !start_time ||
        !end_time ||
        !task_description
      ) {
        return res.status(400).json({
          message:
            "Incomelpete details! Please provide all the details to add timestamp in the project.",
        });
      }
      if (!user_id) {
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

      const projUser = await db("projects")
        .select("user_id")
        .where("project_id", project_id)
        .first();
      if (user_id !== projUser.user_id) {
        res.status(401).json({
          message: `User with ID: ${user_id} does not has access to project with ID: ${project_id}!`,
        });
        return;
      }
      const task = await db("proj_tasks")
        .select("task_id")
        .where("project_id", project_id)
        .first();
      if (!task) {
        res.status(404).json({
          message: `Task with ID: ${task_id} does not exist on project with ID: ${project_id}!`,
        });
        return;
      }

      await db("time_entries").insert({
        project_id,
        task_id,
        user_id,
        start_time,
        end_time,
        descriptiom:task_description,
      });
      res.status(200).json({
        message: `Timestamp for Task with ID : ${task_id} inserted!`,
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

  project.start_time = moment(project.start_time)
    .local()
    .format("YYYY-MM-DD HH:mm:ss");
  project.end_time = moment(project.end_time)
    .local()
    .format("YYYY-MM-DD HH:mm:ss");

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
    project.start_time = moment(project.start_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    project.end_time = moment(project.end_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");

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
