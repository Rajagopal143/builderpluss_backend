const express = require("express");
const { db1, dbGraph, productGraph } = require("../database/db");
const compareGraph = require("../middelwares/Compare.Middelware");

const router = express.Router();
const xlsx = require("xlsx");
const Neo4jDatabase = require("../../neo4j");
// // Create Node
router.post("/api/node", async (req, res) => {
  const { label, properties, message } = req.body;
  const node = await dbGraph.createRoomNode(label, properties);
  return res.json({
    warning: message,
    node,
  });
});

// // Read Node
router.get("/api/node/:id", async (req, res) => {
  const { id } = req.params;

  const result = await dbGraph.queryNodeById(Number(id));

  res.json(result);
});

// // Update Node
router.put("/api/node/:id", async (req, res) => {
  const { id } = req.params;
  const { properties } = req.body;

  const node = await dbGraph.updateNode(id, properties);
  res.json(node.properties);
});

// // Delete Node
router.delete("/api/node/:id", async (req, res) => {
  const { id } = req.params;
  const result = await dbGraph.deleteNode(id);
  res.json({
    message: "Node deleted",
    result: id,
  });
});

// // Add Relationship
router.post("/api/relationship", async (req, res) => {
  const { startNodeId, endNodeId, type, properties } = req.body;
  const result = await dbGraph.createRelationship(
    parseInt(startNodeId),
    parseInt(endNodeId),
    type,
    properties
  );
  res.json(result.records[0].get(0));
});

// //Return the connected nodes
router.post("/api/mainNode", async (req, res) => {
  const result = await dbGraph.connectNodes(
    req.body.startNode,
    req.body.endNodes,
    req.body.relationship
  );
  res.json(result);
});

// //to connect Multiple Nodes
router.post("/api/conectNode", async (req, res) => {
  const result = await dbGraph.connectNodesLinear(
    req.body.nodes,
    req.body.relationship,
    req.body.Noderelationship
  );
  res.json(result);
});

router.get("/", async (req, res) => {
  const result = await dbGraph.query(`MATCH (n) RETURN n LIMIT 25`);
  res.json(result);
});

router.post("/api/createRoom", async (req, res) => {
  const { nodeName, values } = req.body;
  const result = await dbGraph.createOrUpdateNodesAndRelation(nodeName, values);
  res.json({
    message: result,
  });
});

router.get("/api/getAjacentNodes", async function (req, res) {
  const { nodeType } = req.body;
  const result = await dbGraph.queryWithParams(
    `MATCH (:room {roomType:$nodeType})-[:cornor]->(cornorNode)<-[:cornor]-(room:room) RETURN room`,
    {
      nodeType: nodeType,
    }
  );
  const uniqueArray = Array.from(
    new Set(result.records.map(JSON.stringify))
  ).map(JSON.parse);

  res.json({
    node: uniqueArray,
  });
});

router.get("/api/listRoom", async function (req, res) {
  const result = await dbGraph.query(`MATCH (n:room) RETURN n LIMIT 25`);
  const room = result.records.map((room) => room.get(0).properties.roomType);
  res.json(room);
});

module.exports = router;

async function createMultipleNodes(
  propertiesArray,
  mainNodeId,
  label,
  connection
) {
  const relationships = [];

  for (const properties in propertiesArray) {
    //console.log("hi", properties);
    const { start, end } = properties;

    // Check if the node already exists
    const result = await dbGraph.queryWithParams(
      `MATCH (node:${label} { startx: $endx, starty: $endy, endx: $startx, endy: $starty }) RETURN node`,
      {
        startx: Math.floor(start.x),
        starty: Math.floor(start.y),
        endx: Math.floor(end.x),
        endy: Math.floor(end.y),
      }
    );
    //console.log(result?.records[0]?.get(0)?.identity?.low);

    let nodeId;

    if (result.records.length === 0) {
      // Node does not exist, create it
      const createResult = await dbGraph.queryWithParams(
        `CREATE (n:${label} { startx: $startx, starty: $starty, endx: $endx, endy: $endy }) RETURN n`,
        {
          startx: Math.floor(start.x),
          starty: Math.floor(start.y),
          endx: Math.floor(end.x),
          endy: Math.floor(end.y),
        }
      );

      nodeId = createResult.records[0].get(0).identity.low;
    } else {
      // Node already exists
      nodeId = result.records[0].get(0).identity.low;
    }
    // Create relationship between main node and created/already existing node
    const relationship = await dbGraph.createRelationship(
      mainNodeId,
      nodeId,
      connection,
      {}
    );

    relationships.push(relationship);
  }

  return relationships;
}

