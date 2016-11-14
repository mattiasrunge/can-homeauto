"use strict";

const fs = require("fs");

class Alias {
    constructor(filename, protocol) {
        this.protocol = protocol;
        this.filename = filename;
    }

    load() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filename, (error, data) => {
                if (error) {
                    return reject(error);
                }

                this._parseAlias(data.toString());
                resolve();
            });
        });
    }

    _parseAlias(data) {
        const regexp = /([A-Za-z0-9_]*)=(.*)/g;
        const regexp2 = /([A-Za-z0-9_]*)=(.*)/;
        const matchesArray = data.match(regexp);

        for (let i = 0; i < matchesArray.length; i++) {
            const match = matchesArray[i].match(regexp2);
            const parseddata = JSON.parse(match[2]);
            const group = parseddata.group;
            const name = match[1];

            if (group === false) {
                const modName = parseddata.module_name.toString();
                const modId = parseInt(parseddata.module_id, 10);
                const specific = parseddata.specific;
                this.protocol.appendModuleInstance(name, modName, modId, specific);
            }
        }
    }
}

module.exports = Alias;
