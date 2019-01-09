
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
            // OVERRIDES
            didInsertElement: function() {
               var self = this;
               self._super();
               self._injectEditTraitsHtml();
            },
            // FUNCTIONS
            _injectEditTraitsHtml: function() {
               var self = this;
               var rootElement = self.$();

               var createEditTraitsButton = () => {
                  var i18n_text = i18n.t('stonehearth_beam:ui.shell.beam_roster.edit_traits');
                  var button = $(`<a href="#" id="edit_traits"><button>${i18n_text}</button></a>`);
                  button.on('click', () => self.showEditTraitsView());
                  return button;
               };
               rootElement.find('#traitDescriptions').append(createEditTraitsButton())
            },
            showEditTraitsView: function() {
               var self = this;
               if (self._editTraitsView) {
                  self._editTraitsView.destroy();
               }
               self._editTraitsView = App.shellView.addView(App.BeamTraitCustomizationView, { _citizen: self.selected, _citizenObjectId: self.selected.__self });
            }
      });

      App.StonehearthCitizenRosterEntryView.reopen({
         maxStatValue: 6,
         // OVERRIDES
         didInsertElement: function() {
               var self = this;
               self._super();
               self._injectCitizenStatHtml()
         },
         // FUNCTIONS
         _injectCitizenStatHtml: function() {
            var self = this;
            var rootElement = self.$();

            var createArrowButton = (operator, statType) => {
                  var arrow = $('<div />');
                  arrow.addClass(operator);
                  arrow.addClass('arrowButton');
                  arrow.on('click', () => self._changeCitizenStat(operator, statType));
                  return arrow;
            };

            rootElement.find('.stat').each((index, element) => {
                  element = $(element)
                  element.append(createArrowButton('decrement', element.attr('id')))
                  element.append(createArrowButton('increment', element.attr('id')))
            });
         },
         _hideArrow: function(operator, statType) {
            var self = this;
            self.$().find(`#${statType} .${operator}`).addClass('hidden');
         },
         _showArrow: function(operator, statType) {
            var self = this;
            self.$().find(`#${statType} .${operator}`).removeClass('hidden');
         },
         _changeCitizenStat: function(operator, statType) {
               var self = this;
               var oldValue = self.model['stonehearth:attributes'].attributes[statType].effective_value;
               var newValue = oldValue;
               if (operator == 'increment' && newValue < self.maxStatValue) {
                  if (oldValue == 1)
                     self._showArrow('decrement', statType);
                  newValue++;
               }
               else if (operator == 'decrement' && newValue > 1) {
                  if (oldValue == self.maxStatValue)
                     self._showArrow('increment', statType);
                  newValue--;
               }
               if (newValue == oldValue)
                  return;
               if (newValue == self.maxStatValue)
                  self._hideArrow(operator, statType);
               else if (newValue == 1)
                  self._hideArrow(operator, statType);

               radiant.call_obj('stonehearth_beam.stats_customization', 'change_stat_by_type_command', self._citizenObjectId, statType, newValue)
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
   components: {
      'stonehearth:traits' : {
         'traits': {
            '*' : {}
         }
      },
   },

   init: function() {
      this._super();
      var self = this;
   },

   didInsertElement: function () {
      var self = this;

      radiant.call_obj('stonehearth_beam.stats_customization', 'get_all_traits_command', self._citizenObjectId)
            .done(function(response) {
                  self.set('traits', response.all_traits);
                  console.log(response.test);
            })
            .fail(function(response) {
                  console.log('get_all_traits failed.', response);
            });
   },

   willDestroyElement: function () {
      var self = this;
   },

   actions: {
      save: function () {
         this.destroy();
      },
      cancel: function () {
         this.destroy();
      }
   },
});
