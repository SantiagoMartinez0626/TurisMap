FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps --verbose
RUN npm list
RUN npm install -g nodemon

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
