
const grip_str = {
    Fist: "2125FD23212BA72B2421444444A7A72421444444A7A7232121A7A7FDFC46697374FCFE",
    Hook: "2125FD2321A7A7A7232121A7A7232121A7A7232121A7A7FDFC486F6F6BFCFE",
    "Tripod FOP": "2125FD232124A7242421444444A7A72421444444A7A72321A7A7A7FDFC547269706F645F464F50FCFE",
    "Tripod FCL": "2125FD232124A7242421444444A7A72421444444A7A7232121A721FDFC547269706F645F46434CFCFE",
    "Pinch FOP": "2125FD23212DA72D2421373737A7A72321A7A7A72321A7A7A7FDFC50696E63685F464F50FCFE",
    "Pinch FCL": "2125FD23212DA72D2421373737A7A7232121A721232121A721FDFC50696E63685F46434CFCFE",
}

const MAX_GROUP_SIZE = 6;
const MAX_NUM_GROUPS = 5;
const MAX_LARGE_PAYLOAD_CHUNK_LEN = 249;

/**
 * If the 'Reset' button is pressed, reset the grip/group counters
 */
 document.getElementById("btn_reset_grip_group_num").addEventListener("click", function(event) {
    document.getElementById("grip_cmd_group_num").value = 0;
    document.getElementById("grip_cmd_grip_num").value = 0;
});

/**
 * If one of the grip buttons is clicked, add it to the grip creation terminal
 */
document.getElementById("btn_fist").addEventListener("click", function(event) {
    addGripStrToGenerator(event.currentTarget.innerHTML);
});

/**
 * If one of the grip buttons is clicked, add it to the grip creation terminal
 */
document.getElementById("btn_hook").addEventListener("click", function(event) {
    addGripStrToGenerator(event.currentTarget.innerHTML);
});

/**
 * If one of the grip buttons is clicked, add it to the grip creation terminal
 */
document.getElementById("btn_tripod_fop").addEventListener("click", function(event) {
    addGripStrToGenerator(event.currentTarget.innerHTML);
});

/**
 * If one of the grip buttons is clicked, add it to the grip creation terminal
 */
document.getElementById("btn_tripod_fcl").addEventListener("click", function(event) {
    addGripStrToGenerator(event.currentTarget.innerHTML);
});

/**
 * If one of the grip buttons is clicked, add it to the grip creation terminal
 */
document.getElementById("btn_pinch_fop").addEventListener("click", function(event) {
    addGripStrToGenerator(event.currentTarget.innerHTML);
});

/**
 * If one of the grip buttons is clicked, add it to the grip creation terminal
 */
 document.getElementById("btn_pinch_fcl").addEventListener("click", function(event) {
    addGripStrToGenerator(event.currentTarget.innerHTML);
});

/**
 * If the 'Delete Grips' button is pressed, send the grip command
 */
document.getElementById("btn_delete_grips").addEventListener("click", async function(event) {

    let response_parser = function(response_msg) {
        // confirm response payload length is valid
        if (response_msg.payload.length == 1) {
            // parse response payload
            grip_status = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 0, 1));
            
            printFileStatus("GRIP DELETE status: " + gripStatusToString(Number(grip_status)) + " (0x" + Number(grip_status).toString(16).padStart(2, "0") + ")")
        } else {
            printFileStatus("ERROR - Invalid GRIP DELETE response (len: " + response_msg.payload.length + "/" + 1 + ")")
        }

        return true;        // return true as the entire response was received (i.e. only a single-packet response)
    }

    // generate message to delete the grips
    const payload = new HexStr().fromHexString("0x04FB");
    const msg = new Message("SET_GRIP_GROUP_CONFIG", payload);

    // write the message and await the response
    await writeThenGetResponse(msg, "standard", "standard", response_parser);
});

/**
 * If the 'Save Grips' button is pressed, send the grip command
 */
 document.getElementById("btn_save_grips").addEventListener("click", async function(event) {

    let response_parser = function(response_msg) {
        // confirm response payload length is valid
        if (response_msg.payload.length == 1) {
            // parse response payload
            grip_status = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 0, 1));
            
            printFileStatus("GRIP SAVE status: " + gripStatusToString(Number(grip_status)) + " (0x" + Number(grip_status).toString(16).padStart(2, "0") + ")")
        } else {
            printFileStatus("ERROR - Invalid GRIP SAVE response (len: " + response_msg.payload.length + "/" + 1 + ")")
        }

        return true;        // return true as the entire response was received (i.e. only a single-packet response)
    }

    // generate message to save the grips
    const payload = new HexStr().fromHexString("0x01FE");
    const msg = new Message("SET_GRIP_GROUP_CONFIG", payload);

    // write the message and await the response
    await writeThenGetResponse(msg, "standard", "standard", response_parser);
});

// /**
//  * If the 'Send' button is pressed, send the grip command
//  */
// document.getElementById("btn_send_grip_cmd").addEventListener("click", async function(event) {
//     let response_parser = function(response_msg) {
//         // confirm response payload length is valid
//         if (response_msg.payload.length == 1) {
//             // parse response payload
//             grip_status = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 0, 1));
            
//             printFileStatus("GRIP SET status: " + gripStatusToString(Number(grip_status)) + " (0x" + Number(grip_status).toString(16).padStart(2, "0") + ")")
//         } else {
//             printFileStatus("ERROR - Invalid GRIP SET response (len: " + response_msg.payload.length + "/" + 1 + ")")
//         }

//         return true;        // return true as the entire response was received (i.e. only a single-packet response)
//     }

