const React = require('react');
const marked = require('marked');

class Typewriter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayedText: '',
      currentIndex: 0
    };
  }

  componentDidMount() {
    this.typeText();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.text !== this.props.text) {
      this.setState({ displayedText: '', currentIndex: 0 }, this.typeText);
    }
  }

  typeText = () => {
    const { text } = this.props;
    const { currentIndex } = this.state;

    if (currentIndex < text.length) {
      this.setState({
        displayedText: text.substring(0, currentIndex + 1),
        currentIndex: currentIndex + 1
      }, () => {
        setTimeout(this.typeText, 25); // Adjust typing speed here
      });
    }
  };

  render() {
    return <span dangerouslySetInnerHTML={{ __html: marked.parse(this.state.displayedText) }} />;
  }
}

module.exports = Typewriter;
