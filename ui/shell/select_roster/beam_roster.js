
(function() {

   // Credit David Walsh (https://davidwalsh.name/javascript-debounce-function)

   // Returns a function, that, as long as it continues to be invoked, will not
   // be triggered. The function will be called after it stops being called for
   // N milliseconds. If `immediate` is passed, trigger the function on the
   // leading edge, instead of the trailing.
   function debounce(func, wait, immediate) {
      var timeout;

      return function executedFunction() {
         var context = this;
         var args = arguments;
            
         var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
         };

         var callNow = immediate && !timeout;
         
         clearTimeout(timeout);

         timeout = setTimeout(later, wait);
         
         if (callNow) func.apply(context, args);
      };
   };

   var injected = false;
   var inject = () => {
      if (injected) {
         return;
      }
      if (App.StonehearthSelectRosterView && App.StonehearthCitizenRosterEntryView)
         injected = true;
      else
         return;

      App.StonehearthSelectRosterView.reopen({
            cheatMode: false,
            // OVERRIDES
            didInsertElement: function() {
               var self = this;
               self._super();
               self._injectAddTraitsHtml();
               self._injectCheatModeCheckbox();
            },
            willDestroyElement: function() {
               var self = this;
               self.$().find('#cheatMode').tooltipster('destroy');
               self._super();
            },
            setSelectedCitizen: function(citizen, selectedView, selectedViewIndex) {
               var self = this;
               self._super(citizen, selectedView, selectedViewIndex);
               if (citizen) {
                  setTimeout(() => self._injectRemoveTraitHtml(), 100);
               }
            },
            // FUNCTIONS
            _injectCheatModeCheckbox: function() {
               var self = this;
               var rootElement = self.$();
               var createCheatModeCheckbox = () => {
                  var i18n_text = i18n.t('stonehearth_beam:ui.shell.beam_roster.cheat_mode_checkbox');
                  var label = $(`<label for="cheatModeCheckbox">${i18n_text}</label>`)
                  var checkbox = $('<input id="cheatModeCheckbox" type="checkbox" />')
                  checkbox.on('change', (event) => { self._onCheckboxChange(event); })
                  var section = $('<div id="cheatMode"/>');
                  section.append(checkbox);
                  section.append(label);
                  var cheatModeStr = 'stonehearth_beam:ui.shell.beam_roster.cheat_mode_tooltip';
                  section.tooltipster({ content : i18n.t(cheatModeStr) });
                  return section;
               }
                  
               rootElement.find('.gui').append(createCheatModeCheckbox());
            },
            _onCheckboxChange: function(event) {
               var self = this;
               self.cheatMode = event.target.checked;
               self.$().trigger('cheatModeUpdate');
            },
            _injectAddTraitsHtml: function() {
               var self = this;
               var rootElement = self.$();

               var createAddTraitsButton = () => {
                  var i18n_text = i18n.t('stonehearth_beam:ui.shell.beam_roster.add_traits');
                  var button = $(`<a href="#" id="add_traits"><button>${i18n_text}</button></a>`);
                  button.on('click', () => self._showAddTraitsView());
                  return button;
               };
               rootElement.find('.gui').append(createAddTraitsButton());
            },
            _showAddTraitsView: function() {
               var self = this;
               if (self._addTraitsView) {
                  self._addTraitsView.destroy();
               }
               self._addTraitsView = App.shellView.addView(App.BeamTraitCustomizationView, { _citizen: self.selected, _citizenObjectId: self.selected.__self, rosterView: self });
            },
            _injectRemoveTraitHtml: function() {
               var self = this;
               var rootElement = self.$();

               var createRemoveTraitButton = (trait_url) => {
                  var image = $('<div class="removeIcon"/>');
                  image.on('click', () => self._removeTrait(trait_url));
                  return image;
               };

               traitDescriptionElements = rootElement.find('.traitDescription');
               traitDescriptionElements.each((index, element) => {
                  element = $(element);
                  if (element.find('.removeIcon').length > 0)
                     return;
                  element.prepend(createRemoveTraitButton(element.attr('uri')));
               })
            },
            _removeTrait: function(trait_uri) {
               var self = this;
               radiant.call_obj('stonehearth_beam.stats_customization', 'remove_trait_command', self.selected.__self, trait_uri)
                  .done(function(response) {
                     setTimeout(() => self._injectRemoveTraitHtml(), 100);
                  })
                  .fail(function(response) {
                     console.log('get_all_traits failed.', response);
                  });
            }
      });

      App.StonehearthCitizenRosterEntryView.reopen({
         maxIndividualStatValue: 6,
         currentStatAmount: 36,
         maxStatAmount: 36,
         // OVERRIDES
         didInsertElement: function() {
            var self = this;
            self._super();
            self._injectCitizenStatHtml()
            self.rosterView.$().on('cheatModeUpdate', () => { self._onCheatModeUpdate()});
         },
         willDestroyElement: function() {
            var self = this;
            self.rosterView.$().off('cheatModeUpdate');
            self._super();
         },
         // FUNCTIONS
         _onCheatModeUpdate: function() {
            var self = this;
            self._updateArrowStatus();
            self._updateStatsTotalIndicator();
         },
         _citizenUpdate: function() {
            var self = this;
            var citizenData = self.get('model');
            if (self.$() && citizenData) {
               self._stat = {};
               self._stat['mind'] = citizenData['stonehearth:attributes'].attributes['mind'].value;
               self._stat['body'] = citizenData['stonehearth:attributes'].attributes['body'].value;
               self._stat['spirit'] = citizenData['stonehearth:attributes'].attributes['spirit'].value;
               self.maxStatAmount = self._stat['mind'] + self._stat['body'] + self._stat['spirit'];
               self.currentStatAmount = self.maxStatAmount;
               self._updateArrowStatus();
               self._updateStatsTotalIndicator();
            }
         }.observes('model'),
         _injectCitizenStatHtml: function() {
            var self = this;
            var cheatMode = self.rosterView.cheatMode;
            var rootElement = self.$();

            var createArrowButton = (operator, statType) => {
               var arrow = $('<div />');
               arrow.addClass(operator);
               arrow.addClass('arrowButton');
               if (!cheatMode && operator == 'increment')
                  arrow.addClass('hidden');
               arrow.on('click', () => self._changeCitizenStat(operator, statType));
               return arrow;
            };
            var createStatsTotalIndicator = () => {
               var statsTotalSection = $('<div class="statsTotal hidden"><div>Unspent Attributes: </div><div id="unspentPoints"/></div>') 
               return statsTotalSection;
            };

            rootElement.find('.stat').each((index, element) => {
                  element = $(element)
                  element.append(createArrowButton('decrement', element.attr('id')))
                  element.append(createArrowButton('increment', element.attr('id')))
            });

            rootElement.append(createStatsTotalIndicator())
         },
         _updateStatsTotalIndicator: function() {
            var self = this;
            var rootElement = self.$();
            var statsTotalSection = rootElement.find('.statsTotal');

            var unspentPoints = self.maxStatAmount - self.currentStatAmount;
            var unspentPointsEle = statsTotalSection.find('#unspentPoints');
            unspentPointsEle.html(unspentPoints)

            if (self.rosterView.cheatMode || unspentPoints <= 0) {
               statsTotalSection.addClass("hidden");
            }
            else {
               statsTotalSection.removeClass("hidden");
            }
         },
         _updateArrowStatus: function() {
            var self = this;
            var citizenData = self.get('model');
            if (self.$() && citizenData) {
               var attributes = ['mind', 'body', 'spirit'];
               for (var index = 0; index < attributes.length; index++) 
               {
                  var attrName = attributes[index];
                  var value = self._stat[attrName];
                  if (self._canDecrement(value)) 
                     self._showArrow('decrement', attrName);
                  else
                     self._hideArrow('decrement', attrName);
                  if (self.rosterView.cheatMode || self._canIncrement(value)) 
                     self._showArrow('increment', attrName);
                  else
                     self._hideArrow('increment', attrName);
               }
            }
            if (!self.rosterView.cheatMode && self.maxStatAmount == self.currentStatAmount) {
               self._hideArrow('increment', 'mind');
               self._hideArrow('increment', 'body');
               self._hideArrow('increment', 'spirit');
            }
         },
         _hideArrow: function(operator, statType) {
            var self = this;
            self.$().find(`#${statType} .${operator}`).addClass('hidden');
         },
         _showArrow: function(operator, statType) {
            var self = this;
            self.$().find(`#${statType} .${operator}`).removeClass('hidden');
         },
         _canIncrement: function(oldValue) {
            var self = this;
            if (!self.rosterView.cheatMode && oldValue >= self.maxIndividualStatValue)
               return false;
            return true;
         },
         _canDecrement: function(oldValue) {
            var self = this;
            if (oldValue == 1)
               return false;
            return true;
         },
         _changeCitizenStat: function(operator, statType) {
            var self = this;
            var changed = false;
            var oldValue = self._stat[statType];
            if (operator == 'increment' && self._canIncrement(oldValue)) {
               self._stat[statType]++;
               self.currentStatAmount++;
               changed = true;
            }
            else if (operator == 'decrement' && self._canDecrement(oldValue)) {
               self._stat[statType]--;
               self.currentStatAmount--;
               changed = true;
            }
            if (!changed)
               return;
            // trick the client into thinking it's updated
            Ember.set(self.get('model')['stonehearth:attributes'].attributes[statType], 'user_visible_value', self._stat[statType]);
            self._updateArrowStatus();
            self._updateStatsTotalIndicator();
            switch (statType) {
               case 'mind':
                  self._debounceUpdateMind(self._stat[statType])
                  break;
               case 'body':
                  self._debounceUpdateBody(self._stat[statType]);
                  break;
               case 'spirit':
                  self._debounceUpdateSpirit(self._stat[statType]);
                  break;
            }
         },
         _debounceUpdateMind: debounce(function(newValue) {
            var self = this;
            radiant.call_obj('stonehearth_beam.stats_customization', 'change_stat_by_type_command', self._citizenObjectId, 'mind', newValue)
               .done(function(response) {
               })
               .fail(function(response) {
                  console.log('change_stat_by_type failed.', response);
               });
         }),
         _debounceUpdateBody: debounce(function(newValue) {
            var self = this;
            radiant.call_obj('stonehearth_beam.stats_customization', 'change_stat_by_type_command', self._citizenObjectId, 'body', newValue)
               .done(function(response) {
               })
               .fail(function(response) {
                  console.log('change_stat_by_type failed.', response);
               });
         }),
         _debounceUpdateSpirit: debounce(function(newValue) {
            var self = this;
            radiant.call_obj('stonehearth_beam.stats_customization', 'change_stat_by_type_command', self._citizenObjectId, 'spirit', newValue)
               .done(function(response) {
               })
               .fail(function(response) {
                  console.log('change_stat_by_type failed.', response);
               });
         }),
      })
   }

   // run this on ready for hot_reload on the same roster screen
   // requires localhost:1338 to be open
   $(top).ready(function() {
      inject();
   });
   // run this on stonehearthReady to hook into a initial game load up
   $(top).on('stonehearthReady', function() {
      inject();
   });
})();
App.BeamTraitCustomizationView = App.View.extend({
   templateName: 'beamTraitCustomization',
   classNames: [],
   _citizen: null,
   _citizenObjectId: null,

   init: function() {
      var self = this;
      self._super();
   },

   didInsertElement: function () {
      var self = this;
      self._super();

      var compareByTraitName = (a, b) => {
         var nameA = i18n.t(a.display_name, a);
         var nameB = i18n.t(b.display_name, b);
         if (nameA < nameB)
            return -1;
         if (nameA > nameB)
            return 1;
         return 0;
      };

      radiant.call_obj('stonehearth_beam.stats_customization', 'get_all_traits_command', self._citizenObjectId)
            .done(function(response) {
               traits = response.all_traits;
               traits.sort(compareByTraitName);
               var currentTraitUris = Object.keys(self._citizen['stonehearth:traits'].traits);
               traits = traits.filter((t) => !currentTraitUris.includes(t.uri));
               self.set('traits', traits);
            })
            .fail(function(response) {
               console.log('get_all_traits failed.', response);
            });
   },

   willDestroyElement: function () {
      var self = this;
   },

   actions: {
      add_trait: function(trait_uri) {
         var self = this;
         radiant.call_obj('stonehearth_beam.stats_customization', 'add_trait_command', self._citizenObjectId, trait_uri)
            .done(function(response) {
               setTimeout(() => self.rosterView._injectRemoveTraitHtml(), 100);
               self.destroy();
            })
            .fail(function(response) {
               console.log('get_all_traits failed.', response);
            });
      },
      close: function () {
         this.destroy();
      }
   },
});
