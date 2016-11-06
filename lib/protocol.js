"use strict";

const fs = require("fs");
const EventEmitter = require("events");
const { parseString } = require("xml2js");
const Bitset = require("./bitset");

const PACKET_START = 253;
const PACKET_END   = 250;
const PACKET_PING  = 251;

class Protocol extends EventEmitter {
    constructor(filename) {
        super();

        this.filename = filename;
        this.definition = false;
        this.haveStart = false;
        this.clear();
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

    getPing() {
        return new Buffer([ PACKET_PING ]);
    }

    encode(message) {

    }

    _lookupClassName(id) {
        const c = this.definition.classes.filter((c) => c.id === id)[0];

        return c ? c.name : false;
    }

    _lookupNmtCommandName(id) {
        const c = this.definition.nmtMessages.filter((c) => c.id === id)[0];

        return c ? c.name : false;
    }

    _lookupNmtCommandVariables(name) {
        const c = this.definition.nmtMessages.filter((c) => c.name === name)[0];

        return c ? c.variables : [];
    }

    _lookupDirectionFlag(id) {
        const c = this.definition.defines.filter((c) => c.id === id && c.group === "DirectionFlag")[0];

        return c ? c.name : false;
    }

    _lookupModuleName(id) {
        const c = this.definition.modules.filter((c) => c.id === id)[0];

        return c ? c.name : false;
    }

    _lookupCommandName(id, moduleName) {
        let c;
        if (id >= 128) {
            c = this.definition.commands.filter((c) => c.id === id && c.module === moduleName)[0];
        } else {
            c = this.definition.commands.filter((c) => c.id === id && c.module === "")[0];
        }

        return c ? c.name : false;
    }

    _lookupCommandVariables(name, moduleName) {
        let c = this.definition.commands.filter((c) => c.name === name && c.module === moduleName)[0];

        if (!c) {
            c = this.definition.commands.filter((c) => c.name === name && c.module === "")[0];
        }

        return c ? c.variables : [];
    }

    _decodeInt(bitset, startBit, bitLength) {
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

    _decodeUint(bitset, startBit, bitLength) {
        return bitset.read(startBit, bitLength);
    }

    _decodeFloat(bitset, startBit, bitLength) {
        const value = this._decodeInt(bitset, startBit, bitLength);
        return value / 64;
    }

    _decodeAscii(bitset, startBit, bitLength) {
        let value = "";

        for (let n = 0; n < bitLength; n++) {
            const code = bitset.read(startBit + n, 8);
            value += String.fromCharCode(code);
        }

        return value;
    }

    _decodeHexstring(bitset, startBit, bitLength) {
        const value = "";
        const hex = [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F" ];

        for (let n = 0; n < bitLength; n++) {
            const code = bitset.read(startBit + n, 8);
            value += code >= hex.length ? "-" : hex[code];
        }

        return value;
    }

    _decode() {
        if (!this.definition) {
            throw new Error("No definition loaded");
        }

        const message = {};

        const className = this._lookupClassName((this.buffer[3] >> 1) & 0x0F);
        let commandName = "";
        let directionName = "";
        let moduleName = "";
        let id = 0;

        if (className === "nmt") {
            commandName = this._lookupNmtCommandName(this.buffer[2]);
        } else {
            directionName = this._lookupDirectionFlag(this.buffer[3] & 0x01);
            moduleName = this._lookupModuleName(this.buffer[2]);
            commandName = this._lookupCommandName(this.buffer[0], moduleName);
            id = this.buffer[1];
        }

        const length = this.buffer[6];
        const data = this.buffer.slice(7, 7 + length);

        message.className = className,
        message.commandName = commandName;

        if (className !== "nmt") {
            message.directionName = directionName;
            message.moduleName = moduleName;
            message.id = id;
        }

        message.variables = {};

        let variables = [];

        if (className === "nmt") {
            variables = this._lookupNmtCommandVariables(commandName);
        } else {
            variables = this._lookupCommandVariables(commandName, moduleName);
        }

        const bitset = new Bitset(length, data);

        for (const variable of variables) {
            let value = 0;

            if (variable.type === "int") {
                value = this._decodeInt(bitset, variable.startBit, variable.bitLength);
            } else if (variable.type === "float") {
                value = this._decodeFloat(bitset, variable.startBit, variable.bitLength);
            } else if (variable.type === "ascii") {
                value = this._decodeAscii(bitset, variable.startBit, variable.bitLength);
            } else if (variable.type === "hexstring") {
                value = this._decodeHexstring(bitset, variable.startBit, variable.bitLength);
            } else if (variable.type === "enum") {
                value = this._decodeUint(bitset, variable.startBit, variable.bitLength);
                value = variable.values.filter((v) => v.id === value).map((v) => v.name)[0];
            } else /* if (variable.type === "uint") */ {
                value = this._decodeUint(bitset, variable.startBit, variable.bitLength);
            }

            message.variables[variable.name] = { value: value, unit: variable.unit };
        }

        this.clear();
        this.emit("message", message);
    }

    add(data) {
        for (const byte of data.values()) {
            if (this.haveStart) {
                if (byte === PACKET_END && this.size === 15) {
                    this._decode();
                } else {
                    this._push(byte);
                }
            } else if (byte === PACKET_START) {
                this.clear();
                this.haveStart = true;
            }
        }
    }

    _push(byte) {
        this.buffer.writeUInt8(byte, this.size);
        this.size++;
    }

    clear() {
        this.size = 0;
        this.buffer = new Buffer(64);
        this.haveStart = false;
    }
};

module.exports = Protocol;
