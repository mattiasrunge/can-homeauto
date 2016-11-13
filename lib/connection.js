"use strict";

const EventEmitter = require("events");
const dgram = require("dgram");
let Protocol = require("./protocol");
const Alias = require("./alias");
const Encoder = require("./encoder");
const Decoder = require("./decoder");
const MqttManager = require("./mqttmanager");


class Connection extends EventEmitter {
    constructor(definitionfile, host, port = 1100, aliasfile, configuration) {
        super();

        this.protocol = new Protocol(definitionfile);
        this.alias = new Alias(aliasfile, this.protocol);
        this.encoder = new Encoder(this.protocol, this.alias);
        this.decoder = new Decoder(this.protocol, this.alias);
        this.MqttManager = new MqttManager(configuration.mqtt);
        this.host = host;
        this.port = port;
        //

        this.decoder.on("message", (message) => {
            //this.emit("message", message);
        });
        this.decoder.on("mqttmessage", (message) => {
            this.MqttManager.publish(message.topic, message.value.toString());
            //this.emit("mqttmessage", message);
        });
        


    }

    async start() {
        await this.protocol.load();
        await this.alias.load();
        await this.MqttManager.connect();
        //console.log(JSON.stringify(this.protocol.definition,null,2));
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

            this.server.on("message", (data, info) => {
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
            client.send(data, this.port, this.host, (error) => {
                if (error) {
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
