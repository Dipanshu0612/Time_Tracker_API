import express, { Request, Response } from "express";
import { db } from "../database/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import verifyToken from "../middleware/auth.js";
import { Parser } from "@json2csv/plainjs";
import moment from "moment";
import {
  NewProject,
  NewProjectTask,
  NewTime_Entry,
  NewUser,
  Project,
  UpdateProject,
  UpdateProjectTask,
} from "../database/kysely.js";
import { sql } from "kysely";

configDotenv();

const router = express.Router();
interface MyRequest extends Request {
  user?: any;
}

function validateDates(startDate: string, endDate: string) {
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

router.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    messgae: "Welcome to the time tracker API!",
    description:
      "A RESTful API to help freelancers track time spent on projects and generate work summaries. Create, update, and delete projects, tasks, and timestamps.",
    routes:
      "'/', '/add-user', '/verify-user', '/create-project', '/get-project/:project_id', '/delete-project', '/create-project-task', '/get-project/:project_id/tasks', '/get-project/:project_id/tasks/:task_id', '/get-project/:project_id/tasks/:task_id/update', '/project-task-timestamp', '/get-summary/:project_id', '/get-summary'",
  });
});

router.post("/add-user", async (req: Request, res: Response) => {
  const { Name, Email_ID, Password }: NewUser = req.body;
  const newPass = await bcrypt.hash(Password, 10);
  try {
    const result = await db
      .insertInto("user_data")
      .values({ Name, Email_ID, Password: newPass })
      .executeTakeFirst();
    const user_id = Number(result.insertId);
    res.status(200).json({ message: "User Added Successfully!!", user_id });
  } catch (error: any) {
    res
      .status(400)
      .json({ message: "Could not add user!", Error: error.message });
    console.log("Error: ", error);
  }
});

