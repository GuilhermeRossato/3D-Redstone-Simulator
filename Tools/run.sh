#!/bin/bash
projectPath=`pwd`/..
browserExec="google-chrome"
browserParams="--disable-web-security --user-data-dir=${HOME// /%20}/.config/google-chrome --profile-directory=Default ${projectPath// /%20}/index.html"
$browserExec $browserParams
