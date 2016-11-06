"use strict";

class Encoder {
    constructor(protocol) {
        this.protocol = protocol;
    }

    encode(message) {
        return new Buffer(); // TODO
    }

    getPing() {
        return new Buffer([ this.protocol.PACKET_PING ]);
    }
}

module.exports = Encoder;
