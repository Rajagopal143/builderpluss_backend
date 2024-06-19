const express = require("express");
const {
  generatedData,
  getBlueprintfile,
  changeRoomValues,
  addItems,
} = require("../Controllers/dropboxdb.controller");

const bpfileRouter = express.Router();

bpfileRouter.post("/modifyroom", changeRoomValues);
bpfileRouter.post("/generate", generatedData);
bpfileRouter.post("/additems", addItems);
bpfileRouter.get("/", getBlueprintfile);

module.exports = { bpfileRouter };
