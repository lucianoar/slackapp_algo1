require("dotenv").config();

const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const { findUser, listUsers } = require("./users");
const { a } = require("./gsheets.js");
const debug = require("debug")("slackapp_algo1");
const { google } = require("googleapis");
const { get_notes_of_student } = require("./gsheets");

const app = express();

// Parse application/x-www-form-urlencoded && application/json body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("<h2>Slack app algo1 running...</h2>");
});

app.get("/usuarios", (req, res) => {
  listUsers().then(users => {
    res.send(users);
  });
});

const format_message = (nombre, notes) => {
  return {
    type: "ephemeral",
    text: `*Notas de ${nombre}*`,
    attachments: notes.map(d => {
      return {
        title: d.titulo,
        color: d.nota >= 7 ? "good" : "warning",
        fields: [
          {
            title: "Nota",
            value: `*${d.nota}*`,
            short: true
          },
          {
            title: "Enlace",
            value: d.link == "" ? "---" : d.link,
            short: true
          },
          {
            title: "Fecha",
            value: d.fecha,
            short: true
          },
          {
            title: "Observaciones",
            value: d.observaciones == "" ? "---" : d.observaciones
          }
        ]
      };
    })
  };
};

app.post("/mis_notas", (req, res) => {
  const { token, user_name, user_id, response_url } = req.body;
  if (token === process.env.SLACK_VERIFICATION_TOKEN) {
    findUser(user_id)
      .then(r => {
        if (r.data.ok) {
          const { user } = r.data;

          // Mandamos respuesta inicial
          res.type("json");
          res.send({
            type: "ephemeral",
            text: `*Buscando las notas de ${user.real_name}...*`
          });

          // Armamos respuesta con las notas
          get_notes_of_student(user.real_name).then(notes => {
            const message = format_message(user.real_name, notes);
            request({
              url: response_url,
              method: "POST",
              json: true,
              body: message
            });
          });
        } else {
          res.status(404).send("User not found");
        }
      })
      .catch(err => {
        res.status(403).send("Can't authenticate user");
      });
  } else {
    res.status(503).send("Slack verification token error");
  }
});

app.get("/set_gsheets_code", (req, res) => {
  const code = req.query.code;
  a(code);
  res.send();
});

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}!`);
});
