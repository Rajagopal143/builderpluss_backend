const { productGraph } = require("../database/db");


function getRandomObject(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// Function to create a random combination of objects from the three arrays
function createRandomCombination(array1, array2, array3) {
  const randomObject1 = getRandomObject(array1);
  const randomObject2 = getRandomObject(array2);
  const randomObject3 = getRandomObject(array3);

  // Combine the random objects into a new object
  const combinedObject = {
   laminates: randomObject1,
    wallpaper:randomObject2,
    tiles:randomObject3,
  };

  return combinedObject;
}
const getBoards =async (req,res)=>{
    const resData = [];
    try {
        const data = await productGraph.getProductByType();
        for (let i = 0; i < 8; i++){
            resData.push(
              createRandomCombination(
                data["laminates"],
                data["wallpaper"],
                data["tiles"]
              )
            );
        }
        res.status(200).json(resData)
    } catch (err) {
        
        res.status(400).json({ message: err });
    }
}

module.exports={getBoards}