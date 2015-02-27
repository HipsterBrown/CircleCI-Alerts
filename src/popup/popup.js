// document.addEventListener('DOMContentLoaded', function(){
//   chrome.extension.getBackgroundPage().init();
// });


var D = React.DOM;

var App = React.createClass({
  render: function(){
    return D.div({
      className: "app"
    }, [
      D.h1({
        className: "app-header"
      }, "Hello Users!"),
      D.p({
        className: "app-shoutout"
      }, "What a great description!")
    ]);
  }
});

React.render(React.createElement(App, null), document.getElementById("mainPopup"));
