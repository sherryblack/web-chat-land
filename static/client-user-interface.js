// This file unifies inputs and the dat.GUI menu at the top.
// It also contains declarations for some global variables
// (sorry i know that's disorganized...)

var leftHeld = false;
var rightHeld = false;
var upHeld = false;
var downHeld = false;
var local_media = null;
var godMode = true;
var videoSenders = [];
var audioSenders = [];

let serverObjects = {};

const joystick = createJoystick(document.getElementById('joystickZone'));

const defaultWidth = 320;
const defaultHeight = "";
const defaultZIndex = "";

let gui = new dat.GUI();
gui.close();
let guiOptions = {
  receiveStreams : true,
  godMode        : false,
  width          : defaultWidth,
  height : defaultHeight,
  z_index : defaultZIndex,
  iframeUrl : "https://itp.nyu.edu/camp2020/calendar",
  imageUrl : "https://itp.nyu.edu/classes/satc-spring2014/wp-content/uploads/sites/44/2014/01/ITP-Floor.png",
  disableCreationPrompts: false,
};

gui.add(
  {
    toggleJoystick : function() {
      let x = document.getElementById('joystickZone');

      if (x.style.display === 'none') {
        x.style.display = 'block';
      } else {
        x.style.display = 'none';
      }
    }
  },
  'toggleJoystick'
);
gui.add({
  goBackToNormal : function() {
    guiOptions.width = defaultWidth;
    guiOptions.height = defaultHeight;
    guiOptions.z_index = defaultZIndex;
    for (var i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
    }
  }
}, "goBackToNormal")
gui.add(guiOptions, 'width');
gui.add(guiOptions, 'height');
gui.add(guiOptions, 'z_index');
gui.add(guiOptions, 'iframeUrl');
gui.add({
  spawnIFrame : function() {
    if (guiOptions.disableCreationPrompts || confirm(
`Are you sure you want to create an iframe? This will appear for everyone.
The spawned iframe will appear with the dimensions and url set in the config window.`)) {
      signaling_socket.emit('createCustom', {
        x     : my_X,
        y     : my_Y,
        z     : guiOptions.z_index,
        width : guiOptions.width,
        height : guiOptions.height,
        url : guiOptions.iframeUrl,
        type : "iframe"
      });
    }
  }
}, "spawnIFrame");


gui.add(guiOptions, 'imageUrl');
gui.add({
  spawnImage : function() {
    if (guiOptions.disableCreationPrompts || confirm(
`Are you sure you want to create an image? This will appear for everyone.
The spawned image will appear with the dimensions and url set in the config window.`)) {
      signaling_socket.emit('createCustom', {
        x     : my_X,
        y     : my_Y,
        z     : guiOptions.z_index,
        width : guiOptions.width,
        height : guiOptions.height,
        url : guiOptions.imageUrl,
        type : "image"
      });
    }
  }
}, "spawnImage")

var f2 = gui.addFolder('Advanced options');
f2.add(
  {
    screenShare : function() {
      let captureStream = null;

      local_media[0].srcObject.getTracks().forEach((track) => track.stop());
      navigator.mediaDevices
        .getDisplayMedia({ audio: true, video: true })
        .catch((err) => {
          console.error('Error:' + err);
          return null;
        })
        .then(function(stream) {
          // console.log(stream);
          for (let videoSender of videoSenders) {
            var screenVideoTrack = stream.getVideoTracks()[0];
            // in case stream is already closed
            try {
              videoSender.replaceTrack(screenVideoTrack);
            } catch (e) {
              console.log(e);
            }
          }
          for (let audioSender of audioSenders) {
            var screenAudioTrack = stream.getAudioTracks()[0];
            try {
              audioSender.replaceTrack(screenAudioTrack);
            } catch (e) {
              console.log(e);
            }
          }
          local_media[0].srcObject = stream;
          local_media_stream = stream;
        });
      // navigator.mediaDevices.getDisplayMedia({}).catch(err => { console.error("Error:" + err); return null; })
      // .then(function(stream){
      //     // console.log(stream);
      //     var screenAudioTrack = stream.getAudioTracks()[0];
      //     audioSender.replaceTrack(screenAudioTrack);
      //   });
    }
  },
  'screenShare'
);
f2.add(guiOptions, 'receiveStreams');
f2.add(guiOptions, 'godMode');
f2.add(guiOptions, 'disableCreationPrompts');
f2.add({
  getRoomJson : function() {
    let roomJsonObj = {
      objects: [],
    }

    for (let soId in serverObjects) {
      let so = serverObjects[soId];
      if (so.type != "user") {
        let newObj = {};
        for (let soKey in so) {
          // prevent saving these fields
          if (["id", "peer_id", "channel", "el", "prevUrl"].indexOf(soKey) < 0) {
            newObj[soKey] = so[soKey];
          }
        }
        roomJsonObj.objects.push(newObj);
      }
    }
    alert(JSON.stringify(roomJsonObj));
  }
}, "getRoomJson")
f2.add({
  importRoomJson : function() {
    let jsonStr = prompt("Paste room JSON here: ", "");
    let jsonObj = null;
    try {
        jsonObj = JSON.parse(jsonStr);
        for (let obj of jsonObj.objects) {
          // holy bajeezus this might be the unsafe-est thing
          // I have EVER written
          signaling_socket.emit('createCustom', obj);
        }
    } catch(e) {
        alert(e); // error in the above string (in this case, yes)!
        return;
    }
  }
}, "importRoomJson");


function isScrolledIntoView(elem) {
  var docViewTop = $(window).scrollTop();
  var docViewBottom = docViewTop + $(window).height();

  var elemTop = $(elem).offset().top;
  var elemBottom = elemTop + $(elem).height();

  let visibleTop = elemBottom <= docViewBottom && elemTop >= docViewTop;

  var docViewLeft = $(window).scrollLeft();
  var docViewRight = docViewLeft + $(window).width();

  var elemLeft = $(elem).offset().left;
  var elemRight = elemLeft + $(elem).width();

  return visibleTop && (elemRight <= docViewRight && elemLeft >= docViewLeft);
}

document.addEventListener('keydown', function(e) {
  // console.log(e);
  if (e.keyCode == 37) {
    leftHeld = true;
  }
  if (e.keyCode == 38) {
    upHeld = true;
  }
  if (e.keyCode == 39) {
    rightHeld = true;
  }
  if (e.keyCode == 40) {
    downHeld = true;
  }
});
document.addEventListener('keyup', function(e) {
  if (e.keyCode == 37) {
    leftHeld = false;
  }
  if (e.keyCode == 38) {
    upHeld = false;
  }
  if (e.keyCode == 39) {
    rightHeld = false;
  }
  if (e.keyCode == 40) {
    downHeld = false;
  }
});

var signaling_socket = null; /* our socket.io connection to our webserver */
var local_media_stream = null; /* our own microphone / webcam */
var peers = {}; /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
var peer_media_elements = {}; /* keep track of our <video>/<audio> tags, indexed by peer_id */
var peerAvatars = {};
my_X = Math.random() * 100;
my_Y = Math.random() * 100;
