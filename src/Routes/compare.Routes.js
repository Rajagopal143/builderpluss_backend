const express = require("express");
const { db1, rules } = require("../database/db");

const router = express.Router();

router.post("/api/createNode", async function (req, res) {
  const { label, properties } = req.body;
    const ruleNode = await rules.queryNodesByLabel(label);
    const node = await ruleNode.records[0].get(0);
    const { Nodetype, width, height } = node.properties;
    if (Number(properties.width) === Number(width) && Number(properties.height) === Number(height)) {
        const result=await db1.createNode(label,properties)
        return res.json(result.records[0]);
    }
    return res.json({
      message: "Rules does not Match. Valid properties are",
      properties: node.properties,
    });
});

module.exports = router;
