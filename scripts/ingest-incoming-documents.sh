#!/bin/bash
rsync -av --remove-source-files --include ".*" /media/storage/incoming/* /media/storage/ingesting
