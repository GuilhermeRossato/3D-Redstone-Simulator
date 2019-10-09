#/bin/bash
cd ..
x-terminal-emulator -e "npm run start"
sleep 1
xdg-open 'http://127.0.0.1:8080' &