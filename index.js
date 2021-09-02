var deviceName = "Hero BLE";
var bluetoothDeviceDetected;
// var gattCharacteristic;

    let GATT = {
        nonRealTime: {
            UUID: "0b0b1007-feed-dead-bee5-0be9b1091c50",                   // BLE_UUID_REAL_TIME_SERVICE
            NRTRequest: {
                UUID: "0b0b2017-feed-dead-bee5-0be9b1091c50",           // BLE_UUID_NRT_REQUEST_CHAR
            },
            NRTResponse: {
                UUID: "0b0b2018-feed-dead-bee5-0be9b1091c50",           // BLE_UUID_NRT_RESPONSE_CHAR
            }
        },
        realTime: {
            UUID: "0b0b1008-feed-dead-bee5-0be9b1091c50",                   // BLE_UUID_REAL_TIME_SERVICE
            RTButtonStatus: {
                UUID: "0b0b201a-feed-dead-bee5-0be9b1091c50",           // BLE_UUID_RT_BUTTON_STATUS_CHAR
            }
        },
        UART: {
            UUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",                   // NUS
            Rx: {
                UUID: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",           // NUS Rx
            },
            Tx: {
                UUID: "6e400003-b5a3-f393-e0a9-e50e24dcca9e"            // NUS Tx
            }  
        }
    }

    document.getElementById("btn_connect").addEventListener("click", function() {
        if (isWebBLEAvailable()) { read() }
    })

    document.getElementById("btn_start").addEventListener("click", function(event) {
        if (isWebBLEAvailable()) { start() }
    })

    document.getElementById("btn_stop").addEventListener("click", function(event) {
        if (isWebBLEAvailable()) { stop() }
    })

    document.getElementById("slider").addEventListener("input", function(event) {
        document.getElementById("label_slider").innerHTML = this.value;
        if (isWebBLEAvailable()) { write(GATT.UART.Rx) }
    })

    document.getElementById("btn_uart_enter").addEventListener("click", function(event) {
        writeToUART(document.getElementById("uart_tx").value);
    })

    document.getElementById("btn_uart_clear").addEventListener("click", function(event) {
        document.getElementById("uart_rx").innerHTML = "";
    })

    document.getElementById("uart_tx").addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            writeToUART(document.getElementById("uart_tx").value);
        }
    });

    function isWebBLEAvailable() {
        if (!navigator.bluetooth) {
            console.log("Web Bluetooth is not available!");
            return false;
        }
        return true;
    }

    function getDeviceInfo() {
        let options = {
            optionalServices: [GATT.nonRealTime.UUID, GATT.realTime.UUID, GATT.UART.UUID],
            filters: [
                { name: deviceName }
            ]
        }
        
        console.log("Requesting BLE device info...");
        return navigator.bluetooth.requestDevice(options).then(device => {
            bluetoothDeviceDetected = device;
        }).catch(error => {
            console.log("Request device error: " + error);
        })
    }

    function read() {
        return (bluetoothDeviceDetected ? Promise.resolve() : getDeviceInfo())
        .then(connectGATT)
        .then(_ => {
            console.log("Reading val...");
        })
        .catch(error => {
            console.log("[ERROR line: " + error.lineNumber + "] read(): " + error)
        })
    }

