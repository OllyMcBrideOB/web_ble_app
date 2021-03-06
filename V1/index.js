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
            },
            NRTLargeRequest: {
                UUID: "0b0b201e-feed-dead-bee5-0be9b1091c50",           // BLE_UUID_NRT_LARGE_REQUEST_CHAR
            },
            NRTLargeResponse: {
                UUID: "0b0b2019-feed-dead-bee5-0be9b1091c50",           // BLE_UUID_NRT_LARGE_RESPONSE_CHAR
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

    document.getElementById("slider_grip").addEventListener("mouseup", function(event) {
        document.getElementById("label_grip_slider").innerHTML = this.value;
        if (isWebBLEAvailable()) { setGripPos(this.value) }
    })

    document.getElementById("slider_finger0").addEventListener("mouseup", function(event) {
        document.getElementById("label_finger0_slider").innerHTML = this.value;
        if (isWebBLEAvailable()) { setFingerPos(0, this.value) }
    })

    document.getElementById("slider_finger1").addEventListener("mouseup", function(event) {
        document.getElementById("label_finger1_slider").innerHTML = this.value;
        if (isWebBLEAvailable()) { setFingerPos(1, this.value) }
    })

    document.getElementById("slider_finger2").addEventListener("mouseup", function(event) {
        document.getElementById("label_finger2_slider").innerHTML = this.value;
        if (isWebBLEAvailable()) { setFingerPos(2, this.value) }
    })

    document.getElementById("slider_finger3").addEventListener("mouseup", function(event) {
        document.getElementById("label_finger3_slider").innerHTML = this.value;
        if (isWebBLEAvailable()) { setFingerPos(3, this.value) }
    })

    document.getElementById("btn_uart_enter").addEventListener("click", function(event) {
        writeToUART(document.getElementById("uart_tx").value);
    })

    document.getElementById("btn_uart_clear").addEventListener("click", function(event) {
        document.getElementById("uart_rx").innerHTML = "";
        document.getElementById("uart_tx").value = "";
    })

    document.getElementById("uart_tx").addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            writeToUART(document.getElementById("uart_tx").value);
        }
    });
    
    document.getElementById("s_request_cmd").addEventListener("input", function(event) {
        document.getElementById("s_request_enter").disabled = (event.target.value.length == 4 ? false : true);
    });

    document.getElementById("s_request_payload").addEventListener("input", function(event) {
        let hex_str = Number(event.target.value.length).toString(16).toUpperCase().padStart(4, "0");
        let correct_endian = hex_str.match(/../g).reverse().join('');

        let len_object = document.getElementById("s_request_len");
        len_object.style.color = (event.target.value.length > 32) ? "red" : "#545454";
        len_object.value = correct_endian;
    });

    document.getElementById("container_commands_standard").addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            
            let cmd = document.getElementById("s_request_cmd").value;
            let len = document.getElementById("s_request_len").value;
            let payload = document.getElementById("s_request_payload").value;
                    
            writeToNRTRequest(cmd, len, payload);
        }
    });

    document.getElementById("s_request_enter").addEventListener("click", function(event) {
        let cmd = document.getElementById("s_request_cmd").value;
        let len = document.getElementById("s_request_len").value;
        let payload = document.getElementById("s_request_payload").value;
                
        writeToNRTRequest(cmd, len, payload);
    })

    document.getElementById("l_request_cmd").addEventListener("input", function(event) {
        document.getElementById("l_request_enter").disabled = (event.target.value.length == 4 ? false : true);
    });

    
    document.getElementById("l_request_packet_num").addEventListener("input", function(event) {

        // THIS IS WRONG!!! this should count the number of bytes, not the number 
        // characters (i.e. 0x0000 is only 2 bytes long, but is 4 chars long)

        let packet_num_len = Number(event.target.value.length);
        let payload_len = Number(document.getElementById("l_request_payload").value.length);
        let calculated_len = packet_num_len + payload_len;

        let hex_str = Number(calculated_len).toString(16).toUpperCase().padStart(4, "0");
        let correct_endian = hex_str.match(/../g).reverse().join('');

        let len_object = document.getElementById("l_request_len");
        len_object.style.color = (event.target.value.length > 251) ? "red" : "#545454";
        len_object.value = correct_endian;
    });

    document.getElementById("l_request_payload").addEventListener("input", function(event) {
        // THIS IS WRONG!!! this should count the number of bytes, not the number 
        // characters (i.e. 0x0000 is only 2 bytes long, but is 4 chars long)

        let packet_num_len = Number(document.getElementById("l_request_packet_num").value.length);
        let payload_len = Number(event.target.value.length);
        let calculated_len = packet_num_len + payload_len;

        let hex_str = Number(calculated_len).toString(16).toUpperCase().padStart(4, "0");
        let correct_endian = hex_str.match(/../g).reverse().join('');

        let len_object = document.getElementById("l_request_len");
        len_object.style.color = (event.target.value.length > 251) ? "red" : "#545454";
        len_object.value = correct_endian;
    });

    document.getElementById("container_commands_large").addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();

            let cmd = document.getElementById("l_request_cmd").value;
            let len = document.getElementById("l_request_len").value;
            let packet_num = document.getElementById("l_request_packet_num").value;
            let payload = document.getElementById("l_request_payload").value;
                    
            writeToNRTLargeRequest(cmd, len, packet_num, payload);
        }
    })

    document.getElementById("l_request_enter").addEventListener("click", function(event) {
        let cmd = document.getElementById("l_request_cmd").value;
        let len = document.getElementById("l_request_len").value;
        let packet_num = document.getElementById("l_request_packet_num").value;
        let payload = document.getElementById("l_request_payload").value;
                
        writeToNRTLargeRequest(cmd, len, packet_num, payload);
    })

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
        // discover nonRealTime NRTLargeRequest char
        .then(() => {
            return GATT.nonRealTime.handle.getCharacteristic(GATT.nonRealTime.NRTLargeRequest.UUID)
            // store nonRealTime NRTLargeRequest handle
            .then(characteristic => {
                GATT.nonRealTime.NRTLargeRequest.handle = characteristic;
            })
        })
        // discover nonRealTime NRTLargeResponse char
        .then(() => {
            return GATT.nonRealTime.handle.getCharacteristic(GATT.nonRealTime.NRTLargeResponse.UUID)
            // store nonRealTime NRTResponse handle & add event listener to nonRealTime NRTLargeResponse
            .then(characteristic => {
                GATT.nonRealTime.NRTLargeResponse.handle = characteristic;
                GATT.nonRealTime.NRTLargeResponse.handle.addEventListener("characteristicvaluechanged", onNRTLargeResponse);
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

function writeToCharacteristic(characteristic, val_to_write) {
    // return characteristic.handle.writeValue(str2ab(val_to_write))       // ArrayBuffer
    return characteristic.handle.writeValueWithoutResponse(str2ab(val_to_write))       // ArrayBuffer
}

function onRTButtonStatusChange(event) {
    let val = event.target.value.getUint8(0);
    document.getElementById("label_btnstatus").innerHTML = val.toString();
}

function onUARTReceived(event) {
    // decode from ArrayBuffer to UTF-8 String
    let val = ab2str(event.target.value);       // ArrayBuffer
    // console.log("UARTrx> '" + val + "'")
    let uart_rx_div = document.getElementById("uart_rx");
    uart_rx_div.innerHTML += "<pre>" + val + "</pre>";          // preserve \n char
    uart_rx_div.scrollTop = uart_rx_div.scrollHeight;
}

function writeToUART(value) {
    if (bluetoothDeviceDetected)
    {
        console.log("Writing '" + value + "' to UART");
        writeToCharacteristic(GATT.UART.Rx, value);
    }
    else
    {
        console.log("ERROR - Failed to write '" + value + "' to UART as BLE not connected")
    }
}

function setGripPos(pos) {
    let buf = new ArrayBuffer(6);
    let msg = new Uint8Array(buf);
    msg = Uint8Array.of(0x38, 0x00, 0x02, 0x00, Number(pos), 0xFF);

    GATT.nonRealTime.NRTRequest.handle.writeValueWithoutResponse(msg);
}

function setFingerPos(fNum, pos) {
    let buf = new ArrayBuffer(6);
    let msg = new Uint8Array(buf);
    msg = Uint8Array.of(0x2D, 0x00, 0x05, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF);
    msg[fNum + 4] = Number(pos);

    GATT.nonRealTime.NRTRequest.handle.writeValueWithoutResponse(msg);

    console.log("setFingerPos(" + fNum + ", " + pos + ")");
}

function writeToNRTRequest(cmd, len, payload) {

    let msg_str = cmd + len + payload;

    console.log("cmd: " + cmd + " len: " + len + " payload: " + payload)

    let buf = new ArrayBuffer(msg_str.length / 2);
    let msg = new Uint8Array(buf);

    for (var i in msg)
    {
        // convert 2-char hex string values to a hex-byte within the msg array
        msg[i] = parseInt(msg_str.substring((i*2), (i*2)+2), 16);
    }

    GATT.nonRealTime.NRTRequest.handle.writeValueWithoutResponse(msg);
}

function onNRTResponse(event) {
    let msg = new Uint8Array(event.target.value.buffer);
    var val = ""
    for (var i in msg)
    {
        val += msg[i].toString(16).padStart(2, "0");
    }
    console.log("onNRTResponse '" + val + "'")

    document.getElementById("s_response_cmd").value = val.substring(0, 4);
    document.getElementById("s_response_len").value = val.substring(4, 8);
    document.getElementById("s_response_payload").value = val.substring(8);
}

function writeToNRTLargeRequest(cmd, len, packet_num, payload) {

    let msg_str = cmd + len + packet_num + payload;

    console.log("cmd: " + cmd + " len: " + len + " packet_num: " + packet_num + " payload: " + payload)

    let buf = new ArrayBuffer(msg_str.length / 2);
    let msg = new Uint8Array(buf);

    for (var i in msg)
    {
        // convert 2-char hex string values to a hex-byte within the msg array
        msg[i] = parseInt(msg_str.substring((i*2), (i*2)+2), 16);
    }

    GATT.nonRealTime.NRTLargeRequest.handle.writeValueWithoutResponse(msg);
}

function onNRTLargeResponse(event) {
    let msg = new Uint8Array(event.target.value.buffer);
    var val = ""
    for (var i in msg)
    {
        val += msg[i].toString(16).padStart(2, "0");
    }

    document.getElementById("l_response_cmd").value = val.substring(0, 4);
    document.getElementById("l_response_len").value = val.substring(4, 8);
    document.getElementById("l_response_packet_num").value = val.substring(8, 12);
    document.getElementById("l_response_payload").value = val.substring(12);

    // var now = new Date();
    // document.getElementById("uart_rx").value = val;
}

function start() {
    GATT.nonRealTime.NRTResponse.handle.startNotifications()
    GATT.nonRealTime.NRTLargeResponse.handle.startNotifications()
    GATT.realTime.RTButtonStatus.handle.startNotifications()
    GATT.UART.Tx.handle.startNotifications()
    .then(_ => {
        console.log("Connected");
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