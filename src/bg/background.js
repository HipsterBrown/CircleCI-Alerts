chrome.alarms.create('notificationAlarm', {
  when: 1,
  periodInMinutes: 1
});

var baseUrl = "https://circleci.com/api/v1/";

var D = React.DOM;

var Branch = React.createClass({
  displayName: 'Branch',
  getInitialState: function(){
    return {
      running: false
    };
  },
  componentWillReceiveProps: function(nextProps){
    console.log(nextProps);
    if(nextProps.data.running_builds.length) {
      console.log("Build Running...", nextProps);
      this.setState({running: true});
    } else {
      this.setState({running: false});
    }
  },
  componentDidUpdate: function(prevProps, prevState){
    var self = this;
    console.log("Previous Build Running?", prevProps.data.running_builds);
    if (prevProps.data.running_builds.length) {
      console.log("Build over", self.props);
      switch(self.props.data.recent_builds[0].outcome) {
        case "success":
          self.notifySuccess(self.props.data.recent_builds[0]);
          break;
        case "failed":
          self.notifyFailed(self.props.data.recent_builds[0]);
          break;
        default:
          console.log("Something else happened:", self.props.data.recent_builds[0].outcome);
      }
    }
  },
  notifySuccess: function(data){
    var self = this;
    chrome.notifications.create(self.props.name, {
      type: "basic",
      iconUrl: "../../icons/success128.png",
      title: "Success!",
      message: "The tests for your latest build for the " + self.props.name + " branch have passed, so congrats!"
    }, function(id){
      console.log(id);
    });
    chrome.browserAction.setIcon({
      path: {
        '19': '../../icons/success19.png',
        '38': '../../icons/success38.png'
      }
    });
  },
  notifyFailed: function(data){
    var self = this;
    chrome.notifications.create(self.props.name, {
      type: "basic",
      iconUrl: "../../icons/failed128.png",
      title: "Failed Tests :(",
      message: "Looks like there was a failed test in the latest build for the " + self.props.name + " branch."
    }, function(id){
      console.log(id);
    });
    chrome.browserAction.setIcon({
      path: {
        '19': '../../icons/failed19.png',
        '38': '../../icons/failed38.png'
      }
    });
  },
  notifyBuild: function(data){
    var self = this;
    chrome.notifications.create(self.props.name, {
      type: "basic",
      iconUrl: "../../icons/running128.png",
      title: "New Running Build",
      message: "A new build has started for the " + self.props.name + " branch."
    }, function(id){
      console.log(id);
    });
    chrome.browserAction.setIcon({
      path: {
        '19': '../../icons/running19.png',
        '38': '../../icons/running38.png'
      }
    });
  },
  getClasses: function(){
    var classArr = ['branch'];

    if(this.props.data.running_builds.length) {
      classArr.push('running');
      this.notifyBuild(this.props.data.running_builds[0]);
      console.log('Running Build:', this.props.data.running_builds);
    } else {
      classArr.push(this.props.data.recent_builds[0].outcome);
    }

    return classArr.join(' ');
  },
  render: function(){
    var classes = this.getClasses();
    console.log(this.props.data);

    return D.li({
      className: classes
    }, [
      D.a({
        href: this.props.projectURL + '/' + this.props.data.recent_builds[0].build_num
      }, this.props.name)
    ]);
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
          name: branch.name,
          projectURL: self.props.url
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
        D.p({}, [
          D.a({
            href: "https://circleci.com/gh/" + project.username + "/" + project.reponame
          }, project.reponame + ":")
        ]),
        React.createElement(BranchList, {
          branches: project.branches,
          me: this.props.me,
          url: "https://circleci.com/gh/" + project.username + "/" + project.reponame
        })
      ]);
    }, this));
  }
});

var App = React.createClass({
  displayName: 'App',
  getInitialState: function(){
    return {
      me: {
        name: "Sir Rando",
        avatar_url: "http://placekitten.com/g/150/150"
      },
      projects: []
    };
  },
  componentDidMount: function(){
    this.fetchMe();
    this.fetchProjects();

    chrome.alarms.onAlarm.addListener(this.fetchProjects);
  },
  fetchMe: function(){
    var self = this;
    console.log("Fetching projects...");
    fetch(baseUrl + "me", {
      method: "get",
      headers: {
        "Accept": "application/json"
      }
    })
    .then(function(response){
      return response.json();
    })
    .then(function(json){
      self.setState({
        me: json
      });
    })
    .catch(function(err){
      console.warn(err);
    });
  },
  fetchProjects: function(){
    var self = this;

    fetch(baseUrl + "projects", {
      method: "get",
      headers: {
        "Accept": "application/json"
      }
    })
    .then(function(response){
      return response.json();
    })
    .then(function(json){
      self.setState({
        projects: json
      });
    })
    .catch(function(err){
      console.warn(err);
    });
  },
  render: function(){
    return D.div({
      className: "app"
    }, [
      D.h1({
        className: "app-header"
      }, "Hello " + this.state.me.name + "!"),
      D.img({
        className: "user-img",
        src: this.state.me.avatar_url
      }),
      D.h2({}, "Your Projects"),
      React.createElement(ProjectList, {
        projects: this.state.projects,
        me: this.state.me.login
      })
    ]);
  }
});

var init = function(doc){
  React.render(React.createElement(App, null), doc.getElementById("mainPopup"));
};
