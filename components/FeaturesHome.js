'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

const {
  Container,
  Grid,
  Header,
  Icon,
  Segment
} = require('semantic-ui-react');

const HeaderBar = require('./HeaderBar');

class FeaturesHome extends React.Component {
  render () {
    return (
      <sensemaker-features-home className='fade-in'>
        <style>
          {`
            sensemaker-features-home {
              display: block;
              --feat-fg: rgba(255, 255, 255, 0.95);
              --feat-muted: rgba(255, 255, 255, 0.78);
              --feat-dim: rgba(255, 255, 255, 0.52);
              --feat-panel: rgba(255, 255, 255, 0.06);
              --feat-border: rgba(255, 255, 255, 0.12);
            }
            html, body {
              background-color: #1b1c1d;
              color: var(--feat-fg);
            }
            sensemaker-features-home .brand {
              color: #ffffff;
            }
            sensemaker-features-home .feat-hero-lead {
              color: var(--feat-muted);
              font-size: 1.25rem;
              line-height: 1.65;
              max-width: 36em;
            }
            sensemaker-features-home .feat-section-label {
              text-transform: uppercase;
              letter-spacing: 0.12em;
              font-size: 0.75rem;
              color: var(--feat-dim);
              margin-bottom: 0.75rem;
            }
            sensemaker-features-home .feat-body {
              color: var(--feat-muted);
              line-height: 1.65;
              font-size: 1.05rem;
            }
            sensemaker-features-home .feat-card {
              background: var(--feat-panel) !important;
              border: 1px solid var(--feat-border) !important;
            }
            sensemaker-features-home .feat-card .header {
              color: var(--feat-fg) !important;
            }
            sensemaker-features-home .feat-tertiary {
              color: var(--feat-dim);
              font-size: 0.95rem;
              line-height: 1.6;
            }
            sensemaker-features-home .feat-hero-heading {
              color: var(--feat-fg);
              font-weight: 700;
              font-size: 2.5rem;
              margin-bottom: 1rem;
              line-height: 1.15;
            }
            sensemaker-features-home .feat-section-heading {
              color: var(--feat-fg);
              font-weight: 600;
              margin-bottom: 1rem;
            }
          `}
        </style>
        <Container style={{ marginTop: '2em' }}>
          <HeaderBar showBrand={true} showButtons={this.props.showLoginCta !== false} />
        </Container>

        <Container style={{ paddingTop: '4rem', paddingBottom: '3rem' }}>
          <div className='feat-section-label'>Personal intelligence</div>
          <h1 className='feat-hero-heading'>
            Your topics, your corpus, your conclusions
          </h1>
          <p className='feat-hero-lead'>
            Sensemaker is built for one job first: helping <strong style={{ color: 'var(--feat-fg)' }}>you</strong> turn scattered
            information into usable judgment. Name what matters, pull in sources, keep a durable record of what you learned,
            and ask questions against <em>your</em> material—not a vendor’s generic model of the world.
          </p>
          <Link to='/inquiries' className='ui huge primary button' style={{ marginTop: '1.25rem' }}>
            Get started
            <Icon name='arrow right' style={{ marginLeft: '0.35em' }} />
          </Link>
        </Container>

        <Container style={{ paddingBottom: '4rem' }}>
          <Grid stackable columns={3}>
            <Grid.Column>
              <Segment className='feat-card'>
                <Header as='h3' icon>
                  <Icon name='search' />
                  <Header.Content>
                    Collect on what you care about
                    <Header.Subheader className='feat-body' style={{ marginTop: '0.75rem' }}>
                      Track subjects of interest, ingest documents and feeds, and build a private library you can search
                      and revisit—organized around your questions, not someone else’s feed algorithm.
                    </Header.Subheader>
                  </Header.Content>
                </Header>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment className='feat-card'>
                <Header as='h3' icon>
                  <Icon name='history' />
                  <Header.Content>
                    Context that accumulates
                    <Header.Subheader className='feat-body' style={{ marginTop: '0.75rem' }}>
                      The system is shaped by your history: prior chats, stored facts, and the corpus you curate. That continuity
                      is what turns a chatbot into a <strong style={{ color: 'var(--feat-fg)' }}>personal</strong> intelligence
                      tool—tuned to your work, your vocabulary, your priorities.
                    </Header.Subheader>
                  </Header.Content>
                </Header>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment className='feat-card'>
                <Header as='h3' icon>
                  <Icon name='chart line' />
                  <Header.Content>
                    Analyze, don’t just summarize
                    <Header.Subheader className='feat-body' style={{ marginTop: '0.75rem' }}>
                      Go from raw material to structured views: compare sources, trace themes, and produce reports you can
                      stand behind—because the evidence lives in <em>your</em> node, under <em>your</em> control.
                    </Header.Subheader>
                  </Header.Content>
                </Header>
              </Segment>
            </Grid.Column>
          </Grid>
        </Container>

        <Container style={{ paddingBottom: '4rem' }}>
          <div className='feat-section-label'>Self-hosted, serious-grade platform</div>
          <h2 className='feat-section-heading' style={{ fontSize: '1.75rem' }}>
            Custody and deployment for high-stakes work
          </h2>
          <p className='feat-body' style={{ maxWidth: '40em', marginBottom: '1.5rem' }}>
            Run Sensemaker where <strong style={{ color: 'var(--feat-fg)' }}>you</strong> operate: on hardware you control,
            with policies you define. The same architecture that supports individual sensemaking scales to teams and
            organizations that need government-class discipline around data residency, provenance, and operational ownership—
            without renting intelligence from a shared SaaS tenant pool.
          </p>
          <p className='feat-body' style={{ maxWidth: '40em' }}>
            You choose what leaves the perimeter, what is retained, and how models are applied. The platform is designed
            for environments where &quot;trust the cloud&quot; is not an acceptable substitute for accountability.
          </p>
        </Container>

        <Container style={{ paddingBottom: '5rem' }}>
          <Segment raised className='feat-card' style={{ background: 'rgba(0,0,0,0.25) !important' }}>
            <div className='feat-section-label'>Also available</div>
            <p className='feat-tertiary' style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--feat-muted)' }}>Offline-first operation</strong>
              {' — '}run without depending on always-on third-party APIs; keep working when links go cold.
            </p>
            <p className='feat-tertiary' style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--feat-muted)' }}>Bitcoin and participation economics</strong>
              {' — '}optional hooks for value exchange when you want them; not the product thesis.
            </p>
            <p className='feat-tertiary' style={{ marginBottom: 0 }}>
              These sit alongside the core story—they do not define it.
            </p>
          </Segment>
        </Container>

        <Container textAlign='center' style={{ paddingBottom: '3rem' }}>
          <p className='feat-tertiary'>
            Support development:{' '}
            <a href='bitcoin:3PJK4NTk9d1UFcRfZc9v87Dp2qS5eqRUTJ' style={{ color: 'var(--feat-muted)' }}>
              3PJK4NTk9d1UFcRfZc9v87Dp2qS5eqRUTJ
            </a>
          </p>
        </Container>
      </sensemaker-features-home>
    );
  }
}

module.exports = FeaturesHome;
