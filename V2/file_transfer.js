
class FileTransfer {
    constructor() {
        this.i = 0;
    }

    start(file) {
        this.printStatus("FileTransfer::start()");
        this.packet_counter = 0;
        this.file = file;

        if (this.file.length > 0) {

            this.run().then(_ => {
                this.stop();
            })
        }
        else
        {
            console.log("WARNING - File length 0, therefore there is nothing to transfer")
        }
    }
    
    async run() {
        this.printStatus("FileTransfer::run()");

        // todo, on first run
        this.beforeFirstRun();
        
        // run multiple times
        while(this.packet_counter < this.file.length) {
            // this.printStatus("packet_counter: " + this.packet_counter++)
            this.packet_counter++
        }
        
        // todo, after last run
        this.afterLastRun();
    }
    
    beforeFirstRun() {
        this.printStatus("FileTransfer::beforeFirstRun()");
        
        // open file
        let packet_num = new HexStr().fromNumber(0, "uint16");      // packet 0
        let file_open_flags = new HexStr("0x020802");               // read/write, create & append
        let filename = new HexStr().fromUTF8String(this.file.name)  // filename

        let open_file_msg = new Message("FS_OPEN", packet_num + file_open_flags + filename);
        open_file_msg.print()

        // TODO, get file_id from response

        function get_resp(event) {
            // convert the ArrayBuffer to a HexStr
            let rx_hex_str = new HexStr().fromUint8Array(new Uint8Array(event.target.value.buffer));
            // convert the HexStr to a Message
            let rx_msg = new Message().fromHexStr(rx_hex_str);

            console.log("got response");

            GATT.GATTtable.NRTservice.NRTResponse.onValueChangeRemove(get_resp);
            // TODO, parse resp for file_id
        }

        // subscribe to the standard NRT response in order to retrieve file_id
        GATT.GATTtable.NRTservice.NRTResponse.onValueChange(get_resp);

        // write the open request to the characteristic
        this.writeMsg(open_file_msg, "large")
    }
    
    afterLastRun() {
        this.printStatus("FileTransfer::afterLastRun()");
        // close file
        
    }
    
    stop() {
        this.printStatus("FileTransfer::stop()");

    }

    writeMsg(msg, msg_type) {
        if (GATT.isConnected()) {
            writeToCommandTerminal(msg, "tx")
            switch (msg_type.toLowerCase()) {
                case "standard":
                    GATT.GATTtable.NRTservice.NRTRequest.write(msg);
                    break;
                case "large":
                    GATT.GATTtable.NRTservice.NRTLargeRequest.write(msg);
                    break;
                default:
                    console.log("Failed to call FileTransfer::writeMsg(msg, msg_type). msg_type should be 'standard' or 'large'")
                    break;
            }
        }
    }

    printStatus(status) {
        console.log(status)
        document.getElementById("file_transfer_status_box").innerHTML += status + "<br>";
        let scrollbox = document.getElementById("file_transfer_status");
        scrollbox.scrollTop = scrollbox.scrollHeight;
    }
}


// const f = new FileTransfer;

// const file_data = [0, 1, 2, 3, 4, 5]
// const file = new File(file_data, "test_filename.bin");
// file.length = file_data.length;

// f.start(file);