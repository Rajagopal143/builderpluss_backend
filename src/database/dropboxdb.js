const { Dropbox } = require("dropbox");
const fetch = require("node-fetch"); // required for Dropbox SDK to work in Node.js
const dotconfig = require("do")
// Initialize Dropbox
const dbx = new Dropbox({
  accessToken:
    process.env.DROPBOX-SECRET-KEY,
  fetch: fetch,
});

module.exports = dbx;
