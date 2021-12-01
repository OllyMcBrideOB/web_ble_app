/**< Create an instance of the GATT manager to allow us to communicate with a BLE Peripheral */
let GATT = new GATTmanager();

/**< Standard & large request messages that are to be sent when the enter button is pressed */
let standard_req_msg = new Message();
let large_req_msg = new Message();

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
            // reset the header to known values
            document.getElementById("label_dev").innerHTML = GATT.deviceDisplayName();     // set to None by GATT
            document.getElementById("btn_connect").innerHTML = "Connect"
        }
    }
})

/**< If the Standard Request Cmd is valid, enable the Enter button, else disable it */
document.getElementById("s_request_cmd").addEventListener("input", function(event) {
    document.getElementById("s_request_enter").disabled = !isValidHexChars(event.target.value, 4);
    document.getElementById("l_request_cmd").value = event.target.value;
});

/**< If the Large Request Cmd is valid, enable the Enter button, else disable it */
document.getElementById("l_request_cmd").addEventListener("input", function(event) {
    document.getElementById("l_request_enter").disabled = !isValidHexChars(event.target.value, 4);
    document.getElementById("s_request_cmd").value = event.target.value;
});

/**< If the Standard Request payload is valid, enable the Enter button, else disable it */
document.getElementById("s_request_payload").addEventListener("input", function(event) {
    document.getElementById("l_request_payload").value = event.target.value;

});

/**< If the Large Request payload is valid, enable the Enter button, else disable it */
document.getElementById("l_request_payload").addEventListener("input", function(event) {
    document.getElementById("s_request_payload").value = event.target.value;
});

/**< If the Standard Request 'Enter' button is clicked */
document.getElementById("s_request_enter").addEventListener("click", function(event) {
    if (GATT.isConnected()) {
        let tx_msg = new Message(document.getElementById("s_request_cmd").value, 
                                document.getElementById("s_request_payload").value);
        tx_msg.print();

        GATT.GATTtable.NRTservice.NRTRequest.write(tx_msg);

        writeToCommandTerminal(tx_msg, "tx")
    } else {
        writeToCommandTerminal("No BLE Device Connected")
    }
});

/**
 * When a file has been selected from the file explorer, print it to the file manager text box
 */
document.getElementById("file_selector").addEventListener("change", function(event) {
    // if a valid file was selected
    if (this.files.length > 0) {
        // prepare a file reader
        const reader = new FileReader();
        
        // prepare the 'load' callback
        reader.onload = function fileReadComplete() {
            let file_contents = new HexStr();
            file_contents.fromUint8Array(new Uint8Array(reader.result));
            document.getElementById("file_viewer_box").innerHTML = file_contents.toString("-").toUpperCase();
            document.getElementById("file_size_total").innerHTML = file_contents.length;
        };

        // peform the read
        reader.readAsArrayBuffer(this.files[0]);

    } else {
        console.log("No file selected (len == 0)")
    }
});

/**
 * When the File Manager 'start' button has been clicked, start a file transfer to the Hero BLE module
 */
document.getElementById("file_transfer_start_btn").addEventListener("click", function(event) {
    const buf_size = 100;
    let file_data = new Uint8Array(buf_size);
    for (var i in file_data) {
        file_data[i] = i;
    }

    const file = new File(file_data, "test_filename.bin");
    file.data = new HexStr().fromUint8Array(file_data);
    
    const f = new FileTransfer;
    f.start(file);
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
    writeToCommandTerminal("Connected to " + GATT.deviceDisplayName(), "none")

    // upon successful conneciton, set the device name & change the button to 'Disconnect
    document.getElementById("label_dev").innerHTML = GATT.deviceDisplayName();
    document.getElementById("btn_connect").innerHTML = "Disconnect"
    
    subscibeToCharacteristics();

}

/**
 *  Called after successful connection. Allows characteristics to be subscribed to
 */
function subscibeToCharacteristics() {
   
    // subscribe to the NRT response char
    GATT.GATTtable.NRTservice.NRTResponse.onValueChange( function(event) {      
        // convert the ArrayBuffer to a HexStr
        let rx_hex_str = new HexStr().fromUint8Array(new Uint8Array(event.target.value.buffer));
        writeToCommandTerminal(rx_hex_str, "rx")
    })
};

/**
 * Write a message to the command terminal (including the rx/tx indicator)
 * @param {val} val A value to write to the command terminal
 * @param {"tx","rx","none"} tx_rx String to indicate if it is a tx or rx message
 */
function writeToCommandTerminal(val, tx_rx) {
    // determine the indicator direction
    const tx_rx_indicator = (tx_rx == "tx") ? "=> " : (tx_rx == "rx") ? "<= " : ""; 
    let val_str = "";

    // convert the value to a printable string
    if (val instanceof HexStr) {
        // convert the hex_str to a message
        let msg = new Message().fromHexStr(val);

        val_str = msg.toString("-");
    } else if (val instanceof Message) {
        val_str = val.toString();
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

    // write the message to the Command Terminal component
    document.getElementById("label_cmd_responses").innerHTML += getTimestampStr() + " " + tx_rx_indicator + val_str + "<br>";

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

