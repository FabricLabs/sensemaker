'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

const {
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Header,
  Icon,
  Segment
} = require('semantic-ui-react');

const HeaderBar = require('./HeaderBar');

class FeaturesHome extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    return (
      <sensemaker-features-home class='fade-in'>
        <style>
          {`
            html, body {
              background-color: #1b1c1d;
              color: #ffffff;
            }

            .brand {
              color: #ffffff;
            }
          `}
        </style>
        <Container style={{ marginTop: '2em' }}>
          <HeaderBar showBrand={true} showButtons={true} />
        </Container>
        <Container inverted vertical style={{ background: 'none !important', padding: '8em 0' }}>
          <div class="ui text container">
            <h1 class="ui inverted header" style={{ textTransform: 'none !important' }}>Private AI for Everyone.</h1>
            <p style={{ textTransform: 'none !important' }}>Sensemaker is an <abbr title="Your data, your rules.">offline-first</abbr> personal assistant with AI superpowers.</p>
            <Link to="/inquiries" className="ui huge primary button">Get Started <i class="right arrow icon"></i></Link>
          </div>
        </Container>
        <Container inverted text style={{ marginTop: '4em' }}>
          <Header inverted>Intelligence Gathering</Header>
          <p>Set something as a subject of interest and automatically aggregate both historical and real-time information related to the topic.  Browse and analyze the collected materials using robust, offline-first reports — even if the source goes offline, your copy remains.</p>
        </Container>
        <Container inverted text style={{ marginTop: '4em' }}>
          <Header inverted>Comprehensive Context</Header>
          <p>SENSEMAKER uses its entire history of interactions with the user to personalize each experience, typically leading to high-quality results from the processing pipeline.</p>
        </Container>
        <Container inverted text style={{ marginTop: '4em' }}>
          <Header inverted>"Fine-Tunable" at Will</Header>
          <p>As your relationship with SENSEMAKER grows, you are granted access to a database of "memories" that contribute to its personality.  Modify, or remove, that information as you see fit — as we janitors like to say; garbage in, garbage out.</p>
        </Container>
        {/* <Container text>
          <Card fluid style={{ clear: 'both', marginTop: '4em' }}>
            <Card.Content extra>
              <a><Icon name='eye' /> OVERVIEW</a>
            </Card.Content>
            <Card.Content style={{ color: '#000' }}>
              <Container style={{ fontSize: '1.2em' }}>
                <p>Sensemaker is a <strong>personal intelligence platform</strong>, designed to operate entirely without the need for Internet access or third-party service providers.</p>
                <p><strong>Preserve your privacy</strong> by running your own AI, with your own data, using your own rules.</p>
              </Container>
            </Card.Content>
            <Card.Content extra>
              <a><Icon name='linkify' /><code>c0d3b33f</code></a>
            </Card.Content>
          </Card>
        </Container> */}
        {/* <Container>
          <Card fluid style={{ clear: 'both', marginTop: '8em' }}>
            <Card.Content extra>
              <a><Icon name='file' /> DETAIL</a>
            </Card.Content>
            <Card.Content style={{ color: '#000' }}>
              <Container>
                <Header as='h2'>What does it do?</Header>
                <p>Sensemaker is a <strong>personal assistant</strong>, designed to help you manage your life and work.</p>
                <p>Analyze files, draft documents, and answer questions using a powerful AI engine.  All data stays with you, and is never shared without your consent.</p>
                <Divider />
                <Header as='h2'>Powerful Plugins</Header>
                <p>Connect to and consume data from a variety of sources with <strong>optional plugins</strong> designed for common providers.</p>
                <Divider />
                <Header as='h2'>Your data, your rules.</Header>
                <p>Sensemaker is designed to operate entirely without the need for Internet access. Your data is stored locally, and you have complete control over how it is used.</p>
                <Divider />
                <Header as='h2'>Accumulate Bitcoin</Header>
                <p>When idle, your assistant can assist other users in exchange for Bitcoin.</p>
                <Divider />
                <Header as='h2'>Open Source</Header>
                <p>Sensemaker is open source, and we welcome contributions from the community.</p>
              </Container>
            </Card.Content>
            <Card.Content extra>
              <a><Icon name='linkify' /><code>d34db4b3</code></a>
            </Card.Content>
          </Card>
        </Container> */}
        <div style={{ marginBottom: '4em', background: 'none !important' }}>
          <div class="ui middle aligned stackable grid container">
            <div class="row">
              <div class="eight wide column"></div>
              <div class="six wide right floated column"></div>
            </div>
            <div class="row">
              <div class="center aligned column">
                <small><a href="bitcoin:3PJK4NTk9d1UFcRfZc9v87Dp2qS5eqRUTJ">3PJK4NTk9d1UFcRfZc9v87Dp2qS5eqRUTJ</a></small>
              </div>
            </div>
          </div>
        </div>
      </sensemaker-features-home>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = FeaturesHome;
