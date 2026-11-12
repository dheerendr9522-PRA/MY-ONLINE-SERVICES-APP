# 🚀 स्थायी डिप्लॉयमेंट गाइड — Dheerendra Digital Seva Kendra

यह ऐप **Next.js (App Router) + PostgreSQL (Drizzle ORM)** पर बना पूर्ण फुल-स्टैक सिस्टम है।
नीचे हिंदी में हर तरीका दिया गया है — Vercel + Neon, VPS, Docker और Play Store (TWA)।

---

## 1️⃣ Vercel + Neon PostgreSQL (सबसे आसान व सस्ता)

1. [neon.tech](https://neon.tech) पर खाता बनाएँ → नया Project → `app_db` डेटाबेस बनाएँ।
2. **Connection String** कॉपी करें (ऐसा दिखेगा: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)।
3. GitHub पर यह प्रोजेक्ट पुश करें।
4. [vercel.com/new](https://vercel.com/new) पर रिपॉज़िटरी इम्पोर्ट करें।
5. **Environment Variables** में जोड़ें:
   - `DATABASE_URL` = Neon का connection string
   - `AUTH_SECRET` = कोई लंबा रैंडम स्ट्रिंग
   - (वैकल्पिक) `GOOGLE_SHEETS_WEBHOOK_URL`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID`
6. Deploy दबाएँ। पहली बार `/api/health` खोलने पर डेटाबेस टेबल्स व सारा डेमो डेटा (सेवाएँ, वेबसाइट, डेमो आवेदन) अपने आप सीड हो जाता है।
7. अपना डोमेन जोड़ें (जैसे `dheerendradigital.in`) → Settings → Domains।
8. Google Search Console में verification के लिए `public/google5bba588b830c7890.html` पहले से मौजूद है।

> ⚠️ स्कीमा बदलने पर: `npx drizzle-kit push` (स्थानीय `.env` में production `DATABASE_URL` डालकर) चलाएँ।

---

## 2️⃣ VPS (Hostinger / DigitalOcean / Contabo) — Ubuntu 22.04

```bash
# 1. सर्वर तैयार करें
sudo apt update && sudo apt install -y nodejs npm nginx postgresql certbot python3-certbot-nginx
sudo -u postgres psql -c "CREATE DATABASE app_db;"
sudo -u postgres psql -c "CREATE USER seva WITH PASSWORD 'strong-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE app_db TO seva;"

# 2. कोड लगाएँ
git clone <your-repo> /var/www/seva && cd /var/www/seva
cp .env.example .env  # या खुद बनाएँ
nano .env             # DATABASE_URL, AUTH_SECRET
npm install
npx drizzle-kit push
npm run build
PORT=3000 npm run start &     # पहली बार परखें

# 3. pm2 से हमेशा चलाएँ
sudo npm i -g pm2
pm2 start npm --name seva -- run start
pm2 save && pm2 startup
```

**Nginx रिवर्स प्रॉक्सी** (`/etc/nginx/sites-available/seva`):

```nginx
server {
  listen 80;
  server_name yourdomain.in www.yourdomain.in;
  client_max_body_size 20M;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/seva /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.in -d www.yourdomain.in
```

---

## 3️⃣ Docker / Docker Compose

`Dockerfile`:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

`docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_db
    volumes: [pgdata:/var/lib/postgresql/data]
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/app_db
      AUTH_SECRET: change-me
    depends_on: [db]
volumes:
  pgdata:
```

```bash
docker compose up -d --build
docker compose exec app npx drizzle-kit push
```

---

## 4️⃣ Play Store पर मोबाइल ऐप (TWA — Trusted Web Activity)

1. PWA पहले से तैयार है (`manifest.webmanifest`, `sw.js`, icons, standalone display)।
2. [pwabuilder.com](https://www.pwabuilder.com) पर अपना लाइव URL डालें → **Android** पैकेज डाउनलोड करें।
3. वही फाइल [Google Play Console](https://play.google.com/console) में अपलोड करें (one-time $25 शुल्क)।
4. `assetlinks.json` प्लेटफॉर्म से मिले SHA-256 fingerprint के साथ `public/.well-known/` में रखें।
5. Store listing: नाम **DP Digital Seva**, श्रेणी Business, स्क्रीनशॉट व विवरण हिंदी में।

---

## 🔐 लॉगिन व सुरक्षा

| खाता | ID / मोबाइल | पासवर्ड / पिन |
|---|---|---|
| Owner | `dheerendra` | `Dheeru@2026` |
| Manager | `manager` | `Manager@2026` |
| Operator | `operator` | `Shop@2026` |
| ग्राहक | कोई भी 10-अंक मोबाइल | `1234` |
| डेमो ट्रैकिंग | `DP-R2001` | मोबाइल `9425012345` |

- पहला काम: `/admin/users` से तीनों पासवर्ड बदलें और `/admin/settings` से Owner Access Key बदलें।
- `AUTH_SECRET` बदलने पर सभी पुराने सेशन लॉगआउट हो जाते हैं।
- सभी बदलाव `audit_logs` टेबल में दर्ज होते हैं।

## 📊 Google Sheet ऑटो-सिंक

**विकल्प A — IMPORTDATA (सबसे तेज़):** Google Sheet में लिखें
`=IMPORTDATA("https://your-domain/exports/applications.csv")`

**विकल्प B — Apps Script Webhook:**
1. Google Sheet → Extensions → Apps Script
2. `doPost(e){ SpreadsheetApp.getActive().getSheets()[0].appendRow(Object.values(JSON.parse(e.postData.contents))); return ContentService.createTextOutput("ok"); }`
3. Deploy → Web app → Anyone. URL को `GOOGLE_SHEETS_WEBHOOK_URL` में रखें।

**विकल्प C — Service Account (अनुशंसित, ऐप के 📊 गूगल शीट पेज से सीधा सिंक):**
```
GOOGLE_SHEET_ID=आपकी-शीट-आईडी
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxx@yyyy.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```
फिर `/admin/sheets` खोलें → "सब कुछ भेजें" दबाएँ। यह 8 शीट्स (ग्राहक, सेवा अनुरोध, रिपेयर, इनवॉइस, खर्च, दस्तावेज़, पूर्ण कार्य, सेवा सूची) बनाकर/साफ़ करके ताज़ा लिखता है, और नया रिकॉर्ड बनते ही अपने-आप भी जुड़ता है।
(पुराने नाम `GOOGLE_CLIENT_EMAIL` / `GOOGLE_SHEETS_SPREADSHEET_ID` भी समर्थित हैं।)

## 🔄 बैकअप

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
```
हर हफ्ते बैकअप लें। अपलोड फाइलें डेटाबेस (`files` टेबल) में सुरक्षित हैं, इसलिए `pg_dump` में ही आ जाती हैं।
