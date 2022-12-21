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
      
      const result = await productCollection.insertOne(user);
      res.send(result);
    });

    app.post("/buyers", async (req, res) => {
      const user = req.body;
     
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

    

 

    

  
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("resale portal server is running");
});

app.listen(port, () => console.log(`resell portal running on ${port}`));
