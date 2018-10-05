#/bin/bash
x-terminal-emulator -e "php -S 127.0.0.1:8080"
sleep 1
xdg-open 'http://127.0.0.1:8080' &