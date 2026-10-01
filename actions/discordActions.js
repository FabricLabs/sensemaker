'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
// TODO: re-write to use common API methods
async function fetchStatsFromAPI (token) {
  const response = await fetch('/services/discord', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchChannelFromAPI (id, token) {
  const response = await fetch(`/services/discord/channels/${id}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchChannelsFromAPI (token) {
  const response = await fetch(`/services/discord/channels`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchGuildFromAPI (id, token) {
  const response = await fetch(`/services/discord/guilds/${id}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchGuildsFromAPI (token) {
  const response = await fetch('/services/discord/guilds', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchUserFromAPI (id, token) {
  const response = await fetch(`/services/discord/users/${id}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchUsersFromAPI (token) {
  const response = await fetch('/services/discord/users', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchDiscordVoiceFromAPI (token) {
  const response = await fetch('/services/discord/voice', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(body.error || `HTTP ${response.status}`);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return body;
}

// Action types
const FETCH_DISCORD_STATS_REQUEST = 'FETCH_DISCORD_STATS_REQUEST';
const FETCH_DISCORD_STATS_SUCCESS = 'FETCH_DISCORD_STATS_SUCCESS';
const FETCH_DISCORD_STATS_FAILURE = 'FETCH_DISCORD_STATS_FAILURE';
const FETCH_DISCORD_CHANNEL_REQUEST = 'FETCH_DISCORD_CHANNEL_REQUEST';
const FETCH_DISCORD_CHANNEL_SUCCESS = 'FETCH_DISCORD_CHANNEL_SUCCESS';
const FETCH_DISCORD_CHANNEL_FAILURE = 'FETCH_DISCORD_CHANNEL_FAILURE';
const FETCH_DISCORD_CHANNELS_REQUEST = 'FETCH_DISCORD_CHANNELS_REQUEST';
const FETCH_DISCORD_CHANNELS_SUCCESS = 'FETCH_DISCORD_CHANNELS_SUCCESS';
const FETCH_DISCORD_CHANNELS_FAILURE = 'FETCH_DISCORD_CHANNELS_FAILURE';
const FETCH_DISCORD_GUILD_REQUEST = 'FETCH_DISCORD_GUILD_REQUEST';
const FETCH_DISCORD_GUILD_SUCCESS = 'FETCH_DISCORD_GUILD_SUCCESS';
const FETCH_DISCORD_GUILD_FAILURE = 'FETCH_DISCORD_GUILD_FAILURE';
const FETCH_DISCORD_GUILDS_REQUEST = 'FETCH_DISCORD_GUILDS_REQUEST';
const FETCH_DISCORD_GUILDS_SUCCESS = 'FETCH_DISCORD_GUILDS_SUCCESS';
const FETCH_DISCORD_GUILDS_FAILURE = 'FETCH_DISCORD_GUILDS_FAILURE';
const FETCH_DISCORD_USER_REQUEST = 'FETCH_DISCORD_USER_REQUEST';
const FETCH_DISCORD_USER_SUCCESS = 'FETCH_DISCORD_USER_SUCCESS';
const FETCH_DISCORD_USER_FAILURE = 'FETCH_DISCORD_USER_FAILURE';
const FETCH_DISCORD_USERS_REQUEST = 'FETCH_DISCORD_USERS_REQUEST';
const FETCH_DISCORD_USERS_SUCCESS = 'FETCH_DISCORD_USERS_SUCCESS';
const FETCH_DISCORD_USERS_FAILURE = 'FETCH_DISCORD_USERS_FAILURE';
const FETCH_DISCORD_VOICE_REQUEST = 'FETCH_DISCORD_VOICE_REQUEST';
const FETCH_DISCORD_VOICE_SUCCESS = 'FETCH_DISCORD_VOICE_SUCCESS';
const FETCH_DISCORD_VOICE_FAILURE = 'FETCH_DISCORD_VOICE_FAILURE';

// Action creators
const fetchDiscordStatsRequest = () => ({ type: FETCH_DISCORD_STATS_REQUEST });
const fetchDiscordStatsSuccess = (stats) => ({ type: FETCH_DISCORD_STATS_SUCCESS, payload: stats });
const fetchDiscordStatsFailure = (error) => ({ type: FETCH_DISCORD_STATS_FAILURE, payload: error });
const fetchDiscordChannelRequest = () => ({ type: FETCH_DISCORD_CHANNEL_REQUEST });
const fetchDiscordChannelSuccess = (stats) => ({ type: FETCH_DISCORD_CHANNEL_SUCCESS, payload: stats });
const fetchDiscordChannelFailure = (error) => ({ type: FETCH_DISCORD_CHANNEL_FAILURE, payload: error });
const fetchDiscordChannelsRequest = () => ({ type: FETCH_DISCORD_CHANNELS_REQUEST });
const fetchDiscordChannelsSuccess = (stats) => ({ type: FETCH_DISCORD_CHANNELS_SUCCESS, payload: stats });
const fetchDiscordChannelsFailure = (error) => ({ type: FETCH_DISCORD_CHANNELS_FAILURE, payload: error });
const fetchDiscordGuildRequest = () => ({ type: FETCH_DISCORD_GUILD_REQUEST });
const fetchDiscordGuildSuccess = (stats) => ({ type: FETCH_DISCORD_GUILD_SUCCESS, payload: stats });
const fetchDiscordGuildFailure = (error) => ({ type: FETCH_DISCORD_GUILD_FAILURE, payload: error });
const fetchDiscordGuildsRequest = () => ({ type: FETCH_DISCORD_GUILDS_REQUEST });
const fetchDiscordGuildsSuccess = (stats) => ({ type: FETCH_DISCORD_GUILDS_SUCCESS, payload: stats });
const fetchDiscordGuildsFailure = (error) => ({ type: FETCH_DISCORD_GUILDS_FAILURE, payload: error });
const fetchDiscordUserRequest = () => ({ type: FETCH_DISCORD_USER_REQUEST });
const fetchDiscordUserSuccess = (stats) => ({ type: FETCH_DISCORD_USER_SUCCESS, payload: stats });
const fetchDiscordUserFailure = (error) => ({ type: FETCH_DISCORD_USER_FAILURE, payload: error });
const fetchDiscordUsersRequest = () => ({ type: FETCH_DISCORD_USERS_REQUEST });
const fetchDiscordUsersSuccess = (stats) => ({ type: FETCH_DISCORD_USERS_SUCCESS, payload: stats });
const fetchDiscordUsersFailure = (error) => ({ type: FETCH_DISCORD_USERS_FAILURE, payload: error });
const fetchDiscordVoiceRequest = () => ({ type: FETCH_DISCORD_VOICE_REQUEST });
const fetchDiscordVoiceSuccess = (payload) => ({ type: FETCH_DISCORD_VOICE_SUCCESS, payload });
const fetchDiscordVoiceFailure = (error) => ({ type: FETCH_DISCORD_VOICE_FAILURE, payload: error });

// Thunk action creator
const fetchDiscordStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchDiscordStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchDiscordStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchDiscordStatsFailure(error));
    }
  };
};

const fetchDiscordChannel = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchDiscordChannelRequest());
    const { token } = getState().auth;
    try {
      const channel = await fetchChannelFromAPI(id, token);
      dispatch(fetchDiscordChannelSuccess(channel));
    } catch (error) {
      dispatch(fetchDiscordChannelFailure(error));
    }
  };
};

const fetchDiscordChannels = () => {
  return async (dispatch, getState) => {
    dispatch(fetchDiscordChannelsRequest());
    const { token } = getState().auth;
    try {
      const channels = await fetchChannelsFromAPI(token);
      dispatch(fetchDiscordChannelsSuccess(channels));
    } catch (error) {
      dispatch(fetchDiscordChannelsFailure(error));
    }
  };
};

const fetchDiscordGuild = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchDiscordGuildRequest());
    const { token } = getState().auth;
    try {
      const guild = await fetchGuildFromAPI(id, token);
      dispatch(fetchDiscordGuildSuccess(guild));
    } catch (error) {
      dispatch(fetchDiscordGuildFailure(error));
    }
  };
};

const fetchDiscordGuilds = () => {
  return async (dispatch, getState) => {
    dispatch(fetchDiscordGuildsRequest());
    const { token } = getState().auth;
    try {
      const data = await fetchGuildsFromAPI(token);
      dispatch(fetchDiscordGuildsSuccess(data));
    } catch (error) {
      dispatch(fetchDiscordGuildsFailure(error));
    }
  };
};

const fetchDiscordUser = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchDiscordUserRequest());
    const { token } = getState().auth;
    try {
      const user = await fetchUserFromAPI(id, token);
      dispatch(fetchDiscordUserSuccess(user));
    } catch (error) {
      dispatch(fetchDiscordUserFailure(error));
    }
  };
};

const fetchDiscordUsers = () => {
  return async (dispatch, getState) => {
    dispatch(fetchDiscordUsersRequest());
    const { token } = getState().auth;
    try {
      const users = await fetchUsersFromAPI(token);
      dispatch(fetchDiscordUsersSuccess(users));
    } catch (error) {
      dispatch(fetchDiscordUsersFailure(error));
    }
  };
};

const fetchDiscordVoice = () => {
  return async (dispatch, getState) => {
    dispatch(fetchDiscordVoiceRequest());
    const { token } = getState().auth;
    try {
      const data = await fetchDiscordVoiceFromAPI(token);
      dispatch(fetchDiscordVoiceSuccess(data));
    } catch (error) {
      const payload = error && typeof error === 'object'
        ? { message: error.message || String(error), status: error.status, body: error.body }
        : { message: String(error) };
      dispatch(fetchDiscordVoiceFailure(payload));
    }
  };
};

module.exports = {
  fetchDiscordStats,
  fetchDiscordChannel,
  fetchDiscordChannels,
  fetchDiscordGuild,
  fetchDiscordGuilds,
  fetchDiscordUser,
  fetchDiscordUsers,
  fetchDiscordVoice,
  FETCH_DISCORD_STATS_REQUEST,
  FETCH_DISCORD_STATS_SUCCESS,
  FETCH_DISCORD_STATS_FAILURE,
  FETCH_DISCORD_CHANNEL_REQUEST,
  FETCH_DISCORD_CHANNEL_SUCCESS,
  FETCH_DISCORD_CHANNEL_FAILURE,
  FETCH_DISCORD_CHANNELS_REQUEST,
  FETCH_DISCORD_CHANNELS_SUCCESS,
  FETCH_DISCORD_CHANNELS_FAILURE,
  FETCH_DISCORD_GUILD_REQUEST,
  FETCH_DISCORD_GUILD_SUCCESS,
  FETCH_DISCORD_GUILD_FAILURE,
  FETCH_DISCORD_GUILDS_REQUEST,
  FETCH_DISCORD_GUILDS_SUCCESS,
  FETCH_DISCORD_GUILDS_FAILURE,
  FETCH_DISCORD_USER_REQUEST,
  FETCH_DISCORD_USER_SUCCESS,
  FETCH_DISCORD_USER_FAILURE,
  FETCH_DISCORD_VOICE_REQUEST,
  FETCH_DISCORD_VOICE_SUCCESS,
  FETCH_DISCORD_VOICE_FAILURE
};
