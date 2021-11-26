const msg_cmd_t = {
    INVALID: "0xFFFF",
    NONE: "0x0000",			                /**< No command */
    PING: "0x8001",			                /**< Get the device ID */
    POLL: "0x8002",			                /**< Get the currently queued transaction and payload length */
    GET_BLE_CONN_STATUS: "0x0003",			/**< Get the BLE connection status */
    SET_BLE_CONN_STATUS: "0x0004",			/**< Set the BLE connection status */
    COMMS_AVAIL: "0x8005",			        /**< Get the number of 'UART' bytes available to read */
    COMMS_READ: "0x8006",			        /**< Read single or multiple 'UART' bytes */
    COMMS_WRITE: "0x8007",			        /**< Write multiple 'UART' bytes */
    GET_BATTERY_LEVEL: "0x0008",			/**< Get the battery level, 0 - 100% */
    GET_HAND_SERIAL_NUM: "0x0009",			/**< Get the hand serial number string */
    GET_HAND_FRIENDLY_NAME: "0x000A",		/**< Get the hand friendly name */
    SET_HAND_FRIENDLY_NAME: "0x000B",		/**< Set the hand friendly name */
    GET_HAND_BOOTLOADER_VER: "0x000C",		/**< Get the hand bootloader version string */
    GET_HAND_FIRMWARE_VER: "0x000D",		/**< Get the hand firmware version string */
    GET_HAND_MODEL_NUM: "0x000E",			/**< Get the hand model number string */
    GET_HAND_CHIRALITY: "0x000F",			/**< Get the hand chirality string */
    GET_HAND_MOTOR_CONFIG: "0x0010",		/**< Get the hand motor configuration id */
    GET_HERO_BLE_SERIAL_NUM: "0x8011",		/**< Get the Hero BLE serial number */
    GET_HERO_BLE_BOOTLOADER_VER: "0x8012",	/**< Get the Hero BLE bootloader version string */
    GET_HERO_BLE_FIRMWARE_VER: "0x8013",	/**< Get the Hero BLE firmware version string */
    GET_HERO_BLE_MODEL_NUM: "0x8014",		/**< Get the Hero BLE model number string */
    GET_BEEPER_VOLUME: "0x0015",			/**< Get the beeper volume */
    SET_BEEPER_VOLUME: "0x0016",			/**< Set the beeper volume */
    GET_VIBRATION_INTENSITY: "0x0017",		/**< Get the vibration intensity */
    SET_VIBRATION_INTENSITY: "0x0018",		/**< Set the vibration intensity */
    GET_LED_BRIGHTNESS: "0x0019",			/**< Get the LED brightness */
    SET_LED_BRIGHTNESS: "0x001A",			/**< Set the LED brightness */
    GET_LED_DEFAULT_COLOUR: "0x001B",		/**< Get the default LED colour */
    SET_LED_DEFAULT_COLOUR: "0x001C",		/**< Set the default LED colour */
    GET_BUTTON_STATUS: "0x001D",			/**< Get the button status */
    SET_BUTTON_STATUS: "0x001E",			/**< Set the button status */
    SET_RT_BUTTON_STATUS: "0x801F",			/**< Set the real-time button status */
    GET_RT_BUTTON_STATUS_CONFIG: "0x0020",	/**< Get the real-time button status configuration */
    SET_RT_BUTTON_STATUS_CONFIG: "0x0021",	/**< Set the real-time button status configuration */
    SET_RT_SENSOR_DATA: "0x8022",			/**< Set the real-time sensor data */
    GET_RT_SENSOR_DATA_CONFIG: "0x0023",	/**< Set the real-time sensor data configuration */
    SET_RT_SENSOR_DATA_CONFIG: "0x0024",	/**< Set the real-time sensor data configuration */
    SET_RT_GRIP_DATA: "0x8025",			    /**< Set the real-time grip data */
    GET_RT_GRIP_DATA_CONFIG: "0x0026",		/**< Set the real-time grip data configuration */
    SET_RT_GRIP_DATA_CONFIG: "0x0027",		/**< Set the real-time grip data configuration */
    SET_RT_FINGER_DATA: "0x8028",			/**< Set the real-time finger data */
    GET_RT_FINGER_DATA_CONFIG: "0x0029",	/**< Set the real-time finger data configuration */
    SET_RT_FINGER_DATA_CONFIG: "0x002A",	/**< Set the real-time finger data configuration */
    COMMS_PEEK: "0x802B",			        /**< Peek at a the Rx buffer without removing any data */
    GET_FINGER_POS: "0x002C",			    /**< Get the finger position & speed data */
    SET_FINGER_POS: "0x002D",			    /**< Set the fingers to move to specific positions */
    GET_FREEZE_MODE: "0x002E",			    /**< Get whether freeze mode is currently enabled */
    SET_FREEZE_MODE: "0x002F",			    /**< Enable freeze mode */
    SET_HAND_RESET: "0x0030",			    /**< Set the Hero Hand to reset */
    SET_HERO_BLE_RESET: "0x8031",			/**< Set the Hero BLE module to reset */
    SET_GRIP_GROUP_CONFIG: "0x0032",		/**< Delete, save or reset grips */
    GET_GRIP_GROUP_INFO: "0x0033",			/**< Get the number of grips, number groups and other grip group info */
    GET_GRIP_STRINGS: "0x4034",			    /**< Get all grip strings */
    GET_DEFAULT_GRIP_STRINGS: "0x4035",		/**< Get all default grip strings */
    SET_GRIP_STRING: "0x0036",		        /**< Create a grip from a grip string */
    GET_GRIP_POS: "0x0037",			        /**< Get the grip position data (normalised pos, binary encoding) */
    SET_GRIP_POS: "0x0038",			        /**< Set the grip to move to a specific position */
    GET_SENSOR_CONTROL_CONFIG: "0x0039",	/**< Get the sensor control configuration */
    SET_SENSOR_CONTROL_CONFIG: "0x003A",	/**< Set the sensor control configuration */
    GET_UNIX_TIME: "0x803B",			    /**< Get the current unix time from the I2C RTC */
    SET_UNIX_TIME: "0x803C",			    /**< Set the current unix time to the I2C RTC */
    GET_TIME_STR: "0x803D",			        /**< Get the timezone-adjusted time, as a string, from the I2C RTC */
    GET_TEST_MODE: "0x803E",			    /**< Get the current test mode being run on the Hero BLE module (e.g. radiated emissions) */
    SET_TEST_MODE: "0x803F",			    /**< Set the Hero BLE module into a specific test mode (e.g. radiated emissions) */
    FS_EXISTS: "0x8040",			        /**< Get whether a file/directory exists in the Hero BLE filesystem */
    FS_MKDIR: "0x8041",			            /**< Make a new file/directory in the Hero BLE filesystem */
    FS_REMOVE: "0x8042",			        /**< Remove a file/directory in the Hero BLE filesystem */
    FS_OPEN: "0x8043",			            /**< Open/create a file for reading/writing  */
    FS_CLOSE: "0x8044",			            /**< Close a currently open file */
    FS_READ: "0xC045",			            /**< Read data from a currently open file */
    FS_WRITE: "0x8046",			            /**< Write data to a currently open file */
    FS_GET_DIR_CONTENTS: "0xC047",			/**< Get a list of filenames within a directory (may be split over multiple response packets) */
    FS_GET_NUM_FILES: "0x8048",			    /**< Get the number of files within a directory */
    FS_CLEAR_DIR: "0x8049",			        /**< Delete all files within a directory (sub-directories are not removed) */
    GET_MTU_SIZE: "0x804A",			        /**< Get the current MTU size */
    SET_MTU_SIZE: "0x804B",			        /**< Set the current MTU size */
    SET_ADV_DATA: "0x804C",			        /**< Update the data within the advertising & scan response packet */
    SET_DEV_MODE: "0x804D",			        /**< Run a specific development mode */
}       