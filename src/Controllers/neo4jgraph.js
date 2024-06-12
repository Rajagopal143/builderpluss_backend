const neo4j = require("neo4j-driver");

class Neo4jgraph {
  constructor(url, username, password,dbName ) {
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
    await result.records.forEach((element) => {
      properties.push({
        id: element.get(0).identity.low,
        properties: element.get(0).properties,
      });
    });
    return properties;
  }

  async allProducts() {
    const data=[];
    try {
        const query = "MATCH (p:Product) RETURN p";
      const result = await this.query(query);
      //console.log(result);
        await result.records.forEach(record => {
            data.push(record.get("p").properties);
        })
        //console.log(data);
      return data;
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
     let result=await this.query(onWallquery);
      console.log(result);
     await result.records.forEach((record) => {
       laminates.push(record.get("p").properties);
      });
      const onfloorquery = `MATCH (p:Product)-[:has_catgorey]->(a:attributes)
      WHERE a.value = 'tiles'
      RETURN p`;
      let result1 =await this.query(onfloorquery);
      await result1.records.forEach((record) => {
        tiles.push(record.get("p").properties);
      });
      const onwallpaperquery = `MATCH (p:Product)-[:has_catgorey]->(a:attributes)
      WHERE a.value = 'wallpaper'
      RETURN p`;
      let result2 =await this.query(onwallpaperquery);
     await result2.records.forEach((record) => {
       wallpaper.push(record.get("p").properties);
     });
      const data = { laminates: laminates, wallpaper: wallpaper, tiles: tiles };
      return data;
    } catch (err) {
      return err
    }
  }
  async queryWithParams(query, params) {
    const session = this.db.session({ database: this.databaseName });;
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
              .map((key) => `n.${key} = "${properties[key]}"`)
              .join(" AND ")}
            RETURN n
        `;
      const mainResult = await this.query(query, properties);
      console.log(properties,mainResult);
      if (mainResult?.records?.length === 0) {
        // Main node does not exist, create it
        const createMainResult = await this.queryWithParams(
          `CREATE (n:${label} {${Object.keys(properties)
            .map((key) => `${key} :"${properties[key]}"`)
            .join(" ,")}})
            RETURN n`,
          properties
        );

        mainNode = createMainResult?.records[0].get('n').identity?.low;
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


  async connectRoomToCornor(cornorNode, roomId, relationship) {
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
  async createWall(label,properties) {
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
  async queryCornorNodes(cornorid) {
    try {
      const result = await this.query(
        `MATCH (n:Wall) WHERE n.id="${cornorid}" RETURN n`
      );
      return result.records[0]?.get(0)?.identity.low;
    } catch (err) {
      //console.log(err);
    }
  }

  async createMultipleRelation(id, MainNode, type) {
    try {
      var relation = null;
      relation = await this.query(`
        MATCH (a),(b)
        WHERE ID(a) = ${MainNode} AND ID(b) = ${id}
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
        miniData["length"] = record.get(0).properties.lenght;
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
        miniData["length"] = record.get(0).properties.lenght;
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
          length: r.get(0).properties.lenght,
          vertices: [
            { x: r.get(0).properties.x1, y: r.get(0).properties.y1 },
            { x: r.get(0).properties.x2, y: r.get(0).properties.y2 },
            { x: r.get(0).properties.x3, y: r.get(0).properties.y3 },
            { x: r.get(0).properties.x4, y: r.get(0).properties.y4 },
          ],
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