module.exports = {
    
    clients : {},
    socketRef : {},
    
    hexToRgb: function (hex, a) {
        //default value
        if (typeof(a)==='undefined') a = 1;
        if (hex.charAt(0) == '#') hex = hex.substr(1);
        
        var bigint = parseInt(hex, 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        
        return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    },
    
    jsDateToMysqlDatetime: function () {
        var d = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        return d;
    },
    
    mysqlDatetimeToJsDate: function (datetime) {
        var t = datetime.split(/[- :]/);
        var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
        
        return d;
    },
    
    getSocketByEmail: function(email){
        var result = [];
        for(var key in this.socketRef){
            if(this.socketRef[key] == email){
                result.push(key);
            }
        }
        return result.length == 0 ? false : result;
    }
};

/*
    getObjectKey: function(value){
        for(var key in this){
            if(this[key] == value){
                return key;
            }
        }
        return null;
    }
*/