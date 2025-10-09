# Step 1: Use Node.js as base image
FROM node:20-alpine

# Step 2: Set working directory
WORKDIR /usr/src/app

# Step 3: Copy package files
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy source code
COPY . .

# Step 6: Build NestJS app
RUN npm run build

# Step 7: Expose port
EXPOSE 3000

# Step 8: Start app
CMD ["npm", "run", "start:prod"]
