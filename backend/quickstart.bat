@echo off
REM Windows batch file wrapper to run PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0quickstart.ps1"
