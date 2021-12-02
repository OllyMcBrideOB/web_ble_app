

/**< Standard message */
class Message {
    /**< Construct a standard message from a command and payload
     * @param cmd       Message command, as a HexStr
     * @param payload   Message payload, as a HexStr
     */
    constructor(cmd="", payload = "") {
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

    /**< Get the full message (cmd + len + payload) as a string
     * @returns The full message as a string
     */
    toString() {
        return this.cmd.toString() + " " +
                this.payload_len.toString() + " " +
                this.payload.toString("-")
    }

    /**
     * Get the message as a HexStr
     * @returns The message as a HexStr
     */
    toHexStr() {
        let full_byte_array = new HexStr();
        full_byte_array.fromUint8Array([this.cmd.toUint8Array(), this.payload_len.toUint8Array(), this.payload.toUint8Array()]);
        return full_byte_array;
    }

    /**< Set the message command
     * @param cmd   Message command (msg_cmd_t or HexStr)
     */
    setCmd(cmd) {
        // if the cmd is a msg_cmd_t key, get the value
        if (msg_cmd_t[cmd] != undefined) {
            cmd = msg_cmd_t[cmd];
        }

        this.cmd.fromHexString(cmd);
    }
    

    /**< Set the message payload
     * @param payload   Message payload
     */
    setPayload(payload) {
        // convert the value to a HexStr
        if (payload instanceof HexStr) {
            this.payload = payload;
        } else if (payload instanceof Message) {
            this.payload = payload.toHexStr();
        } else {
            switch (typeof payload) {
                case "string":
                    try {
                        this.payload.fromHexString(payload);
                    } catch(e) {
                        this.payload.fromUTF8String(payload);
                    }
                    break;
                case "Uint8Array":
                    this.payload.fromUint8Array(payload);
                    break;
                default:
                    console.log("ERROR - Unable to set payload as type '%s' is not handled", typeof payload)
            }
        }

        this.payload_len.fromNumber(this.payload.length, "uint16");       // TODO, this may need to be preconfigured as a uint16_t (i.e. 4 hex chars)
    }

    /**< Convert a HexStr to a standard message
     * @param hexStr        HexStr to convert to the message
     * @returns             This pointer to enable chaining
     */
    fromHexStr(hexStr) {
        this.setCmd(hexStr.toString().substring(0, 4));
        // TODO, manage original hexStr payload length, rather than calculate the new payload len
        this.setPayload(hexStr.toString().substring(8));

        return this;
    }

    /**< Convert an ArrayBuffer to a standard message
     * @param buf           ArrayBuffer to convert to the message
     * @returns             This pointer to enable chaining
     */
    fromArrayBuffer(buf) {
        this.fromHexStr(new HexStr().fromUint8Array(new Uint8Array(event.target.value.buffer)))

        return this;
    }

    /**< Print the standard message */
    print() {
        console.log("Cmd: %s Len: '%s' Payload: '%s'\n", 
                    this.cmd.toString(), this.payload_len.toString(), this.payload.toString())

        // print underlying array
        // let full_byte_array = new HexStr();
        // full_byte_array.fromUint8Array([this.cmd.toUint8Array(), this.payload_len.toUint8Array(), this.payload.toUint8Array()]);
        // full_byte_array.print();
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

// let msg = new Message("1234", "001122334455667788");
// msg.print();

// let a = new HexStr();
// a.fromHexString("080108000123456789ABCDEF");
// a.print();

// let msg = new Message()
// msg.fromHexStr(a);
// msg.print()
// console.log("msg: '%s'", msg.toString())// console.log("msg: '%s'", msg.toString())

/**
 * Write a request message and then await the response message
 * @param {Message} req_msg Request message to send to the Hero BLE module
 * @param {string} req_msg_type Either "standard" or "large" to indicate which characteristic to use for the request message
 * @param {string} resp_msg_type Either "standard" or "large" to indicate which characteristic to use for the response message
 * @returns A Promise that will return the response message
 */
async function writeThenGetResponse(req_msg, req_msg_type="standard", resp_msg_type="standard") {
// return a promise allowing the response to be awaited
return new Promise( (resolve, reject) => {
    let response_cb = (event) => {
        // convert the ArrayBuffer to a Message
        const rx_msg = new Message().fromArrayBuffer(event.target.value.buffer);
        
        // if we have found the response we're looking for
        if (rx_msg.cmd.equals(req_msg.cmd))
        {
            // unregister the callback
            switch (resp_msg_type.toLowerCase()) {
                case "standard":
                    GATT.GATTtable.NRTservice.NRTResponse.onValueChangeRemove(response_cb);
                    break;
                case "large":
                    GATT.GATTtable.NRTservice.NRTLargeResponse.onValueChangeRemove(response_cb);
                    break;
                default:
                    break;
            }
            
            resolve(rx_msg)
        }
    }
    
    // register the callback to detect the responses
    switch (resp_msg_type.toLowerCase()) {
        case "standard":
            GATT.GATTtable.NRTservice.NRTResponse.onValueChange(response_cb);
            break;
        case "large":
            GATT.GATTtable.NRTservice.NRTLargeResponse.onValueChange(response_cb);
            break;
        default:
            console.log("writeThenGetResponse() failed, resp_msg_type parameter should be 'standard' or 'large'");
            reject("writeThenGetResponse() failed, resp_msg_type parameter should be 'standard' or 'large'");
            break;
    }
    
    // write the request message
    writeToCommandTerminal(req_msg, "tx")
    switch (req_msg_type.toLowerCase()) {
        case "standard":
            GATT.GATTtable.NRTservice.NRTRequest.write(req_msg);
            break;
        case "large":
            GATT.GATTtable.NRTservice.NRTLargeRequest.write(req_msg);
            break;
        default:
            console.log("writeThenGetResponse() failed, req_msg_type parameter should be 'standard' or 'large'");
            reject("writeThenGetResponse() failed, req_msg_type parameter should be 'standard' or 'large'");
            break;
    }
});                        
}