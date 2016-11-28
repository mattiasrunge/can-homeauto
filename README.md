# can2mqtt-bridge
Protocol implementation for auml can homeautomation and translates it to mqtt

## Install node 7
```bash
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Setup
```bash
git clone https://github.com/mattiasrunge/can-homeauto.git
cd can-homeauto
npm install
```

## Run
```bash
node --harmony_async_await index.js [ host/ip [ port [ protocol xml ]]]
```
