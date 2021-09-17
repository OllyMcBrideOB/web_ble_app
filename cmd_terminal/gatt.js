


class GATTmanager {
    constructor() {
        this.GATTtable = {};
        this.connected = false;

        // define the GATT table layout
        this.addService("NRTservice", new OB_UUID("1007")).
                addCharacteristic("NRTRequest", new OB_UUID("2017")).
                addCharacteristic("NRTResponse", new OB_UUID("2018")).
                addCharacteristic("NRTLargeRequest", new OB_UUID("201e")).
                addCharacteristic("NRTLargeResponse", new OB_UUID("2019"));

        this.addService("RTservice", new OB_UUID("1008")).
                addCharacteristic("RTButtonStatus", new OB_UUID("201a"));


        // generate the connection options
        this.options = {
            optionalServices: [],
            filters: [
                { name: "Hero BLE" }
            ]
        }
        
        // append the services from the GATT table to the optionalServices to allow them to be interacted wtih
        for (var service in this.GATTtable)
        {
            this.options.optionalServices.push(this.GATTtable[service].UUID.toString());
        }
    }

    /**< Assign a service to the GATT table */
    addService(name, service_uuid) {
        return this.GATTtable[name] = new GATTservice(service_uuid);
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
        return this.isConnected() ? "Hero BLE" : "None";
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
            console.log("Connection error: " + error)
        }
    }
    
    /**< Disconnect from the BLE peripheral */
    disconnect() {
        this.server.disconnect();
        this.connected = false;
    }


}


class GATTitem {
    constructor(long_uuid) {
        this.UUID = long_uuid;
        
    }

    UUID = "";
    handle;

    // discover(){

    // }
}

class GATTservice extends GATTitem {
    constructor(long_uuid) {
        super(long_uuid);
    }

    /**< Assign a characteristic to this service */
    addCharacteristic(name, characteristic_uuid) {
        this[name] = new GATTcharacteristic(characteristic_uuid);

        return this;    // allow this function to be chainable, to add multiple chars
    }
}


class GATTcharacteristic extends GATTitem {
    GATTcharacteristic(long_uuid)
    {
        GATTitem(long_uuid)
    }

    /*< Read the current value of the characteristic */
    read() {
        // if (is_connected())
        // {
            // TODO, read the current value of the characteristic
        // }
    }

    /**< Write a value to the characteristic */
    write(val) {
        // if (is_connected())
        // {
            try {
                // TODO, convert val to Uint8Array
                this.handle.writeValueWithoutResponse(val);
            } catch(error) {
                console.log("ERROR - Unable to write to GATT item '%s' " + error, this.UUID)
            }

        // }
    }

    /**< Add a callback to call when the characteristic value changes */
    onValueChange(callback) {
        // if (is_connected())
        // {
            try {
                this.handle.addEventListener("characteristicvaluechanged", callback);
                this.handle.startNotifications();
            } catch(error) {
                console.log("ERROR - Unable to add onValueChange callback to GATT item '%s' " + error, this.UUID)
            }
        // }
    }
}
