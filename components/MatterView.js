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
  Modal
} = require('semantic-ui-react');

class MatterView extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      loading: false,
      attachModalOpen: false,
    };
  }

  componentDidMount() {
    this.props.fetchMatter(this.props.id);
  }

  componentDidUpdate(prevProps) {
    const { matters } = this.props;
    if (prevProps.matters.current !== matters.current) {
      if (matters.current.jurisdiction_id) {
        this.props.fetchJurisdiction(matters.current.jurisdiction_id);
      }
      if (matters.current.court_id) {
        this.props.fetchCourt(matters.current.court_id);
      }
    }
  };


  render() {
    const { matters, jurisdictions, courts } = this.props;
    const { loading } = this.state;
    const { current } = matters;
    console.log("jurisdictions", jurisdictions);
    console.log("courts", courts);
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
              <GridColumn width={4} style={{display:'flex', alignItems:'center'}}>
                <Header as='h3'>Plaintiff</Header>
              </GridColumn>
              <GridColumn width={10}>
                <Label>
                  <Header as='h4'>{current.plaintiff}</Header>
                </Label>
              </GridColumn>
              <GridColumn width={2} style={{display:'flex', alignItems:'center'}}>
                <Checkbox checked={current.representing === 'P' ? true : false} disabled />
              </GridColumn>
            </GridRow>
            <GridRow>
              <GridColumn width={4} style={{display:'flex', alignItems:'center'}}>
                <Header as='h3'>Defendant</Header>
              </GridColumn>
              <GridColumn width={10}>
                <Label>
                  <Header as='h4'>{current.defendant}</Header>
                </Label>
              </GridColumn>
              <GridColumn width={2} style={{display:'flex', alignItems:'center'}}>
                <Checkbox checked={current.representing === 'D' ? true : false} disabled />
              </GridColumn>
            </GridRow>
            <GridRow>
              <GridColumn width={4} style={{display:'flex', alignItems:'center'}}>
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
              <GridColumn width={4} style={{display:'flex', alignItems:'center'}}>
                <Header as='h3'>Court</Header>
              </GridColumn>
              <GridColumn width={10}>
                <Label>
                  <Header as='h4'>{(current.court_id ? courts.current.name : 'none selected')}</Header>
                </Label>
              </GridColumn>
              <GridColumn width={2} />
            </GridRow>
          </Grid>
        </section>
        <section className='matter-details'>
        <Grid columns={2}>
            <GridRow>
              <GridColumn width={13} textAlign='center'>
                <Header as='h2'>Context</Header>
              </GridColumn>
              <GridColumn width={3} />
            </GridRow>
          </Grid>
          <Button 
            primary
            content="+ Add File or Note"
            onClick={()=> this.setState({attachModalOpen: true})}
          />
        </section>

        <Link to={"/matters/"}>Back to Matters </Link>
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