async function createMultipleOpenings(values, mainNodeId, label, connection) {
  const relationships = [];

  for (const properties of values) {
    // Check if the node already exists
    const result = await dbGraph.queryWithParams(
      `MATCH (node:${label}) WHERE node.elementId = $elementId RETURN node`,
      { elementId: properties }
    );

    let elementNode;

    if (result.records.length === 0) {
      // Node does not exist, create it
      const createResult = await dbGraph.queryWithParams(
        `CREATE (main:${label} {elementId: $elementId}) RETURN main `,
        { elementId: properties }
      );

      elementNode = createResult?.records[0].get(0)?.identity?.low;
    } else {
      // Node already exists
      elementNode = result?.records[0].get(0)?.identity?.low;
    }

    // Create relationship between main node and created/already existing node
    const relationship = await dbGraph.createRelationship(
      mainNodeId,
      elementNode,
      connection,
      {}
    );

    relationships.push(relationship);
  }

  return relationships;
}

router.post("/api/architect", async function (req, res) {
  if (Object.keys(req.body).length ==0 ) {
    return res.status(400).json({ error: "data Not found" });
  }
  const data = req.body;
  const rooms = data.floorplan.rooms;
  const walls = data.floorplan.walls;
  const cornors = data.floorplan.corners;
  try {
    // for (let wall of walls) {
    // //console.log(wall.corner1);
    //       const cornor1 = {
    //           x: cornors[wall.corner1].x,
    //           y: cornors[wall.corner1].y,
    //         };

    //         const cornor2 = {
    //             x: cornors[wall.corner2].x,
    //             y: cornors[wall.corner2].y,
    //           };
    //           const wallNode = await dbGraph.createNode("Wall", {
    //               id1: wall.corner1,
    //               id2: wall.corner2,
    //               startX: cornor1.x,
    //               startY: cornor1.y,
    //               endX: cornor2.x,
    //               endY: cornor2.y,
    //               wallType: wall.wallType,
    //               lenght:wall.length
    //             });
    // //console.log(wallNode);
    //         }
    // //console.log(data);

    for (let room in rooms) {
      if (rooms.hasOwnProperty(room)) {
        const roomNode = await dbGraph.createRoom("room", rooms[room]);
        // //console.log(room + ": " + rooms[room].name);
        const roomcornors = room.split(",");
        const length = roomcornors.length;
        console.log(roomNode)
        walls.forEach(async (wall, index) => {
          if (
            roomcornors.includes(wall.corner1) &&
            roomcornors.includes(wall.corner2)
          ) {
            const wallNode = await dbGraph.createWall("Wall", {
              id1: wall.corner1,
              id2: wall.corner2,
              startX: cornors[wall.corner1].x,
              startY: cornors[wall.corner1].y,
              endX: cornors[wall.corner2].x,
              endY: cornors[wall.corner2].y,
              wallType: wall.wallType,
              lenght: wall.length,
            });
            //console.log(wallNode);
            const relation = await dbGraph.connectRoomToOther(
              wallNode,
              roomNode,
              "ifc_wall"
            );
          }
        });
      }
    }
    res.json({ message: "success" });
  } catch (e) {
    //console.log(e);
    res.status(400).json({error:e})
  } 
});

