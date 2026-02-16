import express from "express";

const app = express();
const PORT = 8000;

app.use(express.json);

app.get("/", (req, res) => {
  res.send("Hello from Express server!");
});

app.listen(PORT, () => {
  console.log(`Sever is running at http://localhost:${PORT}`);
});
