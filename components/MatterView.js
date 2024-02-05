'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link, useParams } = require('react-router-dom');

const {
  Card,
  Segment,
  Header,
  Label,
  List,
  Loader,
  Icon,
  Button,
  Form,
  GridRow,
  GridColumn,
  Grid,
  Checkbox,
  Popup,
} = require('semantic-ui-react');

const MatterFileModal = require('./MatterFileModal');

class MatterView extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      loading: false,
      attachModalOpen: false,
      note: null,
      filename: null,
      addingContext: false,
    };
  }

  componentDidMount() {
    this.props.fetchMatter(this.props.id);
  }

  componentDidUpdate(prevProps) {
    const { matters } = this.props;
    if (prevProps.matters.current !== matters.current) {
      if (matters.current.file) {
        this.setState({ filename: matters.current.file })
      }
      if (matters.current.note) {
        this.setState({ note: matters.current.note })
      }
      if (matters.current.jurisdiction_id) {
        this.props.fetchJurisdiction(matters.current.jurisdiction_id);
      }
      if (matters.current.court_id) {
        this.props.fetchCourt(matters.current.court_id);
      }
    }
    if (prevProps.matters !== matters && !matters.loading) {
      if (this.state.addingContext) {
        //TO DO, HANDLING SITUATIONS
        console.log("el matter en la creacion",matters);
        if (matters.contextSuccess) {
          console.log("matter context added");
        } else {
          console.log("error adding context");
        }
        this.setState({ addingContext: false });
      }
    }
  };

  handleModalSubmit = (note, filename, file) => {
    console.log("Note:", note, "Files:", file);
    const id = this.props.id;

    //TO DO: STORE THE FILE SOMEWHERE
    //the actual full file is in "file"

    if (filename) {
      this.setState({ filename: filename });
    }
    if (note) {
      this.setState({ note: note });
    }

    this.setState({ attachModalOpen: false, addingContext: true });
    this.props.addContext(note, filename, id);
  };

  deleteFile = () => {
    this.setState({ filename: null });
    this.props.removeFile(this.props.id);
  }

  render() {
    const { matters, jurisdictions, courts } = this.props;
    const { current } = matters;

    return (
      <Segment loading={matters.loading || jurisdictions.loading || courts.loading} style={{ marginRight: '1em' }}>
        <Header as='h1'>{current.title}</Header>
        <section className='matter-details'>
          <Grid columns={2}>
            <GridRow>
              <GridColumn width={13} textAlign='center'>
                <Header as='h2'>Details</Header>
              </GridColumn>
              <GridColumn width={3}>
                <Header as='h4'>I'm representing:</Header>
              </GridColumn>
            </GridRow>
          </Grid>
          <Grid columns={3}>
            <GridRow>
              <GridColumn width={4} style={{ display: 'flex', alignItems: 'center' }}>
                <Header as='h3'>Plaintiff</Header>
              </GridColumn>
              <GridColumn width={10}>
                <Label>
                  <Header as='h4'>{current.plaintiff}</Header>
                </Label>
              </GridColumn>
              <GridColumn width={2} style={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox checked={current.representing === 'P' ? true : false} disabled />
              </GridColumn>
            </GridRow>
            <GridRow>
              <GridColumn width={4} style={{ display: 'flex', alignItems: 'center' }}>
                <Header as='h3'>Defendant</Header>
              </GridColumn>
              <GridColumn width={10}>
                <Label>
                  <Header as='h4'>{current.defendant}</Header>
                </Label>
              </GridColumn>
              <GridColumn width={2} style={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox checked={current.representing === 'D' ? true : false} disabled />
              </GridColumn>
            </GridRow>
            <GridRow>
              <GridColumn width={4} style={{ display: 'flex', alignItems: 'center' }}>
                <Header as='h3'>Jurisdiction</Header>
              </GridColumn>
              <GridColumn width={10}>
                <Label>
                  <Header as='h4'>{jurisdictions.current.name}</Header>
                </Label>
              </GridColumn>
              <GridColumn width={2} />
            </GridRow>
            <GridRow>
              <GridColumn width={4} style={{ display: 'flex', alignItems: 'center' }}>
                <Header as='h3'>Court</Header>
              </GridColumn>
              <GridColumn width={10}>
                <Label>
                  <Header as='h4'>{(current.court_id ? courts.current.name : 'none selected')}</Header>
                </Label>
              </GridColumn>
              <GridColumn width={2} />
            </GridRow>
            <GridRow>
              <GridColumn width={4} style={{ display: 'flex', alignItems: 'center' }}>
                <Header as='h3'>Description</Header>
              </GridColumn>
              <GridColumn width={10}>
                <Header as='h5'>{current.description}</Header>
              </GridColumn>
              <GridColumn width={2} />
            </GridRow>
          </Grid>
        </section>
        <section className='matter-details'>
          <Grid columns={2}>
            <GridRow>
              <GridColumn width={13} textAlign='center'>
                <Header as='h2'>Context
                  <Popup trigger={<Icon name='info circle' size='small' style={{ margin: '0 0  0.2em 0.5em', color: '#336699' }} />}>
                    <Popup.Content>
                      <p>You can add one additional note or one file about this Matter
                        to enhance the information available. This will enable Novo
                        to generate more accurate and relevant answers based on the extended details provided.</p>
                    </Popup.Content>
                  </Popup>
                </Header>
              </GridColumn>
              <GridColumn width={3} />
            </GridRow>
            {this.state.filename &&
              <GridRow>
                <GridColumn width={13} textAlign='center'>
                  <Label>{this.state.filename}</Label>
                </GridColumn>
                <GridColumn width={3} />
              </GridRow>
            }
            {this.state.note &&
              <GridRow>
                <GridColumn width={13} textAlign='center'>
                  <Header as='h5'>{this.state.note}</Header>
                </GridColumn>
                <GridColumn width={3} />
              </GridRow>
            }
            <GridRow>
              <GridColumn width={13} textAlign='center'>
                <Button
                  primary
                  content="+ Add File or Note"
                  onClick={() => this.setState({ attachModalOpen: true })}
                />
              </GridColumn>
              <GridColumn width={3} />
            </GridRow>
          </Grid>
          <MatterFileModal
            open={this.state.attachModalOpen}
            onClose={() => this.setState({ attachModalOpen: false })}
            onSubmit={this.handleModalSubmit}
            filename={this.state.filename}
            deleteFile={this.deleteFile}
            note={this.state.note}
          />
        </section>
        <Header as='h3' style={{ marginTop: '2em' }}><Link to={"/matters/"} >Back to Matters</Link></Header>
      </Segment>
    );
  }

  _toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML() {
    return this._toHTML();
  }
}

function MattView(props) {
  const { id } = useParams();
  return <MatterView id={id} {...props} />;
}
module.exports = MattView;