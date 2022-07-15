// This file performs the following :
// 1. import keys and redis library
// 2. Create redis client and duplicate
// 3. implement fibonacci function.
// 4. Subscribe to 'insert' channel
// 5. on write (insert channel), call fib function, and store key, value into redis

const redis_keys = require('./keys');
const redis_lib = require('redis');
// The retry_strategy is a function that receives objects as parameters including the retry attempt,
// total_retry_time that indicates the time passed after it was connected the last time, the error 
// due to which the connection was lost, and the number of times_connected in total.
// If a number is returned from this function, the next retry will take place after that 
// time only in milliseconds and if you send a non-number, no further retry will take place.
// In our case, we ignore parameters
redis_client = redis_lib.createClient({
    port:redis_keys.redisPort,
    host:redis_keys.redisHost,
    retry_strategy: () => 1000
});

console.log("Connect to redis. host : " + redis_keys.redisHost + " port :" + redis_keys.redisPort);
const redis_client_dup = redis_client.duplicate();

function Fibonacci(number){
    var results = 0;
//    console.log("Calculating Fib for " + number)
    if(number == 0 ) {
        results = 0;
    }
    else if (number == 1) {
        results = 1;
    } 
    else {
//        console.log("results = Fib: " + (number -1) + " + " + "Fib:" + (number - 2));
        results = Fibonacci(number - 1) + Fibonacci(number - 2);
        
    }
//    console.log ("results :" + results)
    return (results);
}

redis_client.on('message', (channel, number) =>{
//    console.log("calculating for channel : " + channel + " number: " + number);
    fib_results = Fibonacci(parseInt(number));
//    console.log("results : " + fib_results);
    redis_client_dup.hset('values', number, fib_results);
})
redis_client.subscribe('insert');