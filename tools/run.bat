@echo off
set browserPath=C:\Program Files (x86)\Google\Chrome\Application
set browserExec=chrome.exe
set toolsPath=%~dp0
set projectPath=%toolsPath%..
set "browserParams=--disable-web-security --user-data-dir=^"%localappdata%\Google\Chrome\User Data^" ^"%projectPath%\index.html^" --profile-directory=^"Default^""
cd ..
if not (%projectPath:~0,1% == %browserPath:~0,1%) %browserPath:~0,2%
cd "%browserPath%"
%browserExec% %browserParams%
if not (%projectPath:~0,1% == %browserPath:~0,1%) %projectPath:~0,2%
cd %toolsPath%