

/**
 * TODO
 * 
 * - User input str to Hex array (correct encoding)
 * - 
 * 
 * 
 * 
 */

/**< Return true if str is a valid hex string (e.g. '0x123', '0X1a2B' 'FF')
 * @param str           String to check whether it is a valid hex string
*/
function isValidHexStr(str) {
    return Boolean(str.match("(0x|0X)*[0-9a-fA-F]"));
}

/**< Return true if str is valid hex characters and of the correct length (.e.g. '1ef', 'aaaa')
 * @param str           String to check whether it is a valid hex string
 * @param expected_len   Expected length
*/
function isValidHexChars(str, expected_len) {
    return Boolean(str.match("[0-9a-fA-F]{" + expected_len + "}")) && (str.length == expected_len);
}


/**< Stored as a Uint8Array */
class HexStr
{
    constructor() {
        this.rawArray = new Uint8Array();

        // set the length object to be the number of bytes in the Uint8Array
        Object.defineProperty(this, 'length', { get: function() { return this.rawArray.length; }});
    }

    /**< Get the hex array as a string of hex characters
     * @returns str     Get the hex array as a string of hex characters (no '0x')
     */
    toString() {
        let str = "";
        for (let i = 0; i < this.rawArray.length; i++)
        {
            str += this.rawArray[i].toString(16).padStart(2, "0");
        }
        return str;
    }

    /**< Return the underlying byte array
     * @returns Uint8Array      The underlying array
     */
    toUint8Array() {
        return this.rawArray;
    }

    /**< Create a HexStr from a Uint8Array */
    fromUint8Array(arr) {
        if (arr instanceof Uint8Array) {        // if we just have a single Uint8Array
            this.rawArray = arr;
            // this.print();
        } else if (arr instanceof Array) {      // if we have an Array of Uint8Arrays 
            // determine the lengths of all the Uint8Arrays
            let total_size = 0;
            for (var a of arr)
            {
                // TODO, ensure a is of the correct type
                total_size += a.length;
            }
            
            this.rawArray = new Uint8Array(total_size);
            let offset = 0;
            for (var a of arr)
            {
                // TODO, ensure a is of the correct type
                this.rawArray.set(a, offset);
                offset += a.length;
            }

            // this.print();
        } else {
            console.log("ERROR - Unable to call HexStr::fromUint8Array() as value is of type '%s'", typeof num);
        }
    }

    /**< Create a HexStr from an integer (little endian) 
     * @param num       Number to add to convert from
     * @param type      Type/format of the number (e.g. uint8, uint16, uint32)
    */
    fromNumber(num, type) {
        // ensure the object is a Number
        if (typeof num =="number") {
            // convert the number to a byte array
            switch (type) {
                case "uint8":
                    this.rawArray = new Uint8Array([num]);
                    break;
                case "uint16":
                    this.rawArray = new Uint8Array([num, (num >> 8) & 0xFF]);  // little endian
                    break;
                case "uint32":
                    this.rawArray = new Uint8Array([num, (num >> 8) & 0xFF, (num >> 16) & 0xFF, (num >> 24) & 0xFF]);  // little endian
                    break;
                default:
                    console.log("ERROR - Unable to call HexStr::fromNumber(%d, %s) as number type not recognised", num, type)
                    break;
            }
            
            // this.print();
        } else {
            console.log("ERROR - Unable to call HexStr::fromNumber() as value '%s' is of type '%s'", num.toString(), typeof num);
        }
    }

