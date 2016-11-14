"use strict";

const Connection = require("./lib/connection");

const configuration = require("./configuration.json");

const host = process.argv[2] || configuration.can_network.ip;
const port = parseInt(process.argv[3], 10) || configuration.can_network.port;
const protocol = process.argv[4] || configuration.can_network.protocol;
const alias = process.argv[5] || configuration.can_network.alias;

console.log(`Protocol definition: ${protocol}`);
console.log(`Alias definition: ${alias}`);
console.log(`Connecting to ${host}:${port}`);

const conn = new Connection(protocol, host, port, alias, configuration);

conn.on("error", (error) => {
    console.error(error);
    process.exit(255);
});

conn.on("message", (message) => {
    console.log("message", JSON.stringify(message));
});

conn.on("mqttmessage", (message) => {
    console.log("Message", JSON.stringify(message));
});

conn.start()
.then((address) => {
    console.log(`Listening on ${address.address}:${address.port}`);
})
.catch((error) => {
    console.error(error);
    process.exit(255);
});
