/**
 * TODO
 * 
 * - Change read/write data packet sizes to use MTU size
 * - Speed up file browser read
 * - Allow files to be moved around within the file nav (i.e. drag from one dir to another)
 * - Allow entire filesystem to be reset to default
 * - Host TLS webapp to make it available (must be https to enable Web BLE)
 * 
 */



/**< Create an instance of the GATT manager to allow us to communicate with a BLE Peripheral */
let GATT = new GATTmanager();

/**< Create an instance of the FileBrowser to list the remote directory structure */
let fileBrowser = new FileBrowser(document.getElementById("fm_nav"));

/**< Standard & large request messages that are to be sent when the enter button is pressed */
let standard_req_msg = new Message();
let large_req_msg = new Message();

/**< Flag to enable/disable ASCII printout in the command response terminal */
let en_ASCII_cmd_resp = document.getElementById("checkbox_cmd_ascii").checked;

/**< When the Connect/Disconnect button is clicked */
document.getElementById("btn_connect").addEventListener("click", function() {
    // if web BLE is available in this browser
    if (GATT.isWebBLEAvailable()) {
        // if we are not currently connected to a BLE peripheral
        if (!GATT.isConnected()) {
            console.log("Connecting");
            // show the 'Devices to connect to' dialog & try to connect to the selected device
            GATT.connect().then(_ => {
                onConnectionComplete();
                GATT.subscribeToDisconnect(onDisconnect);
            }).                
            // else if connection failed
            catch(error => {
                 // if the user has not cancelled the Device Selector Window
                if (error.name != "NotFoundError") {
                    console.log("Connection error: " + error)
                }

                // reset the header to known values
                document.getElementById("label_dev").innerHTML = "None";
                document.getElementById("btn_connect").innerHTML = "Connect"
            })
        }
        // else if we want to disconnect
        else {
            console.log("Disconnecting");
            GATT.disconnect();
        }
    } else {
        console.log("Web BLE is not available");
        writeToCommandTerminal("Web BLE is not available", "none");

    }
})

/**
 * If the Commands 'Clear' button is pressed, clear the cmd terminal
 */
document.getElementById("btn_clear_cmds").addEventListener("click", function(event) {
    document.getElementById("label_cmd_responses").innerHTML = "";
});

/**
 * If the Commands 'View as ASCII' checkbox is changed, enable ASCII output in terminal
 */
document.getElementById("checkbox_cmd_ascii").addEventListener("click", function(event) {
    en_ASCII_cmd_resp = event.target.checked;
});

/*
 * If the enter key is pressed whilst interacting with the Commands inputs, press the Enter button
 */
document.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        if (document.getElementById("card_commands").contains(document.activeElement)){
            if (GATT.isConnected()) {
                let tx_msg = new Message(document.getElementById("s_request_cmd").value, 
                                        document.getElementById("s_request_payload").value);
                tx_msg.print();
        
                GATT.GATTtable.NRTservice.NRTRequest.write(tx_msg);
        
                writeToCommandTerminal(tx_msg, "tx");

                if (en_ASCII_cmd_resp) {
                    writeToCommandTerminal(tx_msg, "ascii", en_ASCII_cmd_resp)
                }
            } else {
                writeToCommandTerminal("No BLE Device Connected")
            }
        }
    }
});

/**< If the Standard Request Cmd is valid, enable the Enter button, else disable it */
document.getElementById("s_request_cmd").addEventListener("input", function(event) {
    const valid = isValidHexChars(event.target.value, 4);
    document.getElementById("s_request_enter").disabled = !valid;
    document.getElementById("l_request_enter").disabled = !valid;
    document.getElementById("l_request_cmd").value = event.target.value;
});

/**< If the Large Request Cmd is valid, enable the Enter button, else disable it */
document.getElementById("l_request_cmd").addEventListener("input", function(event) {
    const valid = isValidHexChars(event.target.value, 4);
    document.getElementById("s_request_enter").disabled = !valid;
    document.getElementById("l_request_enter").disabled = !valid;
    document.getElementById("s_request_cmd").value = event.target.value;
});

/**< If the Standard Request payload is valid, enable the Enter button, else disable it */
document.getElementById("s_request_payload").addEventListener("input", function(event) {
    document.getElementById("l_request_payload").value = event.target.value;

    // update the s & l payload lengths
    let payload_len = new HexStr().fromNumber(Math.floor(event.target.value.length/2), "uint16");
    document.getElementById("s_request_len").value = payload_len.toString();
    payload_len = new HexStr().fromNumber(Math.floor(event.target.value.length/2) + 2, "uint16");
    document.getElementById("l_request_len").value = payload_len.toString();

});

