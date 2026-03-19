const hre = require("hardhat");
const fs = require("fs");

async function run() {
  try {
    await hre.run("compile");
    console.log("Done");
  } catch (err) {
    fs.writeFileSync("error.log", err.message + "\n\n" + err.stack);
  }
}
run();
