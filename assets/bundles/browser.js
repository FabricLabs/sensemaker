/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!****************************!*\
  !*** ./scripts/browser.js ***!
  \****************************/
__webpack_require__.r(__webpack_exports__);
Object(function webpackMissingModule() { var e = new Error("Cannot find module '@fabric/http/components/FabricChatBar'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
// Dependencies
// import * as React from 'react';
// import { createRoot } from 'react-dom/client';

// Components
// import Sensemaker from '../components/Sensemaker';


// Settings
const settings = {
  currency: 'BTC'
};

// Main Process Definition
async function main(input = {}) {
  console.log('[SENSEMAKER:BROWSER] main() executing...');
  customElements.define('fabric-chat-bar', Object(function webpackMissingModule() { var e = new Error("Cannot find module '@fabric/http/components/FabricChatBar'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
  window.addEventListener('load', async () => {
    console.log('loaded!');
    const container = document.getElementById('fabric-application-root');
    // const root = createRoot(container);

    const chatbar = document.createElement('fabric-chat-bar');
    chatbar.style = 'position: absolute; bottom: 1em;';
    container.append(chatbar);

    // root.render(<Sensemaker state={input} />);
  });

  return {
    // react: { root }
  };
}

// Run Main Process
main(settings).catch(exception => {
  console.error('[SENSEMAKER:BROWSER] Main Process Exception:', exception);
}).then(output => {
  console.log('[SENSEMAKER:BROWSER] Main Process Output:', output);
});
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsIm1hcHBpbmdzIjoiOztVQUFBO1VBQ0E7Ozs7O1dDREE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7O0FDTkE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDdUU7O0FBRXZFO0FBQ0EsTUFBTUMsUUFBUSxHQUFHO0VBQ2ZDLFFBQVEsRUFBRTtBQUNaLENBQUM7O0FBRUQ7QUFDQSxlQUFlQyxJQUFJQSxDQUFFQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7RUFDL0JDLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLDBDQUEwQyxDQUFDO0VBRXZEQyxjQUFjLENBQUNDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRVIsb0tBQWEsQ0FBQztFQUV2RFMsTUFBTSxDQUFDQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsWUFBWTtJQUMxQ0wsT0FBTyxDQUFDQyxHQUFHLENBQUMsU0FBUyxDQUFDO0lBRXRCLE1BQU1LLFNBQVMsR0FBR0MsUUFBUSxDQUFDQyxjQUFjLENBQUMseUJBQXlCLENBQUM7SUFDcEU7O0lBRUEsTUFBTUMsT0FBTyxHQUFHRixRQUFRLENBQUNHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQztJQUV6REQsT0FBTyxDQUFDRSxLQUFLLEdBQUcsa0NBQWtDO0lBRWxETCxTQUFTLENBQUNNLE1BQU0sQ0FBQ0gsT0FBTyxDQUFDOztJQUV6QjtFQUNGLENBQUMsQ0FBQzs7RUFFRixPQUFPO0lBQ0w7RUFBQSxDQUNEO0FBQ0g7O0FBRUE7QUFDQVgsSUFBSSxDQUFDRixRQUFRLENBQUMsQ0FBQ2lCLEtBQUssQ0FBRUMsU0FBUyxJQUFLO0VBQ2xDZCxPQUFPLENBQUNlLEtBQUssQ0FBQyw4Q0FBOEMsRUFBRUQsU0FBUyxDQUFDO0FBQzFFLENBQUMsQ0FBQyxDQUFDRSxJQUFJLENBQUVDLE1BQU0sSUFBSztFQUNsQmpCLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLDJDQUEyQyxFQUFFZ0IsTUFBTSxDQUFDO0FBQ2xFLENBQUMsQ0FBQyxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vc2Vuc2VtYWtlci93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9zZW5zZW1ha2VyL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vc2Vuc2VtYWtlci8uL3NjcmlwdHMvYnJvd3Nlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGUgcmVxdWlyZSBzY29wZVxudmFyIF9fd2VicGFja19yZXF1aXJlX18gPSB7fTtcblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gRGVwZW5kZW5jaWVzXG4vLyBpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG4vLyBpbXBvcnQgeyBjcmVhdGVSb290IH0gZnJvbSAncmVhY3QtZG9tL2NsaWVudCc7XG5cbi8vIENvbXBvbmVudHNcbi8vIGltcG9ydCBTZW5zZW1ha2VyIGZyb20gJy4uL2NvbXBvbmVudHMvU2Vuc2VtYWtlcic7XG5pbXBvcnQgKiBhcyBGYWJyaWNDaGF0QmFyIGZyb20gJ0BmYWJyaWMvaHR0cC9jb21wb25lbnRzL0ZhYnJpY0NoYXRCYXInO1xuXG4vLyBTZXR0aW5nc1xuY29uc3Qgc2V0dGluZ3MgPSB7XG4gIGN1cnJlbmN5OiAnQlRDJ1xufTtcblxuLy8gTWFpbiBQcm9jZXNzIERlZmluaXRpb25cbmFzeW5jIGZ1bmN0aW9uIG1haW4gKGlucHV0ID0ge30pIHtcbiAgY29uc29sZS5sb2coJ1tTRU5TRU1BS0VSOkJST1dTRVJdIG1haW4oKSBleGVjdXRpbmcuLi4nKTtcblxuICBjdXN0b21FbGVtZW50cy5kZWZpbmUoJ2ZhYnJpYy1jaGF0LWJhcicsIEZhYnJpY0NoYXRCYXIpO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdsb2FkZWQhJyk7XG5cbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmFicmljLWFwcGxpY2F0aW9uLXJvb3QnKTtcbiAgICAvLyBjb25zdCByb290ID0gY3JlYXRlUm9vdChjb250YWluZXIpO1xuXG4gICAgY29uc3QgY2hhdGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ZhYnJpYy1jaGF0LWJhcicpO1xuXG4gICAgY2hhdGJhci5zdHlsZSA9ICdwb3NpdGlvbjogYWJzb2x1dGU7IGJvdHRvbTogMWVtOyc7XG5cbiAgICBjb250YWluZXIuYXBwZW5kKGNoYXRiYXIpO1xuXG4gICAgLy8gcm9vdC5yZW5kZXIoPFNlbnNlbWFrZXIgc3RhdGU9e2lucHV0fSAvPik7XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgLy8gcmVhY3Q6IHsgcm9vdCB9XG4gIH1cbn1cblxuLy8gUnVuIE1haW4gUHJvY2Vzc1xubWFpbihzZXR0aW5ncykuY2F0Y2goKGV4Y2VwdGlvbikgPT4ge1xuICBjb25zb2xlLmVycm9yKCdbU0VOU0VNQUtFUjpCUk9XU0VSXSBNYWluIFByb2Nlc3MgRXhjZXB0aW9uOicsIGV4Y2VwdGlvbik7XG59KS50aGVuKChvdXRwdXQpID0+IHtcbiAgY29uc29sZS5sb2coJ1tTRU5TRU1BS0VSOkJST1dTRVJdIE1haW4gUHJvY2VzcyBPdXRwdXQ6Jywgb3V0cHV0KTtcbn0pO1xuIl0sIm5hbWVzIjpbIkZhYnJpY0NoYXRCYXIiLCJzZXR0aW5ncyIsImN1cnJlbmN5IiwibWFpbiIsImlucHV0IiwiY29uc29sZSIsImxvZyIsImN1c3RvbUVsZW1lbnRzIiwiZGVmaW5lIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImNvbnRhaW5lciIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJjaGF0YmFyIiwiY3JlYXRlRWxlbWVudCIsInN0eWxlIiwiYXBwZW5kIiwiY2F0Y2giLCJleGNlcHRpb24iLCJlcnJvciIsInRoZW4iLCJvdXRwdXQiXSwic291cmNlUm9vdCI6IiJ9