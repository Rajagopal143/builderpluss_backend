const neo4j = require("neo4j-driver");

class Neo4jDatabase {
  constructor(url, username, password) {
    this.db = new neo4j.driver(url, neo4j.auth.basic(username, password));
  }

  async query(query) {
    const session = this.db.session();
    try {
      const result = await session.run(query);
      return result;
    } catch (e) {
      return e;
    } finally {
      session.close();
    }
  }
  async queryWithParams(query, params) {
    const session = this.db.session();
    try {
      const result = await session.run(query, params);
      return result;
    } finally {
      await session.close();
    }
  }
  async queryNodesByLabel(label) {
    const query = `MATCH (p:${label}) RETURN p`;
    const result = await this.query(query);
    const properties = [];
    await result.records.forEach((element) => {
      properties.push({
        id: element.get(0).identity.low,
        properties: element.get(0).properties,
      });
    });
    return properties;
  }

  async fetchNodes(query) {
    const result = await this.query(query);
    return result.records.map((record) => record.get("n"));
  }

  async close() {
    await this.driver.close();
  }


  async createRoomNode(label, properties) {
    const session = this.db.session();
     let mainNode;
    try {
      // Check if main node with roomtype exists
      const mainResult = await this.queryWithParams(
        `MATCH (main:${label} {roomType: $roomtype}) RETURN main LIMIT 1`,
        {
          roomtype: properties.Name,
        }
      );
      if (mainResult.records.length === 0) {
        // Main node does not exist, create it
        const createMainResult = await this.queryWithParams(
          `CREATE (main:${label} {roomType: $roomtype}) RETURN main`,
          {
            roomtype: properties.Name,
          }
        );

        mainNode = createMainResult.records[0].get(0).identity.low;
      } else {
        // Main node already exists
        mainNode = mainResult.records[0].get(0).identity.low;
      }
      return mainNode;
    } catch (e) {
      return e;
    } finally {
      await session.close();
    }
  }

  async deleteNode(id) {
    const session = this.db.session();
    try {
      const result = await session.run(`MATCH (n) WHERE ID(n) = $id DELETE n`, {
        id: parseInt(id),
      });
      return result;
    } catch (e) {
      return e;
    } finally {
      await session.close();
    }
  }

  async updateNode(id, properties) {
    const session = this.db.session();
    try {
      const result = await session.run(
        `MATCH (n) WHERE ID(n) = $id SET n = $properties RETURN n`,
        {
          id: parseInt(id),
          properties,
        }
      );
      return result.records[0].get("n").properties;
    } catch (e) {
      return e;
    } finally {
      await session.close();
    }
  }
  async createRelationship(startNodeId, endNodeId, type, properties) {
    const session = this.db.session();
    try {
      const query = `
              MATCH (source)
            WHERE ID(source) = $startId
            MATCH (target)
            WHERE ID(target) = $endId
            MERGE (source)-[rel:${type}]->(target)
            SET rel = $relationshipProperties
            RETURN rel
        `;
      const params = {
        startId: startNodeId,
        endId: endNodeId,
        relationshipProperties: properties,
      };
      return this.queryWithParams(query, params);
    } catch (e) {
      return e;
    } finally {
      await session.close();
    }
  }

