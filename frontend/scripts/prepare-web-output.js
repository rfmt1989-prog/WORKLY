const fs = require("fs");
const path = require("path");

const publicDirectory = path.resolve(__dirname, "../../public");

if (path.basename(publicDirectory) !== "public") {
  throw new Error(`Refusing to clean unexpected output directory: ${publicDirectory}`);
}

for (const generatedDirectory of ["_expo", "assets", "assets-static"]) {
  fs.rmSync(path.join(publicDirectory, generatedDirectory), {
    recursive: true,
    force: true,
  });
}
