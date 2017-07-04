@echo off
set toolsFolder=%CD%
@if exist %toolsFolder%\include.txt del %toolsFolder%\include.txt
cd ..
set projectFolder=%CD%
:: Calculate string length of project folder
call :get_string_length projectFolder strlen
SET /a strlen_added = %strlen% + 1
for /f "usebackq delims=|" %%a in (`dir /s/b "*.js"`) do call :process_file "%%a"
:: Tell the user about the new file
echo.include.txt
:: Go back to where we belong, not that it matters but...
cd %toolsFolder%
:: Give the user some time
@timeout /t 1 /NOBREAK>nul
exit /b

:process_file
:: Save first parameter, removing quotes
set b=%~1
:: Remove starting characters (to get relative path)
FOR /L %%i IN (1,1,%strlen_added%) DO call :remove_first_character "b"
call :save_as_script "%b%"
goto :eof

:remove_first_character
set b=%b:~1%
goto :eof

:save_as_script
:: Save first parameter, removing quotes
set c=%~1
:: Switch backward brackets with forward brackets
set c=%c:\=/%
:: Append a script src into the include file
echo.	^<script src="%c%"^>^</script^>>>%toolsFolder%\include.txt
goto :eof

:get_string_length
setlocal enabledelayedexpansion
:strLen_Loop
  if not "!%1:~%len%!"=="" set /A len+=1 & goto :strLen_Loop
(endlocal & set %2=%len%)
goto :eof