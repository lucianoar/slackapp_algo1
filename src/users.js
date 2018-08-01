const qs = require("querystring");
const axios = require("axios");

const findUser = slackUserId => {
  const body = { token: process.env.SLACK_ACCESS_TOKEN, user: slackUserId };
  const promise = axios.post(
    "https://slack.com/api/users.info",
    qs.stringify(body)
  );
  return promise;
};

const listUsers = () => {
  return new Promise((res, rej) => {
    getUsers().then(r => {
      res(
        r.data.members.map(u => {
          if (u.real_name !== null) {
            return {
              name: u.name,
              real_name: u.real_name
            };
          }
        })
      );
    });
  });
};

const getUsers = () => {
  const body = { token: process.env.SLACK_ACCESS_TOKEN };
  const promise = axios.post(
    "https://slack.com/api/users.list",
    qs.stringify(body)
  );
  return promise;
};

module.exports = { findUser, listUsers };
