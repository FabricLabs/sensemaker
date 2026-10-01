'use strict';

const React = require('react');
const { Link } = require('react-router-dom');
const {
  Header,
  Message,
  Button,
  Table,
  Segment,
  Label,
  Dropdown,
  Icon
} = require('semantic-ui-react');

function formatDurationMs (ms) {
  if (ms == null || Number.isNaN(ms)) return '—';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

class AdminDiscordTab extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      selectedGuildId: null,
      pollMs: 10000
    };
    this._pollTimer = null;
  }

  componentDidMount () {
    this.refreshAll();
    this._pollTimer = setInterval(() => this.refreshAll(), this.state.pollMs);
  }

  componentWillUnmount () {
    if (this._pollTimer) clearInterval(this._pollTimer);
  }

  refreshAll = () => {
    const { fetchDiscordGuilds, fetchDiscordChannels, fetchDiscordVoice } = this.props;
    if (fetchDiscordGuilds) fetchDiscordGuilds();
    if (fetchDiscordChannels) fetchDiscordChannels();
    if (fetchDiscordVoice) fetchDiscordVoice();
  };

  renderVoiceActive (voice, selectedGuildId) {
    if (!voice || !voice.active) {
      return <Message info>No active voice data yet. Connect the bot and join a voice channel.</Message>;
    }
    const rows = Object.entries(voice.active).map(([channelId, rec]) => ({
      channelId,
      ...rec,
      memberCount: rec.members ? Object.keys(rec.members).length : 0
    }));
    const filtered = selectedGuildId
      ? rows.filter((r) => r.guildId === selectedGuildId)
      : rows;
    if (filtered.length === 0) {
      return <Message>No users in voice for this filter.</Message>;
    }
    return (
      <Table celled compact striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Channel</Table.HeaderCell>
            <Table.HeaderCell>Channel ID</Table.HeaderCell>
            <Table.HeaderCell>Guild ID</Table.HeaderCell>
            <Table.HeaderCell>Members</Table.HeaderCell>
            <Table.HeaderCell>Users (ID)</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filtered.map((row) => (
            <Table.Row key={row.channelId}>
              <Table.Cell>{row.name || '—'}</Table.Cell>
              <Table.Cell><code>{row.channelId}</code></Table.Cell>
              <Table.Cell><code>{row.guildId}</code></Table.Cell>
              <Table.Cell>{row.memberCount}</Table.Cell>
              <Table.Cell>
                {row.members
                  ? Object.keys(row.members).map((uid) => (
                    <Label key={uid} size="small" style={{ margin: '0.15em' }}>{uid}</Label>
                  ))
                  : '—'}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    );
  }

  renderAggregates (voice, selectedGuildId) {
    if (!voice || !voice.aggregates) return null;
    const chAgg = voice.aggregates.channels || {};
    const gAgg = voice.aggregates.guilds || {};
    const chRows = Object.entries(chAgg)
      .map(([id, a]) => ({ id, ...a }))
      .filter((r) => {
        if (!selectedGuildId) return true;
        const active = voice.active && voice.active[r.id];
        return active && active.guildId === selectedGuildId;
      });
    const gRows = Object.entries(gAgg).map(([id, a]) => ({ id, ...a }))
      .filter((r) => !selectedGuildId || r.id === selectedGuildId);
    return (
      <React.Fragment>
        <Header as="h4">Per-channel aggregates</Header>
        {chRows.length === 0 ? (
          <Message compact>No channel-level stats for this filter.</Message>
        ) : (
          <Table celled compact striped size="small">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Channel ID</Table.HeaderCell>
                <Table.HeaderCell>Joins</Table.HeaderCell>
                <Table.HeaderCell>Leaves</Table.HeaderCell>
                <Table.HeaderCell>Peak</Table.HeaderCell>
                <Table.HeaderCell>Total member time</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {chRows.map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell><code>{row.id}</code></Table.Cell>
                  <Table.Cell>{row.joinCount}</Table.Cell>
                  <Table.Cell>{row.leaveCount}</Table.Cell>
                  <Table.Cell>{row.peakConcurrent}</Table.Cell>
                  <Table.Cell>{formatDurationMs(row.totalMemberMs)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
        <Header as="h4" style={{ marginTop: '1.5em' }}>Per-guild aggregates</Header>
        {gRows.length === 0 ? (
          <Message compact>No guild-level stats.</Message>
        ) : (
          <Table celled compact striped size="small">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Guild ID</Table.HeaderCell>
                <Table.HeaderCell>Joins</Table.HeaderCell>
                <Table.HeaderCell>Leaves</Table.HeaderCell>
                <Table.HeaderCell>Peak members (voice)</Table.HeaderCell>
                <Table.HeaderCell>Total member time</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {gRows.map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell><code>{row.id}</code></Table.Cell>
                  <Table.Cell>{row.joinCount}</Table.Cell>
                  <Table.Cell>{row.leaveCount}</Table.Cell>
                  <Table.Cell>{row.peakConcurrentMembers}</Table.Cell>
                  <Table.Cell>{formatDurationMs(row.totalMemberMs)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </React.Fragment>
    );
  }

  render () {
    const { discord } = this.props;
    const { selectedGuildId } = this.state;
    const guilds = discord.guilds || [];
    const channels = discord.channels || [];
    const voiceSnap = discord.voiceSnapshot;
    const voice = voiceSnap && voiceSnap.voice;
    const voiceErr = discord.voiceError;
    const voiceLike = channels.filter((c) => c.isVoiceLike);
    const voiceByGuild = selectedGuildId
      ? voiceLike.filter((c) => c.guildId === selectedGuildId)
      : voiceLike;

    const guildOptions = [
      { key: 'all', value: '', text: 'All guilds' },
      ...guilds.map((g) => ({ key: g.id, value: g.id, text: `${g.name} (${g.id})` }))
    ];

    return (
      <adminDiscordTab>
        <Header as="h3">Discord (application)</Header>
        <p>
          Inspect servers the bot is in, voice-capable channels, and accumulated voice statistics.
          Open the{' '}
          <Link to="/services/discord/guilds">Discord guilds view</Link>
          {' '}for the full navigator.
        </p>
        <Button primary icon onClick={this.refreshAll} loading={!!(discord.loading || discord.voiceLoading)}>
          <Icon name="refresh" /> Refresh
        </Button>
        <span style={{ marginLeft: '1em', color: '#888' }}>
          Auto-refresh every {this.state.pollMs / 1000}s
        </span>

        {voiceErr && (
          <Message negative style={{ marginTop: '1em' }}>
            <Message.Header>Voice / admin API</Message.Header>
            <p>{typeof voiceErr === 'string' ? voiceErr : (voiceErr.message || String(voiceErr))}</p>
            {(typeof voiceErr === 'object' && voiceErr.status === 403) && (
              <p><small>Voice statistics require an administrator session.</small></p>
            )}
          </Message>
        )}

        <Segment style={{ marginTop: '1.5em' }}>
          <Header as="h4">Filter by guild</Header>
          <Dropdown
            placeholder="All guilds"
            selection
            options={guildOptions}
            value={selectedGuildId || ''}
            onChange={(e, { value }) => this.setState({ selectedGuildId: value || null })}
          />
        </Segment>

        <Header as="h4" style={{ marginTop: '1.5em' }}>Servers</Header>
        {guilds.length === 0 ? (
          <Message warning>
            No guilds returned. Ensure Discord is enabled in settings and the bot token is valid.
          </Message>
        ) : (
          <Table celled compact striped size="small">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Members</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {guilds.map((g) => (
                <Table.Row key={g.id}>
                  <Table.Cell>{g.name}</Table.Cell>
                  <Table.Cell><code>{g.id}</code></Table.Cell>
                  <Table.Cell>{g.memberCount ?? g.approximateMemberCount ?? '—'}</Table.Cell>
                  <Table.Cell>
                    <Link to={`/services/discord/guilds/${g.id}`}>Open</Link>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}

        <Header as="h4" style={{ marginTop: '1.5em' }}>Voice &amp; stage channels</Header>
        <p style={{ color: '#666', fontSize: '0.95em' }}>
          Channel types marked voice-like (Discord voice + stage) from the channel cache.
        </p>
        {voiceByGuild.length === 0 ? (
          <Message compact>No voice channels in cache for this filter.</Message>
        ) : (
          <Table celled compact striped size="small">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Channel ID</Table.HeaderCell>
                <Table.HeaderCell>Guild</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {voiceByGuild.map((c) => (
                <Table.Row key={c.id}>
                  <Table.Cell>{c.name || '—'}</Table.Cell>
                  <Table.Cell>{c.type}</Table.Cell>
                  <Table.Cell><code>{c.id}</code></Table.Cell>
                  <Table.Cell>{c.guildName} <code>{c.guildId}</code></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}

        <Header as="h4" style={{ marginTop: '1.5em' }}>Live voice occupancy</Header>
        {voiceSnap && voiceSnap.botTag && (
          <p style={{ marginBottom: '0.75em' }}>Bot: <strong>{voiceSnap.botTag}</strong></p>
        )}
        {this.renderVoiceActive(voice, selectedGuildId)}

        <Header as="h4" style={{ marginTop: '1.5em' }}>Accumulated voice statistics</Header>
        {this.renderAggregates(voice, selectedGuildId)}
      </adminDiscordTab>
    );
  }
}

module.exports = AdminDiscordTab;
