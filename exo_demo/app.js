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
    }
})


/**
 * Upon connection complete, change the Connect button & subscribe to characteristics
 */
function onConnectionComplete() {
    writeToCommandTerminal("Connected to " + GATT.deviceDisplayName())
    
    // upon successful conneciton, set the device name & change the button to 'Disconnect
    document.getElementById("label_dev").innerHTML = GATT.deviceDisplayName();
    document.getElementById("btn_connect").innerHTML = "Disconnect"
    
    subscribeToCharacteristics();

}

/**
 * Upon a disconnect from the BLE peripheral, disable buttons & print message
 * @param {event} event BLE GATT disconnect event
 */
function onDisconnect(event) {
    writeToCommandTerminal("Disconnected BLE Peripheral")

    document.getElementById("label_dev").innerHTML = GATT.deviceDisplayName();     // set to None by GATT
    document.getElementById("btn_connect").innerHTML = "Connect"
}

/**
 *  Called after successful connection. Allows characteristics to be subscribed to
 */
function subscribeToCharacteristics() {
   
    // subscribe to the NRT response char
    GATT.GATTtable.UARTservice.Tx.onValueChange( function(event) {    
        
        let rawArray = new Uint8Array(event.target.value.buffer);
        let str = "";
        for (let i = 0; i < rawArray.length; i++) {
            // convert the byte value to a it's 2-digit hex representation
            str += String.fromCharCode(rawArray[i]);
        }

        // // convert the ArrayBuffer to a HexStr
        // let rx_hex_str = new HexStr().fromUint8Array(new Uint8Array(event.target.value.buffer));
        // writeToCommandTerminal(rx_hex_str, "rx")
    })
};

/**
 * Write a message to the command terminal (including the rx/tx indicator)
 * @param {val} val A value to write to the command terminal
 * @param {"tx","rx","none"} tx_rx String to indicate if it is a tx or rx message
 */
function writeToCommandTerminal(val, tx_rx="none") {
    // determine the indicator direction
    const tx_rx_indicator = (tx_rx == "tx") ? "=> " : (tx_rx == "rx") ? "<= " : ""; 
    let val_str = "";

    // convert the value to a printable string
    if (val instanceof HexStr) {

        val_str = val.toUTF8String();
    }
    else {
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