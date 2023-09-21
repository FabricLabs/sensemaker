#!/bin/bash
# Run in your home folder, from the repository root.

# Check script is run with sudo
if [[ $EUID -ne 0 ]]; then
  echo "This script must be run with sudo or as root"
  exit 1
fi

# Begin Setup
echo "Fabric Host Setup"
echo "================="
echo "What shall this host be called?"
read HOSTNAME

hostname "$HOSTNAME"
echo "$HOSTNAME" > /etc/hostname

## Read Variables
echo "Your Username:"
echo "* use lower case letters only"
read USERNAME

# Create User
echo -e '**Create '$USERNAME' Account**\n\n'
adduser "$USERNAME"

# Add User to `sudo`` Group
usermod -aG sudo "$USERNAME"

# Get public SSH key
echo "On your local system generate an ssh key pair using ed25519"
echo "command: ssh-keygen -b 512 -t ed25519"
echo "Enter you public key:"
read PUBKEY

su -c "mkdir -m700 /home/$USERNAME/.ssh" -m $USERNAME
su -c "(umask 077; touch /home/$USERNAME/.ssh/authorized_keys)" -m $USERNAME
echo "$PUBKEY" >> /home/$USERNAME/.ssh/authorized_keys

# Prerequisite Packages
apt -o Acquire::https::AllowRedirect=false update
apt -o Acquire::https::AllowRedirect=false upgrade -y
apt -o Acquire::https::AllowRedirect=false install -y build-essential curl git iptables iptables-persistent jq nginx tor unzip vim mysql-server

# Default all firewalls to policy: DROP
iptables -P INPUT DROP
iptables -P OUTPUT DROP
iptables -P FORWARD DROP

# Allow RELATED/ESTABLISHED traffic
iptables -A OUTPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
iptables -A INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 22 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT

# Allow outbound DNS traffic
# TODO: consider running local DNS to resolve both IPv4 and Onion addresses
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT

# Allow HTTP traffic
iptables -A INPUT -p tcp --dport 80 -j ACCEPT # legacy connections
iptables -A INPUT -p tcp --dport 443 -j ACCEPT # TLS connections
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT # outbound TLS connections (not inbound)

# Allow Fabric traffic
iptables -A INPUT -p tcp --dport 7777 -j ACCEPT

# Accept connections on loopback address
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Disable UFW
ufw disable

# Report to User
echo "Setup complete!  Reboot, then proceed with ./scripts/install.sh after logging in as "$USERNAME"."
