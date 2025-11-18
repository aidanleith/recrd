# Digital Ocean HTTPS Setup & 404 Troubleshooting

## Common 404 Issues

### 1. **API Calls Returning 404**
**Symptom**: Network tab shows `https://ntw234.xyz/api/...` returning 404

**Solution**: Configure nginx to proxy API requests

### 2. **Static Assets (JS/CSS) Returning 404**
**Symptom**: `assets/js/index-[hash].js` or CSS files return 404

**Solution**: Configure nginx to serve the `dist` folder correctly

### 3. **React Router Routes Returning 404**
**Symptom**: Direct URL access (e.g., `/home`) returns 404

**Solution**: Configure nginx to serve `index.html` for all routes

## Step-by-Step nginx Configuration

### 1. Install nginx (if not already installed)
```bash
sudo apt update
sudo apt install nginx
```

### 2. Create nginx Configuration

Create/edit `/etc/nginx/sites-available/ntw234.xyz`:

```nginx
server {
    listen 80;
    server_name ntw234.xyz www.ntw234.xyz;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ntw234.xyz www.ntw234.xyz;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/ntw234.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ntw234.xyz/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory - point to your built React app
    root /path/to/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Serve static files
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin *;
    }

    # Serve React app for all other routes (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 3. Enable the Site
```bash
sudo ln -s /etc/nginx/sites-available/ntw234.xyz /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## SSL Certificate Setup (Let's Encrypt)

### 1. Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

### 2. Obtain Certificate
```bash
sudo certbot --nginx -d ntw234.xyz -d www.ntw234.xyz
```

### 3. Auto-renewal (already configured by certbot)
```bash
sudo certbot renew --dry-run  # Test renewal
```

## Backend Setup

### 1. Run Backend with PM2 (recommended)
```bash
npm install -g pm2
cd /path/to/backend
pm2 start server.js --name "recrd-api"
pm2 save
pm2 startup  # Enable auto-start on reboot
```

### 2. Verify Backend is Running
```bash
curl http://localhost:5000/api/allRankings
```

## Frontend Build & Deploy

### 1. Build for Production
```bash
cd /path/to/frontend
npm install
npm run build
```

### 2. Copy Build to Server
The `dist` folder should be copied to your server and served by nginx.

### 3. Update nginx Root Path
Update the `root` directive in nginx config to point to your `dist` folder:
```nginx
root /var/www/ntw234.xyz/dist;  # Update this path
```

## Debugging 404 Errors

### 1. Check Browser Console
Open DevTools → Network tab:
- **Red requests** = 404 errors
- Check the **URL** of failed requests
- Check the **Response** tab for error details

### 2. Check nginx Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### 3. Check nginx Access Logs
```bash
sudo tail -f /var/log/nginx/access.log
```

### 4. Test API Directly
```bash
# From server
curl http://localhost:5000/api/allRankings

# From browser/curl (external)
curl https://ntw234.xyz/api/allRankings
```

### 5. Test Static Files
```bash
# Check if files exist
ls -la /path/to/frontend/dist/assets/js/

# Test in browser
https://ntw234.xyz/assets/js/index-[hash].js
```

## Common Issues & Solutions

### Issue: API calls return 404
**Check:**
- Backend is running: `pm2 list` or `ps aux | grep node`
- nginx proxy config is correct
- Backend is listening on port 5000: `netstat -tlnp | grep 5000`

**Fix:**
- Restart backend: `pm2 restart recrd-api`
- Reload nginx: `sudo systemctl reload nginx`

### Issue: Static assets return 404
**Check:**
- Files exist in `dist` folder
- nginx `root` path is correct
- File permissions: `sudo chown -R www-data:www-data /path/to/frontend/dist`

**Fix:**
- Rebuild frontend: `npm run build`
- Check nginx `root` directive
- Fix permissions: `sudo chmod -R 755 /path/to/frontend/dist`

### Issue: React Router routes return 404
**Check:**
- nginx has `try_files $uri $uri/ /index.html;` in location `/`

**Fix:**
- Add the `try_files` directive (see config above)

### Issue: Mixed Content (HTTP/HTTPS)
**Check:**
- All API calls use HTTPS or relative paths
- No hardcoded HTTP URLs

**Fix:**
- Path.js now uses relative paths by default
- Set `VITE_API_BASE_URL` if API is on different domain

## Environment Variables

### Option 1: Same Domain (Recommended)
No environment variable needed - uses relative paths.

### Option 2: Different Domain/Port
Create `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://api.ntw234.xyz
# OR if on different port:
# VITE_API_BASE_URL=https://ntw234.xyz:5000
```

Then rebuild:
```bash
npm run build
```

## Verification Checklist

- [ ] Backend is running on port 5000
- [ ] Frontend is built (`npm run build`)
- [ ] nginx is configured and running
- [ ] SSL certificate is valid
- [ ] nginx root points to `dist` folder
- [ ] API proxy is configured (`/api/` → `localhost:5000`)
- [ ] SPA routing is configured (`try_files` directive)
- [ ] File permissions are correct
- [ ] Test API: `curl https://ntw234.xyz/api/allRankings`
- [ ] Test static files in browser
- [ ] Test React Router routes

## Quick Test Commands

```bash
# Test backend
curl http://localhost:5000/api/allRankings

# Test nginx config
sudo nginx -t

# Restart services
sudo systemctl restart nginx
pm2 restart recrd-api

# Check logs
sudo tail -f /var/log/nginx/error.log
pm2 logs recrd-api
```

