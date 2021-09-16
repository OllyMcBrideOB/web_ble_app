/**< This UUID class allows a UUID string to be constructed
 * using a base & short uuid string
 */
class UUID {
    /**< Construct a UUID string from a base & short uuid
     * @param base_uuid The long 128-bit (36 char) base UUID
     * @param short_uuid The short 16-bit (4 char) short UUID
     */
    constructor(base_uuid, short_uuid) {
        this.setBase(base_uuid);
        this.setShort(short_uuid);
    }

    /**< Set the base UUID */
    setBase(base_uuid) {
        if (base_uuid.length == 36){
            this.base_uuid = base_uuid.toLowerCase()
        }
        else
        {
            console.log("ERROR - base_UUID should be in the format '0b0b0000-feed-dead-bee5-0be9b1091c50'")
        }
    }
    
    /**< Set the short UUID */
    setShort(short_uuid) {
        if (short_uuid.length == 4) {
            this.short_uuid = short_uuid.toLowerCase()
            this.UUID = this.base_uuid.substring(0, 4) + 
            this.short_uuid + 
            this.base_uuid.substring(8);
        }
        else
        {
            console.log("Failed to create OB_UUID object as '%s' is invalid", short_uuid);
        }
    }
    
    /**< Get the full UUID as a string */
    toString() {
        return this.UUID;
    }
}

/**< Extend the UUID and use the predefined OB base UUID */
class OB_UUID extends UUID
{
    constructor(short_uuid) {
        super("0b0b0000-feed-dead-bee5-0be9b1091c50", short_uuid);
    }
}

/**< Extend the UUID and use the predefined NUS base UUID */
class NUS_UUID extends UUID
{
    constructor(short_uuid) {
        super("6e400001-b5a3-f393-e0a9-e50e24dcca9e", short_uuid);
    }
}