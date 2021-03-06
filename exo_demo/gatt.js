


class GATTmanager {
    constructor() {
        this.onDisconnect_cb = [];
        this.GATTtable = {};
        this.connected = false;

        this.addService("UARTservice", new NUS_UUID("0001")).
                addCharacteristic("Rx", new NUS_UUID("0002")).
                addCharacteristic("Tx", new NUS_UUID("0003"));


        // generate the connection options
        this.options = {
            optionalServices: [],
            filters: [
                { services: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"] }
            ],
        }
        
        // append the services from the GATT table to the optionalServices to allow them to be interacted wtih
        for (var service in this.GATTtable)
        {
            this.options.optionalServices.push(this.GATTtable[service].UUID.toString());
        }
    }

    /**< Assign a service to the GATT table */
    addService(name, service_uuid) {
        return this.GATTtable[name] = new GATTservice(name, service_uuid, this);
    }


    /**< Return true if Web BLE is available on this browser */
    isWebBLEAvailable() {
        if (!navigator.bluetooth) {
            console.log("Web Bluetooth is not available!");
            return false;
        }
        return true;
    }

    /**< Return true if we are currently connected to a BLE peripheral */
    isConnected() {
        return this.connected;
    }

    /**< Get the display name of the connected device */
    deviceDisplayName() {
        // TODO, read the friendly name of the Hero BLE module
        return this.isConnected() ? "Exo Demo" : "None";
    }

    /**< Display the device selector window, then connect to the selected device */
    async connect() {
        // TODO, what happens if we are already connected?
        console.log("connect()");

        try {
            console.log("Trying to connect to a device")

            // display device selector window and get device selected by the user
            this.BLEDevice = await navigator.bluetooth.requestDevice(this.options);
            
            console.log("Discovering services...")
            // get the representation of the GATT server on the remote device
            this.server = await this.BLEDevice.gatt.connect();    

            this.BLEDevice.addEventListener("gattserverdisconnected", this.#onDisconnect.bind(this));

            // iterate through each of the predefined services in the local GATT table
            for (var service in this.GATTtable)
            {
                // ensure the object is a service
                if (this.GATTtable[service] instanceof GATTservice)
                {
                    // get the handle for the service
                    this.GATTtable[service].handle = await this.server.getPrimaryService(this.GATTtable[service].UUID.toString());
                    
                    // iterate through each of the predefined characteristics in the local GATT table
                    for (var characteristic in this.GATTtable[service])
                    {
                        // ensure the object is a characteristic
                        if (this.GATTtable[service][characteristic] instanceof GATTcharacteristic)
                        {
                            // get the handle for the characteristic
                            this.GATTtable[service][characteristic].handle = await this.GATTtable[service].handle.getCharacteristic(this.GATTtable[service][characteristic].UUID.toString());
                        }
                    }
                }
            }

            console.log("Connection successful")

            this.connected = true;
        } catch(error)
        {
            throw error;
        }
    }

    /**
     * Add a callback to be called when the BLE device disconnects
     * @param {function} cb Callback to call when the BLE device disconnects
     */
    subscribeToDisconnect(cb) {
        this.onDisconnect_cb.push(cb);
        //this.BLEDevice.addEventListener("gattserverdisconnected", cb);
    }
    
    /**< Disconnect from the BLE peripheral */
    disconnect() {
        this.server.disconnect();
        this.connected = false;

        // iterate through each of the predefined services in the local GATT table
        for (var service in this.GATTtable)
        {
            // ensure the object is a service
            if (this.GATTtable[service] instanceof GATTservice)
            {
                // iterate through each of the predefined characteristics in the local GATT table
                for (var characteristic in this.GATTtable[service])
                {
                    // ensure the object is a characteristic
                    if (this.GATTtable[service][characteristic] instanceof GATTcharacteristic)
                    {
                        // unregister all chained callbacks
                        this.GATTtable[service][characteristic].onValueChangeCallbackChain = [];
                    }
                }
            }
        }
    }

    /**
     * Callback called upon disconnect
     * @param {*} event BLE on disconnect event
     */
    #onDisconnect(event) {
        this.disconnect();
        for (let cb of this.onDisconnect_cb) {
            cb(event);
        }

        this.onDisconnect_cb = [];
    }
}


class GATTitem {
    /**
     * @param {string} name Name of the GATT item
     * @param {string} long_uuid Long UUID of the GATT item
     * @param {GATTmanager} gatt_manager Reference to the GATTManager
     */
    constructor(name, long_uuid, gatt_manager) {
        this.name = name;
        this.UUID = long_uuid;
        this.gatt_manager = gatt_manager
        this.handle;
    }
}

class GATTservice extends GATTitem {
    /**< Assign a characteristic to this service */
    addCharacteristic(name, characteristic_uuid) {
        this[name] = new GATTcharacteristic(name, characteristic_uuid, this.gatt_manager);

        return this;    // allow this function to be chainable, to add multiple chars
    }
}

class GATTcharacteristic extends GATTitem {
    /*< Read the current value of the characteristic */
    read() {
        if (this.gatt_manager.isConnected())
        {
            // TODO, read the current value of the characteristic
        }
        // else if we're not currently connected to a BLE peripheral
        else
        {
            console.log("ERROR - Unable to write val to the '%s' characteristic as we are not connected to a BLE device", this.name);
        }
    }

    /**< Write a value to the characteristic */
    write(val) {
        if (this.gatt_manager.isConnected())
        {
            var hexStr = new HexStr();
            
            // convert the value to a HexStr
            if (val instanceof HexStr) {
                hexStr = val;
            } else {
                switch (typeof val) {
                    case "string":
                        hexStr.fromUTF8String(val);
                        break;
                    case "Uint8Array":
                        hexStr.fromArray(val);
                        break;
                    default:
                        console.log("ERROR - Unable to write val to the '%s' characteristic as type '%s' is not handled",
                            this.name, typeof val)
                }
            }

            // try to write the HexStr to the characteristic
            try {
                // hexStr.print();

                // TODO, convert val to Uint8Array
                this.handle.writeValueWithoutResponse(hexStr.rawArray);
            } catch(error) {
                console.log("ERROR - Unable to write '%s' to the '%s' characteristic " + error, val.toString(), this.name, this.UUID)
            }

        }
        // else if we're not currently connected to a BLE peripheral
        else
        {
            console.log("ERROR - Unable to write val to the '%s' characteristic as we are not connected to a BLE device", this.name);
        }
    }

    /**
     * Add a callback to the list of callbacks to call upon receiving a value from the characteristic
     * @param {function} callback callback to call upon receiving a value from the characteristic
     */
     onValueChange(callback) {
        if (this.gatt_manager.isConnected()) {
            this.handle.addEventListener("characteristicvaluechanged", callback);
            this.handle.startNotifications();
        }
        // else if we're not currently connected to a BLE peripheral
        else
        {
            console.log("ERROR - Unable to write val to the '%s' characteristic as we are not connected to a BLE device", this.name);
        }
    }
    
    /**
     * Remove a callback to the list of callbacks to call upon receiving a value from the characteristic
     * @param {function} callback Callback to remove from the event
     */
    onValueChangeRemove(callback) {
        this.handle.removeEventListener("characteristicvaluechanged", callback);
    }
}
