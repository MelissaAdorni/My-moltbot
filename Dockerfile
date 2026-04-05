FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# (This assumes you have a package.json, if not, we can create one next)
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose the port Render is looking for
EXPOSE 8080

# Start the bot
CMD [ "node", "index.js" ]
