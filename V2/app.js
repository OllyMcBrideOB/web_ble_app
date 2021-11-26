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
    
    // document.getElementById("s_request_len").value = event.target.value.length;
    document.getElementById("l_request_payload").value = event.target.value;

});

/**< If the Large Request payload is valid, enable the Enter button, else disable it */
document.getElementById("l_request_payload").addEventListener("input", function(event) {
    document.getElementById("s_request_payload").value = event.target.value;
});

/**< If the Standard Request 'Enter' button is clicked */
document.getElementById("s_request_enter").addEventListener("click", function(event) {
    if (GATT.connected()) {
        let cmd = new HexStr();
        let payload = new HexStr();
        cmd.fromHexString(document.getElementById("s_request_cmd").value);
        payload.fromHexString(document.getElementById("s_request_payload").value);

        let tx_msg = new Message(cmd, payload);
        tx_msg.print();


        // write the message to the Command Terminal component
        document.getElementById("label_cmd_responses").innerHTML += "=>" + rx_msg.toString() + "<br>";
        let response_label_div = document.getElementById("cmd_responses_terminal");
        response_label_div.scrollTop = response_label_div.scrollHeight;
    }
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

    // upon successful conneciton, set the device name & change the button to 'Disconnect
    document.getElementById("label_dev").innerHTML = GATT.deviceDisplayName();
    document.getElementById("btn_connect").innerHTML = "Disconnect"
    
    subscibeToCharacteristics();

}

/**
 *  Called after successful connection. Allows characteristics to be subscribed to
 */
function subscibeToCharacteristics() {

    // // DEBUG - subscribe to ButtonStatus & display in terminal
    // GATT.GATTtable.RTservice.RTButtonStatus.onValueChange( function(event) {
    //     document.getElementById("label_cmd_responses").innerHTML += event.target.value.getUint8(0).toString() + "<br>";
    //     let response_label_div = document.getElementById("cmd_responses_terminal");
    //     response_label_div.scrollTop = response_label_div.scrollHeight;
    // })
    
    // // DEBUG - 
    // GATT.GATTtable.NRTservice.NRTRequest.write("hello!");
    
    // subscribe to the NRT response char
    GATT.GATTtable.NRTservice.NRTResponse.onValueChange( function(event) {
        // convert the ArrayBuffer to a HexStr
        let rx_hex_str = new HexStr();
        rx_hex_str.fromUint8Array(new Uint8Array(event.target.value.buffer));
        // convert the HexStr to a Message
        let rx_msg = new Message();
        rx_msg.fromHexStr(rx_hex_str);
        // write the message to the Command Terminal component
        document.getElementById("label_cmd_responses").innerHTML += "<=" + rx_msg.toString() + "<br>";
        let response_label_div = document.getElementById("cmd_responses_terminal");
        response_label_div.scrollTop = response_label_div.scrollHeight;
    })
};