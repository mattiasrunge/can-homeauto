"use strict";

const fs = require("fs");
const { parseString } = require("xml2js");

class Protocol {
    constructor(filename) {
        this.PACKET_START = 253;
        this.PACKET_END   = 250;
        this.PACKET_PING  = 251;

        this.filename = filename;
        this.definition = false;
    }

    load() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filename, (error, data) => {
                if (error) {
                    return reject(error);
                }

                parseString(data.toString(), (error, result) => {
                    if (error) {
                        return reject(error);
                    }

                    this._parseDefinition(result);
                    resolve();
                });
            });
        });
    }

    _parseDefinition(data) {
        const root = data.root;
        const classes = [];
        const commands = [];
        const defines = [];
        const nmtMessages = [];
        const modules = [];

        for (const item of root.classes[0].class) {
            classes.push({
                id: parseInt(item.$.id, 10),
                name: item.$.name
            });
        }

        for (const item of root.commands[0].command) {
            const command = {
                id: parseInt(item.$.id, 10),
                name: item.$.name,
                type: item.$.type,
                module: item.$.module,
                variables: []
            };

            if (item.variables && typeof item.variables[0] === "object") {
                for (const varitem of item.variables[0].variable) {
                    const variable = {
                        name: varitem.$.name,
                        type: varitem.$.type,
                        startBit: parseInt(varitem.$.start_bit, 10),
                        bitLength: parseInt(varitem.$.bit_length, 10),
                        unit: varitem.$.unit,
                        values: []
                    };

                    if (varitem.value) {
                        for (const value of varitem.value) {
                            variable.values.push({
                                id: parseInt(value.$.id, 10),
                                name: value.$.name,
                                unit: value.$.unit
                            });
                        }
                    }

                    command.variables.push(variable);
                }
            }

            commands.push(command);
        }

        for (const item of root.defines[0].define) {
            defines.push({
                id: parseInt(item.$.id, 10),
                group: item.$.group,
                name: item.$.name
            });
        }

        for (const item of root.nmt_messages[0].nmt_message) {
            const message = {
                id: parseInt(item.$.id, 10),
                name: item.$.name,
                variables: []
            };

            if (item.variables) {
                for (const varitem of item.variables[0].variable) {
                    const variable = {
                        name: varitem.$.name,
                        type: varitem.$.type,
                        startBit: parseInt(varitem.$.start_bit),
                        bitLength: parseInt(varitem.$.bit_length),
                        unit: varitem.$.unit,
                        values: []
                    };

                    if (varitem.value) {
                        for (const value of varitem.value) {
                            variable.values.push({
                                id: parseInt(value.$.id, 10),
                                name: value.$.name,
                                unit: value.$.unit
                            });
                        }
                    }

                    message.variables.push(variable);
                }
            }

            nmtMessages.push(message);
        }

        for (const item of root.modules[0].module) {
            modules.push({
                id: parseInt(item.$.id, 10),
                class: item.$.class,
                name: item.$.name
            });
        }

        this.definition = {
            classes: classes,
            commands: commands,
            defines: defines,
            nmtMessages: nmtMessages,
            modules: modules
        };
    }

    lookupClassName(id) {
        const c = this.definition.classes.filter((c) => c.id === id)[0];

        return c ? c.name : false;
    }

    lookupNmtCommandName(id) {
        const c = this.definition.nmtMessages.filter((c) => c.id === id)[0];

        return c ? c.name : false;
    }

    lookupNmtCommandVariables(name) {
        const c = this.definition.nmtMessages.filter((c) => c.name === name)[0];

        return c ? c.variables : [];
    }

    lookupDirectionFlag(id) {
        const c = this.definition.defines.filter((c) => c.id === id && c.group === "DirectionFlag")[0];

        return c ? c.name : false;
    }

    lookupModuleName(id) {
        const c = this.definition.modules.filter((c) => c.id === id)[0];

        return c ? c.name : false;
    }

    lookupCommandName(id, moduleName) {
        let c;
        if (id >= 128) {
            c = this.definition.commands.filter((c) => c.id === id && c.module === moduleName)[0];
        } else {
            c = this.definition.commands.filter((c) => c.id === id && c.module === "")[0];
        }

        return c ? c.name : false;
    }

    lookupCommandVariables(name, moduleName) {
        let c = this.definition.commands.filter((c) => c.name === name && c.module === moduleName)[0];

        if (!c) {
            c = this.definition.commands.filter((c) => c.name === name && c.module === "")[0];
        }

        return c ? c.variables : [];
    }

    decodeInt(bitset, startBit, bitLength) {
        const sign = bitset.get(startBit) === 1;
        const raw = bitset.read(startBit, bitLength);

        let value = raw;

        if (sign) {
            let mask = 0;

            for (let n = 0; n < bitLength; n++) {
                mask += (1 << n);
            }

            value = -((~raw) & mask);
        }

        return value;
    }

    decodeUint(bitset, startBit, bitLength) {
        return bitset.read(startBit, bitLength);
    }

    decodeFloat(bitset, startBit, bitLength) {
        const value = this.decodeInt(bitset, startBit, bitLength);
        return value / 64;
    }

    decodeAscii(bitset, startBit, bitLength) {
        let value = "";

        for (let n = 0; n < bitLength; n++) {
            const code = bitset.read(startBit + n, 8);
            value += String.fromCharCode(code);
        }

        return value;
    }

    decodeHexstring(bitset, startBit, bitLength) {
        const value = "";
        const hex = [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F" ];

        for (let n = 0; n < bitLength; n++) {
            const code = bitset.read(startBit + n, 8);
            value += code >= hex.length ? "-" : hex[code];
        }

        return value;
    }
};

module.exports = Protocol;
