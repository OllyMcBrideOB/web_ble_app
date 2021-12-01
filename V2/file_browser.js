
/**
 * Get the file type as a string
 * @param {Number} file_type Convert the file type enum to a string
 * @returns String of the file type
 */
 function fileTypeToString(file_type) {
    const type_str = {
        0       : "Unknown",
        1       : "Named pipe (FIFO)",
        2       : "Character device",
        3       : "Directory",
        4       : "Block device",
        5       : "File",
        6       : "Symbolic Link",
        7       : "Socket",
    }
    try {
        return type_str[file_type];
    } catch(e) {
        return "Unknown (" + file_type + ")";
    }
}

/**
 * Recursively read the directory structure on the Hero BLE module and
 * display it in the fm_nav div
 */
async function discoverRemoteDirectoryStructure() {

    operationTimerStart();
    
    // re-entrant function to get the contents of a directory & any subdirectories
    searchForChildren = async (parent) => {
        // if the file is a directory
        if (parent.type == 3) {
            parent.child = await browseFiles(parent.filename);
            for (let c of parent.child)
            {
                await searchForChildren(c);
            }
        }
    }
    
    // re-entrant function to print a filename & any subdirectories
    printChildren = (parent, indent) => {
        document.getElementById("label_nav").innerHTML += "- ".repeat(indent) + 
        parent.filename + 
        ((parent.type == 3) ? "/" : "") + 
        "<br>";
        // if the file is a directory
        if (parent.type == 3) {
            for (let c of parent.child) {
                printChildren(c, indent+1);
            }
        }
    }
    
    
    document.getElementById("label_nav").innerHTML = "Retrieving directory layout...";
    const top_level = await browseFiles("");
    
    for (let d of top_level) {
        await searchForChildren(d);
    }
    
    document.getElementById("label_nav").innerHTML = "";
    for (let d of top_level) {
        printChildren(d, 0);
    }
    
    operationTimerStop();
}

/**
 * Get a list of files within directory
 * @param {string} root_filename File/directory name to get a list of the contents
 * @returns An array of objects of filenames & their types
 */
async function browseFiles(root_filename = "") {
    
    // printFileStatus("browseFiles(" + root_filename + ")");

    let file_list = [];
        
    // generate message to open the file
    const packet_num = new HexStr().fromNumber(0, "uint16");            // packet 0
    const filename = new HexStr().fromUTF8String(root_filename + '\0')  // filename
    const payload = new HexStr().fromUint8Array([packet_num.toUint8Array(), filename.toUint8Array()]);
    let ls_msg = new Message("FS_GET_DIR_CONTENTS", payload);
    
    // write the FS_GET_DIR_CONTENTS message and await the response
    const ls_msg_response = await writeThenGetResponse(ls_msg, "large", "large");
    
    // confirm response payload length is valid
    if (ls_msg_response.payload.length > 3) {
        // parse response payload
        const packet_num = new Uint16Array(ls_msg_response.payload.rawArray.buffer, 0, 1);
        const multiple_filenames = new Uint8Array(ls_msg_response.payload.rawArray.buffer, 2);
        const n_fnames_in_packet = multiple_filenames[0];
        // TODO, check if this is the last packet by analysing packet_num
        if (packet_num != 0) {
            printFileStatus("WARNING - FS_GET_DIR_CONTENTS is not currently compatible with multi-packet resposnes")
        }
        
        // printFileStatus("FS_GET_DIR_CONTENTS packet_num: 0x" + Number(packet_num).toString(16).padStart(2, "0") + 
        //                 "\tn_fnames_in_packet: 0x" + Number(n_fnames_in_packet).toString(16).padStart(2, "0") + " bytes")
        
        let offset = 1;
        while(offset < (ls_msg_response.payload.length - 3)) {
            const f_type = Number(multiple_filenames[offset]);
            offset += 1;
            const f_name_len = Number(multiple_filenames[offset]);
            offset += 1;
            const f_name_array = multiple_filenames.subarray(offset, offset + f_name_len)
            offset += f_name_len;
            const f_name = new HexStr().fromUint8Array(f_name_array);
            
            // printFileStatus("- type: " + fileTypeToString(f_type) + " (" + f_type + ") " +
            //                 "\tlen: " + f_name_len + 
            //                 "\tname: " + f_name.toUTF8String())

            file_list.push( {
                    type:       f_type,
                    filename:   f_name.toUTF8String()
                });
        }                            
    } else if(ls_msg_response.payload.length == 3) {
            // parse response payload
            const buf = new Uint8Array(ls_msg_response.payload.rawArray.buffer, 0);
            const file_status = buf.subarray(2, 3);
            printFileStatus("INFO - Unable to get contents of directory '" + root_filename + "'" +
                            "\tstatus: " + fileStatusToString(Number(file_status)) + 
                            " (0x" + Number(file_status).toString(16).padStart(2, "0") + ") ");
    } else {
        printFileStatus("ERROR - Invalid FS_GET_DIR_CONTENTS response (len: " + ls_msg_response.payload.length + ")");
    }

    return file_list;
}

