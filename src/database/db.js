const Neo4jDatabase = require("../../neo4j.js");
const Neo4jgraph = require("../Controllers/neo4jgraph.js");

const rules = new Neo4jDatabase(
  "bolt://localhost:7687/neo4j",
  "raj",
  "1234567890"
);

const db1 = new Neo4jgraph(
  "bolt://localhost:7687/",
  "neo4j",
  "1234567890",
  "neo4j"
);

const dbGraph = new Neo4jgraph(
  "bolt://localhost:7687",
  "neo4j",
  "123456789",
  ""
);
const productGraph = new Neo4jgraph(
  "neo4j://23.20.122.223:7687/",
  "neo4j",
  "123456789",
  ""
);

// const dbGraph = new Neo4jgraph(
//   "bolt://localhost:7687/walldatabase",
//   "neo4j",
//   "1234567890"
// );

module.exports = { db1, rules, dbGraph,productGraph };