/*global angular*/

/**
 * @ngdoc directive
 * @name TatUi.shared:header
 * @description
 * header
 */
angular.module('TatUi').component('header', {
  bindings: {
    topic: '='
  },
  controllerAs: 'ctrl',
  controller: function(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $localStorage,
    $cookieStore,
    Authentication,
    Linker,
    Plugin,
    TatEngine,
    TatEngineUserRsc,
    TatTopic
  ) {
    'use strict';
    var self = this;

    this.data = {
      showHeader: true,
      isPresencesOpen: false,
      viewsEnabled: false,
      isFavoriteTopic: false,
      isNotificationsOffTopic: false,
      topic: {},
      views: [],
      currentView: {}
    };

    self.togglePresences = function() {
      self.data.isPresencesOpen = !this.data.isPresencesOpen;
      $rootScope.$broadcast("presences-toggle", true);
    };

    $scope.$on('showSidebar', function(ev, showSidebar) {
      self.data.showHeader = showSidebar;
    });

    self.toggleTopicFavorite = function() {
      if (self.data.isFavoriteTopic) {
        TatEngineUserRsc.removeFavoriteTopic({
          'topic': self.data.topic.topic
        }).$promise.then(function(resp) {
          TatEngine.displayReturn(resp);
          self.data.isFavoriteTopic = false;
          $rootScope.$broadcast('sidebar-reload', true);
        });
      } else {
        TatEngineUserRsc.addFavoriteTopic({
          'topic': self.data.topic.topic
        }).$promise.then(function(resp) {
          TatEngine.displayReturn(resp);
          self.data.isFavoriteTopic = true;
          $rootScope.$broadcast('sidebar-reload', true);
        });
      }
    };

    self.toggleNotificationsTopic = function() {
      if (self.data.isNotificationsOffTopic) {
        TatEngineUserRsc.enableNotificationsTopic({
          'topic': self.data.topic.topic
        }).$promise.then(function(resp) {
          TatEngine.displayReturn(resp);
          self.data.isNotificationsOffTopic = false;
          Authentication.refreshIdentity();
        });
      } else {
        TatEngineUserRsc.disableNotificationsTopic({
          'topic': self.data.topic.topic
        }).$promise.then(function(resp) {
          TatEngine.displayReturn(resp);
          self.data.isNotificationsOffTopic = true;
          Authentication.refreshIdentity();
        });
      }
    };

    self.switchView = function(route) {
      if (!$localStorage.views) {
        $localStorage.views = {};
      }
      $localStorage.views[$stateParams.topic] = route;

      $state.go(route, {
        topic: $stateParams.topic
      }, {
        inherit: false,
        reload: false
      });
    };

    self.isMessagesView = function() {
      return Plugin.getPluginByRoute($state.current.name);
    };

    self.topicURL = function(sub, pos) {
      var t = "";
      for (var i = 0; i <= pos; i++) {
        t += "/" + self.data.subTitle[i];
      }
      return Linker.getComputedURL(t);
    };

    self.computeCurrent = function() {
      var p = Plugin.getPluginByRoute($state.current.name);
      if (p) {
        self.data.currentView = p;
        return;
      }
      self.data.currentView = $state.current;
      return;
    };

    self.isAdmin = function() {
      if (Authentication.isConnected()) {
        return Authentication.getIdentity().isAdmin;
      }
      return false;
    };

    this.isPluginViewRoute = function(route) {
      for (var i = 0; i < self.data.views.length; i++) {
        if (self.data.views[i].route == route) {
          return true;
        }
      }
      return false;
    };

    this.initNextForTopic = function() {
      self.data.topic = self.topic;
      self.data = angular.extend(self.data, TatTopic.getDataTopic());
      self.data.subTitle = self.data.topic.topic.split('/');
      self.data.subTitle.shift(); // remove first "/"

      var viewsPlugins = Plugin.getPluginsMessagesViews();
      if (viewsPlugins) {
        for (var k = 0; k < viewsPlugins.length; k++) {
          self.data.views.push(viewsPlugins[k]);
        }
      }

      self.data.favoriteTopics = Authentication.getIdentity().favoritesTopics;
      self.data.offNotificationsTopics = Authentication.getIdentity().offNotificationsTopics;
      self.data.isFavoriteTopic = false;
      self.data.isNotificationsOffTopic = false;
      if (!self.data.favoriteTopics) {
        self.data.favoriteTopics = [];
      }
      if (!self.data.offNotificationsTopics) {
        self.data.offNotificationsTopics = [];
      }
      for (var i = 0; i < self.data.favoriteTopics.length; i++) {
        if (self.data.favoriteTopics[i] === self.data.topic.topic) {
          self.data.isFavoriteTopic = true;
        }
      }
      for (var j = 0; j < self.data.offNotificationsTopics.length; j++) {
        if (self.data.offNotificationsTopics[j] === self.data.topic.topic) {
          self.data.isNotificationsOffTopic = true;
        }
      }

      var restrictedPlugin = Plugin.getPluginByRestriction(self.data.topic);

      if (restrictedPlugin) {
        self.data.viewsEnabled = false;
      } else {
        self.data.viewsEnabled = true;
      }

      if (restrictedPlugin && restrictedPlugin.route != $state.current.name) {
        $state.go(restrictedPlugin.route, {
          topic: self.data.topic
        }, {
          inherit: false,
          reload: false
        });
        return;
      }
    };

    self.init = function() {
      self.data.subTitle = "";
      self.data.topic = null;

      self.computeCurrent();

      if (self.topic) {
        self.initNextForTopic();
      }

      if (angular.isDefined($cookieStore.get("showSidebar"))) {
        self.data.showHeader = $cookieStore.get("showSidebar");
      } else {
        self.data.showHeader = true;
      }
    };

    self.init();
  },
  templateUrl: 'app/shared/header/header.component.html'
});
