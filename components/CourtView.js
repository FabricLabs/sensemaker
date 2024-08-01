'use strict';

const marked = require('marked');

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Card,
  Header,
  Label,
  Segment
} = require('semantic-ui-react');

// const QueryForm = require('./QueryForm');
// const Feed = require('./Feed');

const formatDate = require('../contracts/formatDate');

class CourtView extends React.Component {

  componentDidMount() {
    const { slug } = this.props;
    console.log(slug);
    this.props.fetchCourt(slug);
  }

  render() {
    const { slug, error, courts } = this.props;
    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <fabric-container>
        <Segment fluid loading={courts.loading} className='court-info'>
          <Header as='h2'>{courts.current.short_name}</Header>
          <Label.Group>
            <Label icon='calendar'>{formatDate(courts.current.founded_date)}</Label>
            <Label icon='law'>{courts.current.name}</Label>
          </Label.Group>
          <div dangerouslySetInnerHTML={{ __html: marked.parse(courts.current.summary || '') }} />
          <div style={{ marginTop: '1em' }}>
            <Header as='h6'>Metadata</Header>
            <code>
              <pre>
                @id: {slug}
              </pre>
            </code>
          </div>
        </Segment>
      </fabric-container>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Court(props) {
  const { slug } = useParams();
  return <CourtView slug={slug} {...props} />;
}

module.exports = Court;
