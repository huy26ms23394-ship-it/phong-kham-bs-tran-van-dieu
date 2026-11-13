@echo off
:: Wrapper cho phep goi lenh Docker Engine (ben trong WSL2 Debian) truc tiep tu CMD / npm scripts tren Windows
for /f "usebackq delims=" %%P in (`wsl -d Debian wslpath -a "%cd%"`) do set "WSL_DIR=%%P"
wsl -d Debian -u root -e sh -c "cd '%WSL_DIR%' && docker %*"
