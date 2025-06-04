'use strict';

module.exports = {
  account: {
    changePassword: require('./account/change_password'),
    changeUsername: require('./account/change_username'),
    resetPassword: require('./account/reset_password'),
    checkResetToken: require('./account/check_reset_token'),
    restorePassword: require('./account/restore_password')
  },
  activities: {
    list: require('./activities/list_activities'),
    view: require('./activities/view_activity')
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
    create: require('./agents/create_agent'),
    list: require('./agents/list_agents'),
    view: require('./agents/view_agent')
  },
  alerts: {
    list: require('./alerts/list_alerts')
  },
  announcements: {
    list: require('./announcements/list_announcements'),
    latest: require('./announcements/latest_announcement'),
    create: require('./announcements/create_announcement')
  },
  blobs: {
    view: require('./blobs/view_blob')
  },
  conversations: {
    create: require('./conversations/create_conversation'),
    list: require('./conversations/list_conversations'),
    view: require('./conversations/view_conversation'),
    editConversationsTitle: require('./conversations/edit_conversations_title'),
    getConversationsByID: require('./conversations/view_conversation')
  },
  contracts: {
    list: require('./contracts/list_contracts'),
    create: require('./contracts/create_contract'),
    view: require('./contracts/view_contract'),
    sign: require('./contracts/sign_contract'),
    search: require('./contracts/search_contracts')
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
  groups: {
    create: require('./groups/create_group'),
    list: require('./groups/list_groups'),
    view: require('./groups/view_group'),
    add_group_member: require('./groups/add_group_member')
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
    create: require('./invitations/create_invitation'),
    list: require('./invitations/get_invitations'),
    view: require('./invitations/view_invitation'),
    checkInvitationToken: require('./invitations/check_invitation_token'),
    resendInvitation: require('./invitations/resend_invitation'),
    acceptInvitation: require('./invitations/accept_invitation'),
    declineInvitation: require('./invitations/decline_invitation'),
    deleteInvitation: require('./invitations/delete_invitation')
  },
  jobs: {
    list: require('./jobs/list_jobs')
  },
  keys: {
    list: require('./keys/list_keys'),
    create: require('./keys/create_key')
  },
  memories: {
    list: require('./memories/list_memories'),
    view: require('./memories/view_memory')
  },
  messages: {
    list: require('./messages/list_messages'),
    create: require('./messages/create_message'),
    createCompletion: require('./messages/create_completion'),
    getMessages: require('./messages/list_messages'),
    regenerate: require('./messages/regenerate_message')
  },
  peers: {
    list: require('./peers/list_peers'),
    create: require('./peers/create_peer'),
    view: require('./peers/view_peer')
  },
  people: {
    list: require('./people/get_people'),
    view: require('./people/view_person')
  },
  products: {
    list: require('./products/list_products'),
    listFeatures: require('./products/list_features')
  },
  redis: {
    listQueue: require('./redis/list_queue'),
    clearQueue: require('./redis/clear_queue')
  },
  reviews: {
    create: require('./reviews/create_review')
  },
  services: {
    discord: {
      guilds: {
        list: require('./services/discord/list_guilds'),
        view: require('./services/discord/view_guild')
      },
      channels: {
        list: require('./services/discord/list_channels'),
        view: require('./services/discord/view_channel')
      },
      users: {
        list: require('./services/discord/list_users'),
        view: require('./services/discord/view_user')
      }
    },
    disk: {
      list: require('./services/disk/list_files'),
      view: require('./services/disk/view_path')
    },
    matrix: {
      rooms: {
        view: require('./services/matrix/view_room')
      }
    },
    rsi: {
      activities: {
        create: require('./services/rsi/create_activity')
      }
    }
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
  sources: {
    create: require('./sources/create_source'),
    list: require('./sources/list_sources'),
    view: require('./sources/view_source')
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
    view: require('./tasks/view_task'),
    edit: require('./tasks/edit_task')
  },
  topics: {
    list: require('./topics/list_topics'),
    view: require('./topics/view_topic')
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
