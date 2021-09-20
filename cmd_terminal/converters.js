

/**
 * TODO
 * 
 * - User input str to Hex array (correct encoding)
 * - 
 * 
 * 
 * 
 */

// /**< Return true if str is a valid hex string
//  * @param str           String to check whether it is a valid hex string
//  * @param n_hex_chars   Validate the length is correct (optional)
// */
// function isValidHexStr(str, n_hex_chars = 0) {
//     // if the string is the correct length (if n_hex_chars is supplied)
//     if ((str.length == n_hex_chars) || (n_hex_chars == 0))
//     {
//         // if the entire string is a hex string
//         if (str.match("[0-9a-fA-F]{" + str.length + "}"))
//         {
//             return true;
//         }
//     }

//     return false;
// }


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


/**
 * - Store a Uint8 array of bytes
 * - Get as string with specified endianness
 * - Set from string with specified endianness
 * 
 * 
 * 
 */


/**< Stored as a Uint8Array */
class HexStr
{
    constructor() {
        // this.rawArray = new Uint8Array();
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

    /**< Create a HexStr from a Uint8Array */
    fromArray(arr)
    {
        // TODO, validate that arr is of the correct type
        this.rawArray = arr;
    }

    /**< Convert a string of hex chars to an array of hex values
     * @param str       String of hex characters
     */
    fromString(str)
    {
        console.log("fromString(%s)", str);
        
        // if the string contains hex characters
        if (isValidHexStr(str))
        {
            // if the first digits are '0x' or '0X', remove them
            if (str.substring(0, 2).match(/0x|0X/))
            {
                console.log("stripped '%s' from str: '%s'", str.substring(0, 2), str);
                str = str.substring(2);
            }

            // if the string length is even (it should contain a pair of hex chars)
            if ((str.length % 2) == 0)
            {
                this.rawArray = new Uint8Array(str.length / 2);

                // convert 2-char hex string values to a hex-byte within the raw array
                for (var i = 0; i < str.length; i+=2)
                {
                    this.rawArray[i / 2] = parseInt(str.substring(i, i + 2), 16);
                }
            }
            // else if the string length is odd
            else
            {
                console.log("ERROR - Hex string '%s' length (%d) is odd. Should contain an evun number of hex chars",
                            str, str.length);
            }
        }
        else
        {
            console.log("Error - toHexArray() str: '%s' is not a valid hex str", str)
        }
    }
}

let h = new HexStr();
h.fromString("0x1234");

let p = new HexStr();
p.fromString("0X123456");
console.log("p result: %s\n", p.toString());

let a = new HexStr();
a.fromString("abc");


let rawArray = new Uint8Array(2);
// rawArray = Uint8Array.from({17, 22});
rawArray[0] = 17;
rawArray[1] = 52;

let b = new HexStr();
b.fromArray(rawArray);
console.log("result: %s\n", b.toString());

