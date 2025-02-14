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

async function fetchGuildsFromAPI (id, token) {
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

async function fetchUsersFromAPI (id, token) {
  const response = await fetch(`/services/discord/users`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
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
      const guilds = await fetchGuildsFromAPI(token);
      dispatch(fetchDiscordGuildsSuccess(guilds));
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

module.exports = {
  fetchDiscordStats,
  fetchDiscordChannel,
  fetchDiscordChannels,
  fetchDiscordGuild,
  fetchDiscordGuilds,
  fetchDiscordUser,
  fetchDiscordUsers,
  FETCH_DISCORD_STATS_REQUEST,
  FETCH_DISCORD_STATS_SUCCESS,
  FETCH_DISCORD_STATS_FAILURE,
  FETCH_DISCORD_GUILD_REQUEST,
  FETCH_DISCORD_GUILD_SUCCESS,
  FETCH_DISCORD_GUILD_FAILURE,
  FETCH_DISCORD_USER_REQUEST,
  FETCH_DISCORD_USER_SUCCESS,
  FETCH_DISCORD_USER_FAILURE
};
