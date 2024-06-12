const fs = require("fs");
const path = require("path");
const dbx = require("../database/dropboxdb");

const uploadFileToDropbox = async (filePath) => {
  try {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    const response = await dbx.filesUpload({
      path: "/" + fileName+'.csv',
      contents: fileContent,
    });

    //console.log("File uploaded to Dropbox:", response);
  } catch (error) {
    console.error("Error uploading file:", error);
    }
    
};

// Example usage: Upload a sample file
module.exports = {
    uploadFileToDropbox
}

