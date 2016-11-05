"use strict";

const path = require("path");
const Connection = require("./lib/connection");

const conn = new Connection(path.join(__dirname, "protocol.xml"), "192.168.1.250");

conn.on("error", (error) => {
    console.error(error);
    process.exit(255);
});

conn.on("listening", (address) => {
    console.log(`Listening on ${address.address}:${address.port}`);
});

conn.on("message", (message) => {
    console.log("message", JSON.stringify(message));
});

conn.start()
.then(() => {
    console.log("Listening!");
})
.catch((error) => {
    console.error(error);
    process.exit(255);
});
