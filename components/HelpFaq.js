'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const { faqOptions } = require('./HelpFaqInfo');
const marked = require('marked');

const {
  Segment,
  Button,
  Icon,
  Menu,
  Label
} = require('semantic-ui-react');
const HelpChat = require('./HelpChat');


class HelpFaq extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      openOption: false,
      optionTitle: null,
      optionContent: null,
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    if (prevProps.help != this.props.help) {
      // console.log(this.props.help);
    }
    if (prevProps.showFaqMenu != this.props.showFaqMenu) {
      // console.log(this.props.help);
      this.setState({openOption: !this.props.showFaqMenu});
    }
  }

  formatDateTime(dateTimeStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  closeHelpChat = () => {
  }

  render() {
    const { help } = this.props;
    const { openOption, optionContent, optionTitle } = this.state;

    return (
      <Segment fluid
        style={{ width: '100%', height: '100%', color: 'black', display: 'flex' }}
      >
        {!openOption ? (
          <div className='col-center' style={{width: '100%'}}>
            <section style={{ flex: 1, overflowY: 'auto', width: '100%', maxWidth: '100%' }}>
              <h3 style={{ textAlign: 'center', textTransform: 'inherit' }}>Quick Help Guide</h3>
              <Menu vertical fluid id='faq-themes' >
                {faqOptions.map((instance) => (
                  <Menu.Item
                    key={instance.id}
                    onClick={() => {this.setState({ openOption: true, optionTitle: instance.title, optionContent: instance.content }); this.props.toggleFaqMenu()}}
                  // style={{ display: 'flex', flexDirection: 'row', gap: '1em', alignItems: 'center' }}
                  >
                    <h4>{instance.title}</h4>
                  </Menu.Item>
                ))}
              </Menu>
            </section>
            <Button primary content='Chat with an assistant' style={{ flex: '0 0 auto', marginTop: '1em' }} onClick={() => this.props.openHelpChat()} />
          </div>
        ) : (
          <section>
            <Button icon style={{ backgroundColor: 'transparent', paddingLeft: '0' }} onClick={() => {this.setState({ openOption: false, optionTitle: null, optionContent: null }); this.props.toggleFaqMenu()}}>
              <Icon name='chevron left' />
            </Button>
            <h3 style={{ marginTop: '0', textAlign: 'center', textTransform: 'inherit' }}>{optionTitle}</h3>
            <div style={{ padding: '0em 0.5em 2em 0.5em' }}>
              <span dangerouslySetInnerHTML={{ __html: marked.parse(optionContent), }} />
            </div>
          </section>
        )}
      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = HelpFaq;
