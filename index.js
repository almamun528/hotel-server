const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;
const app = express();
// middleWear
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  console.log("Server is running into get-operation index true");
});

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.34ihq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    //! Database Collection
    await client.connect();
    const hotelCollection = client.db("hotelCollection").collection("hotel");
    const roomBookingCollection = client.db("hotelCollection").collection("booking");
    const reviewCollection = client.db("hotelCollection").collection("review");
    // Send a ping to confirm a successful connection

    // !All Hotel Booking Show to user.
    app.get("/hotels", async (req, res) => {
      const hotels = await hotelCollection.find().toArray();
      res.send(hotels);
    });
    //   ! Find a Specific job card
    app.get("/hotels/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await hotelCollection.findOne(query);
      res.send(result);
    });
    // ! Users Booking API 
    app.post("/hotel-booking", async (req, res) => {
      const application = req.body;
      console.log(application);
      const result = await roomBookingCollection.insertOne(application);
      res.send(result);
    });
    // ! Show booking List to User
    app.get("/myBooking", async (req, res) => {
        const email = req.query.email 
        const query = { myEmail : email};
        const result = await roomBookingCollection.find(query).toArray()
        res.send(result)
    });


    // ! Create DataBase and Store review
     app.post('/myBooking', async(req, res)=>{
        const review = req.body 
        const result = await reviewCollection.insertOne(review) 
        res.send(result)
     })

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

app.listen(port, () => {
  console.log(`app is running on port ${port}`);
});

// USER_NAME=hotel-server
// PASSWORD=qBCnDgBcMW3aVGK3
