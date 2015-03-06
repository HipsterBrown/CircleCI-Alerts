// document.addEventListener('DOMContentLoaded', function(){
//   chrome.extension.getBackgroundPage().init();
// });

var baseUrl = "https://circleci.com/api/v1/";

var fetchMe = fetch(baseUrl + "me", {
  method: "get",
  headers: {
    "Accept": "application/json"
  }
})
.then(function(response){
  return response.json();
})
.catch(function(err){
  console.warn(err);
});

var fetchProjects = fetch(baseUrl + "projects", {
  method: "get",
  headers: {
    "Accept": "application/json"
  }
})
.then(function(response){
  return response.json();
})
.catch(function(err){
  console.warn(err);
});

var D = React.DOM;

var BranchList = React.createClass({
  matchMe: function(logins, me) {
    return logins.some(function(login){
      return login === me;
    });
  },
  getBranches: function(){
    var self = this;
    var branches = [];

    for (var branch in this.props.branches) {

      if ( this.props.branches.hasOwnProperty(branch) ){
        var branchObj = this.props.branches[branch];

        if(branchObj.hasOwnProperty("pusher_logins")) {
          var logins = branchObj.pusher_logins;
          var me = self.props.me;

          if( self.matchMe(logins, me) ) {
            branches.push(
              D.li({
                className: "branch"
              }, decodeURIComponent(branch) )
            );
          }

        }

      }

    }

    return branches;
  },
  render: function(){
    var branches = this.getBranches();
    return D.ul({
      className: "branch-list"
    }, branches);
  }
});

var ProjectList = React.createClass({
  render: function(){
    return D.ul({
      className: "project-list"
    }, this.props.projects.map(function(project){
      return D.li({
        className: "project"
      }, [
        D.p({}, project.reponame + " has many branches."),
        React.createElement(BranchList, {
          branches: project.branches,
          me: this.props.me
        })
      ]);
    }, this));
  }
});

var App = React.createClass({
  render: function(){
    return D.div({
      className: "app"
    }, [
      D.h1({
        className: "app-header"
      }, "Hello " + this.props.me.name + "!"),
      D.img({
        className: "user-img",
        src: this.props.me.avatar_url
      }),
      D.h2({}, "Your Projects"),
      React.createElement(ProjectList, {
        projects: this.props.projects,
        me: this.props.me.login
      })
    ]);
  }
});

Promise.all([fetchMe, fetchProjects])
.then(function(values){
  console.log(values[0]);
  React.render(React.createElement(App, {
    me: values[0],
    projects: values[1]
  }), document.getElementById("mainPopup"));
})
.catch(function(err){
  console.warn(err);
});
