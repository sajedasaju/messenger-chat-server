const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000

const app = express()

//middleware
app.use(cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jyuvh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log("AUTH", authHeader)
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    // console.log("Token holo", token)
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })

        }
        req.decoded = decoded
        console.log(req.decoded)
        next();
    });

}


async function run() {
    try {
        await client.connect();
        //ALL COLLECTION
        //1 ) uer collection
        const usersCollection = client.db("messenger-chat").collection('users');
        //1 ) uer collection
        const messagesCollection = client.db("messenger-chat").collection('messages');


        //PUT USER
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);

            res.send({ result })

        })
        //PUT USER
        app.get('/allUser', async (req, res) => {
            const users = await usersCollection.find().toArray()
            res.send(users)

        })
        //Patch USER
        app.patch('/userSingle/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            // console.log(email, '  ', user);
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    message: user.message,
                    name: user.userName,
                    photoURL: user.photoURL,
                    time: user.time
                }
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);

            res.send({ result })

        })

        //Post messages
        //http://localhost:5000/messages
        app.post('/message', async (req, res) => {
            const message = req.body;
            console.log(message)
            const result = await messagesCollection.insertOne(message);
            res.send(result);
        })
        //Post messages
        //http://localhost:5000/messages
        app.get('/message', async (req, res) => {
            const messages = await messagesCollection.find().toArray()
            res.send(messages)
        })


        //http://localhost:5000/messages
        // app.get('/messageDist', async (req, res) => {
        //     // const messages = await messagesCollection.distinct('userName')
        //     const messages = await messagesCollectionaggregate([
        //         { $match: { email: "A" } },
        //         { $group: { _id: "$cust_id", total: { $sum: "$amount" } } },
        //         { $sort: { total: -1 } }
        //     ])
        //     res.send(messages)
        // })




        app.delete('/message/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await messagesCollection.deleteOne(query)
            res.send(result)
        })

        app.patch('/message/:id', async (req, res) => {
            const id = req.params.id;
            const order = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    message: order.message,
                    removed: order.removed
                }
            };
            const result = await messagesCollection.updateOne(filter, updateDoc, options);

            res.send(result)

        })





    } finally {
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello From Messenger')
})

app.listen(port, () => {
    console.log(`Messenger app listening on port ${port}`)
})