@echo off
color 0c
echo -
echo Cleaning Cache ...
echo -
rd /s /q "./cache"
timeout 2
test&cls
color 02  

echo .
echo .
echo .

npx nodemon