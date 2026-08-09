const fs = require("fs");
const path = require("path");

const outputDirectory = path.resolve(__dirname, "../../web-dist");

if (path.basename(outputDirectory) !== "web-dist") {
  throw new Error(`Refusing to clean unexpected output directory: ${outputDirectory}`);
}

fs.rmSync(outputDirectory, {
  recursive: true,
  force: true,
});
