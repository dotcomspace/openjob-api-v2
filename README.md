# OpenJob RESTful API - Version 2

## Deskripsi
Versi 2 dari OpenJob RESTful API dengan fitur tambahan:
- **Kriteria 1**: Upload PDF (multer, validasi ukuran & MIME type, serve file)
- **Kriteria 2**: Caching dengan Redis (TTL 1 jam, X-Data-Source header, cache invalidation)
- **Kriteria 3**: Message Queue RabbitMQ + Notifikasi Email (Nodemailer)

---

## Cara Menjalankan

### 1. Persiapan

```bash
npm install
```

### 2. Setup Environment
Salin dan sesuaikan file `.env`:
```env
HOST=localhost
PORT=3000

PGUSER=postgres
PGPASSWORD=12345
PGDATABASE=openjob_api
PGHOST=localhost
PGPORT=5432

ACCESS_TOKEN_KEY=kunci_rahasia_bebas_apa_saja
REFRESH_TOKEN_KEY=kunci_rahasia_bebas_juga

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# Nodemailer
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

### 3. Jalankan Migrasi Database
```bash
npm run migrate up
```

### 4. Jalankan Server Utama
```bash
node server.js
# atau untuk development:
npm run start:dev
```

### 5. Jalankan Consumer (Terminal Terpisah)
```bash
node consumer.js
# atau:
npm run start:consumer
```

---

## Layanan Eksternal yang Diperlukan

| Layanan     | Default Port | Keterangan                    |
|-------------|-------------|-------------------------------|
| PostgreSQL  | 5432        | Database utama                |
| Redis       | 6379        | Caching                       |
| RabbitMQ    | 5672        | Message Queue                 |

### Install Redis (lokal):
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo service redis-server start

# macOS
brew install redis
brew services start redis
```

### Install RabbitMQ (lokal):
```bash
# Ubuntu/Debian
sudo apt install rabbitmq-server
sudo service rabbitmq-server start

# macOS
brew install rabbitmq
brew services start rabbitmq
```

---

## Endpoint API

### Documents (Kriteria 1 - Upload PDF)
| Method | Endpoint                    | Deskripsi              | Auth |
|--------|-----------------------------|------------------------|------|
| POST   | /documents                  | Upload file PDF        | ✅   |
| GET    | /documents                  | List dokumen milik user| ✅   |
| GET    | /documents/:id              | Detail dokumen         | ✅   |
| GET    | /documents/files/:filename  | Tampilkan/download PDF | ❌   |
| DELETE | /documents/:id              | Hapus dokumen          | ✅   |

### Users
| Method | Endpoint    | Deskripsi           | Cache |
|--------|-------------|---------------------|-------|
| POST   | /users      | Registrasi user     | -     |
| GET    | /users/:id  | Detail user         | ✅ 1jam |
| PUT    | /users/:id  | Update user         | Invalidate |

### Companies
| Method | Endpoint        | Deskripsi             | Cache |
|--------|-----------------|-----------------------|-------|
| GET    | /companies/:id  | Detail perusahaan     | ✅ 1jam |
| PUT    | /companies/:id  | Update perusahaan     | Invalidate |
| DELETE | /companies/:id  | Hapus perusahaan      | Invalidate |

### Applications
| Method | Endpoint                       | Cache |
|--------|--------------------------------|-------|
| POST   | /applications                  | Publish RabbitMQ + Invalidate |
| GET    | /applications/:id              | ✅ 1jam |
| GET    | /applications/user/:userId     | ✅ 1jam |
| GET    | /applications/job/:jobId       | ✅ 1jam |
| PUT    | /applications/:id              | Invalidate |

### Bookmarks
| Method | Endpoint                  | Cache |
|--------|---------------------------|-------|
| GET    | /bookmarks                | ✅ 1jam |
| POST   | /jobs/:jobId/bookmarks    | Invalidate |
| DELETE | /jobs/:jobId/bookmarks    | Invalidate |

---

## Fitur Caching (Kriteria 2)

- Semua cache tersimpan di Redis dengan **TTL 1 jam**
- Jika data berasal dari cache, response akan memiliki header:
  ```
  X-Data-Source: cache
  ```
- Cache diinvalidate otomatis saat ada perubahan data terkait

---

## Alur RabbitMQ + Email (Kriteria 3)

1. Kandidat membuat lamaran → `POST /applications`
2. Server mempublikasikan pesan `{ application_id }` ke queue `application_notifications`
3. Consumer (`consumer.js`) membaca pesan dari queue
4. Consumer query ke DB: ambil data pelamar + pemilik job
5. Consumer kirim email notifikasi ke pemilik job via Nodemailer

---

## Cara Upload PDF di Postman

1. Buka request `POST /documents`
2. Tambahkan Authorization header: `Bearer <access_token>`
3. Pilih tab **Body** → **form-data**
4. Tambahkan key `file`, pilih type **File**
5. Upload file PDF (maks. 5 MB)
6. Klik Send

