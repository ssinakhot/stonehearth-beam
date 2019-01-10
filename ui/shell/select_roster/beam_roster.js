
(function() {
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
               rootElement.find('.gui').append(createAddTraitsButton())
            },
            _showAddTraitsView: function() {
               var self = this;
               if (self._addTraitsView) {
                  self._addTraitsView.destroy();
               }
               self._addTraitsView = App.shellView.addView(App.BeamTraitCustomizationView, { _citizen: self.selected, _citizenObjectId: self.selected.__self });
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
               var mindValue = citizenData['stonehearth:attributes'].attributes['mind'].value;
               var bodyValue = citizenData['stonehearth:attributes'].attributes['body'].value;
               var spiritValue = citizenData['stonehearth:attributes'].attributes['spirit'].value;
               self.maxStatAmount = mindValue + bodyValue + spiritValue;
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
                  var value = citizenData['stonehearth:attributes'].attributes[attrName].value;
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
               var oldValue = self.model['stonehearth:attributes'].attributes[statType].value;
               var newValue = oldValue;
               if (operator == 'increment' && self._canIncrement(oldValue)) {
                  newValue++;
                  self.currentStatAmount++;
               }
               else if (operator == 'decrement' && self._canDecrement(oldValue)) {
                  newValue--;
                  self.currentStatAmount--;
               }
               if (newValue == oldValue)
                  return;

               radiant.call_obj('stonehearth_beam.stats_customization', 'change_stat_by_type_command', self._citizenObjectId, statType, newValue)
                  .done(function(response) {
                     self._updateArrowStatus();
                     self._updateStatsTotalIndicator();
                  })
                  .fail(function(response) {
                     console.log('change_stat_by_type failed.', response);
                  });
            }
      });
   }
   // run this on ready for hot_reload on the same roster screen
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

      radiant.call_obj('stonehearth_beam.stats_customization', 'get_all_traits_command', self._citizenObjectId)
            .done(function(response) {
               traits = response.all_traits;
               traits.sort((a, b) => {
                  var nameA = i18n.t(a.display_name, a);
                  var nameB = i18n.t(b.display_name, b);
                  if (nameA < nameB)
                     return -1;
                  if (nameA > nameB)
                     return 1;
                  return 0;
               });
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
