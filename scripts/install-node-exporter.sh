#!/bin/bash

VERSION=1.7.0

# check if user is root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# Download binary
echo "[+] Downloading Node Exporter v$VERSION"
(cd /tmp && curl -OL https://github.com/prometheus/node_exporter/releases/download/v$VERSION/node_exporter-$VERSION.linux-amd64.tar.gz)

# Unzip 
echo "[+] Unzipping tar"
(cd /tmp && tar -xvf /tmp/node_exporter-$VERSION.linux-amd64.tar.gz)

# Create user and group for node exporter
echo "[+] Creating user: node_exporter"
useradd -m node_exporter
echo "[+] Creating group: node_exporter"
groupadd node_exporter
echo "[+] Adding node_exporter user to group node_exporter"
usermod -a -G node_exporter node_exporter

# Move binary and set file permissions
echo "[+] Copy binary to /usr/local/bin"
mv /tmp/node_exporter-$VERSION.linux-amd64/node_exporter /usr/local/bin/
chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Create systemd service file
echo "[+] Creating systemd service"
sudo bash -c 'cat <<EOF > /etc/systemd/system/node_exporter.service
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF'

# Start systemd daemon
echo "[+] Starting systemd service"
systemctl daemon-reload
systemctl start node_exporter

# Cleanup files
echo "[-] Cleaning up files..."
rm /tmp/node_exporter-$VERSION.linux-amd64.tar.gz
rm -rf /tmp/node_exporter-$VERSION.linux-amd64

echo "[!] Node Exporter is now running on port 9100"
