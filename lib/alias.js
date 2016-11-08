"use strict";

const fs = require("fs");

class Alias {
    constructor(filename, protocol) {
        this.protocol = protocol;
        this.filename = filename;
    }

    load() {
      return new Promise((fulfill, reject) => {
            fs.readFile(this.filename, (error,data) => {
                if (error) {
                    return reject(error);
                }
                this._parseAlias(data.toString());
                fulfill();
            });
      });
    }

    _parseAlias(data) {
        var regexp = /([A-Za-z0-9_]*)=(.*)/g;
        var regexp2 = /([A-Za-z0-9_]*)=(.*)/;
        var matches_array = data.match(regexp);
        const modules = [];
        for(var i=0; i<matches_array.length; i++) {
            var match= matches_array[i].match(regexp2);
            var parseddata = JSON.parse(match[2]);
            var group = parseddata['group'] ;
            var name = match[1];
            if (group == false)
            {
                var mod_name =  parseddata['module_name'].toString();
                var mod_id = parseInt(parseddata['module_id']);
                var specific = parseddata['specific'];
                this.protocol.appendModuleInstance(name,mod_name,mod_id, specific); 
            } else {
                
            }
        }
    }
};

module.exports = Alias;
