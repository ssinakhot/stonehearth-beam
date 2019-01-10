App.BeamTraitItemView = App.View.extend({
   classNames: ['inlineBlock'],

   components: {
      'i18n_data': {}
   },

   didInsertElement: function() { 
      var self = this;
      self._super();
      Ember.run.scheduleOnce('afterRender', self, '_updateTraitData');
   },

   willDestroyElement: function() {
      var self = this;
      self._super();
   },

   _updateTraitData: function() {
      var self = this;

      console.log(self);
      var trait = self.get('context');
      if (!trait) {
         return;
      }

      self._updateTraitDescription();
   },

   _updateTraitDescription() {
      var self = this;

      var trait = self.get('context');

      var args = {
         i18n_data : trait.i18n_data
      };

      if (self.$('.traitDescription').length) {
         self.$('.displayName').text(i18n.t(trait.display_name, args));
         self.$('.description').text(i18n.t(trait.description, args));
      }
   },
});
