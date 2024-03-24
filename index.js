var mqtt;
var reconnectTimeout = 2000;
var connected_flag = 0;
//var host="192.168.1.163"; //change this
//var host="82.165.158.236";
//var host="steve-laptop"; //change this
var host="test.mosquitto.org";
var port=8080
//var port=9001;
//var port=8881;

function checkConnectionStatus(err_msg) {
  if (connected_flag == 0) {
    console.log(err_msg);
    document.getElementById("s_messages").innerHTML = err_msg;
    return false;
  }
  else {
    return true;
  }
}

function onConnectionLost() {
  console.log("connection lost");
  document.getElementById("status").innerHTML = "Connection Lost";
  document.getElementById("s_messages").innerHTML = "Connection Lost";
  connected_flag = 0;
}

function onFailure(message) {
  console.log("Failed");
  document.getElementById("s_messages").innerHTML = "Connection Failed- Retrying";
  setTimeout(MQTTconnect, reconnectTimeout);
}

function onMessageArrived(r_message) {

  // received message
  received_msg = "Message received " + r_message.payloadString + "<br>";
  received_msg = received_msg + "Message received Topic " + r_message.destinationName;
  //console.log("Message received ",r_message.payloadString);
  console.log("on message arrived");
  console.log(received_msg);

  //status message
  status_msg = ""
  document.getElementById("r_messages").innerHTML = received_msg;
}

function onConnect() {
  // connect to the web socket
  document.getElementById("s_messages").innerHTML = "Connected to " + host + " on port " + port;
  connected_flag = 1
  document.getElementById("status").innerHTML = "Connected";
  console.log("on Connect " + connected_flag);

  // lock the host and port input text field
  document.getElementsByName("server")[0].readOnly = true;
  document.getElementsByName("port")[0].readOnly = true;
}

function disconnect() {
    mqtt.disconnect();
    connected_flag = 0;

    // unlock host and port input fields
    document.getElementsByName("server")[0].readOnly = false;
    document.getElementsByName("port")[0].readOnly = false;
}

function MQTTconnect() {
  document.getElementById("r_messages").innerHTML = "";
  var s = document.forms["connform"]["server"].value;
  var p = document.forms["connform"]["port"].value;
  if (p != "") {
    console.log("ports");
    port = parseInt(p);
    console.log("port" + port);
  }
  if (s != "") {
    host = s;
    console.log("host");
  }
  console.log("connecting to " + host + " " + port);

  var x = Math.floor(Math.random() * 10000);
  var cname = "orderform-" + x;

  mqtt = new Paho.MQTT.Client(host, port, cname);
  //document.write("connecting to "+ host);
  var options = {
    timeout: 3,
    onSuccess: onConnect,
    onFailure: onFailure,
  };

  mqtt.onConnectionLost = onConnectionLost;
  mqtt.onMessageArrived = onMessageArrived;

  mqtt.connect(options);
  return false;


}

function sub_topics() {
  document.getElementById("r_messages").innerHTML = "";

  var disconnect_msg = "<b>Not Connected so can't subscribe</b>";
  if(checkConnectionStatus(disconnect_msg)) {

    // subscribe the topic
    var stopic = document.forms["subs"]["Stopic"].value;
    console.log("Subscribing to topic = " + stopic);
    mqtt.subscribe(stopic);
    document.getElementById("s_messages").innerHTML = "Subscribing to topic = " + stopic;

    // set the topic to be the default for published topic
    document.getElementsByName("Ptopic")[0].placeholder = stopic;
    document.getElementsByName("Ptopic")[0].value = stopic;
    document.getElementsByName("Ptopic")[1].placeholder = stopic;
    document.getElementsByName("Ptopic")[1].value = stopic;

    return false;
  }
  return false;
}

function send_message() {
  document.getElementById("r_messages").innerHTML = "";

  var disconnect_msg = "<b>Not Connected so can't send</b>";

  if (checkConnectionStatus(disconnect_msg)) {
    var msg = document.forms["smessage"]["message"].value;
    var topic = document.forms["smessage"]["Ptopic"].value;

    console.log(topic);

    message = new Paho.MQTT.Message(msg);
    if (topic == "")
      message.destinationName = "test-topic"
    else
      message.destinationName = topic;
    mqtt.send(message);

    document.getElementById("s_messages").innerHTML = "Sending Message: " + msg;

    return false;
  }
  return false;
}

function geoFindMe() {

  document.getElementById("s_messages").innerHTML = "";

  // check connection status
  var disconnect_msg = "<b>Not Connected so can't send</b>";
  if (checkConnectionStatus(disconnect_msg)) {

    function success(position) {
      console.log("here");
      // get topic, location, and temperature
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const topic = document.forms["sharestatus"]["Ptopic"].value;
      const temperature = document.forms["sharestatus"]["temperature"].value;
  
      // create a GeoJSON object to be passed
      document.getElementById("s_messages").innerHTML = "";
      message = {"type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinate": [latitude, longitude]
                  },
                  "properties":{
                    "temperature": temperature
                  }
                };
      message = JSON.stringify(message);

      // send the location
      message = new Paho.MQTT.Message(message);
      if (topic == "")
        message.destinationName = "test-topic"
      else
        message.destinationName = topic;
      mqtt.send(message);
      
      // update status message
      document.getElementById("s_messages").innerHTML = "Sending Location";

      return false;
    }
  
    function error() {
      document.getElementById("s_messages").innerHTML = "Unable to retrieve your location";
    }
  
    if (!navigator.geolocation) {
      document.getElementById("s_messages").innerHTML = "Geolocation is not supported by your browser";
    } else {
      document.getElementById("s_messages").innerHTML = "Locating…";
      navigator.geolocation.getCurrentPosition(success, error);
    }
  }
  
  return false;
}

// document.querySelector("#sharestatus").addEventListener("click", geoFindMe);