    /**< Convert a string of hex chars to an array of hex values
     * @param str       String of hex characters
     */
    fromHexString(str) {
        console.log("fromHexString(%s)", str);
        
        // if the string contains hex characters
        if (isValidHexStr(str)) {
            // if the first digits are '0x' or '0X', remove them
            if (str.substring(0, 2).match(/0x|0X/)) {
                console.log("stripped '%s' from str: '%s'", str.substring(0, 2), str);
                str = str.substring(2);
            }

            // if the string length is even (it should contain a pair of hex chars)
            if ((str.length % 2) == 0) {
                this.rawArray = new Uint8Array(str.length / 2);

                // convert 2-char hex string values to a hex-byte within the raw array
                for (var i = 0; i < str.length; i+=2) {
                    this.rawArray[i / 2] = parseInt(str.substring(i, i + 2), 16);
                }

                // this.print();
            } else {
                // else if the string length is odd
                console.log("ERROR - Hex string '%s' length (%d) is odd. Should contain an even number of hex chars",
                            str, str.length);
            }
        } else {
            console.log("Error - toHexArray() str: '%s' is not a valid hex str", str)
        }
    }

    /**< Convert a string of UTF-8 characters to an array of hex values
     * @param str       String of UTF-8 characters
     */
    fromUTF8String(str) {
        console.log("fromUTF8String(%s)", str);

        this.rawArray = new Uint8Array(str.length);

        // convert 2-char hex string values to a hex-byte within the raw array
        for (var i = 0; i < str.length; i++)
        {
            // this.rawArray[i] = parseInt(str.substring(i, i+1), 16);
            this.rawArray[i] = str.charCodeAt(i);
        }

        // this.print();
    }

    print() {
        // convert the Uint8Array to an Array, then each element to hex characters
        if (this.rawArray.length > 1) {
            var hexArrayStr = Array.apply([], this.rawArray).map(dec_val => dec_val.toString(16).toUpperCase().padStart(2, "0")).join("-")
        }
        else if (this.rawArray.length == 1) {
            var hexArrayStr = this.rawArray[0].toString(16).toUpperCase().padStart(2, "0")
        }
        else {
            var hexArrayStr = "-"
        }
        
        console.log("rawArray: '%s'", hexArrayStr);
    }

    
}

class Message {
    constructor(cmd, payload) {
        this.cmd = new HexStr();
        this.payload_len = new HexStr();
        this.payload = new HexStr();

        this.setCmd(cmd);
        this.setPayload(payload);

        // set the length object to be the number of bytes in the Uint8Arrays
        Object.defineProperty(this, 'length', { get: function() { 
            return this.cmd.length + this.payload.length; 
        }});
    }

    setCmd(cmd) {
        this.cmd.fromHexString(cmd);
    }

    setPayload(payload) {
        this.payload.fromHexString(payload);
        this.payload_len.fromNumber(this.payload.length, "uint16");       // TODO, this may need to be preconfigured as a uint16_t (i.e. 4 hex chars)
    }

    print() {
        console.log("Cmd: %s Len: '%s' Payload: '%s'\n", 
                    this.cmd.toString(), this.payload_len.toString(), this.payload.toString())


        let full_byte_array = new HexStr();
        // full_byte_array.toUint8Array()
        full_byte_array.fromUint8Array([this.cmd.toUint8Array(), this.payload_len.toUint8Array(), this.payload.toUint8Array()]);
        full_byte_array.print();
    }
}

// class LargeMessage extends Message {
//     constructor(cmd, packet_num, payload) {
//         super(cmd, payload);
        
//         this.packet_num = new HexStr();
//         this.packet_num.fromHexString(packet_num);

//         // // set the length object to be the number of bytes in the Uint8Arrays
//         // Object.defineProperty(this, 'length', { get: function() { 
//         //     return this.cmd.length + this.payload.length + 4;           // + 4 for the packet_num len
//         // }});
//     }

//     setPacketNum(packet_num) {
//         this.packet_num = packet_num;
//     }

//     print() {
//         console.log("Cmd: %s Len: '%s' PacketNum: '%s' Payload: '%s'\n", 
//                     this.cmd.toString(), this.payload_len.toString(), this.packet_num.toString(), this.payload.toString())
//     }
// }

let msg = new Message("1234", "001122334455667788");
msg.print();