"use strict";

const EventEmitter = require("events");
const mqtt = require("mqtt");


class NqttManager extends EventEmitter {
    constructor(mqttmanager, protocol) {
        super();
        this.mqttmanager =  mqttmanager
        this.protocol = protocol;
        this.nodelist = {};
        this.period = 1 * 1000;
        this.timeout = 30 * 1000;
        setInterval(this.timerUpdate.bind(this), this.period);
    }

    timerUpdate()
    {
      for (const propertyName of Object.keys(this.nodelist)) {
          const currentTime = (new Date).getTime();
          if (this.nodelist[propertyName].time < (currentTime - this.timeout))
          {
              if (!this.nodelist[propertyName].hasTimedOut)
              {
                  //Timeout from node, send mqttmessage and set HasTimedOut
                  this.nodelist[propertyName].hasTimedOut = true;
                  this.setNodeOffline(propertyName);
              }
          }
      }
    }

    newNmtMessage(message) {
         //console.log("Got msg of type: ",message.commandName, " from ", message.variables.HardwareId.value, " with ", message.variables.NumberOfModules.value , " modules");
        
        if (message.commandName === "Heartbeat")
        {
            //Create node in list
            if (!this.nodelist[message.variables.HardwareId.value])
            {
                //console.log("Created new node with id ", message.variables.HardwareId.value);
                this.nodelist[message.variables.HardwareId.value] = {};
                this.nodelist[message.variables.HardwareId.value].numberofmodules = message.variables.NumberOfModules.value;
                this.nodelist[message.variables.HardwareId.value].id = message.variables.HardwareId.value;
                this.nodelist[message.variables.HardwareId.value].modules = [];
                this.nodelist[message.variables.HardwareId.value].hasTimedOut = false;
                //console.log("Modules created: ", JSON.stringify(this.nodelist[message.variables.HardwareId.value].modules));
                //Send Request for modules in node.
                this.requestModuleList(message.variables.HardwareId.value);
                
            } else if (this.nodelist[message.variables.HardwareId.value].modules.length != message.variables.NumberOfModules.value + 1) {
              //Send Request for modules in node.
              //console.log("Node list is not compleate", this.nodelist[message.variables.HardwareId.value].modules.length, " != ", message.variables.NumberOfModules.value);
              //console.log("Modules: ", JSON.stringify(this.nodelist[message.variables.HardwareId.value].modules));
              this.requestModuleList(message.variables.HardwareId.value);
            }
            if (this.nodelist[message.variables.HardwareId.value].hasTimedOut)
            {
                //Send online message to mqtt
                this.setNodeOnline(message.variables.HardwareId.value);
            }
            this.nodelist[message.variables.HardwareId.value].hasTimedOut = false;
            this.nodelist[message.variables.HardwareId.value].time = (new Date).getTime();
        } else if (message.commandName === "List") {
            /*
            message {"className":"act","commandName":"List","directionName":"From_Owner","moduleName":"hwPWM","id":1,"instance":"Badrum",
                      "variables":{"HardwareId":{"value":1318086439,"unit":""},"NumberOfModules":{"value":5,"unit":""},"SequenceNumber":{"value":3,"unit":""}}}
            */
            if (!this.nodelist[message.variables.HardwareId.value].modules[message.variables.SequenceNumber.value])
            {
                this.nodelist[message.variables.HardwareId.value].modules[message.variables.SequenceNumber.value] = {};
                this.nodelist[message.variables.HardwareId.value].modules[message.variables.SequenceNumber.value].className = message.className;
                this.nodelist[message.variables.HardwareId.value].modules[message.variables.SequenceNumber.value].moduleName = message.moduleName;
                this.nodelist[message.variables.HardwareId.value].modules[message.variables.SequenceNumber.value].id = message.id;
                this.nodelist[message.variables.HardwareId.value].modules[message.variables.SequenceNumber.value].instances = this.protocol.lookupModuleInstances(message.moduleName,message.id);
                console.log("Added new module for node", message.variables.SequenceNumber.value, " ", message.variables.HardwareId.value, " of type ", this.nodelist[message.variables.HardwareId.value].modules[message.variables.SequenceNumber.value].moduleName);
                console.log("   With instances: ", JSON.stringify(this.nodelist[message.variables.HardwareId.value].modules[message.variables.SequenceNumber.value].instances));
                //console.log("Modules: ", JSON.stringify(this.nodelist[message.variables.HardwareId.value].modules));
                if (this.nodelist[message.variables.HardwareId.value].modules.length === message.variables.NumberOfModules.value + 1)
                {
                    //Send online message to mqtt
                    this.setNodeOnline(message.variables.HardwareId.value);
                }
                
            }
        }  
                
        /*if (!this.mqttmessagelist[topic]) {
            this.mqttmessagelist[topic] = "";
        }
        if (this.mqttmessagelist[topic] !== value) {
            this.mqttclient.publish(topic, value);
            // console.log("Sent topic");
            this.mqttmessagelist[topic] = value;
        }
        */
    }
    
    /*
    {"className":"act","moduleName":"hwPWM","directionName":"To_Owner","id":7,"variables":{"Channel":"1","EndValue":0,"Speed":135},"commandName":"Abs_Fade"}
    {"className":"nmt","commandName":"Heartbeat","variables":{"HardwareId":{"value":486287916,"unit":""},"NumberOfModules":{"value":1,"unit":""}}}
    
    <command id="0" name="List" type="global" module="" description="Message that module send to tell the world what it is">
      <variables>
	<variable name="HardwareId" type="uint" start_bit="0" bit_length="32" unit="" description=""/>
	<variable name="NumberOfModules" type="uint" start_bit="32" bit_length="8" unit="" description=""/>
	<variable name="SequenceNumber" type="uint" start_bit="40" bit_length="8" unit="" description=""/>
      </variables>
    </command>
    
    */
    setNodeOnline(nodeid) {
        for (const propertyNameModule of Object.keys(this.nodelist[nodeid].modules)) {
            for (const propertyNameInstance of Object.keys(this.nodelist[nodeid].modules[propertyNameModule].instances)) {
                let topic = `CAN/${this.nodelist[nodeid].modules[propertyNameModule].instances[propertyNameInstance].name}/status`;
                const message = {};
                message.topic = topic;
                message.value = "online";
                this.mqttmanager.publish(message.topic, message.value.toString());
            }
        } 
    }

    setNodeOffline(nodeid) {
        for (const propertyNameModule of Object.keys(this.nodelist[nodeid].modules)) {
            for (const propertyNameInstance of Object.keys(this.nodelist[nodeid].modules[propertyNameModule].instances)) {
                let topic = `CAN/${this.nodelist[nodeid].modules[propertyNameModule].instances[propertyNameInstance].name}/status`;
                const message = {};
                message.topic = topic;
                message.value = "offline";
                this.mqttmanager.publish(message.topic, message.value.toString());
            }
        } 
    }
        
    requestModuleList(nodeid) {
        const message = {};
        // message {"className":"act","commandName":"Pwm","directionName":"From_Owner","moduleName":"hwPWM","id":10,"variables":{"Channel":{"value":2,"unit":""},"Value":{"value":0,"unit":""}}}
        message.className = "mnmt";
        message.commandName = "List";
        message.directionName = "To_Owner";
        message.id = "0";
        message.variables = {};
        message.variables["HardwareId"] = nodeid;
        this.emit("message", message);
        //console.log("Requesting module list for node ",nodeid);
    
    }
}



module.exports = NqttManager;
