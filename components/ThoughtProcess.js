'use strict';

const React = require('react');
const { Header, Label } = require('semantic-ui-react');
const toRelativeTime = require('../functions/toRelativeTime');

const ROLE_COLOR = {
  request: '#2185d0',
  reply: '#21ba45',
  note: '#767676',
  error: '#db2828'
};

class ThoughtProcess extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      thoughts: [],
      open: props.startOpen !== false,
      error: null,
      status: null
    };
    this._timer = null;
    this._stick = true;
    this._log = React.createRef();
    this.refresh = this.refresh.bind(this);
    this.toggle = this.toggle.bind(this);
    this.onScroll = this.onScroll.bind(this);
  }

  componentDidMount () {
    if (this.state.open) this.refresh();
    this._timer = setInterval(this.refresh, 3000);
  }

  componentWillUnmount () {
    if (this._timer) clearInterval(this._timer);
  }

  componentDidUpdate (prev) {
    if (prev.subject !== this.props.subject || prev.id !== this.props.id) {
      this._stick = true;
      this.setState({ thoughts: [], error: null, status: null }, this.refresh);
    }
    if (this._stick && this._log.current) {
      this._log.current.scrollTop = this._log.current.scrollHeight;
    }
  }

  headers () {
    const token = this.props.token;
    return {
      Accept: 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined
    };
  }

  async refresh () {
    if (!this.state.open) return;
    const subject = this.props.subject;
    const id = this.props.id;
    if (!subject || id == null || id === '') return;
    try {
      const response = await fetch(`/thoughts?subject=${encodeURIComponent(subject)}&id=${encodeURIComponent(id)}`, {
        headers: this.headers(),
        credentials: 'same-origin'
      });
      if (response.status === 401) {
        this.setState({ status: 401, error: null, thoughts: [] });
        return;
      }
      if (response.status === 403) {
        this.setState({ status: 403, error: null });
        return;
      }
      if (!response.ok) {
        let message = 'The thought process is unavailable.';
        try {
          const body = await response.json();
          if (body && body.error) message = String(body.error);
        } catch (parseError) {
          message = 'The thought process is unavailable.';
        }
        this.setState({ status: response.status, error: message, thoughts: [] });
        return;
      }
      const body = await response.json();
      const thoughts = body && Array.isArray(body.thoughts) ? body.thoughts : [];
      this.setState({ thoughts: thoughts, error: null, status: 200 });
    } catch (error) {
      this.setState({ error: 'The thought process is unavailable.' });
    }
  }

  toggle () {
    this.setState((prev) => ({ open: !prev.open }), () => {
      if (this.state.open) this.refresh();
    });
  }

  onScroll () {
    const node = this._log.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    this._stick = distance < 48;
  }

  render () {
    const thoughts = this.state.thoughts;
    const open = this.state.open;
    const title = this.props.title || 'Thought process';

    return (
      <section className='thought-process' aria-label={title} style={{ margin: '0.75em 0 1em' }}>
        <Header as='h2' style={{ cursor: 'pointer', marginBottom: '0.25em' }} onClick={this.toggle}>
          {open ? '▾' : '▸'} {title}
          {thoughts.length ? <Label size='small' style={{ marginLeft: '0.6em' }}>{thoughts.length}</Label> : null}
        </Header>
        {open ? (
          <div>
            <p style={{ marginTop: 0, color: '#555' }}>
              Messages between the coordinator and the agents doing this work.
            </p>
            {this.state.status === 401 ? <p>Sign in to read the thought process.</p> : null}
            {this.state.status === 403 ? <p>You cannot view this thought process.</p> : null}
            {this.state.error ? <p>{this.state.error}</p> : null}
            {this.state.status === 200 && !thoughts.length ? (
              <p>No agent conversation yet. Start the work to see the coordinator talk with the agents.</p>
            ) : null}
            {thoughts.length ? (
              <div
                ref={this._log}
                onScroll={this.onScroll}
                style={{
                  maxHeight: '28em',
                  overflowY: 'auto',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '4px',
                  padding: '0.75em 1em'
                }}
              >
                {thoughts.map((thought) => {
                  const role = thought.role || 'note';
                  const key = thought.local_key || `${thought.seq}-${thought.created_at}-${role}`;
                  return (
                    <article key={key} style={{
                      borderLeft: `3px solid ${ROLE_COLOR[role] || '#767676'}`,
                      padding: '0.35em 0 0.75em 0.75em',
                      margin: '0 0 0.35em'
                    }}>
                      <div style={{ fontSize: '0.85em', marginBottom: '0.2em' }}>
                        <strong>{thought.from_actor}</strong>
                        {' → '}
                        <strong>{thought.to_actor}</strong>
                        {thought.created_at ? (
                          <abbr title={thought.created_at} style={{ marginLeft: '0.6em', color: '#666' }}>
                            {toRelativeTime(thought.created_at)}
                          </abbr>
                        ) : null}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', fontStyle: role === 'note' ? 'italic' : 'normal' }}>
                        {thought.content || ''}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  }
}

module.exports = ThoughtProcess;
