# Keys with OG Backend Setup Guide

Welcome! You now have a complete backend for your website. This guide walks you through setting everything up.

## 📋 Prerequisites

Before you start, make sure you have:

1. **Node.js** (v14+) - Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL** - Download from [postgresql.org](https://www.postgresql.org/download/) or use a cloud service
3. **Gmail Account** - For sending confirmation emails
4. **Claude API Key** - Get one from [console.anthropic.com](https://console.anthropic.com/)

## 🚀 Quick Start (5 steps)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your values:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/keys_with_og
   GMAIL_EMAIL=your-email@gmail.com
   GMAIL_PASSWORD=your-gmail-app-password
   ADMIN_PASSWORD=chooseAStrongPassword
   PORT=5000
   NODE_ENV=development
   ```

### Step 3: Set Up PostgreSQL Database

**Option A: Local PostgreSQL**

```bash
# Create database
createdb keys_with_og

# The backend will automatically create tables on first run
```

**Option B: Cloud PostgreSQL** (recommended for production)

- Use [ElephantSQL](https://www.elephantsql.com/) (free tier available)
- Copy the connection URL to your `.env` as `DATABASE_URL`

### Step 4: Get Gmail App Password

1. Enable 2-Factor Authentication on your Gmail account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer"
4. Copy the generated password to `.env` as `GMAIL_PASSWORD`

### Step 5: Start the Backend

```bash
npm run dev
```

You should see:
```
✅ Database initialized
🚀 Keys with OG Backend running on http://localhost:5000
📊 Admin Dashboard: http://localhost:5000/admin/dashboard?password=yourPassword
📡 API Base: http://localhost:5000/api
```

## ✅ Testing the Backend

### Test 1: Check Health

Visit: http://localhost:5000/health

Should return: `{ "status": "ok", ... }`

### Test 2: Test Contact Form Submission

```bash
curl -X POST http://localhost:5000/api/submit-contact \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "(210) 555-0100",
    "email": "john@example.com",
    "interest": "Chevrolet Silverado",
    "credit_situation": "Good credit",
    "message": "Interested in the truck"
  }'
```

### Test 3: Generate Referral Code

```bash
curl -X POST http://localhost:5000/api/generate-referral \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com"
  }'
```

### Test 4: Access Admin Dashboard

Visit: http://localhost:5000/admin/dashboard?password=yourAdminPassword

## 🔧 Important Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/keys_with_og` |
| `GMAIL_EMAIL` | Email to send from | `oscar@gmail.com` |
| `GMAIL_PASSWORD` | Gmail app password | `xxxx xxxx xxxx xxxx` |
| `ADMIN_PASSWORD` | Admin dashboard password | `chooseAStrongPassword` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |

## 📊 Admin Dashboard

Once the backend is running, access the admin dashboard:

**URL**: `http://localhost:5000/admin/dashboard?password=YOUR_ADMIN_PASSWORD`

**Features**:
- View all contact submissions
- See referral codes and stats
- Add notes to submissions

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is running: `psql --version`
- For local: `createdb keys_with_og`

### "Gmail sending failed"
- Use Gmail app password, NOT your regular password
- Enable 2FA on your Gmail account
- Get app password from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### "Backend not connecting from frontend"
- Make sure backend is running: `npm run dev`
- Check CORS settings in `server.js`
- If frontend is on different domain, update CORS origins


### "Referral code generation failed"
- Check backend is running
- Verify email format in the request
- Check backend logs for errors

## 📱 Frontend Integration

Your `index.html` has been updated to use the backend API:

**Contact Form**: `POST /api/submit-contact`
```javascript
{
  first_name, last_name, phone, email,
  interest, credit_situation, message,
  referral_code
}
```

**Referral Code**: `POST /api/generate-referral`
```javascript
{ first_name, last_name, email }
```

## 🌐 API Endpoints

### Public Endpoints (no password needed)

```
GET  /health                      - Health check
POST /api/submit-contact          - Submit contact form
POST /api/generate-referral       - Generate referral code
GET  /api/referral/:code          - Get referral details
```

### Admin Endpoints (requires password in query/header)

```
GET  /admin/dashboard?password=XXX         - Admin dashboard
GET  /admin/api/submissions?password=XXX   - List submissions
GET  /admin/api/referrals?password=XXX     - List referrals
GET  /admin/api/referrals/:code/submissions - List referral submissions
POST /admin/api/referral-submissions/:id/validate - Mark submission validated
POST /admin/api/referral-submissions/:id/unvalidate - Mark submission unvalidated
PUT  /admin/api/referral-submissions/:id/notes - Update submission notes/payout
```

## 🚢 Deployment (Later)

When ready to deploy:

1. Push code to GitHub
2. Deploy to [Render](https://render.com/) or [Railway](https://railway.app/) (free tier available)
3. Set environment variables on hosting platform
4. Use cloud PostgreSQL ([ElephantSQL](https://www.elephantsql.com/))
5. Update frontend API URLs from `localhost:5000` to your deployed URL

## 📞 Support

If you run into issues:

1. Check the backend logs in your terminal
2. Visit `/health` endpoint to verify backend is running
3. Check `.env` file for missing variables
4. Verify your PostgreSQL and Gmail credentials

## 🎉 You're Ready!

Your backend is now running. The frontend will automatically:
- Send contact form submissions to your database
- Generate email-linked referral codes
- Send confirmation emails to customers

Oscar can access the admin dashboard to manage everything!
