@echo off
echo ======================================================
echo Stopping YieldSense AI Services...
echo ======================================================

:: Stop PostgreSQL
echo [DB] Stopping local PostgreSQL database instance...
cd postgres
bin\pg_ctl.exe stop -D data
cd ..

echo [DB] Database stopped successfully.
echo ======================================================
pause
