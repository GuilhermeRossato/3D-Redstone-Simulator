import fs from 'fs';
import net from 'net';
import { host, port } from "./lib/init.js";

/**
 * This script creates a TCP server that listens on a specified local port and relays data to a remote server.
 * It is used to reroute traffic from a local port to a remote server.
 */

const LOCAL_HOST = host;
const LOCAL_PORT = port;
const REMOTE_HOST = process.argv[2] || "192.168.15.25";
const REMOTE_PORT = port;
console.log({LOCAL_HOST,LOCAL_PORT,REMOTE_HOST,REMOTE_PORT});

const saveRemoteDataFile = '';
const saveLocalDataFile = '';

const server = net.createServer(function (socket) {
  let address;
  try {
    address = socket.address()["address"];
  } catch (error) {
    address = '?';
  }
  console.log(address, `connected to local port (${LOCAL_PORT})`);
  let state = 'connecting-to-socket';
  const serviceSocket = new net.Socket();
  const chunks = [];
  serviceSocket.connect(parseInt(String(REMOTE_PORT)), REMOTE_HOST, function () {
    console.log(`Connected to remote server at ${REMOTE_HOST}:${REMOTE_PORT}`);
    if (state === 'disconnected-from-source-socket') {
      serviceSocket.end();
      return;
    }
    state = 'connected-to-socket';
    if (chunks.length !== 0) {
      serviceSocket.write(Buffer.concat(chunks));
      chunks.length = 0;
    }
  });
  let isFirstServiceData = true;
  serviceSocket.on('data', (data) => {
    if (isFirstServiceData) {
      isFirstServiceData = false;
      // console.log(`Received`, data.byteLength, `bytes from remote server at ${REMOTE_HOST}:${REMOTE_PORT}`);
    }
    saveRemoteDataFile && fs.appendFileSync(saveRemoteDataFile, data);
    if (state === 'connected-to-socket') {
      socket.write(data);
    } else {
      console.warn('Warning: Cannot send data to original server because state is "' + state + '"');
      serviceSocket.end();
    }
  });
  serviceSocket.on('error', (err) => {
    err.message = 'Error at target port connection at ' + REMOTE_HOST + ':' + REMOTE_PORT + ': ' + err.message;
    console.log(err['code'], err.message);
    if (state !== 'disconnected-from-source-socket') {
      socket.end();
    }
  });
  serviceSocket.on('end', () => {
    state = 'disconnected-from-target-socket';
    socket.end();
  });
  let isFirstSocketData = true;
  socket.on('data', (data) => {
    if (isFirstSocketData) {
      isFirstSocketData = false;
      console.log(`Received`, data.byteLength, `bytes on ${LOCAL_HOST}:${LOCAL_PORT}:`, JSON.stringify(data.toString('utf8').substring(0, 100).split('\n')[0].trim()));
    }
    saveLocalDataFile && fs.appendFileSync(saveLocalDataFile, data);
    if (state === 'connecting-to-socket') {
      chunks.push(data);
    } else if (state === 'connected-to-socket') {
      serviceSocket.write(data);
    } else {
      console.warn('Cannot send data from disconnected socket');
    }
  });
  socket.on('error', (err) => {
    err.message = 'Error at source connection:' + LOCAL_PORT + ': ' + err.message;
    console.log(err["code"], err.message);
    if (state === 'connected-to-socket') {
      serviceSocket.end();
    }
    state = 'disconnected-from-source-socket';
  });
  socket.on('end', () => {
    if (state === 'connected-to-socket') {
      serviceSocket.end();
    }
    state = 'disconnected-from-source-socket';
  });
});

server.on('error', (err) => {
  console.error('Server error:', err["code"], err.message);
  if (err["code"] === 'EADDRINUSE') {
    console.error(`Port ${LOCAL_PORT} is already in use. Please choose a different port.`);
  }
  process.exit(1);
});

console.log('Starting local TCP server at', `${LOCAL_HOST}:${LOCAL_PORT}`, 'to relay to', `${REMOTE_HOST}:${REMOTE_PORT}`);

server.listen(LOCAL_PORT, parseInt(String(LOCAL_HOST)), () => {
  console.log(`Listening at ${LOCAL_HOST}:${LOCAL_PORT}`);
  console.log(` Relaying to ${REMOTE_HOST}:${REMOTE_PORT}`);
});
