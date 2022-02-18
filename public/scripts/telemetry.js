console.log(`telemetry worker loaded!!`);

const socket = new WebSocket('ws://localhost:5454/ws');

socket.addEventListener('open', function (_evt) {
  socket.send(JSON.stringify({
    type: 'connection_request',
    connection_types: ['telemetry']
  }))
})

socket.addEventListener('message', function (evt) {
  const payload = JSON.parse(evt.data)
  if (payload === 'pong') return;
  console.log(`telemetry - message from socket:`, payload);
  if (payload.type === "telemetry") event_to_ui(payload)
})

onmessage = function (e) {
  console.log(`telemetry - message received from ui`, e.data);
  switch (e.data) {
    case 'disconnect':
      clearInterval(pingTimer)
      socket.send(JSON.stringify({
        type: 'disconnection_request'
      }))
      break;
    case 'test':
      // socket.send(JSON.stringify('a test command from the UI'))
      break;
    default:
      console.log(`telemetry worker - unknown message: `, e.data);
  }
}

function event_to_ui(evt) {
  console.log(`will forward evt to ui:`, evt);
  postMessage(evt)
}

let pingTimer = setInterval(function () {
  socket.send(JSON.stringify('ping'))
}, 5000)
