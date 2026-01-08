@echo off
echo Setting up MOC Chat Relay Backend...

mkdir moc-chat-backend
cd moc-chat-backend

npm init -y
npm install express cors

(
echo const express = require('express');
echo const cors = require('cors');
echo.
echo const app = express();
echo const PORT = process.env.PORT ^|^| 3000;
echo.
echo app.use(cors());
echo app.use(express.json());
echo.
echo const MAX_MESSAGES = 100;
echo const messages = [];
echo.
echo app.post('/api/chat', (req, res) => ^{
echo.  const ^{ time, user, message ^} = req.body;
echo.  if (!time ^|^| !user ^|^| !message) ^{
echo.    return res.status(400).json(^{ error: 'Missing fields' ^});
echo.  ^}
echo.  messages.push(^{ time, user, message ^});
echo.  if (messages.length ^> MAX_MESSAGES) messages.shift();
echo.  res.json(^{ status: 'ok' ^});
echo ^});
echo.
echo app.get('/api/chat', (req, res) => ^{
echo.  res.json(messages);
echo ^});
echo.
echo app.listen(PORT, () => ^{
echo.  console.log(`Chat relay server listening on port %PORT%`);
echo ^});
) > server.js

echo Setup complete! You can now start the server by running run_moc_chat.bat
pause
