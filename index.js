const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// mealier

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.BISTRO_DB}:${process.env.BISTRO_PASS}@cluster0.p45io4t.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const menuCollation = client.db("BistroDb").collection("menu");
    const reviewCollation = client.db("BistroDb").collection("review");
    const cartCollation = client.db("BistroDb").collection("carts");

    app.get("/menu", async (req, res) => {
      const result = await menuCollation.find().toArray();
      res.send(result);
    });

    app.get("/review", async (req, res) => {
      const result = await reviewCollation.find().toArray();
      res.send(result);
    });


    // bistro boss cart collation 

    app.get('/carts' , async(req , res ) => {
      const email = req.query.email ;
      if(!email){
        res.send([])
      }
      const query = { email: email };
      const result = await cartCollation.find(query).toArray()
      res.send(result)
    })
    app.delete('/carts/:id' , async(req , res ) => {
      const id = req.params;
      console.log(id)
      const query = { _id: new ObjectId(id) };
      const result = await cartCollation.deleteOne(query)
      res.send(result)
    })


    app.post("/carts", async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cartCollation.insertOne(item)
      res.send(result)
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Bistro Boss Is Siting on");
});

app.listen(port, () => {
  console.log("Bistro Boss server is running port : " + port);
});
