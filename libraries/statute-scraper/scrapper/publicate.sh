#!/bin/bash

if [ $# -lt 1 ]; then
    echo "Error: State name is required"
    echo "Uso: $0 <state_name>"
    exit 1
fi

if [ -e "/data/http/$1.zip" ]; then
    rm "/data/http/$1.zip"
fi

cd /data/states/
zip -r "/data/http/$1.zip" "$1"
rm -r "$1"