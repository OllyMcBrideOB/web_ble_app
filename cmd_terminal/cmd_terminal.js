let GATT = new GATTmanager();

document.getElementById("btn_connect").addEventListener("click", function() {
    if (GATT.isWebBLEAvailable()) {
        GATT.connect().then(_ => {
            document.getElementById("label_dev").innerHTML = GATT.deviceName();
        })
    }
})