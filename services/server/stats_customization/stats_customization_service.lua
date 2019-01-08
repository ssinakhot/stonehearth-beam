--[[
   This service provides an api for updating entity's stats from the roster customization screen.
--]]

local validator = radiant.validator

local StatsCustomizationService = class()

function StatsCustomizationService:initialize()
end

-- Set the entity's stat using the given stat type 
function StatsCustomizationService:change_stat_by_type_command(session, response, entity, statType, value)
   validator.expect_argument_types({'Entity', 'string', 'number'}, entity, statType, value)
   validator.expect.num.positive(value)
   validator.expect.string.max_length(statType)

   local attributes = entity:get_component('stonehearth:attributes')
   attributes:set_attribute(statType, value)
   response:resolve({ citizen = entity })
end

function StatsCustomizationService:get_all_traits_command(session, response, entity)
   validator.expect_argument_types({'Entity'}, entity)
   local pop = stonehearth.population:get_population(session.player_id)
   local all_traits = {}
   for group_name, group in pairs(pop._traits.groups) do
        for trait_uri, trait in pairs(group) do
            trait = radiant.resources.load_json(trait_uri, true, true) 
            trait['i18n_data'] = {}
            trait['i18n_data']['entity_custom_name'] = radiant.entities.get_custom_name(entity) 
            trait['i18n_data']['entity_display_name'] = radiant.entities.get_display_name(entity)
            trait['uri'] = trait_uri
            table.insert(all_traits, trait)
        end
   end
   for trait_uri, trait in pairs(pop._traits.traits) do
        trait = radiant.resources.load_json(trait_uri, true, true)
        trait['i18n_data'] = {}
        trait['i18n_data']['entity_custom_name'] = radiant.entities.get_custom_name(entity) 
        trait['i18n_data']['entity_display_name'] = radiant.entities.get_display_name(entity)
        trait['uri'] = trait_uri
        table.insert(all_traits, trait)
   end
   response:resolve({ all_traits = all_traits })
end

function StatsCustomizationService:add_trait_command(session, response, entity, trait_uri)
    local traits = entity:get_component('stonehearth:traits')
    traits:add_trait(trait_uri)
    response:resolve({ citizen = entity })
end

function StatsCustomizationService:remove_trait_command(session, response, entity, trait_uri)
    local traits = entity:get_component('stonehearth:traits')
    traits:remove_trait(trait_uri)
    response:resolve({ citizen = entity })
end

return StatsCustomizationService
