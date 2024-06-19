

const express = require("express");
const cors = require('cors');
const nodeRouter = require("./src/Routes/neo4j.Routes");
const compareRouter = require("./src/Routes/compare.Routes");
const ProductRouter = require("./src/Routes/Products.Route.js");
const { BoardRouter } = require("./src/Routes/board.Route.js");
const { bpfileRouter } = require("./src/Routes/blueprintfile.route.js");
const router = require("./src/Routes/neo4j.Routes");
const app = express();
const PORT = 4000;

require("dotenv").config();




app.use(express.json());
// app.use(dotenv());

//connect to neo4jDatabase
app.get("/", (req, res) => {
  res.send("wellcome to Builderpluss software")
})

app.use(cors());
// app.use("/", nodeRouter);
app.use("/api/product/", ProductRouter);
app.use("/api/bpfile/", bpfileRouter);
app.use('/api/board',BoardRouter)
app.use("/compare", compareRouter)
app.use(router)

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





