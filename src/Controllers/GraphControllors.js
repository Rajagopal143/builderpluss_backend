const { dbGraph } = require("../database/db");

const exposedWallDetails = async (roomId) => {
  const roomData = {};
    const NWalllent = await dbGraph.queryExposedWall(roomId, "North");
  if (NWalllent !== null) {
    roomData["N Exp.Wall L(m)"] = NWalllent;
    roomData["N Exposed Wall Area(m2)"] = Math.round(
      Number(NWalllent.replace("m", "")) * 10.764
    );
  } else {
    roomData["N Exp.Wall L(m)"] = "";
    roomData["N Exposed Wall Area(m2)"] = "";
  }
  const SWalllent = await dbGraph.queryExposedWall(roomId, "South");
  if (SWalllent !== null) {
    roomData["S Exp.Wall L(m)"] = SWalllent;
    roomData["S Exposed Wall Area(m2)"] = Math.round(
      Number(SWalllent.replace("m", "")) * 10.764
    );
  } else {
    roomData["S Exp.Wall L(m)"] = "";
    roomData["S Exposed Wall Area(m2)"] = "";
  }
  const EWalllent = await dbGraph.queryExposedWall(roomId, "East");
  if (EWalllent !== null) {
    roomData["E Exp.Wall L(m)"] = EWalllent;
    roomData["E Exposed Wall Area(m2)"] = Math.round(
      Number(EWalllent.replace("m", "")) * 10.764
    );
  } else {
    roomData["E Exp.Wall L(m)"] = "";
    roomData["E Exposed Wall Area(m2)"] = "";
  }
  const WWalllent = await dbGraph.queryExposedWall(roomId, "West");
  if (WWalllent !== null) {
    roomData["W Exp.Wall L(m)"] = WWalllent;
    roomData["W Exposed Wall Area(m2)"] = Math.round(
      Number(WWalllent.replace("m", "")) * 10.764
    );
  } else {
    roomData["W Exp.Wall L(m)"] = "";
    roomData["W Exposed Wall Area(m2)"] = "";
  }
  return roomData;
};

const widowDimesions = async (type, roomId) => {
  var query;
  query = `MATCH (r:room) WHERE id(r)=${roomId} 
        MATCH (r)-[:ifc_wall]->(w:Wall)
        MATCH (w)-[:has_window]->(n:window {windowtype:"${type}"})
        RETURN n`;

  const result = await dbGraph.query(query);
  const data = {};
  if (result.records.length !== 0) {
    data["Glass Width (m)"] = result.records[0].get("n").properties.windowWidth;
    data["Glass Height (m)"] =
      result.records[0].get("n").properties.windowHeight;
    return data;
  } else {
    data["Glass Width (m)"] = "";
    data["Glass Height (m)"] = "";
    return data;
  }
};

const windowQuantity = async (type, roomId) => {
  const data = {};
  const Nquery = `MATCH (r:room) WHERE id(r)=${roomId} 
    MATCH (r)-[:ifc_wall]-(w:Wall)
    MATCH (w)-[:has_direction]-(d:direction {direction:"North"})
    MATCH (w)-[:has_window]-(n:window {windowtype:"${type}"})
    RETURN n`;

  const Nresult = await dbGraph.query(Nquery);
  if (Nresult.records.length !== 0) {
    data["N"] = Nresult.records.length;
  } else {
    data["N"] = "";
  }

  const Squery = `MATCH (r:room) WHERE id(r)=${roomId} 
    MATCH (r)-[:ifc_wall]-(w:Wall)
    MATCH (w)-[:has_direction]-(d:direction {direction:"South"})
    MATCH (w)-[:has_window]-(n:window {windowtype:"${type}"})
    RETURN n
    `;

  const Sresult = await dbGraph.query(Squery);
  if (Sresult.records.length !== 0) {
    data["S"] = Sresult.records.length;
  } else {
    data["S"] = "";
  }

  const Equery = `MATCH (r:room) WHERE id(r)=${roomId} 
    MATCH (r)-[:ifc_wall]-(w:Wall)
    MATCH (w)-[:has_direction]-(d:direction {direction:"East"})
    MATCH (w)-[:has_window]-(n:window {windowtype:"${type}"})
    RETURN n
    `;
  const Eresult = await dbGraph.query(Equery);
  if (Eresult.records.length !== 0) {
    data["E"] = Eresult.records.length;
  } else {
    data["E"] = "";
  }
  const Wquery = `MATCH (r:room) WHERE id(r)=${roomId} 
    MATCH (r)-[:ifc_wall]-(w:Wall)
    MATCH (w)-[:has_direction]-(d:direction {direction:"West"})
    MATCH (w)-[:has_window]-(n:window {windowtype:"${type}"})
    RETURN n
    `;

  const Wresult = await dbGraph.query(Wquery);
  if (Wresult.records.length !== 0) {
    data["W"] = Wresult.records.length;
  } else {
    data["W"] = "";
  }

  return data;
};
const exposedGlassArea = async (roomId) => {
    const data = {}
    data["N"] = await exposedGlassquery(roomId,"North")
    data["S"] = await exposedGlassquery(roomId,"South")
    data["E"] = await exposedGlassquery(roomId,"East")
    data["W"] = await exposedGlassquery(roomId, "West")
    return data;
};

const exposedGlassquery = async (roomId,direction) => {
     const NorthQuery = `MATCH (r:room) WHERE id(r)=${roomId} 
        MATCH (r)-[:ifc_wall]->(w:Wall)
        MATCH (w)-[:has_direction]->(d:direction {direction:"${direction}"})
        MATCH (w)-[:has_window]->(n:window)
        RETURN n`;
     const NorthResult = await dbGraph.query(NorthQuery);
     var NorthArea = 0;
     NorthResult.records.forEach((record) => {
       const width = record.get("n").properties.windowWidth;
       const height = record.get("n").properties.windowHeight;
       NorthArea += width * height;
     });
     return NorthArea;
}

module.exports = {
  exposedWallDetails,
  widowDimesions,
  windowQuantity,
  exposedGlassArea,
};
