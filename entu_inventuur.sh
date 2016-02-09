#!/bin/bash

mkdir -p /data/entu_inventuur/code
cd /data/entu_inventuur/code

git clone https://github.com/argoroots/entu-inventuur.git ./
git checkout master
git pull
