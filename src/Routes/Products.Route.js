const express = require("express");

const multer = require("multer");

const {
  csvUpload,
  ValueForFilter,
  filter,
  allProducts,
} = require("../Controllers/ProductControllers.js");

const ProductRouter = express.Router();


const upload = multer({ dest: "uploads/" }); // Set the upload destination
ProductRouter.post("/csvUpload", upload.single("file"), csvUpload);
ProductRouter.get("/Showfilter",ValueForFilter)
ProductRouter.post("/filter",filter)
ProductRouter.get("/allProducts", allProducts);


module.exports= ProductRouter;