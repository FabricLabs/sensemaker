'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Breadcrumb,
  Button,
  Header,
  Icon,
  Segment
} = require('semantic-ui-react');

const toRelativeTime = require('../../functions/toRelativeTime');
const truncateMiddle = require('../../functions/truncateMiddle');

class GitHubHome extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      github: {},
      state: {
        github: {
          repositories: []
        }
      }
    }, props);


    // React State
    this.state = {
      ...this.settings.state
    };

    // Fabric State
    this._state = {
      github: {
        repositories: {}
      },
      content: this.settings.state
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchGitHubStats();
    this.watcher = setInterval(() => {
      this.props.fetchGitHubStats();
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  render () {
    const { github } = this.props;
    console.debug('[GITHUB]', 'Service:', github);
    return (
      <div>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/github'>GitHub</Link></Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={github?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='github alt' />GitHub</Header>
          <p>GitHub is a hosting platform for Git repositories.</p>
        </Segment>
        <Segment className='fade-in' loading={github?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h2'>Popular Repositories</Header>
          <ul>
            {github?.repositories?.map((doc, index) => {
              return (
                <li key={index}>
                  <Link to={`/services/github/repositories/${doc.id}`}>{doc.title}</Link> - {truncateMiddle(doc.content, 100)} - {toRelativeTime(doc.createdAt)}
                </li>
              );
            })}
          </ul>
        </Segment>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = GitHubHome;
