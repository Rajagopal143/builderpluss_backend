// app.js
const express = require("express");
const Neo4jDatabase = require("./neo4j");
const cors = require('cors');
const nodeRouter = require("./src/Routes/neo4j.Routes");
const compareRouter = require("./src/Routes/compare.Routes");
const bodyParser =require("body-parser");
const ProductRouter = require("./src/Routes/Products.Route.js");
const { BoardRouter } = require("./src/Routes/board.Route.js");
const app = express();
const PORT = 4000;

const dotenv = require("dotenv");


app.use(express.json());

//connect to neo4jDatabase


app.use(cors());
app.use("/", nodeRouter);
app.use("/api/product/", ProductRouter);
app.use('/api/board',BoardRouter)
app.use("/compare",compareRouter)

// Increase the limit for JSON requests



// app.get("/api/getConnectNodeIds", async (req, res) => { 
//   const result = await getConnectedNodeIdsByLabel(req.body.nodeId, req.body.relationship);
//   res.send(result);
// });




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// process.on("SIGINT", () => {
//   session.close();
//   driver.close();
//   process.exit();
// });





