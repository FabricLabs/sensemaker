#!/bin/bash
mysqldump db_jeeves --ignore-table=db_jeeves.cases --single-transaction > stores/db_jeeves_lite.sql

#mysqldump db_jeeves inquiries --single-transaction > stores/db_jeeves_inquiries.sql
#mysqldump db_jeeves invitations --single-transaction > stores/db_jeeves_invitations.sql
#mysqldump db_jeeves users --single-transaction > stores/db_jeeves_users.sql
#mysqldump db_jeeves conversations --single-transaction > stores/db_jeeves_conversations.sql
#mysqldump db_jeeves messages --single-transaction > stores/db_jeeves_messages.sql

#mysqldump db_jeeves --single-transaction > stores/db_jeeves.sql
