'use strict';

const React = require('react');

class FadeTransition extends React.Component {
  constructor(props) {
    super(props);
    this.state = { fade: 'in' };
    this.ref = React.createRef();
  }

  componentDidUpdate (prevProps) {
    if (prevProps.children !== this.props.children) {
      this.setState({ fade: 'out' }, () => {
        setTimeout(() => {
          this.setState({ fade: 'in' });
        }, 1500); // match fadeOut duration
      });
    }
  }

  render () {
    const { fade } = this.state;
    return (
      <div className={fade === 'in' ? 'fade-in' : 'fade-out'} ref={this.ref} style={{ height: '100%' }}>
        {this.props.children}
      </div>
    );
  }
}