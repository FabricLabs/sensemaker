const { editDocument, deleteDocument } = require('../actions/documentActions.js');

module.exports = {
  agents: {
    list: require('./agents/list_agents'),
  },
  documents: {
    create: require('./documents/create_document'),
    createSection: require('./documents/create_document_section.js'),
    getSections: require('./documents/get_document_sections.js'),
    deleteSection: require('./documents/delete_document_section.js'),
    editSection: require('./documents/edit_document_section.js'),
    delete: require('./documents/delete_document.js'),
    list: require('./documents/list_documents'),
    edit: require('./documents/edit_document.js'),
    getDocumentByID: require('./documents/get_document_by_id'),
    // view: require('./documents/view_document'),
    search: require('./documents/search_documents'),
    view: require('./documents/view_document'),
    newConversation: require('./documents/document_new_chat'),
    createSection: require('./documents/create_document_section'),
    editSection: require('./documents/edit_document_section'),
  },
  files: {
    create: require('./files/create_file'),
    list: require('./files/list_files'),
    listByUser: require('./files/list_user_files'),
    view: require('./files/view_file'),
    serve: require('./files/serve_file.js'),
    find: require('./files/find_file.js'),
  },
  invitations: {
    createInvitations: require('./invitations/create_invitation'),
    getInvitations: require('./invitations/get_invitations'),
    checkInvitationToken: require('./invitations/check_invitation_token'),
    resendInvitation: require('./invitations/resend_invitation'),
    acceptInvitation: require('./invitations/accept_invitation'),
    declineInvitation: require('./invitations/decline_invitation'),
    deleteInvitation: require('./invitations/delete_invitation'),
  },
  messages: {
    create: require('./messages/create_message'),
    getMessages: require('./messages/get_messages'),
  },
  products: {
    list: require('./products/list_products'),
  },
  sessions: {
    create: require('./sessions/create_session'),
    get: require('./sessions/get_session'),
  },
  users: {
    list: require('./users/list_users'),
    listFiles: require('./users/list_user_files'),
    editUsername: require('./users/edit_username'),
    editEmail: require('./users/edit_email'),
    view: require('./users/view_user'),
    createUser: require('./users/create_user.js'),
    createFullUser: require('./users/create_full_user'),
    checkExistingUsername: require('./users/check_username'),
    checkExistingEmail: require('./users/check_email'),
  },
  feedback: {
    create: require('./feedback/create_feedback.js')
  },
  conversations: {
    getConversations: require('./conversations/get_conversations'),
    editConversationsTitle: require('./conversations/edit_conversations_title'),
    getConversationsByID: require('./conversations/get_conversations_by_id'),
  },
  account: {
    changePassword: require('./account/change_password'),
    changeUsername: require('./account/change_username'),
  },
  people: {
    list: require('./people/get_people'),
  },
  help: {
    getConversations: require('./help/get_conversations.js'),
    getAdmConversations: require('./help/get_conversations_adm.js'),
    getMessages: require('./help/get_messages.js'),
    sendMessage: require('./help/send_message.js'),
    setMessagesRead: require('./help/set_messages_read.js')
  },
  adminSettings: {
    overview: require('./admin-settings/overview.js'),
    settings: require('./admin-settings/settings.js'),
    users: require('./admin-settings/users.js'),
    growth: require('./admin-settings/growth.js'),
    conversations: require('./admin-settings/conversations.js'),
    services: require('./admin-settings/services.js'),
    design: require('./admin-settings/design.js')

  },
  peers: {
    list: require('./peers/list_peers.js')
  },
  redis: {
    listQueue: require('./redis/list_queue.js'),
    clearQueue: require('./redis/clear_queue.js'),
  },
  uploads: {
    listUploads: require('./uploads/get_uploads.js'),
  }
};
