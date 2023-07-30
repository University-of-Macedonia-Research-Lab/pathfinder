const path = require("path");
const dotenv = require("dotenv");
const { spawn } = require("child_process");

// Load environment variables from .env file
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

// Set the sequelize-typescript-generator command and arguments
const sequelizeTSCommand = "stg";
const sequelizeTSArgs = [
  "-D",
  "postgres",
  "-d",
  process.env.DB_NAME,
  "-u",
  process.env.DB_USERNAME,
  "-x",
  process.env.DB_PASSWORD,
  "-h",
  process.env.DB_HOST,
  "-p",
  process.env.DB_PORT,
  "-o",
  "./db/models",
];

// Spawn a new child process to run the sequelize-typescript-generator command
const childProcess = spawn(sequelizeTSCommand, sequelizeTSArgs, {
  stdio: "inherit", // Pipe the child process' stdio to the parent terminal
  shell: true, // Use a shell to run the command
  env: process.env, // Pass the current environment variables to the child process
});

// Handle any errors that occur during the child process execution
childProcess.on("error", (error) => {
  console.error(
    "Error occurred during sequelize-typescript-generator execution:",
    error.message
  );
  process.exit(1);
});

// Handle the completion of the child process
childProcess.on("close", (code) => {
  if (code === 0) {
    console.log(
      "sequelize-typescript-generator command completed successfully."
    );
    process.exit(0);
  } else {
    console.error(
      `sequelize-typescript-generator command exited with code ${code}.`
    );
    process.exit(1);
  }
});
