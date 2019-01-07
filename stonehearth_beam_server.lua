stonehearth_beam = {
}

local service_creation_order = {
    { stats_customization = 'stonehearth_beam.services.server.stats_customization.stats_customization_service' },
}

function stonehearth_beam:_on_init() 
    stonehearth_beam._sv = stonehearth_beam.__saved_variables:get_data()
    radiant.service_creator.create_services(stonehearth_beam, 'stonehearth_beam', service_creation_order)
    radiant.log.write('stonehearth_beam', 0, 'Server initialized')
end

radiant.events.listen(stonehearth_beam, 'radiant:init', stonehearth_beam, stonehearth_beam._on_init)

return stonehearth_beam
