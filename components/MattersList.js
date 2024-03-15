'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Button,
  Divider,
  Menu
} = require('semantic-ui-react');

class MattersList extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      loading: false,
    };
  }

  componentDidMount() {
    this.props.fetchMatters();
  }

  componentDidUpdate(prevProps) {
    const { matters } = this.props;
    if (prevProps.matters !== matters) {
      // if (!matters.loading) {
      //   this.setState({ loading: false });
      // }
    }
  };


  render () {
    const { matters } = this.props;
    const { loading } = this.state;

    const linkStyle = {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: 'block',
      maxWidth: '92%',
      color: '#e4dfda',
      textAlign: 'left',
    };

    return (
      <div >
        <h4 style={{ marginBottom: '0' }}>
          <div>
            <Menu.Item as={Link} to="/matters/new">
              <div style={{ display: 'flex' }}>
                <Button fluid inverted>
                  <p style={linkStyle}>
                    + New Matter
                  </p>
                </Button>
              </div>
            </Menu.Item>
          </div>
        </h4>
        {matters && matters.matters && matters.matters
          .map(instance => {
            return (<>
              <Menu.Item as={Link} to={"/matters/" + instance.id} >
                <Link to={"/matters/" + instance.id} style={linkStyle}>
                  {instance.title}
                </Link>
              </Menu.Item>
            </>
            )
          })}
      </div>
    );
  }


  _toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML() {
    return this._toHTML();
  }
}

module.exports = MattersList;
