
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
    try {
        return status_str[file_status];
    } catch(e) {
        return "Unknown (" + file_status + ")";
    }
}


/**
 * A class to enable transfer of a file to/from a Hero BLE module using
 * the 'FS_OPEN, FS_READ, FS_WRITE & FS_CLOSE' commands
 */
class FileTransfer {
    /**
     * Constructor
     */
    constructor() {
    }

    /**
     * Start a file transfer to the connected Hero BLE module   
     * @param {File} file A file object containing the filename & file data
     * @param {string} rw Either 'read' or 'write'
     */
    async start(file, rw) {
        printFileStatus("FileTransfer::start()");
        this.packet_counter = 0;
        this.bytesSent = 0;
        document.getElementById("label_file_size_transferred").innerHTML = this.bytesSent;
        setFileSize(file.data.length);

        const file_open_flags = new HexStr();
        switch (rw.toLowerCase()) {
            case "read":
                file_open_flags.fromHexString("0x000000");  // read only
                break;
            case "write":
                file_open_flags.fromHexString("0x020802");  // read/write, create & append
                break;
            default:
                break;
        }

        operationTimerStart();

        // open the file to read/write
        const file_id = await this.file_open(file.name, file_open_flags);

        if (file_id != -1) {
            // read/write the file
            switch (rw.toLowerCase()) {
                case "read":
                    file.data = await this.file_read(file_id);
                    break;
                case "write":
                    await this.file_write(file_id, file.data);
                    break;
                default:
                    break;
            }

            await this.file_close(file_id);
        }
        operationTimerStop();
    }
        
    /**
     * Open/create a file on the Hero BLE module
     * @param {string} filename Name of the file to open
     * @param {HexStr} file_open_flags File r/w permission flags
     * @returns The id of the file opened (-1 of failure)
     */
    async file_open(filename, file_open_flags) {
        printFileStatus("FileTransfer::file_open()");
        
        // generate message to open the file
        const packet_num = new HexStr().fromNumber(0, "uint16");      // packet 0
        const filename_buf = new HexStr().fromUTF8String(filename + '\0')  // filename
        const payload = new HexStr().fromUint8Array([packet_num.toUint8Array(), file_open_flags.toUint8Array(), filename_buf.toUint8Array()]);
        let open_file_msg = new Message("FS_OPEN", payload);

        // write the FS_OPEN message and await the response
        const open_msg_response = await writeThenGetResponse(open_file_msg, "large");

        let file_id = -1;

        // confirm response payload length is valid
        if (open_msg_response.payload.length == 4) {
            // parse response payload
            file_id = Number(new Uint8Array(open_msg_response.payload.rawArray.buffer, 0, 1));
            const file_status = new Uint8Array(open_msg_response.payload.rawArray.buffer, 1, 1);
            const file_data_size = new Uint16Array(open_msg_response.payload.rawArray.buffer, 2, 1);
            
            printFileStatus("FS_OPEN file_id: 0x" + file_id.toString(16).padStart(2, "0") + 
                             "\tstatus: " + fileStatusToString(Number(file_status)) + 
                             " (0x" + Number(file_status).toString(16).padStart(2, "0") + ") " +
                             "\tsize: 0x" + file_data_size.toString() + " bytes")
        } else {
            printFileStatus("ERROR - Invalid FS_OPEN response (len: " + open_msg_response.payload.length + ")");
            throw("ERROR - Invalid FS_OPEN response (len: " + open_msg_response.payload.length + ")")
        }

        return file_id;
    }

