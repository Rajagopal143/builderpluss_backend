const { Dropbox } = require("dropbox");
const fs = require("fs");
const path = require("path");

require("dotenv").config();
const dbx = new Dropbox({
  accessToken:process.env.DROPBOX_SECRET_KEY,
});

const getBlueprintfile = async (req, res) => {
  try {
    
    const data = fs.readFileSync("input.json");
    const jsonData = JSON.parse(data.toString());
    res.status(200).json({ data: jsonData });
  } catch (err) {
    res.status(400).json({ data: err });
  }
  
}

const changeRoomValues = async (req, res) => {
  const { name, length, breadth, height } = req.body;
  console.log(name)
  try {
    const data = fs.readFileSync("input.json");
    const jsonData = JSON.parse(data.toString());
    jsonData.floorplan.corners["71d4f128-ae80-3d58-9bd2-711c6ce6cdf2"].x = 0;
    jsonData.floorplan.corners["71d4f128-ae80-3d58-9bd2-711c6ce6cdf2"].y = 0;
    jsonData.floorplan.corners[
      "71d4f128-ae80-3d58-9bd2-711c6ce6cdf2"
    ].elevation = height;
    
    jsonData.floorplan.corners["f90da5e3-9e0e-eba7-173d-eb0b071e838e"].x = 0;
    jsonData.floorplan.corners["f90da5e3-9e0e-eba7-173d-eb0b071e838e"].y = length;
    jsonData.floorplan.corners[
      "f90da5e3-9e0e-eba7-173d-eb0b071e838e"
    ].elevation = height;
    
    jsonData.floorplan.corners["2df5a92c-732d-41c5-13ec-db668de5bcc3"].x = breadth;
    jsonData.floorplan.corners["2df5a92c-732d-41c5-13ec-db668de5bcc3"].y = length;
    jsonData.floorplan.corners[
      "2df5a92c-732d-41c5-13ec-db668de5bcc3"
    ].elevation = height;
    console.log(jsonData);

    jsonData.floorplan.corners["e11266bf-ab69-4fb4-5372-2b5cfed8d4be"].x = breadth;
    jsonData.floorplan.corners["e11266bf-ab69-4fb4-5372-2b5cfed8d4be"].y = 0;
    jsonData.floorplan.corners[
      "e11266bf-ab69-4fb4-5372-2b5cfed8d4be"
    ].elevation = height;
    jsonData.floorplan.rooms[
      "71d4f128-ae80-3d58-9bd2-711c6ce6cdf2,e11266bf-ab69-4fb4-5372-2b5cfed8d4be,2df5a92c-732d-41c5-13ec-db668de5bcc3,f90da5e3-9e0e-eba7-173d-eb0b071e838e"
    ].name = name;
    console.log(jsonData);

       fs.writeFileSync("input.json", JSON.stringify(jsonData));

      res.status(200).json({data:jsonData})
    } catch (err) {
      
      res.status(400).json({ data: err });
    }
  }
  
const addItems =async (req, res) => {
  const { itemtype, filepath } = req.body;
    try {
      const data = fs.readFileSync("input.json");
      const jsonData = JSON.parse(data.toString());
      const items = jsonData.items;
      items.forEach(item => {
        if (Number(item["item_type"]) == Number(itemtype)) item["model_url"] = filepath;
      });

      jsonData.floorplan["items"] = items;
     
fs.writeFileSync("input.json", JSON.stringify(jsonData));
      res.status(200).json({ data: jsonData });
    } catch (err) {
    
    res.status(400).json({ data: err });
  }
}


const generatedData = async (req, res) => {
  const data = fs.readFileSync("input.json");
  const jsonData = JSON.parse(data.toString());
  try {
    
    fetch("http://127.0.0.1:5000/process", {
      method: "POST", // Important: Set method to POST
      headers: {
        "Content-Type": "application/json", // Set content type for JSON data
      },
      body: JSON.stringify(jsonData), // Convert object to JSON string
    })
    .then((response) => response.json()) // Parse response as JSON
    .then((data) => {
      res.status(200).json(data)
      return data
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  } catch (err) {
    res.status(400).json({error:err})
  }



    
  };




// Example usage: Upload a sample file
module.exports = {
  generatedData,
  getBlueprintfile,
  changeRoomValues,
  addItems,
};

