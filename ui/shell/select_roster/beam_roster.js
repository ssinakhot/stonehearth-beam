$(top).on('stonehearthReady', function() {
    App.StonehearthCitizenRosterEntryView.reopen({
        maxStatValue: 6,
        // OVERRIDES
        didInsertElement: function() {
            var self = this;
            self._super();
            self._injectCitizenStatHtml()
        },
        click: function(e) {
            var self = this;
            self._super(e);
            if (!e.target || !$(e.target).hasClass('rerollCitizenDice')) {
               //App.shellView.addView(App.BeamTraitCustomizationView, { _citizen: self._citizenObjectId });
            }
        },
        // FUNCTIONS
        _injectCitizenStatHtml: function() {
           var self = this;
           var rootElement = self.$();
           var createArrowButton = (operator, statType) => {
               var arrow = $('<div />');
               arrow.addClass(operator);
               arrow.addClass('arrowButton');
               arrow.on('click', () => {
                  self._changeCitizenStat(operator, statType);
               });
               return arrow;
           };
           rootElement.find('.stat').each((index, element) => {
               element = $(element)
               element.append(createArrowButton('decrement', element.attr('id')))
               element.append(createArrowButton('increment', element.attr('id')))
           });
           console.log(self);
        },
        _changeCitizenStat: function(operator, statType) {
            var self = this;
            var oldValue = self.model['stonehearth:attributes'].attributes[statType].effective_value;
            var newValue = oldValue;
            if (operator == 'increment' && newValue < self.maxStatValue)
               newValue++;
            else if (operator == 'decrement' && newValue > self.maxStatValue)
               newValue--;
            if (newValue == oldValue)
               return;

            radiant.call_obj('stonehearth_beam.stats_customization', 'change_stat_by_type_command', self._citizenObjectId, statType, newValue)
               .fail(function(response) {
                  console.log('change_stat_by_type failed.', response);
               });
         }
    });
});

App.BeamTraitCustomizationView = App.View.extend({
   templateName: 'beamTraitCustomization',
   classNames: [],
   _citizen: null,
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

      radiant.call_obj('stonehearth_beam.stats_customization', 'get_all_traits_command', self._citizen)
            .done(function(response) {
                  self.set('traits', response.all_traits);
            })
            .fail(function(response) {
                  console.log('get_all_traits failed.', response);
            });
   },

   willDestroyElement: function () {
      var self = this;
   },

   actions: {
      delete: function () {
      },
      select: function () {
      },
      cancel: function () {
      }
   },
});
