"use strict";

const path = require("path");
const Connection = require("./lib/connection");

const host = process.argv[2] || "192.168.1.250";
const port = parseInt(process.argv[3], 10) || 1100;
const protocol = process.argv[4] || path.join(__dirname, "protocol.xml");

console.log(`Protocol definition: ${protocol}`);
console.log(`Connecting to ${host}:${port}`);

const conn = new Connection(protocol, host, port);

conn.on("error", (error) => {
    console.error(error);
    process.exit(255);
});

conn.on("message", (message) => {
    console.log("message", JSON.stringify(message));
});

conn.start()
.then((address) => {
    console.log(`Listening on ${address.address}:${address.port}`);
})
.catch((error) => {
    console.error(error);
    process.exit(255);
});
