const express = require("express");
const { getBoards } = require("../Controllers/boardController");

const BoardRouter = express.Router();

BoardRouter.get('/', getBoards)


module.exports = { BoardRouter };