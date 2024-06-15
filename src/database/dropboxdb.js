const { Dropbox } = require("dropbox");
const fetch = require("isomorphic-unfetch");// Initialize Dropbox
const dbx = new Dropbox({
  accessToken:process.env.DROPBOX_SECRET_KEY,
});

module.exports = dbx;
