require("dotenv").config();
const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { listUsers } = require("./users.js");
const debug = require("debug")("googleapis_sheets");
const OAuth2Client = google.auth.OAuth2;
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = "credentials.json";

const keys = JSON.parse(process.env.CLIENT_SECRET_GOOGLE_AUTH);

const authorize = (credentials, callback) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new OAuth2Client(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
};

let auth = null;
const init = () => {
  authorize(keys, a => {
    debug("Authorized");
    auth = a;
  });
};
init();

const getNewToken = (oAuth2Client, callback) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
};

const get_all_notes = () => {
  return new Promise((res, rej) => {
    const sheets = google.sheets({ version: "v4", auth });
    sheets.spreadsheets.values.get(
      {
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: process.env.NOTES_RANGE
      },
      (err, r) => {
        if (err) rej(err);
        res(r.data);
      }
    );
  });
};

const get_notes_of_student = real_name => {
  return new Promise((res, rej) => {
    get_all_notes().then(notes => {
      res(
        notes.values.filter(note => note[0] == real_name).map(n => {
          return {
            titulo: n[1],
            nota: n[2],
            fecha: n[3],
            link: n[4],
            observaciones: n[5]
          };
        })
      );
    });
  });
};

const clear_students_names = () => {
  return new Promise((res, rej) => {
    const sheets = google.sheets({ version: "v4", auth });
    sheets.spreadsheets.values.batchClear(
      {
        spreadsheetId: process.env.SPREADSHEET_ID,
        ranges: [process.env.STUDENTS_RANGE]
      },
      (err, r) => {
        if (err) {
          debug(err);
          rej(err);
        } else {
          debug("Student names cleared");
          res(r);
        }
      }
    );
  });
};

const write_students_slack_names = () => {
  return new Promise((res, rej) => {
    listUsers().then(users => {
      const sheets = google.sheets({ version: "v4", auth });
      const values = users.map(u => [u.real_name, u.name]);
      clear_students_names().then(() => {
        sheets.spreadsheets.values.update(
          {
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: process.env.STUDENTS_RANGE,
            valueInputOption: "RAW",
            resource: { values }
          },
          (err, r) => {
            if (err) {
              debug(err);
              rej(err);
            } else {
              res(r);
            }
          }
        );
      });
    });
  });
};

module.exports = {
  get_notes_of_student,
  write_students_slack_names
};
