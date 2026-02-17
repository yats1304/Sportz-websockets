import express from "express";
import { matchRouter } from "./routes/matches.route.js";

const app = express();
const PORT = 8000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from Express server!");
});

app.use("/matches", matchRouter);

app.listen(PORT, () => {
  console.log(`Sever is running at http://localhost:${PORT}`);
});
