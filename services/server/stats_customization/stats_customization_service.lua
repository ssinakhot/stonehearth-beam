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

return StatsCustomizationService
