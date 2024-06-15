const { Dropbox } = require("dropbox");
const fs = require("fs");
const path = require("path");

require("dotenv").config();
const dbx = new Dropbox({
  accessToken:process.env.DROPBOX_SECRET_KEY,
});
const uploadFileToDropbox = async (req, res) => {
  console.log(process.env.DROPBOX_SECRET_KEY);
      if (req.method === "POST") {
        const  fileContent  = req.body;

        try {
          // Step 1: Upload the file to Dropbox
          const response = await dbx.filesUpload({
            path: `/bp3dfiles/design.blueprint3d`,
            contents: JSON.stringify(fileContent),
            mode: "overwrite", // 'add' to create new file, 'overwrite' to replace existing file
          });
          const url = await dbx.filesGetTemporaryLink({
            path: "/bp3dfiles/design.blueprint3d",
          });

          res
            .status(200)
            .json({ message: "File uploaded successfully", data: url });
        } catch (error) {
          console.error("Error uploading to Dropbox:", error);
          res.status(500).json({ error: "Error uploading to Dropbox" });
        }
      } else {
        res.status(405).json({ error: "Method not allowed" });
      }
  };


// Example usage: Upload a sample file
module.exports = {
    uploadFileToDropbox
}