//     let full_grip_cmd_str = document.getElementById("label_grip_cmd").innerHTML.replace(/[\s<br>]/g, "");
    
//     const packet_num = new HexStr().fromNumber(0, "uint16");                // packet 0 buffer
//     const grip_creation = new HexStr().fromHexString(full_grip_cmd_str);
//     const payload = new HexStr().append(packet_num, grip_creation);
//     const msg = new Message("SET_GRIP_STRING", payload);


//     if (payload.length > MAX_LARGE_PAYLOAD_CHUNK_LEN) {
//         console.log("ERROR - Payload is too long (%d > %d)", payload.length, MAX_LARGE_PAYLOAD_CHUNK_LEN);
//     }
    

//     // write the message and await the response
//     await writeThenGetResponse(msg, "large", "standard", response_parser);
// });

/**
 * If the 'Send' button is pressed, send the grip command
 */
 document.getElementById("btn_send_grip_cmd").addEventListener("click", async function(event) {
    let response_parser = function(response_msg) {
        // confirm response payload length is valid
        if (response_msg.payload.length == 1) {
            // parse response payload
            grip_status = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 0, 1));
            
            printFileStatus("GRIP SET status: " + gripStatusToString(Number(grip_status)) + " (0x" + Number(grip_status).toString(16).padStart(2, "0") + ")")
        } else {
            printFileStatus("ERROR - Invalid GRIP SET response (len: " + response_msg.payload.length + "/" + 1 + ")")
        }

        return true;        // return true as the entire response was received (i.e. only a single-packet response)
    }

    let full_grip_cmd_str = document.getElementById("label_grip_cmd").innerHTML.replace(/[\s<br>]/g, "");
    
    const packet_num = new HexStr().fromNumber(0, "uint16");                // packet 0 buffer
    const grip_creation = new HexStr().fromHexString(full_grip_cmd_str);
    const payload = new HexStr().append(packet_num, grip_creation);
    const msg = new Message("SET_GRIP_STRING", payload);


    if (payload.length > MAX_LARGE_PAYLOAD_CHUNK_LEN) {
        console.log("ERROR - Payload is too long (%d > %d)", payload.length, MAX_LARGE_PAYLOAD_CHUNK_LEN);
    }
    

    // write the message and await the response
    await writeThenGetResponse(msg, "large", "standard", response_parser);
});



/**
 * If the 'Clear' button is pressed, clear the grip command
 */
 document.getElementById("btn_clear_grip_cmd").addEventListener("click", async function(event) {
    document.getElementById("label_grip_cmd").innerHTML = "";
    document.getElementById("label_grip_len_bytes").innerHTML = "--";
});



function addGripStrToGenerator(grip_name) {
    if (grip_name in grip_str) {

        let grip_creation_str = "";

        grip_creation_str += new HexStr().fromNumber(getGroupNum(false), "uint8").toString();           // group number (auto-incremented by getGripNum())
        grip_creation_str += " ";
        grip_creation_str += new HexStr().fromNumber(getGripNum(true), "uint8").toString();             // grip number
        grip_creation_str += " ";
        grip_creation_str += new HexStr().fromNumber(grip_str[grip_name].length/2, "uint8").toString(); // grip_str_len
        grip_creation_str += " ";
        grip_creation_str += grip_str[grip_name];                                                       // grip_str
        grip_creation_str += "<br>";
    
    
        let full_grip_cmd_str = document.getElementById("label_grip_cmd").innerHTML;
        full_grip_cmd_str += grip_creation_str;
        document.getElementById("label_grip_cmd").innerHTML = full_grip_cmd_str;
        document.getElementById("label_grip_len_bytes").innerHTML = full_grip_cmd_str.replace(/\s+/g, "").length / 2;
    
        let response_label_div = document.getElementById("grip_cmd_box");
        response_label_div.scrollTop = response_label_div.scrollHeight;

    } else {
        console.log("ERROR - Grip '%s' is not recognised", grip_name)
        return "";
    }
}

function getGroupNum(increment) {
    const num = Number(document.getElementById("grip_cmd_group_num").value);

    if (increment) {
        if (num >= MAX_NUM_GROUPS - 1) {
            console.log("WARNING - Invalid group number")
            document.getElementById("grip_cmd_group_num").value = 0;
        } else {
            document.getElementById("grip_cmd_group_num").value = num + 1;
        }
    }

    return num;
}

function getGripNum(increment) {
    const num = Number(document.getElementById("grip_cmd_grip_num").value);

    if (increment) {
        if (num >= MAX_GROUP_SIZE - 1) {
            document.getElementById("grip_cmd_grip_num").value = 0;
            getGroupNum(true);  // auto-increment group num
        } else {
            document.getElementById("grip_cmd_grip_num").value = num + 1;

        }
    }

    return num;
}

/**
 * Get the file status as a string
 * @param {Number} grip_status Convert the status enum to a string
 * @returns String of the grip status
 */
 function gripStatusToString(grip_status) {
    const status_str = {
        0       : "SUCCESS",              /**< Success */
        1       : "TOO_MANY_GRIPS",       /**< Too many grips created */
        2       : "INVALID_GRIP_STR_LEN",       /**<  */
        3       : "INVALID_GRIP_STR",       /**<  */
        4       : "INVALID_GRIP_GROUP_NUM",       /**<  */
        5       : "UNKNOWN_ERROR",       /**<  */
        6       : "INVALID_CONFIG",       /**<  */

    }
    try {
        return status_str[grip_status];
    } catch(e) {
        return "Unknown (" + grip_status + ")";
    }
}