  async queryNodeById(id) {
    const query = `MATCH (n) WHERE ID(n) = $id RETURN n`;
    const params = {
      id,
    };
    const result = await this.queryWithParams(query, params);
    return result.records[0].get(0);
  }
  async connectNodes(sourceId, targetIds, relationshipType) {
    const session = this.db.session();
    try {
      const query = `
      MATCH (source)
      WHERE ID(source) = $sourceId
      UNWIND $targetIds AS targetId
      MATCH (target)
      WHERE ID(target) = targetId
      MERGE (source)-[rel:${relationshipType}]->(target)
      RETURN source, rel, target
    `;

      const result = await session.run(query, {
        sourceId: Number(sourceId), // Convert to Neo4j integer
        targetIds: targetIds.map((id) => Number(id)), // Convert each target ID to Neo4j integer
        relationshipType,
      });

      return result.records.map((record) => ({
        source: record.get("source").properties,
        relationship: record.get("rel").properties,
        target: record.get("target").properties,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      session.close();
    }
  }
  async connectNodesLinear(nodeId, relationshipType, Noderelationship) {
    const session = this.db.session();
    try {
      const nodeIds = await this.getConnectedNodeIds(
        nodeId,
        Noderelationship,
        session
      );
      nodeIds.push(nodeIds[0]);
      const result = await session.writeTransaction((tx) =>
        tx.run(
          `
          UNWIND range(0, size($nodeIds) - 2) AS i
          MATCH (source)
          WHERE ID(source) = $nodeIds[i]
          MATCH (target)
          WHERE ID(target) = $nodeIds[i + 1]
          MERGE (source)-[rel:${relationshipType}]->(target)
          RETURN source, rel, target
          `,
          {
            nodeIds: nodeIds.map((id) => Number(id)),
          }
        )
      );
      return result;
    } catch (e) {
      return e;
    } finally {
      session.close();
    }
  }
  async getConnectedNodeIds(id, relationshipType) {
    const session = this.db.session();
    try {
      const result = await session.run(
        "MATCH (n)-[:" +
          relationshipType +
          "]->(connected) WHERE id(n) = $nodeId RETURN id(connected) AS connectedNodeId",
        {
          nodeId: Number(id),
        }
      );
      const connectedNodeIDs = result.records.map((record) =>
        record.get("connectedNodeId").toString()
      );
      return connectedNodeIDs;
    } catch (e) {
      return e;
    } finally {
      session.close();
    }
  }

  async createOrUpdateNodesAndRelation(mainLabel, nodesToUpdate) {
    const session = this.db.session();
    let mainNode;
    try {
      // Check if main node with roomtype exists
      const mainResult = await this.queryWithParams(
        `MATCH (main:room {roomType: $roomtype}) RETURN main LIMIT 1`,
        {
          roomtype: mainLabel,
        }
      );
      if (mainResult.records.length === 0) {
        // Main node does not exist, create it
        const createMainResult = await this.queryWithParams(
          `CREATE (main:room {roomType: $roomtype}) RETURN main`,
          {
            roomtype: mainLabel,
          }
        );

        mainNode = createMainResult.records[0].get(0).identity.low;
      } else {
        // Main node already exists
        mainNode = mainResult.records[0].get(0).identity.low;
      }
      //console.log(mainNode);
      const idCounts = {};
      for (const value of nodesToUpdate) {
        const properties = {
          x: value.x,
          y: value.y,
        };
        const label = "cornorNode";
        // Check if node already exists
        const checkResult = await session.run(
          `MATCH (node:${label}) WHERE node.x = $x AND node.y = $y RETURN node`,
          properties
        );

        if (checkResult.records.length === 0) {
          // Node does not exist, create it
          const createResult = await this.queryWithParams(
            `CREATE (node:${label} $properties) RETURN node`,
            {
              properties: properties,
            }
          );

          const newNode = createResult.records[0].get("node");

          // Create relationship between main node and new node
          const relationship = await this.createRelationship(
            Number(mainNode),
            Number(newNode.identity.low),
            "cornor",
            {}
          );
        } else {
          const cornorNodes = await this.query(
            `MATCH (main:${label}) WHERE ID(main) = ${
              checkResult.records[0].get(0).identity.low
            }
          MATCH (main)<-[:cornor]-(Room:room) WHERE ID(Room) <> ${mainNode}
          RETURN Room`
          );

          cornorNodes?.records.forEach((record) => {
            const id = record?.get(0)?.identity?.low;
            //console.log(id);
            if (idCounts[id]) {
              idCounts[id]++; // Increment count if ID exists
            } else {
              idCounts[id] = 1; // Initialize count to 1 if ID is new
            }
          });
          const idsMoreThanTwo = Object.entries(idCounts)
            .filter(([id, count]) => count >= 2)
            .map(([id]) => Number(id));
          idsMoreThanTwo.forEach(async function (id) {
            const result = await session.run(
              `
              MATCH (source)
            WHERE ID(source) = $startId
            MATCH (target)
            WHERE ID(target) = $endId
            MERGE (source)-[rel:adjacentRoom]->(target)
            SET rel = $relationshipProperties
            RETURN rel
        `,
              { startId: mainNode, endId: id, relationshipProperties: {} }
            );
          });
          // Node already exists, create relationship with main node
          const existingNode = checkResult.records;
          for (var node of existingNode) {
            const relationship = await this.createRelationship(
              Number(mainNode),
              Number(node.get(0).identity.low),
              "cornor",
              {}
            );
          }
        }
      }

      // Return the main node
    } catch (e) {
      //console.log(e);
    } finally {
      await session.close();
    }
    return mainNode;
  }
  async connectToAdjacentNodes() {
    
  }
}

module.exports = Neo4jDatabase;
