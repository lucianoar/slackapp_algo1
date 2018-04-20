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

const fakeData = [
  {
    titulo: "Trabajo practico N1",
    nota: 9,
    link: "http://www.google.com",
    observaciones: "Muy buen trabajo",
    fecha: "18/02/18"
  },
  {
    titulo: "Examen parcial 1",
    nota: 4,
    link: "http://www.google.com",
    observaciones: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Duis sodales dapibus lorem, non imperdiet elit volutpat et.  Aenean imperdiet ultrices sagittis.  Ut elit mi, dictum sed tristique non, lacinia ac augue.  Maecenas sem odio, posuere congue eleifend vel, elementum ac nisl.  Duis nec tristique arcu, non imperdiet tortor.  Sed a neque eget leo sagittis consequat ut a mauris.  Nulla sodales consectetur malesuada.  Phasellus euismod sed nisl ac euismod.  Vestibulum at consequat mauris.  Nam sollicitudin vel urna non posuere.`,
    fecha: "7/03/18"
  }
];

app.post("/mis_notas", (req, res) => {
  const { token, user_name, user_id } = req.body;
  if (token === process.env.SLACK_VERIFICATION_TOKEN) {
    find(user_id)
      .then(r => {
        if (r.data.ok) {
          const { user } = r.data;
          const responseData = {
            type: "ephemeral",
            text: `*Notas de ${user.real_name}*`,
            attachments: fakeData.map(d => {
              return {
                title: d.titulo,
                color: d.nota > 7 ? "good" : "warning",
                fields: [
                  {
                    title: "Nota",
                    value: `*${d.nota}*`,
                    short: true
                  },
                  {
                    title: "Enlace",
                    value: d.link,
                    short: true
                  },
                  {
                    title: "Fecha",
                    value: d.fecha,
                    short: true
                  },
                  {
                    title: "Observaciones",
                    value: d.observaciones
                  }
                ]
              };
            })
          };
          res.type("json");
          res.send(JSON.stringify(responseData));
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

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}!`);
});
