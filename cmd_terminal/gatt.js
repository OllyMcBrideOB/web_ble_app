

/*
1. Connect to device using promises
2. Use async/await to connect to device

*/

class GATTmanager {
    constructor() {
        this.connected = false;

        this.options = {
            filters: [
                { name: "Hero BLE" }
            ]
        }
    }

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

        let nrt = new OB_UUID("201a");

        console.log("nrt uuid: " + nrt);
        console.log(nrt);

        try {
            console.log("Trying to connect to a device")

            // display device selector window and get device selected by the user
            this.BLEDevice = await navigator.bluetooth.requestDevice(this.options);
            
            const server = await this.BLEDevice.gatt.connect();    
        } catch(error)
        {
            console.log("Connection error: " + error)
        }
    }
    // connected = false;

}


class GATTitem {
    constructor(long_uuid) {
        this.UUID = long_uuid;
    }

    // UUID = "";
    // handle;

    // discover()
}

class GATTitem_OB  extends GATTitem{
    constructor(short_uuid) {
        super(new OB_UUID(short_uuid).toString());
    }
}

class OB_UUID
{
    constructor(short_uuid) {
        if (short_uuid.length == 4) {
            this.short_uuid = short_uuid.toLowerCase()
            this.UUID = "0b0b" + this.short_uuid + "-feed-dead-bee5-0be9b1091c50"
        }
        else
        {
            console.log("Failed to create OB_UUID object as ${short_uuid} is invalid");
        }
    }

    toString() {
        return this.UUID;
    }
}