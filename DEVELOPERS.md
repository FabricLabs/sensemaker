# Developers
...should read "A CypherPunk's Manifesto" by Timothy May.

## Quick Start
See `scripts/` for a list of available tools.

### Install
#### Debian/Ubuntu
```
ssh-keygen -t ed25519
cat ~/.ssh/id_25519.pub
sudo apt install git libpixman-1-dev libcairo2-dev libsdl-pango-dev libgif-dev
git clone git@github.com:lttinc/jeeves.dev.git
cd jeeves.dev
./scripts/install-ollama.sh
./scripts/install-models.sh
./scripts/nvm/install.sh
nvm i 18.19
```

#### Redis Stack
```
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis-stack-server
sudo systemctl enable redis-stack-server
sudo systemctl start redis-stack-server
```

##### MySQL
```
sudo apt install mysql-server
sudo systemctl enable mysql-server
sudo systemctl start mysql-server
```

##### Files
```
sudo mkdir -p /media/storage/node/files
```

#### MacOS
- Homebrew
- NVM: `./scripts/nvm/install.sh`
- Node: `nvm install 18.19.0` (double-check documentation)
- `brew install python3 pkg-config pixman cairo pango`
- `ssh-keygen -t ed25519`
- PUPPETEER_SKIP_DOWNLOAD=true npm run report:install
- brew tap redis-stack/redis-stack

Setup
```bash
git clone git@github.com:lttinc/jeeves.dev.git
cd jeeves.dev
PUPPETEER_SKIP_DOWNLOAD=true npm run report:install
```

Database Setup
```
sudo mysql
```

In the MySQL shell:
```
CREATE DATABASE db_jeeves;
CREATE USER 'db_user_jeeves'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON db_jeeves.* TO 'db_user_jeeves'@'localhost';
EXIT;
```

Install Knex, Seed Database
```
npm i -g knex # schema management tool
knex migrate:latest # create tables
knex seed:run # insert data
```

Ollama
```
./scripts/install-ollama.sh
./scripts/install-models.sh
```

Run dependencies with docker-compose (optional)
```
docker-compose up -d
```

## Principles
1. Pull Requests should be the smallest possible set of changes implementing the desired feature.

## Overview
- Coordinator: the Node.js master process
  - HTTPServer
  - FabricNode
  - LangChain
- Agents: connect to external networks
  - Fabric
  - Matrix
  - ChatGPT
  - PyTorch HTTP Client
- Services: provided an HTTP API
  - PyTorch

## Python Environment
`source .env/bin/activate`

See also `requirements.txt`

## Tips
- You can use `scripts/node.js` to quickly run the service without building: `node scripts/node.js`
- Use `nodemon` to monitor for changes: `nodemon scripts/node.js`
- Re-build UI when necessary: `npm run build`
- Re-build semantic styling (CSS) when necessary: `npm run build:semantic`

You can pass `webpack` configuration options in `types/compiler.js` to tweak various settings, such as live reloading.

All other configuration options for your local node live in `settings/local.js` — some important settings include:

- `email` — configures email settings
  - `enable` — boolean (true or false)
  - `host` — hostname for outbound email