/**< If the Large Request payload is valid, enable the Enter button, else disable it */
document.getElementById("l_request_payload").addEventListener("input", function(event) {
    document.getElementById("s_request_payload").value = event.target.value;

    // update the s & l payload lengths
    let payload_len = new HexStr().fromNumber(Math.floor(event.target.value.length/2), "uint16");
    document.getElementById("s_request_len").value = payload_len.toString();
    payload_len = new HexStr().fromNumber(Math.floor(event.target.value.length/2) + 2, "uint16");
    document.getElementById("l_request_len").value = payload_len.toString();
});

/**< If the Standard Request 'Enter' button is clicked */
document.getElementById("s_request_enter").addEventListener("click", function(event) {
    if (GATT.isConnected()) {
        let tx_msg = new Message(document.getElementById("s_request_cmd").value, 
                                document.getElementById("s_request_payload").value);
        tx_msg.print();

        GATT.GATTtable.NRTservice.NRTRequest.write(tx_msg);

        writeToCommandTerminal(tx_msg, "tx");

        if (en_ASCII_cmd_resp) {
            writeToCommandTerminal(tx_msg, "ascii", en_ASCII_cmd_resp)
        }
    } else {
        writeToCommandTerminal("No BLE Device Connected")
    }
});

/**< If the Large Request 'Enter' button is clicked */
document.getElementById("l_request_enter").addEventListener("click", function(event) {
    if (GATT.isConnected()) {
        let tx_msg = new Message(document.getElementById("l_request_cmd").value, 
                                document.getElementById("l_request_packet_num").value + 
                                document.getElementById("l_request_payload").value);
        tx_msg.print();

        GATT.GATTtable.NRTservice.NRTLargeRequest.write(tx_msg);

        writeToCommandTerminal(tx_msg, "tx");

        if (en_ASCII_cmd_resp) {
            writeToCommandTerminal(tx_msg, "ascii", en_ASCII_cmd_resp);
        }
    } else {
        writeToCommandTerminal("No BLE Device Connected")
    }
});

/**
 * When a file has been selected from the file explorer, print it to the file manager text box
 */
document.getElementById("btn_browse_local_file").addEventListener("change", function(event) {
    if (event.target.files.length > 0) {
        loadAndViewFile(event.target.files[0]);
        document.getElementById("btn_file_send").disabled = false;
    }
});

/**
 * When the File Manager 'Send to Hero BLE' button has been clicked, start a file transfer to the Hero BLE module
 */
document.getElementById("btn_file_send").addEventListener("click", async function(event) {
    // get the file currently previewed in the fm_viewer    
    const fileViewer = document.getElementById("fm_viewer");
    const localFile = fileViewer.value;
    
    // write the file to the selected directory
    const f = new FileTransfer;
    await f.write(fileBrowser.selectedDir + "/" + localFile.filename, localFile.data);
    fileBrowser.ls();
});

/**
 * When the File Manager 'refresh' button has been clicked, get the Hero BLE directory layout
 */
document.getElementById("btn_remote_refresh").addEventListener("click", function(event) {
    if (GATT.isConnected()) {
        fileBrowser.ls();
    } else {
        console.log("No Bluetooth device Connected");
    }

});

/**
 * When the File Manager file manager 'clear' button has been clicked, clear all file manager elements
 */
 document.getElementById("btn_file_clear").addEventListener("click", function(event) {
    document.getElementById("label_status_box").innerHTML = "";
    document.getElementById("label_file_transfer_dur").innerHTML = "-";
    clearFileViewer();
    fileBrowser.clear();
});

/**
 * Copy the message command string into the request message classes
 * @param {string} cmd Message command string of hex characters
 */
function onCmdEntered(cmd) {
    standard_req_msg.setCmd(new HexStr(cmd));
    large_req_msg.setCmd(new HexStr(cmd));
    
}

/**
 * Copy the message payload into the request message classes
 * @param {string} payload Message payload string of hex characters
 */
function onPayloadEntered(payload) {
    standard_req_msg.setPayload(new HexStr(payload));
    large_req_msg.setPayload(new HexStr(payload));
    
}

/**
 * Upon connection complete, change the Connect button & subscribe to characteristics
 */
function onConnectionComplete() {
    writeToCommandTerminal("Connected to " + GATT.deviceDisplayName())
    
    // upon successful conneciton, set the device name & change the button to 'Disconnect
    document.getElementById("label_dev").innerHTML = GATT.deviceDisplayName();
    document.getElementById("btn_connect").innerHTML = "Disconnect"
    document.getElementById("btn_remote_refresh").disabled = false;
    document.getElementById("btn_file_send").disabled = false;
    
    subscribeToCharacteristics();

    // fileBrowser.ls();
}

