"use strict";

const Bitset = require("./bitset");

class Encoder {
    constructor(protocol, alias) {
        this.protocol = protocol;
        this.alias = alias;
    }

    encode(message) {
        const data = Buffer.alloc(17);

        data[0] = this.protocol.PACKET_START;

        const classId = this.protocol.resolveClassId(message.className);
        data[4] = classId << 1;

        if (message.className === "NMT") {
            const commandId = this.protocol.resolveNmtCommandId(message.commandName);
            data[3] = commandId;
        } else {
            const directionFlag = this.protocol.resolveDirectionFlag(message.directionName);
            data[4] |= (directionFlag & 0x01);

            const moduleId = this.protocol.resolveModuleId(message.moduleName);
            data[3] = moduleId;

            data[2] = message.id;

            const commandId = this.protocol.resolveCommandId(message.commandName, message.moduleName);
            data[1] = commandId;
        }

        let highestBit = 0;
        const databits = new Bitset(8);

        let variableNodes;
        let startBit;
        let bitLength;
        let type;
        let value;

        if (message.className === "NMT") {
            variableNodes = this.protocol.lookupNmtCommandVariables(message.commandName);
        } else {
            variableNodes = this.protocol.lookupCommandVariables(message.commandName, message.moduleName);
        }

        for (let n = 0; n < variableNodes.length; n++) {
            value = message[variableNodes[n].name];

            if (value === "") {
                continue;
            }

            startBit = variableNodes[n].startBit;
            bitLength = variableNodes[n].bitLength;
            type = variableNodes[n].type;

            if (type === "int") {
                this.protocol.encodeInt(databits, startBit, bitLength, value);
            } else if (type === "float") {
                this.protocol.encodeFloat(databits, startBit, bitLength, value);
            } else if (type === "ascii") {
                this.protocol.encodeAscii(databits, startBit, bitLength, value);
                bitLength = value.length * 8;
            } else if (type === "hexstring") {
                this.protocol.encodeHexstring(databits, startBit, bitLength, value);
                bitLength = value.length * 4;
            } else if (type === "enum") {
                value = variableNodes[n].find((n) => n.name === value).id;
                this.protocol.encodeUint(databits, startBit, bitLength, value);
            } else /* if (type == "uint") */ {
                this.protocol.encodeUint(databits, startBit, bitLength, value);
            }

            if (highestBit < startBit + bitLength) {
                highestBit = startBit + bitLength;
            }
        }

        const length = Math.min(Math.ceil(highestBit / 8.0), 8);

        data[5] = 1;
        data[6] = 0;

        data[7] = length;

        for (let n = 0; n < 8; n++) {
            data[8 + n] = databits.getBytes()[n];
        }

        data[16] = this.protocol.PACKET_END;
        console.log(`Encoded message: ${JSON.stringify(data, null, 2)}`);

        return data;
    }

    getPing() {
        return new Buffer([ this.protocol.PACKET_PING ]);
    }
}

module.exports = Encoder;
