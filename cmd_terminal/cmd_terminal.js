/**< Create an instance of the GATT manager to allow us to communicate with a BLE Peripheral */
let GATT = new GATTmanager();

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
});

/**< If the Large Request Cmd is valid, enable the Enter button, else disable it */
document.getElementById("l_request_cmd").addEventListener("input", function(event) {
    document.getElementById("l_request_enter").disabled = !isValidHexChars(event.target.value, 4);
});



function onConnectionComplete() {

    // upon successful conneciton, set the device name & change the button to 'Disconnect
    document.getElementById("label_dev").innerHTML = GATT.deviceDisplayName();
    document.getElementById("btn_connect").innerHTML = "Disconnect"
    
    subscibeToCharacteristics();

}

/** Called after successful connection. Allows characteristics to be subscribed to */
function subscibeToCharacteristics() {

    // DEBUG - subscribe to ButtonStatus & display in terminal
    GATT.GATTtable.RTservice.RTButtonStatus.onValueChange( function(event) {
        document.getElementById("label_cmd_responses").innerHTML += event.target.value.getUint8(0).toString() + "<br>";
        let response_label_div = document.getElementById("cmd_responses_terminal");
        response_label_div.scrollTop = response_label_div.scrollHeight;
    })
    
    // DEBUG - 
    GATT.GATTtable.NRTservice.NRTRequest.write("hello!");
};