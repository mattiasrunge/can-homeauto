"use strict";

const path = require("path");
const Connection = require("./lib/connection");

const host = process.argv[2] || "192.168.1.250";
const port = parseInt(process.argv[3], 10) || 1100;
const protocol = process.argv[4] || path.join(__dirname, "protocol.xml");
const alias = process.argv[5] || path.join(__dirname, "alias");

var mqtt = require('mqtt');

var url = "mqtt://hok.famlundin.org";

var options = {
  port: 1883,
  clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
  username: 'linus',
  password: 'linusPass',
};

var mqttclient  = mqtt.connect(url, options);
mqttclient.on('connect', function () {
  //client.subscribe('presence')
  mqttclient.publish('presence', 'Hello mqtt from nodejs')
})
 
mqttclient.on('message', function (topic, message) {
  // message is Buffer 
  console.log(message.toString())
  mqttclient.end()
})


console.log(`Protocol definition: ${protocol}`);
console.log(`Alias definition: ${alias}`);
console.log(`Connecting to ${host}:${port}`);

const conn = new Connection(protocol, host, port, alias);

conn.on("error", (error) => {
    console.error(error);
    process.exit(255);
});

conn.on("message", (message) => {
    console.log("message", JSON.stringify(message));
});

conn.on("mqttmessage", (message)  => {
    console.log("Message", JSON.stringify(message));
    mqttclient.publish(message.topic, message.value.toString());
});

conn.start()
.then((address) => {
    console.log(`Listening on ${address.address}:${address.port}`);
})
.catch((error) => {
    console.error(error);
    process.exit(255);
});
