# Shelter of Light — Setup Guide

Follow these steps to run the project locally on any machine.

## 1. Requirements
- **XAMPP** (Apache + MySQL/MariaDB) — https://www.apachefriends.org
- A web browser

## 2. Put the project in your web root
Clone or copy this repo into XAMPP's `htdocs` folder, e.g.:
```
C:\xampp\htdocs\shelteroflight_v3
```

## 3. Start the servers
Open the **XAMPP Control Panel** and click **Start** on:
- **Apache**
- **MySQL** (if you have another MySQL already running on port 3306, use that one instead)

## 4. Create the database
1. Open **phpMyAdmin**: http://localhost/phpmyadmin
2. Click the **Import** tab.
3. Choose the file **`backend/setup.sql`** from this project.
4. Click **Go**.

This creates the `shelter_of_light` database, all tables, sample rescues, and the default admin account.

## 5. Set your database password
Open **`backend/db_connect.php`** and set the two values to match YOUR MySQL:
```php
define('DB_USER', 'root');   // your MySQL username (usually 'root')
define('DB_PASS', '');       // your MySQL password
```
- **Default XAMPP MySQL:** username `root`, password **empty** (`''`).
- **If your MySQL root has a password** (some installs use `root`), put it here.
- If your MySQL runs on a different host/port, also update `DB_HOST`.

> Each person sets this to their own MySQL password — it is intentionally not committed.

## 6. Open the app
```
http://localhost/shelteroflight_v3/frontend/user/login.html
```

## 7. Log in as admin
| Username | Password |
|----------|----------------|
| `admin`  | `Admin@SoL2026!` |

Admins land on the dashboard; you can manage rescues, donations, applications, and medical records from there.

## Troubleshooting
- **"A database error occurred"** → `db_connect.php` has the wrong username/password, or the `shelter_of_light` database wasn't imported. Re-check steps 4–5, then **restart Apache** so it reloads the file.
- **404 / page not found** → make sure the project folder under `htdocs` matches the URL (`shelteroflight_v3`), and that Apache is started.
- **Two MySQL servers** → only one can use port 3306. Make sure the database from step 4 lives on the server your `db_connect.php` points to.
