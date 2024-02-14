#!/bin/bash


DB_IP=$(kubectl get svc -n mysql | cut -d' ' -f7)
mysql -h $DB_IP -u db_user_jeeves -pweedis6uozedaiwee4Eereesheequiem db_jeeves
