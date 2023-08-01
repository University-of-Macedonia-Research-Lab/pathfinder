const path = require("path");
const dotenv = require("dotenv");
const { spawn } = require("child_process");
const fs = require("fs"); // You need to import 'fs' for checking if patch.js file exists

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

    // Path to your patch file
    const patchFilePath = path.resolve(__dirname, "./patch.js");

    // Check if patch file exists
    if (fs.existsSync(patchFilePath)) {
      // Spawn a new child process to run the patch.js file
      const patchProcess = spawn("node", [patchFilePath], {
        stdio: "inherit",
        shell: true,
        env: process.env,
      });

      patchProcess.on("error", (error) => {
        console.error("Error occurred during patch execution:", error.message);
        process.exit(1);
      });

      patchProcess.on("close", (code) => {
        if (code === 0) {
          console.log("Patch script executed successfully.");
          process.exit(0);
        } else {
          console.error(`Patch script exited with code ${code}.`);
          process.exit(1);
        }
      });
    } else {
      console.error(`Patch file does not exist at ${patchFilePath}.`);
      process.exit(1);
    }
  } else {
    console.error(
      `sequelize-typescript-generator command exited with code ${code}.`
    );
    process.exit(1);
  }
});
