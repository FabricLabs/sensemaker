# Install Guide
## All Platforms
Sensemaker requires Node, MySQL, and Redis to run.

### Key Management
```
export FABRIC_SEED="some 24-word seed"
```

### Database Setup
```
sudo mysql
```

In the MySQL shell:
```
CREATE DATABASE db_sensemaker;
CREATE USER 'db_user_sensemaker'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON db_sensemaker.* TO 'db_user_sensemaker'@'localhost';
EXIT;
```

Install Knex, Seed Database
```
npm i -g knex # schema management tool
knex migrate:latest # create tables
knex seed:run # insert data
```

### Ollama
Ollama is a convenient API provider for LLM interactions.

```
./scripts/install-ollama.sh
./scripts/install-models.sh
```

Run dependencies with docker-compose (optional)
```
docker-compose up -d
```

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