function connectGATT() {
    if(bluetoothDeviceDetected.gatt.connected) {
        return Promise.resolve();
    }

    var gatt_server;

    return bluetoothDeviceDetected.gatt.connect()
    .then(server => {
        console.log("Discovering Services...");

        gatt_server = server;
    })
    // discover NRT Service
    .then(() => {
        // discover NRT characteristics
        return gatt_server.getPrimaryService(GATT.nonRealTime.UUID)
        // store service handle
        .then(service => {
            GATT.nonRealTime.handle = service;
        })
        // discover nonRealTime NRTRequest char
        .then(() => {
            return GATT.nonRealTime.handle.getCharacteristic(GATT.nonRealTime.NRTRequest.UUID)
            // store nonRealTime NRTRequest handle
            .then(characteristic => {
                GATT.nonRealTime.NRTRequest.handle = characteristic;
            })
        })
        // discover nonRealTime NRTResponse char
        .then(() => {
            return GATT.nonRealTime.handle.getCharacteristic(GATT.nonRealTime.NRTResponse.UUID)
            // store nonRealTime NRTResponse handle & add event listener to nonRealTime NRTResponse
            .then(characteristic => {
                GATT.nonRealTime.NRTResponse.handle = characteristic;
                GATT.nonRealTime.NRTResponse.handle.addEventListener("characteristicvaluechanged", onNRTResponse);
            })
        })
    })
    // discover RT Service
    .then(() => {
        return gatt_server.getPrimaryService(GATT.realTime.UUID)
        // store service handle
        .then(service => {
            GATT.realTime.handle = service;
        })
        // discover RTButtonStatus char
        .then(() => {
            return GATT.realTime.handle.getCharacteristic(GATT.realTime.RTButtonStatus.UUID)
            // store RTButtonStatus char & add event listener to ButtonStatus char
            .then(characteristic => {
                GATT.realTime.RTButtonStatus.handle = characteristic;
                GATT.realTime.RTButtonStatus.handle.addEventListener("characteristicvaluechanged", onRTButtonStatusChange);
            })
        })
    })
    // discover UART Service
    .then(() => {
        // discover UART characteristics
        return gatt_server.getPrimaryService(GATT.UART.UUID)
        // store service handle
        .then(service => {
            GATT.UART.handle = service;
        })
        // discover UART Rx char
        .then(() => {
            return GATT.UART.handle.getCharacteristic(GATT.UART.Rx.UUID)
            // store UART Rx handle
            .then(characteristic => {
                GATT.UART.Rx.handle = characteristic;
            })
        })
        // discover UART Tx char
        .then(() => {
            return GATT.UART.handle.getCharacteristic(GATT.UART.Tx.UUID)
            // store UART Tx handle & add event listener to UART Tx
            .then(characteristic => {
                GATT.UART.Tx.handle = characteristic;
                GATT.UART.Tx.handle.addEventListener("characteristicvaluechanged", onUARTReceived);
            })
        })
    })

    // Start the BLE notifications
    .then(() => {
        start()
        document.getElementById("btn_start").disabled = false;
        document.getElementById("btn_stop").disabled = true;
    })
}

function ab2str(buf) {
    var enc = new TextDecoder("utf-8");
    return enc.decode(buf);    
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

function write(characteristic, val_to_write) {
    return characteristic.handle.writeValue(str2ab(val_to_write))       // ArrayBuffer
}

function onRTButtonStatusChange(event) {
    let val = event.target.value.getUint8(0);
    document.getElementById("label_btnstatus").innerHTML = val.toString();
}

function onUARTReceived(event) {
    // decode from ArrayBuffer to UTF-8 String
    let val = ab2str(event.target.value);       // ArrayBuffer
    console.log("UARTrx> '" + val + "'")
    // document.getElementById("uart_rx").innerHTML += val;
    let uart_rx_div = document.getElementById("uart_rx");
    uart_rx_div.innerHTML += val;
    uart_rx_div.scrollTop = uart_rx_div.scrollHeight;
}

function writeToUART(value) {
    if (bluetoothDeviceDetected)
    {
        console.log("Writing '" + value + "' to UART");
        write(GATT.UART.Rx, value);
    }
    else
    {
        console.log("ERROR - Failed to write '" + value + "' to UART as BLE not connected")
    }
}

function onNRTResponse(event) {
    let val = event.target.value;
    var now = new Date();
    console.log("> " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + " onNRTResponse is " + val)
    document.getElementById("uart_rx").value = val;
}

function start() {
    GATT.realTime.RTButtonStatus.handle.startNotifications()
    GATT.UART.Tx.handle.startNotifications()
    .then(_ => {
        console.log("Start reading...");
        document.getElementById("btn_start").disabled = true;
        document.getElementById("btn_stop").disabled = false;
    })
    .catch(error => {
        console.log("[ERROR line: " + error.lineNumber + "] start(): " + error)
    })
}

function stop() {
    GATT.realTime.RTButtonStatus.handle.stopNotifications()
    GATT.UART.Tx.handle.stopNotifications()
    .then(_ => {
        console.log("Stop reading...");
        document.getElementById("btn_start").disabled = false;
        document.getElementById("btn_stop").disabled = true;
    })
    .catch(error => {
        console.log("[ERROR line: " + error.lineNumber + "] stop(): " + error)
    })
}