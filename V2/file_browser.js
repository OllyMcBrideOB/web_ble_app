
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
 * File Browser Class
 * 
 * This class is responsible for reading the directory structure from the Hero BLE module and
 * displaying it in hte 'fm_nav' window. When a file is clicked, the file data is read and displayed
 * in the file viewer window.
 */
class FileBrowser {
    /**
     * Constructor
     * @param {element} parentNode Parent div
     */
    constructor(parentNode) {
        this.parentNode = parentNode;           // reference to the parent div
        this.elementCounter = 0;                // counter to ensure the elements have an unique id
        this.currentlySelected = undefined;     // reference to the currently selected element
        this.selectedDir = "";                  // currently selected directory, to allow files to be written to them
    }

    /**
     * Recursively read the directory structure on the Hero BLE module and
     * display it in the fm_nav div
     */ 
    async ls() {
        operationTimerStart();

        // re-entrant function to get the contents of a directory & any subdirectories
        const searchForChildren = async (file, indent) => {
            this.createElement(file, indent);
            // if the file is a directory
            if (this.#isDir(file.type)) {
                file.child = await this.browseFiles(file.path + "/" + file.filename);
                for (let c of file.child) {
                    await searchForChildren(c, indent+1);
                }
            }
        }
    
        // recursively read the directory layout & add each nav element to the nav div
        printFileStatus("Fetching remote directories...")
        document.getElementById("fm_nav").innerHTML = "";
        const dir_structure = await this.browseFiles("");
        for (let d of dir_structure) {
            await searchForChildren(d, 0);
        }

        printFileStatus("Directory fetch complete!")

        this.selectedDir = "";
        document.getElementById("btn_file_send").title = "Save to '" + this.selectedDir + "'";
            
        operationTimerStop();
    }

    /**
     * Get a list of files within directory
     * @param {string} root_filename File/directory name to get a list of the contents
     * @returns An array of objects of filenames, paths & their types
     */
    async browseFiles(root_filename = "") {
        let file_list = []; // {type: number, filename: string, path: root_filename}

        /**
         * Callback to parse the response message
         * @param {Message} response_msg Response message from the event
         * @returns True if we have parsed the last packet in the transaction
         */
        let response_parser = (response_msg) => {

            // if the response includes the packet number
            if (response_msg.payload.length >= 2) {
                const resp_packet_num = new Uint16Array(response_msg.payload.rawArray.buffer, 0, 1);

                // if the response could contain multiple filenames
                if (response_msg.payload.length > 3) {
                    // parse response payload
                    const multiple_filenames = new Uint8Array(response_msg.payload.rawArray.buffer, 2);
                    const n_fnames_in_packet = multiple_filenames[0];
                    
                    // parse all of the filenames
                    let offset = 1;
                    while(offset < (response_msg.payload.length - 3)) {
                        const f_type = Number(multiple_filenames[offset]);
                        offset += 1;
                        const f_name_len = Number(multiple_filenames[offset]);
                        offset += 1;
                        const f_name_array = multiple_filenames.subarray(offset, offset + f_name_len - 1) // -1 to discard null char
                        offset += f_name_len;
                        const f_name = new HexStr().fromUint8Array(f_name_array);
                        
                        file_list.push( {
                                type:       f_type,
                                filename:   f_name.toUTF8String(),
                                path: root_filename
                            });
                    }                            
                } 
                // else if the response contains the file status
                else if(response_msg.payload.length == 3) {
                        // parse response payload
                        const file_status = Number(new Uint8Array(response_msg.payload.rawArray.buffer, 2, 1));
                        printFileStatus("INFO - Unable to get contents of directory '" + root_filename + "/'" +
                                        "\tstatus: " + fileStatusToString(file_status) + " (0x" + file_status.toString(16).padStart(2, "0") + ") ");
                }

                return isLastPacket(resp_packet_num);       // return true if we have received the last packet
            } 
            // else if we have received an invalid response
            else {
                printFileStatus("ERROR - Invalid FS_GET_DIR_CONTENTS response (len: " + response_msg.payload.length + ")");
                
                return true;        // return true to end transaction after an error
            }
        }
            
        // generate message to open the file
        const packet_num = new HexStr().fromNumber(0, "uint16");            // packet 0
        const filename = new HexStr().fromUTF8String(root_filename + '\0')  // filename
        const payload = new HexStr().append(packet_num, filename);
        let ls_msg = new Message("FS_GET_DIR_CONTENTS", payload);
        
        // write the FS_GET_DIR_CONTENTS message and await the response
        await writeThenGetResponse(ls_msg, "large", "large", response_parser);

        return file_list;
    }

