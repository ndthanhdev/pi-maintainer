import yargs from "yargs";

const argv = yargs.option("env", {
  type: "string",
  default: undefined
}).argv;
require("dotenv").config({ path: argv.env });
