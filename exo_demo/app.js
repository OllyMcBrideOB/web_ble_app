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


let chart_index = 0;

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
        writeToCommandTerminal(str, "rx")

        let json_obj = JSON.parse(str);

        drawChart(json_obj);
        moveElbow(json_obj);
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



// load current chart package
google.charts.load("current", {
    packages: ["corechart", "line"]
  });
  
// set callback function when api loaded
google.charts.setOnLoadCallback(function() {
    global_chart = new google.visualization.LineChart(document.getElementById("chart_div"));
});


var global_chart;
let sample_num = 0;
var chart_data;
let chart_options;
let chart_data_labels;
function drawChart(json_obj) {
    if (json_obj.hasOwnProperty("plot")){
            
        if (sample_num == 0) {

            chart_data_labels = [ "Sample" ].concat(Object.keys(json_obj));

            // create data object with default value
            chart_data = google.visualization.arrayToDataTable([
                chart_data_labels,
                [0, 0, 0]
            ]);

            // create options object with titles, colors, etc.
            chart_options = {
                title: "Exo Data",
                hAxis: {
                title: "Sample"
                }
            };
        }

        let row_data = [sample_num++];
        for (let i = 1; i < chart_data_labels.length; i++)
        {
            row_data.push(json_obj[chart_data_labels[i]]);
        }

        let row_num = chart_data.addRow(row_data);
        if (row_num >= 100) {
            chart_data.removeRow(0);
        }
        global_chart.draw(chart_data, chart_options);
    }
}


var gif_ctrl = new SuperGif({ gif: document.getElementById("elbow_gif"), progressbar_height: 0 } );
gif_ctrl.load();


function moveElbow(json_obj) {
    
    let moved = false;
    const vel = 5;
    if (json_obj.hasOwnProperty("plot")){
        if (json_obj.plot.hasOwnProperty("btn_extend")) {
            if (json_obj.plot.btn_extend == 0) {
                if (gif_ctrl.get_current_frame() < (gif_ctrl.get_length() - vel)) {
                    gif_ctrl.move_relative(vel);
                    moved = true;
                }
            }
        }
        if (json_obj.plot.hasOwnProperty("btn_flex")) {
            if (json_obj.plot.btn_flex == 0) {
                if (gif_ctrl.get_current_frame() >  vel) {
                    gif_ctrl.move_relative(-vel);
                    moved = true;
                }
            }
        }
    }
    if (json_obj.hasOwnProperty("joint_angle") && !moved) {
        let frame_num = Math.round(MAP(json_obj.joint_angle, 0, 4095, 0, gif_ctrl.get_length()));
        // console.log(frame_num);
        gif_ctrl.move_to(frame_num);
    }
}


function MAP(v, minIn, maxIn, minOut, maxOut) {
    return ((v - minIn) * (maxOut - minOut) / (maxIn - minIn) + minOut);
}