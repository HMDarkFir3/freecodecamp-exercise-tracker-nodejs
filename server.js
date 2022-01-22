const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL);

const userSchema = new Schema({
  username: {
    type: String,
    require: true,
  },
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
  count: Number,
});

const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app
  .route("/api/users")
  .post((req, res) => {
    const { username } = req.body;

    const user = new User({ username, count: 0 });
    user.save((err, data) => {
      if (err) {
        res.json({ error: err });
      }

      res.json(data);
    });
  })
  .get((req, res) => {
    User.find((err, data) => {
      if (data) {
        res.json(data);
      }
    });
  });

app.post("/api/users/:_id/exercises", (req, res) => {
  const { description } = req.body;
  const duration = parseInt(req.body.duration);
  const date = req.body.date
    ? new Date(req.body.date).toDateString()
    : new Date().toDateString();

  const id = req.params._id;

  const exercise = {
    description,
    duration,
    date,
  };

  User.findByIdAndUpdate(
    id,
    { $push: { log: exercise }, $inc: { count: 1 } },
    { new: true },
    (err, user) => {
      if (user) {
        const updatedExercise = {
          username: user.username,
          _id: id,
          ...exercise,
        };

        res.json(updatedExercise);
      }
    }
  );
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { from, to, limit } = req.query;

  User.findById(req.params._id, (err, user) => {
    if (user) {
      if (from || to || limit) {
        const logs = user.log;
        const filteredLogs = logs.filter((log) => {
          const formattedLogDate = new Date(log.date)
            .toISOString()
            .split("T")[0];

          return true;
        });

        const slicedLogs = limit ? filteredLogs.slice(0, limit) : filteredLogs;

        user.log = slicedLogs;
      }

      res.json(user);
    }
  });
});

app.get("/mongo-health", (req, res) => {
  res.json({ status: mongoose.connection.readyState });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