/**
 * Upon a disconnect from the BLE peripheral, disable buttons & print message
 * @param {event} event BLE GATT disconnect event
 */
function onDisconnect(event) {
    writeToCommandTerminal("Disconnected BLE Peripheral")

    document.getElementById("label_dev").innerHTML = GATT.deviceDisplayName();     // set to None by GATT
    document.getElementById("btn_connect").innerHTML = "Connect"
    document.getElementById("btn_remote_refresh").disabled = true;
    document.getElementById("btn_file_send").disabled = true;
    document.getElementById("label_fw").innerHTML = "Unkown";
    document.getElementById("label_bootloader").innerHTML = "Unkown";
}

/**
 *  Called after successful connection. Allows characteristics to be subscribed to
 */
async function subscribeToCharacteristics() {
   
    // subscribe to the NRT response char
    GATT.GATTtable.NRTservice.NRTResponse.onValueChange( function(event) {      
        // convert the ArrayBuffer to a HexStr
        let rx_hex_str = new HexStr().fromUint8Array(new Uint8Array(event.target.value.buffer));
        writeToCommandTerminal(rx_hex_str, "rx")

        if (en_ASCII_cmd_resp) {
            writeToCommandTerminal(rx_hex_str, "ascii", en_ASCII_cmd_resp)
        }
    })
    // subscribe to the NRT large response char
    GATT.GATTtable.NRTservice.NRTLargeResponse.onValueChange( function(event) {      
        // convert the ArrayBuffer to a HexStr
        let rx_hex_str = new HexStr().fromUint8Array(new Uint8Array(event.target.value.buffer));
        writeToCommandTerminal(rx_hex_str, "rx")
        
        if (en_ASCII_cmd_resp) {
            writeToCommandTerminal(rx_hex_str, "ascii", en_ASCII_cmd_resp)
        }
    })

    // get the firmware version and display it in the nav bar
    let get_fw_ver_msg = new Message("GET_HERO_BLE_FIRMWARE_VER", new HexStr());
    writeThenGetResponse(get_fw_ver_msg, "standard", "standard", function(response_msg)
    {
        document.getElementById("label_fw").innerHTML = response_msg.payload.toUTF8String();

        // get the bootloader version and display it in the nav bar
        let get_bl_ver_msg = new Message("GET_HERO_BLE_BOOTLOADER_VER", new HexStr());
        writeThenGetResponse(get_bl_ver_msg, "standard", "standard", function(response_msg)
        {
            document.getElementById("label_bootloader").innerHTML = response_msg.payload.toUTF8String();
        })
    })
};

/**
 * Write a message to the command terminal (including the rx/tx indicator)
 * @param {val} val A value to write to the command terminal
 * @param {"tx","rx","none"} tx_rx String to indicate if it is a tx or rx message
 * @param {bool} print_msg_as_ascii True to write the message payload in a UTF8 representation, else use Hex
 */
 function writeToCommandTerminal(val, tx_rx="none", print_msg_as_ascii=false) {
    // determine the indicator direction
    const tx_rx_indicator = (tx_rx == "tx") ? "=> " : (tx_rx == "rx") ? "<= " : (tx_rx == "ascii") ? "^^ " : ""; 
    let val_str = "";

    // if it's a HexStr, convert it to a msg
    if (val instanceof HexStr) {
        // convert the hex_str to a message
        val = new Message().fromHexStr(val);
    } 
    
    if (val instanceof Message) {
        if (print_msg_as_ascii) {
            val_str = val.toUTF8String();
        } else {
            val_str = val.toString();
        }
    } else {
        switch (typeof val) {
            case "string":
                val_str = val;
                break;
            case "Uint8Array":
                val_str = new HexStr().fromArray(val).toString("-")
                break;
            default:
                console.log("ERROR - Unable to write val to the '%s' characteristic as type '%s' is not handled",
                    this.name, typeof val)
        }
    }

    // discard old console output if it's > 10000 chars
    let console_element = document.getElementById("label_cmd_responses");
    if (console_element.innerHTML.length > 10000)
    {
        console_element.innerHTML = console_element.innerHTML.slice(-10000);
    }
    // write the message to the Command Terminal component
    console_element.innerHTML += getTimestampStr() + " " + tx_rx_indicator + val_str + "<br>";

    // scroll to the bottom of the terminal
    let response_label_div = document.getElementById("cmd_responses_terminal");
    response_label_div.scrollTop = response_label_div.scrollHeight;
}

/**
 * Get the current datetime timestamp as a string
 * @returns Current time as hh:mm:ss.milliseconds
 */
