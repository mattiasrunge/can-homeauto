"use strict";

const mqtt = require('mqtt');
const mqttmessagelist = {};

class MqttManager {
    constructor(configuration, protocol) {
        this.config = configuration;
        this.protocol = protocol;
    }
    
    connect() {
        this.mqttclient  = mqtt.connect(this.config.url, this.config);
        this.mqttclient.on('connect', () => {
          this.mqttclient.subscribe('CAN/+');
          this.mqttclient.publish('presence', 'Hello mqtt from nodejs');
        })
        
        this.mqttclient.on('message', (topic, message) => {
          console.log("Got mqtt: " , topic, "   ", message.toString());
          var res = topic.split("/");
          this.protocol.sendMessage(res[1], JSON.parse(message));
        })
        
        
    }
    
    publish(topic, value) {
        //console.log("Got msg topic: ",topic)
        if (!mqttmessagelist[topic])
        {
            mqttmessagelist[topic] = "";
        }
        if (mqttmessagelist[topic] != value)
        {
            this.mqttclient.publish(topic, value);
              //console.log("Sent topic");
              mqttmessagelist[topic] = value;
        }
    }
};

module.exports = MqttManager;
