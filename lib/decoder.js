"use strict";

const EventEmitter = require("events");
const Bitset = require("./bitset");

class Decoder extends EventEmitter {
    constructor(protocol, alias) {
        super();

        this.protocol = protocol;
        this.alias = alias;
        this.haveStart = false;
        this.clear();
    }

    addData(data) {
        for (const byte of data.values()) {
            if (this.haveStart) {
                if (byte === this.protocol.PACKET_END && this.size === 15) {
                    this._decode();
                } else {
                    this._push(byte);
                }
            } else if (byte === this.protocol.PACKET_START) {
                this.clear();
                this.haveStart = true;
            }
        }
    }

    _push(byte) {
        this.buffer.writeUInt8(byte, this.size);
        this.size++;
    }

    _decode() {
        const message = {};

        const className = this.protocol.lookupClassName((this.buffer[3] >> 1) & 0x0F);
        let commandName = "";
        let directionName = "";
        let moduleName = "";
        let instance = "";
        let id = 0;

        if (className === "nmt") {
            commandName = this.protocol.lookupNmtCommandName(this.buffer[2]);
        } else {
            directionName = this.protocol.lookupDirectionFlag(this.buffer[3] & 0x01);
            moduleName = this.protocol.lookupModuleName(this.buffer[2]);
            commandName = this.protocol.lookupCommandName(this.buffer[0], moduleName);
            id = this.buffer[1];
        }

        const length = this.buffer[6];
        const data = this.buffer.slice(7, 7 + length);

        message.className = className;
        message.commandName = commandName;

        if (className !== "nmt") {
            message.directionName = directionName;
            message.moduleName = moduleName;
            message.id = id;
            message.instance = "";
        }

        message.variables = {};

        let variables = [];

        if (className === "nmt") {
            variables = this.protocol.lookupNmtCommandVariables(commandName);
        } else {
            variables = this.protocol.lookupCommandVariables(commandName, moduleName);
        }

        const bitset = new Bitset(length, data);

        for (const variable of variables) {
            let value = 0;

            if (variable.type === "int") {
                value = this.protocol.decodeInt(bitset, variable.startBit, variable.bitLength);
            } else if (variable.type === "float") {
                value = this.protocol.decodeFloat(bitset, variable.startBit, variable.bitLength);
            } else if (variable.type === "ascii") {
                value = this.protocol.decodeAscii(bitset, variable.startBit, variable.bitLength);
            } else if (variable.type === "hexstring") {
                value = this.protocol.decodeHexstring(bitset, variable.startBit, variable.bitLength);
            } else if (variable.type === "enum") {
                value = this.protocol.decodeUint(bitset, variable.startBit, variable.bitLength);
                value = variable.values.filter((v) => v.id === value).map((v) => v.name)[0];
            } else /* if (variable.type === "uint") */ {
                value = this.protocol.decodeUint(bitset, variable.startBit, variable.bitLength);
            }

            message.variables[variable.name] = { value: value, unit: variable.unit };
        }
        if (className !== "nmt") {
            instance = this.protocol.lookupModuleInstance(this.buffer[2], this.buffer[1], message.variables);
            message.instance = instance.name;
        }
        this.clear();
        this.emit("message", message);

        /* Find alias and emit mqtt message */
        if (instance) {
            for (const propertyName of Object.keys(message.variables)) {
                if (!instance.specific[propertyName]) {
                    let topic = `CAN/${instance.name}/`;

                    if (propertyName === "Value") {
                        topic += message.commandName;
                    } else {
                        topic += propertyName;
                    }

                    const value = message.variables[propertyName].value;
                    // console.log("MQTT: Topic:", topic, "\t\t" , value);
                    const mqttmessage = {};
                    mqttmessage.topic = topic;
                    mqttmessage.value = value;
                    this.emit("mqttmessage", mqttmessage);
                }
            }
        }
    }

    clear() {
        this.size = 0;
        this.buffer = new Buffer(64);
        this.haveStart = false;
    }
}

module.exports = Decoder;