function getTimestampStr() {
    const date = new Date(Date.now());

    return date.getHours().toString().padStart(2, "0") + ":" +
            date.getMinutes().toString().padStart(2, "0") + ":" + 
            date.getSeconds().toString().padStart(2, "0") + "."  + 
            date.getMilliseconds().toString().padStart(4, 2);
}

/**
 * When a file is dropped in the fm_viewer, load it into the fm_viewer  
 * @param {event} event Event from a file being dropped in the fm_viewer
 */
document.getElementById("fm_viewer").addEventListener("drop", function(event) {
    console.log('File(s) dropped');
    
    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
    
    // Use DataTransferItemList interface to access the file(s)
    if (event.dataTransfer.items.length > 0) {
        // If dropped items aren't files, reject them
        if (event.dataTransfer.items[0].kind === 'file') {
            loadAndViewFile(event.dataTransfer.items[0].getAsFile());
        }
    }
});

/**
 * When a file is dragged over the fm_viewer, disbale the default event behaviour
 * @param {event} event Event from a file being dragged over the the fm_viewer
 */
document.getElementById("fm_viewer").addEventListener("dragover", function(event) {
    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
});

/**
 * Read and display a file in the file viewer
 * @param {File} file File to be displayed within the file viewer
 */
function loadAndViewFile(file) {
    if (isTextFile(file.type) || isBinFile(file.type)) {
        // prepare a file reader
        const reader = new FileReader();
        
        // prepare the 'load' callback
        reader.onload = function fileReadComplete() {          
            viewFileInViewer(reader.filename, new Uint8Array(reader.result));
        };

        // peform the read
        reader.filename = file.name;
        reader.readAsArrayBuffer(file);
    } else {
        document.getElementById("fm_viewer").innerHTML = "Invalid file type (" + file.type + ")";
    }
}

/**
 * View a file within the fm_viewer box 
 * @param {string} filename Name of the file, including the extension
 * @param {HexStr, Uint8Array} file_data A HexStr containing the file data
 */
 function viewFileInViewer(filename, file_data) {
    const file_extension = "." + filename.split('.').pop();
    if (file_data instanceof HexStr) {
        var file_data_hex_str = file_data;
    } else if (file_data instanceof Uint8Array) {
        var file_data_hex_str = new HexStr().fromUint8Array(file_data);
    }

    const fm_viewer = document.getElementById("fm_viewer");
    const label_filename = document.getElementById("label_filename");

    if (file_data.length == 0) {
        fm_viewer.innerHTML = " - Empty file - ";
    } else if (isTextFile(file_extension)) {
        fm_viewer.style.whiteSpace="pre";
        fm_viewer.innerHTML = file_data_hex_str.toUTF8String();
    } else {
        fm_viewer.style.whiteSpace="normal";
        fm_viewer.innerHTML = file_data_hex_str.toString("-").toUpperCase();
    }

    fm_viewer.value = {filename: filename, data: file_data};
    label_filename.innerHTML = filename;
    label_filename.title = filename;
    setFileSize(file_data.length);
}

/**
 * Clear the file viewer, or add an optional message string
 * @param {string} info_msg An optional info message to dispaly in the viewer (default: "")
 */
function clearFileViewer(info_msg = "") {
    document.getElementById("btn_browse_local_file").value = "";
    document.getElementById("fm_viewer").innerHTML = info_msg;
    document.getElementById("label_filename").innerHTML = "N/a";
    document.getElementById("label_filename").title = "N/a";
    setFileSize(0);
    document.getElementById("label_file_size_transferred").innerHTML = "0"
    document.getElementById("btn_file_send").disabled = true;
    document.getElementById("btn_file_send").title = "";
    document.getElementById("fm_viewer").value = "";
}

/**
 * Return true if the file_type is compatible text file
 * @param {string} file_type Type of the file
 * @returns True if the file is a compatible text file
 */
function isTextFile(file_type) {
    switch(file_type) {
        case ".txt":
        case ".csv":
        case ".json":
        case "text/plain":
        case "application/vnd.ms-excel":
        case "application/json":
            return true;
            break;
        default:
            return false;
            break;
    }
}
                
/**
 * Return true if the file_type is compatible binary/hex file
 * @param {string} file_type Type of the file
 * @returns True if the file is a compatible binary/hex file
 */
function isBinFile(file_type) {
    switch(file_type) {
        case ".bin":
        case ".hex":
        case ".txt":
        case "application/octet-stream":
        case "application/macbinary":
            return true;
            break;
        default:
            return false;
            break;
    }
}

/**
 * Update the file size labels
 * @param {number, string} size Size of the file
 */
function setFileSize(size) {
    const f_size_elements = document.getElementsByClassName("label_file_size")
    for (var e of f_size_elements) {
        e.innerHTML = size;
    }
}