module.exports = {
  agents: {
    list: require('./agents/list_agents'),
  },
  cases: {
    list: require('./cases/get_cases'),
  },
  documents: {
    // list: require('./documents/list_documents'),
    // view: require('./documents/view_document'),
    search: require('./documents/search_documents'),
    view: require('./documents/view_document'),
    newConversation: require('./documents/document_new_chat'),
  },
  files: {
    create: require('./files/create_file'),
    list: require('./files/list_files'),
    view: require('./files/view_file'),
    serve: require('./files/serve_file.js'),
    find: require('./files/find_file.js'),

  },
  matters: {
    create: require('./matters/create_matter'),
    new: require('./matters/new_matter'),
    view: require('./matters/matter_view'),
    list: require('./matters/list_matters'),
    addContext: require('./matters/add_context'),
    removeFile: require('./matters/remove_file'),
    removeNote: require('./matters/remove_note'),
    newConversation: require('./matters/matter_new_chat'),
    getConversations: require('./matters/get_conversations'),
    edit: require('./matters/edit_matter'),
    listFiles: require('./matters/list_matter_files'),
    listNotes: require('./matters/list_matter_notes'),
  },
  invitations: {
    createInvitations: require('./invitations/create_invitation'),
    getInvitations: require('./invitations/get_invitations'),
    checkInvitationToken: require('./invitations/check_invitation_token'),
    resendInvitation : require('./invitations/resend_invitation'),
    acceptInvitation: require('./invitations/accept_invitation'),
    declineInvitation: require('./invitations/decline_invitation'),
    deleteInvitation: require('./invitations/delete_invitation'),
  },
  messages: {
    create: require('./messages/create_message'),
  },
  products: {
    list: require('./products/list_products'),
  },
  reporters: {
    search: require('./reporters/search_reporters'),
    view: require('./reporters/view_reporter'),

  },
  jurisdictions: {
    view: require('./jurisdictions/jurisdiction_view'),
  },
  courts: {
    list: require('./courts/list_courts'),
    view: require('./courts/court_view'),
  },
  sessions: {
    create: require('./sessions/create_session')
  },
  statutes: {
    list: require('./statutes/list_statutes'),
    // view: require('./statutes/view_statute'), // TODO: create this
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
  },
  account: {
    changePassword: require('./account/change_password'),
  },
};
