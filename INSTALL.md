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
nvm i 18.19.1
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
- Node: `nvm install 18.19.1` (double-check documentation)
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
