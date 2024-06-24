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
    console.log(jsonData);
    const cornorkey = Object.keys(jsonData.floorplan.corners);
      
      jsonData.floorplan.corners[cornorkey[0]].x = 0;
      jsonData.floorplan.corners[cornorkey[0]].y = 0;
      jsonData.floorplan.corners[cornorkey[0]].elevation = height;
    
    
    jsonData.floorplan.corners[cornorkey[1]].x = 0;
    jsonData.floorplan.corners[cornorkey[1]].y = breadth;
    jsonData.floorplan.corners[cornorkey[1]].elevation = height;
    
    jsonData.floorplan.corners[cornorkey[2]].x = length;
    jsonData.floorplan.corners[cornorkey[2]].y = breadth;
    jsonData.floorplan.corners[cornorkey[2]].elevation = height;
    console.log(jsonData);

    jsonData.floorplan.corners[cornorkey[3]].x = length;
    jsonData.floorplan.corners[cornorkey[3]].y = 0;
    jsonData.floorplan.corners[cornorkey[3]].elevation = height;
    const roomkey = Object.keys(jsonData.floorplan.rooms);
    jsonData.floorplan.rooms[roomkey[0]].name = name;
    console.log(jsonData);

       fs.writeFileSync("input.json", JSON.stringify(jsonData));

      res.status(200).json({data:jsonData})
    } catch (err) {
      
      res.status(400).json({ data: err });
    }
  }
  
const addItems = async (req, res) => {
  const { itemtype, filepath } = req.body;
    try {
      const data = fs.readFileSync("input.json");
      const jsonData = JSON.parse(data.toString());
      console.log(jsonData)
      const items = jsonData["items"];
      items.forEach(item => {
        if (Number(item["item_type"]) == Number(itemtype)) item["model_url"] = filepath;
      });
      
      jsonData["items"] = items;
     
fs.writeFileSync("input.json", JSON.stringify(jsonData));
      res.status(200).json({ data: jsonData });
    } catch (err) {
    
    res.status(400).json({ data: err });
  }
}


const generatedData = async (req, res) => {
  const fileData = req.body;
  const data = fs.readFileSync("input.json");
  const jsonData = JSON.parse(data.toString());
  jsonData["vertices"] = fileData
  fs.writeFileSync("input.json", JSON.stringify(jsonData));
  try {
    
  const response= await  fetch("http://127.0.0.1:5000/process", {
      method: "POST", // Important: Set method to POST
      headers: {
        "Content-Type": "application/json", // Set content type for JSON data
      },
      body: JSON.stringify(jsonData), // Convert object to JSON string
    })
    const changeData =await response.json()// Parse response as JSON
    console.log(changeData);
    res.status(200).json(changeData)
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

