const express = require("express");
const {  uploadFileToDropbox } = require("../Controllers/dropboxdb.controller");

const bpfileRouter = express.Router();

bpfileRouter.post("/", uploadFileToDropbox);

module.exports = { bpfileRouter };
