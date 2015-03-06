// chrome.alarms.create('notificationAlarm', {
//   when: 1,
//   periodInMinutes: 1
// });
//
// chrome.alarms.onAlarm.addListener(function(alarm){
//   console.log(alarm.name + " fired every " + alarm.scheduledTime);
//   chrome.notifications.create(new Date().toTimeString(), {
//     type: "basic",
//     iconUrl: "../../icons/icon128.png",
//     title: "Latest Notication",
//     message: "This is the latest update notification from the event page. " + new Date().toTimeString()
//   }, function(id){
//     console.log(id);
//   });
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

var Branch = React.createClass({
  displayName: 'Branch',
  getClasses: function(){
    var classArr = ['branch'];

    if(this.props.data.running_builds.length) {
      classArr.push('running');
    } else {
      classArr.push(this.props.data.recent_builds[0].outcome);
    }

    return classArr.join(' ');
  },
  render: function(){
    var classes = this.getClasses();

    return D.li({
      className: classes
    }, this.props.name);
  }
});

var BranchList = React.createClass({
  displayName: 'BranchList',
  matchMe: function(logins, me) {
    return logins.some(function(login){
      return login === me;
    });
  },
  getBranches: function(){
    var self = this;
    var tempBranches = [];
    var branches = [];

    for (var branch in this.props.branches) {

      if ( this.props.branches.hasOwnProperty(branch) ){
        var branchObj = this.props.branches[branch];
        branchObj.name = decodeURIComponent(branch);

        if(branchObj.hasOwnProperty("pusher_logins")) {
          var logins = branchObj.pusher_logins;
          var me = self.props.me;

          if( self.matchMe(logins, me) ) {
            tempBranches.push(branchObj);
          }

        }

      }

    }

    tempBranches.sort(function(a, b){
      return new Date(b.recent_builds[0].pushed_at) - new Date(a.recent_builds[0].pushed_at);
    });

    tempBranches.forEach(function(branch){
      branches.push(
        React.createElement(Branch, {
          data: branch,
          name: branch.name
        })
      );
    });

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
  displayName: 'ProjectList',
  render: function(){
    return D.ul({
      className: "project-list"
    }, this.props.projects.map(function(project){
      return D.li({
        className: "project"
      }, [
        D.p({}, project.reponame + " has many branches. Here are yours:"),
        React.createElement(BranchList, {
          branches: project.branches,
          me: this.props.me
        })
      ]);
    }, this));
  }
});

var App = React.createClass({
  displayName: 'App',
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

var init = function(doc){
  Promise.all([fetchMe, fetchProjects])
  .then(function(values){
    React.render(React.createElement(App, {
      me: values[0],
      projects: values[1]
    }), doc.getElementById("mainPopup"));

  })
  .catch(function(err){
    console.warn(err);
  });
};
