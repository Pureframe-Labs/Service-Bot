# Port 3000 Already in Use - Quick Fix Guide

## Problem
You're getting: `Error: listen EADDRINUSE: address already in use :::3000`

This means port 3000 is already occupied by another process.

## Quick Solutions

### Option 1: Use a Different Port (Easiest)
```bash
# Windows
set PORT=3001 && npm run dev

# Mac/Linux
PORT=3001 npm run dev
```

Then update your ngrok command:
```bash
ngrok http 3001
```

---

### Option 2: Kill the Process Using Port 3000

#### Windows
```bash
# Find the process
netstat -ano | findstr :3000

# This will show something like:
# TCP    [::]:3000    [::]:0    LISTENING    12345

# Kill it (replace 12345 with the actual PID)
taskkill /PID 12345 /F
```

#### Mac/Linux
```bash
# Find and kill in one command
lsof -ti:3000 | xargs kill -9
```

---

### Option 3: Check What's Using Port 3000

#### Windows
```bash
netstat -ano | findstr :3000
```

#### Mac/Linux
```bash
lsof -i :3000
ps aux | grep node
```

---

## Prevention Tips

1. **Always stop your server properly:**
   - Press `Ctrl+C` in your terminal when stopping

2. **Check for zombie processes:**
   ```bash
   # Windows
   tasklist | findstr node
   
   # Mac/Linux
   ps aux | grep node
   ```

3. **Use auto-restart with different port:**
   ```bash
   PORT=3001 npm run dev
   ```

---

## If Nothing Works

Restart your terminal or IDE completely. Sometimes Node.js processes hang in the background even after closing the terminal.

---

## For Production

Consider using environment variables:
```bash
PORT=8080 NODE_ENV=production npm run dev
