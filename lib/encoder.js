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

        if (message.className == "NMT") {
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

        if (message.className == "NMT") {
            variableNodes = this.protocol.lookupNmtCommandVariables(message.commandName);
        } else {
            variableNodes = this.protocol.getCommandVariables(message.commandName, message.moduleName);
        }

        for (const n = 0; n < variableNodes.length; n++) {
            value = message[variableNodes[n].name];

            if (value === "") {
                continue;
            }

            startBit = variableNodes[n].startBit;
            bitLength = variableNodes[n].bitLength;
            type = variableNodes[n].type;

            if (type == "int") {
                this.protocol.encodeInt(databits, startBit, bitLength, value);
            } else if (type == "float") {
                this.protocol.encodeFloat(databits, startBit, bitLength, value);
            } else if (type == "ascii") {
                this.protocol.encodeAscii(databits, startBit, bitLength, value);
                bitLength = value.length * 8;
            } else if (type == "hexstring") {
                this.protocol.encodeHexstring(databits, startBit, bitLength, value);
                bitLength = value.length * 4;
            } else if (type == "enum") {
                value = variableNodes[n].SelectChild("name", value).GetAttributeValue("id");
                this.protocol.encodeUint(databits, startBit, bitLength, value);
            } else /* if (type == "uint") */ {
                this.protocol.encodeUint(databits, startBit, bitLength, value);
            }

            if (highestBit < startBit + bitLength) {
                highestBit = startBit + bitLength;
            }
        }

        //LOG.Debug(databits.ToDebugString());

        const length = std::min((int)ceil((float)highestBit / 8.0f), 8);

        data[5] = 1;
        data[6] = 0;

        data[7] = length;

        for (const n = 0; n < 8; n++) {
            data[8 + n] = databits.GetBytes()[n];
        }

        data[16] = PACKET_END;

        //LOG.Debug("Bytes: " + data.ToDebugString());
        net::Manager::Instance()->SendTo(this->client_id_, data);
    } else if (message->GetType() == broker::Message::CAN_RAW_MESSAGE)
    {

        std::string* payload_str;
	payload_str = static_cast<std::string*>(message->GetPayload().get());
	std::string line = *payload_str;
        common::Byteset data(17);
        //LOG.Info("Got "+ line + "end");

        data[0] = PACKET_START;
        std::string value = line.substr(4,2);
	//LOG.Info("<"+ value + ">");
	data[4] = common::FromHex(value);
	//LOG.Info("id1: " + value + " data: ");//+ data[1]);

	value = line.substr(6,2);
	//LOG.Info("<"+ value + ">");

	data[3] = common::FromHex(value);
	//LOG.Info("id2: " + value + " data: ");//+ data[2]);

	value = line.substr(8,2);
	data[2] = common::FromHex(value);
	//LOG.Info("id3: " + value + " data: ");//+ data[3]);

	value = line.substr(10,2);
	data[1] = common::FromHex(value);
	//LOG.Info("id4: " + value + " data: ");//+ data[4]);

	value = line.substr(13,1);
	data[5] = common::FromHex(value);
	//LOG.Info("1: " + value + " data: ");//+ data[5]);

	value = line.substr(15,1);
	data[6] = common::FromHex(value);
	//LOG.Info("1: " + value + " data: ");//+ data[6]);

        unsigned char length = 0;
        unsigned char index = 0;
        while (length < 8 && index + 16 < (unsigned char)line.length())
        {
            value = line.substr(index+17,2);
	    data[8+length] = common::FromHex(value);
	    //LOG.Info("data: " + value + " data: ");//+ data[6]);
	    index += 3;
	    length++;
        }

        data[7] = length;
        data[16] = PACKET_END;


        //LOG.Info("Bytes: " + data.ToDebugString());
        net::Manager::Instance()->SendTo(this->client_id_, data);
    }

        return new Buffer(); // TODO
    }

    getPing() {
        return new Buffer([ this.protocol.PACKET_PING ]);
    }
}

module.exports = Encoder;
