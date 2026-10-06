# Rakshak Securitas — Employee Onboarding System (EOMS)

Digital employee onboarding platform for Rakshak Securitas Pvt Ltd — employment forms, document uploads, L1/L2 approval, and ID card generation.

## Environment Setup

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Fill in **required** values in `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string with database name |
| `AUTH_SECRET` | Yes | Staff session secret (min 32 chars) |
| `EMPLOYEE_TOKEN_SECRET` | Yes | Employee portal JWT secret (min 32 chars) |
| `NEXTAUTH_URL` | Yes | App URL, e.g. `http://localhost:3000` |+
| `CLOUDINARY_CLOUD_NAME` | Yes* | For document uploads |
| `CLOUDINARY_API_KEY` | Yes* | For document uploads |
| `CLOUDINARY_API_SECRET` | Yes* | For document uploads |

\* Required when applicants upload documents in onboarding.

3. Verify MongoDB connection:

```bash
npm run db:check
```

4. Seed staff users:

```bash
npm run seed
```

5. Start the app:

```bash
npm run dev
```

Health check: `http://localhost:3000/api/health`

### MongoDB Atlas tips

- Include database name in URI: `...mongodb.net/onboarding_management?retryWrites=true&w=majority`
- URL-encode password special characters (`@` → `%40`)
- Add your IP in Atlas → **Network Access**

## Authentication

### Staff (L1, L2, Support)
- Login: `/staff/login` 
- Role-based dashboard access

### Employee Portal
- Register: `/apply` (linked from login page)
- Login: `/login` (Application Ref + Email + OTP)
- Application status: `/application`
- Employment form: `/onboarding/[ref]`

## Seed Credentials

submitter@rakshaksecuritas.com / Submit@123
Already existed (kept):
l1@rakshaksecuritas.com / L1Pass@123
l2@rakshaksecuritas.com / L2Pass@123
support@rakshaksecuritas.com / Support@123
comadmin@rakshaksecuritas.com / Admin@123


OTP is printed to the server console in development when email is not configured.





pm2 restart employee-onboarding-portal
