#!/bin/bash

VERSION=1.7.0

# check if user is root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# Download binary
(cd /tmp && curl -OL https://github.com/prometheus/node_exporter/releases/download/$VERSION/node_exporter-$VERSION.linux-amd64.tar.gz)

# Unzip 
(cd /tmp && tar -xvf /tmp/node_exporter-1.2.2.linux-amd64.tar.gz)

# Create user and group for node exporter
useradd -m node_exporter
groupadd node_exporter
usermod -a -G node_exporter node_exporter

# Move binary and set file permissions
mv /tmp/node_exporter-${VERSION}.linux-amd64/node_exporter /usr/local/bin/
chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Create systemd service file
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
systemctl daemon-reload
systemctl start node_exporter
