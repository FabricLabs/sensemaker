'use strict';

const React = require('react');
const { Button, Icon, Label } = require('semantic-ui-react');
const toRelativeTime = require('../functions/toRelativeTime');

class BackgroundWorkerStatus extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      worker: props.worker || null,
      pending: false
    };
    this._timer = null;
    this.refresh = this.refresh.bind(this);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
  }

  componentDidMount () {
    if (this.props.poll === false) return;
    this.refresh();
    this._timer = setInterval(this.refresh, 4000);
  }

  componentWillUnmount () {
    if (this._timer) clearInterval(this._timer);
  }

  componentDidUpdate (prev) {
    if (prev.taskId !== this.props.taskId && this.props.poll !== false) this.refresh();
  }

  headers () {
    const token = this.props.token;
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined
    };
  }

  async refresh () {
    const taskId = this.props.taskId;
    if (!taskId) return;
    try {
      const response = await fetch(`/workers/state?task=${encodeURIComponent(taskId)}`, {
        headers: this.headers()
      });
      if (!response.ok) return;
      const body = await response.json();
      if (body && body.task) this.setState({ worker: body.task });
    } catch (error) {
      console.debug('[SENSEMAKER:TASK]', 'Worker status unavailable');
    }
  }

  async post (action) {
    if (!this.props.taskId) return;
    this.setState({ pending: true });
    try {
      const response = await fetch(`/tasks/${encodeURIComponent(this.props.taskId)}/work`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ action: action })
      });
      const body = await response.json().catch(() => ({}));
      if (body && body.worker) this.setState({ worker: body.worker });
      if (this.props.poll !== false) await this.refresh();
      if (typeof this.props.onChange === 'function') this.props.onChange(body && body.worker);
    } catch (error) {
      console.debug('[SENSEMAKER:TASK]', 'Worker control failed', error);
    } finally {
      this.setState({ pending: false });
    }
  }

  play () {
    return this.post('play');
  }

  pause () {
    return this.post('pause');
  }

  render () {
    const worker = this.state.worker || this.props.worker || { state: 'idle', label: 'Idle' };
    const complete = worker.state === 'complete' || !!this.props.completed;
    const working = worker.state === 'working';
    const paused = worker.state === 'paused';
    const pending = this.state.pending;
    const note = worker.progressNote ? String(worker.progressNote).slice(0, 400) : '';

    return (
      <div className='background-worker-status' style={{ margin: '0.75em 0 1em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em', flexWrap: 'wrap' }}>
          <Button.Group>
            <Button
              icon
              title='Start background work'
              disabled={complete || working || pending}
              loading={pending && !paused}
              onClick={this.play}
            >
              <Icon name='play' />
            </Button>
            <Button
              icon
              title='Pause background work'
              disabled={complete || paused || pending}
              onClick={this.pause}
            >
              <Icon name='pause' />
            </Button>
          </Button.Group>
          <div>
            <strong>Background worker</strong>
            {' '}
            <Label size='small' color={working ? 'blue' : undefined}>{complete ? 'Complete' : worker.label}</Label>
            {worker.goalTitle ? <span> · Goal: {worker.goalTitle}</span> : null}
            {worker.lastProgressAt && !working ? (
              <span> · last progress {toRelativeTime(worker.lastProgressAt)}</span>
            ) : null}
          </div>
        </div>
        {note && !complete ? <p style={{ margin: '0.5em 0 0' }}>{note}</p> : null}
      </div>
    );
  }
}

module.exports = BackgroundWorkerStatus;
