const neo4j = require("neo4j-driver");

class Neo4jgraph {
  constructor(url, username, password, dbName) {
    this.db = new neo4j.driver(url, neo4j.auth.basic(username, password));
    this.databaseName = dbName;
  }
  async query(query) {
    const session = this.db.session({ database: this.databaseName });
    try {
      const result = await session.run(query);
      return result;
    } catch (e) {
      return e;
    } finally {
      session.close();
    }
  }
  async queryNodesByLabel(label) {
    const query = `MATCH (p:${label}) RETURN p`;
    const result = await this.query(query);
    const properties = [];
    if (result?.records?.length != 0) {
      await result.records.forEach((element) => {
        properties.push({
          id: element.get(0).identity.low,
          properties: element.get(0).properties,
        });
      });
    }
    return properties;
  }
  async getRoomByName(roomName) {
    try {
      const result = await this.queryWithParams(
        "MATCH (room:room {name: $name}) RETURN room",
        { name: roomName }
      );

      if (result.records.length === 0) {
        return null; // No room found
      }

      // Assuming there is only one room with the given name
      const room = result?.records[0].get("room").identity?.low;
      return room;
    } catch (error) {
      console.error("Error querying room by name:", error);
      throw error;
    }
  }
  async allProducts() {
    const data = [];
    try {
      const query = "MATCH (p:Product) RETURN p";
      const result = await this.query(query);
      //console.log(result);
      await result.records.forEach((record) => {
        data.push(record.get("p").properties);
      });
      //console.log(data);
      return data;
    } catch (err) {
      return err;
    }
  }
  async getConnectedProducts(roomid) {
    const data = [];
    try {
      const query = `MATCH (r:room)-[:has_product]->(p:product)
      WHERE id(r) = ${roomid}
      RETURN r, collect(p) as products`;
      const result = await this.query(query);
      if (result.records.length === 0) {
        return null; // No room found
      }

      const record = result.records[0];
      const room = record.get("r").properties;
      console.log(room);
      const products = record
        .get("products")
        .map((product) => product.properties);

      //console.log(data);
      return products;
    } catch (err) {
      return err;
    }
  }

