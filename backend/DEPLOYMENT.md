# Hostinger Backend Deployment Guide

## 🎯 Overview
This guide will help you migrate your Node.js backend from Render.com to Hostinger. The backend handles contact forms, referrals, admin dashboard, and email notifications.

## 📋 Prerequisites

### Required Hostinger Plan
You need **VPS hosting** or **Business hosting with Node.js support**. 
- ✅ **VPS Hosting** (Recommended) - Full control, PM2 support
- ✅ **Business Plan** - Node.js supported plans
- ❌ **Shared hosting** - Limited Node.js support

### What You'll Need
- Hostinger account with Node.js support
- SSH access to your server
- Domain: `api.keyswithog.com` (or subdomain of your choice)

---

## 🚀 Step-by-Step Deployment

### Step 1: Server Setup (Hostinger Side)

#### 1.1 Access Your Server
```bash
# SSH into your Hostinger server
ssh username@your-server-ip
```

#### 1.2 Install Node.js (if not installed)
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

#### 1.3 Create Application Directory
```bash
# Create directory for your backend
mkdir -p /var/www/keys-with-og-backend
cd /var/www/keys-with-og-backend
```

### Step 2: Upload Your Backend Files

#### Option A: Using Git (Recommended)
```bash
# Clone your repository
git clone https://github.com/your-username/your-repo.git .

# Or if you have the files locally, use SCP:
# scp -r /path/to/backend/* username@server-ip:/var/www/keys-with-og-backend/
```

#### Option B: Manual Upload
Use Hostinger's File Manager or FTP to upload all files from your local `backend/` folder to `/var/www/keys-with-og-backend/`

### Step 3: Install Dependencies
```bash
cd /var/www/keys-with-og-backend
npm ci --production
```

### Step 4: Environment Configuration

#### 4.1 Create Production Environment File
```bash
# Copy the production template
cp .env.production .env

# Or create .env file with:
nano .env
```

#### 4.2 Verify Environment Variables
Ensure your `.env` file contains:
```env
DATABASE_URL=postgresql://username:password@your-neon-db-url/dbname?sslmode=require
GMAIL_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
ADMIN_PASSWORD=your-secure-admin-password
NODE_ENV=production
PORT=3000
```

### Step 5: Start the Application

#### 5.1 Test the Application
```bash
# Test run to ensure everything works
npm start
# Press Ctrl+C to stop after testing
```

#### 5.2 Start with PM2
```bash
# Start with PM2 using ecosystem config
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs keys-with-og-backend

# Save PM2 configuration
pm2 save

# Enable PM2 startup on server reboot
pm2 startup
# Follow the instructions provided by PM2
```

### Step 6: Domain Configuration

#### 6.1 Set Up Subdomain
In Hostinger Control Panel:
1. Go to **DNS Zone Editor**
2. Add A record: `api` → Your server IP
3. Wait for DNS propagation (5-30 minutes)

#### 6.2 Configure SSL Certificate
```bash
# Install Certbot (if not installed)
sudo apt update
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d api.keyswithog.com
```

#### 6.3 Configure Nginx (if using reverse proxy)
Create `/etc/nginx/sites-available/api.keyswithog.com`:
```nginx
server {
    listen 80;
    server_name api.keyswithog.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.keyswithog.com;
    
    ssl_certificate /etc/letsencrypt/live/api.keyswithog.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.keyswithog.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/api.keyswithog.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Testing Your Deployment

### Backend Health Check
```bash
# Test the health endpoint
curl https://api.keyswithog.com/health

# Expected response:
# {"status":"ok","message":"Keys with OG Backend is running","timestamp":"2024-..."}
```

### Frontend Integration Test
1. Visit your website: `https://darkgreen-cassowary-344122.hostingersite.com`
2. Test contact form submission
3. Test referral code generation
4. Test admin login with password `1234`

### Admin Dashboard Access
1. Click admin button in website footer
2. Enter password: `1234`
3. Verify redirect to: `https://api.keyswithog.com/admin/dashboard?password=1234`

---

## 🔧 Management Commands

### PM2 Process Management
```bash
# View status
pm2 status

# View logs
pm2 logs keys-with-og-backend

# Restart application
pm2 restart keys-with-og-backend

# Stop application
pm2 stop keys-with-og-backend

# View detailed info
pm2 info keys-with-og-backend

# Monitor resources
pm2 monit
```

### Log Management
```bash
# View PM2 logs
pm2 logs --lines 100

# Clear logs
pm2 flush

# View application logs
tail -f /var/www/keys-with-og-backend/logs/pm2-combined.log
```

---

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process if needed
sudo kill -9 PID_NUMBER
```

#### Database Connection Issues
```bash
# Test database connection
node -e "const { Client } = require('pg'); const client = new Client(process.env.DATABASE_URL); client.connect().then(() => console.log('DB OK')).catch(console.error);"
```

#### Environment Variables Not Loaded
```bash
# Check if .env file exists and is readable
ls -la .env
cat .env

# Restart PM2 to reload environment
pm2 restart keys-with-og-backend
```

#### SSL Certificate Issues
```bash
# Renew SSL certificate
sudo certbot renew

# Test certificate
curl -I https://api.keyswithog.com
```

### PM2 Won't Start
```bash
# Delete PM2 process and restart
pm2 delete keys-with-og-backend
pm2 start ecosystem.config.js

# Check PM2 logs for errors
pm2 logs
```

---

## 📊 Monitoring & Maintenance

### Health Monitoring
Set up a simple health check:
```bash
# Add to crontab for basic monitoring
crontab -e

# Add this line to check every 5 minutes:
*/5 * * * * curl -f https://api.keyswithog.com/health || echo "Backend down" | mail -s "Backend Alert" your-email@example.com
```

### Log Rotation
```bash
# PM2 handles log rotation automatically, but you can configure it:
pm2 install pm2-logrotate
```

### Performance Monitoring
```bash
# View resource usage
pm2 monit

# System resource usage
htop
```

---

## 🔄 Rollback Plan

If something goes wrong, you can quickly rollback:

### Quick Rollback
1. Update DNS: Change `api.keyswithog.com` back to Render IP
2. Update frontend: Change API URLs back to `keys-with-og-backend.onrender.com`
3. Redeploy frontend to Hostinger

### Emergency Contact
- Keep Render deployment active for 30 days as backup
- Database (Neon) remains unchanged during rollback

---

## 🎉 Success Checklist

- [ ] Node.js backend running on Hostinger
- [ ] PM2 managing the process
- [ ] SSL certificate installed and working
- [ ] Domain `api.keyswithog.com` resolving correctly
- [ ] Health endpoint responding: `https://api.keyswithog.com/health`
- [ ] Contact form submissions working
- [ ] Email notifications being sent
- [ ] Referral system generating codes
- [ ] Admin login working with password `1234`
- [ ] Admin dashboard accessible and functional

## 💡 Next Steps After Migration

1. **Security**: Change admin password from `1234` to something more secure
2. **Email**: Switch from Mailtrap to production Gmail for live notifications
3. **Monitoring**: Set up proper monitoring and alerting
4. **Backup**: Configure regular database backups (Neon handles this automatically)
5. **Performance**: Monitor response times and optimize as needed

---

## 📞 Support

If you encounter issues during deployment:
1. Check PM2 logs: `pm2 logs keys-with-og-backend`
2. Verify environment variables in `.env`
3. Test database connectivity
4. Check firewall and DNS settings
5. Ensure SSL certificate is valid

The migration consolidates your hosting, fixes the admin password sync issue, and gives you better control over your backend infrastructure!
