


class GATTmanager {
    constructor() {
        this.connected = false;

        // define the GATT table layout
        this.GATTtable = {};
        
        this.GATTtable.NRTservice = new GATTservice(new OB_UUID("1007"));
        this.GATTtable.NRTservice.addCharacteristic("NRTrequest", new GATTcharacteristic(new OB_UUID("2017")))
        this.GATTtable.NRTservice.addCharacteristic("NRTResponse", new GATTcharacteristic(new OB_UUID("2018")))
        this.GATTtable.NRTservice.addCharacteristic("NRTLargeRequest", new GATTcharacteristic(new OB_UUID("201e")))
        this.GATTtable.NRTservice.addCharacteristic("NRTLargeResponse", new GATTcharacteristic(new OB_UUID("2019")))

        this.GATTtable.RTservice = new GATTservice(new OB_UUID("1008"));
        this.GATTtable.RTservice.addCharacteristic("RTButtonStatus", new GATTcharacteristic(new OB_UUID("201a")))

        
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

    /**< Return true if Web BLE is available on this browser */
    isWebBLEAvailable() {
        if (!navigator.bluetooth) {
            console.log("Web Bluetooth is not available!");
            return false;
        }
        return true;
    }

    async connect() {
        // TODO, what happens if we are already connected?
        console.log("connect()");

        try {
            console.log("Trying to connect to a device")

            // display device selector window and get device selected by the user
            this.BLEDevice = await navigator.bluetooth.requestDevice(this.options);
            
            console.log("Discovering services...")
            // get the representation of the GATT server on the remote device
            const server = await this.BLEDevice.gatt.connect();    

            // iterate through each of the predefined services in the local GATT table
            for (var service in this.GATTtable)
            {
                // get the handle for the service
                this.GATTtable[service].handle = await server.getPrimaryService(this.GATTtable[service].UUID.toString());

                // iterate through each of the predefined characteristics in the local GATT table
                for (var characteristic in this.GATTtable[service].charateristics)
                {
                    // get the handle for the characteristic
                    this.GATTtable[service].charateristics[characteristic].handle = await this.GATTtable[service].handle.getCharacteristic(this.GATTtable[service].charateristics[characteristic].UUID.toString());
                }
            }

            console.log("Connection successful")

            this.connected = true;
        } catch(error)
        {
            console.log("Connection error: " + error)
        }
    }

    deviceName() {
        return "Hero BLE";
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

    charateristics = {};

    /**< Assign a characteristic to this service */
    addCharacteristic(name, c) {
        this.charateristics[name] = c;
    }
}


class GATTcharacteristic extends GATTitem {
    GATTcharacteristic(long_uuid)
    {
        GATTitem(long_uuid)
    }

    /*< Read the current value of the characteristic */
    read() {
        if (is_connected())
        {
            // TODO, read the current value of the characteristic
        }
    }

    /**< Write a value to the characteristic */
    write(val) {
        if (is_connected())
        {
            try {
                // TODO, convert val to Uint8Array
                super.handle.writeValueWithoutResponse(val);
            } catch(error) {
                console.log("ERROR - Unable to write to GATT item '%s' " + error, this.UUID)
            }

        }
    }

    /**< Add a callback to call when the characteristic value changes */
    onValueChange(callback) {
        if (is_connected())
        {
            try {
                super.handle.addEventListener("characteristicvaluechanged", callback);
            } catch(error) {
                console.log("ERROR - Unable to add onValueChange callback to GATT item '%s' " + error, this.UUID)
            }
        }
    }
}



// class GATT_OB  extends GATTitem{
//     constructor(short_uuid) {
//         super(new OB_UUID(short_uuid).toString());
//     }
// }


