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
            UUID: "0b0b1006-feed-dead-bee5-0be9b1091c50",                   // BLE_UUID_UART_SERVICE
            Rx: {
                UUID: "0b0b2015-feed-dead-bee5-0be9b1091c50",           // BLE_UUID_RX_CHAR
            },
            Tx: {
                UUID: "0b0b2016-feed-dead-bee5-0be9b1091c50"            // BLE_UUID_TX_CHAR
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
        document.getElementById("console_rx").value = this.value
        write(GATT.UART.Rx)
        // if (isWebBLEAvailable()) { stop() }
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
            optionalServices: [GATT.nonRealTime.UUID, GATT.realTime.UUID],
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
            return GATT.realTime.RTButtonStatus.handle.readValue();
        })
        .catch(error => {
            console.log("Waiting to start reading..." + error);
        })
    }

    function connectGATT() {
        if(bluetoothDeviceDetected.gatt.connected && characteristics.RTButtonStatus.handle) {
            return Promise.resolve();
        }

        return bluetoothDeviceDetected.gatt.connect()
        .then(server => {
            console.log("Getting GATT Service...");
            return server.getPrimaryService(GATT.realTime.UUID);
        })
        .then(service => {
            console.log("Getting GATT Characteristic...");
            return service.getCharacteristic(GATT.realTime.RTButtonStatus.UUID);
        })
        .then(characteristic => {
            GATT.realTime.RTButtonStatus.handle = characteristic;
            GATT.realTime.RTButtonStatus.handle.addEventListener("characteristicvaluechanged", handleChangedValue);
            start();

            document.getElementById("btn_start").disabled = false;
            document.getElementById("btn_stop").disabled = true;
        })
    }

    function write(characteristic, val_to_write) {
        return characteristic.handle.writeValue(val_to_write)
    }

    function handleChangedValue(event) {
        let val = event.target.value.getUint8(0);
        var now = new Date();
        console.log("> " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + " Val is " + val)
        document.getElementById("console_rx").value = val.toString();
    }
    
    function start() {
        GATT.realTime.RTButtonStatus.handle.startNotifications()
        .then(_ => {
            console.log("Start reading...");
            document.getElementById("btn_start").disabled = true;
            document.getElementById("btn_stop").disabled = false;
        })
        .catch(error => {
            console.log("[ERROR] Start: " + error)
        })
    }

    function stop() {
        GATT.realTime.RTButtonStatus.handle.stopNotifications()
        .then(_ => {
            console.log("Stop reading...");
            document.getElementById("btn_start").disabled = false;
            document.getElementById("btn_stop").disabled = true;
        })
        .catch(error => {
            console.log("[ERROR] Stop: " + error)
        })
    }