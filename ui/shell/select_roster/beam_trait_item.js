App.BeamTraitItemView = App.View.extend({
   classNames: ['inlineBlock'],

   components: {
      'i18n_data': {}
   },

   didInsertElement: function() { 
      var self = this;
      this._super();
      Ember.run.scheduleOnce('afterRender', this, '_updateTraitData');
   },

   willDestroyElement: function() {
      this.$().find('.tooltipstered').tooltipster('destroy');
   },

   _updateTraitData: function() {
      var self = this;

      var trait = self.get('context');
      if (!trait) {
         return;
      }


      self._updateTraitDescription();
      self._updateTraitTooltip();

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

   _updateTraitTooltip: function() {
      var self = this;

      var trait = self.get('context');

      if (self.$('.item').length) {
         var args = {
            i18n_data : trait.i18n_data
         };
         var tooltip = App.tooltipHelper.createTooltip(i18n.t(trait.display_name, args), Ember.Handlebars.Utils.escapeExpression(i18n.t(trait.description, args)));

         self.$('.item').tooltipster();
         self.$('.item').tooltipster('content', $(tooltip));
      }
   }
});
