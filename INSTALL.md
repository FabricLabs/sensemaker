# Install Guide
## All Platforms
Sensemaker requires Node, MySQL, Redis, and Ollama to run.  Install scripts are included in the `scripts/` directory, including `install.sh` to automate installation on a compatible system.

**Windows Users:** there is a known issue installing the TensorFlow dependency: https://github.com/tensorflow/tfjs/issues/7341

### Database Setup
MySQL is used as a reliable database for Sensemaker.

Open shell:
```bash
sudo mysql
```

In the MySQL shell:
```sql
CREATE DATABASE db_sensemaker;
CREATE USER 'db_user_sensemaker'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON db_sensemaker.* TO 'db_user_sensemaker'@'localhost';
EXIT;
```
Be sure to set a password in the commands above.

#### Knex
Knex is used to manage database schemas.

Install `knex`:
```bash
npm i -g knex # schema management tool
knex migrate:latest # create tables
knex seed:run # initial data
```

### Running next to Fabric Hub
If **Hub** (or any other managed regtest `bitcoind`) is already running, Sensemaker’s embedded regtest will fail to bind ports. By default **managed regtest is off** locally. To turn it on (e.g. isolated machine or Docker), set **`BITCOIN_REGTEST=1`** or **`SENSEMAKER_REGTEST=1`**. Docker Compose sets this for the `app` service automatically.

### Local email (Mailpit)
Waitlist confirmations and password-reset messages use **`services/email.js`**. For development, run **[Mailpit](https://github.com/axllent/mailpit)** (SMTP + web UI):

```bash
# Homebrew
brew install mailpit && mailpit

# Or: binary / Docker — see Mailpit docs. Defaults: SMTP :1025, UI :8025
```

`settings/local.js` defaults to **`127.0.0.1:1025`** when **`SENSEMAKER_EMAIL_TRANSPORT`** is not set to `postmark`. Open **http://127.0.0.1:8025** to read captured mail.

Environment overrides:

| Variable | Purpose |
|----------|---------|
| `SENSEMAKER_EMAIL_ENABLE=0` | Disable outbound email |
| `SENSEMAKER_SMTP_HOST` / `SENSEMAKER_SMTP_PORT` | SMTP server (default `127.0.0.1` / `1025`) |
| `SENSEMAKER_EMAIL_TRANSPORT=postmark` | Use Postmark; set **`POSTMARK_SERVER_TOKEN`** |
| `SENSEMAKER_BASE_URL` | Origin in emailed links (default `http://127.0.0.1:3040`) |

After joining the waitlist in the browser, you should see a confirmation message in Mailpit.

#### Register an account (waitlist → invitation → signup)

Accounts are created from an **invitation** email. The waitlist only collects email; an **admin** must invite that address, which sends mail through Mailpit.

1. **Mailpit** — SMTP `127.0.0.1:1025`, web UI [http://127.0.0.1:8025](http://127.0.0.1:8025).
2. **Database** — `npm run migrate:database` and `npm run setup:seed` (creates `Administrator` / `root@localhost` with no password).
3. **Admin password (dev)** — `npm run bootstrap:dev-admin`  
   Optional: `SENSEMAKER_DEV_ADMIN_PASSWORD='your-secret' npm run bootstrap:dev-admin`  
   Default password is `changeme` if the variable is unset.
4. **Start Sensemaker** — ensure email is enabled (default in `settings/local.js`; set `SENSEMAKER_EMAIL_ENABLE=0` only to disable).
5. **Waitlist** — In the app, open [http://127.0.0.1:3040/inquiries](http://127.0.0.1:3040/inquiries) and submit the email you will use for the new account. Confirm the **waitlist** message appears in Mailpit.
6. **Log in as admin** — [http://127.0.0.1:3040/sessions](http://127.0.0.1:3040/sessions) as `Administrator` with the password from step 3.
7. **Send invitation** — From **Admin → Users** (or equivalent), invite that same email, **or** with a session token from `POST /sessions`:

```bash
TOKEN="$(curl -s -X POST http://127.0.0.1:3040/sessions \
  -H 'Content-Type: application/json' \
  -d '{"username":"Administrator","password":"changeme"}' | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).token")"

curl -s -X POST http://127.0.0.1:3040/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com"}'
```

Use the same address you put on the waitlist (`inquiries.status` must become `invited`).

8. **Open the invitation in Mailpit** — Use the **accept** link (`/invitations/<fabric_id>?action=accept&token=...`) to complete **Sign up**.

`SENSEMAKER_BASE_URL` (default `http://127.0.0.1:3040`) must match how you open the app so links in Mailpit are correct.

### Ollama
Ollama is a convenient API provider for LLM interactions.

Run the install scripts:
```bash
./scripts/install-ollama.sh
./scripts/install-models.sh
```
Other models can be installed using `ollama pull <model-name>` and configured in `settings/local.js` in the `ollama` property.

## Debian/Ubuntu
```
ssh-keygen -t ed25519
cat ~/.ssh/id_25519.pub
sudo apt install git libpixman-1-dev libcairo2-dev libsdl-pango-dev libgif-dev mysql-server
git clone git@github.com:FabricLabs/sensemaker.git
cd sensemaker
./scripts/install-ollama.sh
./scripts/install-models.sh
./scripts/nvm/install.sh
nvm i 22.14.0
```

### Redis Stack
```
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis-stack-server
sudo systemctl enable redis-stack-server
sudo systemctl start redis-stack-server
```

### MySQL
```
sudo apt install mysql-server
sudo systemctl enable mysql-server
sudo systemctl start mysql-server
```

### Filesystem
```
sudo mkdir -p /media/storage/node/files
```

## MacOS
- Homebrew
- NVM: `./scripts/nvm/install.sh`
- Node: `nvm install 22.14.0` (double-check documentation)
- `brew install python3 pkg-config pixman cairo pango`
- `ssh-keygen -t ed25519`
- PUPPETEER_SKIP_DOWNLOAD=true npm run report:install
- brew tap redis-stack/redis-stack

Setup
```bash
git clone git@github.com:FabricLabs/sensemaker.git
cd sensemaker
PUPPETEER_SKIP_DOWNLOAD=true npm run report:install
```
