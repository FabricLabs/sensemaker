'use strict';

const {
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
} = require('../actions/discordActions');

const initialState = {
  error: null,
  loading: true,
  syncActive: false,
  syncStatus: '',
  guild: {},
  guilds: [],
  channels: [],
  voiceSnapshot: null,
  voiceLoading: false,
  voiceError: null
};

function discordReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_DISCORD_STATS_REQUEST:
      return { ...state, loading: true };
    case FETCH_DISCORD_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false, error: null };
    case FETCH_DISCORD_STATS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_DISCORD_CHANNEL_REQUEST:
      return { ...state, loading: true };
    case FETCH_DISCORD_CHANNEL_SUCCESS:
      return { ...state, ...action.payload, loading: false, error: null };
    case FETCH_DISCORD_CHANNEL_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_DISCORD_CHANNELS_REQUEST:
      return { ...state, loading: true };
    case FETCH_DISCORD_CHANNELS_SUCCESS:
      return {
        ...state,
        channels: action.payload.channels || [],
        loading: false,
        error: null
      };
    case FETCH_DISCORD_CHANNELS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_DISCORD_GUILD_REQUEST:
      return { ...state, loading: true };
    case FETCH_DISCORD_GUILD_SUCCESS:
      return { ...state, ...action.payload, loading: false, error: null };
    case FETCH_DISCORD_GUILD_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_DISCORD_GUILDS_REQUEST:
      return { ...state, loading: true };
    case FETCH_DISCORD_GUILDS_SUCCESS:
      return {
        ...state,
        guilds: action.payload.guilds || [],
        loading: false,
        error: null
      };
    case FETCH_DISCORD_GUILDS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_DISCORD_USER_REQUEST:
      return { ...state, loading: true };
    case FETCH_DISCORD_USER_SUCCESS:
      return { ...state, ...action.payload, loading: false, error: null };
    case FETCH_DISCORD_USER_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_DISCORD_VOICE_REQUEST:
      return { ...state, voiceLoading: true, voiceError: null };
    case FETCH_DISCORD_VOICE_SUCCESS:
      return {
        ...state,
        voiceSnapshot: action.payload,
        voiceLoading: false,
        voiceError: null
      };
    case FETCH_DISCORD_VOICE_FAILURE:
      return { ...state, voiceLoading: false, voiceError: action.payload };
    default:
      return state;
  }
}

module.exports = discordReducer;
