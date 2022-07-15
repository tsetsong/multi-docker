// import the required keys for setting up connections to databases
const keys = require("./keys");
/* ---------------------------------------------------------------------------------
    Setting up express framework
--------------------------------------------------------------------------------- */
// import the modules required for setting up express framework
const express = require("express");
const bodyparser = require('body-parser');
const cors = require('cors');


//creating the express application, load cors and body parser into application
const app = express();
app.use(cors());
app.use(bodyparser.json());

/* ---------------------------------------------------------------------------------
    Setting up postgres connection
--------------------------------------------------------------------------------- */
const {Pool} = require("pg");
const pgClient = new Pool({
    user: keys.pguser,
    host: keys.pghost,
    database: keys.pgdatabase,
    password: keys.pgpassword,
    port: keys.pgport
});

pgClient.on("connect", (client)=>{
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});

/* ---------------------------------------------------------------------------------
    Setting up redis connection
--------------------------------------------------------------------------------- */
const redis_module = require("redis");
const redisClient = redis_module.createClient({
    host : keys.redishost,
    port: keys.redisport,
    retry_strategy: () => 1000
});
const redis_publisher = redisClient.duplicate();

/* ---------------------------------------------------------------------------------
    Express route handler
--------------------------------------------------------------------------------- */
// Test route
app.get("/", (req,res) => {
    res.send("Hi!");
});

// query running PostGres instance, to retrieve all values that have ever been submitted
app.get("/values/all", async (req,res) => {
    const values = await pgClient.query("SELECT * from values");
    res.send(values.rows);
});

// query redis to retrieve all [value, <fibvalue>] pairs ever stored
app.get("/values/current", async (req,res) =>{
    redisClient.hgetall("values", (err,values)=>{
        res.send(values);
        });
});

// route handler to receive values from the react application
app.post("/values", async (req,res) => {
    const number = req.body.index;
    if (parseInt(number) > 40)
    {
        return (res.status(422).send("number too high (<=40 please)"));
    }
    redisClient.hset("values",number,"Not calculated");
    redis_publisher.publish("insert", number);
    pgClient.query("INSERT INTO values(number) VALUES($1)", [number]);
    // send an arbitrary response
    res.send({working:true});
});

app.listen(5000, (err)=>{
    console.log("Listening");
});