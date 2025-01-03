const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 3000;
const app = express();
// middleWear
app.use(
  cors({
    origin: ["https://hotel-haven-41b91.web.app/"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser())
const verifyToken = (req, res, next)=>{
    const token = req.cookies?.token 
    if(!token){
        return res.status(401).send({message:'unauthorized  token'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded)=>{
        if(err){
            return res.send(401).send({ message: "unauthorized access" });
        }
        req.user = decoded;
        next()
    })
}



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
    // await client.connect();
    const hotelCollection = client.db("hotelCollection").collection("hotel");
    const roomBookingCollection = client
      .db("hotelCollection")
      .collection("booking");
    const reviewCollection = client.db("hotelCollection").collection("review");

    // !Auth Related APIs

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "3h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });
    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });
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
    app.get("/myBooking",verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { myEmail: email };

      console.log(req.cookies?.token);
      if(req.user.email !== req.query.email){
        return res.status(403).send('access forbidden')
      }
      const result = await roomBookingCollection.find(query).toArray();
      res.send(result);
    });

    // ! Create DataBase and Store review
    app.post("/myBooking", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    //  ! Show the Review to the User (API)
    app.get("/user-reviews", async (req, res) => {
      const reviews = await reviewCollection.find().toArray();
      res.send(reviews);
    });
    // !Delete API (remove booking from my Booking Route)
    app.delete("/myBooking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomBookingCollection.deleteOne(query);
      res.send(result);
    });

    // ! Update the booking date
    app.put("/update-booking/:id", async (req, res) => {
      const bookingId = req.params.id;
      const { newDate } = req.body;

      // Check if the provided ID is valid
      if (!ObjectId.isValid(bookingId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid booking ID." });
      }

      // Validate that a new date is provided
      if (!newDate) {
        return res
          .status(400)
          .json({ success: false, message: "New date is required." });
      }

      try {
        // Update the booking date in the database
        const result = await bookingsCollection.updateOne(
          { _id: new ObjectId(bookingId) },
          { $set: { bookingDate: newDate } }
        );

        // Handle cases based on the result
        if (result.matchedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Booking not found." });
        }

        if (result.modifiedCount === 0) {
          return res.status(400).json({
            success: false,
            message: "Booking date is the same as the current date.",
          });
        }

        res.status(200).json({
          success: true,
          message: "Booking date updated successfully.",
        });
      } catch (error) {
        console.error("Error updating booking date:", error);
        res.status(500).json({
          success: false,
          message: "An error occurred while updating the booking date.",
        });
      }
    });

    // await client.db("admin").command({ ping: 1 });
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
// ACCESS_TOKEN='aff07186043237300be78662d8e842b7bab4b52cde7aa887b29f3b592267ad7ca51193ef4fbca5b2995c3544fce6696b9499b4c31b80bf5982c059a7c00e02d0'