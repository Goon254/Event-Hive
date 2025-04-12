@echo off
echo ===================================================
echo Android Debug Keystore Generator and SHA-1 Extractor
echo ===================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo WARNING: This script is not running as Administrator.
    echo Some operations might fail due to permission issues.
    echo Consider running this script as Administrator.
    echo.
    pause
)

REM Create a directory for the keystore in a location with write permissions
echo Creating directory for keystore...
mkdir C:\Android-Keys 2>nul
if %errorLevel% neq 0 (
    echo Failed to create C:\Android-Keys directory.
    echo Trying alternative location...
    mkdir "%USERPROFILE%\Android-Keys" 2>nul
    if %errorLevel% neq 0 (
        echo Failed to create directory in user profile.
        echo.
        echo Please enter a directory path where you have write permissions:
        set /p KEYS_DIR="> "
        mkdir "%KEYS_DIR%" 2>nul
        if %errorLevel% neq 0 (
            echo Failed to create directory. Exiting.
            exit /b 1
        )
    ) else (
        set KEYS_DIR=%USERPROFILE%\Android-Keys
    )
) else (
    set KEYS_DIR=C:\Android-Keys
)

echo Using directory: %KEYS_DIR%
echo.

REM Generate the debug keystore
echo Generating debug keystore...
keytool -genkey -v -keystore "%KEYS_DIR%\debug.keystore" -alias androiddebugkey -storepass android -keypass android -keyalg RSA -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
if %errorLevel% neq 0 (
    echo Failed to generate keystore.
    echo.
    echo This might be due to:
    echo 1. Java not being installed or not in PATH
    echo 2. Permission issues
    echo.
    echo Please make sure Java is installed and try running this script as Administrator.
    exit /b 1
)

echo.
echo Debug keystore generated successfully at: %KEYS_DIR%\debug.keystore
echo.

REM Extract SHA-1 fingerprint
echo Extracting SHA-1 fingerprint...
echo.
keytool -list -v -keystore "%KEYS_DIR%\debug.keystore" -alias androiddebugkey -storepass android -keypass android
if %errorLevel% neq 0 (
    echo Failed to extract SHA-1 fingerprint.
    exit /b 1
)

echo.
echo ===================================================
echo IMPORTANT: Use the SHA-1 fingerprint shown above in your Google Cloud Console.
echo.
echo For your app.config.js, update the following:
echo.
echo googleClientIdAndroid: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com"
echo.
echo When using this keystore for signing, use:
echo.
echo keytool -list -v -keystore "%KEYS_DIR%\debug.keystore" -alias androiddebugkey -storepass android -keypass android
echo ===================================================
echo.

REM Create a shortcut to the keystore directory
echo Creating a shortcut to the keystore directory on your desktop...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Android-Keys.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%KEYS_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

echo.
echo A shortcut to your keystore directory has been created on your desktop.
echo.
echo Press any key to exit...
pause > nul