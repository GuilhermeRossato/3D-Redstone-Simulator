@echo off
cd ..
set OLDDIR=%CD%
cd "C:\Program Files (x86)\Google\Chrome\Application"
chrome.exe --disable-web-security --user-data-dir="%appdata%\..\Local\Google\Chrome\User Data" "%OLDDIR%\index.html" --profile-directory="Default"