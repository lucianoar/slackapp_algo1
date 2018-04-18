require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const { find } = require("./users");
const debug = require("debug")("slackapp_algo1");

const app = express();

// Parse application/x-www-form-urlencoded && application/json body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("<h2>Slack app algo1 running...</h2>");
});

app.post("/mis_notas", (req, res) => {
  const { token, user_name, user_id } = req.body;
  if (token === process.env.SLACK_VERIFICATION_TOKEN) {
    find(user_id).then(r => {
      if (r.data.ok) {
        const { user } = r.data;
        res.send(`Hola ${user.real_name}, tu id es ${user.id}`);
      } else {
        res.sendStatus(500);
      }
    });
    // res.sendStatus(200)
  } else {
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}!`);
});
