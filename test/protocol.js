"use strict";

/* global describe it */

const path = require("path");
const { assert } = require("chai");
const Protocol = require("../lib/protocol");
const Bitset = require("../lib/bitset");

const protocol = new Protocol(path.join(__dirname, "..", "protocol.xml"));

describe("Protocol", () => {
    it("shall load without error", () => protocol.load());

    it("shall lookup some class names", () => {
        assert.equal(protocol.lookupClassName(0), "nmt");
        assert.equal(protocol.lookupClassName(11), "mnmt");
        assert.equal(protocol.lookupClassName(12), "act");
        assert.equal(protocol.lookupClassName(13), "sns");
        assert.equal(protocol.lookupClassName(14), "def");
        assert.equal(protocol.lookupClassName(15), "tst");
        assert.equal(protocol.lookupClassName(10), "chn");
    });

    it("shall resolve some class ids", () => {
        assert.equal(protocol.resolveClassId("nmt"), 0);
        assert.equal(protocol.resolveClassId("mnmt"), 11);
        assert.equal(protocol.resolveClassId("act"), 12);
        assert.equal(protocol.resolveClassId("sns"), 13);
        assert.equal(protocol.resolveClassId("def"), 14);
        assert.equal(protocol.resolveClassId("tst"), 15);
        assert.equal(protocol.resolveClassId("chn"), 10);
    });

    it("shall lookup some command names", () => {
        assert.equal(protocol.lookupCommandName(0), "List");
        assert.equal(protocol.lookupCommandName(2), "Debug");
        assert.equal(protocol.lookupCommandName(128, "power"), "setEnergy");
    });

    it("shall resolve some command ids", () => {
        assert.equal(protocol.resolveCommandId("List"), 0);
        assert.equal(protocol.resolveCommandId("Debug"), 2);
        assert.equal(protocol.resolveCommandId("setEnergy", "power"), 128);
    });

    it("shall lookup some nmt command names", () => {
        assert.equal(protocol.lookupNmtCommandName(0), "Time");
        assert.equal(protocol.lookupNmtCommandName(4), "Reset");
    });

    it("shall resolve some nmt command ids", () => {
        assert.equal(protocol.resolveNmtCommandId("Time"), 0);
        assert.equal(protocol.resolveNmtCommandId("Reset"), 4);
    });

    it("shall lookup some define ids", () => {
        assert.equal(protocol.lookupDefineId("From_Owner", "DirectionFlag"), 1);
        assert.equal(protocol.lookupDefineId("To_Owner", "DirectionFlag"), 0);
    });

    it("shall lookup direction flag", () => {
        assert.equal(protocol.lookupDirectionFlag(1), "From_Owner");
        assert.equal(protocol.lookupDirectionFlag(0), "To_Owner");
    });

    it("shall resolve direction flag", () => {
        assert.equal(protocol.resolveDirectionFlag("From_Owner"), 1);
        assert.equal(protocol.resolveDirectionFlag("To_Owner"), 0);
    });

    it("shall lookup some module names", () => {
        assert.equal(protocol.lookupModuleName(0), "Debug");
        assert.equal(protocol.lookupModuleName(1), "Default");
        assert.equal(protocol.lookupModuleName(3), "DS18x20");
        assert.equal(protocol.lookupModuleName(6), "BusVoltage");
    });

    it("shall resolve some module ids", () => {
        assert.equal(protocol.resolveModuleId("Debug"), 0);
        assert.equal(protocol.resolveModuleId("Default"), 1);
        assert.equal(protocol.resolveModuleId("DS18x20"), 3);
        assert.equal(protocol.resolveModuleId("BusVoltage"), 6);
    });

    it("shall lookup some command variables", () => {
        const variables1 = protocol.lookupCommandVariables("List");
        assert.deepEqual(variables1, [
            {
                name: "HardwareId",
                type: "uint",
                startBit: 0,
                bitLength: 32,
                unit: "",
                values: []
            },
            {
                name: "NumberOfModules",
                type: "uint",
                startBit: 32,
                bitLength: 8,
                unit: "",
                values: []
            },
            {
                name: "SequenceNumber",
                type: "uint",
                startBit: 40,
                bitLength: 8,
                unit: "",
                values: []
            }
        ]);

        const variables2 = protocol.lookupCommandVariables("Benchmark", "Debug");
        assert.deepEqual(variables2, [
            {
                name: "Byte0",
                type: "uint",
                startBit: 0,
                bitLength: 8,
                unit: "",
                values: []
            },
            {
                name: "Byte1",
                type: "uint",
                startBit: 8,
                bitLength: 8,
                unit: "",
                values: []
            },
            {
                name: "Byte2",
                type: "uint",
                startBit: 16,
                bitLength: 8,
                unit: "",
                values: []
            },
            {
                name: "Byte3",
                type: "uint",
                startBit: 24,
                bitLength: 8,
                unit: "",
                values: []
            },
            {
                name: "Byte4",
                type: "uint",
                startBit: 32,
                bitLength: 8,
                unit: "",
                values: []
            },
            {
                name: "Byte5",
                type: "uint",
                startBit: 40,
                bitLength: 8,
                unit: "",
                values: []
            },
            {
                name: "Byte6",
                type: "uint",
                startBit: 48,
                bitLength: 8,
                unit: "",
                values: []
            },
            {
                name: "Byte7",
                type: "uint",
                startBit: 56,
                bitLength: 8,
                unit: "",
                values: []
            }
        ]);
    });

    it("shall lookup some nmt command variables", () => {
        const variables1 = protocol.lookupNmtCommandVariables("Bios_Start");
        assert.deepEqual(variables1, [
            {
                name: "BiosVersion",
                type: "uint",
                startBit: 0,
                bitLength: 16,
                unit: "",
                values: []
            },
            {
                name: "HasApplication",
                type: "uint",
                startBit: 16,
                bitLength: 8,
                unit: "",
                values: []
            },
            {
                name: "DeviceType",
                type: "enum",
                startBit: 24,
                bitLength: 8,
                unit: "",
                values: [
                    { id: 0, name: "unknown" },
                    { id: 1, name: "atmega8" },
                    { id: 2, name: "atmega48" },
                    { id: 3, name: "atmega88" },
                    { id: 4, name: "atmega168" },
                    { id: 5, name: "atmega328p" }
                ]
            },
            {
                name: "HardwareId",
                type: "uint",
                startBit: 32,
                bitLength: 32,
                unit: "",
                values: []
            }
        ]);

        const variables2 = protocol.lookupNmtCommandVariables("Pgm_Data");
        assert.deepEqual(variables2, [
            {
                name: "Offset",
                type: "uint",
                startBit: 0,
                bitLength: 16,
                unit: "",
                values: []
            },
            {
                name: "Data",
                type: "uint",
                startBit: 16,
                bitLength: 48,
                unit: "",
                values: []
            }
        ]);
    });

    const encodeDecode = (type, startBit, bitLength, value) => {
        const bitset = new Bitset(((startBit + bitLength) * 8) + 1);
        protocol[`encode${type}`](bitset, startBit, bitLength, value);
        const decodedValue = protocol[`decode${type}`](bitset, startBit, bitLength);

        if (type === "Float") {
            assert.closeTo(decodedValue, value, 0.1);
        } else {
            assert.equal(decodedValue, value);
        }
    };

    it("shall encode and decode an int", () => {
        for (let n = -128; n < 128; n++) {
            encodeDecode("Int", 0, 32, n);
        }
    });

    it("shall encode and decode an uint", () => {
        for (let n = 0; n < 256; n++) {
            encodeDecode("Uint", 0, 32, n);
        }
    });

    it("shall encode and decode an float", () => {
        for (let n = -128; n < 128; n += 0.1) {
            encodeDecode("Float", 0, 32, n);
        }
    });

    it("shall encode and decode an ascii string", () => {
        encodeDecode("Ascii", 0, 7 * 8, "Test123");
    });

    it("shall encode and decode an hex string", () => {
        encodeDecode("Hexstring", 0, 1 * 4, "0");
        encodeDecode("Hexstring", 0, 1 * 4, "F");
        encodeDecode("Hexstring", 0, 6 * 4, "0123EF");
        encodeDecode("Hexstring", 0, 8 * 4, "FFFFFFFF");
        encodeDecode("Hexstring", 0, 10 * 4, "0000000000");
    });
});
