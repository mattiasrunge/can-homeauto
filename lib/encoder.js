"use strict";

class Encoder {
    constructor(protocol, alias) {
        this.protocol = protocol;
        this.alias = alias;
    }

    encode(message) {
        return new Buffer(); // TODO
    }

    getPing() {
        return new Buffer([ this.protocol.PACKET_PING ]);
    }
}

module.exports = Encoder;
