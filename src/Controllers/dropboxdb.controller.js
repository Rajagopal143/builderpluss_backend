const { Dropbox } = require("dropbox");
const fs = require("fs");
const path = require("path");

require("dotenv").config();
const dbx = new Dropbox({
  accessToken:process.env.DROPBOX_SECRET_KEY,
});




const uploadFileToDropbox = async (req, res) => {
  const data = fs.readFileSync("floorplan.json");
  const jsonData = JSON.parse(data.toString());
  
  fs.writeFileSync("floorplan.json", JSON.stringify(jsonData));
  console.log(jsonData);
  console.log(process.env.DROPBOX_SECRET_KEY);
    
  };




// Example usage: Upload a sample file
module.exports = {
    uploadFileToDropbox
}

