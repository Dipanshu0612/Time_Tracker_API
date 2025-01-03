import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import router from "./routes/api_routes.js";
import swaggerUI from 'swagger-ui-express';
import SwaggerFile from './openapi.json' assert { type: "json" };

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", router);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(SwaggerFile))

app.use(
  "/",
  (err: ErrorEvent, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json("Oops, Something Bad Happened!");
    console.log(err);
  }
);

app.listen(3001, () => {
  console.log("Hello from Port 3001! 🙋🏻‍♂️");
});
