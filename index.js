import io from 'socket.io-client'



//const socket = io('http://localhost:4000')
const socket = io('http://192.168.1.148:4000')

socket.on('connect', function(){
  console.log('On connect')
  socket.emit('signin', {
    user_name: "PabloArriola",
    tournament_id: 12,
    user_role: 'player'
  });
});

socket.on('ok_signin', function(){
  console.log("Successfully signed in!");
});