import child_process from 'node:child_process';
import { sfs } from '../utils/sfs.js';

const sshPrivateKeyPath = 'C:/Users/user/.ssh/id_ed25519';
const s = await sfs.stat(sshPrivateKeyPath);

if (s.size) {
  const child = child_process.spawn('ssh', ['-i', sshPrivateKeyPath, '-p', '8197', 'backend@camisadoavesso.com.br', '-tt'], {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.on('spawn', () => {
    console.log('Child process spawned');
  });

  child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  child.stdout.on('error', (err) => {
    console.error('stdout error:', err);
  });

  child.stderr.on('error', (err) => {
    console.error('stderr error:', err);
  });

  child.on('close', (code) => {
    console.log(`Child process closed with code ${code}`);
  });

  child.on('exit', (code) => {
    console.log(`Child process exited with code ${code}`);
  });
  async function sendCommand(child, command) {
    return new Promise((resolve, reject) => {
      try {
        const output = [];

        // Handler to collect data from stdout.
        const onError = (error) => {reject(error);
              if (child.stdout) {
                child.stdout.off('data', onData);
                child.stdout.off('error', onError);
              } else {
                console.log('child.stdout undefined');
              }};
        const onData = (data) => {
          try {
            output.push(data);
            // Check if the last two characters are ":~$"
            if (output.toString().trim().endsWith(':~$')) {
              // Remove the listener once the condition is met.
              if (child.stdout) {
                child.stdout.off('data', onData);
                child.stdout.off('error', onError);
              } else {
                console.log('child.stdout undefined');
              }
              resolve(Buffer.concat(output));
            }
          } catch (error) {
            reject(error);
          }
        };

        // Listen on stdout for the prompt.
        if (child.stdout) {
          child.stdout.on('data', onData);
          child.stdout.on('error', onError);
        } else {
          reject(new Error('child.stdout undefined'));
        }

        // Write the command to stdin.
        if (child.stdin) {
          child.stdin.write(`${command}\n`);
        } else {
          reject(new Error('child.stdin undefined'));
        }
      } catch (error) {
          reject(error);
      }
    });
  }
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log(JSON.stringify(await sendCommand('ls')));
}

