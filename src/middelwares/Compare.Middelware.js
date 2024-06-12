const { rules, db1 } = require("../database/db");

const compareGraph = async (req, res, next) => {
    const { label, properties } = req.body;
 const ruleNode = await rules.queryNodesByLabel(label);
 const node = await ruleNode.records[0].get(0);
 const { Nodetype, width, height } = node.properties;
 if (
   Number(properties.width) === Number(width) &&
   Number(properties.height) === Number(height)
 ) {
   req.body.message = "";
   return next();
 }
 req.body.message = "Values does not match the Rules";
 return next();
        

  
};

const compareDoor = async (label, properties, next) => {
  const ruleNode = await rules.queryNodesByLabel(label);
  const node = await ruleNode.records[0].get(0);
  const { Nodetype, width, height } = node.properties;
  if (
    Number(properties.width) === Number(width) &&
    Number(properties.height) === Number(height)
  ) {
    req.body.message = "Values does not match the Rules";
    next();
  }
  req.body.message = "";
  return next();
};
module.exports = compareGraph;