# Wireguard LAN Setup
## Install Wireguard
### Macintosh
Install wireguard-tools with brew

`brew install wireguard-tools`

Install wireguard GUI from app store (optional)

`https://itunes.apple.com/us/app/wireguard/id1441195209?ls=1&mt=8`

### Linux 
### Ubuntu/Debian
`apt install wireguard openresolv`

### Fedora
`dnf install wireguard-tools openresolv`

### Arch
`pacman -S wireguard-tools openresolv`

## Create Keypair
```
wg genkey | sudo tee ~/wg0node.key
sudo chmod go= ~/wg0node.key
sudo cat ~/wg0node.key | wg pubkey | sudo tee ~/wg0node.pub
```

## Create Wireguard Config
create the file `/etc/wireguard/wg0.conf`

copy the following into the file:
```
[Interface]
Address = <request from network admin>
ListenPort = 51820
PrivateKey = <wg0node.key>
DNS = 9.9.9.9

[Peer]
PublicKey = 4+R5JV5drm3sNDk507T+fNxk4P/vvjDfmVZhmOvmZhg=
EndPoint = 65.109.159.101:51820
AllowedIPs = 10.8.0.0/24
PersistentKeepalive = 25
```

### Start Wireguard VPN
Using the CLI:
<br>
`sudo wg-quick up wg0`
<br>
<br>
Using the mac GUI:
<br>
`File -> Import Tunnel(s) From File... -> select wg0.conf`
<br>
<br>
Start Wireguard on boot (Linux)
```
sudo systemctl enable wg-quick@wg0.service
sudo systemctl start wg-quick@wg0.service
sudo systemctl status wg-quick@wg0.service
```

### Available Resources
GPU Rigs:
- ymir(`10.8.0.3`) 1x NVIDIA 3060ti
- odin(`10.8.0.4`) 2x NVIDIA 3060ti
- thor(`10.8.0.5`) 2s NVIDIA 3060ti