/**< Mesasge commands (must be Littl-Endian) */
const msg_cmd_t = {
    INVALID							: "0xFFFF",
    NONE							: "0x0000",			/**< No command */
    PING							: "0x0180",			/**< Get the device ID */
    POLL							: "0x0280",			/**< Get the currently queued transaction and payload length */
    GET_BLE_CONN_STATUS				: "0x0300",			/**< Get the BLE connection status */
    SET_BLE_CONN_STATUS				: "0x0400",			/**< Set the BLE connection status */
    COMMS_AVAIL						: "0x0580",			/**< Get the number of 'UART' bytes available to read */
    COMMS_READ						: "0x0680",			/**< Read single or multiple 'UART' bytes */
    COMMS_WRITE						: "0x0780",			/**< Write multiple 'UART' bytes */
    GET_BATTERY_LEVEL				: "0x0800",			/**< Get the battery level, 0 - 100% */
    GET_HAND_SERIAL_NUM				: "0x0900",			/**< Get the hand serial number string */
    GET_HAND_FRIENDLY_NAME			: "0x0A00",			/**< Get the hand friendly name */
    SET_HAND_FRIENDLY_NAME			: "0x0B00",			/**< Set the hand friendly name */
    GET_HAND_BOOTLOADER_VER			: "0x0C00",			/**< Get the hand bootloader version string */
    GET_HAND_FIRMWARE_VER			: "0x0D00",			/**< Get the hand firmware version string */
    GET_HAND_MODEL_NUM				: "0x0E00",			/**< Get the hand model number string */
    GET_HAND_CHIRALITY				: "0x0F00",			/**< Get the hand chirality string */
    GET_HAND_MOTOR_CONFIG			: "0x1000",			/**< Get the hand motor configuration id */
    GET_HERO_BLE_SERIAL_NUM			: "0x1180",			/**< Get the Hero BLE serial number */
    GET_HERO_BLE_BOOTLOADER_VER		: "0x1280",			/**< Get the Hero BLE bootloader version string */
    GET_HERO_BLE_FIRMWARE_VER		: "0x1380",			/**< Get the Hero BLE firmware version string */
    GET_HERO_BLE_MODEL_NUM			: "0x1480",			/**< Get the Hero BLE model number string */
    GET_BEEPER_VOLUME				: "0x1500",			/**< Get the beeper volume */
    SET_BEEPER_VOLUME				: "0x1600",			/**< Set the beeper volume */
    GET_VIBRATION_INTENSITY			: "0x1700",			/**< Get the vibration intensity */
    SET_VIBRATION_INTENSITY			: "0x1800",			/**< Set the vibration intensity */
    GET_LED_BRIGHTNESS				: "0x1900",			/**< Get the LED brightness */
    SET_LED_BRIGHTNESS				: "0x1A00",			/**< Set the LED brightness */
    GET_LED_DEFAULT_COLOUR			: "0x1B00",			/**< Get the default LED colour */
    SET_LED_DEFAULT_COLOUR			: "0x1C00",			/**< Set the default LED colour */
    GET_BUTTON_STATUS				: "0x1D00",			/**< Get the button status */
    SET_BUTTON_STATUS				: "0x1E00",			/**< Set the button status */
    SET_RT_BUTTON_STATUS			: "0x1F80",			/**< Set the real-time button status */
    GET_RT_BUTTON_STATUS_CONFIG		: "0x2000",			/**< Get the real-time button status configuration */
    SET_RT_BUTTON_STATUS_CONFIG		: "0x2100",			/**< Set the real-time button status configuration */
    SET_RT_SENSOR_DATA				: "0x2280",			/**< Set the real-time sensor data */
    GET_RT_SENSOR_DATA_CONFIG		: "0x2300",			/**< Set the real-time sensor data configuration */
    SET_RT_SENSOR_DATA_CONFIG		: "0x2400",			/**< Set the real-time sensor data configuration */
    SET_RT_GRIP_DATA				: "0x2580",			/**< Set the real-time grip data */
    GET_RT_GRIP_DATA_CONFIG			: "0x2600",			/**< Set the real-time grip data configuration */
    SET_RT_GRIP_DATA_CONFIG			: "0x2700",			/**< Set the real-time grip data configuration */
    SET_RT_FINGER_DATA				: "0x2880",			/**< Set the real-time finger data */
    GET_RT_FINGER_DATA_CONFIG		: "0x2900",			/**< Set the real-time finger data configuration */
    SET_RT_FINGER_DATA_CONFIG		: "0x2A00",			/**< Set the real-time finger data configuration */
    COMMS_PEEK						: "0x2B80",			/**< Peek at a the Rx buffer without removing any data */
    GET_FINGER_POS					: "0x2C00",			/**< Get the finger position & speed data */
    SET_FINGER_POS					: "0x2D00",			/**< Set the fingers to move to specific positions */
    GET_FREEZE_MODE					: "0x2E00",			/**< Get whether freeze mode is currently enabled */
    SET_FREEZE_MODE					: "0x2F00",			/**< Enable freeze mode */
    SET_HAND_RESET					: "0x3000",			/**< Set the Hero Hand to reset */
    SET_HERO_BLE_RESET				: "0x3180",			/**< Set the Hero BLE module to reset */
    SET_GRIP_GROUP_CONFIG			: "0x3200",			/**< Delete, save or reset grips */
    GET_GRIP_GROUP_INFO				: "0x3300",			/**< Get the number of grips, number groups and other grip group info */
    GET_GRIP_STRINGS				: "0x3440",			/**< Get all grip strings */
    GET_DEFAULT_GRIP_STRINGS		: "0x3540",			/**< Get all default grip strings */
    SET_GRIP_STRING					: "0x3600",			/**< Create a grip from a grip string */
    GET_GRIP_POS					: "0x3700",			/**< Get the grip position data (normalised pos, binary encoding) */
    SET_GRIP_POS					: "0x3800",			/**< Set the grip to move to a specific position */
    GET_SENSOR_CONTROL_CONFIG		: "0x3900",			/**< Get the sensor control configuration */
    SET_SENSOR_CONTROL_CONFIG		: "0x3A00",			/**< Set the sensor control configuration */
    GET_UNIX_TIME					: "0x3B80",			/**< Get the current unix time from the I2C RTC */
    SET_UNIX_TIME					: "0x3C80",			/**< Set the current unix time to the I2C RTC */
    GET_TIME_STR					: "0x3D80",			/**< Get the timezone-adjusted time, as a string, from the I2C RTC */
    GET_TEST_MODE					: "0x3E80",			/**< Get the current test mode being run on the Hero BLE module (e.g. radiated emissions) */
    SET_TEST_MODE					: "0x3F80",			/**< Set the Hero BLE module into a specific test mode (e.g. radiated emissions) */
    FS_EXISTS						: "0x4080",			/**< Get whether a file/directory exists in the Hero BLE filesystem */
    FS_MKDIR						: "0x4180",			/**< Make a new file/directory in the Hero BLE filesystem */
    FS_REMOVE						: "0x4280",			/**< Remove a file/directory in the Hero BLE filesystem */
    FS_OPEN							: "0x4380",			/**< Open/create a file for reading/writing  */
    FS_CLOSE						: "0x4480",			/**< Close a currently open file */
    FS_READ							: "0x45C0",			/**< Read data from a currently open file */
    FS_WRITE						: "0x4680",			/**< Write data to a currently open file */
    FS_GET_DIR_CONTENTS				: "0x47C0",			/**< Get a list of filenames within a directory (may be split over multiple response packets) */
    FS_GET_NUM_FILES				: "0x4880",			/**< Get the number of files within a directory */
    FS_CLEAR_DIR					: "0x4980",			/**< Delete all files within a directory (sub-directories are not removed) */
    GET_MTU_SIZE					: "0x4A80",			/**< Get the current MTU size */
    SET_MTU_SIZE					: "0x4B80",			/**< Set the current MTU size */
    SET_ADV_DATA					: "0x4C80",			/**< Update the data within the advertising & scan response packet */
    SET_DEV_MODE					: "0x4D80",			/**< Run a specific development mode */
};
