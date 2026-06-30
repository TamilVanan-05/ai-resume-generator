@echo off
title Push Project to GitHub - Resum.AI
echo ======================================================================
echo             AUTOMATED GITHUB UPLOADER - RESUM.AI
echo ======================================================================
echo.

:: Check if Git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed on this computer.
    echo Please download and install Git from: https://git-scm.com/downloads
    echo After installing, restart this terminal and run this script again.
    echo.
    pause
    exit /b
)

:: Confirm remote URL with user
echo To upload this project to your GitHub account (TamilVanan-05):
echo 1. Go to: https://github.com/new
echo 2. Log in and create a new repository (name it e.g. "ai-resume-generator")
echo 3. Keep the repository PRIVATE so others cannot see your databases/keys.
echo 4. Copy the repository URL (e.g., https://github.com/TamilVanan-05/ai-resume-generator.git)
echo.

set /p repo_url="PASTE YOUR GITHUB REPOSITORY URL HERE: "

if "%repo_url%"=="" (
    echo [ERROR] Repository URL cannot be empty.
    pause
    exit /b
)

echo.
echo [STATUS] Initializing Git repository...
git init

echo.
echo [STATUS] Adding project files...
git add .

echo.
echo [STATUS] Committing files locally...
git commit -m "Initial commit of full-stack AI Resume website"

echo.
echo [STATUS] Configuring remote branch...
git branch -M main
git remote remove origin >nul 2>nul
git remote add origin %repo_url%

echo.
echo [STATUS] Pushing code to GitHub...
echo (A GitHub login window may pop up, please authenticate to allow upload)
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ======================================================================
    echo [SUCCESS] Your code has been uploaded to GitHub!
    echo.
    echo Next Steps:
    echo 1. Go to Render.com and sign up.
    echo 2. Select Web Service, connect your GitHub account, and select this repository.
    echo 3. Build Command: pip install -r backend/requirements.txt && pip install gunicorn
    echo 4. Start Command: gunicorn -w 4 -b 0.0.0.0:$PORT "backend.app:create_app()"
    echo ======================================================================
) else (
    echo [ERROR] Failed to push code to GitHub. Please check your internet connection or login credentials.
)
echo.
pause
