"use strict";

const EventEmitter = require("events");
const mqtt = require("mqtt");


class MqttManager extends EventEmitter {
    constructor(configuration, protocol) {
        super();
        this.config = configuration;
        this.protocol = protocol;
        this.mqttmessagelist = {};
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
            if (res[1] == "sys") {
              //Got a system message
              switch(message.toString()) {
                  case "flush":
                      console.log("Got system command ",message.toString());
                      this.mqttmessagelist = {}; 
                      break;
                  default:
                      ;
              }
            } else {
              const msg = this.protocol.lookupMessage(res[1]);
              console.log("Got: ", JSON.stringify(msg));
              const data = JSON.parse(message);
              this.emit("message", this.protocol.appendVariablesToMessage(msg, data.command, data.variables));
            }
        });
    }

    publish(topic, value) {
        // console.log("Got msg topic: ",topic)
        if (!this.mqttmessagelist[topic]) {
            this.mqttmessagelist[topic] = "";
        }
        if (this.mqttmessagelist[topic] !== value) {
            this.mqttclient.publish(topic, value);
            // console.log("Sent topic");
            this.mqttmessagelist[topic] = value;
        }
    }
}

module.exports = MqttManager;
