import express, { Request, Response } from "express";
import dbMod from "../database/db.js";
import bcrypt from "bcrypt";

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
  const { id, Name, Email_ID, Password } = req.body;
  const newPass = await bcrypt.hash(Password, 10);
  try {
    await db("user_data").insert({ id, Name, Email_ID, Password: newPass });
    res.status(200).json({ message: "User Added Successfully!!" });
  } catch (error: any) {
    res
      .status(400)
      .json({ message: "Could not add user!", Error: error.sqlMessage });
    console.log("Error: ", error);
  }
});

router.post("/verify-user", async (req: Request, res: Response) => {
  const { id, Password } = req.body;
  if (!id || !Password) {
    return res.status(400).json({ message: "ID or Password is Missing!" });
  }
  const user = await db("user_data").where("id", id).first();
  if (!user) {
    return res.status(404).json({ message: `No user found with ID ${id}!` });
  }
  const validPass = await bcrypt.compare(Password, user.Password);
  if (validPass) {
    return res.status(200).json({ message: "Successfully Verified User!" });
  } else {
    return res.status(404).json({ message: "Invalid Credentials!" });
  }
});

router.post("/create-project", async (req, res) => {
  try {
    if (await checkConnection()) {
      res.send("Hellooo!");
    } else {
      res.send("Could not connect with database!");
    }
  } catch (error) {
    console.log("Error: ", error);
  }
});

export default router;
