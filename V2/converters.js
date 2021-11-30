

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

/**< A Uint8Array with converters to/from strings, arrays & numbers */
class HexStr
{
    /**< Construct the array from a hex string
     * @param hexStr    A string of hex chars
     */
    constructor(hexStr = "") {
        this.rawArray = new Uint8Array();

        // set the length object to be the number of bytes in the Uint8Array
        Object.defineProperty(this, 'length', { get: function() { return this.rawArray.length; }});

        // if a parameter was passed to the constructor, generate the hex string
        if (hexStr != "") {
            this.fromHexString(hexStr);
        }
    }

    /**< Get the hex array as a string of hex characters
     * @param charSep   Seperator between chars
     * @returns str     Get the hex array as a string of hex characters (no '0x')
     */
    toString(charSep = "") {
        let str = "";
        for (let i = 0; i < this.rawArray.length; i++) {
            // convert the byte value to a it's 2-digit hex representation
            str += this.rawArray[i].toString(16).padStart(2, "0")
            
            // add the seperator between hex numbers (don't add sep after last hex number)
            if (i < this.rawArray.length - 1){
                str += charSep;
            }
        }
        return str;
    }

    /**< Return the underlying byte array
     * @returns Uint8Array      The underlying array
     */
    toUint8Array() {
        return this.rawArray;
    }

    /**< Create a HexStr from a Uint8Array 
     * @param arr       A Uint8Array to copy to the HexStr
     * @returns         this pointer, to enable function chaining
     */
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
            for (var a of arr) {
                // TODO, ensure a is of the correct type
                this.rawArray.set(a, offset);
                offset += a.length;
            }
        } else {
            console.log("ERROR - Unable to call HexStr::fromUint8Array() as value is of type '%s'", typeof num);
        }

        return this;
    }

    /**< Create a HexStr from an integer (little endian) 
     * @param num       Number to add to convert from
     * @param type      Type/format of the number (e.g. uint8, uint16, uint32)
     * @returns         this pointer, to enable function chaining
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

        return this;
    }

    /**< Convert a string of hex chars to an array of hex values
     * @param str       String of hex characters
     * @returns         this pointer, to enable function chaining
     */
    fromHexString(str) {
        // if the string is empty, create an empty array
        if (str == "") {
            this.rawArray = new Uint8Array(0);
        }
        // if the string contains hex characters
        else if (isValidHexStr(str)) {
            // if the first digits are '0x' or '0X', remove them
            if (str.substring(0, 2).match(/0x|0X/)) {
                // console.log("stripped '%s' from str: '%s'", str.substring(0, 2), str);
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
            throw("Error - toHexArray() str: '" + str + "' is not a valid hex str")
        }
        return this;
    }

    /**< Convert a string of UTF-8 characters to an array of hex values
     * @param str       String of UTF-8 characters
     * @returns         this pointer, to enable function chaining
     */
    fromUTF8String(str) {
        this.rawArray = new Uint8Array(str.length);

        // convert 2-char hex string values to a hex-byte within the raw array
        for (var i = 0; i < str.length; i++) {
            this.rawArray[i] = str.charCodeAt(i);
        }
        return this;
    }

    /**
     * Return true if the object parameter is equal to this HexStr
     * @param {HexStr} obj HexStr object to check for equality
     * @returns True if the object parameter is equal to this HexStr
     */
    equals(obj) {
        // ensure the object is of the same type as this
        if (typeof obj != typeof this) {
            return false;
        }

        // ensure the underlying arrays are the same length
        if (obj.rawArray.length != this.rawArray.length) {
            return false;
        }

        // iterate through the raw array elements of this object looking for a discrepancy between this and obj
        for (let i in this.rawArray) {
            if (obj.rawArray[i] != this.rawArray[i]) {
                return false;   
            }
        }

        // the objects are the same
        return true;
    }

    /**< Print the raw HexStr byte array */
    print() {
        
        console.log("rawArray: '%s'", this.toString("-"));

        return this;
    }
}