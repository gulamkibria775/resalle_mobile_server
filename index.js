const express = require("express");
const cors = require("cors");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(
  "sk_test_51M9897Kx10OnPie7QOanwH2vTn13S8nq0fXHNCJf1UdDQJxsSWncwCVcsV1WKGAfY92cXPrbTCE1ENlkaF1oZBwk000T64APpO"
);

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());
console.log(process.env.DB_USER,process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gi9sxo8.mongodb.net/?retryWrites=true&w=majority`;


// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://<username>:<password>@cluster0.gi9sxo8.mongodb.net/?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });

// mongodb+srv://<username>:<password>@cluster0.gi9sxo8.mongodb.net/?retryWrites=true&w=majority
// const uri = "mongodb://0.0.0.0:27017/";

// const key =
//   "2738e1226ee7e159a25a8e856da21a51b5a1a9caa0e2e0798b29e1ed55adf5720ff0662d20355d2bdd055a29e131115ca9ffad2a7461e1902f01708f83da2b9b";
const key =process.env.ACCESS_TOKEN;

// jwt
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, key, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
// end jwt
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// function verifyJWT(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).send("unauthorized access");
//   }

//   const token = authHeader.split(" ")[1];

//   jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
//     if (err) {
//       return res.status(403).send({ message: "forbidden access" });
//     }
//     req.decoded = decoded;
//     next();
//   });
// }

async function run() {
  try {
    const productCollection = client.db("reselldata").collection("products");
    const buyerCollection = client.db("reselldata").collection("buyers");

    const sellerCollection = client.db("reselldata").collection("seller");
    const newbuyerCollection = client.db("reselldata").collection("newbuyer");

    const paymentsCollection = client.db("reselldata").collection("payments");
    const categoryCollection = client.db("reselldata").collection("category");

    const comment =client.db("reselldata").collection("comment");
    // const paymentsCollection = client.db('reselldata').collection('payments');

    // veryfy admin
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await productCollection.findOne(query);

      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // end verigy admin

    // jwt star

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const status = req.query.status;
      console.log(" jwt userrr", status, email);
      // const query = { email: email };
      const query = { email };
      if (status === "seller") {
        const user = await sellerCollection.findOne(query);
        // console.log(" jwt user", status)
        if (user) {
          // const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
          const token = jwt.sign({ email }, key, { expiresIn: "1h" });
          return res.send({ accessToken: token });
        }
        res.status(403).send({ accessToken: "" });
      }
      if (status === "buyer") {
        const user = await newbuyerCollection.findOne(query);
        console.log(" jwt user", status);
        if (user) {
          // const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
          const token = jwt.sign({ email }, key, { expiresIn: "1h" });
          return res.send({ accessToken: token });
        }
        res.status(403).send({ accessToken: "" });
      }
    });


    // app.get("/user", async (req, res) => {
    //   const result = await productCollection.distinct("email");
    //   const filter = { email: result[0] };
    //   // const din = await sellerCollection.insertMany(filter);

    //   console.log("user_result", result, din);
    //   res.send(result);
    // });

    // data=[{categoryone:'oneplus'},
    // {categorytwo:'walton'},
    // {categorythree:'samsung'},
    // ]
    //  const result =  categoryCollection.insertMany(data);


    app.get("/category", async (req, res) => {
      const query = {};
      const result = await categoryCollection.find(query).toArray();
      console.log("optionsss", result);
      res.send(result);
    });
    // jwt end

    app.get("/product", async (req, res) => {
      const query = {};

      // console.log("bkaned token",req.headers.authorization);
      // console.log("bkaned token",req);
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });



    // comment section start
    app.get("/comment", async (req, res) => {
      const query = {};

      // console.log("bkaned token",req.headers.authorization);
      // console.log("bkaned token",req);
      const result = await buyerCollection.find(query).toArray();
      res.send(result);
    });


    app.post("/comment", async (req, res) => {
      const user = req.body;
      console.log("newser", user);
      // TODO: make sure you do not enter duplicate user email
      // only insert users if the user doesn't exist in the database
      const result = await sellerCollection.insertOne(user);
      console.log("comment", result);
      res.send(result);
    });
    // comment section end

    app.get("/buyer", async (req, res) => {
      const query = {};
      const result = await buyerCollection
        .find(query)
        // .project({categore:1,_id:0 })
        .toArray();
      res.send(result);
    });

    app.get("/myorderproduct/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("get", id);
      const filter = { _id: ObjectId(id) };
      // console.log("deltele", filter);
      const result = await productCollection.find(filter).toArray();
      // console.log("deltele", result);
      res.send(result);
    });

    app.get("/product/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const email = req.params.id;
      //  console.log("gettttt", id);
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      // console.log("bkaned token",req.headers.authorization);
      const query = { email: req.params.id };
      const result = await productCollection.find(query).toArray();
      // console.log("resutttt", result);
      res.send(result);
    });

    app.get("/myorder/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("get", id);
      const query = { useremail: req.params.id };
      const result = await buyerCollection.find(query).toArray();
      // console.log("resutttt", result);
      res.send(result);
    });
    app.get("/productval/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("vall", id);
      const filter = { _id: ObjectId(id) };
      const result = await productCollection.find(filter).toArray();
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const result = await productCollection.distinct("email");
      const filter = { email: result[0] };
      // const din = await sellerCollection.insertMany(filter);

      console.log("user_result", result, din);
      res.send(result);
    });

    // newuser
    app.post("/newuser", async (req, res) => {
      const user = req.body;
      console.log("newser", user);
      // TODO: make sure you do not enter duplicate user email
      // only insert users if the user doesn't exist in the database
      const result = await sellerCollection.insertOne(user);
      console.log("newser", result);
      res.send(result);
    });
    // newuser end

    // get newuser
    app.get("/newuser", async (req, res) => {
      const filter = {};
      const result = await sellerCollection.find(filter).toArray();
      res.send(result);
    });
    // get newuser

    // new user delete
    app.delete("/newuser/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("deltele", id);
      const filter = { _id: ObjectId(id) };
      const result = await sellerCollection.deleteOne(filter);
      res.send(result);
    });
    // new user delete

    // newbyer start
    app.post("/newbuyer", async (req, res) => {
      const user = req.body;
      // console.log(user);
      // TODO: make sure you do not enter duplicate user email
      // only insert users if the user doesn't exist in the database
      const result = await newbuyerCollection.insertOne(user);
      res.send(result);
    });
    // newbyer end

    // get newbuyer start
    app.get("/newbuyer", async (req, res) => {
      const filter = {};
      const result = await newbuyerCollection.find(filter).toArray();
      // console.log('new_user_data',result)
      res.send(result);
    });
    // get newbuyer end

    // newbuyer delete
    app.delete("/newbuyer/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("deltele", id);
      const filter = { _id: ObjectId(id) };
      const result = await newbuyerCollection.deleteOne(filter);
      res.send(result);
    });
    // newbuyer delete end

    app.post("/addproductbyseller", async (req, res) => {
      const user = req.body;
      // console.log(user);
      // TODO: make sure you do not enter duplicate user email
      // only insert users if the user doesn't exist in the database
      const result = await productCollection.insertOne(user);
      res.send(result);
    });

    app.post("/buyers", async (req, res) => {
      const user = req.body;
      // console.log(user);
      // TODO: make sure you do not enter duplicate user email
      // only insert users if the user doesn't exist in the database
      const result = await buyerCollection.insertOne(user);
      res.send(result);
    });

    // admin
    app.put("/users/admin/:id", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await sellerCollection.findOne(query);
      console.log("admin prb", decodedEmail, user);

      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await sellerCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await sellerCollection.findOne(query);
      // console.log('admin individual',user?.role ==="admin")
      res.send({ isAdmin: user?.role === "admin" });
    });

    // admin

    // buyer addmin

    app.put("/newbuyer/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await newbuyerCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.get("/newbuyer/admin/:email", async (req, res) => {
      const email = req.params.email;
      console.log("admin individual", email);
      const query = { email };
      const user = await newbuyerCollection.findOne(query);
      console.log("admin individual2", user);
      // console.log('admin individual',user?.role ==="admin")
      res.send({ isAdmin: user?.role === "admin" });
      // res.send( user );
    });
    // buyer addmin end
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      console.log("deltele", id);
      const filter = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(filter);
      res.send(result);
    });

    app.delete("/buyer/:id", async (req, res) => {
      const id = req.params.id;
      console.log("deltele", id);
      const filter = { _id: ObjectId(id) };
      const result = await buyerCollection.deleteOne(filter);
      res.send(result);
    });
    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body.status;
      console.log("put data", id, data);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          status: data,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.put("/product1/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body.status;
      console.log("put data", id, data);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          advertige: data,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.put("/orderstatus/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body.status;
      console.log("put datastatus", id, data);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          advertige: data,
          status: data,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;
      console.log("all", booking, price, amount);

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      console.log("all", booking, price, amount);
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.id;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await buyerCollection.insertOne(filter, updatedDoc);
      res.send(result);
    });

    // category

 

    

    /
    //     // const result = await paymentsCollection.insertOne(payment);
    //     const id = payment.id
    //     const filter = {_id: ObjectId(id)}
    //     const updatedDoc = {
    //         $set: {
    //             paid: true,
    //             transactionId: payment.transactionId
    //         }
    //     }
    //     const updatedResult = await buyerCollection.insertOne(filter, updatedDoc)
    //     res.send(result);
    // })

    //   data=  [
    //         {
    //             categore:"samsung",
    //            title: "Jurassic World: Fallen Kingdom",
    //           seller_name:'karim'
    //          },
    //          {
    //             categore:"samsung",
    //            title: "Jurassic World: Fallen Kingdom",
    //           seller_name:'kibria'
    //          },
    //          {
    //             categore:"oneplus",
    //            title: "Jurassic World: Fallen Kingdom",
    //           seller_name:'jamal'
    //          },
    //          {
    //             categore:"oneplus",
    //            title: "Jurassic World: Fallen Kingdom",
    //           seller_name:'kamal'
    //          },
    //          {
    //             categore:"walton",
    //            title: "Jurassic World: Fallen Kingdom",
    //           seller_name:'ploash'
    //          },
    //          {
    //             categore:"wolton",
    //            title: "Jurassic World: Fallen Kingdom",
    //           seller_name:'asek'
    //          },
    //      ]
    //      const result =  productCollection.insertMany(data);

    // NOTE: make sure you use verifyAdmin after verifyJWT
    // const verifyAdmin = async (req, res, next) => {
    //   const decodedEmail = req.decoded.email;
    //   const query = { email: decodedEmail };
    //   const user = await usersCollection.findOne(query);

    //   if (user?.role !== "admin") {
    //     return res.status(403).send({ message: "forbidden access" });
    //   }
    //   next();
    // };

    // // Use Aggregate to query multiple collection and then merge data
    // app.get("/appointmentOptions", async (req, res) => {
    //   const date = req.query.date;
    //   const query = {};
    //   const options = await appointmentOptionCollection.find(query).toArray();

    //   // get the bookings of the provided date
    //   const bookingQuery = { appointmentDate: date };
    //   const alreadyBooked = await bookingsCollection
    //     .find(bookingQuery)
    //     .toArray();

    //   // code carefully :D
    //   options.forEach((option) => {
    //     const optionBooked = alreadyBooked.filter(
    //       (book) => book.treatment === option.name
    //     );
    //     const bookedSlots = optionBooked.map((book) => book.slot);
    //     const remainingSlots = option.slots.filter(
    //       (slot) => !bookedSlots.includes(slot)
    //     );
    //     option.slots = remainingSlots;
    //   });
    //   res.send(options);
    // });

    // app.get("/v2/appointmentOptions", async (req, res) => {
    //   const date = req.query.date;
    //   const options = await appointmentOptionCollection
    //     .aggregate([
    //       {
    //         $lookup: {
    //           from: "bookings",
    //           localField: "name",
    //           foreignField: "treatment",
    //           pipeline: [
    //             {
    //               $match: {
    //                 $expr: {
    //                   $eq: ["$appointmentDate", date],
    //                 },
    //               },
    //             },
    //           ],
    //           as: "booked",
    //         },
    //       },
    //       {
    //         $project: {
    //           name: 1,
    //           price: 1,
    //           slots: 1,
    //           booked: {
    //             $map: {
    //               input: "$booked",
    //               as: "book",
    //               in: "$$book.slot",
    //             },
    //           },
    //         },
    //       },
    //       {
    //         $project: {
    //           name: 1,
    //           price: 1,
    //           slots: {
    //             $setDifference: ["$slots", "$booked"],
    //           },
    //         },
    //       },
    //     ])
    //     .toArray();
    //   res.send(options);
    // });

    // app.get("/appointmentSpecialty", async (req, res) => {
    //   const query = {};
    //   const result = await appointmentOptionCollection
    //     .find(query)
    //     .project({ name: 1 })
    //     .toArray();
    //   res.send(result);
    // });

    // /***
    
    
    
   
    
   
    //  */

    // app.get("/bookings", verifyJWT, async (req, res) => {
    //   const email = req.query.email;
    //   const decodedEmail = req.decoded.email;

    //   if (email !== decodedEmail) {
    //     return res.status(403).send({ message: "forbidden access" });
    //   }

    //   const query = { email: email };
    //   const bookings = await bookingsCollection.find(query).toArray();
    //   res.send(bookings);
    // });

    // app.get("/bookings/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   const booking = await bookingsCollection.findOne(query);
    //   res.send(booking);
    // });

    // app.post("/bookings", async (req, res) => {
    //   const booking = req.body;
    //   console.log(booking);
    //   const query = {
    //     appointmentDate: booking.appointmentDate,
    //     email: booking.email,
    //     treatment: booking.treatment,
    //   };

    //   const alreadyBooked = await bookingsCollection.find(query).toArray();

    //   if (alreadyBooked.length) {
    //     const message = `You already have a booking on ${booking.appointmentDate}`;
    //     return res.send({ acknowledged: false, message });
    //   }

    //   const result = await bookingsCollection.insertOne(booking);
    //   res.send(result);
    // });

    // app.post("/create-payment-intent", async (req, res) => {
    //   const booking = req.body;
    //   const price = booking.price;
    //   const amount = price * 100;

    //   const paymentIntent = await stripe.paymentIntents.create({
    //     currency: "usd",
    //     amount: amount,
    //     payment_method_types: ["card"],
    //   });
    //   res.send({
    //     clientSecret: paymentIntent.client_secret,
    //   });
    // });

    // app.post("/payments", async (req, res) => {
    //   const payment = req.body;
    //   const result = await paymentsCollection.insertOne(payment);
    //   const id = payment.bookingId;
    //   const filter = { _id: ObjectId(id) };
    //   const updatedDoc = {
    //     $set: {
    //       paid: true,
    //       transactionId: payment.transactionId,
    //     },
    //   };
    //   const updatedResult = await bookingsCollection.updateOne(
    //     filter,
    //     updatedDoc
    //   );
    //   res.send(result);
    // });

    // app.get("/jwt", async (req, res) => {
    //   const email = req.query.email;
    //   const query = { email: email };
    //   const user = await usersCollection.findOne(query);
    //   if (user) {
    //     const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
    //       expiresIn: "1h",
    //     });
    //     return res.send({ accessToken: token });
    //   }
    //   res.status(403).send({ accessToken: "" });
    // });

    // app.get("/users", async (req, res) => {
    //   const query = {};
    //   const users = await usersCollection.find(query).toArray();
    //   res.send(users);
    // });

    // app.get("/users/admin/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email };
    //   const user = await usersCollection.findOne(query);
    //   res.send({ isAdmin: user?.role === "admin" });
    // });

    // app.post("/users", async (req, res) => {
    //   const user = req.body;
    //   console.log(user);
    //   // TODO: make sure you do not enter duplicate user email
    //   // only insert users if the user doesn't exist in the database
    //   const result = await usersCollection.insertOne(user);
    //   res.send(result);
    // });

    // app.put("/users/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: ObjectId(id) };
    //   const options = { upsert: true };
    //   const updatedDoc = {
    //     $set: {
    //       role: "admin",
    //     },
    //   };
    //   const result = await usersCollection.updateOne(
    //     filter,
    //     updatedDoc,
    //     options
    //   );
    //   res.send(result);
    // });

    // // temporary to update price field on appointment options
    // // app.get('/addPrice', async (req, res) => {
    // //     const filter = {}
    // //     const options = { upsert: true }
    // //     const updatedDoc = {
    // //         $set: {
    // //             price: 99
    // //         }
    // //     }
    // //     const result = await appointmentOptionCollection.updateMany(filter, updatedDoc, options);
    // //     res.send(result);
    // // })

    // app.get("/doctors", verifyJWT, verifyAdmin, async (req, res) => {
    //   const query = {};
    //   const doctors = await doctorsCollection.find(query).toArray();
    //   res.send(doctors);
    // });

    // app.post("/doctors", verifyJWT, verifyAdmin, async (req, res) => {
    //   const doctor = req.body;
    //   const result = await doctorsCollection.insertOne(doctor);
    //   res.send(result);
    // });

    // app.delete("/doctors/:id", verifyJWT, verifyAdmin, async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: ObjectId(id) };
    //   const result = await doctorsCollection.deleteOne(filter);
    //   res.send(result);
    // });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("resale portal server is running");
});

app.listen(port, () => console.log(`resell portal running on ${port}`));
