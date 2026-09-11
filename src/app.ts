import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middlewares/error.middleware";
const app = express();
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/v1", routes);
// app.get("/", (req: Request, res: Response) => {
//     res.status(200).json({ message: "Welcome to the Expense Tracker API" });
// })
app.use(notFound);
app.use(errorHandler);
export default app;
