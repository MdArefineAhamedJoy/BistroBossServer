const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// mealier

app.use(cors());
app.use(express.json());

const verifyJwtToken = (req , res , next) =>{
  const authorization = req.headers.authorization ;
  if(!authorization){
    return res.status(401).send({error: true , message: "unauthorize access---------"})
  }

  const token = authorization.split(" ")[1]

  jwt.verify(token , process.env.ACCESS_TOKEN_SECRYT , (error , decoded) => {
    if(error){
      return res.status(403).send({error: true , message : "unauthorize access---------"})
    }
    req.decoded = decoded 
    next()
  })
}

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

    const usersCollation = client.db("BistroDb").collection("users");
    const menuCollation = client.db("BistroDb").collection("menu");
    const reviewCollation = client.db("BistroDb").collection("review");
    const cartCollation = client.db("BistroDb").collection("carts");

    // Jwt token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRYT, {
        expiresIn: '1h',
      });
      res.send(token)
    });

    const verifyAdmin = async(req , res , next)  => {
      const email = req.decoded.email ;
      const query = {email : email}
      const user = await usersCollation.findOne(query)
      if(user?.role !== 'admin'){
        res.status(403).send({error: true , message: 'forbidden'})
      }
      next()
    }

    app.get("/menu", async (req, res) => {
      const result = await menuCollation.find().toArray();
      res.send(result);
    });

    app.get("/review", async (req, res) => {
      const result = await reviewCollation.find().toArray();
      res.send(result);
    });


    const getUser = async (req, res) => {
      const result = await usersCollation.find().toArray();
      res.send(result);
    }

    // users
    app.get("/users", verifyJwtToken , verifyAdmin, getUser  );

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollation.findOne(query);
      if (existingUser) {
        return res.send({ message: "use already exists " });
      }
      const result = await usersCollation.insertOne(user);
      res.send(result);
    });

    app.get('/users/admin/:email', verifyJwtToken, async(req , res ) => {
      const email = req.params.email 

      if(req.decoded.email !== email){
        return ({admin : false})
      }

      const query = {email : email}
      const user = await usersCollation.findOne(query)
      const result = {admin : user?.role === 'admin'}
      res.send(result)
    })

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollation.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/users/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollation.deleteOne(query);
      res.send(result);
    });

    // bistro boss cart collation

    app.get("/carts",verifyJwtToken , async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email

      console.log(decodedEmail , email)

      if(email !== decodedEmail){
        return res.status(403).send({error: true , message : "Not Accesses----"})
      }
      const query = { email: email };
      const result = await cartCollation.find(query).toArray();
      res.send(result);
    });
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await cartCollation.deleteOne(query);
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cartCollation.insertOne(item);
      res.send(result);
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