    /**
     * Write the file a packet at a time
     * @param {number} file_id Id of the file to write
     * @param {Uint8Array} file_data Data to write to the file
     */
    async file_write(file_id, file_data) {
        printFileStatus("FileTransfer::file_write()");
        
        let nRetries = 0;

        // if there is file data to write
        while (this.bytesSent < file_data.length)
        {
            const maxDataChunkSize = 6;
            let nToWrite = file_data.length - this.bytesSent;
            if (nToWrite > maxDataChunkSize) {
                nToWrite = maxDataChunkSize;
            }

            // get file data chunk
            const data_chunk = new Uint8Array(file_data.rawArray.buffer, this.bytesSent, nToWrite)
            
            // generate message to write the file
            const packet_num = new HexStr().fromNumber(this.packet_counter++, "uint16");    
            const file_id_buf = new HexStr().fromNumber(file_id, "uint8");   
            const file_data_size = new HexStr().fromNumber(data_chunk.length, "uint16")
            
            const payload = new HexStr().fromUint8Array([packet_num.toUint8Array(), 
                                                        file_id_buf.toUint8Array(), 
                                                        file_data_size.toUint8Array(),
                                                        data_chunk]);

            const write_file_msg = new Message("FS_WRITE", payload);

            // write the FS_WRITE message and await the response
            const write_msg_response = await writeThenGetResponse(write_file_msg, "large");

            // confirm response payload length is valid
            if (write_msg_response.payload.length == 4) {
                // parse response payload
                const file_id_buf = new Uint8Array(write_msg_response.payload.rawArray.buffer, 0, 1);
                const file_status = new Uint8Array(write_msg_response.payload.rawArray.buffer, 1, 1);
                const n_written = Number(new Uint16Array(write_msg_response.payload.rawArray.buffer, 2, 1));
                
                printFileStatus("FS_WRITE file_id: 0x" + Number(file_id_buf).toString(16).padStart(2, "0") + 
                                "\tstatus: " + fileStatusToString(Number(file_status)) + 
                                " (0x" + Number(file_status).toString(16).padStart(2, "0") + ") " +
                                "\tsize: 0x" + file_data_size.toString() + " bytes")

                if (n_written != nToWrite) {
                    nRetries++;
                }
                
                this.bytesSent += n_written;
                document.getElementById("label_file_size_transferred").innerHTML = this.bytesSent;


            } else {
                printFileStatus("ERROR - Invalid FS_WRITE response (len: " + write_msg_response.payload.length + "/" + 4 + ")");
                // throw("ERROR - Invalid FS_WRITE response (len: %d/%d)", write_msg_response.payload.length, 4)
                nRetries++;
            }

            if (nRetries >= 5) {
                printFileStatus("Stopped FS_WRITE after " + nRetries + " retries");
                break;
            }
        }
    }

    /**
     * Close the file after
     * @param {number} file_id Id number of the file to close 
     */
    async file_close(file_id) {
        printFileStatus("FileTransfer::file_close()");

        // generate message to close the file
        const payload = new HexStr().fromNumber(file_id, "uint8");      // file id
        const close_file_msg = new Message("FS_CLOSE", payload);

        // write the FS_CLOSE message and await the response
        const close_msg_response = await writeThenGetResponse(close_file_msg, "standard");

        // confirm response payload length is valid
        if (close_msg_response.payload.length == 1) {
            // parse response payload
            const file_status = new Uint8Array(close_msg_response.payload.rawArray.buffer, 0, 1);
            
            printFileStatus("FS_CLOSE file_id: 0x" + Number(file_id).toString(16).padStart(2, "0") + 
                             "\tstatus: " + fileStatusToString(Number(file_status)) + 
                             " (0x" + Number(file_status).toString(16).padStart(2, "0") + ") " +
                             "\ttotal written: " + this.bytesSent)
        } else {
            printFileStatus("ERROR - Invalid FS_CLOSE response (len: " + close_msg_response.payload.length + "/" + 1 + ")")
        }
    }
}

/**
 * Write a string to the file status terminal & console.log()
 * @param {string} str Status string to write to the status terminal
 */
function printFileStatus(str) {
    console.log(str)
    document.getElementById("label_status_box").innerHTML += str + "<br>";
    let scrollbox = document.getElementById("fm_status_box");
    scrollbox.scrollTop = scrollbox.scrollHeight;
}

/**< Variable used to time how long a 'file operation' takes */
let file_op_start_time = 0;

/**
 * Start the 'file operation' timer
 */
function operationTimerStart() {
    file_op_start_time = Date.now();
    document.getElementById("label_file_transfer_dur").innerHTML = "...";
}

/**
 * Stop the 'file operation' timer and display the duration
 */
function operationTimerStop() {
    document.getElementById("label_file_transfer_dur").innerHTML = Date.now() - file_op_start_time;
}