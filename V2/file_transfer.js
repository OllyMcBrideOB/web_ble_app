
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
     * Read a file from the Hero BLE module
     * @param {string} filename Path of the file to read from the Hero BLE module
     * @returns The file data as a HexStr
     */
    async read(filename) {
        operationTimerStart();

        // try to open the file
        const file = { data: "", size: 0, id: -1, name: filename };
        const open_file = await this.#do_open(file.name, "0x000000");  // read only
        file.id = open_file.id;
        file.size = open_file.size;
        
        // if the file opened successfully
        if (file.id != -1) {
            // read the file
            file.data = await this.#do_read(file.id, file.size);
            // close the file
            await this.#do_close(file.id);
        } else {
            printFileStatus("Unable to read '" + file.name + "' as it failed to open");
        }
        
        operationTimerStop();
        return file.data;
    }

    /**
     * Write a file to the Hero BLE module
     * @param {string} filename Path of the file to be written to on the Hero BLE module
     * @param {Uint8Array} data_to_write An array of bytes to write to the file
     * @returns A file object
     */
    async write(filename, data_to_write) {
        operationTimerStart();

        // try to open the file
        const file = { data: data_to_write, id: -1, name: filename };
        const open_file = await this.#do_open(file.name, "0x020802");  // read/write, create & append
        file.id = open_file.id;

        // if the file opened successfully
        if (file.id != -1) {
            // write the file
            await this.#do_write(file.id, file.data);
            // close the file
            await this.#do_close(file.id);
        } else {
            printFileStatus("Unable to write to '" + file.name + "' as it failed to open");
        }

        operationTimerStop();
        return file;
    }

    /**
     * Remove/delete a file from the Hero BLE module
     * @param {string} filename Path of the file to remove from the Hero BLE module
     * @returns File status as a number
     */
    async remove(filename) {
        printFileStatus("FileTransfer::remove()");

        let file_status = -1;

        /**
         * Callback to parse the response message
         * @param {Message} response_msg Response message from the event
         * @returns True if we have parsed the last packet in the transaction
         */
        let response_parser = function (response_msg){
            // confirm response payload length is valid
            if (response_msg.payload.length == 1) {
                // parse response payload
                file_status = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 0, 1));
                
                printFileStatus("FS_REMOVE filename: " + filename + 
                                "\tstatus: " + fileStatusToString(Number(file_status)) + " (0x" + Number(file_status).toString(16).padStart(2, "0") + ")")
            } else {
                printFileStatus("ERROR - Invalid FS_REMOVE response (len: " + response_msg.payload.length + "/" + 1 + ")")
            }

            return true;        // return true as the entire response was received (i.e. only a single-packet response)
        }

        // generate message to close the file
        const packet_num = new HexStr().fromNumber(0, "uint16");                // packet 0 buffer
        const filename_buf = new HexStr().fromUTF8String(filename + '\0')       // filename buffer
        const payload = new HexStr().append(packet_num, filename_buf);

        const close_file_msg = new Message("FS_REMOVE", payload);

        // write the FS_REMOVE message and await the response
        await writeThenGetResponse(close_file_msg, "large", "standard", response_parser);

        return file_status;
    }

    /**
     * Open/create a file on the Hero BLE module
     * @param {string} filename Name of the file to open
     * @param {string} file_open_flags File r/w permission flags
     * @returns {file_id, file_size} An object containing the file id and size of the opened file
     */
    async #do_open(filename, file_open_flags) {
        // printFileStatus("FileTransfer::file_open(" + filename + ", " + file_open_flags + ")");   
        document.getElementById("label_file_size_transferred").innerHTML = 0;

        let file = { status: -1, id: -1, size: 0 };

        /**
         * Callback to parse the response message
         * @param {Message} response_msg Response message from the event
         * @returns True if we have parsed the last packet in the transaction
         */
        let response_parser = function (response_msg){
            // confirm response payload length is valid
            if (response_msg.payload.length == 4) {
                // parse response payload
                file.id = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 0, 1));
                file.status = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 1, 1));
                file.size = Number(new Uint16Array(response_msg.payload.rawArray.buffer, 2, 1));
                
                printFileStatus("FS_OPEN file_id: 0x" + file.id.toString(16).padStart(2, "0") + 
                                "\tstatus: " + fileStatusToString(file.status) + " (0x" + file.status.toString(16).padStart(2, "0") + ") " +
                                "\tsize: " + file.size.toString() + " bytes")
            } else {
                printFileStatus("ERROR - Invalid FS_OPEN response (len: " + response_msg.payload.length + ")");
            }

            return true;        // return true as the entire response was received (i.e. only a single-packet response)
        }

        // generate request message to open the file
        const packet_num = new HexStr().fromNumber(0, "uint16");                // packet 0 buffer
        const file_open_flags_buf = new HexStr().fromHexString(file_open_flags) // file open flags buffer
        const filename_buf = new HexStr().fromUTF8String(filename + '\0')       // filename buffer
        const payload = new HexStr().append(packet_num, file_open_flags_buf, filename_buf);

        let request_msg = new Message("FS_OPEN", payload);

        // write the FS_OPEN message and await the response
        await writeThenGetResponse(request_msg, "large", "standard", response_parser);

        return file;
    }

    /**
     * Read the file a packet at a time
     * @param {number} file_id Id of the file to read from
     * @returns A HexStr of the file data
     */
    async #do_read(file_id, file_size) {
        // printFileStatus("FileTransfer::file_read()");

        // TODO, enable multi-packet reads
        
        let file_data = new HexStr();

        /**
         * Callback to parse the response message
         * @param {Message} response_msg Response message from the event
         * @returns True if we have parsed the last packet in the transaction
         */
        let response_parser = (response_msg) => {
            // confirm response payload length is valid
            if (response_msg.payload.length >= 4) {
                // parse response payload
                const packet_num = Number(new Uint16Array(response_msg.payload.rawArray.buffer, 0, 1));
                const rx_file_id = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 2, 1));
                const file_status = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 3, 1));
                const n_read = Number(new Uint16Array(response_msg.payload.rawArray.buffer, 4, 1));
                const rx_file_buf = new Uint8Array(response_msg.payload.rawArray.buffer, 5);
                const rx_file_data = new HexStr().fromUint8Array(rx_file_buf.subarray(5, 5 + n_read));
                

                printFileStatus("FS_READ rx_file_id: 0x" + rx_file_id.toString(16).padStart(2, "0") + 
                                "\tstatus: " + fileStatusToString(file_status) + " (0x" + file_status.toString(16).padStart(2, "0") + ") " +
                                "\tn_read: " + n_read.toString() + " bytes" + 
                                "\trx_file_data.length: " + rx_file_data.length)

                // printFileStatus("FS_READ data: '" + rx_file_data.toString("-") + "'");

                if (n_read > 0) {
                    file_data.append(rx_file_buf);
                }
                
                document.getElementById("label_file_size_transferred").innerHTML = file_data.length;

                return isLastPacket(packet_num);

            } else {
                printFileStatus("ERROR - Invalid FS_READ response (len: " + read_msg_response.payload.length + ")");
                // throw("ERROR - Invalid FS_READ response (len: %d/%d)", read_msg_response.payload.length, 4)
                
                return true;            // return true as an error has occured and we want to stop the parser event
            }
        }

        // generate message to read the file
        const file_id_buf = new HexStr().fromNumber(file_id, "uint8");   
        const file_data_size = new HexStr().fromNumber(file_size, "uint16")
        const payload = new HexStr().append(file_id_buf, file_data_size);

        const request_msg = new Message("FS_READ", payload);

        // write the FS_READ message and await the response
        await writeThenGetResponse(request_msg, "standard", "large", response_parser.bind(this));

        return file_data;

    }

    /**
     * Write the file a packet at a time
     * @param {number} file_id Id of the file to write
     * @param {Uint8Array} file_data Data to write to the file
     */
     async #do_write(file_id, file_data) {
        printFileStatus("FileTransfer::file_write()");
        
        let packet_counter = 0;
        let total_written = 0;

        /**
         * Callback to parse the response message
         * @param {Message} response_msg Response message from the event
         * @returns True if we have parsed the last packet in the transaction
         */
        let response_parser = (response_msg) => {
            // confirm response payload length is valid
            if (response_msg.payload.length == 4) {
                // parse response payload
                const rx_file_id = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 0, 1));
                const file_status = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 1, 1));
                const n_written = Number(new Uint16Array(response_msg.payload.rawArray.buffer, 2, 1));
                
                printFileStatus("FS_WRITE file_id: 0x" + rx_file_id.toString(16).padStart(2, "0") + 
                                "\tstatus: " + fileStatusToString(file_status) + " (0x" + file_status.toString(16).padStart(2, "0") + ") " +
                                "\tsize: " + n_written.toString() + " bytes")
               
                total_written += n_written;
                document.getElementById("label_file_size_transferred").innerHTML = total_written;
            } else {
                printFileStatus("ERROR - Invalid FS_WRITE response (len: " + response_msg.payload.length + "/" + 4 + ")");
            }

            return true;
        }

        // if there is file data to write
        while (total_written < file_data.length)
        {
            const maxDataChunkSize = 200;           // TODO, limit chunk to using MTU size
            let n_to_write = file_data.length - total_written;
            if (n_to_write > maxDataChunkSize) {
                n_to_write = maxDataChunkSize;
            }

            // get file data chunk
            const data_chunk = new Uint8Array(file_data.buffer, total_written, n_to_write)
            
            // generate message to write the file
            const packet_num = new HexStr().fromNumber(packet_counter++, "uint16");    
            const file_id_buf = new HexStr().fromNumber(file_id, "uint8");   
            const file_data_size = new HexStr().fromNumber(data_chunk.length, "uint16")
            const payload = new HexStr().append(packet_num, file_id_buf, file_data_size, data_chunk);

            const write_file_msg = new Message("FS_WRITE", payload);

            // write the FS_WRITE message and await the response
            await writeThenGetResponse(write_file_msg, "large", "standard", response_parser);
        }
    }

    /**
     * Close the file 
     * @param {number} file_id Id number of the file to close 
     * @returns File status, 0 == success, negative on failure
     */
    async #do_close(file_id) {
        printFileStatus("FileTransfer::file_close()");

        let file_status = -1;

        /**
         * Callback to parse the response message
         * @param {Message} response_msg Response message from the event
         * @returns True if we have parsed the last packet in the transaction
         */
        let response_parser = function (response_msg){
            // confirm response payload length is valid
            if (response_msg.payload.length == 1) {
                // parse response payload
                file_status = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 0, 1));
                
                printFileStatus("FS_CLOSE file_id: 0x" + Number(file_id).toString(16).padStart(2, "0") + 
                                "\tstatus: " + fileStatusToString(Number(file_status)) + " (0x" + Number(file_status).toString(16).padStart(2, "0") + ")")
            } else {
                printFileStatus("ERROR - Invalid FS_CLOSE response (len: " + response_msg.payload.length + "/" + 1 + ")")
            }

            return true;        // return true as the entire response was received (i.e. only a single-packet response)
        }

        // generate message to close the file
        const payload = new HexStr().fromNumber(file_id, "uint8");      // file id
        const close_file_msg = new Message("FS_CLOSE", payload);

        // write the FS_CLOSE message and await the response
        await writeThenGetResponse(close_file_msg, "standard", "standard", response_parser);

        return file_status;
    }
}

/**
 * Write a string to the file status terminal & console.log()
 * @param {string} str Status string to write to the status terminal
 */
function printFileStatus(str) {
    console.log(str)

    // discard old console output if it's > 10000 chars
    let console_element = document.getElementById("label_status_box");
    if (console_element.innerHTML.length > 10000)
    {
        console_element.innerHTML = console_element.innerHTML.slice(-10000);
    }
    // write the message to the Command Terminal component
    console_element.innerHTML += str + "<br>";

    // scroll to the bottom of the terminal
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