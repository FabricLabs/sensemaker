const {Slide} = require('react-toastify');

const helpMessageToastEmitter = {
  position: "bottom-center",
  autoClose: 5000,
  icon: "🗨️",
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  transition: Slide,
};

module.exports = {helpMessageToastEmitter,};