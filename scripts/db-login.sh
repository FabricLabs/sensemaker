#!/bin/bash


DB_IP=$(kubectl get svc -n mysql | cut -d' ' -f7)
mysql -h $DB_IP -u db_user_jeeves -p$DB_PASS db_jeeves
