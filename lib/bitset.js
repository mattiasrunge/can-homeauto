"use strict";

class Bitset {
    constructor(size, buffer = null) {
        this.count = size * 8;
        this.bytes = buffer || Buffer.alloc(size);
    }

    getCount() {
        return this.count;
    }

    getBytes() {
        return this.bytes;
    }

    read(position, length) {
        let value = 0;

        for (let index = 0; index < length; index++) {
            value = (value << 1) | this.get(position + index);
        }

        return value >>> 0;
    }

    write(position, length, value) {
        for (let index = 0; index < length; index++) {
            if (value & 0x01) {
                this.set(position + (length - index - 1));
            } else {
                this.unset(position + (length - index - 1));
            }

            value = (value >> 1);
        }
    }

    set(position) {
        if (position >= this.count) {
            return -1;
        }

        this.bytes[Math.floor(position / 8)] |= (0x00000001 << (7 - (position % 8)));

        return 0;
    }

    unset(position) {
        if (position >= this.count) {
            return -1;
        }

        this.bytes[Math.floor(position / 8)] &= ~(0x00000001 << (7 - (position % 8)));

        return 0;
    }

    get(position) {
        if (position >= this.count) {
            return -1;
        }

        return (this.bytes[Math.floor(position / 8)] & (0x00000001 << (7 - (position % 8))) ? 1 : 0);
    }
}

module.exports = Bitset;