  async getProductByType() {
    const laminates = [];
    const tiles = [];
    const wallpaper = [];
    try {
      const onWallquery = `MATCH (p:Product)-[:has_catgorey]->(a:attributes)
WHERE a.value = 'laminates'
RETURN p`;
      let result = await this.query(onWallquery);
      console.log(result);
      await result.records.forEach((record) => {
        laminates.push(record.get("p").properties);
      });
      const onfloorquery = `MATCH (p:Product)-[:has_catgorey]->(a:attributes)
      WHERE a.value = 'tiles'
      RETURN p`;
      let result1 = await this.query(onfloorquery);
      await result1.records.forEach((record) => {
        tiles.push(record.get("p").properties);
      });
      const onwallpaperquery = `MATCH (p:Product)-[:has_catgorey]->(a:attributes)
      WHERE a.value = 'wallpaper'
      RETURN p`;
      let result2 = await this.query(onwallpaperquery);
      await result2.records.forEach((record) => {
        wallpaper.push(record.get("p").properties);
      });
      const data = { laminates: laminates, wallpaper: wallpaper, tiles: tiles };
      return data;
    } catch (err) {
      return err;
    }
  }
  async queryWithParams(query, params) {
    const session = this.db.session({ database: this.databaseName });
    try {
      const result = await session.run(query, params);
      return result;
    } finally {
      await session.close();
    }
  }
  async createNode(label, properties) {
    const session = this.db.session({ database: this.databaseName });
    let mainNode;
    try {
      // Check if main node with roomtype exists
      const query = `
            MATCH (n:${label})
            WHERE ${Object.keys(properties)
              .map((key) => `n.\`${key}\` = "${properties[key]}"`)
              .join(" AND ")}
            RETURN n
        `;
      const mainResult = await this.query(query, properties);

      if (mainResult?.records?.length === 0) {
        // Main node does not exist, create it
        const createMainResult = await this.queryWithParams(
          `CREATE (n:${label} {${Object.keys(properties)
            .map((key) => `\`${key}\` :"${properties[key]}"`)
            .join(" ,")}})
            RETURN n`,
          properties
        );

        mainNode = createMainResult?.records[0].get("n").identity?.low;
      } else {
        // Main node already exists
        mainNode = mainResult?.records[0]?.get(0).identity?.low;
      }
      return mainNode;
    } catch (e) {
      return e;
    } finally {
      await session.close();
    }
  }
  async createRoom(label, properties) {
    console.log(properties);
    const session = this.db.session({ database: this.databaseName });
    let mainNode;
    try {
      // Check if main node with roomtype exists
      const query = `
            MATCH (n:${label} { name:"${properties.name}"})
            RETURN n
        `;
      const mainResult = await this.query(query, properties);

      if (mainResult?.records?.length === 0) {
        // Main node does not exist, create it
        const createMainResult = await this.queryWithParams(
          `CREATE (n:${label} {${Object.keys(properties)
            .map((key) => `\`${key}\` :"${properties[key]}"`)
            .join(" ,")}})
            RETURN n`,
          properties
        );

        mainNode = createMainResult?.records[0].get("n").identity?.low;
      } else {
        // Main node already exists
        const updateQuery = `
        MATCH (n:${label} { name: $name })
        SET n = $properties
        RETURN n
      `;

        const updateMainResult = await this.queryWithParams(updateQuery, {
          name: properties.name,
          properties,
        });
        console.log(updateMainResult);

        mainNode = updateMainResult.records[0].get("n").identity.low;
        console.log(properties, mainNode);
      }
      return mainNode;
    } catch (e) {
      return e;
    } finally {
      await session.close();
    }
  }
  async getProductbyRoomId() {}
  async connectRoomToOther(cornorNode, roomId, relationship) {
    try {
      var relation = null;
      relation = await this.query(`
        MATCH (a),(b)
        WHERE ID(a) = ${roomId} AND ID(b) = ${cornorNode}
        MERGE  (a)-[:${relationship}]->(b)
        RETURN a, b
        `);
      // //console.log(relation);
      return relation;
    } catch (err) {
      //console.log(err);
    }
  }
  async createWall(label, properties) {
    try {
      const checkQuery = `
      MATCH (w:Wall)
      WHERE (w.id1 = $id1 AND w.id2 = $id2) OR (w.id1 = $id2 AND w.id2 = $id1)
      RETURN w
    `;

      const checkResult = await this.queryWithParams(checkQuery, {
        id1: properties.id1,
        id2: properties.id2,
      });

      if (checkResult.records.length > 0) {
        //console.log(checkResult.records[0].get(0).identity.low);
        return checkResult.records[0].get(0).identity.low;
      }

      // If no wall exists, create the new wall node
      const createQuery = `
      CREATE (w:${label} {
        id1: $id1,
        id2: $id2,
        startX: $startX,
        startY: $startY,
        endX: $endX,
        endY: $endY,
        wallType: $wallType,
        length: $lenght
      })
      RETURN w
    `;

      const result = await this.queryWithParams(createQuery, properties);
      const createdWall = result.records[0].get(0).identity.low;
      //console.log(createdWall);
      //console.log("hi");
      return createdWall;
    } catch (e) {
      //console.log(e);
    }
  }
  async queryNodeById(id) {
    try {
      const result = await this.query(
        `MATCH (n) WHERE n.id="${id}" RETURN n`
      );
      return result.records[0]?.get(0)?.identity.low;
    } catch (err) {
      //console.log(err);
    }
  }

  async createMultipleRelation(endId, startId, type) {
    try {
      var relation = null;
      relation = await this.query(`
        MATCH (a),(b)
        WHERE ID(a) = ${startId} AND ID(b) = ${endId}
        MERGE  (a)-[:has_${type}]->(b)
        RETURN a, b
        `);
      //console.log(relation,id);

      return relation?.records[0]?.get(0).identity?.low;
    } catch (err) {
      //console.log(err);
    }
  }
  async queryExposedWall(id) {
    try {
      const exposedNode = await this.query(`MATCH (n:room) WHERE id(n)=${id}
MATCH (n)-[:ifc_wall]->(w:Wall)
MATCH (w)<-[:ifc_wall]-(r:room)
WITH w, count(r) AS connection
WHERE connection =1
RETURN w`);
      const data = [];
      exposedNode.records.forEach((record) => {
        const miniData = {};
        miniData["wallId"] = record.get(0).identity.low;
        miniData["length"] = record.get(0).properties.length;
        data.push(miniData);
      });

      exposedNode.records.forEach((r) => {
        //console.log(r.get(0).identity.low);
      });
      return data;
    } catch (err) {
      //console.log(err);
    }
  }
  async querySharedWall(id) {
    try {
      const exposedNode = await this.query(`MATCH (n:room) WHERE id(n)=${id}
MATCH (n)-[:ifc_wall]->(w:Wall)
MATCH (w)<-[:ifc_wall]-(r:room)
WITH w, count(r) AS connection
WHERE connection >1
RETURN w`);

      const data = [];

      for (let record of exposedNode.records) {
        const miniData = {};
        miniData["wallId"] = record.get(0).identity.low;
        miniData["length"] = record.get(0).properties.length;
        miniData["sharedRoom"] = await this.exposedRoom(
          record.get(0).identity.low,
          id
        );
        data.push(miniData);
      }

      //console.log(data.sharedRoom);

      return data;
    } catch (err) {
      //console.log(err);
    }
  }
  async getWallByRoomId(id) {
    try {
      const WallNode = await this.query(`MATCH (n:room) WHERE id(n)=${id}
MATCH (n)-[:ifc_wall]->(w:Wall)
RETURN w`);
      const data = [];
      WallNode?.records.forEach((r, i) => {
        // //console.log("r",r.get(0).properties.x1);

        data.push({
          WallId: r.get(0).identity.low,
          length: r.get(0).properties.length,
        });
      });
      return data;
    } catch (err) {
      //console.log(err);
    }
  }
  async exposedRoom(id, roomId) {
    const query = await this.query(
      `MATCH (n:Wall) WHERE id(n)=${id}
        MATCH (n)<-[:ifc_wall]-(r:room)
        WHERE id(r) <> ${roomId}
        RETURN r
        `
    );
    const data = [];

    for (let node of query.records) {
      const id = node.get(0).identity.low;
      const name = node.get(0).properties.name;
      data.push({ roomId: id, RoomName: name });
    }
    return data;
  }
}

module.exports = Neo4jgraph;
