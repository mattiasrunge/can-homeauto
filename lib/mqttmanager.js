"use strict";

const EventEmitter = require("events");
const mqtt = require("mqtt");
const mqttmessagelist = {};

class MqttManager extends EventEmitter {
    constructor(configuration, protocol) {
        super();
        this.config = configuration;
        this.protocol = protocol;
    }

    connect() {
        this.mqttclient = mqtt.connect(this.config.url, this.config);
        this.mqttclient.on("connect", () => {
            this.mqttclient.subscribe("CAN/+");
            this.mqttclient.publish("presence", "Hello mqtt from nodejs");
        });

        this.mqttclient.on("message", (topic, message) => {
            console.log("Got mqtt: ", topic, "   ", message.toString());
            const res = topic.split("/");
            const data = JSON.parse(message);
            const msg = this.protocol.lookupMessage(res[1]);
            console.log("Got: ", JSON.stringify(msg));

            this.emit("message", this.protocol.appendVariablesToMessage(msg, data.command, data.variables));
        });
    }

    publish(topic, value) {
        // console.log("Got msg topic: ",topic)
        if (!mqttmessagelist[topic]) {
            mqttmessagelist[topic] = "";
        }
        if (mqttmessagelist[topic] !== value) {
            this.mqttclient.publish(topic, value);
            // console.log("Sent topic");
            mqttmessagelist[topic] = value;
        }
    }
}

module.exports = MqttManager;
