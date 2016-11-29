"use strict";

const fs = require("fs");
const { parseString } = require("xml2js");

class Protocol {
    constructor(filename) {
        this.PACKET_START = 253;
        this.PACKET_END = 250;
        this.PACKET_PING = 251;

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
                        startBit: parseInt(varitem.$.start_bit, 10),
                        bitLength: parseInt(varitem.$.bit_length, 10),
                        unit: varitem.$.unit || "",
                        values: []
                    };

                    if (varitem.value) {
                        for (const value of varitem.value) {
                            variable.values.push({
                                id: parseInt(value.$.id, 10),
                                name: value.$.name
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
                name: item.$.name,
                instances: []
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
        const c = this.definition.classes.find((c) => c.id === id);

        return c ? c.name : false;
    }

    resolveClassId(className) {
        const c = this.definition.classes.find((c) => c.name === className);

        return c ? c.id : false;
    }

    lookupCommandName(id, moduleName) {
        let c;
        if (id >= 128) {
            c = this.definition.commands.find((c) => c.id === id && c.module === moduleName);
        } else {
            c = this.definition.commands.find((c) => c.id === id && c.module === "");
        }

        return c ? c.name : false;
    }

    resolveCommandId(commandName, moduleName) {
        let c = this.definition.commands.find((c) => c.name === commandName && c.module === moduleName);

        if (!c) {
            c = this.definition.commands.find((c) => c.name === commandName);
        }

        return c.id;
    }

    lookupNmtCommandName(id) {
        const c = this.definition.nmtMessages.find((c) => c.id === id);

        return c ? c.name : false;
    }

    resolveNmtCommandId(commandName) {
        const c = this.definition.nmtMessages.find((c) => c.name === commandName);

        return c ? c.id : false;
    }


    lookupDefineId(name, group) {
        const d = this.definition.defines.find((d) => d.name === name && d.group === group);

        return d.id;
    }

    lookupDirectionFlag(id) {
        const c = this.definition.defines.find((c) => c.id === id && c.group === "DirectionFlag");

        return c ? c.name : false;
    }

    resolveDirectionFlag(directionName) {
        const c = this.definition.defines.find((c) => c.name === directionName && c.group === "DirectionFlag");

        return c ? c.id : false;
    }

    lookupModuleName(id) {
        const c = this.definition.modules.find((c) => c.id === id);

        return c ? c.name : false;
    }

    resolveModuleId(moduleName) {
        const c = this.definition.modules.find((c) => c.name === moduleName);

        return c ? c.id : false;
    }

    lookupModuleInstances(moduleNameId, moduleId) {
        let m = {};
        if (Number.isInteger(moduleNameId)) {
            m = this.definition.modules.find((m) => m.id === moduleNameId);
        } else {
            m = this.definition.modules.find((m) => m.name === moduleNameId);
        }
        const instances = m.instances.filter((i) => i.id === moduleId);
        return instances;
    }

    lookupModuleInstance(moduleNameId, moduleId, variables = null) {
        let m = {};
        if (Number.isInteger(moduleNameId)) {
            m = this.definition.modules.find((m) => m.id === moduleNameId);
        } else {
            m = this.definition.modules.find((m) => m.name === moduleNameId);
        }
        const instances = m.instances.filter((i) => i.id === moduleId);
        //console.log("Module: ",m);
        //console.log("Inst: ",instances);
        let i;
        //console.log("variables: ",variables);
        
        for (let j = 0; j < instances.length; j++) {
            if (instances[j].specific) {
                let match = true;
                //console.log("Search in : ",instances[j]);
                for (const propertyName of Object.keys(instances[j].specific)) {
                
                    if (!variables[propertyName]) {
                        //console.log("Missing variable: ", propertyName);
                        //console.log("All var: ", JSON.stringify(instances[j].specific));
                    } else if (instances[j].specific[propertyName].toString() !== variables[propertyName].value.toString()) {
                        //console.log("did not match  : ",instances[j].specific[propertyName], " vs ", variables[propertyName].value);
                        match = false;
                    }
                }

                if (match === true) {
                    i = instances[j];
                    break;
                }
            } else {
                i = instances[0];
                break;
            }
        }
        return i ? i : false;
    }

    lookupMessage(alias) {
        for (const module of this.definition.modules) {
            for (const instance of module.instances) {
                if (instance.name === alias) {
                    const message = {};
                    // message {"className":"act","commandName":"Pwm","directionName":"From_Owner","moduleName":"hwPWM","id":10,"variables":{"Channel":{"value":2,"unit":""},"Value":{"value":0,"unit":""}}}
                    message.className = module.class;
                    message.moduleName = module.name;
                    message.directionName = "To_Owner";
                    message.id = instance.id;
                    message.variables = {};
                    for (const propertyName of Object.keys(instance.specific)) {
                        message.variables[propertyName] = instance.specific[propertyName];
                    }
                    //message.variables = instance.specific.slice() || {};
                    // console.log("Found alias: ", alias);
                    // console.log("Message from MQTT2: ", JSON.stringify(message));

                    return message;
                }
            }
        }
        console.log("Could not find alias: ", alias);

        return null;
    }

    appendVariablesToMessage(message, command, variables) {
        message.commandName = command;

        for (const variable of Object.keys(variables)) {
            message.variables[variable] = variables[variable];
        }
        console.log("Got: ", JSON.stringify(message));

        return message;
        // console.log("Message from MQTT: ", JSON.stringify(message));
    }

    appendModuleInstance(name, moduleName, moduleId, specific) {
        const m = this.definition.modules.find((m) => m.name === moduleName);
        const instance = {
            name: name,
            id: moduleId,
            specific: specific
        };

        m.instances.push(instance);
    }

    lookupCommandVariables(name, moduleName) {
        let c = this.definition.commands.find((c) => c.name === name && c.module === moduleName);

        if (!c) {
            c = this.definition.commands.find((c) => c.name === name && c.module === "");
        }

        return c ? c.variables : [];
    }

    lookupNmtCommandVariables(name) {
        const c = this.definition.nmtMessages.find((c) => c.name === name);

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

    encodeInt(bitset, startBit, bitLength, value) {
        let rawBitValue = 0;
        const rawValue = parseInt(value, 10);

        rawBitValue = rawValue;

        if (rawValue < 0) {
            let mask = 0;

            for (let n = 0; n < bitLength; n++) {
                mask += (1 << n);
            }

            rawBitValue = (~(-rawValue)) & mask;
        }

        bitset.write(startBit, bitLength, rawBitValue);
    }

    decodeUint(bitset, startBit, bitLength) {
        return bitset.read(startBit, bitLength);
    }

    encodeUint(bitset, startBit, bitLength, value) {
        const rawBitValue = parseInt(value, 10);

        bitset.write(startBit, bitLength, rawBitValue);
    }

    decodeFloat(bitset, startBit, bitLength) {
        const value = this.decodeInt(bitset, startBit, bitLength);

        return value / 64;
    }

    encodeFloat(bitset, startBit, bitLength, value) {
        const intValue = parseFloat(value) * 64;

        this.encodeInt(bitset, startBit, bitLength, intValue);
    }

    decodeAscii(bitset, startBit, bitLength) {
        let value = "";

        for (let n = 0; n < bitLength; n += 8) {
            const code = bitset.read(startBit + n, 8);

            value += String.fromCharCode(code);
        }

        return value;
    }

    encodeAscii(bitset, startBit, bitLength, value) {
        for (let n = 0; n < bitLength; n += 8) {
            if (n / 8 >= value.length) {
                break;
            }

            bitset.write(startBit + n, 8, value.charCodeAt(n / 8));
        }
    }

    decodeHexstring(bitset, startBit, bitLength) {
        let value = "";
        const hex = [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F" ];

        for (let n = 0; n < bitLength; n += 4) {
            const code = bitset.read(startBit + n, 4);

            value += code >= hex.length ? "-" : hex[code];
        }

        return value;
    }

    encodeHexstring(bitset, startBit, bitLength, value) {
        let asciiValue;

        for (let n = 0; n < bitLength; n += 4) {
            asciiValue = value.toUpperCase().charCodeAt(n / 4);

            if (asciiValue >= 48 && asciiValue <= 57) {
                bitset.write(startBit + n, 4, asciiValue - 48);
            } else if (asciiValue >= 65 && asciiValue <= 70) {
                bitset.write(startBit + n, 4, asciiValue - 65 + 10);
            } else {
                throw new Error(`This is not an hex string, ${value}`);
            }
        }
    }
}

module.exports = Protocol;