router.post("/api/graph", async function (req, res) {
  const roomArray = req.body.data;
  try {
    roomArray.forEach(async function (room, index) {
      const roomNode = await dbGraph.createRoomNode("room", {
        Name: room.Name,
      });
      const wallNode = await createMultipleNodes(
        room.wall,
        roomNode,
        "Ifc_wall",
        "wall"
      );
      if (room.openingsId.length > 0) {
        const openingsNode = createMultipleOpenings(
          room.openingsId,
          roomNode,
          "Ifc_openings",
          "openings"
        );
      }
    });
  } catch (e) {
    return //console.log(e);
  } finally {
    res.json({
      message: "success",
    });
  }
});
router.get('/allNodes', async (req, res) => {
  try {
    const data = await dbGraph.allProducts();
    res.status(300).json(data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
})

router.post("/api/twodGraph", async function (req, res) {
  const rooms = req.body;
  if (rooms.length === 0) {
    return res.json({ message: "Room shouldn't be Empty" });
  }
  try {
    for (const room of rooms) {
      const roomNode = await dbGraph.createNode("room", {
        roomType: room.name,
      });
      for (const cornor of room.cornors) {
        const cornorNode = await dbGraph.createNode("cornor", { ...cornor });
        const relation = await dbGraph.createRelationship(
          roomNode,
          cornorNode,
          "cornor",
          {}
        );
      }
    }
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
  res.status(200).json({ message: "Graph Updated Successfully" });
});

router.delete("/api/twodGraph/delete", async function (req, res) {
  try {
    const result = await dbGraph.query("MATCH (n) DETACH DELETE n");
    res.json({
      message: "All Nodes deleted",
    });
  } catch (e) {
    //console.log(e);
    return res.status(400).json({ message: e.message });
  }
});

router.get("/api/getgraph", async function (req, res) {
  const roomlist = await dbGraph.queryNodesByLabel("room");
  const walls = await dbGraph.queryNodesByLabel("Wall");
  const data = [];
  for (let room of roomlist) {
    const roomData = {};
    Object.keys(room.properties).forEach((key) => {
      roomData[key] = room.properties[key];
    });
    roomData["Walls"] = await dbGraph.getWallByRoomId(room.id);
    roomData["ExposedWall"] = await dbGraph.queryExposedWall(room.id);
    roomData["SharedWalls"] = await dbGraph.querySharedWall(room.id);
    data.push(roomData);
  }
  // const walldata=[]
  // for (let wall of walls) {
  //   const { id, properties } = wall;
  //   const wallObject = {};
  //   wallObject['id'] = id;
  //   wallObject["length"] = properties.length;
  //   wallObject['vertices'] = [
  //     {"x":properties.x1,"y":properties.y1},
  //     {"x":properties.x2,"y":properties.y2},
  //     {"x":properties.x3,"y":properties.y3},
  //     {"x":properties.x4,"y":properties.y4}
  //   ]
  //   walldata.push(wallObject);
  // }
  // data.push({AllWalls:walldata})
  res.status(200).json(data);
});

router.post("/api/product", async function (req, res) {
  const data = req.body;
  //console.log(data);
  try {
    const productQuery =
      "CREATE (p:Product {name:$name,price:$price,description:$discription,itemImage:$itemImage,packof1Sheet:$packof1Sheet})";
    const productDetails = {
      name: data.ProductName,
      price: data.price,
      discription: data.description,
      itemImage: data.itemImage,
      packof1Sheet: data.packOf1Sheet,
    };
    const productNode = await productGraph.createNode(
      "product",
      productDetails
    );
    //console.log("product NOde id", productNode);
    Object.keys(data).forEach(async (key) => {
      if (
        key != "ProductName" &&
        key != "price" &&
        key != "discription" &&
        key != "itemImage" &&
        key != "packOf1Sheet"
      ) {
        const node = await productGraph.createNode(key, { [key]: data[key] });
        const relation = await productGraph.createMultipleRelation(
          node,
          productNode,
          key
        );
      }
    });
  } catch (e) {
    // //console.log(e)
    res.status(400).json({ e: e });
  }
  res.send("updated");
});

router.post("/api/productoroom", async function (req, res) {
  const { roomName, products } = req.body;

  try {
  const roomNode = await dbGraph.getRoomByName(roomName);
    console.log(roomNode)
    if (roomNode) {
      products.forEach(async(product) => {
        const newProduct = await dbGraph.createNode("product", product)
        const relation = await dbGraph.connectRoomToOther(newProduct, roomNode, "has_product");
        console.log(relation)
      })
    }
      
    res.status(200).json({ message: relation });
  } catch (err) {
    res.status(400).json({ err: err });
  }
})