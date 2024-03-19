'use strict';

const marked = require('marked');

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Header,
  Label,
  Segment
} = require('semantic-ui-react');

// const QueryForm = require('./QueryForm');
// const Feed = require('./Feed');

const formatDate = require('../contracts/formatDate');

class DocumentView extends React.Component {

  componentDidMount() {
    const { id } = this.props;
    this.props.fetchDocument(id);

  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.props.fetchDocument(this.props.id);
    }

  }

  render() {
    const { documents } = this.props;

    console.log(documents);

    return (
      <Segment className='col-center' style={{ height: '97vh' }} loading={documents.loading}>
        <Segment fluid className='case-info' style={{ width: '100%' }}>
          <Header as='h2'>{documents.document.title}</Header>
          <Label.Group>
            <Label icon='calendar'>Created at: {formatDate(documents.document.created_at)}</Label>
            <Label icon='calendar'>Modified at: {formatDate(documents.document.created_at)}</Label>
          </Label.Group>
          <div dangerouslySetInnerHTML={{ __html: marked.parse(documents.document.description || '') }} />
        </Segment>
      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Chat(props) {
  const { id } = useParams();
  return <DocumentView id={id} {...props} />;
}

module.exports = Chat;
