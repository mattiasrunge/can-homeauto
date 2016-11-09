"use strict";
const mqtt = require('mqtt');
let mqttclient;

class MqttManager {
    constructor(configuration) {
        mqttclient = mqtt.connect(configuration.url, configuration);
        
        mqtt.on('connect', function () {
          //client.subscribe('presence')
          mqttclient.publish('presence', 'Hello mqtt from nodejs')
        })
         
        mqtt.on('message', function (topic, message) {
          // message is Buffer 
          console.log(message.toString())
          mqttclient.end()
        })
    }
    
    

};

module.exports = MqttManager;
