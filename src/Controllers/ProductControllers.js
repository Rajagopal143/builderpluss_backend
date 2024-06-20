const { productGraph } = require("../database/db.js");
const csv = require("csv-parser");
const fs = require("fs");
const xlsx = require("xlsx");
const { uploadFileToDropbox } = require("./dropboxdb.controller.js");

const csvUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
    

  const filePath = req.file.path;
  // //console.log(data);
  try {
    //console.log(req.file);
    await createProduct(filePath);

    res.status(200).json({ message: "CSV Uploaded Successfully " });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const createProduct = async (filePath) => {
  const csvData = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", async (row) => {
      // Define the Cypher query for each row
      if (row.No === "") {
        return;
      }
      if (row.Name === "Name") {
        return;
      }

      csvData.push(row);
    })
    .on("end", async () => {
      //console.log("CSV file successfully processed");
      fs.unlinkSync(filePath);
      const data = csvData.filter(
        (obj, index, self) => index === self.findIndex((o) => o.No === obj.No)
      );

      for (let row of csvData) {
        if (row.No != "") {
          const productParams = {
            No: row.No,
            name: row.Name,
            description: row.Description,
            itemImage: row["Item image"],
            packOf1Sheet: row["Pack of�1�Sheet"],
            price: row.Price,
          };

          const productResult = await productGraph.createNode(
            "Product",
            productParams
          );

          for (const [key, value] of Object.entries(row)) {
            if (
              ![
                "No",
                "Name",
                "Description",
                "Item image",
                "Pack of 1 Sheet",
                "Price",
              ].includes(key) &&
              value.length !== 0
            ) {
              const checkAttributes = await productGraph.createNode(
                "attributes",
                {
                  key: key,
                  value: value,
                }
              );
              const relationship = `has_${key.replace(/\s+/g, "")}`;
              const relation = await productGraph.connectRoomToCornor(
                checkAttributes,
                productResult,
                relationship
              );
              //console.log(relation);
            }
          }
        }
      }
    });
};

const ValueForFilter = async (req, res) => {
  console.log("hi");
  try {
    const need = [
      "Color",
      "Design",
      "Finish",
      "Width",
      "Project Type",
      "Length",
      "Look",
      "catgorey",
    ];
    const data = {};
    for (let attribute of need) {
      const query = `MATCH (a:attributes {key:"${attribute}"}) RETURN properties(a) AS props`;
      const values = await productGraph.query(query);
      data[attribute] = [];
      values.records.forEach((record) => {
        data[attribute].push(record.get("props").value);
      });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const filter = async (req, res) => {
  const filter = req.body;
  //console.log(req.body);
  const data = [];
  const filterKeys = Object.keys(filter);
  // for (let key of filterKeys) {
  //     for (let value of filter[key]) {

  //     }
  // }
  let query = "MATCH (p:Product)";
  const params = {};
  query += ` WHERE `;

  // Construct WHERE clauses based on the provided attributes
  Object.keys(filter).forEach((key, index) => {
    if (filter[key].length > 0) {
      const values = filter[key];

      values.forEach((value, i) => {
        query += `(p)-[:has_${key}]->(:attributes {key: '${key}', value: '${value}'})`;
        if (i < values.length - 1) query += ` OR `;
      });

      if (index < Object.keys(filter).length - 1) query += ` AND `;
    }
  });
  query += " RETURN p";
  try {
    const result = await productGraph.query(query);
    //console.log(result);
    result.records.forEach((record) => data.push(record.get("p").properties));
    res.status(200).json(data);
  } catch (err) {
    //console.log(err);
    res.status(404).json({ message: err.message });
  }
};

const allProducts = async (req, res) => {
  const data = [];
  try {
    const query = "MATCH (p:Product) RETURN p";
    const result = await productGraph.query(query);
    await result.records.forEach((record) => {
      data.push(record.get("p").properties);
    });
    console.log(data);
    res.status(200).json(data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

module.exports = {
  csvUpload,
  ValueForFilter,
  filter,
  allProducts,
};
