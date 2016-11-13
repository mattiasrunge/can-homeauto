"use strict";

const mqtt = require('mqtt');
const mqttmessagelist = {};

class MqttManager {
    constructor(configuration) {
        this.config = configuration;
    }
    
    connect() {
        this.mqttclient  = mqtt.connect(this.config.url, this.config);
        /*
        this.mqttclient.on('connect', function () {
          //client.subscribe('presence')
          this.mqttclient.publish('presence', 'Hello mqtt from nodejs')
        })
         
        this.mqttclient.on('message', function (topic, message) {
          // message is Buffer 
          console.log(message.toString())
          this.mqttclient.end()
        })
        */
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
