
/**
 * Get the file status as a string
 * @param {Number} file_status Convert the file status enum to a string
 * @returns String of the file status
 */
function fileStatusToString(file_status) {
    const status_str = {
        0       : "SUCCESS",              /**< Success */
        1       : "NOT_PERMITTED",        /**< Operation not permitted */
        2       : "NO_FILE_OR_DIR",       /**< No such file or directory */
        3       : "INVALID_FILE_ID",      /**< No such file_id */
        12      : "NO_MEM",               /**< Out of memory */
        13      : "PERMISSION_DENIED",    /**< Permission denied */
        14      : "INVALID_FILENAME",     /**< Invalid filename (i.e. no EOL null char) */
        17      : "FILE_EXISTS",          /**< File exists */
        20      : "NOT_A_DIR",            /**< Not a directory */
        21      : "IS_DIR",               /**< Is a directory */
        24      : "TOO_MANY_OPEN",        /**< Too many open files */
        91      : "FILENAME_TOO_LONG",    /**< Filename too long */
        120     : "FILE_ALREADY_OPEN",    /**< File is already open */
    }
     return status_str[file_status];
}


/**
 * A class to enable transfer of a file to a Hero BLE module using
 * the 'FS_OPEN, FS_WRITE & FS_CLOSE commands
 */
class FileTransfer {
    /**
     * Constructor
     */
    constructor() {
        this.i = 0;
        this.file_id = NaN;
    }

    /**
     * Start a file transfer to the connected Hero BLE module   
     * @param {File} file A file object containing the filename & file data
     */
    async start(file) {
        this.printStatus("FileTransfer::start()");
        this.packet_counter = 0;
        this.file = file;

        // if the file length is valid
        if (this.file.length > 0) {

            // prepare the file transfer, run the file transfer then close the file transfer
            await this.beforeFirstRun();
            await this.run();
            await this.afterLastRun();


            // // prepare the file transfer, run the file transfer then close the file transfer
            // await this.beforeFirstRun()
            //     .then(_ => this.run())
            //     .then(_ => this.afterLastRun())
            //     .catch(error =>  {
            //         this.printStatus("start().catch(): " + error);
            //         this.stop();
            //     });
            this.stop();
        }
        else
        {
            console.log("WARNING - File length 0, therefore there is nothing to transfer")
        }
    }
    
    /**
     * Transfer the file a packet at a time
     */
    async run() {
        this.printStatus("FileTransfer::run()");
       
        // run multiple times
        while(this.packet_counter < this.file.length) {
            this.packet_counter++
        }
    }
    
    /**
     * Send the messge to open/create the required file
     */
    async beforeFirstRun() {
        this.printStatus("FileTransfer::beforeFirstRun()");
        
        // generate message to open the file
        const packet_num = new HexStr().fromNumber(0, "uint16");      // packet 0
        const file_open_flags = new HexStr("0x020802");               // read/write, create & append
        const filename = new HexStr().fromUTF8String(this.file.name + '\0')  // filename
        const payload = new HexStr().fromUint8Array([packet_num.toUint8Array(), file_open_flags.toUint8Array(), filename.toUint8Array()]);
        let open_file_msg = new Message("FS_OPEN", payload);

        // write the FS_OPEN message and await the response
        let open_msg_response = await this.writeThenGetResponse(open_file_msg, "large");

        // confirm response payload length is valid
        if (open_msg_response.payload.length == 4) {
            // parse response payload
            this.file_id = new Uint8Array(open_msg_response.payload.rawArray.buffer, 0, 1);
            var file_status = new Uint8Array(open_msg_response.payload.rawArray.buffer, 1, 1);
            var file_data_size = new Uint16Array(open_msg_response.payload.rawArray.buffer, 2, 1);
            
            this.printStatus("FS_OPEN file_id: 0x" + Number(this.file_id).toString(16).padStart(2, "0") + 
                             "\tstatus: " + fileStatusToString(Number(file_status)) + 
                             " (0x" + Number(file_status).toString(16).padStart(2, "0") + ") " +
                             "\tsize: " + file_data_size.toString() + " bytes")
        } else {
            this.printStatus("ERROR - Invalid FS_OPEN response (len: %d/%d)", open_msg_response.payload.length, 4);
            throw("ERROR - Invalid FS_OPEN response (len: %d/%d)", open_msg_response.payload.length, 4)
        }
    }

    /**
     * Close the file after 
     */
    async afterLastRun() {
        this.printStatus("FileTransfer::afterLastRun()");

        // generate message to close the file
        let file_id = new HexStr().fromUint8Array(this.file_id);      // file id
        let close_file_msg = new Message("FS_CLOSE", file_id);

        // write hte FS_CLOSE message and await the response
        let close_msg_response = await this.writeThenGetResponse(close_file_msg, "standard");

        // confirm response payload length is valid
        if (close_msg_response.payload.length == 1) {
            // parse response payload
            var file_status = new Uint8Array(close_msg_response.payload.rawArray.buffer, 0, 1);
            
            this.printStatus("FS_CLOSE file_id: 0x" + Number(this.file_id).toString(16).padStart(2, "0") + 
                             "\tstatus: " + fileStatusToString(Number(file_status)) + 
                             " (0x" + Number(file_status).toString(16).padStart(2, "0") + ") ")
        } else {
            this.printStatus("ERROR - Invalid FS_CLOSE response (len: %d/%d)", close_msg_response.payload.length, 1)
        }

    }
    
    /**
     * Stop the file transfer
     */
    stop() {
        this.printStatus("FileTransfer::stop()");

        // TODO, do we need to cancel any promises?
    }

    /**
     * Write a request message and then await the response message
     * @param {Message} req_msg Request message to send to the Hero BLE module
     * @param {string} msg_type Either "standard" or "large" to indicate which characteristic to use
     * @returns A Promise that will return the response message
     */
    async writeThenGetResponse(req_msg, msg_type) {
        // return a promise allowing the response to be awaited
        return new Promise( (resolve, reject) => {
            let response_cb = (event) => {
                // convert the ArrayBuffer to a Message
                let rx_msg = new Message().fromArrayBuffer(event.target.value.buffer);
                
                // if we have found the response we're looking for
                if (rx_msg.cmd.equals(req_msg.cmd))
                {
                    // unregister the callback
                    GATT.GATTtable.NRTservice.NRTResponse.onValueChangeRemove(response_cb);
                    
                    // writeToCommandTerminal(rx_msg, "rx") // other cb in 'subscibeToCharacteristics()' resonsible for writing to terminal
                    resolve(rx_msg)
                }
            }
            
            // register the callback to detect the responses
            GATT.GATTtable.NRTservice.NRTRequest.onValueChange(response_cb);
            
            // write the request message
            writeToCommandTerminal(req_msg, "tx")
            switch (msg_type.toLowerCase()) {
                case "standard":
                    GATT.GATTtable.NRTservice.NRTRequest.write(req_msg);
                    break;
                case "large":
                    GATT.GATTtable.NRTservice.NRTLargeRequest.write(req_msg);
                    break;
                default:
                    console.log("Failed to call FileTransfer::writeMsg(msg, msg_type). msg_type should be 'standard' or 'large'")
                    break;
            }
        });                        
    }

    /**
     * Write a string to the file status terminal & console.log()
     * @param {string} str Status string to write to the status terminal
     */
    printStatus(str) {
        console.log(str)
        document.getElementById("file_transfer_status_box").innerHTML += str + "<br>";
        let scrollbox = document.getElementById("file_transfer_status");
        scrollbox.scrollTop = scrollbox.scrollHeight;
    }
}