router.post("/verify-user", async (req: Request, res: Response) => {
  const { user_id, Password }: NewUser = req.body;
  if (!user_id || !Password) {
    res.status(400).json({ message: "ID or Password is Missing!" });
    return;
  }
  const result = await db
    .selectFrom("user_data")
    .select("Password")
    .where("user_id", "=", user_id)
    .execute();
  if (!result) {
    res.status(404).json({ message: `No user found with ID ${user_id}!` });
    return;
  }
  const validPass = await bcrypt.compare(Password, result[0].Password);
  if (validPass) {
    //@ts-ignore
    const token = jwt.sign({ user_id }, process.env.JWT_KEY, {
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
      const { user_id, name, description, status }: NewProject = req.body;
      if (!user_id || !name || !description || !status) {
        return res.status(400).json({
          message:
            "Incomelpete details! Please provide all the details to add project.",
        });
      }
      const result = await db
        .insertInto("projects")
        .values({ user_id, name, description, status })
        .executeTakeFirst();
      const project_id = Number(result.insertId);
      // console.log(result);
      res.status(200).json({
        message: "Project added successfully!",
        project_id,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Could not add project!", Error: error.message });
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
    const result = await db
      .selectFrom("projects")
      .selectAll()
      .where("project_id", "=", Number(project_id))
      .execute();
    result[0].created_at = moment(result[0].created_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    result[0].updated_at = moment(result[0].updated_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    if (result) {
      res.status(200).send(result[0]);
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
      const { project_id }: UpdateProject = req.body;
      const user_id = req.user.user_id;
      if (!user_id) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      const project = await db
        .selectFrom("projects")
        .select(["project_id", "user_id"])
        .where("project_id", "=", Number(project_id))
        .execute();

      if (project.length === 0) {
        res
          .status(404)
          .json({ message: `No Project found with ID: ${project_id}` });
        return;
      }
      if (project[0].user_id !== user_id) {
        res.status(403).json({
          message: `User with ID: ${user_id} does not have permission to delete this project.`,
        });
        return;
      }

      const deleted = await db
        .deleteFrom("projects")
        .where("project_id", "=", Number(project_id))
        .executeTakeFirst();
      if (Number(deleted.numDeletedRows) !== 1) {
        res
          .status(404)
          .json({ message: `No Project found with ID: ${project_id}` });
        return;
      }
      res.status(200).json({ message: "Project deleted successfully!" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error deleting project!", Error: error.message });
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
      const {
        project_id,
        task_description,
        start_time,
        end_time,
      }: NewProjectTask = req.body;
      if (!project_id || !task_description || !start_time || !end_time) {
        return res.status(400).json({
          message:
            "Incomelpete details! Please provide all the details to create task in the project.",
        });
      }
      try {
        validateDates(start_time, end_time);
      } catch (error: any) {
        res.status(400).json({ Error: error.message });
        return;
      }
      const proj_user = await db
        .selectFrom("projects")
        .select("user_id")
        .where("project_id", "=", Number(project_id))
        .executeTakeFirst();
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
      const task = await db
        .insertInto("proj_tasks")
        .values({
          project_id,
          user_id,
          task_description,
          start_time,
          end_time,
          status: "Ongoing",
        })
        .executeTakeFirst();
      const task_id = Number(task.insertId);
      res.status(200).json({ message: "Task created successfully!", task_id });
      return;
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Could not add task!", error: error.message });
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
    const result = await db
      .selectFrom("proj_tasks")
      .selectAll()
      .where("project_id", "=", Number(project_id))
      .execute();
    if (result.length === 0) {
      res
        .status(404)
        .json({ message: `No Project found with ID: ${project_id}` });
      return;
    }
    result[0].start_time = moment(result[0].start_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    result[0].end_time = moment(result[0].end_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    result[0].created_at = moment(result[0].created_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    if (result) {
      res.status(200).send(result[0]);
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
    const project = await db
      .selectFrom("proj_tasks")
      .selectAll()
      .where((eb) =>
        eb.and({ project_id: Number(project_id), task_id: Number(task_id) })
      )
      .execute();
    if (project.length === 0) {
      res.status(404).json({
        message: `Task with ID: ${task_id} not fonud on project with ID: ${project_id}! `,
      });
      return;
    }
    project[0].start_time = moment(project[0].start_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    project[0].end_time = moment(project[0].end_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    project[0].created_at = moment(project[0].created_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    res.status(200).json(project[0]);
  }
);

router.put(
  "/get-project/:project_id/tasks/:task_id",
  //@ts-ignore
  verifyToken,
  async (req: MyRequest, res: Response) => {
    const { project_id, task_id } = req.params;
    const {
      task_description,
      start_time,
      end_time,
      status,
    }: UpdateProjectTask = req.body;
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

    const project = await db
      .selectFrom("proj_tasks")
      .selectAll()
      .where((eb) =>
        eb.and({ project_id: Number(project_id), task_id: Number(task_id) })
      )
      .execute();

    if (project.length === 0) {
      res.status(404).json({
        message: `Task with ID: ${task_id} not fonud on project with ID: ${project_id}! `,
      });
      return;
    }
    project[0].start_time = moment(project[0].start_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    project[0].end_time = moment(project[0].end_time)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    project[0].created_at = moment(project[0].created_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");

    if (task_description) {
      await db
        .updateTable("proj_tasks")
        .set({ task_description })
        .where("task_id", "=", Number(task_id))
        .execute();
    }
    if (start_time) {
      await db
        .updateTable("proj_tasks")
        .set({ start_time })
        .where("task_id", "=", Number(task_id))
        .execute();
    }
    if (end_time) {
      await db
        .updateTable("proj_tasks")
        .set({ end_time })
        .where("task_id", "=", Number(task_id))
        .execute();
    }
    if (status) {
      await db
        .updateTable("proj_tasks")
        .set({ status })
        .where("task_id", "=", Number(task_id))
        .execute();
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
      const {
        task_id,
        project_id,
        start_time,
        end_time,
        description,
      }: NewTime_Entry = req.body;
      if (
        !task_id ||
        !user_id ||
        !project_id ||
        !start_time ||
        !end_time ||
        !description
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
      const project = await db
        .selectFrom("projects")
        .select(["project_id", "user_id"])
        .where("project_id", "=", project_id)
        .executeTakeFirst();
      if (!project) {
        return res.status(404).json({
          message: `Project with ID ${project_id} does not exist.`,
        });
      }
      if (user_id !== project.user_id) {
        res.status(401).json({
          message: `User with ID: ${user_id} does not has access to project with ID: ${project_id}!`,
        });
        return;
      }
      const task = await db
        .selectFrom("proj_tasks")
        .select("task_id")
        .where("task_id", "=", task_id)
        .executeTakeFirst();
      if (!task) {
        res.status(404).json({
          message: `Task with ID: ${task_id} does not exist on project with ID: ${project_id}!`,
        });
        return;
      }

      await db
        .insertInto("time_entries")
        .values({
          task_id,
          project_id,
          user_id,
          start_time,
          end_time,
          description,
        })
        .execute();
      res.status(200).json({
        message: `Timestamp for Task with ID : ${task_id} inserted!`,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error adding timestamp!", error: error.message });
    }
  }
);

router.get("/get-summary/:project_id", async (req: Request, res: Response) => {
  const { project_id } = req.params;
  const project = await db
    .selectFrom("projects")
    .selectAll()
    .where("project_id", "=", Number(project_id))
    .executeTakeFirst();
  if (!project) {
    res
      .status(404)
      .json({ message: `No project found with ID: ${project_id}` });
    return;
  }

  project.created_at = moment(project.created_at)
    .local()
    .format("YYYY-MM-DD HH:mm:ss");
  project.updated_at = moment(project.updated_at)
    .local()
    .format("YYYY-MM-DD HH:mm:ss");

  const timestamps = await db
    .selectFrom("time_entries")
    .select(["start_time", "end_time"])
    .where("project_id", "=", Number(project_id))
    .execute();

  if (timestamps.length === 0) {
    res.status(404).json({
      message: `No timestamps found for project with ID: ${project_id}!`,
    });
    return;
  }

  const result = await db
    .selectFrom("time_entries")
    .select((eb) =>
      eb.fn
        .sum(
          sql`TIMESTAMPDIFF(SECOND, ${eb.ref("start_time")}, ${eb.ref(
            "end_time"
          )}) / 3600`
        )
        .as("total_hours")
    )
    .where("project_id", "=", Number(project_id))
    .execute();

  let totalHours = Number(result[0]?.total_hours);
  if (totalHours < 0) {
    totalHours *= -1;
  }
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
  res.attachment(`Project_${project_id}_Summary.csv`);
  res.status(200).send(csv);
});

router.get("/get-summary", async (req: Request, res: Response) => {
  const projects = await db.selectFrom("projects").selectAll().execute();

  if (projects.length === 0) {
    res.status(404).json({ message: "No projects found." });
    return;
  }

  const summaries = [];
  for (const project of projects) {
    const timestamps = await db
      .selectFrom("time_entries")
      .select(["start_time", "end_time"])
      .where("project_id", "=", project.project_id)
      .execute();

    project.created_at = moment(project.created_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    project.updated_at = moment(project.updated_at)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");

    if (timestamps.length === 0) {
      summaries.push({
        ...project,
        "Total time spent": "0 hours 0 minutes",
      });
      continue;
    }

    const result = await db
      .selectFrom("time_entries")
      .select((eb) =>
        eb.fn
          .sum(
            sql`TIMESTAMPDIFF(SECOND, ${eb.ref("start_time")}, ${eb.ref(
              "end_time"
            )}) / 3600`
          )
          .as("total_hours")
      )
      .where("project_id", "=", project.project_id)
      .execute();

    let totalHours = Number(result[0]?.total_hours);
    if (totalHours < 0) {
      totalHours *= -1;
    }
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
  res.attachment("All_Project_Summaries.csv");
  res.status(200).send(csv);
});

export default router;
