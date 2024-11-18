'use strict';

module.exports = {
  account: {
    changePassword: require('./account/change_password'),
    changeUsername: require('./account/change_username'),
    resetPassword: require('./account/reset_password'),
    checkResetToken: require('./account/check_reset_token'),
    restorePassword: require('./account/restore_password'),
  },
  admin: {
    overview: require('./admin/overview'),
    settings: require('./admin/settings'),
    users: require('./admin/users'),
    growth: require('./admin/growth'),
    conversations: require('./admin/conversations'),
    services: require('./admin/services'),
    design: require('./admin/design')
  },
  agents: {
    list: require('./agents/list_agents'),
  },
  announcements: {
    list: require('./announcements/list_announcements'),
    latest: require('./announcements/latest_announcement'),
    create: require('./announcements/create_announcement')
  },
  conversations: {
    list: require('./conversations/list_conversations'),
    view: require('./conversations/view_conversation'),
    editConversationsTitle: require('./conversations/edit_conversations_title'),
    getConversationsByID: require('./conversations/view_conversation')
  },
  documents: {
    create: require('./documents/create_document'),
    delete: require('./documents/delete_document'),
    list: require('./documents/list_documents'),
    edit: require('./documents/edit_document'),
    getDocumentByID: require('./documents/get_document_by_id'),
    // view: require('./documents/view_document'),
    search: require('./documents/search_documents'),
    view: require('./documents/view_document'),
    newConversation: require('./documents/document_new_chat')
  },
  feedback: {
    create: require('./feedback/create_feedback')
  },
  files: {
    create: require('./files/create_file'),
    list: require('./files/list_files'),
    listByUser: require('./files/list_user_files'),
    view: require('./files/view_file'),
    serve: require('./files/serve_file'),
    find: require('./files/find_file')
  },
  help: {
    getConversations: require('./help/get_conversations'),
    getAdmConversations: require('./help/get_conversations_adm'),
    getMessages: require('./help/get_messages'),
    sendMessage: require('./help/send_message'),
    setMessagesRead: require('./help/set_messages_read')
  },
  inquiries: {
    create: require('./inquiries/create_inquiry'),
    delete: require('./inquiries/delete_inquiry'),
    list: require('./inquiries/list_inquiries')
  },
  invitations: {
    createInvitations: require('./invitations/create_invitation'),
    getInvitations: require('./invitations/get_invitations'),
    checkInvitationToken: require('./invitations/check_invitation_token'),
    resendInvitation: require('./invitations/resend_invitation'),
    acceptInvitation: require('./invitations/accept_invitation'),
    declineInvitation: require('./invitations/decline_invitation'),
    deleteInvitation: require('./invitations/delete_invitation')
  },
  messages: {
    list: require('./messages/list_messages'),
    create: require('./messages/create_message'),
    getMessages: require('./messages/list_messages'),
    regenerate: require('./messages/regenerate_message'),
  },
  people: {
    list: require('./people/get_people'),
    view: require('./people/view_person')
  },
  products: {
    list: require('./products/list_products'),
  },
  redis: {
    listQueue: require('./redis/list_queue'),
    clearQueue: require('./redis/clear_queue')
  },
  reviews: {
    create: require('./reviews/create_review')
  },
  sessions: {
    create: require('./sessions/create_session'),
    get: require('./sessions/get_session'),
    current: require('./sessions/current_session')
  },
  settings: {
    updateCompliance: require('./settings/update_compliance'),
    list: require('./settings/list_settings')
  },
  statistics: {
    admin: require('./statistics/admin_statistics'),
    getAccuracy: require('./statistics/get_accuracy'),
    list: require('./statistics/get_statistics'),
    sync: require('./statistics/sync_statistics')
  },
  tasks: {
    create: require('./tasks/create_task'),
    list: require('./tasks/list_tasks'),
    view: require('./tasks/view_task')
  },
  uploads: {
    listUploads: require('./uploads/get_uploads')
  },
  users: {
    list: require('./users/list_users'),
    listFiles: require('./users/list_user_files'),
    editUsername: require('./users/edit_username'),
    editEmail: require('./users/edit_email'),
    view: require('./users/view_user'),
    createUser: require('./users/create_user'),
    createFullUser: require('./users/create_full_user'),
    checkExistingUsername: require('./users/check_username'),
    checkExistingEmail: require('./users/check_email')
  }
};
