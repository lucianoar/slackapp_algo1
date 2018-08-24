FROM node:8

WORKDIR /usr/src/slackapp_algo1

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
