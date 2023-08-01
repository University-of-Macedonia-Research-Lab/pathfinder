const fs = require("fs");
const path = require("path");

// Define the path to the directory containing the models
const modelsDirectory = path.join(__dirname, "./models");

// Read all the files in the directory
fs.readdir(modelsDirectory, (err, files) => {
  if (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }

  files.forEach((file, index) => {
    // Define the path to the file
    const filePath = path.join(modelsDirectory, file);

    // Read the file
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error(`Could not read file ${file}.`, err);
        process.exit(1);
      }

      // Replace the id column definition
      let result = data.replace(
        /@Column\(\{\s*primaryKey: true,\s*type: DataType.UUID\s*\}\)\s*id!: string;/g,
        "@Column({\n  primaryKey: true,\n  type: DataType.UUID,\n  defaultValue: DataType.UUIDV4,\n})\nid!: string;"
      );

      // Make the id optional in the interfaces
      result = result.replace(/id: string;/g, "id?: string;");

      // Write the new data back to the file
      fs.writeFile(filePath, result, "utf8", (err) => {
        if (err) {
          console.error(`Could not write file ${file}.`, err);
          process.exit(1);
        }
      });
    });
  });
});
