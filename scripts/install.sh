#!/bin/bash
# Run in your home folder.

# Check script is run with sudo
if [[ $EUID -ne 0 ]]; then
  echo "This script must be run with sudo or as root"
  exit 1
fi

echo "Installing the Fabric Node"
echo "=========================="

echo "Provide the source repository for your project:"
read GIT_URL

echo "Specify the target directory name:"
read TARGET_DIRECTORY

# Begin Installation
echo "> cloning repository..."
git clone --recurse-submodules "$GIT_URL" "$TARGET_DIRECTORY"

echo "> installing project dependencies..."
cd "$TARGET_DIRECTORY"

# NVM
cat scripts/nvm/install.sh | bash
nvm install 16.17.1
npm i -g pm2 vtop

# Node
npm install

# Report to User
echo "All done!  Now run the following to start your node:"
echo "  pm2 start scripts/node.js"
