'use strict';

const React = require('react');

const {
  Header,
  Card,
  CardContent,
  CardDescription,
  Segment,
} = require('semantic-ui-react');

class InfoSidebarDocument extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
    };
  }

  formatDateTime = (dateTimeStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  render() {
    const { documentInfo, documentSections } = this.props;

    return (
      <section className='info-sidebar center-elements-column'>
        <Card className='info-file-card' style={{ paddingBottom: '1.5em', height: !documentInfo.file_id? '100%' : 'auto', width: '100%' }}>
          <CardContent header={documentInfo.title} style={{ paddingBottom: '0' }}>
          </CardContent>
          <CardContent style={{ paddingTop: '0.5em', marginBottom: '1.5em' }}>
            {this.props.matterTitle && (
              <CardDescription>
                <strong>Matter:</strong> {this.props.matterTitle}
              </CardDescription>
            )}
            <CardDescription>
              <strong>Created:</strong> {this.formatDateTime(documentInfo.created_at)}
            </CardDescription>
            <CardDescription>
              <strong>Modified:</strong> {this.formatDateTime(documentInfo.updated_at)}
            </CardDescription>
          </CardContent>
        </Card>
        {!documentInfo.file_id && (
          <Segment id='document-editor'>
            <section style={{ marginBottom: '1em' }}>
              <div className='drafter-section-title' style={{ display: 'flex', justifyContent: 'center' }}>
                <Header as='h2' textAlign='center' style={{ marginBottom: 0 }}>{documentInfo.title}</Header>
              </div>
            </section>
            {documentSections && documentSections.length > 0 &&
              documentSections.map((instance) =>
                <section>
                  <article>
                    <Header as='h3' style={{ marginTop: '1em' }}>{instance.title}</Header>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'black' }}>{instance.content}</div>
                  </article>
                </section>
              )
            }
          </Segment>
        )}
        {documentInfo.file_id && (
          <iframe
            src={`${window.location.protocol}//${window.location.hostname}:${window.location.port}/files/serve/${documentInfo.file_id}`}
            className='document-frame'
          ></iframe>
        )}
      </section>
    )
  };
}

module.exports = InfoSidebarDocument;
