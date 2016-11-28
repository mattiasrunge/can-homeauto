"use strict";

const EventEmitter = require("events");
const dgram = require("dgram");
const Protocol = require("./protocol");
const Alias = require("./alias");
const Encoder = require("./encoder");
const Decoder = require("./decoder");
const MqttManager = require("./mqttmanager");
const NodeManager = require("./nodemanager");


class Connection extends EventEmitter {
    constructor(definitionfile, host, port = 1100, aliasfile, configuration) {
        super();

        this.protocol = new Protocol(definitionfile);
        this.alias = new Alias(aliasfile, this.protocol);
        this.encoder = new Encoder(this.protocol, this.alias);
        this.decoder = new Decoder(this.protocol, this.alias);
        this.mqttManager = new MqttManager(configuration.mqtt, this.protocol);
        this.nodeManager = new NodeManager(this.mqttManager, this.protocol);
        this.host = host;
        this.port = port;

        this.mqttManager.on("message", (message) => {
            console.log("Got: ", JSON.stringify(message));
            this.send(message);
        });
        //

        
        this.nodeManager.on("message", (message) => {
            this.send(message);
        });
        
        this.decoder.on("message", (message) => {
            //this.emit("message", message);
        });

        this.decoder.on("nmt", (message) => {
            //this.emit("message", message);
            this.nodeManager.newNmtMessage(message);
        });

        this.decoder.on("mqttmessage", (message) => {
            this.mqttManager.publish(message.topic, message.value.toString());
            // this.emit("mqttmessage", message);
        });
    }

    async start() {
        await this.protocol.load();
        await this.alias.load();
        await this.mqttManager.connect();
        // console.log(JSON.stringify(this.protocol.definition,null,2));
        this.decoder.clear();
        this.server = dgram.createSocket("udp4");

        return new Promise((resolve, reject) => {
            this.server.on("error", (error) => {
                this.dispose();

                if (reject) {
                    reject(error);
                    reject = null;

                    return;
                }

                this.emit("error", error);
            });

            this.server.on("message", (data) => {
                this.decoder.addData(data);
            });

            this.server.on("listening", () => {
                this.ping();
                resolve(this.server.address());
            });

            this.server.bind(this.port);
        });
    }

    send(message) {
        return this._send(this.encoder.encode(message));
    }

    ping() {
        return this._send(this.encoder.getPing());
    }

    _send(data) {
        const client = dgram.createSocket("udp4");

        return new Promise((resolve, reject) => {
            //console.log("Sending data to CAN-node. ", data.toString());
            client.send(data, this.port, this.host, (error) => {
                if (error) {
                    console.log("Error sending message to CAN-node.");
                    return reject(error);
                }

                client.close();
                resolve();
            });
        });
    }

    dispose() {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.decoder.clear();
        }
    }
}

module.exports = Connection;