    /**
     * Create a new navigation element in the nav panel
     * @param {type: number, filename: string, path: string} file_info File information
     * @param {number} indent Number of indentations for the nav element
     */
    createElement(file_info, indent) {
        // create the parent div
        let navElement = document.createElement("div_nav_element_" + this.elementCounter);
        navElement.setAttribute("class", "nav_element disable-select");
        navElement.value = file_info;                                                                               // store a copy of the raw filename
        navElement.title = file_info.filename;    

        // create the element label
        let elementLabel = document.createElement("label_nav_element_" + this.elementCounter);
        elementLabel.setAttribute("class", "label_nav_element disable-select");
        elementLabel.innerHTML = "- ".repeat(indent) + file_info.filename + (this.#isDir(file_info.type) ? "/" : ""); // filename, indentation & optional '/'
        
        // create the delete 'X' icon
        let deleteIcon = document.createElement("delete_nav_element_" + this.elementCounter);
        deleteIcon.setAttribute("class", "nav_delete disable-select")
        deleteIcon.innerHTML= "X"
        deleteIcon.title = "Click to delete"

        // attach the onclick events
        elementLabel.addEventListener("click", this.#onLabelClick.bind(this));
        deleteIcon.addEventListener("click", this.#onDeleteClick.bind(this));

        navElement.appendChild(elementLabel);
        navElement.appendChild(deleteIcon);
        this.parentNode.appendChild(navElement);
        this.elementCounter++;
    }

    /**
     * Remove all nav elements
     */
    clear() {
        this.parentNode.innerHTML = "";
        this.currentlySelected = undefined;
        this.selectedDir = "";
    }

    /**
     * When a nav element label is clicked, un-highlight the previously selected element and highlight the clicked element
     * @param {onclick event} event onclick event attached to the elementLabel (i.e. child of the navElement)
     */
    async #onLabelClick(event) {
        const parent = event.currentTarget.parentNode;

        // un-highlight previously selected element
        this.#unhighlightElement(this.currentlySelected);
        
        // allow us to click a selected element to deselect
        if (this.currentlySelected != parent) {
            // highlight & remember the clicked element
            this.#highlightElement(parent);
            this.currentlySelected = parent;
        }

        // if the clicked element relates to a file, read it from the Hero BLE module
        if (this.#isFile(parent.value.type)) {
            const f = new FileTransfer;
            clearFileViewer("Reading file...");
            const file_data = await f.read(parent.value.path + "/" + parent.value.filename);
            viewFileInViewer(parent.value.filename, file_data);
            this.selectedDir = parent.value.path;
        } else if (this.#isDir(parent.value.type)) {
            this.selectedDir = parent.value.path + "/" + parent.value.filename;
        }

        document.getElementById("btn_file_send").title = "Save to '" + this.selectedDir + "'";
    }

    /**
     * When a nav element delete icon is clicked, try to remove the remote file
     * @param {onclick event} event onclick event attached to the elementLabel (i.e. child of the navElement)
     */
    async #onDeleteClick(event) {
        const parent = event.currentTarget.parentNode;

        // re-entrant function to get the contents of a directory & any subdirectories
        const removeChildren = async (file) => {
            // if the file is a directory
            if (this.#isDir(file.type)) {
                for (let c of file.child) {
                    await removeChildren(c);
                }
            }
            parent.remove();
        }

        const f = new FileTransfer();
        const file_status = await f.remove(parent.value.path + "/" + parent.value.filename);
        if (fileStatusToString(file_status) == "SUCCESS") {
            removeChildren(parent.child)
            parent.remove();
            // TODO, recursively remove all children
        }
    }

    /**
     * Apply highlight formatting to a nav element
     * @param {html node} element HTML node of the nav element to highlight
     */
    #highlightElement(element) {
        element.style.fontWeight = "700";
        element.style.backgroundColor = "rgba(66, 141, 255, 0.700)";
    }
    
    /**
     * Remove the highlight formatting of a nav element
     * @param {html node} element HTML node of the nav element to unhighlight
     */
    #unhighlightElement(element) {
        if (element != undefined)
        {
            element.style.fontWeight = "";
            element.style.backgroundColor = "";
        }
    }

    /**
     * Return true if the file enum is a file
     * @param {number} file_type File type enum
     * @returns True if the file enum is a file
     */
    #isFile(file_type) {
        return (fileTypeToString(file_type) == "File");
    }
    
    /**
     * Return true if the file enum is a directory
     * @param {number} file_type File type enum
     * @returns True if the file enum is a directory
     */
    #isDir(file_type) {
        return (fileTypeToString(file_type) == "Directory");
    }
}
